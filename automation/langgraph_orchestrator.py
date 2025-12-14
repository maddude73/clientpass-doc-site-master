"""
LangGraph Orchestrator - Intelligent Workflow Management
Integrates LangGraph with Kafka Streams for intelligent document processing
"""

import asyncio
import json
import logging
import os
import signal
import sys
from typing import Dict, Any, Optional
from datetime import datetime
from pathlib import Path

from langgraph.graph import StateGraph
from langchain_core.messages import HumanMessage

from kafka_config import TopicName
from kafka_event_bus import kafka_event_bus
from langgraph_workflows import LangGraphWorkflows, DocumentProcessingState
from document_processing_consumer import document_processing_consumer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)8s | %(name)s:%(funcName)s:%(lineno)d - %(message)s',
    handlers=[
        logging.FileHandler('/Users/rhfluker/Projects/clientpass-doc-site-master/automation/logs/langgraph_orchestrator.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

class LangGraphOrchestrator:
    """
    LangGraph-based orchestrator for intelligent document processing
    Combines Kafka reliability with LangGraph intelligent workflows
    """
    
    def __init__(self):
        self.is_running = False
        self.start_time = None
        self.workflows = None
        self.document_workflow = None
        self.active_threads = {}
        
        # Configuration
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        self.watch_path = "/Users/rhfluker/Projects/clientpass-doc-site-master"
        self.source_repo_path = "/Users/rhfluker/Projects/style-referral-ring"
        
    async def initialize(self):
        """Initialize the LangGraph orchestrator"""
        try:
            logger.info("🧠 Initializing LangGraph Orchestrator...")
            self.start_time = datetime.utcnow()
            
            # Initialize Kafka event bus
            await kafka_event_bus.initialize()
            
            # Initialize LangGraph workflows
            self.workflows = LangGraphWorkflows(self.openai_api_key)
            self.document_workflow = self.workflows.create_document_processing_workflow()
            
            # Subscribe to Kafka topics
            await self._subscribe_to_events()
            
            # Initialize document processing consumer
            await document_processing_consumer.initialize()
            
            logger.info("✅ LangGraph Orchestrator initialized successfully")
            self.is_running = True
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize LangGraph Orchestrator: {e}")
            raise
    
    async def _subscribe_to_events(self):
        """Subscribe to Kafka events for intelligent processing"""
        try:
            # Subscribe to source changes for intelligent routing
            await kafka_event_bus.subscribe(
                topic=TopicName.SOURCE_CHANGES.value,
                group_id="langgraph-orchestrator",
                handler=self._handle_source_changes
            )
            
            # Subscribe to document processing for workflow management
            await kafka_event_bus.subscribe(
                topic=TopicName.DOCUMENT_PROCESSING.value,
                group_id="langgraph-document-processor",
                handler=self._handle_document_processing
            )
            
            logger.info("🔔 Subscribed to Kafka topics for intelligent processing")
            
        except Exception as e:
            logger.error(f"❌ Failed to subscribe to events: {e}")
            raise
    
    def _handle_source_changes(self, message: Dict[str, Any]):
        """Handle source changes with LangGraph intelligence"""
        try:
            event_type = message.get('event_type')
            logger.info(f"🧠 Processing source change with LangGraph: {event_type}")
            
            if event_type == 'source_repository_changes':
                asyncio.create_task(self._process_with_langgraph(message))
            else:
                logger.debug(f"🔄 Unhandled source change event: {event_type}")
                
        except Exception as e:
            logger.error(f"❌ Error handling source changes: {e}")
    
    def _handle_document_processing(self, message: Dict[str, Any]):
        """Handle document processing events"""
        try:
            event_type = message.get('event_type')
            logger.info(f"📋 Processing document event: {event_type}")
            
            if event_type == 'source_repo_changes_detected':
                asyncio.create_task(self._route_processing_request(message))
            else:
                logger.debug(f"🔄 Unhandled document processing event: {event_type}")
                
        except Exception as e:
            logger.error(f"❌ Error handling document processing: {e}")
    
    async def _process_with_langgraph(self, message: Dict[str, Any]):
        """Process source changes using LangGraph workflow"""
        try:
            logger.info("🧠 Starting LangGraph intelligent processing")
            
            # Extract data from Kafka message
            commits = message.get('commits', [])
            source_repo = message.get('source_repo', self.source_repo_path)
            
            # Create initial state for LangGraph
            initial_state: DocumentProcessingState = {
                'source_commits': commits,
                'source_repo': source_repo,
                'trigger_data': message,
                'current_step': '',
                'processed_commits': [],
                'documentation_updates': [],
                'rag_updates': [],
                'status': 'starting',
                'errors': [],
                'messages': [],
                'start_time': '',
                'end_time': None,
                'documents_created': 0,
                'documents_updated': 0,
                'rag_entries_added': 0
            }
            
            # Generate thread ID for this processing session
            thread_id = f"doc_processing_{int(datetime.utcnow().timestamp())}"
            
            logger.info(f"🔄 Starting LangGraph workflow thread: {thread_id}")
            
            # Execute LangGraph workflow
            config = {"configurable": {"thread_id": thread_id}}
            
            final_state = None
            step_count = 0
            
            async for state in self.document_workflow.astream(initial_state, config):
                step_count += 1
                current_step = state.get('current_step', 'unknown')
                status = state.get('status', 'unknown')
                
                logger.info(f"🎯 LangGraph step {step_count}: {current_step} ({status})")
                
                # Store latest state
                final_state = state
                
                # Check for completion
                if status in ['completed_successfully', 'completed_with_errors', 'fatal_error']:
                    break
            
            # Process results
            if final_state:
                await self._handle_workflow_results(final_state, thread_id)
            else:
                logger.error("❌ LangGraph workflow completed without final state")
            
        except Exception as e:
            logger.error(f"❌ Error in LangGraph processing: {e}")
    
    async def _route_processing_request(self, message: Dict[str, Any]):
        """Intelligently route processing requests"""
        try:
            logger.info("🧭 Intelligently routing processing request")
            
            commits = message.get('commits', [])
            
            # Analyze request complexity
            if len(commits) > 10:
                logger.info("🔀 Large batch detected, using parallel processing")
                await self._process_large_batch(message)
            elif len(commits) > 1:
                logger.info("🔄 Medium batch detected, using LangGraph workflow")
                await self._process_with_langgraph(message)
            else:
                logger.info("⚡ Single commit detected, using direct processing")
                await self._process_single_commit_direct(message)
                
        except Exception as e:
            logger.error(f"❌ Error routing processing request: {e}")
    
    async def _process_large_batch(self, message: Dict[str, Any]):
        """Process large batches with parallel workflows"""
        try:
            commits = message.get('commits', [])
            batch_size = 5  # Process in chunks of 5
            
            logger.info(f"🔀 Processing {len(commits)} commits in batches of {batch_size}")
            
            # Split into batches
            for i in range(0, len(commits), batch_size):
                batch = commits[i:i+batch_size]
                batch_message = message.copy()
                batch_message['commits'] = batch
                
                # Process batch with LangGraph
                asyncio.create_task(self._process_with_langgraph(batch_message))
                
                # Small delay between batches
                await asyncio.sleep(1)
            
        except Exception as e:
            logger.error(f"❌ Error processing large batch: {e}")
    
    async def _process_single_commit_direct(self, message: Dict[str, Any]):
        """Process single commits directly for efficiency"""
        try:
            commits = message.get('commits', [])
            if not commits:
                return
            
            commit = commits[0]
            logger.info(f"⚡ Direct processing commit: {commit.get('commit_hash', 'unknown')}")
            
            # Use document processing consumer directly
            document_processing_consumer._handle_document_processing(message)
            
        except Exception as e:
            logger.error(f"❌ Error in direct processing: {e}")
    
    async def _handle_workflow_results(self, final_state: Dict[str, Any], thread_id: str):
        """Handle LangGraph workflow results"""
        try:
            logger.info(f"📊 Processing LangGraph results for thread: {thread_id}")
            
            status = final_state.get('status', 'unknown')
            rag_updates = final_state.get('rag_updates', [])
            documents_created = final_state.get('documents_created', 0)
            errors = final_state.get('errors', [])
            
            logger.info(f"🎯 Workflow completed: {status}")
            logger.info(f"📄 Documents created: {documents_created}")
            logger.info(f"🔄 RAG updates: {len(rag_updates)}")
            
            if errors:
                logger.warning(f"⚠️ Workflow errors: {errors}")
            
            # Send RAG updates to document consumer
            if rag_updates:
                for rag_update in rag_updates:
                    await self._send_rag_update(rag_update)
            
            # Publish completion event
            await self._publish_completion_event(final_state, thread_id)
            
            # Clean up thread state
            if thread_id in self.active_threads:
                del self.active_threads[thread_id]
            
        except Exception as e:
            logger.error(f"❌ Error handling workflow results: {e}")
    
    async def _send_rag_update(self, rag_update: Dict[str, Any]):
        """Send RAG update to document processing consumer"""
        try:
            # Add to MongoDB via document consumer
            await document_processing_consumer._add_commit_to_rag(rag_update)
            
            logger.info(f"💾 Sent RAG update for commit: {rag_update.get('commit_hash', 'unknown')}")
            
        except Exception as e:
            logger.error(f"❌ Error sending RAG update: {e}")
    
    async def _publish_completion_event(self, final_state: Dict[str, Any], thread_id: str):
        """Publish workflow completion event"""
        try:
            completion_event = {
                'event_type': 'langgraph_workflow_completed',
                'thread_id': thread_id,
                'status': final_state.get('status'),
                'documents_created': final_state.get('documents_created', 0),
                'rag_entries_added': final_state.get('rag_entries_added', 0),
                'processing_duration': self._calculate_duration(final_state),
                'errors': final_state.get('errors', []),
                'timestamp': datetime.utcnow().isoformat()
            }
            
            await kafka_event_bus.publish(
                topic=TopicName.SYSTEM_STATUS.value,
                message=completion_event,
                key=f"completion_{thread_id}"
            )
            
            logger.info(f"📤 Published completion event for thread: {thread_id}")
            
        except Exception as e:
            logger.error(f"❌ Error publishing completion event: {e}")
    
    def _calculate_duration(self, final_state: Dict[str, Any]) -> float:
        """Calculate processing duration"""
        try:
            start_time = final_state.get('start_time')
            end_time = final_state.get('end_time')
            
            if start_time and end_time:
                start_dt = datetime.fromisoformat(start_time)
                end_dt = datetime.fromisoformat(end_time)
                return (end_dt - start_dt).total_seconds()
            
        except Exception:
            pass
        
        return 0.0
    
    async def start_monitoring(self):
        """Start the monitoring loop"""
        logger.info("👀 Starting LangGraph monitoring loop...")
        
        while self.is_running:
            try:
                # Monitor trigger files
                await self._check_trigger_files()
                
                # Health check
                await self._health_check()
                
                # Wait before next check
                await asyncio.sleep(5)
                
            except Exception as e:
                logger.error(f"❌ Monitoring error: {e}")
                await asyncio.sleep(10)
    
    async def _check_trigger_files(self):
        """Check for trigger files and process with LangGraph"""
        try:
            watch_dir = Path(self.watch_path)
            trigger_patterns = ['TRIGGER_NOW', 'TRIGGER_SOURCE_PROCESSING', 'TRIGGER_*']
            
            # Look for trigger files
            trigger_files = []
            for pattern in trigger_patterns:
                trigger_files.extend(watch_dir.glob(pattern))
            
            for trigger_file in trigger_files:
                if trigger_file.is_file():
                    logger.info(f"🎯 Found trigger file: {trigger_file}")
                    await self._process_trigger_file(trigger_file)
                    
        except Exception as e:
            logger.error(f"❌ Error checking trigger files: {e}")
    
    async def _process_trigger_file(self, trigger_file: Path):
        """Process trigger file with LangGraph intelligence"""
        try:
            logger.info(f"🧠 Processing trigger file with LangGraph: {trigger_file}")
            
            # Read trigger file content
            with open(trigger_file, 'r') as f:
                trigger_data = json.load(f)
            
            # Create source change message
            source_change_message = {
                'event_type': 'source_repository_changes',
                'source_repo': trigger_data.get('metadata', {}).get('source_repo', self.source_repo_path),
                'commits': trigger_data.get('source_commits', []),
                'commit_count': len(trigger_data.get('source_commits', [])),
                'commits_since': trigger_data.get('metadata', {}).get('commits_since'),
                'processing_date': trigger_data.get('metadata', {}).get('processing_date'),
                'trigger_file': str(trigger_file),
                'timestamp': datetime.utcnow().isoformat()
            }
            
            # Process with LangGraph
            await self._process_with_langgraph(source_change_message)
            
            # Remove processed trigger file
            trigger_file.unlink()
            logger.info(f"🗑️ Removed processed trigger file: {trigger_file}")
            
        except Exception as e:
            logger.error(f"❌ Error processing trigger file {trigger_file}: {e}")
    
    async def _health_check(self):
        """Perform health check"""
        try:
            # Check Kafka health
            kafka_health = await kafka_event_bus.health_check()
            
            # Check active threads
            active_threads = len(self.active_threads)
            
            # Check system uptime
            uptime = (datetime.utcnow() - self.start_time).total_seconds()
            
            if kafka_health.get('status') == 'healthy':
                logger.info(f"💚 LangGraph Orchestrator healthy - uptime: {uptime:.1f}s, threads: {active_threads}")
            else:
                logger.warning(f"⚠️ Health warning - Kafka: {kafka_health.get('status')}")
            
        except Exception as e:
            logger.error(f"❌ Health check error: {e}")
    
    async def shutdown(self):
        """Gracefully shutdown the orchestrator"""
        logger.info("🛑 Shutting down LangGraph Orchestrator...")
        
        self.is_running = False
        
        # Wait for active workflows to complete
        if self.active_threads:
            logger.info(f"⏳ Waiting for {len(self.active_threads)} active workflows to complete...")
            await asyncio.sleep(5)  # Give workflows time to complete
        
        # Shutdown document consumer
        await document_processing_consumer.shutdown()
        
        # Shutdown Kafka event bus
        await kafka_event_bus.shutdown()
        
        logger.info("✅ LangGraph Orchestrator shutdown complete")

# Global orchestrator instance
langgraph_orchestrator = LangGraphOrchestrator()

def signal_handler(signum, frame):
    """Handle shutdown signals"""
    logger.info(f"🔔 Received signal {signum}, initiating shutdown...")
    asyncio.create_task(langgraph_orchestrator.shutdown())
    sys.exit(0)

async def main():
    """Main entry point"""
    try:
        # Register signal handlers
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
        
        # Initialize and start the orchestrator
        await langgraph_orchestrator.initialize()
        await langgraph_orchestrator.start_monitoring()
        
    except KeyboardInterrupt:
        logger.info("🔔 Keyboard interrupt received")
        await langgraph_orchestrator.shutdown()
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}")
        await langgraph_orchestrator.shutdown()
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())