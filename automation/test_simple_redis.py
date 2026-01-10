#!/usr/bin/env python3
"""
Simple Redis Test - Basic functionality verification
"""

import asyncio
import sys
import time
from pathlib import Path

# Add automation directory to path
sys.path.insert(0, str(Path(__file__).parent))

from redis_event_bus import redis_event_bus
from events import EventType
from loguru import logger

async def test_simple_redis():
    """Test just Redis connection and basic pub/sub"""
    print("🔍 Simple Redis Test")
    print("=" * 30)
    
    # Test connection
    success = await redis_event_bus.initialize()
    if not success:
        print("❌ Redis connection failed")
        return False
    
    print("✅ Redis connection successful")
    
    # Test simple publish
    try:
        await redis_event_bus.publish(
            EventType.SYSTEM_STATUS,
            "test_source",
            {"test": "simple_message"}
        )
        print("✅ Message published successfully")
    except Exception as e:
        print(f"❌ Publish failed: {e}")
        return False
    
    # Test stream info
    info = redis_event_bus.get_stream_info(EventType.SYSTEM_STATUS)
    print(f"📊 Stream info: {info}")
    
    if info.get('length', 0) > 0:
        print("✅ Stream has messages")
        return True
    else:
        print("❌ No messages in stream")
        return False

def test_manual_consumer():
    """Test manual message consumption without xpending_range"""
    print("\n🔍 Manual Consumer Test")
    print("=" * 30)
    
    import redis
    
    # Connect directly to Redis
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)
    
    stream_name = "events:test_manual"
    group_name = "test_group"
    consumer_name = "test_consumer"
    
    try:
        # Create consumer group
        r.xgroup_create(stream_name, group_name, id='0', mkstream=True)
        print("✅ Consumer group created")
    except redis.exceptions.ResponseError as e:
        if "BUSYGROUP" in str(e):
            print("✅ Consumer group already exists")
        else:
            print(f"❌ Group creation error: {e}")
            return False
    
    # Publish test messages
    msg_ids = []
    for i in range(3):
        msg_id = r.xadd(stream_name, {
            'type': 'test',
            'source': f'test_{i}',
            'data': f'{{"value": {i}}}'
        })
        msg_ids.append(msg_id)
        print(f"📤 Published message {i}: {msg_id}")
    
    # Read messages
    messages = r.xreadgroup(
        group_name, consumer_name,
        {stream_name: '>'},
        count=10, block=1000
    )
    
    print(f"📨 Received {len(messages)} stream responses")
    
    total_messages = 0
    for stream, msgs in messages:
        print(f"📨 Stream {stream} has {len(msgs)} messages")
        total_messages += len(msgs)
        
        for msg_id, fields in msgs:
            print(f"  Message {msg_id}: {fields}")
            # Acknowledge the message
            r.xack(stream_name, group_name, msg_id)
    
    if total_messages >= 3:
        print("✅ Manual consumer test passed")
        return True
    else:
        print(f"❌ Only received {total_messages} messages, expected 3")
        return False

if __name__ == "__main__":
    async def main():
        result1 = await test_simple_redis()
        result2 = test_manual_consumer()
        
        if result1 and result2:
            print("\n🎉 Simple Redis tests passed!")
        else:
            print("\n⚠️ Some tests failed")
    
    asyncio.run(main())