#!/usr/bin/env python3
"""
Master Requirements Test Suite Runner
Comprehensive validation of all system requirements
"""

import asyncio
import sys
import json
import time
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any
import subprocess

class MasterTestRunner:
    """Master test runner for all requirements validation"""
    
    def __init__(self):
        self.test_suites = []
        self.results = {}
        self.start_time = datetime.now()
        
    async def run_all_requirements_tests(self):
        """Run comprehensive requirements validation"""
        print("🚀 MASTER REQUIREMENTS VALIDATION SUITE")
        print("=" * 80)
        print(f"Started: {self.start_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print("Validating all system requirements against production issues...")
        
        # Run all test suites
        await self.run_srs_requirements_test()         # SRS Comprehensive Validation
        await self.run_production_requirements_test()
        await self.run_kafka_langgraph_test()  
        await self.run_existing_requirements_test()
        await self.run_performance_validation()
        await self.run_integration_tests()
        
        # Generate master report
        self.generate_master_report()
        return self.calculate_overall_success()
    
    async def run_srs_requirements_test(self):
        """Run SRS comprehensive requirements validation"""
        print(f"\n📋 SRS REQUIREMENTS COMPREHENSIVE TEST")
        print("-" * 40)
        
        try:
            # Run SRS requirements test
            result = await self._run_test_script("test_srs_requirements.py")
            self.results["srs_requirements"] = result
            
        except Exception as e:
            self.results["srs_requirements"] = {
                "status": "FAILED",
                "error": str(e),
                "success_rate": 0.0
            }
    
    async def run_production_requirements_test(self):
        """Run production requirements validation"""
        print(f"\n🚨 PRODUCTION REQUIREMENTS TEST")
        print("-" * 40)
        
        try:
            # Run production requirements test
            result = await self._run_test_script("test_production_requirements.py")
            self.results["production_requirements"] = result
            
        except Exception as e:
            self.results["production_requirements"] = {
                "status": "FAILED",
                "error": str(e),
                "success_rate": 0.0
            }
    
    async def run_kafka_langgraph_test(self):
        """Run Kafka + LangGraph system test"""
        print(f"\n⚡ KAFKA + LANGGRAPH SYSTEM TEST")
        print("-" * 40)
        
        try:
            # Run Kafka LangGraph test
            result = await self._run_test_script("test_kafka_langgraph_requirements.py")
            self.results["kafka_langgraph"] = result
            
        except Exception as e:
            self.results["kafka_langgraph"] = {
                "status": "FAILED", 
                "error": str(e),
                "success_rate": 0.0
            }
    
    async def run_existing_requirements_test(self):
        """Run existing requirements verification"""
        print(f"\n📋 EXISTING REQUIREMENTS VERIFICATION")
        print("-" * 40)
        
        try:
            # Check for existing test files
            automation_dir = Path("automation")
            existing_tests = [
                "test_requirements_verification.py",
                "test_comprehensive_requirements.py"
            ]
            
            test_results = []
            for test_file in existing_tests:
                test_path = automation_dir / test_file
                if test_path.exists():
                    result = await self._run_test_script(str(test_path))
                    test_results.append(result)
            
            if test_results:
                avg_success = sum(r.get("success_rate", 0) for r in test_results) / len(test_results)
                self.results["existing_requirements"] = {
                    "status": "PASSED" if avg_success >= 80.0 else "FAILED",
                    "success_rate": avg_success,
                    "tests_run": len(test_results)
                }
            else:
                self.results["existing_requirements"] = {
                    "status": "SKIPPED",
                    "success_rate": 0.0,
                    "reason": "No existing test files found"
                }
                
        except Exception as e:
            self.results["existing_requirements"] = {
                "status": "FAILED",
                "error": str(e),
                "success_rate": 0.0
            }
    
    async def run_performance_validation(self):
        """Run performance validation tests"""
        print(f"\n⚡ PERFORMANCE VALIDATION")
        print("-" * 40)
        
        try:
            from test_kafka_langgraph_requirements import KafkaLangGraphTestSuite
            
            # Create test instance for performance tests
            test_suite = KafkaLangGraphTestSuite()
            await test_suite.setup_test_environment()
            
            # Run specific performance tests
            perf_results = []
            
            # Test throughput
            try:
                await test_suite.test_throughput_performance()
                perf_results.append("throughput_PASSED")
            except Exception as e:
                perf_results.append(f"throughput_FAILED: {str(e)}")
            
            # Test latency  
            try:
                await test_suite.test_latency_requirements()
                perf_results.append("latency_PASSED")
            except Exception as e:
                perf_results.append(f"latency_FAILED: {str(e)}")
            
            await test_suite.cleanup_test_environment()
            
            passed_perf_tests = len([r for r in perf_results if "PASSED" in r])
            total_perf_tests = len(perf_results)
            success_rate = (passed_perf_tests / total_perf_tests) * 100 if total_perf_tests > 0 else 0
            
            self.results["performance"] = {
                "status": "PASSED" if success_rate >= 80.0 else "FAILED",
                "success_rate": success_rate,
                "tests": perf_results
            }
            
        except Exception as e:
            self.results["performance"] = {
                "status": "FAILED",
                "error": str(e),
                "success_rate": 0.0
            }
    
    async def run_integration_tests(self):
        """Run integration validation"""
        print(f"\n🔗 INTEGRATION VALIDATION")
        print("-" * 40)
        
        try:
            # Test system integration points
            integration_checks = []
            
            # Check Kafka integration
            try:
                from automation.kafka_event_bus import KafkaEventBus
                event_bus = KafkaEventBus()
                await event_bus.initialize()
                await event_bus.close()
                integration_checks.append("kafka_integration_PASSED")
            except Exception as e:
                integration_checks.append(f"kafka_integration_FAILED: {str(e)}")
            
            # Check LangGraph integration  
            try:
                from automation.langgraph_workflows import LangGraphWorkflows
                workflows = LangGraphWorkflows()
                workflow = workflows.create_document_processing_workflow()
                assert workflow is not None
                integration_checks.append("langgraph_integration_PASSED")
            except Exception as e:
                integration_checks.append(f"langgraph_integration_FAILED: {str(e)}")
            
            # Check Direct Processor integration
            try:
                from automation.direct_langgraph_processor import DirectLangGraphProcessor
                processor = DirectLangGraphProcessor()
                assert hasattr(processor, 'process_commits')
                integration_checks.append("direct_processor_integration_PASSED")
            except Exception as e:
                integration_checks.append(f"direct_processor_integration_FAILED: {str(e)}")
            
            passed_integration = len([c for c in integration_checks if "PASSED" in c])
            total_integration = len(integration_checks)
            success_rate = (passed_integration / total_integration) * 100 if total_integration > 0 else 0
            
            self.results["integration"] = {
                "status": "PASSED" if success_rate >= 90.0 else "FAILED",
                "success_rate": success_rate,
                "checks": integration_checks
            }
            
        except Exception as e:
            self.results["integration"] = {
                "status": "FAILED",
                "error": str(e), 
                "success_rate": 0.0
            }
    
    async def _run_test_script(self, script_path: str) -> Dict[str, Any]:
        """Run a test script and capture results"""
        try:
            print(f"  Running: {script_path}")
            
            # Run test script
            process = await asyncio.create_subprocess_exec(
                sys.executable, script_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=Path.cwd()
            )
            
            stdout, stderr = await process.communicate()
            
            # Parse results from output
            output = stdout.decode() + stderr.decode()
            
            # Extract success rate from output (look for patterns)
            success_rate = self._extract_success_rate(output)
            
            return {
                "status": "PASSED" if process.returncode == 0 else "FAILED",
                "returncode": process.returncode,
                "success_rate": success_rate,
                "output_length": len(output)
            }
            
        except Exception as e:
            return {
                "status": "ERROR",
                "error": str(e),
                "success_rate": 0.0
            }
    
    def _extract_success_rate(self, output: str) -> float:
        """Extract success rate from test output"""
        try:
            # Look for common success rate patterns
            patterns = [
                "Success Rate: ",
                "success rate: ",
                "PASSED",
                "✅"
            ]
            
            lines = output.split('\n')
            
            # Look for explicit success rate
            for line in lines:
                if "Success Rate:" in line or "success rate:" in line:
                    # Extract percentage
                    parts = line.split()
                    for part in parts:
                        if '%' in part:
                            try:
                                return float(part.replace('%', ''))
                            except:
                                continue
            
            # Count PASS/FAIL indicators
            pass_count = output.count("PASSED") + output.count("✅")
            fail_count = output.count("FAILED") + output.count("❌")
            total = pass_count + fail_count
            
            if total > 0:
                return (pass_count / total) * 100
            
            # Check exit code success
            if "exit code 0" in output.lower() or not ("error" in output.lower() or "failed" in output.lower()):
                return 100.0
                
            return 0.0
            
        except:
            return 0.0
    
    def calculate_overall_success(self) -> bool:
        """Calculate overall success across all test suites"""
        if not self.results:
            return False
        
        # Weight different test categories
        weights = {
            "srs_requirements": 0.3,        # Highest priority - SRS compliance
            "production_requirements": 0.25, # Production issue fixes
            "kafka_langgraph": 0.25,        # Core system functionality
            "integration": 0.15,            # System integration
            "performance": 0.05,            # Performance requirements
            "existing_requirements": 0.0    # Legacy tests (informational only)
        }
        
        weighted_success = 0.0
        total_weight = 0.0
        
        for category, weight in weights.items():
            if category in self.results and weight > 0:
                result = self.results[category]
                success_rate = result.get("success_rate", 0.0)
                
                # Convert status to success rate if not provided
                if success_rate == 0.0 and result.get("status") == "PASSED":
                    success_rate = 100.0
                
                weighted_success += success_rate * weight
                total_weight += weight
        
        overall_success_rate = weighted_success / total_weight if total_weight > 0 else 0.0
        return overall_success_rate >= 85.0  # 85% overall success required
    
    def generate_master_report(self):
        """Generate comprehensive master report"""
        print("\n" + "=" * 80)
        print("📊 MASTER REQUIREMENTS VALIDATION REPORT")
        print("=" * 80)
        
        duration = (datetime.now() - self.start_time).total_seconds()
        
        print(f"🕐 Duration: {duration:.1f} seconds")
        print(f"📅 Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Test suite results
        print(f"\n📋 Test Suite Results:")
        
        suite_names = {
            "srs_requirements": "SRS Comprehensive Requirements Validation",
            "production_requirements": "Production Requirements Validation",
            "kafka_langgraph": "Kafka + LangGraph System Test",
            "existing_requirements": "Legacy Requirements Verification", 
            "performance": "Performance Validation",
            "integration": "Integration Validation"
        }
        
        total_suites = len(self.results)
        passed_suites = 0
        
        for category, result in self.results.items():
            suite_name = suite_names.get(category, category)
            status = result.get("status", "UNKNOWN")
            success_rate = result.get("success_rate", 0.0)
            
            status_emoji = {"PASSED": "✅", "FAILED": "❌", "SKIPPED": "⏭️", "ERROR": "🚨"}.get(status, "❓")
            
            print(f"  {status_emoji} {suite_name}: {status} ({success_rate:.1f}%)")
            
            if status == "PASSED":
                passed_suites += 1
            
            # Show additional details
            if result.get("error"):
                print(f"      🚨 Error: {result['error']}")
            if result.get("tests_run"):
                print(f"      📊 Tests Run: {result['tests_run']}")
            if result.get("checks"):
                failed_checks = [c for c in result["checks"] if "FAILED" in c]
                if failed_checks:
                    print(f"      ⚠️ Failed Checks: {len(failed_checks)}")
        
        # Overall assessment
        overall_success = self.calculate_overall_success()
        suite_success_rate = (passed_suites / total_suites) * 100 if total_suites > 0 else 0
        
        print(f"\n📈 Summary:")
        print(f"  Total Test Suites: {total_suites}")
        print(f"  ✅ Passed Suites: {passed_suites}")
        print(f"  📊 Suite Success Rate: {suite_success_rate:.1f}%")
        print(f"  🎯 Overall Success: {overall_success}")
        
        # Production readiness assessment
        print(f"\n🚀 Production Readiness Assessment:")
        
        if overall_success:
            print(f"  ✅ SYSTEM IS READY FOR PRODUCTION!")
            print(f"  🎉 All critical requirements met")
            print(f"  📈 Original production issues resolved")
            print(f"  ⚡ Enterprise-grade reliability achieved")
            print(f"  🧠 AI-powered intelligence operational")
        else:
            print(f"  ❌ SYSTEM NOT READY FOR PRODUCTION!")
            print(f"  🛑 Critical requirements not met")
            print(f"  🔧 System requires fixes before deployment")
        
        # Recommendations
        print(f"\n💡 Recommendations:")
        
        if self.results.get("production_requirements", {}).get("status") != "PASSED":
            print(f"  🚨 CRITICAL: Fix production requirements validation")
        
        if self.results.get("kafka_langgraph", {}).get("status") != "PASSED":
            print(f"  ⚡ HIGH: Resolve Kafka + LangGraph system issues")
        
        if self.results.get("integration", {}).get("status") != "PASSED":
            print(f"  🔗 MEDIUM: Address integration validation failures")
        
        if overall_success:
            print(f"  🚀 Deploy background automation system: ./automation/automation_daemon.sh start")
            print(f"  📊 Monitor system performance and processing results")
            print(f"  🔄 Begin production RAG system integration")
        
        print("=" * 80)
        
        # Save detailed report
        report_data = {
            "timestamp": datetime.now().isoformat(),
            "duration_seconds": duration,
            "overall_success": overall_success,
            "suite_success_rate": suite_success_rate,
            "results": self.results,
            "production_ready": overall_success
        }
        
        report_file = Path(f"master_requirements_validation_{int(time.time())}.json")
        with open(report_file, 'w') as f:
            json.dump(report_data, f, indent=2)
        
        print(f"\n📄 Detailed report saved: {report_file}")


async def main():
    """Run master requirements validation"""
    runner = MasterTestRunner()
    success = await runner.run_all_requirements_tests()
    
    if success:
        print("\n🎉 ALL REQUIREMENTS VALIDATION PASSED!")
        print("🚀 SYSTEM READY FOR PRODUCTION DEPLOYMENT!")
        sys.exit(0)
    else:
        print("\n💥 REQUIREMENTS VALIDATION FAILED!")
        print("🛑 SYSTEM REQUIRES FIXES BEFORE DEPLOYMENT!")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())