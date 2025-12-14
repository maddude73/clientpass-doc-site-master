#!/usr/bin/env python3
"""
Direct Redis event trigger using the MAS event system
"""

import asyncio
import sys
import os
import json
from pathlib import Path

# Add automation directory to path  
sys.path.insert(0, str(Path(__file__).parent / "automation"))

async def trigger_via_redis():
    """Trigger change detection via Redis event"""
    
    print("🔧 Importing Redis event bus...")
    
    try:
        from redis_event_bus import event_bus_proxy
        from events import EventType
        
        print("✅ Successfully imported event bus components")
        
        print("🔗 Initializing event bus connection...")
        await event_bus_proxy.initialize()
        print("✅ Event bus initialized")
        
        print("📤 Publishing CHANGE_DETECTION event...")
        
        # Publish a simple change detection event
        await event_bus_proxy.publish(
            EventType.CHANGE_DETECTION,
            "direct_trigger",
            {"action": "manual_scan", "timestamp": "2025-12-14T01:43:00"}
        )
        
        print("✅ CHANGE_DETECTION event published successfully!")
        print("🎯 Check MAS terminal for processing activity...")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("🚀 Starting direct Redis event trigger...")
    asyncio.run(trigger_via_redis())