#!/usr/bin/env python3
"""
Quick verification test for the fixes
"""
import sys
import asyncio
from pathlib import Path

sys.path.append(str(Path(__file__).parent / 'automation'))

from agents.change_detection_agent import ChangeDetectionAgent

async def quick_test():
    print("🔧 Quick Fix Verification Test")
    print("=" * 40)
    
    # Test 1: Can we create and initialize the agent?
    try:
        agent = ChangeDetectionAgent()
        await agent.initialize()
        print(f"✅ Agent initialized, tracking {len(agent.file_checksums)} files")
        
        if len(agent.file_checksums) > 0:
            print("✅ SUCCESS: File scanning is now working!")
            print(f"   Sample tracked files:")
            for i, file_path in enumerate(list(agent.file_checksums.keys())[:3]):
                print(f"     - {file_path}")
            return True
        else:
            print("❌ ISSUE: Still tracking 0 files")
            print(f"   Watch paths: {agent.watch_paths}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

if __name__ == "__main__":
    result = asyncio.run(quick_test())
    print(f"\n🎯 Fix status: {'SUCCESS' if result else 'NEEDS MORE WORK'}")