#!/usr/bin/env python3
"""
Test Redis-based agent initialization
"""

import asyncio
import sys
from pathlib import Path

# Add automation directory to path
sys.path.insert(0, str(Path(__file__).parent))

from agents.rag_management_agent import RAGManagementAgent
from redis_event_bus import event_bus_proxy
from events import EventType
from loguru import logger

async def test_redis_agent():
    """Test Redis-based agent initialization"""
    print("🧪 Testing Redis-based Agent Initialization")
    print("=" * 50)
    
    try:
        # Initialize event bus proxy
        await event_bus_proxy.initialize()
        status = event_bus_proxy.get_status()
        print(f"📊 Event bus status: {status}")
        
        # Create RAG agent
        agent = RAGManagementAgent()
        print(f"✅ RAG agent created: {agent.name}")
        
        # Test agent status
        status = agent.get_status()
        print(f"📊 Agent status: {status['name']} - {status['status']['status']}")
        
        # Test agent initialization
        await agent.initialize()
        print("✅ Agent initialized successfully")
        
        # Test event publishing
        await agent.publish_event(
            EventType.SYSTEM_STATUS,
            {"test": "Redis agent test", "timestamp": "2025-12-13"}
        )
        print("✅ Event published successfully")
        
        # Cleanup
        await agent.cleanup()
        print("✅ Agent cleaned up successfully")
        
        return True
        
    except Exception as e:
        print(f"❌ Agent test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    result = asyncio.run(test_redis_agent())
    if result:
        print("\n🎉 Redis-based agent test passed!")
    else:
        print("\n⚠️ Redis-based agent test failed!")