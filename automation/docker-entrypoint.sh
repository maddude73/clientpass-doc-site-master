#!/bin/bash
# Docker Container Startup Script

set -e

echo "🚀 Starting ClientPass Documentation Automation System..."

# Environment setup
export PYTHONPATH=/app
export PYTHONUNBUFFERED=1

# Create required directories
mkdir -p /app/logs /app/data/temp /app/data/triggers

# Function to check if service is ready
wait_for_service() {
    local service=$1
    local host=$2
    local port=$3
    local timeout=${4:-60}
    
    echo "⏳ Waiting for $service to be ready..."
    
    for i in $(seq 1 $timeout); do
        if nc -z "$host" "$port" 2>/dev/null; then
            echo "✅ $service is ready"
            return 0
        fi
        echo "⏳ Attempt $i/$timeout: $service not ready, waiting..."
        sleep 2
    done
    
    echo "❌ $service failed to become ready within $timeout attempts"
    return 1
}

# Wait for Kafka to be ready
if [ "${KAFKA_BOOTSTRAP_SERVERS}" ]; then
    kafka_host=$(echo "${KAFKA_BOOTSTRAP_SERVERS}" | cut -d: -f1)
    kafka_port=$(echo "${KAFKA_BOOTSTRAP_SERVERS}" | cut -d: -f2)
    wait_for_service "Kafka" "$kafka_host" "$kafka_port"
fi

# Test MongoDB connection
if [ "${MONGODB_URI}" ]; then
    echo "🗄️  Testing MongoDB Atlas connection..."
    python3 -c "
import pymongo
import os
try:
    client = pymongo.MongoClient('${MONGODB_URI}')
    client.admin.command('ping')
    print('✅ MongoDB Atlas connection successful')
    client.close()
except Exception as e:
    print(f'❌ MongoDB connection failed: {e}')
    exit(1)
" || exit 1
fi

# Start health check server in background
echo "🏥 Starting health check server..."
python3 health_server.py &
HEALTH_PID=$!

# Give health server time to start
sleep 5

# Start the main application based on environment
if [ "${APP_ENV}" = "development" ]; then
    echo "🧪 Starting in development mode..."
    python3 kafka_orchestrator.py
elif [ "${1}" = "test" ]; then
    echo "🧪 Running tests..."
    python3 test_system_complete.py
else
    echo "🏭 Starting in production mode..."
    # Start main application
    python3 kafka_orchestrator.py &
    MAIN_PID=$!
    
    # Monitor processes
    echo "🔍 Monitoring system processes..."
    
    while true; do
        # Check if health server is still running
        if ! kill -0 $HEALTH_PID 2>/dev/null; then
            echo "❌ Health server died, restarting..."
            python3 health_server.py &
            HEALTH_PID=$!
        fi
        
        # Check if main application is still running
        if ! kill -0 $MAIN_PID 2>/dev/null; then
            echo "❌ Main application died, exiting..."
            exit 1
        fi
        
        sleep 30
    done
fi