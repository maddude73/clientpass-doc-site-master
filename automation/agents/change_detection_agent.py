#!/usr/bin/env python3
"""
Change Detection Agent
Monitors file system changes and Git repository for documentation updates
"""

import asyncio
import json
import os
import subprocess
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Set, Any
from loguru import logger

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from base_agent import BaseAgent
from events import EventType
from redis_event_bus import event_bus_proxy as event_bus
from config import config

class ChangeDetectionAgent(BaseAgent):
    """Detects changes in files and Git repository"""
    
    def __init__(self):
        super().__init__("ChangeDetection")
        
        # Configuration
        self.watch_paths = config.get('change_detection.watch_paths', ['public/docs/', 'src/'])
        self.file_extensions = config.get('change_detection.file_extensions', ['.md', '.tsx', '.ts', '.js'])
        self.check_interval = config.get('change_detection.check_interval', 5)  # seconds - reduced for testing
        self.git_check_interval = config.get('change_detection.git_check_interval', 300)  # 5 minutes
        
        # State tracking
        self.file_checksums: Dict[str, str] = {}
        self.last_git_check = datetime.now() - timedelta(seconds=self.git_check_interval)
        self.last_commit_hash = None
        
        logger.info(f"ChangeDetection agent configured to watch: {self.watch_paths}")
    
    async def _setup_event_subscriptions(self):
        """Setup event subscriptions"""
        # Listen for manual change detection requests
        self.subscribe_to_event(EventType.CHANGE_DETECTION, self._handle_change_request)
        # Listen for source repository changes
        self.subscribe_to_event(EventType.SOURCE_REPO_CHANGE_DETECTED, self._handle_source_repo_change)
    
    async def initialize(self):
        """Initialize the change detection agent"""
        try:
            logger.info("🔧 ================================")
            logger.info("🔧 INITIALIZING ChangeDetection")
            logger.info("🔧 ================================")
            
            # Get initial file state
            logger.info("📁 Scanning file system...")
            self.file_checksums = await self._scan_files()
            
            # Get initial git state
            logger.info("🔍 Checking Git repository state...")
            await self._check_git_changes()
            
            logger.success(f"✅ ChangeDetection initialized with {len(self.file_checksums)} tracked files")
            logger.info("🎯 Agent ready to detect changes!")
            
        except Exception as e:
            logger.error(f"Failed to initialize ChangeDetection: {e}")
            raise
    
    async def process(self):
        """Main processing loop"""
        while self.running:
            try:
                logger.info("🔄 ChangeDetection processing cycle...")
                
                # Check for file changes
                file_changes = await self._detect_file_changes()
                if file_changes:
                    logger.info(f"🎯 Processing {len(file_changes)} file changes")
                    await self._handle_file_changes(file_changes)
                
                # Check for git changes (less frequent)
                if (datetime.now() - self.last_git_check).total_seconds() >= self.git_check_interval:
                    git_changes = await self._check_git_changes()
                    if git_changes:
                        await self._handle_git_changes(git_changes)
                    self.last_git_check = datetime.now()
                
                # Check for trigger file every cycle - use multiple paths
                trigger_files = [
                    "/Users/rhfluker/Projects/clientpass-doc-site-master/automation/TRIGGER_SOURCE_PROCESSING",
                    "/Users/rhfluker/Projects/clientpass-doc-site-master/TRIGGER_NOW",
                    "./TRIGGER_NOW"
                ]
                
                for trigger_file in trigger_files:
                    if os.path.exists(trigger_file):
                        logger.success(f"🎯 *** TRIGGER FILE FOUND: {trigger_file} ***")
                        await self._process_trigger_file(trigger_file)
                        break
                
                # Wait before next check
                await asyncio.sleep(self.check_interval)
                
            except Exception as e:
                logger.error(f"Error in ChangeDetection processing: {e}")
                await asyncio.sleep(1)  # Brief pause before retrying
    
    async def _process_trigger_file(self, trigger_file_path):
        """Process the trigger file for source repository changes"""
        try:
            with open(trigger_file_path, 'r') as f:
                trigger_data = json.loads(f.read())
            
            # Remove trigger file
            os.remove(trigger_file_path)
            logger.info("🗑️ Removed trigger file")
            
            # Process the source commits from trigger file
            source_commits = trigger_data.get('source_commits', [])
            logger.success(f"📦 *** PROCESSING {len(source_commits)} SOURCE REPOSITORY COMMITS ***")
            logger.info("📋 REAL COMMIT DETAILS FROM NOV 8TH:")
            
            for i, commit in enumerate(source_commits, 1):
                logger.info(f"  {i}. 🔹 {commit.get('commit_hash', 'unknown')[:8]} - {commit.get('message', 'No message')}")
                files_changed = commit.get('files_changed', [])
                if files_changed:
                    logger.info(f"     📄 Files: {', '.join(files_changed)}")
                impact = commit.get('impact', '')
                if impact:
                    logger.info(f"     💫 Impact: {impact}")
            
            # Publish document processing event for these source changes
            await self.event_bus.publish(
                EventType.DOCUMENT_PROCESSING,
                {
                    'type': 'source_repository_changes',
                    'source_commits': source_commits,
                    'metadata': trigger_data.get('metadata', {}),
                    'timestamp': datetime.now().isoformat(),
                    'processed_by': 'change_detection_agent'
                }
            )
            logger.success("🎯 ===========================================")
            logger.success("✅ *** REAL SOURCE CHANGES SENT FOR PROCESSING ***")
            logger.success("🎯 ===========================================")
            logger.info("📤 Nov 8th changes now being processed by DocumentManagement")
            
        except Exception as e:
            logger.error(f"❌ Error processing trigger file: {e}")

    async def cleanup(self):
        """Cleanup resources"""
        logger.info("ChangeDetection cleanup complete")
    
    async def _scan_files(self):
        """Scan all tracked files and compute checksums"""
        new_checksums = {}
        
        # Get the project root directory (fix relative path issue)
        project_root = Path(config.get('repo_path', '.')).resolve()
        
        for watch_path in self.watch_paths:
            # Handle both absolute and relative paths
            if Path(watch_path).is_absolute():
                path = Path(watch_path)
            else:
                path = project_root / watch_path
                
            logger.info(f"🔍 Scanning path: {path} (exists: {path.exists()})")
            
            if not path.exists():
                logger.warning(f"⚠️  Watch path does not exist: {watch_path} -> {path}")
                continue
            
            for file_path in path.rglob("*"):
                if file_path.is_file() and file_path.suffix in self.file_extensions:
                    try:
                        checksum = await self._get_file_checksum(file_path)
                        # Use relative path for consistency
                        rel_path = str(file_path.relative_to(project_root))
                        new_checksums[rel_path] = checksum
                        logger.debug(f"Tracked file: {rel_path}")
                    except Exception as e:
                        logger.error(f"Failed to compute checksum for {file_path}: {e}")
        
        logger.info(f"File scan complete: tracking {len(new_checksums)} files")
        return new_checksums
    
    async def _get_file_checksum(self, file_path: Path) -> str:
        """Get MD5 checksum of a file"""
        import hashlib
        
        try:
            with open(file_path, 'rb') as f:
                content = f.read()
                return hashlib.sha256(content).hexdigest()
        except Exception as e:
            logger.error(f"Failed to read file {file_path}: {e}")
            return ""
    
    async def _detect_file_changes(self) -> List[Dict[str, Any]]:
        """Detect changes in tracked files"""
        try:
            logger.info("🔍 Running file change detection scan...")
            current_checksums = await self._scan_files()
            changes = []
            
            logger.info(f"📊 Current scan: {len(current_checksums)} files")
            logger.info(f"📊 Previous scan: {len(self.file_checksums)} files")
            
            # Check for modified files
            for file_path, checksum in current_checksums.items():
                if file_path in self.file_checksums:
                    if self.file_checksums[file_path] != checksum:
                        changes.append({
                            'type': 'modified',
                            'path': file_path,
                            'old_checksum': self.file_checksums[file_path],
                            'new_checksum': checksum
                        })
                else:
                    # New file
                    changes.append({
                        'type': 'added',
                        'path': file_path,
                        'checksum': checksum
                    })
            
            # Check for deleted files
            for file_path in self.file_checksums:
                if file_path not in current_checksums:
                    changes.append({
                        'type': 'deleted',
                        'path': file_path
                    })
            
            # Update checksum cache
            self.file_checksums = current_checksums
            
            if changes:
                logger.info(f"📝 Detected {len(changes)} file changes!")
                for change in changes:
                    logger.info(f"  🔹 {change['type'].upper()}: {change['path']}")
            else:
                logger.info("📝 No file changes detected")
            
            return changes
            
        except Exception as e:
            logger.error(f"Failed to detect file changes: {e}")
            return []
    
    async def _check_git_changes(self) -> Dict[str, Any]:
        """Check for git repository changes"""
        try:
            # Get current commit hash
            result = subprocess.run(
                ['git', 'rev-parse', 'HEAD'],
                capture_output=True,
                text=True,
                cwd=config.get('project_root', '.')
            )
            
            if result.returncode != 0:
                logger.error(f"Failed to get git commit hash: {result.stderr}")
                return {}
            
            current_commit = result.stdout.strip()
            
            # Check if commit changed
            if self.last_commit_hash and self.last_commit_hash != current_commit:
                # Get commit details
                commit_info = await self._get_commit_info(current_commit)
                
                git_changes = {
                    'old_commit': self.last_commit_hash,
                    'new_commit': current_commit,
                    'commit_info': commit_info
                }
                
                self.last_commit_hash = current_commit
                return git_changes
            
            # First run - just store current commit
            if not self.last_commit_hash:
                self.last_commit_hash = current_commit
            
            return {}
            
        except Exception as e:
            logger.error(f"Failed to check git changes: {e}")
            return {}
    
    async def _get_commit_info(self, commit_hash: str) -> Dict[str, Any]:
        """Get detailed information about a commit"""
        try:
            # Get commit message and author
            result = subprocess.run(
                ['git', 'show', '--format=%H|%an|%ae|%ad|%s', '--no-patch', commit_hash],
                capture_output=True,
                text=True,
                cwd=config.get('project_root', '.')
            )
            
            if result.returncode == 0:
                parts = result.stdout.strip().split('|', 4)
                if len(parts) >= 5:
                    return {
                        'hash': parts[0],
                        'author_name': parts[1],
                        'author_email': parts[2],
                        'date': parts[3],
                        'message': parts[4]
                    }
            
            return {'hash': commit_hash, 'message': 'Unknown commit'}
            
        except Exception as e:
            logger.error(f"Failed to get commit info: {e}")
            return {'hash': commit_hash, 'error': str(e)}
    
    async def _handle_file_changes(self, changes: List[Dict[str, Any]]):
        """Handle detected file changes"""
        try:
            logger.info(f"🎯 ===================================")
            logger.info(f"🎯 PROCESSING {len(changes)} FILE CHANGES")  
            logger.info(f"🎯 ===================================")
            
            # Check for trigger file first
            trigger_file = "/Users/rhfluker/Projects/clientpass-doc-site-master/automation/TRIGGER_SOURCE_PROCESSING"
            logger.info(f"🔍 Checking for trigger file: {trigger_file}")
            if os.path.exists(trigger_file):
                logger.success("🎯 *** TRIGGER FILE FOUND! PROCESSING SOURCE COMMITS ***")
                try:
                    with open(trigger_file, 'r') as f:
                        trigger_data = json.loads(f.read())
                    
                    # Remove trigger file
                    os.remove(trigger_file)
                    logger.info("🗑️ Removed trigger file")
                    
                    # Process the source commits from trigger file
                    source_commits = trigger_data.get('source_commits', [])
                    logger.success(f"📦 *** PROCESSING {len(source_commits)} SOURCE REPOSITORY COMMITS ***")
                    logger.info("📋 COMMIT DETAILS:")
                    
                    for i, commit in enumerate(source_commits, 1):
                        logger.info(f"  {i}. 🔹 {commit.get('commit_hash', 'unknown')[:8]} - {commit.get('message', 'No message')}")
                        files_changed = commit.get('files_changed', [])
                        if files_changed:
                            logger.info(f"     📄 Files: {', '.join(files_changed)}")
                    
                    # Publish document processing event for these source changes
                    await self.event_bus.publish(
                        EventType.DOCUMENT_PROCESSING,
                        {
                            'type': 'source_repository_changes',
                            'source_commits': source_commits,
                            'timestamp': datetime.now().isoformat(),
                            'processed_by': 'change_detection_agent'
                        }
                    )
                    logger.success("🎯 ===========================================")
                    logger.success("✅ *** SOURCE CHANGES SENT FOR PROCESSING ***")
                    logger.success("🎯 ===========================================")
                    logger.info("📤 Document processing event published to downstream agents")
                    
                except Exception as e:
                    logger.error(f"❌ Error processing trigger file: {e}")
            else:
                logger.info("🔍 No trigger file found - processing regular file changes...")
            
            # Group changes by type
            added = [c for c in changes if c['type'] == 'added']
            modified = [c for c in changes if c['type'] == 'modified']
            deleted = [c for c in changes if c['type'] == 'deleted']
            
            # Log changes
            if added:
                logger.info(f"Added files: {[c['path'] for c in added]}")
            if modified:
                logger.info(f"Modified files: {[c['path'] for c in modified]}")
            if deleted:
                logger.info(f"Deleted files: {[c['path'] for c in deleted]}")
            
            # Publish file change event
            await event_bus.publish(
                EventType.FILE_CHANGE,
                self.name,
                {
                    'changes': changes,
                    'summary': {
                        'added': len(added),
                        'modified': len(modified),
                        'deleted': len(deleted)
                    },
                    'timestamp': datetime.now().isoformat()
                }
            )
            
        except Exception as e:
            logger.error(f"Failed to handle file changes: {e}")
    
    async def _handle_git_changes(self, git_changes: Dict[str, Any]):
        """Handle detected git changes"""
        try:
            commit_info = git_changes.get('commit_info', {})
            logger.info(f"Git repository changed: {commit_info.get('message', 'Unknown commit')}")
            
            # Publish git change event
            await event_bus.publish(
                EventType.GIT_CHANGE,
                self.name,
                {
                    'git_changes': git_changes,
                    'timestamp': datetime.now().isoformat()
                }
            )
            
        except Exception as e:
            logger.error(f"Failed to handle git changes: {e}")
    
    async def _handle_change_request(self, event):
        """Handle manual change detection request"""
        try:
            logger.info("🎯 =================================")
            logger.info("🎯 CHANGE DETECTION REQUEST RECEIVED")
            logger.info("🎯 =================================")
            
            # Check for trigger file that bypasses Redis event system
            trigger_file = "/Users/rhfluker/Projects/clientpass-doc-site-master/automation/TRIGGER_SOURCE_PROCESSING"
            logger.info(f"🔍 Checking for trigger file: {trigger_file}")
            if os.path.exists(trigger_file):
                logger.success("🎯 *** TRIGGER FILE FOUND FOR SOURCE PROCESSING! ***")
                logger.info("🎯 ===========================================")
                logger.info("🎯 PROCESSING SOURCE REPOSITORY CHANGES")
                logger.info("🎯 ===========================================")
                try:
                    with open(trigger_file, 'r') as f:
                        trigger_data = json.loads(f.read())
                    
                    # Remove trigger file
                    os.remove(trigger_file)
                    logger.info("🗑️ Removed trigger file")
                    
                    # Process the source commits from trigger file
                    source_commits = trigger_data.get('source_commits', [])
                    logger.success(f"📦 *** PROCESSING {len(source_commits)} SOURCE REPOSITORY COMMITS ***")
                    logger.info("📋 COMMIT DETAILS:")
                    
                    for i, commit in enumerate(source_commits, 1):
                        logger.info(f"  {i}. 🔹 {commit.get('commit_hash', 'unknown')[:8]} - {commit.get('message', 'No message')}")
                        files_changed = commit.get('files_changed', [])
                        if files_changed:
                            logger.info(f"     📄 Files: {', '.join(files_changed)}")
                    
                    # Publish document processing event for these source changes
                    await self.event_bus.publish(
                        EventType.DOCUMENT_PROCESSING,
                        {
                            'type': 'source_repository_changes',
                            'source_commits': source_commits,
                            'timestamp': datetime.now().isoformat(),
                            'processed_by': 'change_detection_agent'
                        }
                    )
                    logger.success("🎯 ===========================================")
                    logger.success("✅ *** SOURCE CHANGES SENT FOR PROCESSING ***")
                    logger.success("🎯 ===========================================")
                    logger.info("📤 Document processing event published to downstream agents")
                    return
                    
                except Exception as e:
                    logger.error(f"❌ Error processing trigger file: {e}")
            else:
                logger.info("🔍 No trigger file found - checking Redis events...")
            
            # Debug: comprehensive event structure analysis
            logger.info(f"🐛 Event object: {event}")
            logger.info(f"🐛 Event type: {type(event)}")
            logger.info(f"🐛 Event attributes: {[attr for attr in dir(event) if not attr.startswith('_')]}")
            
            # Try different ways to access data
            event_data = None
            if hasattr(event, 'data'):
                event_data = event.data
                logger.info(f"🐛 Event.data: {event_data} (type: {type(event_data)})")
            elif hasattr(event, 'payload'):
                event_data = event.payload
                logger.info(f"🐛 Event.payload: {event_data} (type: {type(event_data)})")
            elif isinstance(event, dict):
                event_data = event
                logger.info(f"🐛 Event is dict: {event_data}")
            
            # Check for action parameter in various data formats
            action = None
            if event_data:
                if isinstance(event_data, dict):
                    action = event_data.get('action')
                elif isinstance(event_data, str):
                    try:
                        parsed_data = json.loads(event_data)
                        action = parsed_data.get('action')
                        if action:
                            event_data = parsed_data
                    except:
                        pass
            
            logger.info(f"🐛 Detected action: {action}")
            
            # Check if this is a source repo processing request
            if action == 'process_source_repo_changes':
                logger.info("🎯 Processing source repo changes from injection")
                source_commits = json.loads(event.data.get('source_commits', '[]'))
                
                for commit in source_commits:
                    # Create a mock source repo event for each commit
                    mock_event = type('MockEvent', (), {
                        'data': {
                            'source_repo': '/Users/rhfluker/Projects/style-referral-ring',
                            'commit_hash': commit['commit_hash'],
                            'commit_message': commit['message'],
                            'files_changed': json.dumps(commit['files_changed']),
                            'timestamp': datetime.now().isoformat(),
                            'requires_documentation_update': 'true'
                        }
                    })()
                    
                    # Process each commit
                    await self._handle_source_repo_change(mock_event)
                
                logger.success("✅ All injected source repo changes processed")
                return
            
            # Normal change detection            # Force immediate scan
            file_changes = await self._detect_file_changes()
            git_changes = await self._check_git_changes()
            
            if file_changes:
                await self._handle_file_changes(file_changes)
            
            if git_changes:
                await self._handle_git_changes(git_changes)
            
            if not file_changes and not git_changes:
                logger.info("No changes detected")
            
        except Exception as e:
            logger.error(f"Failed to handle change request: {e}")    
    async def _handle_source_repo_change(self, event):
        """Handle source repository change event from external trigger"""
        try:
            data = event.data
            commit_hash = data.get('commit_hash')
            commit_message = data.get('commit_message')
            files_changed = data.get('files_changed', [])
            source_repo = data.get('source_repo')
            
            logger.info(f"🔍 Processing source repo change: {commit_hash} - {commit_message}")
            logger.info(f"📁 Source repo: {source_repo}")
            logger.info(f"📄 Files changed: {files_changed}")
            
            # Create documentation update event for this source change
            await event_bus.publish(EventType.DOCUMENT_PROCESSING, "ChangeDetection", {
                "source": "external_source_repo",
                "source_repo_path": source_repo,
                "commit_hash": commit_hash,
                "commit_message": commit_message,
                "files_changed": files_changed,
                "requires_documentation_update": True,
                "timestamp": datetime.now().isoformat(),
                "priority": "normal"
            })
            
            logger.success(f"✅ Source repo change processed and forwarded for documentation update")
            
        except Exception as e:
            logger.error(f"❌ Error handling source repo change: {e}")