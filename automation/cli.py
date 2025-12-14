#!/usr/bin/env python3
"""
Multi-Agent System Command Line Interface
Provides CLI commands for managing the MAS system
"""

import asyncio
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
import argparse

# Add current directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from events import event_bus, EventType
from config import config
from orchestrator import MultiAgentOrchestrator

class MASCLI:
    """Command Line Interface for Multi-Agent System"""
    
    def __init__(self):
        self.orchestrator = None
    
    async def status(self):
        """Get system status"""
        try:
            # Try to get status from running system
            if self.orchestrator:
                status = self.orchestrator.get_system_status()
                self._print_status(status)
            else:
                print("System is not running")
                return False
                
        except Exception as e:
            print(f"Error getting status: {e}")
            return False
    
    async def start_system(self):
        """Start the MAS system"""
        try:
            print("Starting Multi-Agent System...")
            
            self.orchestrator = MultiAgentOrchestrator()
            success = await self.orchestrator.start()
            
            if success:
                print("✅ System started successfully")
                
                # Start monitoring loop in background
                asyncio.create_task(self.orchestrator.monitor_system())
                return True
            else:
                print("❌ Failed to start system")
                return False
                
        except Exception as e:
            print(f"Error starting system: {e}")
            return False
    
    async def stop_system(self):
        """Stop the MAS system"""
        try:
            if self.orchestrator:
                print("Stopping Multi-Agent System...")
                await self.orchestrator.shutdown()
                print("✅ System stopped")
            else:
                print("System is not running")
                
        except Exception as e:
            print(f"Error stopping system: {e}")
    
    async def restart_system(self):
        """Restart the MAS system"""
        await self.stop_system()
        await asyncio.sleep(2)
        return await self.start_system()
    
    async def detect_changes(self):
        """Trigger manual change detection"""
        try:
            print("Triggering change detection...")
            
            event_bus.publish(
                EventType.CHANGE_DETECTION,
                'cli',
                {'action': 'force_scan'}
            )
            
            print("✅ Change detection triggered")
            
        except Exception as e:
            print(f"Error triggering change detection: {e}")
    
    async def search(self, query: str, limit: int = 10):
        """Perform RAG search"""
        try:
            print(f"Searching for: '{query}'...")
            
            # Create a response handler
            results = None
            
            def handle_search_results(event):
                nonlocal results
                if event.data.get('action') == 'search_results':
                    results = event.data.get('results')
            
            # Subscribe to search results
            event_bus.subscribe(EventType.RAG_UPDATE, handle_search_results)
            
            # Publish search request
            event_bus.publish(
                EventType.RAG_UPDATE,
                'cli',
                {
                    'action': 'search',
                    'query': query,
                    'limit': limit,
                    'request_id': f"cli_{datetime.now().timestamp()}"
                }
            )
            
            # Wait for results
            for _ in range(50):  # Wait up to 5 seconds
                await asyncio.sleep(0.1)
                if results is not None:
                    break
            
            if results:
                self._print_search_results(results)
            else:
                print("No results found or search timed out")
                
        except Exception as e:
            print(f"Error performing search: {e}")
    
    async def audit_report(self, report_type: str = "daily"):
        """Generate audit report"""
        try:
            print(f"Generating {report_type} audit report...")
            
            event_bus.publish(
                EventType.SYSTEM_STATUS,
                'cli',
                {
                    'action': 'generate_report',
                    'report_type': report_type
                }
            )
            
            print(f"✅ {report_type.capitalize()} audit report requested")
            
        except Exception as e:
            print(f"Error generating audit report: {e}")
    
    async def health_check(self):
        """Perform system health check"""
        try:
            print("Performing health check...")
            
            event_bus.publish(
                EventType.HEALTH_CHECK,
                'cli',
                {'action': 'request'}
            )
            
            print("✅ Health check requested")
            
        except Exception as e:
            print(f"Error performing health check: {e}")
    
    async def maintenance(self):
        """Trigger maintenance tasks"""
        try:
            print("Triggering maintenance tasks...")
            
            event_bus.publish(
                EventType.DAILY_MAINTENANCE,
                'cli',
                {'action': 'trigger'}
            )
            
            print("✅ Maintenance tasks triggered")
            
        except Exception as e:
            print(f"Error triggering maintenance: {e}")
    
    def show_config(self):
        """Show current configuration"""
        try:
            print("Current Configuration:")
            print("=" * 50)
            
            # Show environment variables
            print("\nEnvironment Variables:")
            env_vars = [
                'MAS_LOG_LEVEL', 'MAS_SESSION_ID', 'PROJECT_ROOT',
                'DOCS_PATH', 'LOGS_PATH'
            ]
            
            for var in env_vars:
                value = config.get(var.lower().replace('mas_', ''), 'Not set')
                print(f"  {var}: {value}")
            
            # Show agent status
            print("\nAgent Configuration:")
            agents = [
                'change_detection', 'document_management', 
                'rag_management', 'logging_audit', 'scheduler'
            ]
            
            for agent in agents:
                enabled = config.get(f'agents.{agent}.enabled', True)
                status = "✅ Enabled" if enabled else "❌ Disabled"
                print(f"  {agent}: {status}")
            
            # Show dynamic config
            print("\nDynamic Configuration:")
            dynamic_config = config.get_all_dynamic()
            if dynamic_config:
                print(json.dumps(dynamic_config, indent=2))
            else:
                print("  No dynamic configuration found")
                
        except Exception as e:
            print(f"Error showing config: {e}")
    
    def _print_status(self, status: Dict[str, Any]):
        """Print formatted system status"""
        print("System Status")
        print("=" * 50)
        
        # Orchestrator status
        orch = status.get('orchestrator', {})
        print(f"Running: {'✅ Yes' if orch.get('running') else '❌ No'}")
        print(f"Uptime: {orch.get('uptime_seconds', 0):.0f} seconds")
        
        # Agent status
        print(f"\nAgents ({status.get('agent_count', 0)}):")
        agents = status.get('agents', [])
        
        for agent in agents:
            name = agent.get('name', 'Unknown')
            agent_status = agent.get('status', {}).get('status', 'unknown')
            last_activity = agent.get('last_activity', 'Never')
            
            status_icon = "✅" if agent_status == "running" else "❌"
            print(f"  {status_icon} {name}: {agent_status}")
            print(f"    Last Activity: {last_activity}")
            
            metrics = agent.get('metrics', {})
            if metrics:
                events = metrics.get('events_processed', 0)
                errors = metrics.get('errors', 0)
                print(f"    Events: {events}, Errors: {errors}")
        
        # System health
        system_healthy = status.get('system_healthy', False)
        health_icon = "✅" if system_healthy else "⚠️"
        print(f"\nSystem Health: {health_icon} {'Healthy' if system_healthy else 'Issues Detected'}")
    
    def _print_search_results(self, results: Dict[str, Any]):
        """Print formatted search results"""
        search_results = results.get('results', [])
        query = results.get('query', '')
        
        print(f"\nSearch Results for: '{query}'")
        print("=" * 50)
        
        if not search_results:
            print("No results found")
            return
        
        for i, result in enumerate(search_results[:10], 1):
            content = result.get('content', '')
            metadata = result.get('metadata', {})
            distance = result.get('distance')
            
            print(f"\n{i}. Source: {metadata.get('source', 'Unknown')}")
            if distance is not None:
                print(f"   Similarity: {1 - distance:.3f}")
            
            # Show snippet
            snippet = content[:200] + "..." if len(content) > 200 else content
            print(f"   Content: {snippet}")

async def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(description="Multi-Agent System CLI")
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Status command
    subparsers.add_parser('status', help='Get system status')
    
    # System control commands
    subparsers.add_parser('start', help='Start the MAS system')
    subparsers.add_parser('stop', help='Stop the MAS system')
    subparsers.add_parser('restart', help='Restart the MAS system')
    
    # Operation commands
    subparsers.add_parser('detect-changes', help='Trigger change detection')
    subparsers.add_parser('health-check', help='Perform health check')
    subparsers.add_parser('maintenance', help='Trigger maintenance tasks')
    
    # Search command
    search_parser = subparsers.add_parser('search', help='Perform RAG search')
    search_parser.add_argument('query', help='Search query')
    search_parser.add_argument('--limit', type=int, default=10, help='Maximum results')
    
    # Audit command
    audit_parser = subparsers.add_parser('audit-report', help='Generate audit report')
    audit_parser.add_argument('--type', default='daily', 
                             choices=['daily', 'weekly', 'monthly'],
                             help='Report type')
    
    # Config command
    subparsers.add_parser('config', help='Show configuration')
    
    # Run command (start and keep running)
    subparsers.add_parser('run', help='Start system and keep running')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    cli = MASCLI()
    
    try:
        if args.command == 'status':
            await cli.status()
        elif args.command == 'start':
            await cli.start_system()
        elif args.command == 'stop':
            await cli.stop_system()
        elif args.command == 'restart':
            await cli.restart_system()
        elif args.command == 'detect-changes':
            await cli.detect_changes()
        elif args.command == 'search':
            await cli.search(args.query, args.limit)
        elif args.command == 'audit-report':
            await cli.audit_report(args.type)
        elif args.command == 'health-check':
            await cli.health_check()
        elif args.command == 'maintenance':
            await cli.maintenance()
        elif args.command == 'config':
            cli.show_config()
        elif args.command == 'run':
            # Start system and keep running
            success = await cli.start_system()
            if success:
                print("System running... Press Ctrl+C to stop")
                try:
                    # Keep running until interrupted
                    while True:
                        await asyncio.sleep(10)
                except KeyboardInterrupt:
                    print("\nShutting down...")
                    await cli.stop_system()
        
    except KeyboardInterrupt:
        print("\nOperation cancelled")
        if cli.orchestrator:
            await cli.stop_system()
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())