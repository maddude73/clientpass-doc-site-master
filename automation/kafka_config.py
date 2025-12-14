"""
Kafka Configuration for Documentation Automation System
Replaces unstable Redis with reliable Kafka Streams
"""

import os
from typing import Dict, List
from dataclasses import dataclass
from enum import Enum

class TopicName(Enum):
    """Kafka topic names for different event types"""
    SOURCE_CHANGES = "source-changes"
    DOCUMENT_PROCESSING = "document-processing" 
    RAG_UPDATES = "rag-updates"
    SYSTEM_STATUS = "system-status"
    ERROR_EVENTS = "error-events"

@dataclass
class KafkaConfig:
    """Kafka cluster configuration"""
    bootstrap_servers: str = "localhost:9092"
    client_id: str = "doc-automation-system"
    group_id: str = "doc-automation-group"
    auto_offset_reset: str = "earliest"
    enable_auto_commit: bool = False
    max_poll_records: int = 100
    session_timeout_ms: int = 30000
    heartbeat_interval_ms: int = 3000
    
    # Producer settings
    producer_acks: str = "all"  # Wait for all replicas
    producer_retries: int = 3
    producer_batch_size: int = 16384
    producer_linger_ms: int = 5
    
    # Consumer settings
    consumer_fetch_min_bytes: int = 1
    consumer_fetch_max_wait_ms: int = 500
    
    def get_producer_config(self) -> Dict:
        """Get producer configuration"""
        return {
            'bootstrap_servers': [self.bootstrap_servers],
            'client_id': f"{self.client_id}-producer",
            'acks': self.producer_acks,
            'retries': self.producer_retries,
            'batch_size': self.producer_batch_size,
            'linger_ms': self.producer_linger_ms,
            'value_serializer': lambda x: x.encode('utf-8') if isinstance(x, str) else x,
            'key_serializer': lambda x: x.encode('utf-8') if x else None
        }
    
    def get_consumer_config(self, group_id: str = None) -> Dict:
        """Get consumer configuration"""
        return {
            'bootstrap_servers': [self.bootstrap_servers],
            'client_id': f"{self.client_id}-consumer",
            'group_id': group_id or self.group_id,
            'auto_offset_reset': self.auto_offset_reset,
            'enable_auto_commit': self.enable_auto_commit,
            'max_poll_records': self.max_poll_records,
            'session_timeout_ms': self.session_timeout_ms,
            'heartbeat_interval_ms': self.heartbeat_interval_ms,
            'fetch_min_bytes': self.consumer_fetch_min_bytes,
            'fetch_max_wait_ms': self.consumer_fetch_max_wait_ms,
            'value_deserializer': lambda x: x.decode('utf-8') if x else None,
            'key_deserializer': lambda x: x.decode('utf-8') if x else None
        }

@dataclass 
class TopicConfig:
    """Topic configuration settings"""
    name: str
    partitions: int = 3
    replication_factor: int = 1
    config: Dict = None
    
    def __post_init__(self):
        if self.config is None:
            self.config = {
                'cleanup.policy': 'delete',
                'retention.ms': '86400000',  # 24 hours
                'segment.ms': '3600000',     # 1 hour
                'min.insync.replicas': '1'
            }

# Topic configurations
TOPIC_CONFIGS = [
    TopicConfig(
        name=TopicName.SOURCE_CHANGES.value,
        partitions=3,
        config={
            'cleanup.policy': 'delete',
            'retention.ms': '172800000',  # 48 hours for source changes
            'segment.ms': '3600000'
        }
    ),
    TopicConfig(
        name=TopicName.DOCUMENT_PROCESSING.value,
        partitions=5,  # More partitions for parallel processing
        config={
            'cleanup.policy': 'delete', 
            'retention.ms': '86400000',  # 24 hours
            'segment.ms': '1800000'      # 30 minutes
        }
    ),
    TopicConfig(
        name=TopicName.RAG_UPDATES.value,
        partitions=2,
        config={
            'cleanup.policy': 'delete',
            'retention.ms': '259200000',  # 72 hours for RAG updates
            'segment.ms': '7200000'       # 2 hours
        }
    ),
    TopicConfig(
        name=TopicName.SYSTEM_STATUS.value,
        partitions=1,
        config={
            'cleanup.policy': 'compact',  # Keep latest status
            'retention.ms': '604800000',  # 1 week
            'segment.ms': '3600000'
        }
    ),
    TopicConfig(
        name=TopicName.ERROR_EVENTS.value,
        partitions=2,
        config={
            'cleanup.policy': 'delete',
            'retention.ms': '604800000',  # 1 week for errors
            'segment.ms': '3600000'
        }
    )
]

# Global Kafka configuration instance
kafka_config = KafkaConfig()