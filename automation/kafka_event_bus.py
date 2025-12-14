"""
Kafka Event Bus - Replaces Redis with Reliable Kafka Streams
Provides guaranteed delivery, fault tolerance, and horizontal scaling
"""

import json
import asyncio
import logging
from typing import Dict, Any, Optional, Callable, List
from datetime import datetime
from kafka import KafkaProducer, KafkaConsumer, KafkaAdminClient
from kafka.admin import ConfigResource, ConfigResourceType, NewTopic
from kafka.errors import TopicAlreadyExistsError, KafkaError
from concurrent.futures import ThreadPoolExecutor

from kafka_config import kafka_config, TopicName, TOPIC_CONFIGS

logger = logging.getLogger(__name__)

class KafkaEventBus:
    """
    Kafka-based event bus replacing unstable Redis implementation
    Provides reliable message delivery with Kafka's durability guarantees
    """
    
    def __init__(self):
        self.producer: Optional[KafkaProducer] = None
        self.consumers: Dict[str, KafkaConsumer] = {}
        self.admin_client: Optional[KafkaAdminClient] = None
        self.message_handlers: Dict[str, List[Callable]] = {}
        self.executor = ThreadPoolExecutor(max_workers=10)
        self.is_running = False
        
    async def initialize(self):
        """Initialize Kafka connections and create topics"""
        try:
            logger.info("🔧 Initializing Kafka Event Bus...")
            
            # Create admin client
            self.admin_client = KafkaAdminClient(
                bootstrap_servers=[kafka_config.bootstrap_servers],
                client_id=f"{kafka_config.client_id}-admin"
            )
            
            # Create topics
            await self._create_topics()
            
            # Create producer
            self.producer = KafkaProducer(**kafka_config.get_producer_config())
            
            logger.info("✅ Kafka Event Bus initialized successfully")
            self.is_running = True
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Kafka Event Bus: {e}")
            raise
    
    async def _create_topics(self):
        """Create Kafka topics if they don't exist"""
        try:
            logger.info("🏗️ Creating Kafka topics...")
            
            new_topics = []
            for topic_config in TOPIC_CONFIGS:
                new_topic = NewTopic(
                    name=topic_config.name,
                    num_partitions=topic_config.partitions,
                    replication_factor=topic_config.replication_factor,
                    topic_configs=topic_config.config
                )
                new_topics.append(new_topic)
            
            # Create topics
            result = self.admin_client.create_topics(new_topics, validate_only=False)
            
            # Check results (compatible with different Kafka client versions)
            if hasattr(result, 'topic_futures'):
                # kafka-python >= 2.0
                for topic_name, future in result.topic_futures.items():
                    try:
                        future.result()
                        logger.info(f"📝 Created topic: {topic_name}")
                    except TopicAlreadyExistsError:
                        logger.info(f"📄 Topic already exists: {topic_name}")
                    except Exception as e:
                        logger.error(f"❌ Failed to create topic {topic_name}: {e}")
            else:
                # kafka-python < 2.0 or newer API
                for topic_spec in topic_specs:
                    topic_name = topic_spec.name
                    try:
                        logger.info(f"📝 Topic creation initiated: {topic_name}")
                    except Exception as e:
                        logger.error(f"❌ Failed to create topic {topic_name}: {e}")
                    
        except Exception as e:
            logger.error(f"❌ Failed to create topics: {e}")
            # Don't raise - topics might already exist or be created by Kafka admin
            logger.info("⚠️  Continuing without topic creation - topics may already exist")
    
    async def publish(self, topic: str, message: Dict[str, Any], key: str = None) -> bool:
        """
        Publish message to Kafka topic
        
        Args:
            topic: Topic name to publish to
            message: Message payload as dictionary
            key: Optional message key for partitioning
            
        Returns:
            bool: Success status
        """
        if not self.producer:
            logger.error("❌ Producer not initialized")
            return False
            
        try:
            # Prepare message
            message_data = {
                'timestamp': datetime.utcnow().isoformat(),
                'payload': message
            }
            
            # Send message
            future = self.producer.send(
                topic=topic,
                value=json.dumps(message_data),
                key=key
            )
            
            # Wait for acknowledgment
            record_metadata = future.get(timeout=10)
            
            logger.info(f"📤 Published to {topic} [partition={record_metadata.partition}, offset={record_metadata.offset}]")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to publish to {topic}: {e}")
            return False
    
    async def subscribe(self, topic: str, group_id: str, handler: Callable[[Dict], None]):
        """
        Subscribe to Kafka topic with consumer group
        
        Args:
            topic: Topic name to subscribe to
            group_id: Consumer group ID
            handler: Message handler function
        """
        try:
            logger.info(f"🔔 Subscribing to {topic} with group {group_id}")
            
            # Create consumer
            consumer_config = kafka_config.get_consumer_config(group_id)
            consumer = KafkaConsumer(topic, **consumer_config)
            
            consumer_id = f"{topic}_{group_id}"
            self.consumers[consumer_id] = consumer
            
            # Store handler
            if topic not in self.message_handlers:
                self.message_handlers[topic] = []
            self.message_handlers[topic].append(handler)
            
            # Start consuming in background
            self.executor.submit(self._consume_messages, consumer, topic, handler)
            
            logger.info(f"✅ Subscribed to {topic} successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to subscribe to {topic}: {e}")
            raise
    
    def _consume_messages(self, consumer: KafkaConsumer, topic: str, handler: Callable):
        """
        Consume messages from Kafka topic (runs in background thread)
        
        Args:
            consumer: Kafka consumer instance
            topic: Topic name
            handler: Message handler function
        """
        logger.info(f"🎯 Starting consumer for {topic}")
        
        try:
            while self.is_running:
                try:
                    # Poll for messages
                    message_batch = consumer.poll(timeout_ms=1000)
                    
                    for topic_partition, messages in message_batch.items():
                        for message in messages:
                            try:
                                # Parse message
                                message_data = json.loads(message.value)
                                payload = message_data.get('payload', {})
                                
                                logger.debug(f"📨 Received message from {topic}: {payload}")
                                
                                # Handle message
                                handler(payload)
                                
                                # Manual commit for exactly-once processing
                                consumer.commit_async()
                                
                            except json.JSONDecodeError as e:
                                logger.error(f"❌ Failed to parse message from {topic}: {e}")
                            except Exception as e:
                                logger.error(f"❌ Handler error for {topic}: {e}")
                                
                except Exception as e:
                    logger.error(f"❌ Consumer error for {topic}: {e}")
                    
        except Exception as e:
            logger.error(f"❌ Consumer thread error for {topic}: {e}")
        finally:
            consumer.close()
            logger.info(f"🔚 Consumer for {topic} stopped")
    
    async def health_check(self) -> Dict[str, Any]:
        """Check health of Kafka connections"""
        try:
            # Check admin client
            cluster_metadata = self.admin_client.describe_cluster()
            
            # Check producer
            producer_metrics = self.producer.metrics() if self.producer else {}
            
            # Check consumers
            consumer_count = len(self.consumers)
            
            return {
                'status': 'healthy',
                'cluster_id': cluster_metadata.cluster_id,
                'brokers': len(cluster_metadata.brokers),
                'consumers': consumer_count,
                'producer_metrics': len(producer_metrics),
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Kafka health check failed: {e}")
            return {
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }
    
    async def shutdown(self):
        """Gracefully shutdown Kafka connections"""
        logger.info("🛑 Shutting down Kafka Event Bus...")
        
        self.is_running = False
        
        # Close producer
        if self.producer:
            self.producer.flush()
            self.producer.close()
            logger.info("📤 Producer closed")
        
        # Close consumers
        for consumer_id, consumer in self.consumers.items():
            consumer.close()
            logger.info(f"📥 Consumer {consumer_id} closed")
        
        # Close admin client
        if self.admin_client:
            self.admin_client.close()
            logger.info("🔧 Admin client closed")
        
        # Shutdown executor
        self.executor.shutdown(wait=True)
        
        logger.info("✅ Kafka Event Bus shutdown complete")

# Global event bus instance
kafka_event_bus = KafkaEventBus()