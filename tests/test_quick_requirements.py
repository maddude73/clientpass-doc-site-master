#!/usr/bin/env python3
"""
Quick Requirements Test - Immediate Validation
Simple test that validates core system functionality without external dependencies
"""

import sys
import time
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, Any

class QuickRequirementsTest:
    """Quick validation of core system requirements"""
    
    def __init__(self):
        self.test_results = []
        self.start_time = time.time()
        
    def run_quick_tests(self):
        """Run quick validation tests"""
        print("⚡ QUICK REQUIREMENTS VALIDATION")
        print("=" * 50)
        print("Testing core system components...")
        
        # Core component tests
        self.test_file_structure()
        self.test_kafka_components()
        self.test_langgraph_components() 
        self.test_automation_components()
        self.test_documentation_system()
        
        # Generate report
        self.generate_quick_report()
        return self.calculate_success()
    
    def test_file_structure(self):
        """Test core file structure exists"""
        test_id = "QUICK-001"
        start_time = time.time()
        
        try:
            print(f"\n📁 {test_id}: Testing file structure...")
            
            required_files = [
                "automation/kafka_config.py",
                "automation/kafka_event_bus.py", 
                "automation/langgraph_workflows.py",
                "automation/langgraph_orchestrator.py",
                "automation/direct_langgraph_processor.py",
                "automation/automated_langgraph_monitor.py"
            ]
            
            missing_files = []
            for file_path in required_files:
                if not Path(file_path).exists():
                    missing_files.append(file_path)
            
            if missing_files:
                raise AssertionError(f"Missing required files: {missing_files}")
            
            duration = time.time() - start_time
            self.test_results.append({
                "test_id": test_id,
                "description": "Core file structure",
                "status": "PASS",
                "duration": duration,
                "details": f"All {len(required_files)} required files present"
            })
            print(f"✅ {test_id}: PASSED - All core files present")
            
        except Exception as e:
            duration = time.time() - start_time
            self.test_results.append({
                "test_id": test_id,
                "description": "Core file structure", 
                "status": "FAIL",
                "duration": duration,
                "error": str(e)
            })
            print(f"❌ {test_id}: FAILED - {str(e)}")
    
    def test_kafka_components(self):
        """Test Kafka component imports and basic structure"""
        test_id = "QUICK-002"
        start_time = time.time()
        
        try:
            print(f"\n⚡ {test_id}: Testing Kafka components...")
            
            # Test imports
            sys.path.insert(0, str(Path("automation")))
            
            from kafka_config import KafkaConfig
            from kafka_event_bus import KafkaEventBus
            
            # Test configuration
            config = KafkaConfig()
            assert hasattr(config, 'bootstrap_servers'), "KafkaConfig must have bootstrap_servers"
            assert hasattr(config, 'producer_config'), "KafkaConfig must have producer_config"
            assert hasattr(config, 'consumer_config'), "KafkaConfig must have consumer_config"
            
            # Test event bus structure
            event_bus = KafkaEventBus()
            assert hasattr(event_bus, 'initialize'), "KafkaEventBus must have initialize method"
            assert hasattr(event_bus, 'publish'), "KafkaEventBus must have publish method"
            assert hasattr(event_bus, 'consume'), "KafkaEventBus must have consume method"
            
            duration = time.time() - start_time
            self.test_results.append({
                "test_id": test_id,
                "description": "Kafka components",
                "status": "PASS", 
                "duration": duration,
                "details": "KafkaConfig and KafkaEventBus imports and structure validated"
            })
            print(f"✅ {test_id}: PASSED - Kafka components valid")
            
        except Exception as e:
            duration = time.time() - start_time
            self.test_results.append({
                "test_id": test_id,
                "description": "Kafka components",
                "status": "FAIL",
                "duration": duration,
                "error": str(e)
            })
            print(f"❌ {test_id}: FAILED - {str(e)}")
    
    def test_langgraph_components(self):
        """Test LangGraph component imports and structure"""
        test_id = "QUICK-003"
        start_time = time.time()
        
        try:
            print(f"\n🧠 {test_id}: Testing LangGraph components...")
            
            from langgraph_workflows import LangGraphWorkflows, DocumentProcessingState
            from langgraph_orchestrator import LangGraphOrchestrator
            from direct_langgraph_processor import DirectLangGraphProcessor
            
            # Test workflows
            workflows = LangGraphWorkflows()
            assert hasattr(workflows, 'create_document_processing_workflow'), "Must have workflow creation"
            assert hasattr(workflows, '_analyze_commits'), "Must have commit analysis"
            
            # Test orchestrator
            orchestrator = LangGraphOrchestrator()
            assert hasattr(orchestrator, 'process_commits'), "Must have process_commits method"
            assert hasattr(orchestrator, 'initialize'), "Must have initialize method"
            
            # Test direct processor
            processor = DirectLangGraphProcessor()
            assert hasattr(processor, 'process_commits'), "Must have process_commits method"
            
            # Test state structure
            test_state = DocumentProcessingState(
                commits=["test"],
                batch_size=1,
                processing_results=[],
                ai_analysis={},
                current_step="test",
                errors=[]
            )
            assert test_state.commits == ["test"], "State structure must work"
            
            duration = time.time() - start_time
            self.test_results.append({
                "test_id": test_id,
                "description": "LangGraph components",
                "status": "PASS",
                "duration": duration,
                "details": "LangGraph workflows, orchestrator, and processor structure validated"
            })
            print(f"✅ {test_id}: PASSED - LangGraph components valid")
            
        except Exception as e:
            duration = time.time() - start_time
            self.test_results.append({
                "test_id": test_id,
                "description": "LangGraph components",
                "status": "FAIL",
                "duration": duration,
                "error": str(e)
            })
            print(f"❌ {test_id}: FAILED - {str(e)}")
    
    def test_automation_components(self):
        """Test automation system components"""
        test_id = "QUICK-004"
        start_time = time.time()
        
        try:
            print(f"\n🤖 {test_id}: Testing automation components...")
            
            from automated_langgraph_monitor import AutomatedLangGraphMonitor
            
            # Test monitor structure
            monitor = AutomatedLangGraphMonitor()
            assert hasattr(monitor, 'start_monitoring'), "Must have start_monitoring method"
            assert hasattr(monitor, 'stop_monitoring'), "Must have stop_monitoring method"
            assert hasattr(monitor, 'processing_queue'), "Must have processing queue"
            assert hasattr(monitor, 'statistics'), "Must have statistics tracking"
            
            # Test daemon script exists
            daemon_script = Path("automation/automation_daemon.sh")
            assert daemon_script.exists(), "Daemon script must exist"
            
            # Test logs directory structure
            logs_dir = Path("automation/logs")
            if not logs_dir.exists():
                logs_dir.mkdir(parents=True)
            
            duration = time.time() - start_time
            self.test_results.append({
                "test_id": test_id,
                "description": "Automation components",
                "status": "PASS",
                "duration": duration,
                "details": "Monitor, daemon script, and logs structure validated"
            })
            print(f"✅ {test_id}: PASSED - Automation system valid")
            
        except Exception as e:
            duration = time.time() - start_time
            self.test_results.append({
                "test_id": test_id,
                "description": "Automation components",
                "status": "FAIL",
                "duration": duration,
                "error": str(e)
            })
            print(f"❌ {test_id}: FAILED - {str(e)}")
    
    def test_documentation_system(self):
        """Test documentation generation system"""
        test_id = "QUICK-005"
        start_time = time.time()
        
        try:
            print(f"\n📚 {test_id}: Testing documentation system...")
            
            # Test documentation files exist
            doc_files = [
                "public/docs/RECENT_UPDATES_DEC_2025.md",
                "public/docs/PROHUB_PAGE_COMPONENT.md",
                "public/docs/HOME_INBOX_COMPONENTS.md", 
                "public/docs/BOOST_PROFILE_COMPONENT.md",
                "public/docs/INBOX_NOTIFICATIONS_SYSTEM.md",
                "public/docs/DOCUMENTATION_INDEX.md"
            ]
            
            existing_docs = []
            for doc_file in doc_files:
                if Path(doc_file).exists():
                    existing_docs.append(doc_file)
            
            assert len(existing_docs) >= 4, f"Must have at least 4 documentation files, found {len(existing_docs)}"
            
            # Test processing results exist
            processing_files = list(Path("automation/data").glob("processing_results_*.json")) if Path("automation/data").exists() else []
            assert len(processing_files) > 0, "Must have processing results files"
            
            # Test changelog and updates
            changelog_files = [
                "CHANGELOG_UPDATED.md",
                "RECENT_UPDATES_DEC_2025.md" 
            ]
            
            existing_changelog = [f for f in changelog_files if Path(f).exists()]
            assert len(existing_changelog) > 0, "Must have changelog or update files"
            
            duration = time.time() - start_time
            self.test_results.append({
                "test_id": test_id,
                "description": "Documentation system",
                "status": "PASS",
                "duration": duration,
                "details": f"Found {len(existing_docs)} docs, {len(processing_files)} results, {len(existing_changelog)} changelog files"
            })
            print(f"✅ {test_id}: PASSED - Documentation system operational")
            
        except Exception as e:
            duration = time.time() - start_time
            self.test_results.append({
                "test_id": test_id,
                "description": "Documentation system",
                "status": "FAIL",
                "duration": duration,
                "error": str(e)
            })
            print(f"❌ {test_id}: FAILED - {str(e)}")
    
    def calculate_success(self) -> bool:
        """Calculate if quick tests passed"""
        if not self.test_results:
            return False
        
        passed_tests = sum(1 for result in self.test_results if result["status"] == "PASS")
        total_tests = len(self.test_results)
        success_rate = (passed_tests / total_tests) * 100
        
        return success_rate >= 80.0  # 80% success rate required
    
    def generate_quick_report(self):
        """Generate quick test report"""
        print("\n" + "=" * 50)
        print("📊 QUICK VALIDATION REPORT")
        print("=" * 50)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["status"] == "PASS")
        failed_tests = sum(1 for result in self.test_results if result["status"] == "FAIL")
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        total_duration = time.time() - self.start_time
        
        print(f"📈 Results Summary:")
        print(f"  Total Tests: {total_tests}")
        print(f"  ✅ Passed: {passed_tests}")
        print(f"  ❌ Failed: {failed_tests}")
        print(f"  🎯 Success Rate: {success_rate:.1f}%")
        print(f"  ⏱️ Duration: {total_duration:.2f}s")
        
        print(f"\n📋 Test Details:")
        for result in self.test_results:
            status_emoji = "✅" if result["status"] == "PASS" else "❌"
            print(f"  {status_emoji} {result['test_id']}: {result['description']} ({result['duration']:.2f}s)")
            
            if result.get("details"):
                print(f"      📝 {result['details']}")
            if result.get("error"):
                print(f"      🚨 {result['error']}")
        
        # System status assessment
        if success_rate >= 80.0:
            print(f"\n✅ QUICK VALIDATION: PASSED")
            print(f"🎉 Core system components are functional")
            print(f"🚀 Ready for comprehensive requirements testing")
            print(f"\n💡 Next Steps:")
            print(f"  1. Run: python3 run_all_requirements_tests.py")
            print(f"  2. Start automation: ./automation/automation_daemon.sh start")
            print(f"  3. Monitor processing: tail -f automation/logs/automation.log")
        else:
            print(f"\n❌ QUICK VALIDATION: FAILED")
            print(f"🛑 Core system components have issues")
            print(f"🔧 Fix component issues before comprehensive testing")
        
        print("=" * 50)


def main():
    """Run quick requirements test"""
    tester = QuickRequirementsTest()
    success = tester.run_quick_tests()
    
    if success:
        print("\n🎉 QUICK VALIDATION PASSED!")
        print("🚀 System ready for comprehensive testing!")
        return 0
    else:
        print("\n💥 QUICK VALIDATION FAILED!")
        print("🛑 Fix core issues before proceeding!")
        return 1


if __name__ == "__main__":
    sys.exit(main())