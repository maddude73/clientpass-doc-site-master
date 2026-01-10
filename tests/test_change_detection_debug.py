#!/usr/bin/env python3
"""
Debug test for Change Detection Agent
"""
import asyncio
import sys
from pathlib import Path

# Add automation directory to path
sys.path.append(str(Path(__file__).parent / 'automation'))

from agents.change_detection_agent import ChangeDetectionAgent
from config import config

async def test_change_detection():
    print("🔍 Testing Change Detection Agent")
    print("=" * 40)
    
    # Initialize agent
    agent = ChangeDetectionAgent()
    print(f"Watch paths: {agent.watch_paths}")
    print(f"File extensions: {agent.file_extensions}")
    print(f"Check interval: {agent.check_interval} seconds")
    
    # Check if test file exists
    test_file = Path("public/docs/TEST_AGENT_TRIGGER.md")
    print(f"Test file exists: {test_file.exists()}")
    if test_file.exists():
        print(f"Test file size: {test_file.stat().st_size} bytes")
        print(f"Test file modified: {test_file.stat().st_mtime}")
    
    # Initialize agent
    try:
        await agent.initialize()
        print(f"✅ Agent initialized with {len(agent.file_checksums)} tracked files")
        
        # Show some tracked files
        if agent.file_checksums:
            print("📁 Sample tracked files:")
            for i, (file_path, checksum) in enumerate(list(agent.file_checksums.items())[:5]):
                print(f"   {file_path}: {checksum[:8]}...")
                
        # Check if our test file is being tracked
        if str(test_file) in agent.file_checksums:
            print(f"✅ Test file IS being tracked: {test_file}")
        else:
            print(f"❌ Test file NOT being tracked: {test_file}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_change_detection())