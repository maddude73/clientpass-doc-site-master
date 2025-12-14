#!/bin/bash
"""
Complete Requirements Test Suite Execution
Runs all test suites to validate system against SRS and production requirements
"""

echo "🚀 COMPLETE REQUIREMENTS VALIDATION SUITE"
echo "=========================================="
echo "📅 Started: $(date)"
echo ""

# Run quick validation first
echo "⚡ STEP 1: Quick Requirements Validation"
echo "----------------------------------------"
python3 test_quick_requirements.py
quick_exit_code=$?

if [ $quick_exit_code -ne 0 ]; then
    echo "❌ Quick validation failed. Fixing core issues before comprehensive tests..."
    echo "🛠️ Please resolve core component issues and retry"
    exit 1
fi

echo ""
echo "✅ Quick validation passed. Proceeding with comprehensive testing..."
echo ""

# Run SRS requirements validation
echo "📋 STEP 2: SRS Comprehensive Requirements"
echo "----------------------------------------"
python3 test_srs_requirements.py
srs_exit_code=$?

# Run production requirements
echo ""
echo "🚨 STEP 3: Production Requirements Validation" 
echo "--------------------------------------------"
python3 test_production_requirements.py
prod_exit_code=$?

# Run Kafka + LangGraph system test
echo ""
echo "⚡ STEP 4: Kafka + LangGraph System Test"
echo "--------------------------------------"
python3 test_kafka_langgraph_requirements.py
kafka_exit_code=$?

# Summary report
echo ""
echo "📊 COMPREHENSIVE TEST RESULTS"
echo "============================="

total_tests=4
passed_tests=0

echo "Test Results Summary:"

if [ $quick_exit_code -eq 0 ]; then
    echo "  ✅ Quick Validation: PASSED"
    passed_tests=$((passed_tests + 1))
else
    echo "  ❌ Quick Validation: FAILED"
fi

if [ $srs_exit_code -eq 0 ]; then
    echo "  ✅ SRS Requirements: PASSED"
    passed_tests=$((passed_tests + 1))
else
    echo "  ❌ SRS Requirements: FAILED"
fi

if [ $prod_exit_code -eq 0 ]; then
    echo "  ✅ Production Requirements: PASSED"
    passed_tests=$((passed_tests + 1))
else
    echo "  ❌ Production Requirements: FAILED"
fi

if [ $kafka_exit_code -eq 0 ]; then
    echo "  ✅ Kafka + LangGraph: PASSED"
    passed_tests=$((passed_tests + 1))
else
    echo "  ❌ Kafka + LangGraph: FAILED"
fi

success_rate=$((passed_tests * 100 / total_tests))

echo ""
echo "📈 Overall Results:"
echo "  Total Tests: $total_tests"
echo "  Passed: $passed_tests"
echo "  Success Rate: $success_rate%"
echo "  📅 Completed: $(date)"

if [ $success_rate -ge 75 ]; then
    echo ""
    echo "🎉 REQUIREMENTS VALIDATION SUCCESSFUL!"
    echo "✅ System meets requirements for production deployment"
    echo ""
    echo "💡 Next Steps:"
    echo "  1. Deploy automation system: ./automation/automation_daemon.sh start"
    echo "  2. Integrate RAG entries with MongoDB Atlas"
    echo "  3. Monitor system performance and processing"
    echo ""
    exit 0
else
    echo ""
    echo "💥 REQUIREMENTS VALIDATION FAILED!"
    echo "🛑 System does not meet minimum requirements"
    echo ""
    echo "🔧 Required Actions:"
    echo "  1. Review failed test outputs above"
    echo "  2. Fix critical component issues"
    echo "  3. Re-run validation suite"
    echo ""
    exit 1
fi