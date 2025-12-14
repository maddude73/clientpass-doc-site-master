#!/usr/bin/env python3
"""
Quick Redis Functionality Verification
Tests core Redis Streams functionality and exits cleanly
"""

import asyncio
import sys
from pathlib import Path

# Add automation directory to path
sys.path.insert(0, str(Path(__file__).parent))

from redis_event_bus import redis_event_bus, event_bus_proxy
from events import EventType
from loguru import logger

async def quick_redis_test():
    """Quick test of Redis functionality that exits cleanly"""
    print("⚡ Quick Redis Functionality Test")
    print("=" * 40)
    
    try:
        # Test 1: Connection
        await redis_event_bus.initialize()
        print("✅ Redis connection established")
        
        # Test 2: Event bus proxy
        await event_bus_proxy.initialize()
        status = event_bus_proxy.get_status()
        print(f"✅ Event bus proxy: {status['type']}")
        
        # Test 3: Direct publishing (no consumers)
        message_id = await redis_event_bus.publish(
            EventType.SYSTEM_STATUS,
            "quick_test",
            {"test": "quick_functionality_check", "timestamp": "2025-12-13"}
        )
        print(f"✅ Published message: {message_id}")
        
        # Test 4: Stream info verification
        info = redis_event_bus.get_stream_info(EventType.SYSTEM_STATUS)
        print(f"✅ Stream contains {info.get('length', 0)} messages")
        
        # Test 5: Proxy publishing
        await event_bus_proxy.publish(
            EventType.HEALTH_CHECK,
            "proxy_test",
            {"health": "good", "test": "proxy_functionality"}
        )
        print("✅ Proxy publishing works")
        
        print(f"\n🎉 Core Redis functionality: WORKING")
        return True
        
    except Exception as e:
        print(f"❌ Redis test failed: {e}")
        return False

async def main():
    """Run quick test and exit cleanly"""
    result = await quick_redis_test()
    
    # Ensure clean shutdown - cancel any background tasks
    current_task = asyncio.current_task()
    tasks = [task for task in asyncio.all_tasks() if task != current_task and not task.done()]
    
    if tasks:
        print(f"\n🧹 Cleaning up {len(tasks)} background tasks...")
        for task in tasks:
            task.cancel()
        
        # Wait for cancellation with timeout
        try:
            await asyncio.wait_for(
                asyncio.gather(*tasks, return_exceptions=True), 
                timeout=2.0
            )
        except asyncio.TimeoutError:
            print("⚠️  Some tasks took too long to cancel")
    
    print("🏁 Test completed, exiting cleanly")
    return result

if __name__ == "__main__":
    result = asyncio.run(main())
    sys.exit(0 if result else 1)