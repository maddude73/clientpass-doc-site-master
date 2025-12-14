#!/usr/bin/env python3
"""
Comprehensive Test Suite for Kafka + LangGraph System
Validates all requirements for the enterprise-grade automation system
"""

import pytest
import asyncio
import sys
import json
import time
import tempfile
import shutil
import os
from pathlib import Path
from datetime import datetime, timedelta
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

# Add automation directory to path
automation_dir = Path(__file__).parent / "automation"
sys.path.insert(0, str(automation_dir))

try:
    # Import Kafka + LangGraph components
    from kafka_config import KafkaConfig, TopicConfig
    from kafka_event_bus import KafkaEventBus
    from kafka_orchestrator import KafkaOrchestrator  
    from langgraph_workflows import LangGraphWorkflows, DocumentProcessingState
    from langgraph_orchestrator import LangGraphOrchestrator
    from direct_langgraph_processor import DirectLangGraphProcessor
    from automated_langgraph_monitor import AutomatedLangGraphMonitor
except ImportError as e:
    print(f"⚠️ Import error: {e}")
    print("Some components may not be available for testing")

@dataclass
class TestResult:
    """Test result data structure"""
    test_id: str
    description: str
    status: str  # PASS, FAIL, SKIP
    duration: float
    details: Optional[str] = None
    error: Optional[str] = None

class KafkaLangGraphTestSuite:
    """Comprehensive test suite for Kafka + LangGraph system"""
    
    def __init__(self):
        self.test_results: List[TestResult] = []
        self.temp_dir: Optional[Path] = None
        self.kafka_config = None
        self.test_start_time = datetime.now()
        
    async def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Kafka + LangGraph System Test Suite")
        print("=" * 60)
        print(f"📅 Started: {self.test_start_time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Setup test environment
        await self.setup_test_environment()
        
        try:
            # Core System Tests
            await self.test_kafka_configuration()           # REQ-KAFKA-001
            await self.test_kafka_event_bus()              # REQ-KAFKA-002  
            await self.test_langgraph_workflows()          # REQ-LANGGRAPH-001
            await self.test_langgraph_orchestrator()       # REQ-LANGGRAPH-002
            await self.test_direct_processing()            # REQ-PROCESSING-001
            await self.test_automated_monitoring()         # REQ-MONITORING-001
            
            # Integration Tests
            await self.test_kafka_langgraph_integration()  # REQ-INTEGRATION-001
            await self.test_end_to_end_processing()        # REQ-E2E-001
            await self.test_ai_analysis_pipeline()         # REQ-AI-001
            
            # Reliability Tests  
            await self.test_fault_tolerance()              # REQ-RELIABILITY-001
            await self.test_message_persistence()          # REQ-RELIABILITY-002
            await self.test_exactly_once_delivery()        # REQ-RELIABILITY-003
            await self.test_error_recovery()               # REQ-RELIABILITY-004
            
            # Performance Tests
            await self.test_throughput_performance()       # REQ-PERFORMANCE-001
            await self.test_latency_requirements()         # REQ-PERFORMANCE-002
            await self.test_scalability()                  # REQ-PERFORMANCE-003
            await self.test_resource_usage()               # REQ-PERFORMANCE-004
            
            # Security and Compliance Tests
            await self.test_data_security()                # REQ-SECURITY-001
            await self.test_access_control()               # REQ-SECURITY-002
            await self.test_audit_logging()                # REQ-SECURITY-003
            
        finally:
            await self.cleanup_test_environment()
        
        # Generate comprehensive report
        self.generate_test_report()
        return self.calculate_success_rate()
    
    async def setup_test_environment(self):
        """Setup isolated test environment"""
        self.temp_dir = Path(tempfile.mkdtemp(prefix="kafka_langgraph_test_"))
        print(f"📁 Test environment: {self.temp_dir}")
        
        # Create test directories
        (self.temp_dir / "logs").mkdir()
        (self.temp_dir / "data").mkdir()

        
        # Initialize test configuration
        self.kafka_config = KafkaConfig()
    
    async def cleanup_test_environment(self):
        """Cleanup test resources"""
        if self.temp_dir and self.temp_dir.exists():
            shutil.rmtree(self.temp_dir)
            print(f"🧹 Cleaned up: {self.temp_dir}")
    
    # =============================================================================
    # CORE SYSTEM TESTS
    # =============================================================================
    
    async def test_kafka_configuration(self):
        """REQ-KAFKA-001: Kafka Configuration Validation"""
        test_id = "REQ-KAFKA-001"
        start_time = time.time()
        
        try:
            print(f"\n🔧 {test_id}: Testing Kafka Configuration...")
            
            # Test configuration loading
            config = KafkaConfig()
            assert config.bootstrap_servers, "Bootstrap servers must be configured"
            assert config.producer_config, "Producer config must be present"
            assert config.consumer_config, "Consumer config must be present"
            
            # Test topic configurations
            topic_configs = config.get_topic_configs()
            required_topics = ['source-changes', 'document-processing', 'rag-updates', 'system-status', 'error-events']
            
            for topic in required_topics:
                assert topic in topic_configs, f"Required topic {topic} not configured"
                topic_config = topic_configs[topic]
                assert topic_config.partitions > 0, f"Topic {topic} must have partitions > 0"
                assert topic_config.replication_factor > 0, f"Topic {topic} must have replication_factor > 0"
            
            # Test enterprise-grade settings
            producer_config = config.producer_config
            assert producer_config.get('acks') == 'all', "Producer must use acks=all for reliability"
            assert producer_config.get('enable_idempotence') == True, "Producer must enable idempotence"
            assert producer_config.get('retries') >= 10, "Producer must have sufficient retries"
            
            duration = time.time() - start_time
            self.test_results.append(TestResult(test_id, "Kafka Configuration", "PASS", duration))
            print(f"✅ {test_id}: PASSED ({duration:.2f}s)")
            
        except Exception as e:
            duration = time.time() - start_time
            self.test_results.append(TestResult(test_id, "Kafka Configuration", "FAIL", duration, error=str(e)))
            print(f"❌ {test_id}: FAILED - {str(e)}")
    
    async def test_kafka_event_bus(self):
        """REQ-KAFKA-002: Kafka Event Bus Functionality"""
        test_id = "REQ-KAFKA-002"
        start_time = time.time()
        
        try:
            print(f"\n📨 {test_id}: Testing Kafka Event Bus...")
            
            # Test event bus initialization
            event_bus = KafkaEventBus()
            await event_bus.initialize()
            
            # Test message publishing
            test_message = {
                "timestamp": datetime.now().isoformat(),
                "type": "test_message",
                "data": {"test": "value"}
            }
            
            # Publish to test topic
            result = await event_bus.publish('source-changes', test_message)
            assert result, "Message publishing must succeed"
            
            # Test message consumption (with timeout)
            messages = await event_bus.consume('source-changes', max_messages=1, timeout=5.0)
            assert len(messages) > 0, "Must receive published message"
            
            received_message = messages[0]
            assert received_message['type'] == 'test_message', "Received message must match sent message"
            
            await event_bus.close()
            
            duration = time.time() - start_time
            self.test_results.append(TestResult(test_id, "Kafka Event Bus", "PASS", duration))
            print(f"✅ {test_id}: PASSED ({duration:.2f}s)")
            
        except Exception as e:
            duration = time.time() - start_time
            self.test_results.append(TestResult(test_id, "Kafka Event Bus", "FAIL", duration, error=str(e)))
            print(f"❌ {test_id}: FAILED - {str(e)}")
    
    async def test_langgraph_workflows(self):
        """REQ-LANGGRAPH-001: LangGraph Workflow Validation"""
        test_id = "REQ-LANGGRAPH-001"
        start_time = time.time()
        
        try:
            print(f"\n🧠 {test_id}: Testing LangGraph Workflows...")
            
            # Test workflow initialization
            workflows = LangGraphWorkflows()
            workflow_graph = workflows.create_document_processing_workflow()
            assert workflow_graph, "Workflow graph must be created"
            
            # Test workflow state
            test_state = DocumentProcessingState(
                commits=["test_commit_hash"],
                batch_size=1,
                processing_results=[],
                ai_analysis={},
                current_step="analyze_commits",
                errors=[]
            )
            
            # Test AI analysis (with mock if OpenAI not available)
            with patch('langchain_openai.ChatOpenAI') as mock_llm:
                mock_response = Mock()
                mock_response.content = json.dumps({
                    "component_type": "Page Component",
                    "impact_level": "High", 
                    "user_facing": True,
                    "analysis": "Test analysis"
                })
                mock_llm.return_value.invoke.return_value = mock_response
                
                # Test workflow execution
                workflows.llm = mock_llm.return_value
                result = await workflows._analyze_commits(test_state)
                
                assert result, "Workflow must return result"
                assert "ai_analysis" in result, "Result must contain AI analysis"
            
            duration = time.time() - start_time
            self.test_results.append(TestResult(test_id, "LangGraph Workflows", "PASS", duration))
            print(f"✅ {test_id}: PASSED ({duration:.2f}s)")
            
        except Exception as e:
            duration = time.time() - start_time
            self.test_results.append(TestResult(test_id, "LangGraph Workflows", "FAIL", duration, error=str(e)))
            print(f"❌ {test_id}: FAILED - {str(e)}")
    
    async def test_langgraph_orchestrator(self):
        """REQ-LANGGRAPH-002: LangGraph Orchestrator Integration"""
        test_id = "REQ-LANGGRAPH-002"
        start_time = time.time()
        
        try:
            print(f"\n🎯 {test_id}: Testing LangGraph Orchestrator...")
            
            # Test orchestrator initialization
            orchestrator = LangGraphOrchestrator()
            await orchestrator.initialize()
            
            # Test processing pipeline
            test_commits = ["commit1", "commit2"]
            result = await orchestrator.process_commits(test_commits)
            
            assert result, "Orchestrator must return processing result"
            assert "status" in result, "Result must include status"
            assert result["status"] in ["completed_successfully", "completed_with_errors"], "Status must be valid"
            
            await orchestrator.shutdown()
            
            duration = time.time() - start_time
            self.test_results.append(TestResult(test_id, "LangGraph Orchestrator", "PASS", duration))
            print(f"✅ {test_id}: PASSED ({duration:.2f}s)")
            
        except Exception as e:
            duration = time.time() - start_time
            self.test_results.append(TestResult(test_id, "LangGraph Orchestrator", "FAIL", duration, error=str(e)))
            print(f"❌ {test_id}: FAILED - {str(e)}")
    
    # =============================================================================
    # INTEGRATION TESTS  
    # =============================================================================
    
    async def test_kafka_langgraph_integration(self):
        """REQ-INTEGRATION-001: Kafka + LangGraph Integration"""
        test_id = "REQ-INTEGRATION-001"
        start_time = time.time()
        
        try:
            print(f"\n🔗 {test_id}: Testing Kafka + LangGraph Integration...")
            
            # Test integrated processing pipeline
            event_bus = KafkaEventBus()
            orchestrator = LangGraphOrchestrator()
            
            await event_bus.initialize()
            await orchestrator.initialize()
            
            # Publish test change event
            change_event = {
                "timestamp": datetime.now().isoformat(),
                "type": "source_change",
                "commits": ["integration_test_commit"],
                "files_changed": ["test_file.py"]
            }
            
            await event_bus.publish('source-changes', change_event)
            
            # Process through LangGraph
            result = await orchestrator.process_commits(change_event["commits"])
            assert result["status"] == "completed_successfully", "Integration processing must succeed"
            
            await event_bus.close()
            await orchestrator.shutdown()
            
            duration = time.time() - start_time
            self.test_results.append(TestResult(test_id, "Kafka + LangGraph Integration", "PASS", duration))
            print(f"✅ {test_id}: PASSED ({duration:.2f}s)")
            
        except Exception as e:
            duration = time.time() - start_time
            self.test_results.append(TestResult(test_id, "Kafka + LangGraph Integration", "FAIL", duration, error=str(e)))
            print(f"❌ {test_id}: FAILED - {str(e)}")
    
    async def test_end_to_end_processing(self):
        """REQ-E2E-001: End-to-End Processing Pipeline"""
        test_id = "REQ-E2E-001"
        start_time = time.time()
        
        try:
            print(f"\n🔄 {test_id}: Testing End-to-End Processing...")
            
            # Test complete pipeline from git change to RAG update
            processor = DirectLangGraphProcessor()
            
            # Simulate git commits
            test_commits = [
                {
                    "hash": "e2e_test_commit_1",
                    "message": "Test: Update component functionality",
                    "files": ["src/components/TestComponent.tsx"],
                    "timestamp": datetime.now().isoformat()
                }
            ]
            
            # Process through complete pipeline
            result = await processor.process_commits(test_commits)
            
            # Validate end-to-end results
            assert result, "E2E processing must return result"
            assert "documents_created" in result, "Result must include created documents"
            assert "rag_entries" in result, "Result must include RAG entries"
            assert result.get("status") == "completed_successfully", "E2E processing must complete successfully"
            
            duration = time.time() - start_time
            self.test_results.append(TestResult(test_id, "End-to-End Processing", "PASS", duration))
            print(f"✅ {test_id}: PASSED ({duration:.2f}s)")
            
        except Exception as e:
            duration = time.time() - start_time
            self.test_results.append(TestResult(test_id, "End-to-End Processing", "FAIL", duration, error=str(e)))
            print(f"❌ {test_id}: FAILED - {str(e)}")
    
    # =============================================================================
    # RELIABILITY TESTS
    # =============================================================================
    
    async def test_fault_tolerance(self):
        """REQ-RELIABILITY-001: System Fault Tolerance"""
        test_id = "REQ-RELIABILITY-001"
        start_time = time.time()
        
        try:
            print(f"\n🛡️ {test_id}: Testing Fault Tolerance...")
            
            orchestrator = LangGraphOrchestrator()
            
            # Test graceful handling of component failures
            with patch.object(orchestrator, '_process_batch') as mock_process:
                # Simulate processing failure
                mock_process.side_effect = Exception("Simulated processing failure")
                
                result = await orchestrator.process_commits(["fault_test_commit"])
                
                # System should handle failure gracefully
                assert result, "System must return result even on failure"
                assert result.get("status") == "completed_with_errors", "Status should indicate errors"
                assert "errors" in result, "Result should include error information"
            
            duration = time.time() - start_time
            self.test_results.append(TestResult(test_id, "Fault Tolerance", "PASS", duration))
            print(f"✅ {test_id}: PASSED ({duration:.2f}s)")
            
        except Exception as e:
            duration = time.time() - start_time
            self.test_results.append(TestResult(test_id, "Fault Tolerance", "FAIL", duration, error=str(e)))
            print(f"❌ {test_id}: FAILED - {str(e)}")
    
    async def test_message_persistence(self):
        """REQ-RELIABILITY-002: Message Persistence"""
        test_id = "REQ-RELIABILITY-002"
        start_time = time.time()
        
        try:
            print(f"\n💾 {test_id}: Testing Message Persistence...")
            
            event_bus = KafkaEventBus()
            await event_bus.initialize()
            
            # Test message durability
            persistent_message = {
                "id": "persistence_test_001",
                "timestamp": datetime.now().isoformat(),
                "critical": True,
                "data": {"important": "data"}
            }
            
            # Publish message
            await event_bus.publish('system-status', persistent_message)
            
            # Simulate system restart by creating new consumer
            await event_bus.close()
            event_bus_2 = KafkaEventBus()
            await event_bus_2.initialize()
            
            # Message should still be available
            messages = await event_bus_2.consume('system-status', max_messages=10, timeout=5.0)
            persistent_messages = [msg for msg in messages if msg.get('id') == 'persistence_test_001']
            
            assert len(persistent_messages) > 0, "Persistent messages must survive system restart"
            
            await event_bus_2.close()
            
            duration = time.time() - start_time
            self.test_results.append(TestResult(test_id, "Message Persistence", "PASS", duration))
            print(f"✅ {test_id}: PASSED ({duration:.2f}s)")
            
        except Exception as e:
            duration = time.time() - start_time
            self.test_results.append(TestResult(test_id, "Message Persistence", "FAIL", duration, error=str(e)))
            print(f"❌ {test_id}: FAILED - {str(e)}")
    
    # =============================================================================
    # PERFORMANCE TESTS
    # =============================================================================
    
    async def test_throughput_performance(self):
        """REQ-PERFORMANCE-001: System Throughput"""
        test_id = "REQ-PERFORMANCE-001"
        start_time = time.time()
        
        try:
            print(f"\n⚡ {test_id}: Testing System Throughput...")
            
            processor = DirectLangGraphProcessor()
            
            # Test batch processing performance
            batch_sizes = [1, 5, 10]
            performance_results = {}
            
            for batch_size in batch_sizes:
                test_commits = [
                    {
                        "hash": f"perf_test_commit_{i}",
                        "message": f"Performance test commit {i}",
                        "files": [f"test_file_{i}.py"],
                        "timestamp": datetime.now().isoformat()
                    }
                    for i in range(batch_size)
                ]
                
                batch_start = time.time()
                result = await processor.process_commits(test_commits)
                batch_duration = time.time() - batch_start
                
                throughput = batch_size / batch_duration if batch_duration > 0 else 0
                performance_results[batch_size] = {
                    "duration": batch_duration,
                    "throughput": throughput,
                    "success": result.get("status") == "completed_successfully"
                }
            
            # Validate performance requirements
            # Requirement: Process at least 1 commit per second
            min_throughput = 1.0
            for batch_size, perf in performance_results.items():
                if perf["success"] and perf["throughput"] < min_throughput:
                    raise AssertionError(f"Throughput {perf['throughput']:.2f} < required {min_throughput} for batch {batch_size}")
            
            duration = time.time() - start_time
            details = json.dumps(performance_results, indent=2)
            self.test_results.append(TestResult(test_id, "System Throughput", "PASS", duration, details=details))
            print(f"✅ {test_id}: PASSED ({duration:.2f}s)")
            
        except Exception as e:
            duration = time.time() - start_time
            self.test_results.append(TestResult(test_id, "System Throughput", "FAIL", duration, error=str(e)))
            print(f"❌ {test_id}: FAILED - {str(e)}")
    
    async def test_latency_requirements(self):
        """REQ-PERFORMANCE-002: Response Latency"""
        test_id = "REQ-PERFORMANCE-002"
        start_time = time.time()
        
        try:
            print(f"\n🏃 {test_id}: Testing Response Latency...")
            
            processor = DirectLangGraphProcessor()
            
            # Test single commit processing latency
            test_commit = [{
                "hash": "latency_test_commit",
                "message": "Latency test",
                "files": ["latency_test.py"],
                "timestamp": datetime.now().isoformat()
            }]
            
            # Multiple latency measurements
            latencies = []
            for i in range(5):
                lat_start = time.time()
                result = await processor.process_commits(test_commit)
                latency = time.time() - lat_start
                latencies.append(latency)
                
                assert result.get("status") == "completed_successfully", f"Latency test {i} must succeed"
            
            # Validate latency requirements
            avg_latency = sum(latencies) / len(latencies)
            max_latency = max(latencies)
            
            # Requirement: Average latency < 5 seconds, Max latency < 10 seconds
            assert avg_latency < 5.0, f"Average latency {avg_latency:.2f}s exceeds 5s requirement"
            assert max_latency < 10.0, f"Max latency {max_latency:.2f}s exceeds 10s requirement"
            
            duration = time.time() - start_time
            details = f"Avg: {avg_latency:.2f}s, Max: {max_latency:.2f}s, Measurements: {len(latencies)}"
            self.test_results.append(TestResult(test_id, "Response Latency", "PASS", duration, details=details))
            print(f"✅ {test_id}: PASSED ({duration:.2f}s) - {details}")
            
        except Exception as e:
            duration = time.time() - start_time
            self.test_results.append(TestResult(test_id, "Response Latency", "FAIL", duration, error=str(e)))
            print(f"❌ {test_id}: FAILED - {str(e)}")
    
    # =============================================================================
    # SECURITY TESTS
    # =============================================================================
    
    async def test_data_security(self):
        """REQ-SECURITY-001: Data Security and Privacy"""
        test_id = "REQ-SECURITY-001"
        start_time = time.time()
        
        try:
            print(f"\n🔒 {test_id}: Testing Data Security...")
            
            # Test sensitive data handling
            processor = DirectLangGraphProcessor()
            
            # Test with sensitive data patterns
            sensitive_commit = [{
                "hash": "security_test_commit",
                "message": "Security test with API_KEY=secret123",
                "files": ["config.py"],
                "timestamp": datetime.now().isoformat()
            }]
            
            result = await processor.process_commits(sensitive_commit)
            
            # Verify sensitive data is not exposed in outputs
            result_str = json.dumps(result)
            sensitive_patterns = ["secret123", "password", "API_KEY="]
            
            for pattern in sensitive_patterns:
                assert pattern not in result_str, f"Sensitive pattern '{pattern}' found in output"
            
            duration = time.time() - start_time
            self.test_results.append(TestResult(test_id, "Data Security", "PASS", duration))
            print(f"✅ {test_id}: PASSED ({duration:.2f}s)")
            
        except Exception as e:
            duration = time.time() - start_time
            self.test_results.append(TestResult(test_id, "Data Security", "FAIL", duration, error=str(e)))
            print(f"❌ {test_id}: FAILED - {str(e)}")
    
    # =============================================================================
    # UTILITY METHODS
    # =============================================================================
    
    def calculate_success_rate(self) -> float:
        """Calculate overall test success rate"""
        if not self.test_results:
            return 0.0
        
        passed_tests = sum(1 for result in self.test_results if result.status == "PASS")
        return (passed_tests / len(self.test_results)) * 100
    
    def generate_test_report(self):
        """Generate comprehensive test report"""
        print("\n" + "=" * 60)
        print("📊 KAFKA + LANGGRAPH SYSTEM TEST REPORT")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result.status == "PASS")
        failed_tests = sum(1 for result in self.test_results if result.status == "FAIL")
        skipped_tests = sum(1 for result in self.test_results if result.status == "SKIP")
        success_rate = self.calculate_success_rate()
        total_duration = sum(result.duration for result in self.test_results)
        
        print(f"📈 Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"⏭️ Skipped: {skipped_tests}")
        print(f"🎯 Success Rate: {success_rate:.1f}%")
        print(f"⏱️ Total Duration: {total_duration:.2f}s")
        print(f"📅 Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        print("\n📋 DETAILED RESULTS:")
        print("-" * 60)
        
        for result in self.test_results:
            status_emoji = {"PASS": "✅", "FAIL": "❌", "SKIP": "⏭️"}[result.status]
            print(f"{status_emoji} {result.test_id}: {result.description} ({result.duration:.2f}s)")
            
            if result.details:
                print(f"    📝 Details: {result.details}")
            if result.error:
                print(f"    🚨 Error: {result.error}")
        
        # Generate JSON report
        report_data = {
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "total_tests": total_tests,
                "passed": passed_tests,
                "failed": failed_tests,
                "skipped": skipped_tests,
                "success_rate": success_rate,
                "total_duration": total_duration
            },
            "results": [
                {
                    "test_id": result.test_id,
                    "description": result.description,
                    "status": result.status,
                    "duration": result.duration,
                    "details": result.details,
                    "error": result.error
                }
                for result in self.test_results
            ]
        }
        
        # Save report to file
        if self.temp_dir:
            report_file = self.temp_dir.parent / f"kafka_langgraph_test_report_{int(time.time())}.json"
            with open(report_file, 'w') as f:
                json.dump(report_data, f, indent=2)
            print(f"\n📄 Report saved: {report_file}")
        
        print("\n" + "=" * 60)
        
        # Return success for CI/CD integration
        return success_rate >= 80.0  # 80% success rate required


async def main():
    """Main test execution"""
    test_suite = KafkaLangGraphTestSuite()
    success = await test_suite.run_all_tests()
    
    if success:
        print("🎉 TEST SUITE PASSED - System meets requirements!")
        sys.exit(0)
    else:
        print("💥 TEST SUITE FAILED - Requirements not met!")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())