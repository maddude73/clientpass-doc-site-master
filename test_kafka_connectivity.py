#!/usr/bin/env python3
"""
Kafka Connection Test for Documentation Automation System
Tests Kafka connectivity and basic functionality before full system startup
"""

import asyncio
import logging
import sys
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_kafka_connectivity():
    """Test basic Kafka connectivity and topic operations"""
    
    print("🔧 Testing Kafka Connection for Documentation Automation")
    print("=" * 60)
    
    test_results = {
        'kafka_connection': False,
        'topic_operations': False,
        'message_production': False,
        'overall_status': 'FAIL'
    }
    
    try:
        # Test 1: Basic Kafka connection
        print("\n1️⃣ Testing Kafka Connection...")
        
        try:
            from kafka import KafkaProducer, KafkaConsumer, KafkaAdminClient
            from kafka.admin import NewTopic
            
            # Test admin client connection
            admin_client = KafkaAdminClient(
                bootstrap_servers=['localhost:9092'],
                client_id='test-admin'
            )
            
            # Get cluster metadata to verify connection
            metadata = admin_client.list_topics()
            print(f"✅ Connected to Kafka cluster")
            print(f"   Existing topics: {list(metadata)}")
            test_results['kafka_connection'] = True
            
        except Exception as e:
            print(f"❌ Kafka connection failed: {e}")
            print(f"   Make sure Kafka is running on localhost:9092")
            return test_results
        
        # Test 2: Topic creation and management
        print("\n2️⃣ Testing Topic Operations...")
        
        try:
            test_topic = "test-doc-automation"
            
            # Create test topic
            topic_spec = NewTopic(
                name=test_topic,
                num_partitions=1,
                replication_factor=1
            )
            
            try:
                admin_client.create_topics([topic_spec])
                print(f"✅ Created test topic: {test_topic}")
            except Exception as e:
                if "already exists" in str(e).lower():
                    print(f"✅ Test topic already exists: {test_topic}")
                else:
                    raise e
            
            test_results['topic_operations'] = True
            
        except Exception as e:
            print(f"❌ Topic operations failed: {e}")
        
        # Test 3: Message production and consumption
        print("\n3️⃣ Testing Message Production...")
        
        try:
            # Create producer
            producer = KafkaProducer(
                bootstrap_servers=['localhost:9092'],
                client_id='test-producer',
                value_serializer=lambda x: str(x).encode('utf-8')
            )
            
            # Send test message
            test_message = {
                'event_type': 'test',
                'timestamp': datetime.now().isoformat(),
                'test_data': 'Kafka connectivity test message'
            }
            
            future = producer.send(test_topic, value=str(test_message))
            result = future.get(timeout=10)
            
            print(f"✅ Message sent successfully")
            print(f"   Topic: {result.topic}, Partition: {result.partition}, Offset: {result.offset}")
            
            producer.close()
            test_results['message_production'] = True
            
        except Exception as e:
            print(f"❌ Message production failed: {e}")
        
        # Test 4: Cleanup test resources
        print("\n4️⃣ Cleaning up test resources...")
        
        try:
            # Delete test topic
            admin_client.delete_topics([test_topic])
            print(f"✅ Cleaned up test topic: {test_topic}")
        except Exception as e:
            print(f"⚠️  Cleanup warning: {e}")
        
        admin_client.close()
        
    except ImportError as e:
        print(f"❌ Missing Kafka dependencies: {e}")
        print(f"   Run: pip install kafka-python")
        return test_results
    
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return test_results
    
    # Final assessment
    print("\n" + "=" * 60)
    print("📊 KAFKA CONNECTIVITY TEST RESULTS")
    print("=" * 60)
    
    passed_tests = sum(test_results[key] for key in ['kafka_connection', 'topic_operations', 'message_production'])
    total_tests = 3
    
    print(f"✅ Passed: {passed_tests}/{total_tests}")
    print(f"📈 Success Rate: {(passed_tests/total_tests)*100:.1f}%")
    
    if passed_tests == total_tests:
        test_results['overall_status'] = 'PASS'
        print(f"🎉 ALL TESTS PASSED - Kafka is ready for documentation automation!")
        return test_results
    elif passed_tests >= 2:
        test_results['overall_status'] = 'PARTIAL'
        print(f"⚠️  PARTIAL SUCCESS - Some features may not work correctly")
        return test_results
    else:
        print(f"❌ TESTS FAILED - Kafka setup needs attention")
        return test_results

async def test_kafka_requirements():
    """Test that all required Kafka dependencies are available"""
    
    print("\n🔍 Checking Kafka Requirements...")
    
    requirements = [
        ('kafka-python', 'kafka'),
        ('async support', 'asyncio'), 
        ('json support', 'json'),
        ('datetime support', 'datetime')
    ]
    
    missing = []
    
    for name, module in requirements:
        try:
            __import__(module)
            print(f"✅ {name}")
        except ImportError:
            print(f"❌ {name} - MISSING")
            missing.append(name)
    
    if missing:
        print(f"\n⚠️  Missing requirements: {missing}")
        print(f"Install with: pip install kafka-python")
        return False
    else:
        print(f"\n✅ All requirements satisfied")
        return True

async def main():
    """Main test execution"""
    
    print("🚀 Kafka + LangGraph Documentation Automation - Connectivity Test")
    print("================================================================")
    print(f"Started at: {datetime.now()}")
    
    # Check requirements first
    if not await test_kafka_requirements():
        print("\n❌ Requirements check failed - please install missing dependencies")
        return 1
    
    # Run connectivity tests
    results = await test_kafka_connectivity()
    
    print(f"\nTest completed at: {datetime.now()}")
    
    if results['overall_status'] == 'PASS':
        print(f"\n✅ SUCCESS: Kafka system is ready for documentation automation")
        return 0
    elif results['overall_status'] == 'PARTIAL':
        print(f"\n⚠️  PARTIAL: Some Kafka features may not work - check setup")
        return 1
    else:
        print(f"\n❌ FAILURE: Kafka system needs setup - check installation")
        return 2

if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n🛑 Test interrupted by user")
        sys.exit(130)
    except Exception as e:
        print(f"\n💥 Test failed with error: {e}")
        sys.exit(1)