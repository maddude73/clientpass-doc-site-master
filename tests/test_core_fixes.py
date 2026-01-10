#!/usr/bin/env python3
"""
Test Core Fixes - File Change Detection & Event System
"""

import asyncio
import sys
import os
from pathlib import Path
import shutil

# Add automation to path
sys.path.append(str(Path(__file__).parent / 'automation'))

from agents.change_detection_agent import ChangeDetectionAgent
from events import event_bus, EventType

async def test_change_detection_fix():
    """Test if change detection properly tracks files"""
    print("🔍 Testing Change Detection Fix...")
    
    # Create test workspace
    test_dir = Path("test_fix_workspace")
    if test_dir.exists():
        shutil.rmtree(test_dir)
    test_dir.mkdir()
    
    # Create some test files
    (test_dir / "test1.md").write_text("# Test Document 1\nContent here")
    (test_dir / "test2.md").write_text("# Test Document 2\nMore content")
    
    try:
        # Initialize agent with test workspace
        agent = ChangeDetectionAgent()
        
        # Temporarily override watch paths for testing
        agent.watch_paths = [str(test_dir)]
        agent.file_extensions = ['.md', '.txt']
        
        await agent.initialize()
        
        # Check if files are properly tracked
        tracked_count = len(agent.file_checksums)
        print(f"   Files tracked: {tracked_count}")
        
        if tracked_count > 0:
            print("   ✅ SUCCESS: Change detection is tracking files")
            return True
        else:
            print("   ❌ FAILURE: Still not tracking files")
            return False
            
    except Exception as e:
        print(f"   ❌ ERROR: {e}")
        return False
    finally:
        # Cleanup
        if test_dir.exists():
            shutil.rmtree(test_dir)

async def test_event_system_fix():
    """Test if event system properly handles async handlers"""
    print("\n🎭 Testing Event System Fix...")
    
    events_received = []
    
    async def async_handler(event):
        """Async event handler"""
        events_received.append(f"async_handler: {event.type.value}")
    
    def sync_handler(event):
        """Sync event handler"""
        events_received.append(f"sync_handler: {event.type.value}")
    
    try:
        # Subscribe handlers
        event_bus.subscribe(EventType.FILE_CHANGE, async_handler)
        event_bus.subscribe(EventType.FILE_CHANGE, sync_handler)
        
        # Publish test event
        await event_bus.publish(EventType.FILE_CHANGE, "test", {"test": "data"})
        
        # Give a moment for handlers to process
        await asyncio.sleep(0.1)
        
        print(f"   Events received: {len(events_received)}")
        for event in events_received:
            print(f"   - {event}")
        
        if len(events_received) >= 2:
            print("   ✅ SUCCESS: Event system handling both sync and async handlers")
            return True
        else:
            print("   ❌ FAILURE: Event handlers not working properly")
            return False
            
    except Exception as e:
        print(f"   ❌ ERROR: {e}")
        return False

async def main():
    """Run core fix tests"""
    print("🔧 CORE FIXES VERIFICATION TEST")
    print("=" * 50)
    
    # Test fixes
    fix1_ok = await test_change_detection_fix()
    fix2_ok = await test_event_system_fix()
    
    print("\n" + "=" * 50)
    print("📊 CORE FIXES TEST RESULTS")
    print("=" * 50)
    
    results = [
        ("File Change Detection", "✅ PASS" if fix1_ok else "❌ FAIL"),
        ("Event System", "✅ PASS" if fix2_ok else "❌ FAIL")
    ]
    
    for name, status in results:
        print(f"{status} {name}")
    
    passed = sum(1 for _, status in results if "PASS" in status)
    total = len(results)
    
    print(f"\nOverall: {passed}/{total} core fixes working ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("🎉 ALL CORE FIXES VERIFIED!")
    else:
        print("💥 Some fixes still need work")

if __name__ == "__main__":
    asyncio.run(main())