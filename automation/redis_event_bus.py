#!/usr/bin/env python3
"""
Redis Streams Event Bus System
Reliable, persistent event messaging for multi-agent communication
Replaces the unreliable custom event system
"""

import asyncio
import json
import time
import redis
from datetime import datetime
from typing import Dict, List, Callable, Any, Optional
from dataclasses import dataclass, asdict
from enum import Enum

class DateTimeEncoder(json.JSONEncoder):
    """JSON encoder that handles datetime objects"""
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)
from loguru import logger

# Import existing event types
from events import EventType, Event

@dataclass
class StreamMessage:
    """Represents a message from Redis Stream"""
    id: str
    type: str
    source: str
    data: Dict[str, Any]
    timestamp: str
    retry_count: int = 0

class RedisEventBus:
    """Redis Streams-based event bus with persistence and delivery guarantees"""
    
    def __init__(self, redis_url="redis://localhost:6379", max_retries=3):
        self.redis_url = redis_url
        self.max_retries = max_retries
        self.redis_client = None
        self.consumers: Dict[str, 'StreamConsumer'] = {}
        self.running = False
        
    async def initialize(self):
        """Initialize Redis connection"""
        try:
            self.redis_client = redis.Redis.from_url(self.redis_url, decode_responses=True)
            # Test connection
            self.redis_client.ping()
            logger.info(f"Redis connection established: {self.redis_url}")
            return True
        except Exception as e:
            logger.error(f"Redis connection failed: {e}")
            return False
    
    async def publish(self, event_type: EventType, source: str, data: Dict[str, Any] = None):
        """Publish event to Redis Stream with persistence"""
        if not self.redis_client:
            raise RuntimeError("Redis not initialized")
            
        if data is None:
            data = {}
            
        stream_name = f"events:{event_type.value}"
        
        event_data = {
            'type': event_type.value,
            'source': source,
            'data': json.dumps(data, cls=DateTimeEncoder),
            'timestamp': datetime.now().isoformat(),
            'retry_count': '0'
        }
        
        try:
            # Add to Redis Stream with auto-generated ID
            message_id = self.redis_client.xadd(stream_name, event_data)
            logger.info(f"Published {event_type.value} from {source} to stream {stream_name}: {message_id}")
            return message_id
            
        except Exception as e:
            logger.error(f"Failed to publish event {event_type.value}: {e}")
            raise
    
    def subscribe(self, event_type: EventType, handler: Callable, consumer_group: str = None, consumer_name: str = None):
        """Subscribe to event stream with consumer group for reliability"""
        if not self.redis_client:
            raise RuntimeError("Redis not initialized")
            
        stream_name = f"events:{event_type.value}"
        
        # Default consumer identifiers
        if not consumer_group:
            consumer_group = f"group_{event_type.value}"
        if not consumer_name:
            consumer_name = f"consumer_{int(time.time())}"
            
        # Create consumer group if it doesn't exist
        try:
            self.redis_client.xgroup_create(stream_name, consumer_group, id='0', mkstream=True)
            logger.info(f"Created consumer group {consumer_group} for stream {stream_name}")
        except redis.exceptions.ResponseError as e:
            if "BUSYGROUP" not in str(e):
                logger.error(f"Failed to create consumer group: {e}")
                raise
                
        # Create and start consumer
        consumer = StreamConsumer(
            self.redis_client,
            stream_name, 
            consumer_group,
            consumer_name,
            handler,
            max_retries=self.max_retries
        )
        
        consumer_key = f"{stream_name}:{consumer_group}:{consumer_name}"
        self.consumers[consumer_key] = consumer
        
        logger.info(f"Subscribed {consumer_name} to {stream_name} in group {consumer_group}")
        return consumer
        
    def unsubscribe(self, event_type: EventType, consumer_group: str, consumer_name: str):
        """Unsubscribe from event stream"""
        stream_name = f"events:{event_type.value}"
        consumer_key = f"{stream_name}:{consumer_group}:{consumer_name}"
        
        if consumer_key in self.consumers:
            consumer = self.consumers[consumer_key]
            consumer.stop()
            del self.consumers[consumer_key]
            logger.info(f"Unsubscribed {consumer_name} from {stream_name}")
    
    async def start_consuming(self):
        """Start all consumers"""
        self.running = True
        tasks = []
        
        for consumer in self.consumers.values():
            task = asyncio.create_task(consumer.consume())
            tasks.append(task)
            
        logger.info(f"Started {len(tasks)} stream consumers")
        
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
    
    def stop_consuming(self):
        """Stop all consumers"""
        self.running = False
        for consumer in self.consumers.values():
            consumer.stop()
        logger.info("Stopped all stream consumers")
    
    def get_stream_info(self, event_type: EventType) -> Dict[str, Any]:
        """Get information about a stream"""
        if not self.redis_client:
            return {}
            
        stream_name = f"events:{event_type.value}"
        
        try:
            info = self.redis_client.xinfo_stream(stream_name)
            groups = self.redis_client.xinfo_groups(stream_name)
            
            return {
                'stream': stream_name,
                'length': info.get('length', 0),
                'groups': len(groups),
                'last_generated_id': info.get('last-generated-id'),
                'consumer_groups': [g['name'] for g in groups]
            }
        except redis.exceptions.ResponseError:
            return {'stream': stream_name, 'exists': False}
    
    def get_dead_letter_messages(self, event_type: EventType, limit: int = 10) -> List[Dict]:
        """Get messages from dead letter queue"""
        if not self.redis_client:
            return []
            
        dead_letter_stream = f"events:{event_type.value}:dead_letter"
        
        try:
            messages = self.redis_client.xrevrange(dead_letter_stream, count=limit)
            return [
                {
                    'id': msg_id,
                    'data': dict(fields),
                    'stream': dead_letter_stream
                }
                for msg_id, fields in messages
            ]
        except redis.exceptions.ResponseError:
            return []

class StreamConsumer:
    """Consumes messages from a Redis Stream with retry and dead letter handling"""
    
    def __init__(self, redis_client, stream_name: str, group_name: str, consumer_name: str, 
                 handler: Callable, max_retries: int = 3):
        self.redis = redis_client
        self.stream_name = stream_name
        self.group_name = group_name
        self.consumer_name = consumer_name
        self.handler = handler
        self.max_retries = max_retries
        self.running = False
        self.dead_letter_stream = f"{stream_name}:dead_letter"
        
    async def consume(self):
        """Main consumption loop with error handling and retries"""
        self.running = True
        logger.info(f"Starting consumer {self.consumer_name} for stream {self.stream_name}")
        
        while self.running:
            try:
                # TODO: Fix pending message processing API compatibility
                # await self._process_pending_messages()
                
                # Read new messages
                await self._read_new_messages()
                
            except Exception as e:
                logger.error(f"Consumer {self.consumer_name} error: {e}")
                await asyncio.sleep(5)  # Back off on error
                
        logger.info(f"Consumer {self.consumer_name} stopped")
    
    async def _process_pending_messages(self):
        """Process pending (unacknowledged) messages"""
        try:
            # Get pending messages for this consumer group
            pending_info = self.redis.xpending_range(
                self.stream_name, self.group_name, 
                min='-', max='+', count=10
            )
            
            if pending_info:
                logger.info(f"Processing {len(pending_info)} pending messages")
                
                for pending in pending_info:
                    # pending format: [message_id, consumer_name, idle_time, delivery_count]
                    message_id = pending[0]
                    consumer_name = pending[1]
                    
                    # Only claim messages for this consumer
                    if consumer_name == self.consumer_name:
                        # Claim and process the message
                        claimed = self.redis.xclaim(
                            self.stream_name, self.group_name, self.consumer_name,
                            min_idle_time=60000,  # 1 minute
                            message_ids=[message_id]
                        )
                        
                        for msg_id, fields in claimed:
                            await self._process_message(msg_id, fields, is_retry=True)
                        
        except redis.exceptions.ResponseError as e:
            if "NOGROUP" in str(e):
                # Consumer group doesn't exist yet, skip pending processing
                pass
            else:
                logger.error(f"Error processing pending messages: {e}")
    
    async def _read_new_messages(self):
        """Read new messages from the stream"""
        if not self.running:
            return
            
        try:
            # Read new messages with shorter block time for faster shutdown
            messages = self.redis.xreadgroup(
                self.group_name, self.consumer_name,
                {self.stream_name: '>'},
                count=10,
                block=100  # Block for 100ms for faster shutdown response
            )
            
            for stream, msgs in messages:
                for message_id, fields in msgs:
                    await self._process_message(message_id, fields)
                    
        except redis.exceptions.ResponseError as e:
            if "NOGROUP" in str(e):
                logger.warning(f"Consumer group {self.group_name} not found")
            else:
                raise
    
    async def _process_message(self, message_id: str, fields: Dict, is_retry: bool = False):
        """Process a single message with error handling"""
        try:
            # Parse message data
            message_data = {k: v for k, v in fields.items()}
            
            # Convert to StreamMessage object
            stream_msg = StreamMessage(
                id=message_id,
                type=message_data.get('type', ''),
                source=message_data.get('source', ''),
                data=json.loads(message_data.get('data', '{}')),
                timestamp=message_data.get('timestamp', ''),
                retry_count=int(message_data.get('retry_count', 0))
            )
            
            logger.debug(f"Processing message {message_id}: {stream_msg.type}")
            
            # Call the handler
            if asyncio.iscoroutinefunction(self.handler):
                await self.handler(stream_msg)
            else:
                self.handler(stream_msg)
                
            # Acknowledge successful processing
            self.redis.xack(self.stream_name, self.group_name, message_id)
            logger.debug(f"Acknowledged message {message_id}")
            
        except Exception as e:
            logger.error(f"Error processing message {message_id}: {e}")
            await self._handle_failed_message(message_id, fields, e)
    
    async def _handle_failed_message(self, message_id: str, fields: Dict, error: Exception):
        """Handle failed message processing with retry logic"""
        try:
            retry_count = int(fields.get('retry_count', 0))
            
            if retry_count < self.max_retries:
                # Increment retry count and requeue
                fields['retry_count'] = str(retry_count + 1)
                fields['last_error'] = str(error)
                fields['failed_at'] = datetime.now().isoformat()
                
                # Add back to stream for retry (with delay)
                await asyncio.sleep(2 ** retry_count)  # Exponential backoff
                retry_id = self.redis.xadd(self.stream_name, fields)
                logger.warning(f"Requeued message for retry {retry_count + 1}: {retry_id}")
                
            else:
                # Max retries exceeded, move to dead letter queue
                fields['final_error'] = str(error)
                fields['dead_letter_at'] = datetime.now().isoformat()
                fields['original_id'] = message_id
                
                dead_id = self.redis.xadd(self.dead_letter_stream, fields)
                logger.error(f"Message {message_id} moved to dead letter queue: {dead_id}")
            
            # Acknowledge original message to remove from pending
            self.redis.xack(self.stream_name, self.group_name, message_id)
            
        except Exception as e:
            logger.error(f"Error handling failed message {message_id}: {e}")
    
    def stop(self):
        """Stop the consumer"""
        self.running = False

# Global Redis event bus instance
redis_event_bus = RedisEventBus()

# Compatibility layer for gradual migration
class EventBusProxy:
    """Proxy to gradually migrate from custom event bus to Redis"""
    
    def __init__(self):
        self.use_redis = False
        self.custom_bus = None
        
    async def initialize(self):
        """Try Redis first, fall back to custom system"""
        try:
            success = await redis_event_bus.initialize()
            if success:
                self.use_redis = True
                logger.info("Using Redis Streams event bus")
                return True
        except Exception as e:
            logger.warning(f"Redis not available, falling back to custom event bus: {e}")
            
        # Fall back to custom system
        from events import event_bus as custom_bus
        self.custom_bus = custom_bus
        self.use_redis = False
        logger.info("Using custom event bus (fallback)")
        return True
        
    async def publish(self, event_type: EventType, source: str, data: Dict[str, Any] = None):
        """Publish to Redis or custom system"""
        if self.use_redis:
            return await redis_event_bus.publish(event_type, source, data)
        else:
            return await self.custom_bus.publish(event_type, source, data)
            
    def subscribe(self, event_type: EventType, handler: Callable, **kwargs):
        """Subscribe to Redis or custom system"""
        if self.use_redis:
            consumer = redis_event_bus.subscribe(event_type, handler, **kwargs)
            # Start consuming in background for testing
            import asyncio
            asyncio.create_task(consumer.consume())
            return consumer
        else:
            return self.custom_bus.subscribe(event_type, handler)
    
    def get_status(self) -> Dict[str, Any]:
        """Get event bus status"""
        return {
            'type': 'redis' if self.use_redis else 'custom',
            'redis_available': self.use_redis,
            'initialized': True
        }

# Global proxy instance for gradual migration
event_bus_proxy = EventBusProxy()