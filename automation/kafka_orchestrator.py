"""
Kafka Streams Orchestrator - Replacement for Unstable Redis MAS
Coordinates Kafka producers and consumers for reliable document automation
"""

import asyncio
import logging
import signal
import sys
from typing import Dict, Any
from datetime import datetime

from source_change_producer import source_change_producer
from document_processing_consumer import document_processing_consumer
from kafka_event_bus import kafka_event_bus

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)8s | %(name)s:%(funcName)s:%(lineno)d - %(message)s',
    handlers=[
        logging.FileHandler('/Users/rhfluker/Projects/clientpass-doc-site-master/automation/logs/kafka_streams.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

class KafkaStreamsOrchestrator:
    """
    Kafka Streams orchestrator for reliable document automation
    Replaces the unstable Redis-based Multi-Agent System
    """
    
    def __init__(self):
        self.is_running = False
        self.start_time = None
        
    async def start(self):
        """Start the Kafka Streams system"""
        try:
            logger.info("🚀 Starting Kafka Streams Orchestrator...")
            self.start_time = datetime.now()
            
            # Initialize Kafka event bus
            await kafka_event_bus.initialize()
            
            # Initialize source change producer
            await source_change_producer.initialize()
            
            # Initialize document processing consumer  
            await document_processing_consumer.initialize()
            
            self.is_running = True
            
            logger.info("✅ Kafka Streams system started successfully")
            
            # Start monitoring loops
            await self._run_system()
            
        except Exception as e:
            logger.error(f"❌ Failed to start Kafka Streams system: {e}")
            raise
    
    async def _run_system(self):
        """Run the main system loop"""
        try:
            # Start producer monitoring
            producer_task = asyncio.create_task(source_change_producer.start_monitoring())
            
            # Test connectivity
            connectivity_task = asyncio.create_task(self._test_connectivity())
            
            # Health monitoring
            health_task = asyncio.create_task(self._health_monitor())
            
            # Wait for tasks
            await asyncio.gather(producer_task, connectivity_task, health_task)
            
        except Exception as e:
            logger.error(f"❌ System runtime error: {e}")
            raise
    
    async def _test_connectivity(self):
        """Test Kafka connectivity"""
        try:
            logger.info("🧪 Testing Kafka connectivity...")
            
            # Test producer
            success = await source_change_producer.publish_test_event()
            if success:
                logger.info("✅ Kafka producer connectivity verified")
            else:
                logger.error("❌ Kafka producer connectivity failed")
            
            # Test consumer stats
            rag_stats = await document_processing_consumer.get_rag_stats()
            if rag_stats:
                logger.info(f"📊 RAG system stats: {rag_stats}")
            
        except Exception as e:
            logger.error(f"❌ Connectivity test failed: {e}")
    
    async def _health_monitor(self):
        """Monitor system health"""
        try:
            while self.is_running:
                # Get Kafka health
                health = await kafka_event_bus.health_check()
                
                if health.get('status') == 'healthy':
                    uptime = (datetime.utcnow() - self.start_time).total_seconds()
                    logger.info(f"💚 System healthy - uptime: {uptime:.1f}s, brokers: {health.get('brokers')}")
                else:
                    logger.warning(f"⚠️ System health warning: {health}")
                
                # Wait before next health check
                await asyncio.sleep(30)
                
        except Exception as e:
            logger.error(f"❌ Health monitor error: {e}")
    
    async def shutdown(self):
        """Gracefully shutdown the system"""
        logger.info("🛑 Shutting down Kafka Streams Orchestrator...")
        
        self.is_running = False
        
        # Shutdown components
        await source_change_producer.shutdown()
        await document_processing_consumer.shutdown() 
        await kafka_event_bus.shutdown()
        
        logger.info("✅ Kafka Streams Orchestrator shutdown complete")

# Global orchestrator instance
orchestrator = KafkaStreamsOrchestrator()

def signal_handler(signum, frame):
    """Handle shutdown signals"""
    logger.info(f"🔔 Received signal {signum}, initiating shutdown...")
    asyncio.create_task(orchestrator.shutdown())
    sys.exit(0)

async def main():
    """Main entry point"""
    try:
        # Register signal handlers
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
        
        # Start the orchestrator
        await orchestrator.start()
        
    except KeyboardInterrupt:
        logger.info("🔔 Keyboard interrupt received")
        await orchestrator.shutdown()
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}")
        await orchestrator.shutdown()
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())