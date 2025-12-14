"""
Hybrid Kafka + LangGraph Test Runner
Tests the integrated system with intelligent workflows
"""

import asyncio
import json
import logging
from datetime import datetime
from pathlib import Path

from langgraph_orchestrator import langgraph_orchestrator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)8s | %(name)s:%(funcName)s:%(lineno)d - %(message)s'
)

logger = logging.getLogger(__name__)

async def test_langgraph_kafka_integration():
    """Test the LangGraph + Kafka integration"""
    try:
        logger.info("🧪 Starting LangGraph + Kafka Integration Test")
        
        # Create test trigger file
        test_trigger_data = {
            "source_commits": [
                {
                    "commit_hash": "852825d",
                    "message": "Fix Pro Hub ad click flow",
                    "files_changed": ["src/components/pages/ProHubPage.tsx"],
                    "impact": "Fixed Pro Hub ad click functionality"
                },
                {
                    "commit_hash": "65e82da", 
                    "message": "Changes",
                    "files_changed": ["src/components/pages/HomePage.tsx", "src/components/pages/InboxPage.tsx"],
                    "impact": "Updates to Home and Inbox pages"
                }
            ],
            "metadata": {
                "source_repo": "/Users/rhfluker/Projects/style-referral-ring",
                "commits_since": "2025-11-08",
                "total_commits": 2,
                "processing_date": datetime.utcnow().isoformat()
            }
        }
        
        # Write test trigger file
        trigger_file_path = Path("/Users/rhfluker/Projects/clientpass-doc-site-master/TRIGGER_LANGGRAPH_TEST")
        with open(trigger_file_path, 'w') as f:
            json.dump(test_trigger_data, f, indent=2)
        
        logger.info(f"📝 Created test trigger file: {trigger_file_path}")
        
        # Initialize orchestrator
        await langgraph_orchestrator.initialize()
        
        # Process the trigger file
        await langgraph_orchestrator._process_trigger_file(trigger_file_path)
        
        logger.info("✅ LangGraph + Kafka integration test completed")
        
        # Shutdown
        await langgraph_orchestrator.shutdown()
        
    except Exception as e:
        logger.error(f"❌ Integration test failed: {e}")
        raise

async def test_workflow_intelligence():
    """Test LangGraph workflow intelligence"""
    try:
        logger.info("🧠 Testing LangGraph workflow intelligence")
        
        # Create complex test scenario
        complex_commits = []
        for i in range(15):  # Large batch to test routing
            commit = {
                "commit_hash": f"test{i:03d}",
                "message": f"Test commit {i}",
                "files_changed": [f"src/test/file{i}.tsx"],
                "impact": f"Test impact {i}"
            }
            complex_commits.append(commit)
        
        test_message = {
            'event_type': 'source_repo_changes_detected',
            'commits': complex_commits,
            'source_repo': '/test/repo'
        }
        
        # Initialize orchestrator
        await langgraph_orchestrator.initialize()
        
        # Test intelligent routing
        await langgraph_orchestrator._route_processing_request(test_message)
        
        logger.info("✅ Workflow intelligence test completed")
        
        # Shutdown
        await langgraph_orchestrator.shutdown()
        
    } except Exception as e:
        logger.error(f"❌ Workflow intelligence test failed: {e}")
        raise

if __name__ == "__main__":
    # Run tests
    asyncio.run(test_langgraph_kafka_integration())
    print("\n" + "="*50 + "\n")
    asyncio.run(test_workflow_intelligence())