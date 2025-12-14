#!/usr/bin/env python3
"""
REAL Integration Tests - Test Actual Agent Functionality
This tests if agents actually DO their jobs, not just import successfully.
"""
import asyncio
import os
import sys
import time
import json
from pathlib import Path
from datetime import datetime

# Add automation directory to path
sys.path.append(str(Path(__file__).parent / 'automation'))

from agents.change_detection_agent import ChangeDetectionAgent
from agents.document_management_agent import DocumentManagementAgent
from events import event_bus, EventType

class RealIntegrationTest:
    """Tests that verify agents actually work, not just import"""
    
    def __init__(self):
        self.test_dir = Path("test_workspace")
        self.test_file = self.test_dir / "TEST_REAL_FUNCTIONALITY.md"
        self.events_received = []
        
    async def setup_test_environment(self):
        """Create isolated test environment"""
        print("🔧 Setting up test environment...")
        
        # Create test directory
        self.test_dir.mkdir(exist_ok=True)
        
        # Subscribe to events to see if they actually fire
        event_bus.subscribe(EventType.FILE_CHANGE, self._capture_event)
        event_bus.subscribe(EventType.DOCUMENT_PROCESSING, self._capture_event)
        
        print(f"✅ Test workspace: {self.test_dir}")
        
    def _capture_event(self, event):
        """Capture events fired by agents"""
        self.events_received.append({
            'type': event.type if hasattr(event, 'type') else str(type(event)),
            'timestamp': datetime.now().isoformat(),
            'data': getattr(event, 'data', str(event))
        })
        print(f"📨 Event captured: {event}")
        
    async def test_file_change_detection(self):
        """Test if change detection agent actually detects file changes"""
        print("\n🔍 TEST 1: File Change Detection")
        print("=" * 50)
        
        # Create initial test file before agent initialization
        print(f"📝 Creating initial test file: {self.test_file}")
        self.test_file.write_text("# Test Document\nInitial content")
        
        # Initialize change detection agent
        agent = ChangeDetectionAgent()
        
        # Override watch paths - use the relative path directly
        agent.watch_paths = ["test_workspace"]
        agent.check_interval = 1  # Check every 1 second for testing
        
        try:
            await agent.initialize()
            print(f"✅ Agent initialized, tracking {len(agent.file_checksums)} files")
            
            # Start the agent
            agent.running = True
            monitor_task = asyncio.create_task(agent.process())
            
            # Wait a moment
            await asyncio.sleep(2)
            
            # Modify the test file to trigger change detection
            print(f"📝 Modifying test file: {self.test_file}")
            self.test_file.write_text(f"# Test Document\nModified content at {datetime.now()}")
            
            # Wait for detection
            print("⏳ Waiting 5 seconds for file change detection...")
            await asyncio.sleep(5)
            
            # Check if event was fired
            file_change_events = [e for e in self.events_received if 'FILE_CHANGE' in str(e['type'])]
            
            if file_change_events:
                print(f"✅ SUCCESS: {len(file_change_events)} file change events detected!")
                for event in file_change_events:
                    print(f"   📨 {event}")
            else:
                print("❌ FAILURE: No file change events detected")
                print(f"   Agent file checksums: {len(agent.file_checksums)}")
                print(f"   Events received: {len(self.events_received)}")
                
            # Stop the agent and cancel the monitoring task
            agent.running = False
            monitor_task.cancel()
            
            return len(file_change_events) > 0
            
        except Exception as e:
            print(f"❌ ERROR: {e}")
            return False
            
    async def test_document_processing(self):
        """Test if document management agent actually processes files"""
        print("\n📚 TEST 2: Document Processing")
        print("=" * 50)
        
        agent = DocumentManagementAgent()
        
        try:
            await agent.initialize()
            print("✅ Document Management Agent initialized")
            
            # Create a markdown file to process
            test_content = """# Test Document
            
This is a test document for real functionality testing.

## Content
- Item 1
- Item 2

Created at: """ + datetime.now().isoformat()
            
            self.test_file.write_text(test_content)
            
            # Manually trigger document processing
            print(f"🔄 Processing test file: {self.test_file}")
            result = await agent._process_file(str(self.test_file))
            
            if result:
                print(f"✅ SUCCESS: Document processed successfully")
                print(f"   Result: {result}")
                return True
            else:
                print("❌ FAILURE: Document processing returned None/False")
                return False
                
        except Exception as e:
            print(f"❌ ERROR: Document processing failed: {e}")
            return False
            
    async def test_event_system(self):
        """Test if the event system actually works"""
        print("\n🎭 TEST 3: Event System")
        print("=" * 50)
        
        test_events_fired = 0
        
        def test_handler(event):
            nonlocal test_events_fired
            test_events_fired += 1
            print(f"📨 Test event received: {event}")
            
        # Subscribe to test event
        event_bus.subscribe(EventType.FILE_CHANGE, test_handler)
        
        # Fire test events
        print("🔥 Firing 3 test events...")
        for i in range(3):
            await event_bus.publish(EventType.FILE_CHANGE, {
                'test_event': i,
                'timestamp': datetime.now().isoformat()
            })
            
        await asyncio.sleep(1)  # Give events time to process
        
        if test_events_fired >= 3:
            print(f"✅ SUCCESS: Event system working ({test_events_fired} events)")
            return True
        else:
            print(f"❌ FAILURE: Only {test_events_fired}/3 events received")
            return False
            
    async def cleanup(self):
        """Clean up test environment"""
        print("\n🧹 Cleaning up test environment...")
        try:
            if self.test_file.exists():
                self.test_file.unlink()
            if self.test_dir.exists():
                self.test_dir.rmdir()
            print("✅ Cleanup complete")
        except Exception as e:
            print(f"⚠️ Cleanup warning: {e}")
            
    async def run_all_tests(self):
        """Run all real functionality tests"""
        print("🚀 REAL INTEGRATION TESTS - Testing Actual Functionality")
        print("=" * 70)
        print("This tests if agents actually DO their jobs, not just import!")
        print()
        
        await self.setup_test_environment()
        
        tests = [
            ("File Change Detection", self.test_file_change_detection),
            ("Document Processing", self.test_document_processing), 
            ("Event System", self.test_event_system)
        ]
        
        results = {}
        
        for test_name, test_func in tests:
            try:
                result = await test_func()
                results[test_name] = result
            except Exception as e:
                print(f"❌ {test_name} failed with exception: {e}")
                results[test_name] = False
                
        await self.cleanup()
        
        # Summary
        print("\n" + "=" * 70)
        print("📊 REAL FUNCTIONALITY TEST RESULTS")
        print("=" * 70)
        
        passed = 0
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} {test_name}")
            if result:
                passed += 1
                
        print(f"\nOverall: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        if passed == total:
            print("🎉 All functionality tests PASSED - System is actually working!")
        else:
            print("💥 CRITICAL: System is NOT working - Previous tests were misleading")
            print("   The import tests gave false confidence")
            print("   Real functionality is broken")
            
        return passed == total

async def main():
    tester = RealIntegrationTest()
    success = await tester.run_all_tests()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    asyncio.run(main())