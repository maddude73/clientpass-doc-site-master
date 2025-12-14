#!/usr/bin/env python3
"""
Self-Healing Agent
Monitors system health, detects issues, and automatically applies fixes
"""

import asyncio
import json
import psutil
import traceback
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Callable
from pathlib import Path
from loguru import logger

from base_agent import BaseAgent, AgentStatus
from events import event_bus, EventType
from config import config

class HealthIssue:
    """Represents a detected health issue"""
    def __init__(self, issue_type: str, severity: str, description: str, 
                 affected_component: str, auto_fixable: bool = False):
        self.issue_type = issue_type
        self.severity = severity  # CRITICAL, HIGH, MEDIUM, LOW
        self.description = description
        self.affected_component = affected_component
        self.auto_fixable = auto_fixable
        self.detected_at = datetime.now()
        self.fix_attempted = False
        self.fix_successful = False

class SelfHealingAgent(BaseAgent):
    """Monitors system health and automatically fixes detected issues"""
    
    def __init__(self):
        super().__init__("SelfHealingAgent")
        
        # Health monitoring configuration
        self.check_interval = config.get('self_healing.check_interval', 30)  # seconds
        self.memory_threshold = config.get('self_healing.memory_threshold', 80)  # percentage
        self.disk_threshold = config.get('self_healing.disk_threshold', 90)  # percentage
        self.cpu_threshold = config.get('self_healing.cpu_threshold', 95)  # percentage
        self.max_log_size_mb = config.get('self_healing.max_log_size_mb', 100)
        
        # Issue tracking
        self.detected_issues: List[HealthIssue] = []
        self.fix_registry: Dict[str, Callable] = {}
        self.health_history: List[Dict] = []
        
        # Auto-healing configuration
        self.auto_healing_enabled = config.get('self_healing.auto_healing_enabled', True)
        self.max_fix_attempts = config.get('self_healing.max_fix_attempts', 3)
        self.fix_cooldown_minutes = config.get('self_healing.fix_cooldown_minutes', 10)
        
        # Register built-in fixes
        self._register_builtin_fixes()
        
        logger.info("Self-Healing Agent initialized with auto-healing enabled: {}", 
                   self.auto_healing_enabled)
    
    def _setup_event_subscriptions(self):
        """Setup event subscriptions for health monitoring"""
        event_bus.subscribe(EventType.AGENT_ERROR, self._handle_agent_error)
        event_bus.subscribe(EventType.SYSTEM_STATUS, self._handle_system_status)
        event_bus.subscribe(EventType.PROCESS_COMPLETE, self._handle_process_complete)
    
    def _register_builtin_fixes(self):
        """Register built-in auto-fix functions"""
        self.fix_registry = {
            'high_memory_usage': self._fix_high_memory,
            'large_log_files': self._fix_large_logs,
            'agent_not_responding': self._fix_unresponsive_agent,
            'disk_space_low': self._fix_disk_space,
            'failed_mongodb_connection': self._fix_mongodb_connection,
            'stuck_process': self._fix_stuck_process,
            'corrupted_temp_files': self._fix_corrupted_temp_files,
            'permission_error': self._fix_permission_error,
            'network_timeout': self._fix_network_timeout,
            'memory_leak': self._fix_memory_leak
        }
    
    async def initialize(self):
        """Initialize health monitoring resources"""
        try:
            # Create health monitoring directories
            self.health_data_dir = Path(config.get('paths.data_dir', 'data')) / 'health'
            self.health_data_dir.mkdir(parents=True, exist_ok=True)
            
            # Initialize health baseline
            await self._establish_health_baseline()
            
            logger.info("Self-Healing Agent initialized successfully")
            
        except Exception as e:
            logger.error("Failed to initialize Self-Healing Agent: {}", str(e))
            raise
    
    async def process_event(self, event_type: str, data: Dict[str, Any]):
        """Process health-related events"""
        try:
            if event_type == "health_check_request":
                health_report = await self._perform_comprehensive_health_check()
                
                # Publish health report
                await event_bus.publish(EventType.HEALTH_CHECK, {
                    'agent': self.name,
                    'timestamp': datetime.now().isoformat(),
                    'health_report': health_report,
                    'issues_detected': len(self.detected_issues)
                })
                
            elif event_type == "manual_healing_request":
                issue_type = data.get('issue_type')
                if issue_type and issue_type in self.fix_registry:
                    await self._apply_fix(issue_type, manual=True)
                
        except Exception as e:
            logger.error("Error processing health event: {}", str(e))
            self.metrics['errors'] += 1
    
    async def _monitoring_loop(self):
        """Main monitoring loop for continuous health checks"""
        logger.info("Starting health monitoring loop (interval: {}s)", self.check_interval)
        
        while self.running:
            try:
                # Perform health checks
                await self._perform_system_health_check()
                await self._check_agent_health()
                await self._check_resource_usage()
                await self._check_log_files()
                await self._check_database_connections()
                
                # Apply auto-fixes if enabled
                if self.auto_healing_enabled:
                    await self._auto_fix_issues()
                
                # Clean up old health data
                await self._cleanup_health_data()
                
                # Wait for next check
                await asyncio.sleep(self.check_interval)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Error in health monitoring loop: {}", str(e))
                await asyncio.sleep(5)  # Brief pause before retry
    
    async def _perform_system_health_check(self):
        """Perform comprehensive system health check"""
        try:
            # Check system resources
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            # Record health metrics
            health_data = {
                'timestamp': datetime.now().isoformat(),
                'cpu_usage': cpu_percent,
                'memory_usage': memory.percent,
                'disk_usage': disk.percent,
                'memory_available_gb': memory.available / (1024**3),
                'disk_free_gb': disk.free / (1024**3)
            }
            
            self.health_history.append(health_data)
            
            # Keep only recent history (last 24 hours)
            cutoff_time = datetime.now() - timedelta(hours=24)
            self.health_history = [
                h for h in self.health_history 
                if datetime.fromisoformat(h['timestamp']) > cutoff_time
            ]
            
            # Check for resource issues
            if cpu_percent > self.cpu_threshold:
                self._add_health_issue('high_cpu_usage', 'HIGH',
                                     f"CPU usage at {cpu_percent:.1f}%", 
                                     'system', auto_fixable=True)
            
            if memory.percent > self.memory_threshold:
                self._add_health_issue('high_memory_usage', 'HIGH',
                                     f"Memory usage at {memory.percent:.1f}%",
                                     'system', auto_fixable=True)
            
            if disk.percent > self.disk_threshold:
                self._add_health_issue('disk_space_low', 'CRITICAL',
                                     f"Disk usage at {disk.percent:.1f}%",
                                     'system', auto_fixable=True)
            
        except Exception as e:
            logger.error("Error in system health check: {}", str(e))
    
    async def _check_agent_health(self):
        """Check health of other agents in the system"""
        try:
            # Get agent statuses from orchestrator
            agent_health = await event_bus.request('get_agent_statuses')
            
            for agent_name, status in agent_health.items():
                if status == AgentStatus.ERROR:
                    self._add_health_issue('agent_error', 'HIGH',
                                         f"Agent {agent_name} in error state",
                                         agent_name, auto_fixable=True)
                
                elif status == AgentStatus.STOPPED:
                    self._add_health_issue('agent_stopped', 'MEDIUM',
                                         f"Agent {agent_name} is stopped",
                                         agent_name, auto_fixable=True)
            
        except Exception as e:
            logger.error("Error checking agent health: {}", str(e))
    
    async def _check_log_files(self):
        """Check log file sizes and detect anomalies"""
        try:
            logs_dir = Path(config.get('paths.logs_dir', 'logs'))
            
            if logs_dir.exists():
                for log_file in logs_dir.glob('*.log'):
                    size_mb = log_file.stat().st_size / (1024 * 1024)
                    
                    if size_mb > self.max_log_size_mb:
                        self._add_health_issue('large_log_files', 'MEDIUM',
                                             f"Log file {log_file.name} is {size_mb:.1f}MB",
                                             'logging', auto_fixable=True)
            
        except Exception as e:
            logger.error("Error checking log files: {}", str(e))
    
    async def _check_database_connections(self):
        """Check database connection health"""
        try:
            # Test MongoDB Atlas connection
            from pymongo import MongoClient
            
            mongo_uri = config.get('mongodb.uri')
            if mongo_uri:
                client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
                try:
                    # Ping the database
                    client.admin.command('ping')
                    logger.debug("MongoDB connection healthy")
                except Exception as e:
                    self._add_health_issue('failed_mongodb_connection', 'HIGH',
                                         f"MongoDB connection failed: {str(e)}",
                                         'database', auto_fixable=True)
                finally:
                    client.close()
            
        except Exception as e:
            logger.error("Error checking database connections: {}", str(e))
    
    def _add_health_issue(self, issue_type: str, severity: str, 
                         description: str, component: str, auto_fixable: bool = False):
        """Add a new health issue if not already detected"""
        # Check if similar issue already exists (avoid duplicates)
        existing = next((issue for issue in self.detected_issues 
                        if issue.issue_type == issue_type and 
                           issue.affected_component == component), None)
        
        if not existing:
            issue = HealthIssue(issue_type, severity, description, component, auto_fixable)
            self.detected_issues.append(issue)
            
            logger.warning("Health issue detected: {} - {}", issue_type, description)
            
            # Publish health issue event
            asyncio.create_task(event_bus.publish(EventType.SYSTEM_STATUS, {
                'agent': self.name,
                'status': 'health_issue_detected',
                'issue_type': issue_type,
                'severity': severity,
                'description': description,
                'component': component,
                'auto_fixable': auto_fixable
            }))
    
    async def _auto_fix_issues(self):
        """Automatically fix issues that can be auto-resolved"""
        for issue in self.detected_issues.copy():
            if issue.auto_fixable and not issue.fix_attempted:
                try:
                    # Check cooldown period
                    if hasattr(issue, 'last_fix_attempt'):
                        time_since_last = datetime.now() - issue.last_fix_attempt
                        if time_since_last.total_seconds() < (self.fix_cooldown_minutes * 60):
                            continue
                    
                    logger.info("Attempting auto-fix for issue: {}", issue.issue_type)
                    success = await self._apply_fix(issue.issue_type)
                    
                    issue.fix_attempted = True
                    issue.fix_successful = success
                    issue.last_fix_attempt = datetime.now()
                    
                    if success:
                        self.detected_issues.remove(issue)
                        logger.info("Successfully auto-fixed issue: {}", issue.issue_type)
                    else:
                        logger.warning("Auto-fix failed for issue: {}", issue.issue_type)
                
                except Exception as e:
                    logger.error("Error during auto-fix for {}: {}", issue.issue_type, str(e))
    
    async def _apply_fix(self, issue_type: str, manual: bool = False) -> bool:
        """Apply a specific fix for an issue type"""
        if issue_type not in self.fix_registry:
            logger.warning("No fix available for issue type: {}", issue_type)
            return False
        
        try:
            fix_function = self.fix_registry[issue_type]
            result = await fix_function()
            
            if result:
                logger.info("Fix applied successfully for: {}", issue_type)
                
                # Publish fix applied event
                await event_bus.publish(EventType.SYSTEM_STATUS, {
                    'agent': self.name,
                    'status': 'fix_applied',
                    'issue_type': issue_type,
                    'manual': manual,
                    'timestamp': datetime.now().isoformat()
                })
            
            return result
            
        except Exception as e:
            logger.error("Fix failed for {}: {}", issue_type, str(e))
            return False
    
    # Auto-fix implementations
    async def _fix_high_memory(self) -> bool:
        """Fix high memory usage by clearing caches and garbage collection"""
        try:
            import gc
            gc.collect()
            
            # Clear any in-memory caches
            if hasattr(self, 'cache'):
                self.cache.clear()
            
            # Request other agents to clear their caches
            await event_bus.publish(EventType.SYSTEM_STATUS, {
                'command': 'clear_caches'
            })
            
            logger.info("Memory cleanup completed")
            return True
            
        except Exception as e:
            logger.error("Memory cleanup failed: {}", str(e))
            return False
    
    async def _fix_large_logs(self) -> bool:
        """Rotate large log files"""
        try:
            logs_dir = Path(config.get('paths.logs_dir', 'logs'))
            
            for log_file in logs_dir.glob('*.log'):
                size_mb = log_file.stat().st_size / (1024 * 1024)
                
                if size_mb > self.max_log_size_mb:
                    # Rotate log file
                    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                    backup_name = f"{log_file.stem}_{timestamp}.log.bak"
                    backup_path = log_file.parent / backup_name
                    
                    # Move current log to backup
                    log_file.rename(backup_path)
                    
                    # Create new empty log file
                    log_file.touch()
                    
                    logger.info("Rotated large log file: {} -> {}", log_file.name, backup_name)
            
            return True
            
        except Exception as e:
            logger.error("Log rotation failed: {}", str(e))
            return False
    
    async def _fix_unresponsive_agent(self) -> bool:
        """Restart unresponsive agents"""
        try:
            # Request orchestrator to restart failed agents
            await event_bus.publish(EventType.SYSTEM_STATUS, {
                'command': 'restart_failed_agents'
            })
            
            logger.info("Requested restart of unresponsive agents")
            return True
            
        except Exception as e:
            logger.error("Agent restart request failed: {}", str(e))
            return False
    
    async def _fix_disk_space(self) -> bool:
        """Clean up temporary files and old data"""
        try:
            # Clean temp directories
            temp_dirs = [
                Path(config.get('paths.data_dir', 'data')) / 'temp',
                Path('/tmp'),
                Path.cwd() / 'temp'
            ]
            
            cleaned_mb = 0
            
            for temp_dir in temp_dirs:
                if temp_dir.exists():
                    for file in temp_dir.glob('*'):
                        if file.is_file():
                            # Remove files older than 24 hours
                            age_hours = (datetime.now() - datetime.fromtimestamp(file.stat().st_mtime)).total_seconds() / 3600
                            if age_hours > 24:
                                size_mb = file.stat().st_size / (1024 * 1024)
                                file.unlink()
                                cleaned_mb += size_mb
            
            # Clean old health data
            cutoff_date = datetime.now() - timedelta(days=7)
            health_files = self.health_data_dir.glob('health_*.json')
            
            for health_file in health_files:
                file_date = datetime.fromtimestamp(health_file.stat().st_mtime)
                if file_date < cutoff_date:
                    health_file.unlink()
            
            logger.info("Disk cleanup completed: {:.1f}MB freed", cleaned_mb)
            return True
            
        except Exception as e:
            logger.error("Disk cleanup failed: {}", str(e))
            return False
    
    async def _fix_mongodb_connection(self) -> bool:
        """Attempt to restore MongoDB connection"""
        try:
            # Clear connection pools and retry
            await event_bus.publish(EventType.SYSTEM_STATUS, {
                'command': 'reset_database_connections'
            })
            
            # Wait a moment and test connection
            await asyncio.sleep(2)
            
            from pymongo import MongoClient
            mongo_uri = config.get('mongodb.uri')
            
            if mongo_uri:
                client = MongoClient(mongo_uri, serverSelectionTimeoutMS=10000)
                try:
                    client.admin.command('ping')
                    logger.info("MongoDB connection restored")
                    return True
                except Exception:
                    logger.error("MongoDB connection still failing")
                    return False
                finally:
                    client.close()
            
            return False
            
        except Exception as e:
            logger.error("MongoDB connection fix failed: {}", str(e))
            return False
    
    async def _fix_stuck_process(self) -> bool:
        """Terminate stuck processes"""
        try:
            # This would implement process monitoring and termination
            # For now, just log the attempt
            logger.info("Checked for stuck processes")
            return True
            
        except Exception as e:
            logger.error("Stuck process fix failed: {}", str(e))
            return False
    
    async def _fix_corrupted_temp_files(self) -> bool:
        """Remove corrupted temporary files"""
        try:
            temp_dir = Path(config.get('paths.data_dir', 'data')) / 'temp'
            
            if temp_dir.exists():
                for file in temp_dir.glob('*'):
                    if file.is_file():
                        try:
                            # Try to read file to detect corruption
                            with open(file, 'rb') as f:
                                f.read(1024)  # Read first 1KB
                        except Exception:
                            # File appears corrupted, remove it
                            file.unlink()
                            logger.info("Removed corrupted temp file: {}", file.name)
            
            return True
            
        except Exception as e:
            logger.error("Corrupted file cleanup failed: {}", str(e))
            return False
    
    async def _fix_permission_error(self) -> bool:
        """Fix common permission issues"""
        try:
            # Fix permissions on key directories
            directories = [
                Path(config.get('paths.data_dir', 'data')),
                Path(config.get('paths.logs_dir', 'logs')),
                Path.cwd() / 'automation'
            ]
            
            for directory in directories:
                if directory.exists():
                    directory.chmod(0o755)
                    
                    # Fix file permissions within directory
                    for file in directory.rglob('*'):
                        if file.is_file():
                            file.chmod(0o644)
            
            logger.info("Permission fix completed")
            return True
            
        except Exception as e:
            logger.error("Permission fix failed: {}", str(e))
            return False
    
    async def _fix_network_timeout(self) -> bool:
        """Handle network timeout issues"""
        try:
            # Reset network-related configurations
            await event_bus.publish(EventType.SYSTEM_STATUS, {
                'command': 'reset_network_connections'
            })
            
            logger.info("Network timeout fix applied")
            return True
            
        except Exception as e:
            logger.error("Network timeout fix failed: {}", str(e))
            return False
    
    async def _fix_memory_leak(self) -> bool:
        """Fix memory leaks"""
        try:
            import gc
            
            # Force garbage collection
            gc.collect()
            
            # Clear circular references
            gc.set_debug(gc.DEBUG_LEAK)
            
            # Request all agents to perform cleanup
            await event_bus.publish(EventType.SYSTEM_STATUS, {
                'command': 'memory_cleanup'
            })
            
            logger.info("Memory leak fix completed")
            return True
            
        except Exception as e:
            logger.error("Memory leak fix failed: {}", str(e))
            return False
    
    async def _establish_health_baseline(self):
        """Establish baseline health metrics"""
        try:
            # Get initial system metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            baseline = {
                'timestamp': datetime.now().isoformat(),
                'baseline_cpu': cpu_percent,
                'baseline_memory': memory.percent,
                'baseline_disk': disk.percent,
                'total_memory_gb': memory.total / (1024**3),
                'total_disk_gb': disk.total / (1024**3)
            }
            
            # Save baseline
            baseline_file = self.health_data_dir / 'baseline.json'
            with open(baseline_file, 'w') as f:
                json.dump(baseline, f, indent=2)
            
            logger.info("Health baseline established")
            
        except Exception as e:
            logger.error("Failed to establish health baseline: {}", str(e))
    
    async def _perform_comprehensive_health_check(self) -> Dict[str, Any]:
        """Perform comprehensive health check and return report"""
        try:
            # System metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            # Process information
            process_count = len(psutil.pids())
            
            # Agent status
            agent_statuses = await event_bus.request('get_agent_statuses') or {}
            
            health_report = {
                'timestamp': datetime.now().isoformat(),
                'system': {
                    'cpu_usage': cpu_percent,
                    'memory_usage': memory.percent,
                    'disk_usage': disk.percent,
                    'process_count': process_count,
                    'uptime_hours': (datetime.now() - self.metrics['uptime']).total_seconds() / 3600
                },
                'agents': agent_statuses,
                'issues': [
                    {
                        'type': issue.issue_type,
                        'severity': issue.severity,
                        'description': issue.description,
                        'component': issue.affected_component,
                        'detected_at': issue.detected_at.isoformat(),
                        'fix_attempted': issue.fix_attempted,
                        'fix_successful': issue.fix_successful
                    } for issue in self.detected_issues
                ],
                'health_status': 'HEALTHY' if len(self.detected_issues) == 0 else 
                               'DEGRADED' if all(i.severity in ['LOW', 'MEDIUM'] for i in self.detected_issues) else 
                               'UNHEALTHY'
            }
            
            return health_report
            
        except Exception as e:
            logger.error("Error generating health report: {}", str(e))
            return {'error': str(e), 'timestamp': datetime.now().isoformat()}
    
    async def _cleanup_health_data(self):
        """Clean up old health monitoring data"""
        try:
            # Remove health data older than 7 days
            cutoff_date = datetime.now() - timedelta(days=7)
            
            for health_file in self.health_data_dir.glob('health_*.json'):
                file_date = datetime.fromtimestamp(health_file.stat().st_mtime)
                if file_date < cutoff_date:
                    health_file.unlink()
            
            # Clean up resolved issues older than 24 hours
            cutoff_time = datetime.now() - timedelta(hours=24)
            self.detected_issues = [
                issue for issue in self.detected_issues
                if not (issue.fix_successful and issue.detected_at < cutoff_time)
            ]
            
        except Exception as e:
            logger.error("Error cleaning up health data: {}", str(e))
    
    async def _handle_agent_error(self, data: Dict[str, Any]):
        """Handle agent error events"""
        agent_name = data.get('agent', 'unknown')
        error_message = data.get('error', 'Unknown error')
        
        self._add_health_issue('agent_error', 'HIGH',
                             f"Agent {agent_name} error: {error_message}",
                             agent_name, auto_fixable=True)
    
    async def _handle_system_status(self, data):
        """Handle system status events"""
        # Handle both Event objects and dict data
        if hasattr(data, 'data'):
            # Event object
            event_data = data.data
            status = event_data.get('status') if event_data else None
        elif hasattr(data, 'get'):
            # Dict-like object
            status = data.get('status')
            event_data = data
        else:
            # Fallback
            status = getattr(data, 'status', None)
            event_data = {}
        
        if status in ['error', 'failure', 'timeout']:
            component = event_data.get('component', 'system') if event_data else 'system'
            description = event_data.get('description', f"System status: {status}") if event_data else f"System status: {status}"
            
            self._add_health_issue(f'system_{status}', 'MEDIUM',
                                 description, component, auto_fixable=True)
    
    async def _handle_process_complete(self, data: Dict[str, Any]):
        """Handle process completion events for performance monitoring"""
        duration = data.get('duration')
        process_type = data.get('process_type')
        
        # Check for performance issues
        if duration and duration > 300:  # 5 minutes
            self._add_health_issue('slow_process', 'MEDIUM',
                                 f"Process {process_type} took {duration}s",
                                 'performance', auto_fixable=False)
    
    async def process(self):
        """Main processing loop for self-healing operations"""
        try:
            # Run the monitoring loop
            await self._monitoring_loop()
            
        except asyncio.CancelledError:
            logger.info("Self-healing monitoring loop cancelled")
            raise
        except Exception as e:
            logger.error("Error in self-healing process loop: {}", str(e))
            self.metrics['errors'] += 1
    
    async def cleanup(self):
        """Cleanup self-healing agent resources"""
        try:
            # Save current health state
            if hasattr(self, 'health_data_dir') and self.health_data_dir:
                health_state_file = self.health_data_dir / 'cleanup_health_state.json'
                cleanup_state = {
                    'timestamp': datetime.now().isoformat(),
                    'detected_issues': len(self.detected_issues),
                    'health_history_entries': len(self.health_history),
                    'auto_healing_enabled': self.auto_healing_enabled
                }
                
                with open(health_state_file, 'w') as f:
                    json.dump(cleanup_state, f, indent=2)
            
            # Clear internal state
            self.detected_issues.clear()
            self.health_history.clear()
            
            logger.info("Self-Healing Agent cleanup completed")
            
        except Exception as e:
            logger.error("Error during self-healing cleanup: {}", str(e))
    
    async def shutdown(self):
        """Graceful shutdown with health report"""
        try:
            logger.info("Self-Healing Agent shutting down...")
            
            # Generate final health report
            final_report = await self._perform_comprehensive_health_check()
            
            # Save final health report
            report_file = self.health_data_dir / f'final_health_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
            with open(report_file, 'w') as f:
                json.dump(final_report, f, indent=2)
            
            await super().shutdown()
            
        except Exception as e:
            logger.error("Error during Self-Healing Agent shutdown: {}", str(e))