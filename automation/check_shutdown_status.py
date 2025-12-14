#!/usr/bin/env python3
"""
Multi-Agent System Status Checker
Provides various ways to check if the system has shut down properly
"""

import json
import os
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path

def check_processes():
    """Check for running orchestrator processes"""
    print("🔍 Checking Running Processes:")
    print("=" * 50)
    
    try:
        # Check for Python processes containing orchestrator
        result = subprocess.run(['ps', 'aux'], capture_output=True, text=True)
        lines = result.stdout.split('\n')
        
        orchestrator_processes = []
        for line in lines:
            if 'python' in line and 'orchestrator' in line and 'grep' not in line:
                orchestrator_processes.append(line.strip())
        
        if orchestrator_processes:
            print("❌ Orchestrator processes still running:")
            for proc in orchestrator_processes:
                print(f"   {proc}")
            return False
        else:
            print("✅ No orchestrator processes found")
            return True
            
    except Exception as e:
        print(f"❌ Error checking processes: {e}")
        return False

def check_log_files():
    """Check recent log entries for shutdown status"""
    print("\n📋 Checking Recent Log Entries:")
    print("=" * 50)
    
    try:
        # Check audit log for recent shutdown events
        audit_file = Path("logs/audit/audit_20251213.json")
        if audit_file.exists():
            with open(audit_file, 'r') as f:
                lines = f.readlines()
            
            # Get last 10 events
            recent_events = []
            for line in lines[-10:]:
                try:
                    event = json.loads(line.strip())
                    recent_events.append(event)
                except:
                    continue
            
            if recent_events:
                print("📅 Last 5 system events:")
                for event in recent_events[-5:]:
                    timestamp = event.get('timestamp', 'Unknown')
                    source = event.get('source', 'Unknown')
                    event_type = event.get('event_type', 'Unknown')
                    status = event.get('data', {}).get('status', 'N/A')
                    
                    print(f"   {timestamp[-12:-4]} | {source:15} | {event_type:12} | {status}")
                
                # Look for recent shutdown events
                recent_shutdown = False
                for event in recent_events:
                    if event.get('data', {}).get('status') == 'stopped':
                        recent_shutdown = True
                        break
                
                if recent_shutdown:
                    print("✅ Recent shutdown events found in logs")
                else:
                    print("⚠️  No recent shutdown events in logs")
                
            else:
                print("❌ No recent events found")
        else:
            print("❌ No audit log file found")
            
    except Exception as e:
        print(f"❌ Error checking logs: {e}")

def check_lock_files():
    """Check for any lock files or pid files"""
    print("\n🔒 Checking Lock/PID Files:")
    print("=" * 50)
    
    lock_patterns = [
        "orchestrator.pid",
        "*.lock",
        "agent_*.pid"
    ]
    
    found_locks = []
    for pattern in lock_patterns:
        try:
            result = subprocess.run(['find', '.', '-name', pattern], 
                                  capture_output=True, text=True)
            if result.stdout.strip():
                found_locks.extend(result.stdout.strip().split('\n'))
        except:
            pass
    
    if found_locks:
        print("⚠️  Found potential lock files:")
        for lock in found_locks:
            print(f"   {lock}")
    else:
        print("✅ No lock files found")

def check_ports():
    """Check if any ports are still in use by the system"""
    print("\n🌐 Checking Network Ports:")
    print("=" * 50)
    
    common_ports = [5500, 8000, 8080, 27017]  # Add ports your system uses
    
    for port in common_ports:
        try:
            result = subprocess.run(['lsof', '-i', f':{port}'], 
                                  capture_output=True, text=True)
            if result.stdout.strip():
                print(f"⚠️  Port {port} is in use:")
                for line in result.stdout.strip().split('\n')[1:]:  # Skip header
                    print(f"   {line}")
            else:
                print(f"✅ Port {port} is free")
        except:
            print(f"❓ Could not check port {port}")

def interactive_status_check():
    """Run an interactive status check"""
    print("💻 Interactive System Status:")
    print("=" * 50)
    
    try:
        # Try to import and check orchestrator status
        sys.path.append('.')
        from orchestrator import MultiAgentOrchestrator
        
        # Create orchestrator to check status
        orchestrator = MultiAgentOrchestrator()
        
        if hasattr(orchestrator, 'running'):
            if orchestrator.running:
                print("⚠️  Orchestrator running flag is True")
            else:
                print("✅ Orchestrator running flag is False")
        
        if hasattr(orchestrator, 'agents'):
            agent_count = len(orchestrator.agents)
            print(f"📊 Agent count: {agent_count}")
            
            if agent_count > 0:
                print("   Agent status:")
                for name, agent in orchestrator.agents.items():
                    try:
                        status = agent.get_status()
                        agent_status = status.get('status', {}).get('status', 'Unknown')
                        print(f"      {name}: {agent_status}")
                    except:
                        print(f"      {name}: Error getting status")
        
    except ImportError:
        print("❌ Could not import orchestrator (may indicate clean shutdown)")
    except Exception as e:
        print(f"❌ Error checking orchestrator: {e}")

def main():
    print("🔧 Multi-Agent System Shutdown Status Check")
    print("=" * 60)
    print(f"📅 Check time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Run all checks
    process_status = check_processes()
    check_log_files()
    check_lock_files()
    check_ports()
    interactive_status_check()
    
    print("\n" + "=" * 60)
    print("📋 SUMMARY:")
    if process_status:
        print("✅ System appears to be shut down (no running processes found)")
    else:
        print("❌ System may still be running (processes detected)")
    
    print("\n💡 Quick Commands to Force Shutdown:")
    print("   pkill -f orchestrator     # Kill orchestrator processes")
    print("   pkill -f 'python.*agent'  # Kill agent processes")
    print("   ps aux | grep python      # List all Python processes")

if __name__ == "__main__":
    main()