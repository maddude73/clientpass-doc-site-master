#!/usr/bin/env python3
"""
Test Self-Healing Agent functionality
"""

import asyncio
import sys
import os
from pathlib import Path

# Add automation directory to path
automation_dir = Path(__file__).parent
sys.path.insert(0, str(automation_dir))

from agents.self_healing_agent import SelfHealingAgent, HealthIssue
from config import ConfigManager

async def test_self_healing_agent():
    """Test basic self-healing agent functionality"""
    print("Testing Self-Healing Agent...")
    
    try:
        # Create config manager
        config = ConfigManager()
        
        # Create self-healing agent
        agent = SelfHealingAgent()
        
        # Test initialization
        await agent.initialize()
        print("✓ Agent initialized successfully")
        
        # Test health check
        health_report = await agent._perform_comprehensive_health_check()
        print(f"✓ Health check completed: {health_report['health_status']}")
        
        # Test issue detection
        agent._add_health_issue('test_issue', 'MEDIUM', 'Test issue description', 'test_component', auto_fixable=True)
        print(f"✓ Issue detection working: {len(agent.detected_issues)} issues")
        
        # Test fix registry
        available_fixes = list(agent.fix_registry.keys())
        print(f"✓ Auto-fix registry loaded: {len(available_fixes)} fixes available")
        print(f"  Available fixes: {', '.join(available_fixes[:5])}...")
        
        # Test basic system monitoring
        await agent._perform_system_health_check()
        print("✓ System health monitoring working")
        
        print("\nSelf-Healing Agent test completed successfully!")
        return True
        
    except Exception as e:
        print(f"✗ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    result = asyncio.run(test_self_healing_agent())
    sys.exit(0 if result else 1)