#!/usr/bin/env python3
"""
Base Agent Class for Multi-Agent System
Provides common functionality for all agents
"""

import asyncio
import signal
import uuid
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Dict, Any, Optional
from loguru import logger
from events import EventType
from redis_event_bus import event_bus_proxy
from config import config

class AgentStatus:
    STARTING = "starting"
    RUNNING = "running"  
    STOPPED = "stopped"
    ERROR = "error"

class BaseAgent(ABC):
    """Abstract base class for all agents in the system"""
    
    def __init__(self, name: str):
        self.name = name
        self.agent_id = str(uuid.uuid4())
        self.status = AgentStatus.STARTING
        self.last_activity = datetime.now()
        self.metrics = {
            'events_processed': 0,
            'errors': 0,
            'uptime': datetime.now()
        }
        self.running = False
        self.tasks = []
        self.consumers = []  # Track Redis consumers
        
        logger.info(f"Initialized {self.name} with ID {self.agent_id}")
    
    async def _setup_event_subscriptions(self):
        """Setup default event subscriptions - override in subclasses"""
        pass
    
    def subscribe_to_event(self, event_type: EventType, handler, **kwargs):
        """Subscribe to Redis events with proper consumer tracking"""
        consumer = event_bus_proxy.subscribe(
            event_type,
            handler,
            consumer_group=f"group_{self.name}_{event_type.value}",
            consumer_name=f"{self.name}_{self.agent_id[:8]}",
            **kwargs
        )
        self.consumers.append(consumer)
        return consumer
    
    async def publish_event(self, event_type: EventType, data: Dict[str, Any] = None):
        """Publish events through Redis event bus"""
        await event_bus_proxy.publish(event_type, self.name, data)
        self.increment_metric('events_published')
    
    @abstractmethod
    async def initialize(self):
        """Initialize agent-specific resources"""
        pass
    
    @abstractmethod
    async def process(self):
        """Main processing loop - implement in subclasses"""
        pass
    
    @abstractmethod
    async def cleanup(self):
        """Cleanup agent resources"""
        pass
    
    def get_status(self) -> Dict[str, Any]:
        """Get current agent status"""
        return {
            'name': self.name,
            'agent_id': self.agent_id,
            'status': {
                'status': self.status,
                'message': f"Agent {self.status}",
                'last_update': datetime.now()
            },
            'last_activity': self.last_activity.isoformat(),
            'metrics': {
                **self.metrics,
                'uptime': self.metrics['uptime']
            },
            'uptime_seconds': (datetime.now() - self.metrics['uptime']).total_seconds()
        }
    
    def update_activity(self):
        """Update last activity timestamp"""
        self.last_activity = datetime.now()
    
    def increment_metric(self, metric: str, value: int = 1):
        """Increment a metric counter"""
        if metric in self.metrics:
            self.metrics[metric] += value
        else:
            self.metrics[metric] = value
    
    async def start(self):
        """Start the agent"""
        try:
            logger.info(f"Starting {self.name}...")
            
            # Initialize Redis event bus
            await event_bus_proxy.initialize()
            
            # Setup event subscriptions
            await self._setup_event_subscriptions()
            
            # Initialize agent
            await self.initialize()
            
            self.running = True
            self.status = AgentStatus.RUNNING
            
            # Publish system status
            await event_bus_proxy.publish(
                EventType.SYSTEM_STATUS,
                self.name,
                {'status': 'started', 'agent_id': self.agent_id}
            )
            
            logger.info(f"Agent {self.name} started")
            
            # Start main processing loop
            process_task = asyncio.create_task(self._run_process_loop())
            self.tasks.append(process_task)
            
        except Exception as e:
            self.status = AgentStatus.ERROR
            self.increment_metric('errors')
            logger.error(f"Failed to start {self.name}: {e}")
            raise
    
    async def stop(self):
        """Stop the agent gracefully"""
        try:
            logger.info(f"Stopping {self.name}...")
            
            self.running = False
            self.status = AgentStatus.STOPPED
            
            # Stop Redis consumers
            for consumer in self.consumers:
                if hasattr(consumer, 'stop'):
                    consumer.stop()
            
            # Cancel all tasks
            for task in self.tasks:
                if not task.done():
                    task.cancel()
                    try:
                        await task
                    except asyncio.CancelledError:
                        pass
            
            # Cleanup resources
            await self.cleanup()
            
            # Publish system status
            await event_bus_proxy.publish(
                EventType.SYSTEM_STATUS,
                self.name,
                {'status': 'stopped', 'agent_id': self.agent_id}
            )
            
            logger.info(f"Agent {self.name} stopped")
            
        except Exception as e:
            logger.error(f"Error stopping {self.name}: {e}")
    
    async def _run_process_loop(self):
        """Internal processing loop"""
        while self.running:
            try:
                await self.process()
                self.update_activity()
                self.increment_metric('events_processed')
                
                # Small delay to prevent busy waiting
                await asyncio.sleep(0.1)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in {self.name} processing loop: {e}")
                self.increment_metric('errors')
                
                # Back off on errors
                await asyncio.sleep(5)
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform agent health check"""
        try:
            # Basic health indicators
            health = {
                'agent': self.name,
                'status': self.status,
                'running': self.running,
                'last_activity_ago': (datetime.now() - self.last_activity).total_seconds(),
                'error_rate': self.metrics.get('errors', 0) / max(self.metrics.get('events_processed', 1), 1),
                'healthy': True
            }
            
            # Check if agent is stale (no activity for too long)
            if health['last_activity_ago'] > config.get('health_check_interval', 300) * 2:
                health['healthy'] = False
                health['reason'] = 'No recent activity'
            
            # Check error rate
            if health['error_rate'] > 0.1:  # 10% error rate threshold
                health['healthy'] = False
                health['reason'] = 'High error rate'
            
            return health
            
        except Exception as e:
            logger.error(f"Health check failed for {self.name}: {e}")
            return {
                'agent': self.name,
                'healthy': False,
                'reason': f'Health check error: {e}'
            }