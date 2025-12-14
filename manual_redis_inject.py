#!/usr/bin/env python3
"""
Direct Redis injection using redis-py
"""

import redis
import json
import time

# Connect to Redis
r = redis.Redis(host='localhost', port=6379, db=0)

print("Connected to Redis")

# Create event data
event_data = {
    "action": "process_source_repo_changes",
    "source_commits": json.dumps([
        {
            "commit_hash": "852825d",
            "message": "Fix Pro Hub ad click flow", 
            "files_changed": ["src/components/pages/ProHubPage.tsx"]
        }
    ])
}

# Publish directly to the change detection stream
stream_name = "events:change_detection"
message_id = r.xadd(stream_name, {
    "source": "manual_injection",
    "data": json.dumps(event_data),
    "timestamp": str(int(time.time() * 1000))
})

print(f"✅ Published message to {stream_name}: {message_id}")
print(f"📊 Event data: {json.dumps(event_data, indent=2)}")