#!/usr/bin/env python3
"""
Minimal Shutdown Test
Tests shutdown without signal handlers
"""

import asyncio
import sys
from pathlib import Path

# Add automation directory to path
automation_dir = Path(__file__).parent
sys.path.insert(0, str(automation_dir))

async def test_minimal_shutdown():
    """Test with minimal setup to isolate shutdown issues"""
    print("Testing minimal shutdown...")
    
    try:
        from orchestrator import MultiAgentOrchestrator
        
        # Create orchestrator but override signal handler
        orchestrator = MultiAgentOrchestrator()
        
        # Remove signal handlers to avoid interference
        import signal
        signal.signal(signal.SIGINT, signal.SIG_DFL)
        signal.signal(signal.SIGTERM, signal.SIG_DFL)
        
        print("1. Starting orchestrator...")
        start_result = await orchestrator.start()
        print(f"   Start result: {start_result}")
        
        print("2. Checking agent count...")
        agent_count = len(orchestrator.agents)
        print(f"   Agents created: {agent_count}")
        
        print("3. Waiting 2 seconds...")
        await asyncio.sleep(2)
        
        print("4. Beginning shutdown...")
        orchestrator.running = False  # Set flag first
        
        print("5. Stopping agents individually...")
        for name, agent in orchestrator.agents.items():
            print(f"   Stopping {name}...")
            try:
                await asyncio.wait_for(agent.stop(), timeout=5.0)
                print(f"   ✅ {name} stopped")
            except asyncio.TimeoutError:
                print(f"   ⚠️ {name} timeout during stop")
            except Exception as e:
                print(f"   ❌ {name} error: {e}")
        
        print("6. Final cleanup...")
        # Don't call orchestrator.shutdown() since we manually stopped agents
        
        print("✅ Minimal shutdown test completed")
        return True
        
    except Exception as e:
        print(f"❌ Error in minimal shutdown test: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    result = asyncio.run(test_minimal_shutdown())
    sys.exit(0 if result else 1)