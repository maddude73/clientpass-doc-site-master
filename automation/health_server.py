"""
Health Check and Monitoring API for Docker Container
Provides endpoints for Docker health checks and system monitoring
"""

import asyncio
import logging
import os
from datetime import datetime
from typing import Dict, Any

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
import uvicorn
import pymongo
from kafka import KafkaProducer
from dotenv import load_dotenv

# Load environment
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="ClientPass Documentation Automation",
    description="Health Check and Monitoring API",
    version="1.0.0"
)

class HealthChecker:
    def __init__(self):
        self.mongo_uri = os.getenv('MONGODB_URI')
        self.kafka_servers = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'kafka:29092')
        
    async def check_mongodb(self) -> Dict[str, Any]:
        """Check MongoDB Atlas connection"""
        try:
            client = pymongo.MongoClient(self.mongo_uri)
            client.admin.command('ping')
            
            db = client[os.getenv('MONGODB_DATABASE', 'clientpass_docs')]
            collections = db.list_collection_names()
            
            client.close()
            
            return {
                "status": "healthy",
                "collections": collections,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def check_kafka(self) -> Dict[str, Any]:
        """Check Kafka connection"""
        try:
            producer = KafkaProducer(
                bootstrap_servers=[self.kafka_servers],
                value_serializer=lambda x: str(x).encode('utf-8')
            )
            
            # Try to get metadata
            metadata = producer.list_topics(timeout=5)
            topics = list(metadata.topics.keys())
            
            producer.close()
            
            return {
                "status": "healthy",
                "topics": topics,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def check_system_resources(self) -> Dict[str, Any]:
        """Check system resources"""
        try:
            import psutil
            
            return {
                "status": "healthy",
                "cpu_percent": psutil.cpu_percent(),
                "memory": {
                    "total": psutil.virtual_memory().total,
                    "available": psutil.virtual_memory().available,
                    "percent": psutil.virtual_memory().percent
                },
                "disk": {
                    "total": psutil.disk_usage('/').total,
                    "free": psutil.disk_usage('/').free,
                    "percent": psutil.disk_usage('/').percent
                },
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

# Initialize health checker
health_checker = HealthChecker()

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "ClientPass Documentation Automation",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Main health check endpoint for Docker"""
    try:
        # Quick health check for Docker
        mongo_status = await health_checker.check_mongodb()
        kafka_status = await health_checker.check_kafka()
        
        overall_healthy = (
            mongo_status.get("status") == "healthy" and 
            kafka_status.get("status") == "healthy"
        )
        
        status_code = 200 if overall_healthy else 503
        
        return JSONResponse(
            status_code=status_code,
            content={
                "status": "healthy" if overall_healthy else "unhealthy",
                "components": {
                    "mongodb": mongo_status["status"],
                    "kafka": kafka_status["status"]
                },
                "timestamp": datetime.now().isoformat()
            }
        )
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
        )

@app.get("/health/detailed")
async def detailed_health_check():
    """Detailed health check with full component status"""
    try:
        mongo_status = await health_checker.check_mongodb()
        kafka_status = await health_checker.check_kafka()
        system_status = await health_checker.check_system_resources()
        
        return {
            "status": "healthy",
            "components": {
                "mongodb": mongo_status,
                "kafka": kafka_status,
                "system": system_status
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/metrics")
async def metrics():
    """Prometheus-style metrics endpoint"""
    try:
        system_status = await health_checker.check_system_resources()
        
        if system_status["status"] == "healthy":
            metrics_text = f"""
# HELP system_cpu_percent CPU usage percentage
# TYPE system_cpu_percent gauge
system_cpu_percent {system_status["cpu_percent"]}

# HELP system_memory_percent Memory usage percentage
# TYPE system_memory_percent gauge
system_memory_percent {system_status["memory"]["percent"]}

# HELP system_disk_percent Disk usage percentage
# TYPE system_disk_percent gauge
system_disk_percent {system_status["disk"]["percent"]}

# HELP service_health Service health status (1=healthy, 0=unhealthy)
# TYPE service_health gauge
service_health 1
"""
            return metrics_text.strip()
        else:
            raise HTTPException(status_code=503, detail="System unhealthy")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/status")
async def service_status():
    """Service status information"""
    return {
        "service": "ClientPass Documentation Automation",
        "version": "1.0.0",
        "environment": os.getenv("APP_ENV", "development"),
        "python_version": os.sys.version,
        "uptime": datetime.now().isoformat(),
        "configuration": {
            "kafka_servers": os.getenv("KAFKA_BOOTSTRAP_SERVERS"),
            "mongodb_database": os.getenv("MONGODB_DATABASE"),
            "log_level": os.getenv("LOG_LEVEL", "INFO")
        }
    }

if __name__ == "__main__":
    # Run the health check server
    port = int(os.getenv("METRICS_PORT", 8000))
    host = "0.0.0.0"
    
    logger.info(f"Starting health check server on {host}:{port}")
    
    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level=os.getenv("LOG_LEVEL", "info").lower()
    )