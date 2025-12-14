#!/usr/bin/env python3
"""
Comprehensive Redis Streams Functionality Test
Tests actual message publishing, consuming, and agent event handling
"""

import asyncio
import sys
import time
from pathlib import Path

# Add automation directory to path
sys.path.insert(0, str(Path(__file__).parent))

from redis_event_bus import event_bus_proxy
from events import EventType
from loguru import logger

class TestEventHandler:
    """Test handler to track received messages"""
    
    def __init__(self, name: str):
        self.name = name
        self.received_messages = []
        self.processing_times = []
    
    async def handle_event(self, message):
        """Handle incoming Redis Stream messages"""
        start_time = time.time()
        
        # Extract data based on message type
        if hasattr(message, 'data'):
            # Redis StreamMessage
            data = message.data
            event_type = message.type
            source = message.source
        else:
            # Fallback for other message formats
            data = message
            event_type = "unknown"
            source = "unknown"
        
        self.received_messages.append({
            'data': data,
            'type': event_type,
            'source': source,
            'timestamp': time.time(),
            'handler': self.name
        })
        
        processing_time = time.time() - start_time
        self.processing_times.append(processing_time)
        
        logger.info(f"Handler {self.name} received {event_type} from {source}: {data}")

async def test_redis_publish_consume_cycle():
    """Test complete publish/consume cycle"""
    print("🔄 Testing Redis Publish/Consume Cycle")
    print("=" * 50)
    
    # Initialize event bus
    await event_bus_proxy.initialize()
    status = event_bus_proxy.get_status()
    print(f"📊 Event bus status: {status}")
    
    if status['type'] != 'redis':
        print("❌ Redis not available, test cannot proceed")
        return False
    
    # Create test handlers
    handler1 = TestEventHandler("handler_1")
    handler2 = TestEventHandler("handler_2") 
    handler3 = TestEventHandler("handler_3")
    
    # Subscribe to different event types
    print("📡 Setting up subscribers...")
    
    # Multiple handlers for the same event type (load balancing test)
    consumer1 = event_bus_proxy.subscribe(EventType.SYSTEM_STATUS, handler1.handle_event,
                                        consumer_group="test_group", consumer_name="consumer_1")
    consumer2 = event_bus_proxy.subscribe(EventType.SYSTEM_STATUS, handler2.handle_event,
                                        consumer_group="test_group", consumer_name="consumer_2")
    
    # Single handler for different event type
    consumer3 = event_bus_proxy.subscribe(EventType.DOCUMENT_CREATED, handler3.handle_event,
                                        consumer_group="doc_group", consumer_name="doc_consumer")
    
    # Wait for consumers to be ready
    await asyncio.sleep(1)
    
    # Publish test messages
    print("📤 Publishing test messages...")
    
    test_messages = [
        (EventType.SYSTEM_STATUS, "test_publisher_1", {"message": "Test message 1", "id": 1}),
        (EventType.SYSTEM_STATUS, "test_publisher_2", {"message": "Test message 2", "id": 2}),
        (EventType.SYSTEM_STATUS, "test_publisher_3", {"message": "Test message 3", "id": 3}),
        (EventType.DOCUMENT_CREATED, "doc_publisher", {"document": "test.md", "action": "created"}),
        (EventType.SYSTEM_STATUS, "test_publisher_4", {"message": "Test message 4", "id": 4}),
    ]
    
    for event_type, source, data in test_messages:
        await event_bus_proxy.publish(event_type, source, data)
        print(f"  📨 Published {event_type.value} from {source}")
        await asyncio.sleep(0.1)  # Small delay between messages
    
    # Wait for message processing
    print("⏳ Waiting for message processing...")
    await asyncio.sleep(3)
    
    # Stop consumers
    if hasattr(consumer1, 'stop'): consumer1.stop()
    if hasattr(consumer2, 'stop'): consumer2.stop()
    if hasattr(consumer3, 'stop'): consumer3.stop()
    
    # Analyze results
    print("\n📊 Results Analysis:")
    print(f"Handler 1 received: {len(handler1.received_messages)} messages")
    print(f"Handler 2 received: {len(handler2.received_messages)} messages")
    print(f"Handler 3 received: {len(handler3.received_messages)} messages")
    
    total_system_status = len(handler1.received_messages) + len(handler2.received_messages)
    total_document_created = len(handler3.received_messages)
    
    print(f"Total SYSTEM_STATUS messages: {total_system_status} (expected: 4)")
    print(f"Total DOCUMENT_CREATED messages: {total_document_created} (expected: 1)")
    
    # Verify load balancing
    load_balanced = len(handler1.received_messages) > 0 and len(handler2.received_messages) > 0
    all_messages_received = total_system_status >= 4 and total_document_created >= 1
    
    if all_messages_received and load_balanced:
        print("✅ Publish/Consume cycle test PASSED")
        return True
    else:
        print("❌ Publish/Consume cycle test FAILED")
        return False

async def test_redis_persistence():
    """Test Redis message persistence"""
    print("\n💾 Testing Redis Message Persistence")
    print("=" * 50)
    
    # Publish messages without consumers
    print("📤 Publishing messages without active consumers...")
    
    persistence_messages = [
        (EventType.HEALTH_CHECK, "persistence_test", {"test": "persistence_1", "timestamp": time.time()}),
        (EventType.HEALTH_CHECK, "persistence_test", {"test": "persistence_2", "timestamp": time.time()}),
        (EventType.HEALTH_CHECK, "persistence_test", {"test": "persistence_3", "timestamp": time.time()}),
    ]
    
    for event_type, source, data in persistence_messages:
        await event_bus_proxy.publish(event_type, source, data)
        print(f"  📨 Published {event_type.value}: {data['test']}")
    
    # Wait a bit
    await asyncio.sleep(1)
    
    # Now create a consumer to read the persisted messages
    print("📡 Creating consumer to read persisted messages...")
    
    handler = TestEventHandler("persistence_handler")
    consumer = event_bus_proxy.subscribe(EventType.HEALTH_CHECK, handler.handle_event,
                                       consumer_group="persistence_group", consumer_name="persistence_consumer")
    
    # Wait for message consumption
    await asyncio.sleep(2)
    
    # Stop consumer
    if hasattr(consumer, 'stop'): consumer.stop()
    
    # Check results
    received_count = len(handler.received_messages)
    print(f"📊 Received {received_count} persisted messages (expected: 3)")
    
    if received_count >= 3:
        print("✅ Persistence test PASSED")
        return True
    else:
        print("❌ Persistence test FAILED")
        return False

async def test_redis_error_handling():
    """Test error handling in Redis consumers"""
    print("\n🚨 Testing Redis Error Handling")
    print("=" * 50)
    
    error_count = 0
    success_count = 0
    
    async def failing_handler(message):
        nonlocal error_count, success_count
        
        # Extract test data
        if hasattr(message, 'data') and isinstance(message.data, dict):
            should_fail = message.data.get('should_fail', False)
        else:
            should_fail = False
        
        if should_fail:
            error_count += 1
            print(f"  💥 Simulated error #{error_count}")
            raise Exception(f"Simulated error {error_count}")
        else:
            success_count += 1
            print(f"  ✅ Success #{success_count}")
    
    # Subscribe with error handler
    consumer = event_bus_proxy.subscribe(EventType.ERROR, failing_handler,
                                       consumer_group="error_group", consumer_name="error_consumer")
    
    await asyncio.sleep(0.5)
    
    # Publish mix of success and failure messages
    print("📤 Publishing messages that will succeed and fail...")
    
    error_messages = [
        (EventType.ERROR, "error_test", {"should_fail": False, "id": 1}),  # Success
        (EventType.ERROR, "error_test", {"should_fail": True, "id": 2}),   # Fail
        (EventType.ERROR, "error_test", {"should_fail": False, "id": 3}),  # Success
        (EventType.ERROR, "error_test", {"should_fail": True, "id": 4}),   # Fail
        (EventType.ERROR, "error_test", {"should_fail": False, "id": 5}),  # Success
    ]
    
    for event_type, source, data in error_messages:
        await event_bus_proxy.publish(event_type, source, data)
        await asyncio.sleep(0.2)
    
    # Wait for processing
    await asyncio.sleep(3)
    
    # Stop consumer
    if hasattr(consumer, 'stop'): consumer.stop()
    
    print(f"📊 Successful messages: {success_count}")
    print(f"📊 Error messages: {error_count}")
    
    if success_count >= 3 and error_count >= 2:
        print("✅ Error handling test PASSED")
        return True
    else:
        print("❌ Error handling test FAILED")
        return False

async def main():
    """Run comprehensive Redis functionality tests"""
    print("🧪 Comprehensive Redis Streams Functionality Test")
    print("=" * 60)
    
    tests = [
        ("Publish/Consume Cycle", test_redis_publish_consume_cycle),
        ("Message Persistence", test_redis_persistence),
        ("Error Handling", test_redis_error_handling),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = await test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            results.append((test_name, False))
        
        # Brief pause between tests
        await asyncio.sleep(1)
    
    # Final summary
    print(f"\n{'=' * 60}")
    print("🎯 COMPREHENSIVE TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status} {test_name}")
    
    print(f"\n📊 Results: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("\n🎉 ALL REDIS FUNCTIONALITY TESTS PASSED!")
        print("🚀 Redis Streams is fully operational and ready for production!")
        return True
    else:
        print(f"\n⚠️ {total - passed} tests failed. Redis functionality needs attention.")
        return False

if __name__ == "__main__":
    asyncio.run(main())