"""
Automated LangGraph Monitor - Runs in Background
Continuously monitors for trigger files and processes them automatically
"""

import asyncio
import json
import logging
import os
import signal
import sys
from datetime import datetime
from pathlib import Path
from typing import List
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from direct_langgraph_processor import DirectLangGraphProcessor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)8s | %(name)s:%(funcName)s:%(lineno)d - %(message)s',
    handlers=[
        logging.FileHandler('/Users/rhfluker/Projects/clientpass-doc-site-master/automation/logs/automation_monitor.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

class TriggerFileHandler(FileSystemEventHandler):
    """Handles file system events for trigger files"""
    
    def __init__(self, monitor: 'AutomatedLangGraphMonitor'):
        self.monitor = monitor
        self.trigger_patterns = ['TRIGGER_NOW', 'TRIGGER_SOURCE_PROCESSING']
        
    def on_created(self, event):
        if not event.is_directory:
            self._handle_file_event('created', event.src_path)
    
    def on_modified(self, event):
        if not event.is_directory:
            self._handle_file_event('modified', event.src_path)
    
    def _handle_file_event(self, event_type: str, file_path: str):
        """Handle file system events"""
        try:
            file_name = os.path.basename(file_path)
            
            # Check if it's a trigger file
            is_trigger = any(
                file_name == pattern or file_name.startswith(pattern.replace('*', ''))
                for pattern in self.trigger_patterns
            )
            
            if is_trigger:
                logger.info(f"🔔 Detected {event_type} trigger file: {file_name}")
                # Queue for processing
                asyncio.create_task(self.monitor.process_trigger_file(file_path))
                
        except Exception as e:
            logger.error(f"❌ Error handling file event {file_path}: {e}")

class AutomatedLangGraphMonitor:
    """
    Automated LangGraph monitor that runs continuously in the background
    Watches for trigger files and processes them automatically with LangGraph intelligence
    """
    
    def __init__(self):
        self.is_running = False
        self.processor = None
        self.observer = None
        self.watch_path = "/Users/rhfluker/Projects/clientpass-doc-site-master"
        self.processing_queue = asyncio.Queue()
        self.stats = {
            'files_processed': 0,
            'start_time': None,
            'last_processing_time': None,
            'total_commits_processed': 0,
            'total_documents_created': 0
        }
        
    async def initialize(self):
        """Initialize the automated monitor"""
        try:
            logger.info("🤖 Initializing Automated LangGraph Monitor...")
            
            # Initialize the processor
            self.processor = DirectLangGraphProcessor()
            await self.processor.initialize()
            
            # Set up file system watcher
            self.observer = Observer()
            handler = TriggerFileHandler(self)
            self.observer.schedule(handler, self.watch_path, recursive=False)
            
            # Initialize stats
            self.stats['start_time'] = datetime.now()
            
            logger.info("✅ Automated LangGraph Monitor initialized")
            self.is_running = True
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize automated monitor: {e}")
            raise
    
    async def start_automation(self):
        """Start the automated monitoring system"""
        try:
            logger.info("🚀 Starting Automated LangGraph Processing...")
            
            # Start file watcher
            self.observer.start()
            logger.info("👀 File system watcher started")
            
            # Check for existing trigger files
            await self._scan_existing_triggers()
            
            # Start main loop
            await self._run_automation_loop()
            
        except Exception as e:
            logger.error(f"❌ Automation error: {e}")
            raise
    
    async def _scan_existing_triggers(self):
        """Scan for existing trigger files on startup"""
        try:
            logger.info("🔍 Scanning for existing trigger files...")
            
            watch_dir = Path(self.watch_path)
            trigger_patterns = ['TRIGGER_NOW', 'TRIGGER_SOURCE_PROCESSING', 'TRIGGER_*']
            
            found_files = []
            for pattern in trigger_patterns:
                found_files.extend(watch_dir.glob(pattern))
            
            for trigger_file in found_files:
                if trigger_file.is_file():
                    logger.info(f"📁 Found existing trigger file: {trigger_file}")
                    await self.processing_queue.put(str(trigger_file))
            
            if found_files:
                logger.info(f"📋 Queued {len(found_files)} existing trigger files for processing")
            else:
                logger.info("📄 No existing trigger files found")
                
        except Exception as e:
            logger.error(f"❌ Error scanning existing triggers: {e}")
    
    async def _run_automation_loop(self):
        """Main automation loop"""
        logger.info("🔄 Starting main automation loop...")
        
        while self.is_running:
            try:
                # Process queued files
                await self._process_queue()
                
                # Health monitoring
                await self._monitor_health()
                
                # Status reporting
                await self._report_status()
                
                # Wait before next check
                await asyncio.sleep(10)
                
            except Exception as e:
                logger.error(f"❌ Automation loop error: {e}")
                await asyncio.sleep(30)  # Longer wait on errors
    
    async def _process_queue(self):
        """Process all queued trigger files"""
        try:
            while not self.processing_queue.empty():
                trigger_file_path = await self.processing_queue.get()
                
                logger.info(f"🎯 Processing queued trigger file: {trigger_file_path}")
                
                # Check if file still exists
                if Path(trigger_file_path).exists():
                    await self.process_trigger_file(trigger_file_path)
                else:
                    logger.warning(f"⚠️ Trigger file no longer exists: {trigger_file_path}")
                    
        except Exception as e:
            logger.error(f"❌ Error processing queue: {e}")
    
    async def process_trigger_file(self, trigger_file_path: str):
        """Process a trigger file with full automation"""
        try:
            logger.info(f"🧠 Auto-processing trigger file: {os.path.basename(trigger_file_path)}")
            
            # Add small delay to ensure file is fully written
            await asyncio.sleep(2)
            
            # Process with LangGraph
            success = await self.processor.process_trigger_file(trigger_file_path)
            
            if success:
                # Update stats
                self.stats['files_processed'] += 1
                self.stats['last_processing_time'] = datetime.now()
                
                # Count commits processed
                try:
                    with open(trigger_file_path, 'r') as f:
                        trigger_data = json.load(f)
                    commits = len(trigger_data.get('source_commits', []))
                    self.stats['total_commits_processed'] += commits
                    
                    logger.info(f"✅ Successfully auto-processed {commits} commits")
                except:
                    pass
                
            else:
                logger.error(f"❌ Auto-processing failed for: {trigger_file_path}")
                
        except Exception as e:
            logger.error(f"❌ Error in automated processing: {e}")
    
    async def _monitor_health(self):
        """Monitor system health"""
        try:
            # Check if observer is still running
            if self.observer and not self.observer.is_alive():
                logger.warning("⚠️ File observer stopped, restarting...")
                self.observer.start()
            
            # Check processor health
            if not self.processor:
                logger.error("❌ Processor not available")
                
        except Exception as e:
            logger.error(f"❌ Health monitoring error: {e}")
    
    async def _report_status(self):
        """Report system status periodically"""
        try:
            uptime = datetime.now() - self.stats['start_time']
            
            # Report every 5 minutes
            if uptime.total_seconds() % 300 < 10:
                logger.info(f"📊 Automation Status:")
                logger.info(f"   Uptime: {uptime}")
                logger.info(f"   Files Processed: {self.stats['files_processed']}")
                logger.info(f"   Total Commits: {self.stats['total_commits_processed']}")
                logger.info(f"   Last Processing: {self.stats['last_processing_time']}")
                logger.info(f"   Queue Size: {self.processing_queue.qsize()}")
                
        except Exception as e:
            logger.error(f"❌ Status reporting error: {e}")
    
    def get_stats(self) -> dict:
        """Get current statistics"""
        stats = self.stats.copy()
        if stats['start_time']:
            stats['uptime_seconds'] = (datetime.now() - stats['start_time']).total_seconds()
        return stats
    
    async def shutdown(self):
        """Gracefully shutdown the automated monitor"""
        logger.info("🛑 Shutting down Automated LangGraph Monitor...")
        
        self.is_running = False
        
        # Stop file watcher
        if self.observer:
            self.observer.stop()
            self.observer.join()
            logger.info("👀 File watcher stopped")
        
        # Process remaining queue
        remaining = self.processing_queue.qsize()
        if remaining > 0:
            logger.info(f"🔄 Processing {remaining} remaining files...")
            await self._process_queue()
        
        logger.info("✅ Automated LangGraph Monitor shutdown complete")

# Global monitor instance
automated_monitor = AutomatedLangGraphMonitor()

def signal_handler(signum, frame):
    """Handle shutdown signals"""
    logger.info(f"🔔 Received signal {signum}, initiating shutdown...")
    asyncio.create_task(automated_monitor.shutdown())
    sys.exit(0)

async def main():
    """Main entry point for automated processing"""
    try:
        print("🤖 Starting Automated LangGraph Processing System...")
        
        # Register signal handlers
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
        
        # Initialize and start automation
        await automated_monitor.initialize()
        
        print("✅ Automation system is now running!")
        print("📁 Monitoring for trigger files...")
        print("🔄 Processing will happen automatically")
        print("⏹️  Press Ctrl+C to stop")
        
        await automated_monitor.start_automation()
        
    except KeyboardInterrupt:
        print("\n🔔 Stopping automation system...")
        await automated_monitor.shutdown()
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        logger.error(f"Fatal error: {e}")
        await automated_monitor.shutdown()
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())