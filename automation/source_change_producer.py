"""
Source Change Producer - Kafka Streams Implementation
Replaces unstable Redis MAS with reliable Kafka processing
Monitors source repository and publishes changes to Kafka topics
"""

import asyncio
import json
import os
import time
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

from kafka_config import TopicName
from kafka_event_bus import kafka_event_bus

logger = logging.getLogger(__name__)

class SourceChangeHandler(FileSystemEventHandler):
    """File system event handler for source repository changes"""
    
    def __init__(self, producer: 'SourceChangeProducer'):
        self.producer = producer
        
    def on_created(self, event):
        if not event.is_directory:
            asyncio.create_task(self.producer.handle_file_change('created', event.src_path))
    
    def on_modified(self, event):
        if not event.is_directory:
            asyncio.create_task(self.producer.handle_file_change('modified', event.src_path))
    
    def on_deleted(self, event):
        if not event.is_directory:
            asyncio.create_task(self.producer.handle_file_change('deleted', event.src_path))

class SourceChangeProducer:
    """
    Kafka producer for source repository changes
    Monitors trigger files and source repo, publishes to Kafka topics
    """
    
    def __init__(self, 
                 source_repo_path: Optional[str] = None,
                 watch_path: Optional[str] = None):
        # Use environment variables for Docker compatibility
        self.source_repo_path = source_repo_path or os.getenv(
            'SOURCE_REPO_PATH', 
            "/Users/rhfluker/Projects/style-referral-ring"
        )
        self.clientpass_repo_path = os.getenv(
            'CLIENTPASS_REPO_PATH',
            "/Users/rhfluker/Projects/clientpass-doc-site-master"
        )
        self.watch_path = watch_path or self.clientpass_repo_path
        
        # Additional monitored repositories
        self.monitored_repos = {
            'source_repo': self.source_repo_path,
            'clientpass_docs': self.clientpass_repo_path,
            'docs_path': os.getenv('DOCS_PATH', f"{self.clientpass_repo_path}/public/docs")
        }
        self.observer: Optional[Observer] = None
        self.is_running = False
        self.trigger_patterns = ['TRIGGER_NOW', 'TRIGGER_SOURCE_PROCESSING', 'TRIGGER_*']
        
    async def initialize(self):
        """Initialize the source change producer"""
        try:
            logger.info("🔧 Initializing Source Change Producer...")
            
            # Initialize Kafka event bus
            await kafka_event_bus.initialize()
            
            # Start file system watcher
            self.observer = Observer()
            handler = SourceChangeHandler(self)
            self.observer.schedule(handler, self.watch_path, recursive=False)
            self.observer.start()
            
            logger.info("✅ Source Change Producer initialized")
            self.is_running = True
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Source Change Producer: {e}")
            raise
    
    async def start_monitoring(self):
        """Start the main monitoring loop"""
        logger.info("🎯 Starting source change monitoring...")
        
        while self.is_running:
            try:
                # Check for trigger files
                await self._check_trigger_files()
                
                # Wait before next check
                await asyncio.sleep(5)
                
            except Exception as e:
                logger.error(f"❌ Monitoring error: {e}")
                await asyncio.sleep(10)
    
    async def _check_trigger_files(self):
        """Check for trigger files and process them"""
        try:
            watch_dir = Path(self.watch_path)
            
            # Look for trigger files
            trigger_files = []
            for pattern in self.trigger_patterns:
                trigger_files.extend(watch_dir.glob(pattern))
            
            for trigger_file in trigger_files:
                if trigger_file.is_file():
                    logger.info(f"🎯 Found trigger file: {trigger_file}")
                    await self._process_trigger_file(trigger_file)
                    
        except Exception as e:
            logger.error(f"❌ Error checking trigger files: {e}")
    
    async def _process_trigger_file(self, trigger_file: Path):
        """Process a trigger file containing commit data"""
        try:
            logger.info(f"📄 Processing trigger file: {trigger_file}")
            
            # Read trigger file content
            with open(trigger_file, 'r') as f:
                trigger_data = json.load(f)
            
            # Extract commit information
            source_commits = trigger_data.get('source_commits', [])
            metadata = trigger_data.get('metadata', {})
            
            # Create source change event
            source_change_event = {
                'event_type': 'source_repository_changes',
                'source_repo': metadata.get('source_repo', self.source_repo_path),
                'commits': source_commits,
                'commit_count': len(source_commits),
                'commits_since': metadata.get('commits_since'),
                'processing_date': metadata.get('processing_date'),
                'trigger_file': str(trigger_file),
                'timestamp': datetime.utcnow().isoformat()
            }
            
            # Publish to Kafka
            success = await kafka_event_bus.publish(
                topic=TopicName.SOURCE_CHANGES.value,
                message=source_change_event,
                key=f"source_{int(time.time())}"
            )
            
            if success:
                logger.info(f"📤 Published {len(source_commits)} commits to Kafka")
                
                # Remove processed trigger file
                trigger_file.unlink()
                logger.info(f"🗑️ Removed processed trigger file: {trigger_file}")
                
                # Publish document processing event
                await self._publish_document_processing_event(source_commits)
            else:
                logger.error(f"❌ Failed to publish source changes to Kafka")
                
        except Exception as e:
            logger.error(f"❌ Error processing trigger file {trigger_file}: {e}")
    
    async def _publish_document_processing_event(self, commits: List[Dict]):
        """Publish document processing event for commits"""
        try:
            processing_event = {
                'event_type': 'source_repo_changes_detected',
                'action': 'process_source_repository_changes',
                'commits': commits,
                'source_repo': self.source_repo_path,
                'requires_documentation_update': True,
                'requires_rag_update': True,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            success = await kafka_event_bus.publish(
                topic=TopicName.DOCUMENT_PROCESSING.value,
                message=processing_event,
                key=f"doc_processing_{int(time.time())}"
            )
            
            if success:
                logger.info(f"📋 Published document processing event for {len(commits)} commits")
            else:
                logger.error("❌ Failed to publish document processing event")
                
        except Exception as e:
            logger.error(f"❌ Error publishing document processing event: {e}")
    
    async def handle_file_change(self, event_type: str, file_path: str):
        """Handle file system changes"""
        try:
            file_name = os.path.basename(file_path)
            
            # Check if it's a trigger file
            if any(file_name.startswith(pattern.replace('*', '')) for pattern in self.trigger_patterns):
                logger.info(f"🔔 Detected {event_type} event for trigger file: {file_name}")
                
                if event_type == 'created' or event_type == 'modified':
                    # Give file time to be written completely
                    await asyncio.sleep(1)
                    await self._process_trigger_file(Path(file_path))
                    
        except Exception as e:
            logger.error(f"❌ Error handling file change {file_path}: {e}")
    
    async def publish_test_event(self):
        """Publish test event to verify Kafka connectivity"""
        try:
            test_event = {
                'event_type': 'system_test',
                'message': 'Kafka connectivity test',
                'timestamp': datetime.utcnow().isoformat()
            }
            
            success = await kafka_event_bus.publish(
                topic=TopicName.SYSTEM_STATUS.value,
                message=test_event,
                key='test'
            )
            
            logger.info(f"🧪 Test event published: {'✅' if success else '❌'}")
            return success
            
        except Exception as e:
            logger.error(f"❌ Failed to publish test event: {e}")
            return False
    
    async def shutdown(self):
        """Gracefully shutdown the producer"""
        logger.info("🛑 Shutting down Source Change Producer...")
        
        self.is_running = False
        
        # Stop file watcher
        if self.observer:
            self.observer.stop()
            self.observer.join()
            logger.info("👀 File watcher stopped")
        
        # Shutdown Kafka event bus
        await kafka_event_bus.shutdown()
        
        logger.info("✅ Source Change Producer shutdown complete")

# Global producer instance
source_change_producer = SourceChangeProducer()