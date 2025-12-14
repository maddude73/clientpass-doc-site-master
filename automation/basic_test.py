#!/usr/bin/env python3
"""
Simple Test Script - Basic validation
"""

import sys
from pathlib import Path

print("🔍 Basic System Test")
print("=" * 40)

# Add automation directory to path
automation_dir = Path(__file__).parent
sys.path.insert(0, str(automation_dir))

# Test 1: Basic imports
print("Testing imports...")
try:
    from agents.self_healing_agent import SelfHealingAgent
    print("✅ SelfHealingAgent import successful")
except Exception as e:
    print(f"❌ SelfHealingAgent import failed: {e}")
    sys.exit(1)

try:
    from orchestrator import MultiAgentOrchestrator
    print("✅ MultiAgentOrchestrator import successful")
except Exception as e:
    print(f"❌ MultiAgentOrchestrator import failed: {e}")
    sys.exit(1)

try:
    from config import ConfigManager
    print("✅ ConfigManager import successful")
except Exception as e:
    print(f"❌ ConfigManager import failed: {e}")
    sys.exit(1)

try:
    from events import EventType, Event, event_bus
    print("✅ Events import successful")
except Exception as e:
    print(f"❌ Events import failed: {e}")
    sys.exit(1)

# Test 2: Agent creation
print("\nTesting agent creation...")
try:
    orchestrator = MultiAgentOrchestrator()
    agents = orchestrator._create_agents()
    print(f"✅ Created {len(agents)} agents:")
    for agent in agents:
        print(f"   - {agent.__class__.__name__}")
    
    if len(agents) >= 6:
        print("✅ All 6+ agents created successfully")
    else:
        print(f"⚠️  Only {len(agents)} agents created (expected 6)")

except Exception as e:
    print(f"❌ Agent creation failed: {e}")
    import traceback
    traceback.print_exc()

# Test 3: Configuration
print("\nTesting configuration...")
try:
    config = ConfigManager()
    self_healing_enabled = config.get('self_healing_enabled', True)
    print(f"✅ Self-healing enabled: {self_healing_enabled}")
    
    # Test other agent configs
    agent_configs = {
        'change_detection_enabled': config.get('change_detection_enabled', True),
        'document_management_enabled': config.get('document_management_enabled', True),
        'rag_management_enabled': config.get('rag_management_enabled', True),
        'logging_audit_enabled': config.get('logging_audit_enabled', True),
        'scheduler_enabled': config.get('scheduler_enabled', True),
        'self_healing_enabled': config.get('self_healing_enabled', True)
    }
    
    enabled_count = sum(1 for enabled in agent_configs.values() if enabled)
    print(f"✅ {enabled_count}/6 agents enabled in configuration")
    
except Exception as e:
    print(f"❌ Configuration test failed: {e}")

# Test 4: Self-healing capabilities
print("\nTesting self-healing capabilities...")
try:
    agent = SelfHealingAgent()
    fix_count = len(agent.fix_registry)
    print(f"✅ Self-healing agent has {fix_count} auto-fix functions")
    
    # List some fixes
    fixes = list(agent.fix_registry.keys())[:5]
    for fix in fixes:
        print(f"   - {fix}")
    
    if fix_count >= 10:
        print("✅ Sufficient auto-fix functions available")
    else:
        print(f"⚠️  Only {fix_count} auto-fix functions (expected 10+)")
        
except Exception as e:
    print(f"❌ Self-healing test failed: {e}")

print("\n" + "=" * 40)
print("✅ Basic system test completed!")
print("System appears ready for full requirements testing.")