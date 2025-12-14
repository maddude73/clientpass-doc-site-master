#!/usr/bin/env python3
"""
Direct event injection to trigger ChangeDetection agent via working stream
"""

import asyncio
import sys
import os
import json
from datetime import datetime

# Add automation directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'automation'))

from redis_event_bus import event_bus_proxy
from events import EventType

async def inject_via_working_stream():
    """Inject source repo processing via the CHANGE_DETECTION stream that we know works"""
    
    try:
        print("🔧 Initializing event bus...")
        await event_bus_proxy.initialize()
        print("✅ Event bus initialized")
    
    print("📤 Injecting source repo processing request via working CHANGE_DETECTION stream...")
    
    # Use the CHANGE_DETECTION event type that we know the MAS processes
    # But pass data that indicates we want to process source repo changes
    event_data = {
        "action": "process_source_repo_changes",
        "source_commits": json.dumps([
            {
                "commit_hash": "852825d",
                "message": "Fix Pro Hub ad click flow", 
                "files_changed": ["src/components/pages/ProHubPage.tsx"]
            },
            {
                "commit_hash": "65e82da",
                "message": "Changes",
                "files_changed": ["src/components/pages/HomePage.tsx", "src/components/pages/InboxPage.tsx"]
            },
            {
                "commit_hash": "3640738", 
                "message": "Improve Pro Hub ads page",
                "files_changed": ["src/components/pages/ProHubPage.tsx"]
            },
            {
                "commit_hash": "e377dae",
                "message": "Changes", 
                "files_changed": ["src/components/boost/BoostProfile.tsx"]
            },
            {
                "commit_hash": "fba68cf",
                "message": "Fix inbox notifications display",
                "files_changed": ["src/components/pages/InboxPage.tsx"]
            }
        ])
    }
    
        await event_bus_proxy.publish(EventType.CHANGE_DETECTION, "manual_injection", event_data)
        
        print("✅ Injected source repo processing request via CHANGE_DETECTION stream")
        print("🎯 MAS should now process the 5 missing commits!")
        print(f"📊 Event data sent: {json.dumps(event_data, indent=2)}")
        
    except Exception as e:
        print(f"❌ Error during injection: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(inject_via_working_stream())