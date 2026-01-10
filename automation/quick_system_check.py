#!/usr/bin/env python3
"""
Quick System Check - Verify fixes before running full test suite
"""

import sys
import asyncio
from pathlib import Path

# Add automation directory to path
automation_dir = Path(__file__).parent
sys.path.insert(0, str(automation_dir))

def test_imports(errors):
    """Test 1: Import all components"""
    try:
        from orchestrator import MultiAgentOrchestrator
        from events import EventType, Event
        from config import ConfigManager
        print("✅ Core imports successful")
    except Exception as e:
        errors.append(f"Import error: {str(e)}")
        print(f"❌ Import error: {str(e)}")

def test_event_types(errors):
    """Test 2: Check EventType completeness"""
    try:
        from events import EventType
        required_events = ['HEALTH_CHECK', 'AGENT_ERROR', 'PROCESS_COMPLETE', 'SYSTEM_STATUS']
        for event_name in required_events:
            if not hasattr(EventType, event_name):
                errors.append(f"Missing EventType: {event_name}")
            else:
                print(f"✅ EventType.{event_name} exists")
    except Exception as e:
        errors.append(f"EventType check error: {str(e)}")
        print(f"❌ EventType check error: {str(e)}")

def test_configuration(errors):
    """Test 3: Configuration loading"""
    try:
        from config import ConfigManager
        config = ConfigManager()
        agent_configs = [
            'change_detection_enabled',
            'document_management_enabled', 
            'rag_management_enabled',
            'logging_audit_enabled',
            'scheduler_enabled',
            'self_healing_enabled'
        ]
        
        for config_key in agent_configs:
            value = config.get(config_key, True)
            print(f"✅ Config {config_key}: {value}")
            
    except Exception as e:
        errors.append(f"Config error: {str(e)}")
        print(f"❌ Config error: {str(e)}")

def test_agent_creation(errors):
    """Test 4: Agent creation"""
    try:
        from orchestrator import MultiAgentOrchestrator
        orchestrator = MultiAgentOrchestrator()
        agents = orchestrator._create_agents()
        
        if len(agents) >= 6:
            print(f"✅ Agent creation: {len(agents)} agents created")
            for agent in agents:
                print(f"   - {agent.name}")
        else:
            errors.append(f"Only {len(agents)} agents created, expected 6")
            print(f"❌ Agent creation: Only {len(agents)} agents created")
            
    except Exception as e:
        errors.append(f"Agent creation error: {str(e)}")
        print(f"❌ Agent creation error: {str(e)}")

async def test_event_handling(errors):
    """Test 5: Event handling test"""
    try:
        from events import event_bus, EventType
        
        # Test event creation and handling
        test_event_received = False
        
        def test_handler(data):
            nonlocal test_event_received
            test_event_received = True
        
        event_bus.subscribe(EventType.SYSTEM_STATUS, test_handler)
        await event_bus.publish(EventType.SYSTEM_STATUS, {'test': 'data'})
        
        if test_event_received:
            print("✅ Event handling working")
        else:
            errors.append("Event handling failed")
            print("❌ Event handling failed")
            
    except Exception as e:
        errors.append(f"Event handling error: {str(e)}")
        print(f"❌ Event handling error: {str(e)}")

async def quick_system_check():
    """Quick check to verify system is working"""
    print("🔍 Quick System Check")
    print("=" * 50)
    
    errors = []
    
    # Test 1: Import all components
    try:
        from orchestrator import MultiAgentOrchestrator
        from events import EventType, Event
        from config import ConfigManager
        print("✅ Core imports successful")
    except Exception as e:
        errors.append(f"Import error: {str(e)}")
        print(f"❌ Import error: {str(e)}")
    
    # Test 2: Check EventType completeness
    try:
        required_events = ['HEALTH_CHECK', 'AGENT_ERROR', 'PROCESS_COMPLETE', 'SYSTEM_STATUS']
        for event_name in required_events:
            if not hasattr(EventType, event_name):
                errors.append(f"Missing EventType: {event_name}")
            else:
                print(f"✅ EventType.{event_name} exists")
    except Exception as e:
        errors.append(f"EventType check error: {str(e)}")
        print(f"❌ EventType check error: {str(e)}")
    
    # Test 3: Configuration loading
    try:
        config = ConfigManager()
        agent_configs = [
            'change_detection_enabled',
            'document_management_enabled', 
            'rag_management_enabled',
            'logging_audit_enabled',
            'scheduler_enabled',
            'self_healing_enabled'
        ]
        
        for config_key in agent_configs:
            value = config.get(config_key, True)
            print(f"✅ Config {config_key}: {value}")
            
    except Exception as e:
        errors.append(f"Config error: {str(e)}")
        print(f"❌ Config error: {str(e)}")
    
    # Test 4: Agent creation
    try:
        orchestrator = MultiAgentOrchestrator()
        agents = orchestrator._create_agents()
        
        if len(agents) >= 6:
            print(f"✅ Agent creation: {len(agents)} agents created")
            for agent in agents:
                print(f"   - {agent.name}")
        else:
            errors.append(f"Only {len(agents)} agents created, expected 6")
            print(f"❌ Agent creation: Only {len(agents)} agents created")
            
    except Exception as e:
        errors.append(f"Agent creation error: {str(e)}")
        print(f"❌ Agent creation error: {str(e)}")
    
    # Test 5: Event handling test
    try:
        from events import event_bus
        
        # Test event creation and handling
        test_event_received = False
        
        def test_handler(data):
            nonlocal test_event_received
            test_event_received = True
        
        event_bus.subscribe(EventType.SYSTEM_STATUS, test_handler)
        await event_bus.publish(EventType.SYSTEM_STATUS, {'test': 'data'})
        
        if test_event_received:
            print("✅ Event handling working")
        else:
            errors.append("Event handling failed")
            print("❌ Event handling failed")
            
    except Exception as e:
        errors.append(f"Event handling error: {str(e)}")
        print(f"❌ Event handling error: {str(e)}")
    
    # Summary
    print("\n" + "=" * 50)
    if errors:
        print(f"❌ Quick check FAILED: {len(errors)} issues found")
        for error in errors:
            print(f"   - {error}")
        return False
    else:
        print("✅ Quick check PASSED: System ready for testing!")
        return True

if __name__ == "__main__":
    success = asyncio.run(quick_system_check())
    sys.exit(0 if success else 1)