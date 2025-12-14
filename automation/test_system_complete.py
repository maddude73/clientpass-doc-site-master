#!/usr/bin/env python3
"""
Complete System Test - Kafka + LangGraph + MongoDB Atlas
Validates all components are working properly
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import pymongo
from kafka import KafkaProducer, KafkaConsumer
import json
import asyncio
from datetime import datetime

# Load environment
load_dotenv()

def test_environment_config():
    """Test environment configuration is loaded properly"""
    print("🔧 Testing Environment Configuration...")
    
    required_vars = [
        'MONGODB_URI',
        'MONGODB_DATABASE',
        'KAFKA_BOOTSTRAP_SERVERS',
        'OPENAI_API_KEY'
    ]
    
    missing = []
    for var in required_vars:
        value = os.getenv(var)
        if not value:
            missing.append(var)
        else:
            print(f"  ✅ {var}: {'*' * min(len(value), 20)}...")
    
    if missing:
        print(f"  ❌ Missing environment variables: {missing}")
        return False
    
    print("  ✅ All environment variables loaded")
    return True

def test_mongodb_connection():
    """Test MongoDB Atlas connection"""
    print("\n🗄️  Testing MongoDB Atlas Connection...")
    
    try:
        mongo_uri = os.getenv('MONGODB_URI')
        database_name = os.getenv('MONGODB_DATABASE', 'clientpass_docs')
        
        print(f"  📍 Connecting to: {mongo_uri.split('@')[1] if '@' in mongo_uri else 'MongoDB'}")
        
        client = pymongo.MongoClient(mongo_uri)
        
        # Test connection
        client.admin.command('ping')
        print("  ✅ MongoDB Atlas connection successful")
        
        # Test database access
        db = client[database_name]
        collections = db.list_collection_names()
        print(f"  📚 Database '{database_name}' accessible")
        print(f"  📊 Collections: {collections}")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"  ❌ MongoDB connection failed: {str(e)}")
        return False

def test_kafka_connection():
    """Test Kafka connection and topic access"""
    print("\n📨 Testing Kafka Connection...")
    
    try:
        kafka_servers = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')
        print(f"  📍 Connecting to: {kafka_servers}")
        
        # Test producer
        producer = KafkaProducer(
            bootstrap_servers=[kafka_servers],
            value_serializer=lambda x: json.dumps(x).encode('utf-8')
        )
        
        test_message = {
            "test": True,
            "timestamp": datetime.now().isoformat(),
            "message": "System test connection"
        }
        
        future = producer.send('system-status', test_message)
        record_metadata = future.get(timeout=10)
        print(f"  ✅ Message sent to topic '{record_metadata.topic}' partition {record_metadata.partition}")
        
        producer.close()
        return True
        
    except Exception as e:
        print(f"  ❌ Kafka connection failed: {str(e)}")
        return False

def test_document_consumer_import():
    """Test document processing consumer can be imported"""
    print("\n🔄 Testing Document Processing Consumer...")
    
    try:
        # Add current directory to path for imports
        current_dir = Path(__file__).parent
        sys.path.insert(0, str(current_dir))
        
        from document_processing_consumer import DocumentProcessingConsumer
        print("  ✅ DocumentProcessingConsumer imported successfully")
        
        # Test initialization
        consumer = DocumentProcessingConsumer()
        print("  ✅ Consumer initialized without errors")
        print(f"  📊 MongoDB URI configured: {consumer.mongo_uri[:50]}...")
        print(f"  📊 Database: {consumer.database_name}")
        print(f"  📊 Collection: {consumer.collection_name}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Document consumer test failed: {str(e)}")
        return False

def main():
    """Run comprehensive system tests"""
    print("🚀 Kafka + LangGraph + MongoDB Atlas System Test")
    print("=" * 60)
    
    tests = [
        test_environment_config,
        test_mongodb_connection,
        test_kafka_connection,
        test_document_consumer_import
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"  💥 Test crashed: {str(e)}")
            results.append(False)
    
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS:")
    
    passed = sum(results)
    total = len(results)
    
    print(f"✅ Passed: {passed}/{total}")
    print(f"❌ Failed: {total - passed}/{total}")
    
    if all(results):
        print("\n🎉 ALL TESTS PASSED - System is ready!")
        return 0
    else:
        print("\n⚠️  Some tests failed - Check configuration")
        return 1

if __name__ == "__main__":
    exit(main())