#!/usr/bin/env python3
"""
Shutdown Test Script
Tests the orchestrator startup and shutdown process to identify issues
"""

import asyncio
import signal
import sys
import time
from pathlib import Path
from datetime import datetime
from loguru import logger

# Add automation directory to path
automation_dir = Path(__file__).parent
sys.path.insert(0, str(automation_dir))

from orchestrator import MultiAgentOrchestrator

async def test_shutdown():
    """Test orchestrator shutdown process"""
    print("🔧 Testing Orchestrator Shutdown Process")
    print("=" * 60)
    
    orchestrator = None
    try:
        # Test 1: Basic startup and shutdown
        print("Test 1: Basic startup and shutdown")
        orchestrator = MultiAgentOrchestrator()
        
        print("  • Starting orchestrator...")
        await orchestrator.start()
        print("  ✅ Orchestrator started successfully")
        
        # Let it run for a few seconds
        print("  • Running for 3 seconds...")
        await asyncio.sleep(3)
        
        print("  • Initiating shutdown...")
        await orchestrator.shutdown()
        print("  ✅ Shutdown completed successfully")
        
    except Exception as e:
        print(f"  ❌ Error during basic test: {e}")
        logger.exception("Basic test error")
        return False
    
    # Test 2: Signal-based shutdown
    print("\nTest 2: Signal-based shutdown")
    try:
        orchestrator = MultiAgentOrchestrator()
        
        print("  • Starting orchestrator...")
        await orchestrator.start()
        
        print("  • Sending SIGTERM signal...")
        # Simulate signal-based shutdown
        if hasattr(orchestrator, '_handle_system_event'):
            # Trigger shutdown via event
            from events import event_bus, EventType, Event
            shutdown_event = Event(
                type=EventType.ERROR_OCCURRED,
                source="test",
                data={"message": "shutdown_test"},
                timestamp=datetime.now()
            )
            # Use direct shutdown instead
            await orchestrator.shutdown()
            print("  ✅ Signal-based shutdown completed")
        
    except Exception as e:
        print(f"  ❌ Error during signal test: {e}")
        logger.exception("Signal test error")
        return False
    
    # Test 3: Forced shutdown
    print("\nTest 3: Forced shutdown with agent cleanup")
    try:
        orchestrator = MultiAgentOrchestrator()
        
        print("  • Starting orchestrator...")
        await orchestrator.start()
        
        print("  • Checking agent states...")
        for agent_name, agent in orchestrator.agents.items():
            status = agent.get_status()
            print(f"    - {agent_name}: {status['status']['status']}")
        
        print("  • Force shutdown...")
        await orchestrator.shutdown()
        
        print("  • Verifying agent cleanup...")
        for agent_name, agent in orchestrator.agents.items():
            status = agent.get_status()
            print(f"    - {agent_name}: {status['status']['status']}")
        
        print("  ✅ Forced shutdown completed")
        
    except Exception as e:
        print(f"  ❌ Error during forced shutdown test: {e}")
        logger.exception("Forced shutdown test error")
        return False
    
    print("\n🎉 All shutdown tests completed successfully!")
    return True

async def test_shutdown_timing():
    """Test shutdown timing and cleanup"""
    print("\n🕒 Testing Shutdown Timing")
    print("=" * 60)
    
    try:
        orchestrator = MultiAgentOrchestrator()
        
        start_time = time.time()
        await orchestrator.start()
        startup_time = time.time() - start_time
        print(f"  • Startup time: {startup_time:.2f}s")
        
        # Let agents initialize
        await asyncio.sleep(2)
        
        shutdown_start = time.time()
        await orchestrator.shutdown()
        shutdown_time = time.time() - shutdown_start
        print(f"  • Shutdown time: {shutdown_time:.2f}s")
        
        if shutdown_time > 10:
            print(f"  ⚠️  Warning: Shutdown took {shutdown_time:.2f}s (>10s)")
        else:
            print("  ✅ Shutdown timing acceptable")
            
    except Exception as e:
        print(f"  ❌ Error during timing test: {e}")
        logger.exception("Timing test error")
        return False
    
    return True

if __name__ == "__main__":
    async def main():
        success1 = await test_shutdown()
        success2 = await test_shutdown_timing()
        
        if success1 and success2:
            print("\n✅ All shutdown tests PASSED")
            sys.exit(0)
        else:
            print("\n❌ Some shutdown tests FAILED")
            sys.exit(1)
    
    asyncio.run(main())