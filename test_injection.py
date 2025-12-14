#!/usr/bin/env python3
"""
Simple test to debug injection issues
"""

import sys
import os

print("Starting injection test...")
print(f"Python path: {sys.path}")

# Add automation directory to path
automation_path = os.path.join(os.path.dirname(__file__), 'automation')
print(f"Adding to path: {automation_path}")
sys.path.insert(0, automation_path)

try:
    print("Importing redis_event_bus...")
    from redis_event_bus import event_bus_proxy
    print("✅ Successfully imported redis_event_bus")
    
    print("Importing events...")
    from events import EventType
    print("✅ Successfully imported events")
    print(f"CHANGE_DETECTION event type: {EventType.CHANGE_DETECTION}")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    import traceback
    traceback.print_exc()

print("Test complete")