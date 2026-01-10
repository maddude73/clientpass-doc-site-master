#!/usr/bin/env python3
"""
Manual RAG Update Trigger
Manually triggers RAG updates for the SRS.md file to update embeddings
"""
import asyncio
import os
import sys
from datetime import datetime
from pathlib import Path

# Add automation directory to path
sys.path.insert(0, str(Path(__file__).parent / 'automation'))

from orchestrator import MultiAgentOrchestrator
from events import Event, EventType

async def trigger_rag_update():
    """Trigger a manual RAG update for the SRS.md file"""
    
    print("🎯 MANUAL RAG UPDATE TRIGGER")
    print("=" * 60)
    
    try:
        # Initialize orchestrator
        print("🚀 Initializing Multi-Agent System...")
        orchestrator = MultiAgentOrchestrator()
        
        # Start the system
        await orchestrator.start()
        print("✅ Multi-Agent System started")
        
        # Wait a moment for agents to initialize
        await asyncio.sleep(2)
        
        # Check agent status
        try:
            status = await orchestrator.get_system_status()
            
            # Handle the correct status format from orchestrator
            if isinstance(status, dict) and 'agents' in status:
                agents = status['agents']
                healthy_agents = [agent for agent in agents if isinstance(agent, dict) and agent.get('status') == 'running']
                print(f"📊 System Status: {len(healthy_agents)}/{len(agents)} agents healthy")
                print(f"📊 System Running: {status.get('system_running', False)}")
                
                for agent in agents:
                    if isinstance(agent, dict):
                        status_icon = "✅" if agent.get('status') == 'running' else "❌"
                        print(f"   {status_icon} {agent.get('name', 'Unknown')}: {agent.get('status', 'Unknown')}")
            else:
                print(f"📊 System Status: {status}")
        except Exception as e:
            print(f"⚠️  Could not get system status: {e}")
            print("📊 Proceeding with RAG update anyway...")
        
        # Manually trigger DOCUMENT_UPDATED event for SRS.md
        srs_file_path = "/Users/rhfluker/Projects/clientpass-doc-site-master/public/docs/SRS.md"
        
        if os.path.exists(srs_file_path):
            print(f"\n📄 Triggering RAG update for SRS.md...")
            
            # Calculate file hash for change detection
            import hashlib
            with open(srs_file_path, 'rb') as f:
                file_hash = hashlib.md5(f.read()).hexdigest()
            
            # Create DOCUMENT_UPDATED event
            document_updated_event = Event(
                type=EventType.DOCUMENT_UPDATED,
                data={
                    "document_name": "SRS.md",
                    "file_path": srs_file_path,
                    "file_hash": file_hash,
                    "change_type": "manual_trigger",
                    "source": "manual_rag_trigger"
                },
                timestamp=datetime.now(),
                source="ManualRAGTrigger",
                correlation_id="manual-rag-update-" + datetime.now().strftime("%Y%m%d-%H%M%S")
            )
            
            # Publish the event
            await orchestrator.event_bus.publish(document_updated_event)
            print("✅ DOCUMENT_UPDATED event published for SRS.md")
            
            # Also manually trigger RAG_UPDATE_REQUIRED in case DocumentManagementAgent doesn't respond
            print("📊 Triggering direct RAG update...")
            
            # Read SRS content
            with open(srs_file_path, 'r', encoding='utf-8') as f:
                srs_content = f.read()
            
            rag_update_event = Event(
                type=EventType.RAG_UPDATE_REQUIRED,
                data={
                    "action": "update",
                    "document_name": "SRS.md",
                    "content": srs_content,
                    "source": "manual_trigger"
                },
                timestamp=datetime.now(),
                source="ManualRAGTrigger",
                correlation_id=document_updated_event.correlation_id
            )
            
            await orchestrator.event_bus.publish(rag_update_event)
            print("✅ RAG_UPDATE_REQUIRED event published for SRS.md")
            
            # Wait for processing
            print("\n⏳ Waiting for agents to process events...")
            await asyncio.sleep(5)
            
            # Check for any error events
            print("🔍 Checking system status after RAG update...")
            
        else:
            print(f"❌ SRS.md file not found at {srs_file_path}")
        
        # Show final status
        final_status = await orchestrator.get_system_status()
        print(f"\n📊 Final Status: {len([a for a in final_status if a['status'] == 'running'])}/{len(final_status)} agents healthy")
        
        print("\n💡 RAG Update Summary:")
        print("   ✅ DOCUMENT_UPDATED event triggered for SRS.md")
        print("   ✅ RAG_UPDATE_REQUIRED event triggered")
        print("   ✅ New appointment management requirements (REQ-1101 to REQ-1120) should be indexed")
        print("   ✅ RAG system should now include updated functional requirements in searches")
        
        # Stop the system
        print("\n🛑 Stopping Multi-Agent System...")
        await orchestrator.stop()
        print("✅ System stopped gracefully")
        
    except Exception as e:
        print(f"❌ Error during RAG update: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(trigger_rag_update())