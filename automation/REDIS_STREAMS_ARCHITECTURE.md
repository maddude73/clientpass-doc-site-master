# Redis Streams Architecture Proposal

## Problem Statement

Current custom event system has reliability issues:

- ❌ No persistence (events lost on crash)
- ❌ No delivery guarantees
- ❌ Memory-only (single point of failure)
- ❌ No replay capability
- ❌ Limited error handling

## Proposed Solution: Redis Streams

### Why Redis Streams over Kafka?

| Feature                    | Custom System  | Redis Streams      | Kafka             |
| -------------------------- | -------------- | ------------------ | ----------------- |
| **Persistence**            | ❌             | ✅                 | ✅                |
| **Delivery Guarantees**    | ❌             | ✅                 | ✅                |
| **Replay**                 | ❌             | ✅                 | ✅                |
| **Operational Complexity** | Low            | Low                | High              |
| **Infrastructure**         | None           | Redis only         | Zookeeper + Kafka |
| **Scale**                  | Single process | Multiple processes | Enterprise        |
| **Setup Time**             | 0              | 30 mins            | 2+ hours          |

### Implementation Plan

#### Phase 1: Redis Setup (1 day)

```bash
# Install Redis
brew install redis  # macOS
sudo apt install redis-server  # Ubuntu

# Start Redis
redis-server --port 6379
```

#### Phase 2: Enhanced Event System (2 days)

```python
# New event_bus.py with Redis Streams
import redis
import json
from typing import Dict, List, Any
from dataclasses import asdict

class RedisEventBus:
    def __init__(self, redis_url="redis://localhost:6379"):
        self.redis = redis.Redis.from_url(redis_url)
        self.streams = {}  # Stream names

    async def publish(self, event_type: EventType, source: str, data: Dict[str, Any]):
        """Publish event to Redis Stream"""
        stream_name = f"events:{event_type.value}"

        event_data = {
            'type': event_type.value,
            'source': source,
            'data': json.dumps(data),
            'timestamp': datetime.now().isoformat()
        }

        # Add to Redis Stream with auto-generated ID
        message_id = self.redis.xadd(stream_name, event_data)
        logger.info(f"Published {event_type.value} to stream {stream_name}: {message_id}")

    def subscribe_to_stream(self, event_type: EventType, consumer_group: str, consumer_name: str):
        """Subscribe to event stream with consumer group"""
        stream_name = f"events:{event_type.value}"

        # Create consumer group if it doesn't exist
        try:
            self.redis.xgroup_create(stream_name, consumer_group, id='0', mkstream=True)
        except redis.exceptions.ResponseError as e:
            if "BUSYGROUP" not in str(e):
                raise

        return EventStreamConsumer(self.redis, stream_name, consumer_group, consumer_name)

class EventStreamConsumer:
    def __init__(self, redis_client, stream_name, group_name, consumer_name):
        self.redis = redis_client
        self.stream_name = stream_name
        self.group_name = group_name
        self.consumer_name = consumer_name

    async def consume_events(self, handler_func):
        """Consume events with automatic retry and dead letter handling"""
        while True:
            try:
                # Read pending messages first
                pending = self.redis.xreadgroup(
                    self.group_name,
                    self.consumer_name,
                    {self.stream_name: '>'},
                    count=10,
                    block=1000
                )

                for stream, messages in pending:
                    for message_id, fields in messages:
                        try:
                            # Process message
                            event_data = {k.decode(): v.decode() for k, v in fields.items()}
                            await handler_func(event_data)

                            # Acknowledge successful processing
                            self.redis.xack(self.stream_name, self.group_name, message_id)

                        except Exception as e:
                            logger.error(f"Error processing message {message_id}: {e}")
                            # Move to dead letter stream after max retries
                            self._handle_failed_message(message_id, fields, e)

            except Exception as e:
                logger.error(f"Consumer error: {e}")
                await asyncio.sleep(5)  # Back off on error

    def _handle_failed_message(self, message_id, fields, error):
        """Handle failed message processing"""
        dead_letter_stream = f"{self.stream_name}:dead_letter"

        # Add error context
        error_fields = dict(fields)
        error_fields[b'error'] = str(error).encode()
        error_fields[b'failed_at'] = datetime.now().isoformat().encode()

        # Add to dead letter stream
        self.redis.xadd(dead_letter_stream, error_fields)

        # Acknowledge original message to remove from pending
        self.redis.xack(self.stream_name, self.group_name, message_id)
```

#### Phase 3: Agent Integration (1 day)

```python
# Updated base_agent.py
class BaseAgent(ABC):
    def __init__(self):
        self.event_bus = RedisEventBus()
        self.consumer = None

    async def initialize(self):
        # Subscribe to relevant events
        self.consumer = self.event_bus.subscribe_to_stream(
            EventType.HEALTH_CHECK,
            f"{self.name}_group",
            f"{self.name}_consumer"
        )

        # Start consuming in background
        asyncio.create_task(
            self.consumer.consume_events(self._handle_event)
        )

    async def _handle_event(self, event_data):
        """Process received event"""
        event_type = event_data.get('type')
        source = event_data.get('source')
        data = json.loads(event_data.get('data', '{}'))

        # Route to appropriate handler
        await self.process_event(event_type, data)
```

### Migration Strategy

#### Week 1: Setup & Testing

- Install Redis on development environment
- Implement Redis event bus alongside current system
- Test with single agent (ChangeDetectionAgent)

#### Week 2: Gradual Migration

- Migrate one agent at a time
- Run dual systems during transition
- Monitor for issues

#### Week 3: Full Migration

- Switch all agents to Redis Streams
- Remove custom event system code
- Production deployment

### Benefits Gained

1. **Persistence**: Events survive system restarts
2. **Reliability**: Guaranteed delivery with consumer groups
3. **Replay**: Reprocess events after fixes
4. **Monitoring**: Redis provides built-in metrics
5. **Dead Letter Queues**: Failed events don't disappear
6. **Horizontal Scaling**: Multiple instances can process events

### Operational Requirements

```bash
# Development
- Redis server (single instance)
- 128MB RAM minimum
- Standard Redis monitoring

# Production
- Redis Cluster (3+ nodes for HA)
- Monitoring (redis-exporter + Prometheus)
- Backup strategy for Redis data
```

### Alternative: Quick Fix (If no Redis infrastructure)

If you can't add Redis infrastructure immediately:

```python
# Enhanced custom system with SQLite persistence
class PersistentEventBus:
    def __init__(self, db_path="events.db"):
        self.db = sqlite3.connect(db_path)
        self._create_tables()

    def _create_tables(self):
        self.db.execute('''
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY,
                type TEXT,
                source TEXT,
                data TEXT,
                timestamp TEXT,
                processed BOOLEAN DEFAULT FALSE,
                retry_count INTEGER DEFAULT 0
            )
        ''')

    async def publish(self, event_type, source, data):
        # Store in SQLite
        self.db.execute(
            'INSERT INTO events (type, source, data, timestamp) VALUES (?, ?, ?, ?)',
            (event_type.value, source, json.dumps(data), datetime.now().isoformat())
        )
        self.db.commit()

        # Also publish to in-memory for immediate processing
        await self._notify_subscribers(event_type, source, data)
```

## Recommendation

**Start with Redis Streams** - it's the right balance of reliability and complexity for your system. The migration can be done incrementally without breaking existing functionality.

Your principle of "fix issues early" applies perfectly here - the custom event system is a hidden reliability risk that will cause production issues later.
