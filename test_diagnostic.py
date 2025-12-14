#!/usr/bin/env python3
"""
Simple diagnostic test to find the exact issue
"""
import sys
from pathlib import Path

print("🔍 Diagnostic Test - Finding the Real Issues")
print("=" * 60)

# Test 1: Can we import the automation modules?
try:
    sys.path.append(str(Path(__file__).parent / 'automation'))
    print("✅ Path added successfully")
except Exception as e:
    print(f"❌ Path error: {e}")
    sys.exit(1)

# Test 2: Can we import events?
try:
    from events import EventType, event_bus
    print("✅ Events module imported")
except Exception as e:
    print(f"❌ Events import failed: {e}")
    print("🔍 Let's check what's in the events module...")
    try:
        import events
        print(f"   Events module attributes: {dir(events)}")
    except Exception as e2:
        print(f"   Can't even import events module: {e2}")
        
# Test 3: Can we import agents?
try:
    from agents.change_detection_agent import ChangeDetectionAgent
    print("✅ ChangeDetectionAgent imported")
except Exception as e:
    print(f"❌ ChangeDetectionAgent import failed: {e}")
    
# Test 4: Can we import config?
try:
    from config import config
    print("✅ Config imported")
except Exception as e:
    print(f"❌ Config import failed: {e}")
    
# Test 5: Working directory check
print(f"📁 Current working directory: {Path.cwd()}")
print(f"📁 Automation directory exists: {Path('automation').exists()}")
print(f"📁 Events file exists: {Path('automation/events.py').exists()}")

print("\n🎯 This will show us exactly what's broken before we try to fix it.")