#!/usr/bin/env python3
"""
Change Detection Agent
Monitors file system changes and Git repository for documentation updates
"""

import asyncio
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
from events import event_bus, EventType
from config import config

class ChangeDetectionAgent(BaseAgent):
    """Detects changes in files and Git repository"""
    
    def __init__(self):
        super().__init__("ChangeDetection")
        
        # Configuration
        self.watch_paths = config.get('change_detection.watch_paths', ['public/docs/', 'src/'])
        self.file_extensions = config.get('change_detection.file_extensions', ['.md', '.tsx', '.ts', '.js'])
        self.check_interval = config.get('change_detection.check_interval', 30)  # seconds
        self.git_check_interval = config.get('change_detection.git_check_interval', 300)  # 5 minutes
        
        # State tracking
        self.file_checksums: Dict[str, str] = {}
        self.last_git_check = datetime.now() - timedelta(seconds=self.git_check_interval)
        self.last_commit_hash = None
        
        logger.info(f"ChangeDetection agent configured to watch: {self.watch_paths}")
    
    def _setup_event_subscriptions(self):
        """Setup event subscriptions"""
        # Listen for manual change detection requests
        event_bus.subscribe(EventType.CHANGE_DETECTION, self._handle_change_request)
    
    async def initialize(self):
        """Initialize the change detection agent"""
        try:
            # Get initial file state
            await self._scan_files()
            
            # Get initial git state
            await self._check_git_changes()
            
            logger.info(f"ChangeDetection initialized with {len(self.file_checksums)} tracked files")
            
        except Exception as e:
            logger.error(f"Failed to initialize ChangeDetection: {e}")
            raise
    
    async def process(self):
        """Main processing loop"""
        try:
            # Check for file changes
            file_changes = await self._detect_file_changes()
            if file_changes:
                await self._handle_file_changes(file_changes)
            
            # Check for git changes (less frequent)
            if (datetime.now() - self.last_git_check).total_seconds() >= self.git_check_interval:
                git_changes = await self._check_git_changes()
                if git_changes:
                    await self._handle_git_changes(git_changes)
                self.last_git_check = datetime.now()
            
            # Wait before next check
            await asyncio.sleep(self.check_interval)
            
        except Exception as e:
            logger.error(f"Error in ChangeDetection processing: {e}")
            raise
    
    async def cleanup(self):
        """Cleanup resources"""
        logger.info("ChangeDetection cleanup complete")
    
    async def _scan_files(self):
        """Scan all tracked files and compute checksums"""
        new_checksums = {}
        
        for watch_path in self.watch_paths:
            path = Path(watch_path)
            if not path.exists():
                logger.warning(f"Watch path does not exist: {watch_path}")
                continue
            
            for file_path in path.rglob("*"):
                if file_path.is_file() and file_path.suffix in self.file_extensions:
                    try:
                        checksum = await self._get_file_checksum(file_path)
                        new_checksums[str(file_path)] = checksum
                    except Exception as e:
                        logger.error(f"Failed to compute checksum for {file_path}: {e}")
        
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
            current_checksums = await self._scan_files()
            changes = []
            
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
            logger.info(f"Detected {len(changes)} file changes")
            
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
            event_bus.publish(
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
            event_bus.publish(
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
            logger.info("Manual change detection requested")
            
            # Force immediate scan
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