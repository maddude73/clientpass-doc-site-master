#!/usr/bin/env python3
"""
Manual trigger for source repository changes detection
This script sends the specific commits we found to the MAS for processing
"""

import sys
import os
import json
import asyncio
from datetime import datetime

# Add automation directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'automation'))

try:
    from redis_event_bus import event_bus_proxy
    from events import EventType
    from loguru import logger
    print("✅ Successfully imported all modules")
except ImportError as e:
    print(f"❌ Error importing modules: {e}")
    print("Make sure Redis and other dependencies are installed")
    sys.exit(1)

async def trigger_source_repo_changes():
    """Trigger processing of the 5 commits we found in style-referral-ring"""
    
    # Initialize the event bus proxy
    print("🔧 Initializing event bus...")
    await event_bus_proxy.initialize()
    status = event_bus_proxy.get_status()
    print(f"📊 Event bus status: {status}")
    
    # The commits we identified from git log
    commits_to_process = [
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
    ]
    
    logger.info(f"Triggering processing of {len(commits_to_process)} commits from source repository")
    
    for commit in commits_to_process:
        # Send source repository change event
        event_data = {
            "source_repo": "/Users/rhfluker/Projects/style-referral-ring",
            "commit_hash": commit["commit_hash"], 
            "commit_message": commit["message"],
            "files_changed": json.dumps(commit["files_changed"]),  # Serialize list to JSON string
            "timestamp": datetime.now().isoformat(),
            "requires_documentation_update": "true"  # Convert boolean to string
        }
        
        try:
            print(f"📤 Publishing event for commit {commit['commit_hash']}")
            await event_bus_proxy.publish(EventType.SOURCE_REPO_CHANGE_DETECTED, event_data)
            print(f"✅ Successfully published event for commit {commit['commit_hash']}")
            logger.success(f"✅ Triggered processing for commit {commit['commit_hash']}: {commit['message']}")
            
        except Exception as e:
            print(f"❌ Failed to publish event for commit {commit['commit_hash']}: {e}")
            logger.error(f"❌ Failed to trigger commit {commit['commit_hash']}: {e}")
    
    logger.info("🎯 All source repository changes have been sent to MAS for processing")
    logger.info("📋 Check automation logs to see the processing:")
    logger.info("   - tail -f logs/automation.log")
    logger.info("   - tail -f logs/orchestrator.log")

if __name__ == "__main__":
    asyncio.run(trigger_source_repo_changes())