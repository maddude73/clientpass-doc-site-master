#!/usr/bin/env python3
"""
Real-World Redis Functionality Test
Tests actual agent event processing with Redis Streams
"""

import asyncio
import sys
from pathlib import Path

# Add automation directory to path
sys.path.insert(0, str(Path(__file__).parent))

from agents.rag_management_agent import RAGManagementAgent
from redis_event_bus import event_bus_proxy
from events import EventType
from loguru import logger

async def test_real_agent_events():
    """Test real agent event processing with Redis"""
    print("🧪 Real-World Redis Agent Event Test")
    print("=" * 50)
    
    # Initialize Redis event bus
    await event_bus_proxy.initialize()
    status = event_bus_proxy.get_status()
    print(f"📊 Event bus: {status['type']} (Redis available: {status['redis_available']})")
    
    # Create and start RAG agent
    agent = RAGManagementAgent()
    print(f"✅ Created agent: {agent.name}")
    
    # Initialize agent (this sets up Redis subscriptions)
    await agent.initialize()
    
    # Test event publishing from agent
    print("\n📤 Testing agent event publishing...")
    
    # Publish events that the agent would normally publish
    await agent.publish_event(EventType.SYSTEM_STATUS, {
        "agent": agent.name,
        "status": "operational", 
        "timestamp": "2025-12-13T22:00:00"
    })
    print("✅ Agent published SYSTEM_STATUS event")
    
    await agent.publish_event(EventType.HEALTH_CHECK, {
        "agent": agent.name,
        "health": "healthy",
        "metrics": agent.get_status()
    })
    print("✅ Agent published HEALTH_CHECK event")
    
    # Test multiple rapid events (stress test)
    print("\n🚀 Testing rapid event publishing...")
    for i in range(5):
        await agent.publish_event(EventType.PROCESS_COMPLETE, {
            "process_id": f"test_process_{i}",
            "status": "completed",
            "data": {"iteration": i}
        })
        print(f"  📨 Published process_complete_{i}")
    
    # Verify events were published by checking Redis directly
    print("\n🔍 Verifying events in Redis...")
    
    from redis_event_bus import redis_event_bus
    
    # Check stream information
    system_status_info = redis_event_bus.get_stream_info(EventType.SYSTEM_STATUS)
    health_check_info = redis_event_bus.get_stream_info(EventType.HEALTH_CHECK)  
    process_complete_info = redis_event_bus.get_stream_info(EventType.PROCESS_COMPLETE)
    
    print(f"📊 SYSTEM_STATUS stream: {system_status_info.get('length', 0)} messages")
    print(f"📊 HEALTH_CHECK stream: {health_check_info.get('length', 0)} messages")
    print(f"📊 PROCESS_COMPLETE stream: {process_complete_info.get('length', 0)} messages")
    
    # Verify we have the expected messages
    total_new_messages = (
        system_status_info.get('length', 0) + 
        health_check_info.get('length', 0) + 
        process_complete_info.get('length', 0)
    )
    
    expected_messages = 7  # 1 system_status + 1 health_check + 5 process_complete
    
    print(f"\n📈 Total messages in Redis: {total_new_messages}")
    print(f"📋 Expected new messages: {expected_messages}")
    
    # Cleanup
    await agent.cleanup()
    print("✅ Agent cleanup completed")
    
    # Final assessment
    if total_new_messages >= expected_messages:
        print("\n🎉 REAL-WORLD REDIS TEST PASSED!")
        print("✅ Agent can publish events to Redis Streams")
        print("✅ Redis Streams are persisting messages correctly")
        print("✅ Multiple event types working simultaneously")
        return True
    else:
        print("\n❌ Real-world Redis test FAILED")
        print(f"Expected at least {expected_messages} messages, got {total_new_messages}")
        return False

async def test_cross_agent_communication():
    """Test communication between multiple agents via Redis"""
    print("\n🔄 Testing Cross-Agent Communication")
    print("=" * 50)
    
    # Track received events and consumer tasks
    received_events = []
    consumer_tasks = []
    
    async def event_monitor(message):
        """Monitor events from other agents"""
        received_events.append({
            'type': getattr(message, 'type', 'unknown'),
            'source': getattr(message, 'source', 'unknown'),
            'data': getattr(message, 'data', {}),
            'timestamp': getattr(message, 'timestamp', None)
        })
        print(f"📨 Monitored event: {message.type} from {message.source}")
    
    # Subscribe to events but don't auto-start
    from redis_event_bus import redis_event_bus
    consumer = redis_event_bus.subscribe(
        EventType.SYSTEM_STATUS, 
        event_monitor,
        consumer_group="monitor_group",
        consumer_name="event_monitor"
    )
    
    # Manually start consumer task so we can track it
    consumer_task = asyncio.create_task(consumer.consume())
    consumer_tasks.append(consumer_task)
    
    await asyncio.sleep(0.5)  # Let consumer start
    
    # Create two agents
    agent1 = RAGManagementAgent()
    agent1.name = "TestAgent1"
    
    agent2 = RAGManagementAgent() 
    agent2.name = "TestAgent2"
    
    await agent1.initialize()
    await agent2.initialize()
    
    # Have agents publish events
    await agent1.publish_event(EventType.SYSTEM_STATUS, {"message": "Hello from Agent1"})
    await agent2.publish_event(EventType.SYSTEM_STATUS, {"message": "Hello from Agent2"})
    
    # Wait for cross-communication
    await asyncio.sleep(2)
    
    # Stop monitoring consumer
    consumer.stop()
    
    # Cancel consumer tasks
    for task in consumer_tasks:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass
    
    # Cleanup agents
    await agent1.cleanup()
    await agent2.cleanup()
    
    # Check results
    print(f"📊 Received {len(received_events)} cross-agent events")
    
    if len(received_events) >= 2:
        print("✅ Cross-agent communication test PASSED")
        return True
    else:
        print("❌ Cross-agent communication test FAILED")
        return False

async def main():
    """Run real-world Redis functionality tests"""
    print("🔬 Real-World Redis Functionality Verification")
    print("=" * 60)
    
    tests = [
        ("Real Agent Events", test_real_agent_events),
        ("Cross-Agent Communication", test_cross_agent_communication),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = await test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} failed: {e}")
            import traceback
            traceback.print_exc()
            results.append((test_name, False))
    
    # Summary
    print(f"\n{'=' * 60}")
    print("🎯 REAL-WORLD TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status} {test_name}")
    
    print(f"\n📊 Results: {passed}/{total} ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("\n🎉 REDIS STREAMS FULLY FUNCTIONAL!")
        print("🚀 Real agent event processing confirmed working!")
    else:
        print("\n⚠️ Redis functionality issues detected")
    
    # Cancel any remaining tasks to ensure clean shutdown
    tasks = [task for task in asyncio.all_tasks() if not task.done()]
    if tasks:
        print(f"🧹 Cleaning up {len(tasks)} remaining tasks...")
        for task in tasks:
            task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)

if __name__ == "__main__":
    asyncio.run(main())