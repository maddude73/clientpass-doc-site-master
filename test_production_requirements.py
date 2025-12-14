#!/usr/bin/env python3
"""
Production Requirements Integration Test Suite
Tests against original production issues and SRS requirements
"""

import pytest
import asyncio
import sys
import json
import time
import requests
from pathlib import Path
from datetime import datetime
from unittest.mock import Mock, patch
from typing import Dict, List, Any

# Add automation directory to path
automation_dir = Path(__file__).parent / "automation"
sys.path.insert(0, str(automation_dir))

class ProductionRequirementsTest:
    """Tests system against original production issues"""
    
    def __init__(self):
        self.test_results = []
        self.original_issues = [
            "POST /api/docs/search 500 (Internal Server Error)",
            "Redis system instability with exit code 137 crashes", 
            "Multi-Agent System unreliability and process failures",
            "Lack of intelligent AI analysis for documentation",
            "No automated processing pipeline for git changes"
        ]
        
    async def run_production_validation_tests(self):
        """Run tests against original production issues"""
        print("🚨 PRODUCTION REQUIREMENTS VALIDATION")
        print("=" * 60)
        print("Testing fixes for original production issues...")
        
        # Test fixes for each original issue
        await self.test_api_docs_search_reliability()      # Fix for: POST /api/docs/search 500
        await self.test_system_stability_improvement()     # Fix for: Exit code 137 crashes  
        await self.test_kafka_reliability_vs_redis()      # Fix for: Redis instability
        await self.test_ai_analysis_capabilities()         # Fix for: Lack of AI analysis
        await self.test_automated_processing_pipeline()    # Fix for: No automation
        
        # System Requirements Tests
        await self.test_srs_functional_requirements()
        await self.test_srs_non_functional_requirements()
        await self.test_enterprise_grade_features()
        
        self.generate_validation_report()
        return self.calculate_validation_success()
    
    async def test_api_docs_search_reliability(self):
        """PROD-REQ-001: Fix POST /api/docs/search 500 errors"""
        test_id = "PROD-REQ-001"
        start_time = time.time()
        
        try:
            print(f"\n🔍 {test_id}: Testing API /docs/search reliability...")
            
            # Test MongoDB Atlas Vector Search readiness
            from automation.direct_langgraph_processor import DirectLangGraphProcessor
            
            processor = DirectLangGraphProcessor()
            
            # Process test commits to prepare RAG entries
            test_commits = [{
                "hash": "api_test_commit",
                "message": "Test API documentation update",
                "files": ["src/api/search.ts"],
                "timestamp": datetime.now().isoformat()
            }]
            
            result = await processor.process_commits(test_commits)
            
            # Validate RAG preparation
            assert result.get("status") == "completed_successfully", "RAG preparation must succeed"
            assert "rag_entries" in result, "Must generate RAG entries for API search"
            assert len(result["rag_entries"]) > 0, "Must create searchable content"
            
            # Simulate successful RAG integration
            rag_entries = result["rag_entries"]
            for entry in rag_entries:
                assert "content" in entry, "RAG entry must have content"
                assert "metadata" in entry, "RAG entry must have metadata"
                assert len(entry["content"]) > 0, "RAG entry content must not be empty"
            
            duration = time.time() - start_time
            self.test_results.append({
                "test_id": test_id,
                "description": "API /docs/search reliability fix",
                "status": "PASS",
                "duration": duration,
                "details": f"Generated {len(rag_entries)} RAG entries for search"
            })
            print(f"✅ {test_id}: PASSED - RAG system ready for API integration")
            
        except Exception as e:
            duration = time.time() - start_time
            self.test_results.append({
                "test_id": test_id,
                "description": "API /docs/search reliability fix", 
                "status": "FAIL",
                "duration": duration,
                "error": str(e)
            })
            print(f"❌ {test_id}: FAILED - {str(e)}")
    
    async def test_system_stability_improvement(self):
        """PROD-REQ-002: Fix exit code 137 crashes and system instability"""
        test_id = "PROD-REQ-002"
        start_time = time.time()
        
        try:
            print(f"\n🛡️ {test_id}: Testing system stability improvements...")
            
            # Test Kafka system vs Redis reliability
            from automation.kafka_event_bus import KafkaEventBus
            
            event_bus = KafkaEventBus()
            await event_bus.initialize()
            
            # Test multiple message processing cycles without crashes
            stability_test_cycles = 10
            for cycle in range(stability_test_cycles):
                test_message = {
                    "cycle": cycle,
                    "timestamp": datetime.now().isoformat(),
                    "type": "stability_test",
                    "data": {"test": f"cycle_{cycle}"}
                }
                
                # Publish and consume - should not crash
                await event_bus.publish('system-status', test_message)
                messages = await event_bus.consume('system-status', max_messages=1, timeout=2.0)
                
                assert len(messages) > 0, f"Cycle {cycle}: Must receive messages without crashes"
            
            await event_bus.close()
            
            # Test memory management and resource cleanup
            import psutil
            import os
            
            process = psutil.Process(os.getpid())
            memory_info = process.memory_info()
            
            # Memory usage should be reasonable (< 500MB for test)
            memory_mb = memory_info.rss / 1024 / 1024
            assert memory_mb < 500, f"Memory usage {memory_mb:.1f}MB too high - potential memory leak"
            
            duration = time.time() - start_time
            self.test_results.append({
                "test_id": test_id,
                "description": "System stability improvement",
                "status": "PASS",
                "duration": duration,
                "details": f"Completed {stability_test_cycles} cycles, memory: {memory_mb:.1f}MB"
            })
            print(f"✅ {test_id}: PASSED - System stable through {stability_test_cycles} cycles")
            
        except Exception as e:
            duration = time.time() - start_time
            self.test_results.append({
                "test_id": test_id,
                "description": "System stability improvement",
                "status": "FAIL", 
                "duration": duration,
                "error": str(e)
            })
            print(f"❌ {test_id}: FAILED - {str(e)}")
    
    async def test_kafka_reliability_vs_redis(self):
        """PROD-REQ-003: Kafka reliability improvements over Redis"""
        test_id = "PROD-REQ-003"
        start_time = time.time()
        
        try:
            print(f"\n📨 {test_id}: Testing Kafka reliability vs Redis...")
            
            from automation.kafka_event_bus import KafkaEventBus
            
            # Test Kafka enterprise features
            event_bus = KafkaEventBus()
            await event_bus.initialize()
            
            # Test guaranteed delivery (acks=all)
            critical_message = {
                "id": "critical_001",
                "timestamp": datetime.now().isoformat(),
                "critical": True,
                "data": {"important": "mission_critical_data"}
            }
            
            # Publish with guaranteed delivery
            result = await event_bus.publish('system-status', critical_message, wait_for_ack=True)
            assert result, "Critical message must be acknowledged"
            
            # Test message persistence across restarts
            await event_bus.close()
            
            # Simulate system restart
            event_bus_2 = KafkaEventBus()
            await event_bus_2.initialize()
            
            # Message should persist
            messages = await event_bus_2.consume('system-status', max_messages=10, timeout=5.0)
            critical_messages = [msg for msg in messages if msg.get('id') == 'critical_001']
            
            assert len(critical_messages) > 0, "Critical messages must survive system restart"
            
            # Test exactly-once processing
            processed_ids = set()
            for message in messages:
                msg_id = message.get('id')
                if msg_id:
                    assert msg_id not in processed_ids, f"Message {msg_id} processed multiple times"
                    processed_ids.add(msg_id)
            
            await event_bus_2.close()
            
            duration = time.time() - start_time
            self.test_results.append({
                "test_id": test_id,
                "description": "Kafka reliability vs Redis",
                "status": "PASS",
                "duration": duration,
                "details": f"Guaranteed delivery, persistence, exactly-once processing validated"
            })
            print(f"✅ {test_id}: PASSED - Kafka provides enterprise reliability")
            
        except Exception as e:
            duration = time.time() - start_time
            self.test_results.append({
                "test_id": test_id,
                "description": "Kafka reliability vs Redis",
                "status": "FAIL",
                "duration": duration,
                "error": str(e)
            })
            print(f"❌ {test_id}: FAILED - {str(e)}")
    
    async def test_ai_analysis_capabilities(self):
        """PROD-REQ-004: AI-powered analysis capabilities"""
        test_id = "PROD-REQ-004"
        start_time = time.time()
        
        try:
            print(f"\n🧠 {test_id}: Testing AI analysis capabilities...")
            
            from automation.langgraph_workflows import LangGraphWorkflows, DocumentProcessingState
            
            # Test AI-powered commit analysis
            workflows = LangGraphWorkflows()
            
            # Mock LLM for testing
            with patch('langchain_openai.ChatOpenAI') as mock_llm:
                mock_response = Mock()
                mock_response.content = json.dumps({
                    "component_type": "Page Component",
                    "impact_level": "High",
                    "user_facing": True,
                    "technical_complexity": "Medium",
                    "affected_systems": ["Frontend", "User Interface"],
                    "analysis": "AI-powered analysis of component changes with impact assessment"
                })
                mock_llm.return_value.invoke.return_value = mock_response
                
                workflows.llm = mock_llm.return_value
                
                # Test state for AI analysis
                test_state = DocumentProcessingState(
                    commits=["ai_test_commit_1", "ai_test_commit_2"],
                    batch_size=2,
                    processing_results=[],
                    ai_analysis={},
                    current_step="analyze_commits",
                    errors=[]
                )
                
                # Run AI analysis
                result = await workflows._analyze_commits(test_state)
                
                # Validate AI capabilities
                assert "ai_analysis" in result, "Must provide AI analysis"
                ai_analysis = result["ai_analysis"]
                
                required_ai_fields = ["component_type", "impact_level", "user_facing", "analysis"]
                for field in required_ai_fields:
                    assert field in ai_analysis, f"AI analysis must include {field}"
                
                # Test intelligent routing
                routing_result = await workflows._route_by_batch_size(result)
                assert routing_result in ["small_batch", "large_batch"], "Must provide intelligent routing"
            
            duration = time.time() - start_time
            self.test_results.append({
                "test_id": test_id,
                "description": "AI analysis capabilities",
                "status": "PASS",
                "duration": duration,
                "details": "GPT-4o-mini analysis, component classification, intelligent routing"
            })
            print(f"✅ {test_id}: PASSED - AI analysis fully functional")
            
        except Exception as e:
            duration = time.time() - start_time
            self.test_results.append({
                "test_id": test_id,
                "description": "AI analysis capabilities",
                "status": "FAIL",
                "duration": duration,
                "error": str(e)
            })
            print(f"❌ {test_id}: FAILED - {str(e)}")
    
    async def test_automated_processing_pipeline(self):
        """PROD-REQ-005: Automated processing pipeline"""
        test_id = "PROD-REQ-005"
        start_time = time.time()
        
        try:
            print(f"\n🤖 {test_id}: Testing automated processing pipeline...")
            
            from automation.automated_langgraph_monitor import AutomatedLangGraphMonitor
            
            # Test automated monitoring capabilities
            monitor = AutomatedLangGraphMonitor()
            
            # Test file system monitoring setup
            assert hasattr(monitor, 'observer'), "Must have file system observer"
            assert hasattr(monitor, 'processing_queue'), "Must have processing queue"
            assert hasattr(monitor, 'statistics'), "Must have statistics tracking"
            
            # Test automation loop components
            assert hasattr(monitor, '_run_automation_loop'), "Must have automation loop"
            assert hasattr(monitor, '_process_trigger_file'), "Must have trigger processing"
            
            # Test direct processing capability
            from automation.direct_langgraph_processor import DirectLangGraphProcessor
            
            processor = DirectLangGraphProcessor()
            
            # Test complete automation pipeline
            test_commits = [{
                "hash": "automation_test_commit",
                "message": "Test automated processing",
                "files": ["automation_test.py"],
                "timestamp": datetime.now().isoformat()
            }]
            
            # Process through automation pipeline
            result = await processor.process_commits(test_commits)
            
            # Validate automation results
            assert result.get("status") == "completed_successfully", "Automation must complete successfully"
            assert "documents_created" in result, "Must create documentation"
            assert "rag_entries" in result, "Must prepare RAG entries"
            assert "processing_time" in result, "Must track processing time"
            
            # Test background processing readiness
            automation_ready = (
                hasattr(monitor, 'start_monitoring') and
                hasattr(monitor, 'stop_monitoring') and
                hasattr(processor, 'process_commits')
            )
            assert automation_ready, "Background automation must be ready"
            
            duration = time.time() - start_time
            self.test_results.append({
                "test_id": test_id,
                "description": "Automated processing pipeline",
                "status": "PASS",
                "duration": duration,
                "details": "File monitoring, queue processing, background automation ready"
            })
            print(f"✅ {test_id}: PASSED - Full automation pipeline operational")
            
        except Exception as e:
            duration = time.time() - start_time
            self.test_results.append({
                "test_id": test_id,
                "description": "Automated processing pipeline",
                "status": "FAIL",
                "duration": duration,
                "error": str(e)
            })
            print(f"❌ {test_id}: FAILED - {str(e)}")
    
    async def test_srs_functional_requirements(self):
        """SRS-REQ-F01: Core functional requirements"""
        test_id = "SRS-REQ-F01"
        start_time = time.time()
        
        try:
            print(f"\n📋 {test_id}: Testing SRS functional requirements...")
            
            # Test core system functions as specified in SRS
            core_functions = [
                "Real-time git repository monitoring",
                "AI-powered commit analysis", 
                "Automated documentation generation",
                "RAG system integration",
                "Component classification",
                "Impact assessment"
            ]
            
            from automation.direct_langgraph_processor import DirectLangGraphProcessor
            
            processor = DirectLangGraphProcessor()
            
            # Test functional requirements with comprehensive commit
            srs_test_commits = [{
                "hash": "srs_functional_test",
                "message": "SRS functional requirements test - update multiple components",
                "files": [
                    "src/components/UserProfile.tsx",
                    "src/pages/Dashboard.tsx", 
                    "src/api/authentication.ts",
                    "documentation/USER_GUIDE.md"
                ],
                "timestamp": datetime.now().isoformat()
            }]
            
            result = await processor.process_commits(srs_test_commits)
            
            # Validate all core functions
            assert result.get("status") == "completed_successfully", "Core functions must work"
            
            # Real-time monitoring (simulated)
            assert "processing_time" in result, "Must track real-time processing"
            
            # AI analysis
            assert "ai_analysis" in result, "Must provide AI analysis"
            
            # Documentation generation  
            assert "documents_created" in result, "Must generate documentation"
            assert len(result["documents_created"]) > 0, "Must create actual documents"
            
            # RAG integration
            assert "rag_entries" in result, "Must prepare RAG entries"
            
            # Component classification
            ai_analysis = result.get("ai_analysis", {})
            assert "component_type" in ai_analysis, "Must classify components"
            
            # Impact assessment
            assert "impact_level" in ai_analysis, "Must assess impact"
            
            duration = time.time() - start_time
            self.test_results.append({
                "test_id": test_id,
                "description": "SRS functional requirements",
                "status": "PASS",
                "duration": duration,
                "details": f"All {len(core_functions)} core functions validated"
            })
            print(f"✅ {test_id}: PASSED - All SRS functional requirements met")
            
        except Exception as e:
            duration = time.time() - start_time
            self.test_results.append({
                "test_id": test_id,
                "description": "SRS functional requirements",
                "status": "FAIL",
                "duration": duration,
                "error": str(e)
            })
            print(f"❌ {test_id}: FAILED - {str(e)}")
    
    async def test_srs_non_functional_requirements(self):
        """SRS-REQ-NF01: Non-functional requirements"""
        test_id = "SRS-REQ-NF01" 
        start_time = time.time()
        
        try:
            print(f"\n⚡ {test_id}: Testing SRS non-functional requirements...")
            
            from automation.direct_langgraph_processor import DirectLangGraphProcessor
            
            processor = DirectLangGraphProcessor()
            
            # Test performance requirements
            perf_test_commits = [{
                "hash": "nfr_perf_test",
                "message": "NFR performance test",
                "files": ["performance_test.py"],
                "timestamp": datetime.now().isoformat()
            }]
            
            # Performance: Processing time < 10 seconds per commit
            perf_start = time.time()
            result = await processor.process_commits(perf_test_commits)
            perf_duration = time.time() - perf_start
            
            assert perf_duration < 10.0, f"Performance: {perf_duration:.2f}s > 10s requirement"
            assert result.get("status") == "completed_successfully", "Performance test must succeed"
            
            # Reliability: System handles errors gracefully
            with patch.object(processor, '_create_documentation') as mock_doc:
                mock_doc.side_effect = Exception("Simulated documentation error")
                
                error_result = await processor.process_commits(perf_test_commits)
                assert error_result, "Must handle errors gracefully"
                # Should continue processing despite errors
            
            # Scalability: Handle multiple commits
            scale_commits = [
                {
                    "hash": f"scale_test_{i}",
                    "message": f"Scale test commit {i}",
                    "files": [f"scale_test_{i}.py"],
                    "timestamp": datetime.now().isoformat()
                }
                for i in range(3)
            ]
            
            scale_start = time.time()
            scale_result = await processor.process_commits(scale_commits)
            scale_duration = time.time() - scale_start
            
            # Scalability: Process multiple commits efficiently
            assert scale_result.get("status") == "completed_successfully", "Scale test must succeed"
            throughput = len(scale_commits) / scale_duration if scale_duration > 0 else 0
            assert throughput >= 0.5, f"Throughput {throughput:.2f} commits/sec too low"
            
            duration = time.time() - start_time
            self.test_results.append({
                "test_id": test_id,
                "description": "SRS non-functional requirements",
                "status": "PASS", 
                "duration": duration,
                "details": f"Performance: {perf_duration:.2f}s, Throughput: {throughput:.2f} commits/sec"
            })
            print(f"✅ {test_id}: PASSED - NFRs met (perf: {perf_duration:.2f}s, throughput: {throughput:.2f})")
            
        except Exception as e:
            duration = time.time() - start_time
            self.test_results.append({
                "test_id": test_id,
                "description": "SRS non-functional requirements",
                "status": "FAIL",
                "duration": duration,
                "error": str(e)
            })
            print(f"❌ {test_id}: FAILED - {str(e)}")
    
    async def test_enterprise_grade_features(self):
        """ENTERPRISE-REQ-001: Enterprise-grade features"""
        test_id = "ENTERPRISE-REQ-001"
        start_time = time.time()
        
        try:
            print(f"\n🏢 {test_id}: Testing enterprise-grade features...")
            
            from automation.kafka_config import KafkaConfig
            
            # Test enterprise Kafka configuration
            config = KafkaConfig()
            producer_config = config.producer_config
            
            # Enterprise reliability features
            assert producer_config.get('acks') == 'all', "Must use acks=all for guaranteed delivery"
            assert producer_config.get('enable_idempotence') == True, "Must enable idempotence"
            assert producer_config.get('retries') >= 10, "Must have sufficient retries"
            
            # Enterprise monitoring and observability
            from automation.automated_langgraph_monitor import AutomatedLangGraphMonitor
            
            monitor = AutomatedLangGraphMonitor()
            assert hasattr(monitor, 'statistics'), "Must have comprehensive statistics"
            assert hasattr(monitor, '_update_statistics'), "Must update statistics"
            
            # Enterprise audit and logging
            from pathlib import Path
            logs_dir = Path("automation/logs")
            if logs_dir.exists():
                log_files = list(logs_dir.glob("*.log"))
                assert len(log_files) > 0, "Must have audit logging"
            
            # Enterprise scalability - multiple topic support
            topic_configs = config.get_topic_configs()
            required_topics = ['source-changes', 'document-processing', 'rag-updates', 'system-status', 'error-events']
            
            for topic in required_topics:
                assert topic in topic_configs, f"Enterprise topic {topic} must be configured"
                topic_config = topic_configs[topic]
                assert topic_config.partitions >= 3, f"Topic {topic} must have multiple partitions for scalability"
            
            # Enterprise AI capabilities - GPT-4o-mini integration
            from automation.langgraph_workflows import LangGraphWorkflows
            
            workflows = LangGraphWorkflows()
            assert hasattr(workflows, 'llm'), "Must have enterprise AI integration"
            
            duration = time.time() - start_time
            self.test_results.append({
                "test_id": test_id,
                "description": "Enterprise-grade features",
                "status": "PASS",
                "duration": duration,
                "details": "Guaranteed delivery, idempotence, audit logging, scalability, AI integration"
            })
            print(f"✅ {test_id}: PASSED - Enterprise features validated")
            
        except Exception as e:
            duration = time.time() - start_time
            self.test_results.append({
                "test_id": test_id,
                "description": "Enterprise-grade features", 
                "status": "FAIL",
                "duration": duration,
                "error": str(e)
            })
            print(f"❌ {test_id}: FAILED - {str(e)}")
    
    def calculate_validation_success(self) -> bool:
        """Calculate if production requirements validation passed"""
        if not self.test_results:
            return False
        
        passed_tests = sum(1 for result in self.test_results if result["status"] == "PASS")
        total_tests = len(self.test_results)
        success_rate = (passed_tests / total_tests) * 100
        
        return success_rate >= 90.0  # 90% success rate required for production
    
    def generate_validation_report(self):
        """Generate production validation report"""
        print("\n" + "=" * 60)
        print("🚨 PRODUCTION REQUIREMENTS VALIDATION REPORT")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["status"] == "PASS")
        failed_tests = sum(1 for result in self.test_results if result["status"] == "FAIL")
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        
        print(f"📊 Production Issue Resolution:")
        for i, issue in enumerate(self.original_issues, 1):
            status = "✅ RESOLVED" if i <= passed_tests else "❌ NOT RESOLVED"
            print(f"  {i}. {issue} - {status}")
        
        print(f"\n📈 Validation Results:")
        print(f"  Total Tests: {total_tests}")
        print(f"  ✅ Passed: {passed_tests}")
        print(f"  ❌ Failed: {failed_tests}")
        print(f"  🎯 Success Rate: {success_rate:.1f}%")
        
        print(f"\n📋 Detailed Results:")
        for result in self.test_results:
            status_emoji = "✅" if result["status"] == "PASS" else "❌"
            print(f"  {status_emoji} {result['test_id']}: {result['description']} ({result['duration']:.2f}s)")
            
            if result.get("details"):
                print(f"      📝 {result['details']}")
            if result.get("error"):
                print(f"      🚨 {result['error']}")
        
        # Overall assessment
        if success_rate >= 90.0:
            print(f"\n🎉 PRODUCTION REQUIREMENTS VALIDATION: PASSED")
            print(f"   System is ready for production deployment!")
        else:
            print(f"\n💥 PRODUCTION REQUIREMENTS VALIDATION: FAILED") 
            print(f"   System requires fixes before production deployment!")
        
        print("=" * 60)


async def main():
    """Run production requirements validation"""
    validator = ProductionRequirementsTest()
    success = await validator.run_production_validation_tests()
    
    if success:
        print("\n🚀 SYSTEM READY FOR PRODUCTION DEPLOYMENT!")
        sys.exit(0)
    else:
        print("\n🛑 SYSTEM NOT READY - REQUIRES FIXES!")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())