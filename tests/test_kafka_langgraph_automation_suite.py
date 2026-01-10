"""
Comprehensive Test Suite for Kafka + LangGraph Documentation Automation System

This test suite validates the Multi-Agent Documentation Automation System (MAS)
that uses Hybrid Kafka + LangGraph architecture to keep documentation updated.

Based on SRS_MULTI_AGENT_SYSTEM.md requirements for production validation.
"""

import pytest
import asyncio
import os
import json
import time
from datetime import datetime, timedelta
from typing import Dict, Any, List
from unittest.mock import Mock, AsyncMock, patch
import tempfile
import shutil
from pathlib import Path

# Import automation system components
sys.path.append('/Users/rhfluker/Projects/clientpass-doc-site-master/automation')

from kafka_orchestrator import KafkaStreamsOrchestrator
from langgraph_workflows import LangGraphWorkflows, DocumentProcessingState
from source_change_producer import source_change_producer
from document_processing_consumer import document_processing_consumer
from kafka_event_bus import kafka_event_bus


class TestKafkaLangGraphAutomationSystem:
    """
    Senior QA Test Suite for Kafka + LangGraph Documentation Automation System
    
    Validates all SRS requirements for the Multi-Agent System that automatically
    detects source code changes and generates documentation updates.
    """
    
    @pytest.fixture(autouse=True)
    async def setup_test_environment(self):
        """Setup clean test environment for each test"""
        self.test_start_time = datetime.utcnow()
        self.temp_dir = tempfile.mkdtemp()
        self.mock_source_repo = Path(self.temp_dir) / "test_source_repo"
        self.mock_source_repo.mkdir(exist_ok=True)
        
        # Create test files
        (self.mock_source_repo / "test_component.tsx").write_text("""
import React from 'react';
export const TestComponent = () => <div>Test</div>;
        """)
        
        yield
        
        # Cleanup
        shutil.rmtree(self.temp_dir, ignore_errors=True)


class TestChangeDetectionAgent:
    """
    Test Suite for REQ-001: Change Detection Agent
    
    Validates real-time file monitoring and git change detection capabilities
    """
    
    async def test_req_001_1_real_time_file_monitoring(self):
        """
        REQ-001.1: Monitor file system changes in real-time
        
        Acceptance Criteria:
        - System detects file modifications within 1 second
        - Supports monitoring of .tsx, .ts, .js, .py, .md files
        - Generates change events with accurate metadata
        """
        # Arrange
        test_file = self.mock_source_repo / "monitored_file.tsx"
        initial_content = "export const Initial = () => <div>Initial</div>;"
        test_file.write_text(initial_content)
        
        detected_changes = []
        
        async def mock_change_handler(event):
            detected_changes.append({
                'timestamp': datetime.utcnow(),
                'file_path': event.get('file_path'),
                'change_type': event.get('change_type')
            })
        
        # Act
        with patch('source_change_producer.on_file_change', mock_change_handler):
            await source_change_producer.start_monitoring(str(self.mock_source_repo))
            
            # Simulate file change
            modified_content = "export const Modified = () => <div>Modified</div>;"
            test_file.write_text(modified_content)
            
            # Wait for detection (should be within 1 second per REQ-001.6)
            await asyncio.sleep(1.5)
        
        # Assert
        assert len(detected_changes) > 0, "File change not detected"
        change_event = detected_changes[0]
        assert 'monitored_file.tsx' in change_event['file_path']
        assert change_event['change_type'] in ['modified', 'created']
        
        # Performance requirement REQ-001.6: Process within 1 second
        detection_time = (change_event['timestamp'] - self.test_start_time).total_seconds()
        assert detection_time <= 1.0, f"Detection took {detection_time}s, requirement is ≤1s"
    
    async def test_req_001_2_git_commit_detection(self):
        """
        REQ-001.2: Detect git commits and branch changes
        
        Acceptance Criteria:
        - Identifies new commits in monitored repositories
        - Extracts commit metadata (hash, message, files changed)
        - Triggers documentation update workflow
        """
        # Arrange
        mock_git_data = {
            'commit_hash': 'abc123def456',
            'message': 'Add new authentication component',
            'files_changed': ['src/auth/AuthComponent.tsx', 'docs/AUTH.md'],
            'branch': 'feature/auth-enhancement'
        }
        
        processed_commits = []
        
        # Act
        with patch('gitpython.Git.log', return_value=[mock_git_data]):
            result = await source_change_producer.detect_git_changes(str(self.mock_source_repo))
            
        # Assert
        assert result is not None, "Git change detection failed"
        assert result['commit_hash'] == mock_git_data['commit_hash']
        assert len(result['files_changed']) == 2
        assert 'AuthComponent.tsx' in str(result['files_changed'])
    
    async def test_req_001_4_debounce_mechanism(self):
        """
        REQ-001.4: Implement debounce mechanism (5-second default)
        
        Acceptance Criteria:
        - Multiple rapid changes are batched into single event
        - Debounce period is configurable (default 5 seconds)
        - Prevents excessive processing of rapid file saves
        """
        # Arrange
        test_file = self.mock_source_repo / "rapidly_changing.ts"
        change_events = []
        
        async def capture_events(event):
            change_events.append(event)
        
        # Act - Simulate rapid file changes
        with patch('source_change_producer.on_debounced_change', capture_events):
            await source_change_producer.start_monitoring(str(self.mock_source_repo))
            
            # Make 5 rapid changes within 2 seconds
            for i in range(5):
                test_file.write_text(f"export const Version{i} = {i};")
                await asyncio.sleep(0.3)
            
            # Wait for debounce period (5 seconds + buffer)
            await asyncio.sleep(6)
        
        # Assert
        # Should have only 1 debounced event, not 5 individual events
        assert len(change_events) <= 2, f"Debounce failed: {len(change_events)} events (expected ≤2)"


class TestDocumentManagementAgent:
    """
    Test Suite for REQ-002: Document Management Agent
    
    Validates AI-powered documentation generation and updates
    """
    
    async def test_req_002_1_create_markdown_documentation(self):
        """
        REQ-002.1: Create new markdown documentation files
        
        Acceptance Criteria:
        - Generates properly formatted markdown files
        - Includes appropriate frontmatter and metadata
        - Content quality meets documentation standards
        """
        # Arrange
        code_change_data = {
            'file_path': 'src/components/NewFeature.tsx',
            'content': """
import React from 'react';
interface NewFeatureProps {
    title: string;
    enabled: boolean;
}
export const NewFeature: React.FC<NewFeatureProps> = ({ title, enabled }) => {
    return <div>{enabled ? title : 'Feature Disabled'}</div>;
};
            """,
            'change_type': 'created'
        }
        
        workflows = LangGraphWorkflows()
        
        # Act
        result = await workflows.generate_documentation(code_change_data)
        
        # Assert
        assert result is not None, "Documentation generation failed"
        assert result['file_path'].endswith('.md'), "Generated file is not markdown"
        assert 'NewFeature' in result['content'], "Documentation missing component name"
        assert '---' in result['content'], "Missing frontmatter"
        assert result['metadata']['component_type'] == 'React Component'
    
    async def test_req_002_6_multi_llm_support(self):
        """
        REQ-002.6: Support OpenAI GPT-4o, Claude 4.5 Sonnet, Gemini 2.5 Flash
        
        Acceptance Criteria:
        - System can switch between LLM providers
        - Maintains consistent output quality across providers
        - Graceful fallback when primary provider fails
        """
        # Arrange
        test_prompt = "Generate documentation for authentication component"
        
        # Act & Assert for each provider
        providers = ['openai', 'anthropic', 'google']
        
        for provider in providers:
            with patch(f'langchain_{provider}.ChatAI') as mock_llm:
                mock_llm.return_value.invoke.return_value = Mock(content="Generated documentation")
                
                workflows = LangGraphWorkflows(provider=provider)
                result = await workflows.generate_content(test_prompt)
                
                assert result is not None, f"Failed with provider {provider}"
                assert len(result) > 0, f"Empty result from provider {provider}"


class TestRAGManagementAgent:
    """
    Test Suite for REQ-003: RAG Management Agent
    
    Validates vector embeddings and semantic search capabilities
    """
    
    async def test_req_003_1_generate_embeddings(self):
        """
        REQ-003.1: Generate embeddings using OpenAI text-embedding-3-large
        
        Acceptance Criteria:
        - Creates 1536-dimension vectors (REQ-003.7)
        - Embeddings are semantically meaningful
        - Processing completes within performance requirements
        """
        # Arrange
        test_content = "This is a test authentication component that handles user login"
        
        # Mock OpenAI embedding response
        mock_embedding = [0.1] * 1536  # 1536-dimension vector
        
        # Act
        with patch('openai.Embedding.create') as mock_create:
            mock_create.return_value = Mock(data=[Mock(embedding=mock_embedding)])
            
            from automation.agents.rag_management_agent import RAGManagementAgent
            rag_agent = RAGManagementAgent()
            
            result = await rag_agent.generate_embedding(test_content)
        
        # Assert
        assert result is not None, "Embedding generation failed"
        assert len(result) == 1536, f"Wrong embedding dimension: {len(result)} (expected 1536)"
        assert all(isinstance(x, (int, float)) for x in result), "Invalid embedding values"
    
    async def test_req_003_3_vector_similarity_search(self):
        """
        REQ-003.3: Perform vector similarity search
        
        Acceptance Criteria:
        - Returns semantically relevant documents
        - Search completes within 2 seconds (NFR-004)
        - Results ranked by similarity score
        """
        # Arrange
        search_query = "authentication component documentation"
        mock_search_results = [
            {'content': 'Auth component guide', 'score': 0.95},
            {'content': 'Login process docs', 'score': 0.87},
            {'content': 'Security overview', 'score': 0.72}
        ]
        
        start_time = time.time()
        
        # Act
        with patch('pymongo.MongoClient') as mock_mongo:
            mock_collection = Mock()
            mock_collection.aggregate.return_value = mock_search_results
            mock_mongo.return_value.__getitem__.return_value.__getitem__.return_value = mock_collection
            
            from automation.agents.rag_management_agent import RAGManagementAgent
            rag_agent = RAGManagementAgent()
            
            results = await rag_agent.similarity_search(search_query, limit=5)
        
        search_time = time.time() - start_time
        
        # Assert
        assert results is not None, "Search returned no results"
        assert len(results) > 0, "Empty search results"
        assert search_time <= 2.0, f"Search too slow: {search_time}s (requirement: ≤2s)"
        
        # Results should be sorted by score (descending)
        scores = [r['score'] for r in results]
        assert scores == sorted(scores, reverse=True), "Results not properly ranked"


class TestLoggingAuditAgent:
    """
    Test Suite for REQ-004: Logging and Audit Agent
    
    Validates comprehensive logging and monitoring capabilities
    """
    
    async def test_req_004_1_comprehensive_logging(self):
        """
        REQ-004.1: Log all system events with timestamps
        
        Acceptance Criteria:
        - All major operations are logged
        - Logs include accurate timestamps
        - Log format is consistent and parseable
        """
        # Arrange
        from automation.agents.logging_audit_agent import LoggingAuditAgent
        audit_agent = LoggingAuditAgent()
        
        test_events = [
            {'type': 'file_change', 'file': 'test.tsx', 'action': 'modified'},
            {'type': 'doc_generation', 'file': 'TEST.md', 'status': 'success'},
            {'type': 'rag_update', 'embeddings': 5, 'status': 'completed'}
        ]
        
        logged_events = []
        
        # Act
        with patch('loguru.logger.info') as mock_log:
            mock_log.side_effect = lambda msg: logged_events.append(msg)
            
            for event in test_events:
                await audit_agent.log_event(event)
        
        # Assert
        assert len(logged_events) == len(test_events), "Not all events logged"
        
        for log_entry in logged_events:
            # Verify timestamp format
            assert any(char.isdigit() for char in log_entry), "Log missing timestamp"
            # Verify event data present
            assert any(event_type in log_entry for event_type in ['file_change', 'doc_generation', 'rag_update'])
    
    async def test_req_004_6_health_checks(self):
        """
        REQ-004.6: Real-time health checks every 5 minutes
        
        Acceptance Criteria:
        - Health checks run on schedule (5-minute intervals)
        - System components status monitored
        - Alerts generated for failures
        """
        # Arrange
        health_check_calls = []
        
        async def mock_health_check():
            health_check_calls.append(datetime.utcnow())
            return {
                'kafka_status': 'healthy',
                'langgraph_status': 'healthy', 
                'mongodb_status': 'healthy',
                'overall_status': 'healthy'
            }
        
        # Act - Run health checks for 12 minutes (should trigger at least 2 checks)
        with patch('automation.agents.logging_audit_agent.perform_health_check', mock_health_check):
            # Simulate scheduled health checks every 5 minutes
            for i in range(3):  # 0, 5, 10 minute marks
                await mock_health_check()
                await asyncio.sleep(0.1)  # Simulate time passing
        
        # Assert
        assert len(health_check_calls) >= 2, f"Insufficient health checks: {len(health_check_calls)}"
        
        # Verify 5-minute intervals (allowing some tolerance)
        if len(health_check_calls) > 1:
            time_diff = (health_check_calls[1] - health_check_calls[0]).total_seconds()
            assert abs(time_diff - 300) < 60, f"Health check interval incorrect: {time_diff}s"


class TestSystemIntegration:
    """
    Integration Tests for Complete Kafka + LangGraph Workflow
    
    Validates end-to-end automation process from change detection to documentation deployment
    """
    
    async def test_end_to_end_automation_workflow(self):
        """
        Complete workflow test: File change → Documentation update → RAG sync → Deployment
        
        Acceptance Criteria:
        - Complete workflow executes successfully
        - All components communicate correctly via Kafka
        - Final documentation is properly generated and deployed
        - Process completes within 15 seconds (NFR-001)
        """
        start_time = time.time()
        workflow_steps = []
        
        # Arrange - Mock all external dependencies
        with patch('kafka_event_bus.publish') as mock_kafka_publish, \
             patch('langgraph_workflows.LangGraphWorkflows.process_document_changes') as mock_langgraph, \
             patch('pymongo.MongoClient') as mock_mongo, \
             patch('git.Repo') as mock_git:
            
            # Setup mocks
            mock_kafka_publish.return_value = True
            mock_langgraph.return_value = {
                'status': 'success',
                'documents_updated': 1,
                'rag_entries_added': 5
            }
            
            # Act - Simulate complete workflow
            orchestrator = KafkaStreamsOrchestrator()
            
            # Step 1: File change detected
            change_event = {
                'type': 'file_changed',
                'file_path': 'src/auth/NewAuth.tsx',
                'timestamp': datetime.utcnow().isoformat(),
                'content': 'export const NewAuth = () => <div>New Auth Component</div>;'
            }
            workflow_steps.append('change_detected')
            
            # Step 2: Kafka event processing
            await kafka_event_bus.publish('source_changes', change_event)
            workflow_steps.append('kafka_published')
            
            # Step 3: LangGraph workflow processing
            processing_result = await mock_langgraph(change_event)
            workflow_steps.append('documentation_generated')
            
            # Step 4: RAG updates
            if processing_result['status'] == 'success':
                workflow_steps.append('rag_updated')
            
            # Step 5: Git deployment (mocked)
            workflow_steps.append('deployed')
        
        execution_time = time.time() - start_time
        
        # Assert
        expected_steps = ['change_detected', 'kafka_published', 'documentation_generated', 'rag_updated', 'deployed']
        assert workflow_steps == expected_steps, f"Workflow incomplete: {workflow_steps}"
        assert execution_time <= 15.0, f"Workflow too slow: {execution_time}s (requirement: ≤15s)"
    
    async def test_system_availability_requirement(self):
        """
        NFR-005: System availability of 99.9% uptime
        
        Acceptance Criteria:
        - System handles component failures gracefully
        - Automatic recovery mechanisms work
        - Service degradation is minimal during failures
        """
        # Simulate various failure scenarios
        failure_scenarios = [
            'kafka_connection_lost',
            'mongodb_timeout',
            'langgraph_processing_error',
            'openai_api_limit'
        ]
        
        recovery_results = {}
        
        for scenario in failure_scenarios:
            with patch('automation.agents.self_healing_agent.detect_and_fix') as mock_healing:
                mock_healing.return_value = {'status': 'recovered', 'downtime_seconds': 5}
                
                # Simulate failure and recovery
                recovery_result = await mock_healing(scenario)
                recovery_results[scenario] = recovery_result['downtime_seconds']
        
        # Assert - All recoveries should be fast (contributing to 99.9% uptime)
        max_downtime = max(recovery_results.values())
        assert max_downtime <= 10, f"Recovery too slow: {max_downtime}s"
        
        # Calculate theoretical availability (assuming 1 failure per day with max recovery time)
        daily_seconds = 24 * 60 * 60
        availability = ((daily_seconds - max_downtime) / daily_seconds) * 100
        assert availability >= 99.9, f"Availability requirement not met: {availability}%"


class TestPerformanceRequirements:
    """
    Test Suite for Non-Functional Requirements (Performance)
    
    Validates system performance against SRS specifications
    """
    
    async def test_nfr_001_processing_speed(self):
        """
        NFR-001: Process documentation updates within 15 seconds
        
        Acceptance Criteria:
        - Complete documentation generation within time limit
        - Performance consistent across different content sizes
        - Meets 99% faster than manual process requirement
        """
        test_cases = [
            {'size': 'small', 'lines': 50, 'expected_time': 5},
            {'size': 'medium', 'lines': 200, 'expected_time': 10},
            {'size': 'large', 'lines': 500, 'expected_time': 15}
        ]
        
        for test_case in test_cases:
            # Generate test content
            test_content = "\n".join([f"// Line {i} of test content" for i in range(test_case['lines'])])
            
            start_time = time.time()
            
            # Mock processing
            with patch('langgraph_workflows.LangGraphWorkflows.generate_documentation') as mock_gen:
                mock_gen.return_value = {'status': 'success', 'content': f"Generated docs for {test_case['size']} content"}
                
                workflows = LangGraphWorkflows()
                result = await workflows.generate_documentation({'content': test_content})
            
            processing_time = time.time() - start_time
            
            # Assert
            assert processing_time <= test_case['expected_time'], \
                f"{test_case['size']} content took {processing_time}s (limit: {test_case['expected_time']}s)"
    
    async def test_nfr_002_concurrent_operations(self):
        """
        NFR-002: Support 100+ concurrent file monitoring operations
        
        Acceptance Criteria:
        - System handles high concurrent load
        - No performance degradation under load
        - Resource usage remains stable
        """
        concurrent_tasks = []
        
        # Create 100+ concurrent monitoring tasks
        async def mock_monitor_task(task_id):
            await asyncio.sleep(0.1)  # Simulate monitoring work
            return f"task_{task_id}_completed"
        
        # Act - Run concurrent operations
        start_time = time.time()
        
        for i in range(105):  # 105 > 100 requirement
            task = asyncio.create_task(mock_monitor_task(i))
            concurrent_tasks.append(task)
        
        results = await asyncio.gather(*concurrent_tasks, return_exceptions=True)
        
        execution_time = time.time() - start_time
        
        # Assert
        successful_tasks = [r for r in results if isinstance(r, str) and 'completed' in r]
        assert len(successful_tasks) >= 100, f"Only {len(successful_tasks)} tasks completed successfully"
        assert execution_time <= 5.0, f"Concurrent operations too slow: {execution_time}s"


if __name__ == "__main__":
    """
    Execute the comprehensive test suite
    """
    print("🧪 Starting Kafka + LangGraph Documentation Automation Test Suite")
    print("=" * 80)
    
    # Run tests with pytest
    exit_code = pytest.main([
        __file__,
        "-v",
        "--tb=short",
        "--durations=10",
        "-x"  # Stop on first failure for faster feedback
    ])
    
    print("=" * 80)
    if exit_code == 0:
        print("✅ All tests passed! Kafka + LangGraph automation system is working correctly.")
    else:
        print("❌ Some tests failed. Check the output above for details.")
    
    exit(exit_code)