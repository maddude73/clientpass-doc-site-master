#!/usr/bin/env python3
"""
Multi-Agent System Orchestrator
Coordinates all agents and manages system lifecycle
"""

import asyncio
import signal
import sys
from typing import Dict, List, Any, Optional
from datetime import datetime
from loguru import logger

from events import event_bus, EventType
from config import config
from base_agent import BaseAgent, AgentStatus

# Import agents
from agents.change_detection_agent import ChangeDetectionAgent
from agents.document_management_agent import DocumentManagementAgent
from agents.rag_management_agent import RAGManagementAgent
from agents.logging_audit_agent import LoggingAuditAgent
from agents.scheduler_agent import SchedulerAgent
from agents.self_healing_agent import SelfHealingAgent

class MultiAgentOrchestrator:
    """Orchestrates multiple agents in the system"""
    
    def __init__(self):
        self.agents: Dict[str, BaseAgent] = {}
        self.running = False
        self.startup_time = datetime.now()
        
        # Setup signal handlers
        self._setup_signal_handlers()
        
        # Subscribe to system events
        event_bus.subscribe(EventType.SYSTEM_STATUS, self._handle_system_event)
        event_bus.subscribe(EventType.HEALTH_CHECK, self._handle_health_check)
        
        logger.info("Multi-Agent Orchestrator initialized")
    
    async def initialize(self) -> bool:
        """Initialize the orchestrator and all agents for testing"""
        try:
            logger.info("Initializing Multi-Agent Orchestrator...")
            
            # Create agents
            agent_instances = self._create_agents()
            
            # Initialize each agent
            for agent in agent_instances:
                try:
                    await agent.initialize()
                    self.agents[agent.name] = agent
                    logger.info(f"Initialized agent: {agent.name}")
                except Exception as e:
                    logger.error(f"Failed to initialize agent {agent.name}: {e}")
            
            logger.info(f"Multi-Agent Orchestrator initialized with {len(self.agents)} agents")
            return len(self.agents) > 0
            
        except Exception as e:
            logger.error(f"Failed to initialize orchestrator: {e}")
            return False
    
    def _setup_signal_handlers(self):
        """Setup graceful shutdown on signals"""
        def signal_handler(signum, frame):
            logger.info(f"Received signal {signum}, shutting down...")
            # Set running flag to False to break out of loops
            self.running = False
            # Don't create async task in signal handler as it can cause issues
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
    
    def _create_agents(self) -> List[BaseAgent]:
        """Create and return all agents"""
        agents = []
        
        try:
            # Create agents based on configuration
            if config.get('change_detection_enabled', True):
                agents.append(ChangeDetectionAgent())
                
            if config.get('document_management_enabled', True):
                agents.append(DocumentManagementAgent())
                
            if config.get('rag_management_enabled', True):
                agents.append(RAGManagementAgent())
                
            if config.get('logging_audit_enabled', True):
                agents.append(LoggingAuditAgent())
                
            if config.get('scheduler_enabled', True):
                agents.append(SchedulerAgent())
                
            if config.get('self_healing_enabled', True):
                agents.append(SelfHealingAgent())
            
            logger.info(f"Created {len(agents)} agents")
            return agents
            
        except Exception as e:
            logger.error(f"Failed to create agents: {e}")
            return []
    
    async def start(self):
        """Start all agents and the orchestrator"""
        try:
            logger.info("Starting Multi-Agent System...")
            
            # Create agents
            agent_instances = self._create_agents()
            
            if not agent_instances:
                logger.error("No agents created, cannot start system")
                return False
            
            # Start each agent
            for agent in agent_instances:
                try:
                    await agent.start()
                    self.agents[agent.name] = agent
                    logger.info(f"Started agent: {agent.name}")
                    
                except Exception as e:
                    logger.error(f"Failed to start agent {agent.name}: {e}")
            
            if not self.agents:
                logger.error("No agents started successfully")
                return False
            
            self.running = True
            
            # Publish system startup event
            await event_bus.publish(
                EventType.SYSTEM_STATUS,
                'orchestrator',
                {
                    'status': 'started',
                    'agents': list(self.agents.keys()),
                    'startup_time': self.startup_time.isoformat()
                }
            )
            
            logger.info(f"Multi-Agent System started with {len(self.agents)} agents")
            return True
            
        except Exception as e:
            logger.error(f"Failed to start Multi-Agent System: {e}")
            return False
    
    async def shutdown(self):
        """Shutdown all agents gracefully"""
        try:
            logger.info("Shutting down Multi-Agent System...")
            
            self.running = False
            
            # Stop all agents with timeout
            stop_tasks = []
            for agent in self.agents.values():
                stop_tasks.append(asyncio.wait_for(agent.stop(), timeout=10.0))
            
            if stop_tasks:
                # Use gather with timeout and exception handling
                results = await asyncio.gather(*stop_tasks, return_exceptions=True)
                
                # Log any errors during shutdown
                for i, result in enumerate(results):
                    if isinstance(result, Exception):
                        agent_name = list(self.agents.keys())[i]
                        logger.error(f"Error stopping {agent_name}: {result}")
            
            # Publish shutdown event
            event_bus.publish(
                EventType.SYSTEM_STATUS,
                'orchestrator',
                {'status': 'shutdown', 'agents': list(self.agents.keys())}
            )
            
            logger.info("Multi-Agent System shutdown complete")
            
        except Exception as e:
            logger.error(f"Error during shutdown: {e}")
    
    async def monitor_system(self):
        """Monitor system health and performance"""
        while self.running:
            try:
                # Perform health checks
                await self._perform_health_checks()
                
                # Log system status
                await self._log_system_status()
                
                # Wait before next check
                interval = config.get('health_check_interval', 300)  # 5 minutes default
                await asyncio.sleep(interval)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in system monitoring: {e}")
                await asyncio.sleep(60)  # Wait 1 minute on error
    
    async def _perform_health_checks(self):
        """Perform health checks on all agents"""
        health_results = []
        
        for agent_name, agent in self.agents.items():
            try:
                health = await agent.health_check()
                health_results.append(health)
                
                if not health.get('healthy', False):
                    logger.warning(f"Agent {agent_name} unhealthy: {health}")
                    
            except Exception as e:
                logger.error(f"Health check failed for {agent_name}: {e}")
        
        # Publish health check results
        await event_bus.publish(
            EventType.HEALTH_CHECK,
            'orchestrator',
            {'results': health_results, 'timestamp': datetime.now().isoformat()}
        )
    
    async def _log_system_status(self):
        """Log current system status"""
        try:
            status = self.get_system_status()
            
            # Log summary
            healthy_agents = sum(1 for a in status['agents'] if a['status']['status'] == AgentStatus.RUNNING)
            total_agents = len(status['agents'])
            
            uptime = status.get('orchestrator', {}).get('uptime_seconds', 0)
            logger.info(f"System Status: {healthy_agents}/{total_agents} agents running, uptime: {uptime:.0f}s")
            
        except Exception as e:
            logger.error(f"Failed to log system status: {e}")
    
    def get_system_status(self) -> Dict[str, Any]:
        """Get comprehensive system status"""
        try:
            agent_statuses = []
            for agent in self.agents.values():
                agent_statuses.append(agent.get_status())
            
            startup_time = getattr(self, 'startup_time', datetime.now())
            return {
                'orchestrator': {
                    'running': self.running,
                    'startup_time': startup_time.isoformat(),
                    'uptime_seconds': (datetime.now() - startup_time).total_seconds()
                },
                'agents': agent_statuses,
                'agent_count': len(self.agents),
                'system_healthy': all(
                    agent['status']['status'] == AgentStatus.RUNNING 
                    for agent in agent_statuses
                ),
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to get system status: {e}")
            return {
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    async def _handle_system_event(self, event):
        """Handle system-wide events"""
        try:
            logger.debug(f"System event from {event.source}: {event.data}")
            
            # Could implement system-wide reactions here
            # e.g., restart failed agents, adjust configurations, etc.
            
        except Exception as e:
            logger.error(f"Error handling system event: {e}")
    
    async def _handle_health_check(self, event):
        """Handle health check events"""
        try:
            logger.debug(f"Health check event: {event.data}")
            
            # Could implement automated remediation here
            # e.g., restart unhealthy agents, alert monitoring systems, etc.
            
        except Exception as e:
            logger.error(f"Error handling health check event: {e}")

async def main():
    """Main entry point"""
    try:
        # Setup logging
        logger.add(
            "logs/orchestrator.log",
            rotation="10 MB",
            retention="30 days",
            level="INFO"
        )
        
        # Create and start orchestrator
        orchestrator = MultiAgentOrchestrator()
        
        # Start the system
        if await orchestrator.start():
            # Run monitoring loop
            await orchestrator.monitor_system()
        else:
            logger.error("Failed to start Multi-Agent System")
            sys.exit(1)
    
    except KeyboardInterrupt:
        logger.info("Received keyboard interrupt")
    except Exception as e:
        logger.error(f"Orchestrator error: {e}")
        sys.exit(1)
    finally:
        if 'orchestrator' in locals():
            await orchestrator.shutdown()

if __name__ == "__main__":
    asyncio.run(main())