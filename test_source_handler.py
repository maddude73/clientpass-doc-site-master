#!/usr/bin/env python3
"""
Test script to manually trigger the source repo change handler
"""

import asyncio
import sys
import os
import json
from datetime import datetime

# Add automation directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'automation'))

from agents.change_detection_agent import ChangeDetectionAgent
from redis_event_bus import event_bus_proxy
from events import EventType, Event

async def test_source_handler():
    """Test the source repo change handler directly"""
    
    print("🧪 Testing source repo change handler...")
    
    # Initialize event bus
    await event_bus_proxy.initialize()
    
    # Create ChangeDetection agent
    agent = ChangeDetectionAgent()
    await agent.initialize()
    
    # Create a test event for one of our commits
    test_event = Event(
        type=EventType.SOURCE_REPO_CHANGE_DETECTED,
        source="test_script",
        data={
            "source_repo": "/Users/rhfluker/Projects/style-referral-ring",
            "commit_hash": "852825d",
            "commit_message": "Fix Pro Hub ad click flow",
            "files_changed": json.dumps(["src/components/pages/ProHubPage.tsx"]),
            "timestamp": datetime.now().isoformat(),
            "requires_documentation_update": "true"
        },
        timestamp=datetime.now()
    )
    
    print(f"📤 Testing with commit: {test_event.data['commit_hash']} - {test_event.data['commit_message']}")
    
    # Call the handler directly
    try:
        await agent._handle_source_repo_change(test_event)
        print("✅ Handler executed successfully!")
    except Exception as e:
        print(f"❌ Handler failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_source_handler())