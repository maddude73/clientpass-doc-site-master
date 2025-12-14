"""
Direct LangGraph Processor - No Kafka Required
Processes trigger files directly with LangGraph intelligence
"""

import asyncio
import json
import logging
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, Any

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from langgraph_workflows import LangGraphWorkflows, DocumentProcessingState

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)8s | %(name)s:%(funcName)s:%(lineno)d - %(message)s',
    handlers=[
        logging.FileHandler('/Users/rhfluker/Projects/clientpass-doc-site-master/automation/logs/direct_processor.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

class DirectLangGraphProcessor:
    """
    Direct LangGraph processor that works without Kafka
    Perfect for immediate testing and processing
    """
    
    def __init__(self):
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        self.workflows = None
        self.document_workflow = None
        
        # Paths
        self.watch_path = "/Users/rhfluker/Projects/clientpass-doc-site-master"
        self.source_repo_path = "/Users/rhfluker/Projects/style-referral-ring"
        
        # MongoDB simulation (we'll create documents but not persist for now)
        self.processed_documents = []
        
    async def initialize(self):
        """Initialize the direct processor"""
        try:
            logger.info("🧠 Initializing Direct LangGraph Processor...")
            
            # Initialize LangGraph workflows
            self.workflows = LangGraphWorkflows(self.openai_api_key)
            self.document_workflow = self.workflows.create_document_processing_workflow()
            
            logger.info("✅ Direct LangGraph Processor initialized")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize processor: {e}")
            raise
    
    async def process_trigger_file(self, trigger_file_path: str):
        """Process a specific trigger file"""
        try:
            logger.info(f"🎯 Processing trigger file: {trigger_file_path}")
            
            trigger_file = Path(trigger_file_path)
            if not trigger_file.exists():
                logger.error(f"❌ Trigger file not found: {trigger_file_path}")
                return False
            
            # Read trigger file
            with open(trigger_file, 'r') as f:
                trigger_data = json.load(f)
            
            # Extract commits
            commits = trigger_data.get('source_commits', [])
            metadata = trigger_data.get('metadata', {})
            
            logger.info(f"📝 Processing {len(commits)} commits from trigger file")
            
            # Create initial state
            initial_state: DocumentProcessingState = {
                'source_commits': commits,
                'source_repo': metadata.get('source_repo', self.source_repo_path),
                'trigger_data': trigger_data,
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
            
            # Execute LangGraph workflow
            thread_id = f"direct_processing_{int(datetime.utcnow().timestamp())}"
            config = {"configurable": {"thread_id": thread_id}}
            
            logger.info(f"🔄 Starting LangGraph workflow: {thread_id}")
            
            final_state = None
            step_count = 0
            
            async for state in self.document_workflow.astream(initial_state, config):
                step_count += 1
                current_step = state.get('current_step', 'unknown')
                status = state.get('status', 'unknown')
                
                logger.info(f"🎯 Step {step_count}: {current_step} ({status})")
                
                # Store latest state
                final_state = state
                
                # Check for completion
                if status in ['completed_successfully', 'completed_with_errors', 'fatal_error']:
                    break
            
            # Process results
            if final_state:
                await self._handle_results(final_state, trigger_file)
                return True
            else:
                logger.error("❌ Workflow completed without final state")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error processing trigger file: {e}")
            return False
    
    async def _handle_results(self, final_state: Dict[str, Any], trigger_file: Path):
        """Handle workflow results"""
        try:
            status = final_state.get('status', 'unknown')
            docs_created = final_state.get('documents_created', 0)
            rag_updates = final_state.get('rag_updates', [])
            documentation_updates = final_state.get('documentation_updates', [])
            errors = final_state.get('errors', [])
            
            logger.info(f"📊 Processing Results:")
            logger.info(f"   Status: {status}")
            logger.info(f"   Documents Created: {docs_created}")
            logger.info(f"   RAG Updates: {len(rag_updates)}")
            logger.info(f"   Documentation Updates: {len(documentation_updates)}")
            
            if errors:
                logger.warning(f"⚠️ Errors encountered: {errors}")
            
            # Save results locally for inspection
            results_file = Path(self.watch_path) / f"processing_results_{int(datetime.utcnow().timestamp())}.json"
            
            results_data = {
                'status': status,
                'processing_time': datetime.utcnow().isoformat(),
                'trigger_file': str(trigger_file),
                'documents_created': docs_created,
                'rag_updates_count': len(rag_updates),
                'documentation_updates': documentation_updates,
                'rag_updates': rag_updates,
                'errors': errors,
                'final_state': final_state
            }
            
            with open(results_file, 'w') as f:
                json.dump(results_data, f, indent=2, default=str)
            
            logger.info(f"💾 Results saved to: {results_file}")
            
            # Store in memory for this session
            self.processed_documents.extend(documentation_updates)
            
            # Remove processed trigger file
            if status == 'completed_successfully':
                trigger_file.unlink()
                logger.info(f"🗑️ Removed processed trigger file: {trigger_file}")
            
            # Print summary
            print(f"\n{'='*60}")
            print(f"🎯 LANGGRAPH PROCESSING COMPLETE")
            print(f"{'='*60}")
            print(f"Status: {status}")
            print(f"Documents Created: {docs_created}")
            print(f"RAG Updates: {len(rag_updates)}")
            if errors:
                print(f"Errors: {len(errors)}")
            print(f"Results saved to: {results_file}")
            print(f"{'='*60}\n")
            
        except Exception as e:
            logger.error(f"❌ Error handling results: {e}")
    
    async def scan_and_process_triggers(self):
        """Scan for trigger files and process them"""
        try:
            logger.info("🔍 Scanning for trigger files...")
            
            watch_dir = Path(self.watch_path)
            trigger_patterns = ['TRIGGER_NOW', 'TRIGGER_SOURCE_PROCESSING', 'TRIGGER_*']
            
            processed_any = False
            
            # Look for trigger files
            for pattern in trigger_patterns:
                trigger_files = list(watch_dir.glob(pattern))
                
                for trigger_file in trigger_files:
                    if trigger_file.is_file():
                        logger.info(f"🎯 Found trigger file: {trigger_file}")
                        success = await self.process_trigger_file(str(trigger_file))
                        if success:
                            processed_any = True
            
            if not processed_any:
                logger.info("📄 No trigger files found to process")
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error scanning for triggers: {e}")
            return False

async def main():
    """Main entry point for direct processing"""
    try:
        print("🧠 LangGraph Direct Processor Starting...")
        
        # Initialize processor
        processor = DirectLangGraphProcessor()
        await processor.initialize()
        
        # Check for specific trigger file or scan
        trigger_file = "/Users/rhfluker/Projects/clientpass-doc-site-master/TRIGGER_NOW"
        
        if Path(trigger_file).exists():
            print(f"🎯 Processing specific trigger file: {trigger_file}")
            success = await processor.process_trigger_file(trigger_file)
            
            if success:
                print("✅ Processing completed successfully!")
            else:
                print("❌ Processing failed!")
        else:
            print("🔍 Scanning for trigger files...")
            success = await processor.scan_and_process_triggers()
            
            if success:
                print("✅ All trigger files processed!")
            else:
                print("📄 No trigger files found")
        
        print("\n🎯 Direct processor completed!")
        
    except KeyboardInterrupt:
        print("\n🔔 Interrupted by user")
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        logger.error(f"Fatal error: {e}")

if __name__ == "__main__":
    asyncio.run(main())