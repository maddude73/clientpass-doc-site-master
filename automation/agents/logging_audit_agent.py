#!/usr/bin/env python3
"""
Logging and Audit Agent
Manages system logs, audit trails, and monitoring
"""

import asyncio
import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional
from loguru import logger

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from base_agent import BaseAgent
from events import event_bus, EventType
from config import config

class LoggingAuditAgent(BaseAgent):
    """Manages logging, auditing, and system monitoring"""
    
    def __init__(self):
        super().__init__("LoggingAudit")
        
        # Configuration
        self.logs_path = Path(config.get('logging.logs_path', 'logs'))
        self.audit_path = Path(config.get('logging.audit_path', 'logs/audit'))
        self.log_retention_days = config.get('logging.retention_days', 30)
        self.audit_retention_days = config.get('logging.audit_retention_days', 90)
        
        # Audit tracking
        self.audit_queue = asyncio.Queue()
        self.system_events = []
        self.max_events_memory = config.get('logging.max_events_memory', 1000)
        
        # Statistics
        self.events_logged = 0
        self.audit_records_created = 0
        self.errors_detected = 0
        
        logger.info("LoggingAudit agent initialized")
    
    def _setup_event_subscriptions(self):
        """Setup event subscriptions"""
        # Listen to all event types for auditing
        for event_type in EventType:
            event_bus.subscribe(event_type, self._handle_audit_event)
    
    async def initialize(self):
        """Initialize the logging and audit agent"""
        try:
            # Ensure directories exist
            self.logs_path.mkdir(parents=True, exist_ok=True)
            self.audit_path.mkdir(parents=True, exist_ok=True)
            
            # Setup audit log file
            self.audit_log_file = self.audit_path / f"audit_{datetime.now().strftime('%Y%m%d')}.json"
            
            # Load recent audit events
            await self._load_recent_events()
            
            logger.info(f"LoggingAudit initialized with audit log: {self.audit_log_file}")
            
        except Exception as e:
            logger.error(f"Failed to initialize LoggingAudit: {e}")
            raise
    
    async def process(self):
        """Main processing loop"""
        try:
            # Process audit queue
            if not self.audit_queue.empty():
                try:
                    audit_task = await asyncio.wait_for(
                        self.audit_queue.get(),
                        timeout=1.0
                    )
                    await self._process_audit_task(audit_task)
                except asyncio.TimeoutError:
                    pass
            
            # Periodic maintenance
            current_hour = datetime.now().hour
            if current_hour == 2 and datetime.now().minute == 0:  # 2 AM daily
                await self._daily_maintenance()
            
            await asyncio.sleep(5)
            
        except Exception as e:
            logger.error(f"Error in LoggingAudit processing: {e}")
            raise
    
    async def cleanup(self):
        """Cleanup resources"""
        try:
            # Flush any pending audit records
            while not self.audit_queue.empty():
                task = await self.audit_queue.get()
                await self._process_audit_task(task)
            
            logger.info("LoggingAudit cleanup complete")
            
        except Exception as e:
            logger.error(f"Error during LoggingAudit cleanup: {e}")
    
    async def _load_recent_events(self):
        """Load recent audit events from disk"""
        try:
            if self.audit_log_file.exists():
                with open(self.audit_log_file, 'r') as f:
                    for line in f:
                        if line.strip():
                            event = json.loads(line.strip())
                            self.system_events.append(event)
                            
                            # Keep only recent events in memory
                            if len(self.system_events) > self.max_events_memory:
                                self.system_events.pop(0)
            
            logger.info(f"Loaded {len(self.system_events)} recent audit events")
            
        except Exception as e:
            logger.error(f"Failed to load recent events: {e}")
    
    async def _process_audit_task(self, task: Dict[str, Any]):
        """Process an audit task"""
        try:
            task_type = task.get('type')
            
            if task_type == 'log_event':
                await self._log_audit_event(task)
            elif task_type == 'analyze_logs':
                await self._analyze_system_logs()
            elif task_type == 'generate_report':
                await self._generate_audit_report(task)
            elif task_type == 'cleanup_old_logs':
                await self._cleanup_old_logs()
            else:
                logger.warning(f"Unknown audit task type: {task_type}")
            
        except Exception as e:
            logger.error(f"Failed to process audit task: {e}")
    
    async def _log_audit_event(self, task: Dict[str, Any]):
        """Log an audit event to disk and memory"""
        try:
            event_data = task.get('event_data', {})
            
            # Create audit record
            audit_record = {
                'timestamp': datetime.now().isoformat(),
                'event_type': event_data.get('event_type'),
                'source': event_data.get('source'),
                'data': event_data.get('data', {}),
                'severity': self._determine_severity(event_data),
                'agent_id': task.get('agent_id'),
                'session_id': config.get('system.session_id')
            }
            
            # Add to memory
            self.system_events.append(audit_record)
            if len(self.system_events) > self.max_events_memory:
                self.system_events.pop(0)
            
            # Write to audit log file
            with open(self.audit_log_file, 'a') as f:
                f.write(json.dumps(audit_record) + '\n')
            
            self.audit_records_created += 1
            
            # Check for error patterns
            if audit_record['severity'] in ['error', 'critical']:
                self.errors_detected += 1
                await self._handle_error_detected(audit_record)
            
        except Exception as e:
            logger.error(f"Failed to log audit event: {e}")
    
    def _determine_severity(self, event_data: Dict[str, Any]) -> str:
        """Determine the severity level of an event"""
        event_type = event_data.get('event_type')
        data = event_data.get('data', {})
        
        # Critical events
        if event_type == EventType.ERROR and 'critical' in str(data).lower():
            return 'critical'
        
        # Error events
        if event_type == EventType.ERROR:
            return 'error'
        
        # Warning events
        if (event_type == EventType.SYSTEM_STATUS and 
            data.get('status') in ['stopped', 'error']):
            return 'warning'
        
        # Info events
        return 'info'
    
    async def _handle_error_detected(self, audit_record: Dict[str, Any]):
        """Handle detected errors"""
        try:
            # Log error details
            logger.error(f"Error detected: {audit_record}")
            
            # Publish error notification
            event_bus.publish(
                EventType.ERROR,
                self.name,
                {
                    'error_type': 'system_error_detected',
                    'audit_record': audit_record,
                    'timestamp': datetime.now().isoformat()
                }
            )
            
        except Exception as e:
            logger.error(f"Failed to handle error detection: {e}")
    
    async def _analyze_system_logs(self):
        """Analyze system logs for patterns and insights"""
        try:
            # Analyze recent events
            recent_events = [e for e in self.system_events 
                           if (datetime.now() - datetime.fromisoformat(e['timestamp'])).seconds < 3600]
            
            # Count events by type
            event_counts = {}
            error_counts = {}
            
            for event in recent_events:
                event_type = event.get('event_type', 'unknown')
                event_counts[event_type] = event_counts.get(event_type, 0) + 1
                
                if event.get('severity') in ['error', 'critical']:
                    source = event.get('source', 'unknown')
                    error_counts[source] = error_counts.get(source, 0) + 1
            
            # Generate analysis report
            analysis = {
                'analysis_time': datetime.now().isoformat(),
                'recent_events_count': len(recent_events),
                'event_type_counts': event_counts,
                'error_counts_by_source': error_counts,
                'top_error_sources': sorted(error_counts.items(), key=lambda x: x[1], reverse=True)[:5],
                'system_health': 'healthy' if len(error_counts) == 0 else 'issues_detected'
            }
            
            # Log analysis
            logger.info(f"System analysis: {analysis['system_health']}, "
                       f"{len(recent_events)} recent events, "
                       f"{sum(error_counts.values())} errors")
            
            # Publish analysis
            event_bus.publish(
                EventType.SYSTEM_STATUS,
                self.name,
                {
                    'action': 'system_analysis',
                    'analysis': analysis,
                    'timestamp': datetime.now().isoformat()
                }
            )
            
        except Exception as e:
            logger.error(f"Failed to analyze system logs: {e}")
    
    async def _generate_audit_report(self, task: Dict[str, Any]):
        """Generate an audit report"""
        try:
            report_type = task.get('report_type', 'daily')
            
            # Determine time range
            if report_type == 'daily':
                start_time = datetime.now() - timedelta(days=1)
            elif report_type == 'weekly':
                start_time = datetime.now() - timedelta(days=7)
            elif report_type == 'monthly':
                start_time = datetime.now() - timedelta(days=30)
            else:
                start_time = datetime.now() - timedelta(days=1)
            
            # Filter events by time range
            filtered_events = [
                e for e in self.system_events
                if datetime.fromisoformat(e['timestamp']) >= start_time
            ]
            
            # Generate report
            report = {
                'report_type': report_type,
                'start_time': start_time.isoformat(),
                'end_time': datetime.now().isoformat(),
                'total_events': len(filtered_events),
                'events_by_type': {},
                'events_by_severity': {},
                'events_by_source': {},
                'error_summary': [],
                'system_metrics': {
                    'events_logged': self.events_logged,
                    'audit_records_created': self.audit_records_created,
                    'errors_detected': self.errors_detected
                }
            }
            
            # Aggregate data
            for event in filtered_events:
                event_type = event.get('event_type', 'unknown')
                severity = event.get('severity', 'info')
                source = event.get('source', 'unknown')
                
                report['events_by_type'][event_type] = report['events_by_type'].get(event_type, 0) + 1
                report['events_by_severity'][severity] = report['events_by_severity'].get(severity, 0) + 1
                report['events_by_source'][source] = report['events_by_source'].get(source, 0) + 1
                
                if severity in ['error', 'critical']:
                    report['error_summary'].append({
                        'timestamp': event['timestamp'],
                        'source': source,
                        'message': str(event.get('data', {}))
                    })
            
            # Save report
            report_file = self.audit_path / f"audit_report_{report_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(report_file, 'w') as f:
                json.dump(report, f, indent=2)
            
            logger.info(f"Generated {report_type} audit report: {report_file}")
            
            # Publish report
            event_bus.publish(
                EventType.SYSTEM_STATUS,
                self.name,
                {
                    'action': 'audit_report_generated',
                    'report_file': str(report_file),
                    'report_summary': {
                        'total_events': report['total_events'],
                        'errors': len(report['error_summary'])
                    },
                    'timestamp': datetime.now().isoformat()
                }
            )
            
        except Exception as e:
            logger.error(f"Failed to generate audit report: {e}")
    
    async def _cleanup_old_logs(self):
        """Cleanup old log files"""
        try:
            cleaned_files = 0
            
            # Clean old audit logs
            for audit_file in self.audit_path.glob("audit_*.json"):
                try:
                    file_age = (datetime.now() - datetime.fromtimestamp(audit_file.stat().st_mtime)).days
                    if file_age > self.audit_retention_days:
                        audit_file.unlink()
                        cleaned_files += 1
                except Exception as e:
                    logger.warning(f"Failed to clean audit file {audit_file}: {e}")
            
            # Clean old log files
            for log_file in self.logs_path.glob("*.log*"):
                try:
                    file_age = (datetime.now() - datetime.fromtimestamp(log_file.stat().st_mtime)).days
                    if file_age > self.log_retention_days:
                        log_file.unlink()
                        cleaned_files += 1
                except Exception as e:
                    logger.warning(f"Failed to clean log file {log_file}: {e}")
            
            if cleaned_files > 0:
                logger.info(f"Cleaned up {cleaned_files} old log files")
            
        except Exception as e:
            logger.error(f"Failed to cleanup old logs: {e}")
    
    async def _daily_maintenance(self):
        """Perform daily maintenance tasks"""
        try:
            logger.info("Starting daily logging maintenance")
            
            # Generate daily audit report
            await self.audit_queue.put({
                'type': 'generate_report',
                'report_type': 'daily'
            })
            
            # Analyze system logs
            await self.audit_queue.put({
                'type': 'analyze_logs'
            })
            
            # Cleanup old logs
            await self.audit_queue.put({
                'type': 'cleanup_old_logs'
            })
            
            logger.info("Daily logging maintenance queued")
            
        except Exception as e:
            logger.error(f"Failed to perform daily maintenance: {e}")
    
    async def _handle_audit_event(self, event):
        """Handle incoming events for auditing"""
        try:
            # Handle different event types - could be Event object or dict
            if hasattr(event, 'type') and hasattr(event, 'source'):
                # Event object
                event_type = event.type.value if hasattr(event.type, 'value') else str(event.type)
                source = getattr(event, 'source', 'unknown')
                data = getattr(event, 'data', {})
            elif hasattr(event, 'get'):
                # Dict-like event
                event_type = event.get('type', event.get('event_type', 'unknown'))
                source = event.get('source', 'unknown')
                data = event.get('data', {})
            else:
                # Fallback for other event formats
                event_type = str(getattr(event, 'type', getattr(event, 'event_type', 'unknown')))
                source = str(getattr(event, 'source', 'unknown'))
                data = getattr(event, 'data', {})
            
            # Queue event for audit logging
            await self.audit_queue.put({
                'type': 'log_event',
                'event_data': {
                    'event_type': event_type,
                    'source': source,
                    'data': data
                },
                'agent_id': getattr(event, 'agent_id', None)
            })
            
            self.events_logged += 1
            
        except Exception as e:
            logger.error(f"Failed to handle audit event: {e}")
    
    def get_audit_summary(self) -> Dict[str, Any]:
        """Get a summary of audit information"""
        try:
            recent_errors = [
                e for e in self.system_events
                if e.get('severity') in ['error', 'critical'] and
                (datetime.now() - datetime.fromisoformat(e['timestamp'])).seconds < 3600
            ]
            
            return {
                'total_events_logged': self.events_logged,
                'audit_records_created': self.audit_records_created,
                'errors_detected': self.errors_detected,
                'recent_errors_count': len(recent_errors),
                'system_events_in_memory': len(self.system_events),
                'audit_log_file': str(self.audit_log_file),
                'last_maintenance': config.get('logging.last_maintenance'),
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to get audit summary: {e}")
            return {'error': str(e)}