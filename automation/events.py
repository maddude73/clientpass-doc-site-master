#!/usr/bin/env python3
"""
Event Bus System for Multi-Agent Communication
Handles inter-agent messaging and event distribution
"""

import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Callable, Any
from dataclasses import dataclass
from enum import Enum

class EventType(Enum):
    # Repository and File Change Events
    REPO_CHANGE_DETECTED = "repo_change_detected"
    SOURCE_REPO_CHANGE_DETECTED = "source_repo_change_detected"
    FILE_CHANGE = "file_change"
    GIT_CHANGE = "git_change"
    CHANGE_DETECTION = "change_detection"
    
    # Document Events
    DOCUMENT_CREATED = "document_created"
    DOCUMENT_UPDATED = "document_updated"
    DOCUMENT_DELETED = "document_deleted"
    DOCUMENT_PROCESSING = "document_processing"
    
    # RAG and Embedding Events
    RAG_UPDATE_REQUIRED = "rag_update_required"
    RAG_UPDATE = "rag_update"
    EMBEDDING_UPDATED = "embedding_updated"
    
    # System Events
    SYSTEM_STATUS = "system_status"
    HEALTH_CHECK = "health_check"
    ERROR = "error"
    ERROR_OCCURRED = "error_occurred"
    AGENT_ERROR = "agent_error"
    PROCESS_COMPLETE = "process_complete"
    
    # Maintenance Events
    DAILY_MAINTENANCE = "daily_maintenance"

@dataclass
class Event:
    type: EventType
    source: str
    data: Dict[str, Any]
    timestamp: datetime
    event_id: str = None

    def __post_init__(self):
        if self.event_id is None:
            self.event_id = f"{self.type.value}_{int(self.timestamp.timestamp())}"

class EventBus:
    def __init__(self):
        self.subscribers: Dict[EventType, List[Callable]] = {}
        self.recent_events: List[Event] = []
        self.max_recent_events = 100
        self.logger = logging.getLogger(__name__)

    def subscribe(self, event_type: EventType, handler: Callable):
        """Subscribe to an event type with a handler function"""
        if event_type not in self.subscribers:
            self.subscribers[event_type] = []
        self.subscribers[event_type].append(handler)
        self.logger.debug(f"Subscribed handler to {event_type.value}")

    def unsubscribe(self, event_type: EventType, handler: Callable):
        """Unsubscribe a handler from an event type"""
        if event_type in self.subscribers:
            try:
                self.subscribers[event_type].remove(handler)
                self.logger.debug(f"Unsubscribed handler from {event_type.value}")
            except ValueError:
                pass

    async def publish(self, event_type: EventType, source: str, data: Dict[str, Any] = None):
        """Publish an event to all subscribers"""
        if data is None:
            data = {}
            
        event = Event(
            type=event_type,
            source=source,
            data=data,
            timestamp=datetime.now()
        )
        
        # Store in recent events
        self.recent_events.append(event)
        if len(self.recent_events) > self.max_recent_events:
            self.recent_events.pop(0)
        
        self.logger.info(f"Publishing event: {event_type.value} from {source}")
        
        # Notify subscribers
        if event_type in self.subscribers:
            for handler in self.subscribers[event_type]:
                try:
                    if asyncio.iscoroutinefunction(handler):
                        await handler(event)
                    else:
                        handler(event)
                except Exception as e:
                    self.logger.error(f"Error in event handler: {e}")

    def get_recent_events(self, limit: int = None) -> List[Event]:
        """Get recent events"""
        if limit:
            return self.recent_events[-limit:]
        return self.recent_events.copy()

    def get_subscriber_count(self) -> Dict[str, int]:
        """Get count of subscribers per event type"""
        return {
            event_type.value: len(handlers) 
            for event_type, handlers in self.subscribers.items()
        }

# Global event bus instance
event_bus = EventBus()