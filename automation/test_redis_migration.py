#!/usr/bin/env python3
"""
Redis Streams Migration Test
Tests Redis setup and demonstrates gradual migration from custom event system
"""

import asyncio
import sys
import time
from pathlib import Path

# Add automation directory to path
sys.path.insert(0, str(Path(__file__).parent))

from redis_event_bus import redis_event_bus, event_bus_proxy, StreamMessage
from events import EventType
from config import config
from loguru import logger

class RedisTestAgent:
    """Test agent to verify Redis Streams functionality"""
    
    def __init__(self, name: str):
        self.name = name
        self.messages_received = []
        self.running = False
        
    async def handle_test_event(self, message: StreamMessage):
        """Handle test events"""
        logger.info(f"Agent {self.name} received: {message.type} from {message.source}")
        self.messages_received.append({
            'id': message.id,
            'type': message.type, 
            'source': message.source,
            'data': message.data,
            'timestamp': message.timestamp
        })
        
    async def handle_health_check(self, message: StreamMessage):
        """Handle health check events"""
        logger.info(f"Agent {self.name} health check: {message.data}")
        
        # Respond with health status
        await redis_event_bus.publish(
            EventType.SYSTEM_STATUS,
            self.name,
            {
                'status': 'healthy',
                'messages_processed': len(self.messages_received),
                'uptime': time.time() - getattr(self, 'start_time', time.time())
            }
        )

async def test_redis_connection():
    """Test basic Redis connection"""
    print("🔍 Testing Redis Connection...")
    
    try:
        success = await redis_event_bus.initialize()
        if success:
            print("✅ Redis connection successful")
            return True
        else:
            print("❌ Redis connection failed")
            return False
    except Exception as e:
        print(f"❌ Redis connection error: {e}")
        return False

async def test_basic_pub_sub():
    """Test basic publish/subscribe functionality"""
    print("\n🔍 Testing Basic Pub/Sub...")
    
    # Create test agent
    agent = RedisTestAgent("test_agent_1")
    
    # Subscribe to test events
    consumer = redis_event_bus.subscribe(
        EventType.SYSTEM_STATUS,
        agent.handle_test_event,
        consumer_group="test_group",
        consumer_name="test_consumer_1"
    )
    
    # Start consuming in background
    consume_task = asyncio.create_task(consumer.consume())
    
    # Give consumer time to start
    await asyncio.sleep(0.5)
    
    # Publish test events
    test_messages = [
        {"action": "test_1", "value": 42},
        {"action": "test_2", "value": "hello"},
        {"action": "test_3", "value": [1, 2, 3]}
    ]
    
    for i, msg_data in enumerate(test_messages):
        await redis_event_bus.publish(
            EventType.SYSTEM_STATUS,
            f"test_publisher_{i}",
            msg_data
        )
        print(f"  📤 Published test message {i+1}: {msg_data}")
    
    # Wait for processing
    await asyncio.sleep(2)
    
    # Stop consuming
    consumer.stop()
    consume_task.cancel()
    
    # Check results
    received_count = len(agent.messages_received)
    expected_count = len(test_messages)
    
    if received_count == expected_count:
        print(f"✅ Received all {received_count} messages")
        return True
    else:
        print(f"❌ Expected {expected_count} messages, received {received_count}")
        return False

async def test_multiple_consumers():
    """Test multiple consumers on same stream"""
    print("\n🔍 Testing Multiple Consumers...")
    
    # Create multiple agents
    agents = [RedisTestAgent(f"agent_{i}") for i in range(3)]
    consumers = []
    
    # Subscribe each agent to the same event type but different consumer names
    for i, agent in enumerate(agents):
        consumer = redis_event_bus.subscribe(
            EventType.HEALTH_CHECK,
            agent.handle_health_check,
            consumer_group="multi_test_group",
            consumer_name=f"consumer_{i}"
        )
        consumers.append(consumer)
        agent.start_time = time.time()
    
    # Start all consumers
    consume_tasks = [asyncio.create_task(consumer.consume()) for consumer in consumers]
    
    await asyncio.sleep(0.5)
    
    # Publish health check messages
    for i in range(6):  # More messages than consumers to test load balancing
        await redis_event_bus.publish(
            EventType.HEALTH_CHECK,
            "health_monitor",
            {"check_id": i, "timestamp": time.time()}
        )
        print(f"  📤 Published health check {i}")
    
    # Wait for processing
    await asyncio.sleep(3)
    
    # Stop all consumers
    for consumer in consumers:
        consumer.stop()
    for task in consume_tasks:
        task.cancel()
    
    # Check distribution
    total_received = sum(len(agent.messages_received) for agent in agents)
    print(f"  📊 Total messages distributed: {total_received}")
    
    for i, agent in enumerate(agents):
        count = len(agent.messages_received)
        print(f"  📊 Agent {i} received: {count} messages")
    
    if total_received >= 6:  # Should receive at least the messages we sent
        print("✅ Multiple consumer test passed")
        return True
    else:
        print("❌ Multiple consumer test failed")
        return False

async def test_error_handling_and_retry():
    """Test error handling and retry mechanisms"""
    print("\n🔍 Testing Error Handling and Retry...")
    
    error_count = 0
    
    async def failing_handler(message: StreamMessage):
        nonlocal error_count
        error_count += 1
        
        if error_count <= 2:  # Fail first 2 attempts
            print(f"  💥 Simulated error on attempt {error_count}")
            raise Exception(f"Simulated failure {error_count}")
        else:
            print(f"  ✅ Success on attempt {error_count}")
            return True
    
    # Subscribe with failing handler
    consumer = redis_event_bus.subscribe(
        EventType.ERROR,
        failing_handler,
        consumer_group="error_test_group",
        consumer_name="error_consumer"
    )
    
    consume_task = asyncio.create_task(consumer.consume())
    await asyncio.sleep(0.5)
    
    # Publish test message that will initially fail
    await redis_event_bus.publish(
        EventType.ERROR,
        "error_test",
        {"test": "retry_mechanism"}
    )
    
    # Wait for retries
    await asyncio.sleep(10)  # Give time for retries with exponential backoff
    
    consumer.stop()
    consume_task.cancel()
    
    if error_count >= 3:  # Should have tried at least 3 times
        print("✅ Error handling and retry test passed")
        return True
    else:
        print(f"❌ Error handling test failed - only {error_count} attempts")
        return False

async def test_stream_info():
    """Test stream information retrieval"""
    print("\n🔍 Testing Stream Information...")
    
    # Publish some test data
    for i in range(5):
        await redis_event_bus.publish(
            EventType.DOCUMENT_CREATED,
            "info_test",
            {"doc_id": i}
        )
    
    # Get stream info
    info = redis_event_bus.get_stream_info(EventType.DOCUMENT_CREATED)
    
    print(f"  📊 Stream info: {info}")
    
    if info.get('length', 0) >= 5:
        print("✅ Stream info test passed")
        return True
    else:
        print("❌ Stream info test failed")
        return False

async def test_proxy_fallback():
    """Test the proxy fallback mechanism"""
    print("\n🔍 Testing Event Bus Proxy Fallback...")
    
    # Initialize proxy
    await event_bus_proxy.initialize()
    status = event_bus_proxy.get_status()
    
    print(f"  📊 Proxy status: {status}")
    
    # Test proxy publishing
    messages_received = []
    
    def test_handler(message):
        if hasattr(message, 'data'):
            # Redis StreamMessage
            messages_received.append(message.data)
        elif hasattr(message, 'type'):
            # Custom Event object
            messages_received.append(message.data)
        else:
            # Direct data
            messages_received.append(message)
    
    # Subscribe through proxy
    if status['type'] == 'redis':
        event_bus_proxy.subscribe(EventType.PROCESS_COMPLETE, test_handler)
    else:
        from events import event_bus
        event_bus.subscribe(EventType.PROCESS_COMPLETE, test_handler)
    
    await asyncio.sleep(0.5)
    
    # Publish through proxy
    await event_bus_proxy.publish(
        EventType.PROCESS_COMPLETE,
        "proxy_test",
        {"proxy_test": True}
    )
    
    await asyncio.sleep(2)
    
    if len(messages_received) > 0:
        print(f"✅ Proxy test passed - using {status['type']} backend")
        return True
    else:
        print("❌ Proxy test failed")
        return False

async def main():
    """Run all Redis migration tests"""
    print("🚀 Redis Streams Migration Tests")
    print("=" * 50)
    
    tests = [
        ("Redis Connection", test_redis_connection),
        ("Basic Pub/Sub", test_basic_pub_sub), 
        ("Multiple Consumers", test_multiple_consumers),
        ("Error Handling & Retry", test_error_handling_and_retry),
        ("Stream Information", test_stream_info),
        ("Proxy Fallback", test_proxy_fallback)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            print(f"\n{'=' * 20}")
            result = await test_func()
            results.append((test_name, result))
            
        except Exception as e:
            print(f"❌ {test_name} failed with error: {e}")
            results.append((test_name, False))
        
        await asyncio.sleep(1)  # Brief pause between tests
    
    # Summary
    print(f"\n{'=' * 50}")
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status} {test_name}")
    
    print(f"\n🎯 Results: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("\n🎉 All tests passed! Redis Streams ready for production.")
        return True
    else:
        print(f"\n⚠️ {total - passed} tests failed. Review Redis configuration.")
        return False

if __name__ == "__main__":
    asyncio.run(main())