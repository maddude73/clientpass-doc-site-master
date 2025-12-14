#!/usr/bin/env python3
"""
Manual trigger of change detection with mock event to see debug output
"""

import asyncio
import sys
import os
import json
from datetime import datetime

# Add automation directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'automation'))

async def test_change_detection():
    """Test change detection with a mock event"""
    
    try:
        from agents.change_detection_agent import ChangeDetectionAgent
        from redis_event_bus import event_bus_proxy
        
        print("Creating ChangeDetectionAgent...")
        
        # Initialize event bus
        await event_bus_proxy.initialize()
        
        # Create agent
        agent = ChangeDetectionAgent()
        await agent.initialize()
        
        print("Creating mock event...")
        
        # Create mock event that simulates what Redis would send
        class MockEvent:
            def __init__(self, data):
                self.data = data
        
        event_data = {
            "action": "process_source_repo_changes",
            "source_commits": json.dumps([{
                "commit_hash": "852825d",
                "message": "Fix Pro Hub ad click flow", 
                "files_changed": ["src/components/pages/ProHubPage.tsx"]
            }])
        }
        
        mock_event = MockEvent(event_data)
        
        print("Calling _handle_change_request with mock event...")
        await agent._handle_change_request(mock_event)
        
        print("✅ Test complete")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_change_detection())