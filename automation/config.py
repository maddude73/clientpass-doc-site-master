#!/usr/bin/env python3
"""
Configuration Management for Multi-Agent System
"""

import os
import json
from pathlib import Path
from typing import Dict, Any, Optional
from pydantic import Field
from pydantic_settings import BaseSettings
from loguru import logger

class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Repository Settings
    repo_path: str = Field(default="/Users/rhfluker/Projects/clientpass-doc-site-master", env="REPO_PATH")
    repo_url: Optional[str] = Field(default=None, env="REPO_URL")
    docs_path: str = Field(default="public/docs", env="DOCS_PATH")
    source_monitoring_enabled: bool = Field(default=False, env="SOURCE_MONITORING_ENABLED")
    
    # MongoDB Settings - MongoDB Atlas Vector Search
    mongodb_uri: Optional[str] = Field(default=None, env="MONGODB_URI")
    mongodb_uri_test: Optional[str] = Field(default=None, env="MONGODB_URI_TEST")
    mongodb_uri_docs: Optional[str] = Field(default=None, env="MONGODB_URI_DOCS")
    mongodb_database: str = Field(default="docs", env="MONGODB_DATABASE")
    
    # Redis Settings - Event Bus and Caching
    redis_url: str = Field(default="redis://localhost:6379", env="REDIS_URL")
    redis_max_retries: int = Field(default=3, env="REDIS_MAX_RETRIES")
    redis_enabled: bool = Field(default=True, env="REDIS_ENABLED")
    redis_stream_block_time: int = Field(default=1000, env="REDIS_STREAM_BLOCK_TIME")  # milliseconds
    
    # AI API Keys
    openai_api_key: Optional[str] = Field(default=None, env="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4-turbo-preview", env="OPENAI_MODEL")
    anthropic_api_key: Optional[str] = Field(default=None, env="ANTHROPIC_API_KEY")
    anthropic_model: str = Field(default="claude-3-5-sonnet-20241022", env="ANTHROPIC_MODEL")
    gemini_api_key: Optional[str] = Field(default=None, env="GEMINI_API_KEY")
    
    # Scheduling Configuration
    daily_run_time: str = Field(default="02:00", env="DAILY_RUN_TIME")
    check_interval_minutes: int = Field(default=60, env="CHECK_INTERVAL_MINUTES")
    weekly_run_day: str = Field(default="Sunday", env="WEEKLY_RUN_DAY")
    weekly_run_time: str = Field(default="03:00", env="WEEKLY_RUN_TIME")
    
    # Logging Configuration
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    log_file: str = Field(default="./logs/automation.log", env="LOG_FILE")
    max_log_size_mb: int = Field(default=100, env="MAX_LOG_SIZE_MB")
    log_retention_days: int = Field(default=30, env="LOG_RETENTION_DAYS")
    
    # Vector Database Configuration (MongoDB Atlas)
    atlas_vector_search_index: str = Field(default="vector_index", env="ATLAS_VECTOR_SEARCH_INDEX")
    embedding_model: str = Field(default="text-embedding-3-small", env="EMBEDDING_MODEL")
    embedding_dimensions: int = Field(default=1536, env="EMBEDDING_DIMENSIONS")
    chunk_size: int = Field(default=1000, env="CHUNK_SIZE")
    chunk_overlap: int = Field(default=200, env="CHUNK_OVERLAP")
    atlas_vector_collection: str = Field(default="document_embeddings", env="ATLAS_VECTOR_COLLECTION")
    
    # Agent Configuration
    change_detection_enabled: bool = Field(default=True, env="CHANGE_DETECTION_ENABLED")
    document_management_enabled: bool = Field(default=True, env="DOCUMENT_MANAGEMENT_ENABLED")
    rag_management_enabled: bool = Field(default=True, env="RAG_MANAGEMENT_ENABLED")
    logging_audit_enabled: bool = Field(default=True, env="LOGGING_AUDIT_ENABLED")
    scheduler_enabled: bool = Field(default=True, env="SCHEDULER_ENABLED")
    self_healing_enabled: bool = Field(default=True, env="SELF_HEALING_ENABLED")
    
    # Self-Healing Configuration
    self_healing_check_interval: int = Field(default=30, env="SELF_HEALING_CHECK_INTERVAL")
    memory_threshold: int = Field(default=80, env="MEMORY_THRESHOLD")
    disk_threshold: int = Field(default=90, env="DISK_THRESHOLD")
    cpu_threshold: int = Field(default=95, env="CPU_THRESHOLD")
    max_log_size_mb_healing: int = Field(default=100, env="MAX_LOG_SIZE_MB_HEALING")
    auto_healing_enabled: bool = Field(default=True, env="AUTO_HEALING_ENABLED")
    max_fix_attempts: int = Field(default=3, env="MAX_FIX_ATTEMPTS")
    fix_cooldown_minutes: int = Field(default=10, env="FIX_COOLDOWN_MINUTES")
    
    # Performance Settings
    max_workers: int = Field(default=4, env="MAX_WORKERS")
    batch_size: int = Field(default=10, env="BATCH_SIZE")
    debounce_seconds: int = Field(default=5, env="DEBOUNCE_SECONDS")
    
    # System Configuration
    shutdown_timeout: int = Field(default=30, env="SHUTDOWN_TIMEOUT")
    health_check_interval: int = Field(default=300, env="HEALTH_CHECK_INTERVAL")
    sync_check_interval: int = Field(default=3600, env="SYNC_CHECK_INTERVAL")
    metrics_retention_days: int = Field(default=7, env="METRICS_RETENTION_DAYS")
    max_retries: int = Field(default=3, env="MAX_RETRIES")
    
    # Security Settings
    enable_audit_log: bool = Field(default=True, env="ENABLE_AUDIT_LOG")
    log_sensitive_data: bool = Field(default=False, env="LOG_SENSITIVE_DATA")
    require_auth: bool = Field(default=False, env="REQUIRE_AUTH")
    
    # Development Settings
    debug_mode: bool = Field(default=False, env="DEBUG_MODE")
    verbose_logging: bool = Field(default=False, env="VERBOSE_LOGGING")
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        # Allow extra fields from env file
        extra = "ignore"

class ConfigManager:
    """Dynamic configuration manager with file-based overrides"""
    
    def __init__(self, config_path: str = None):
        self.settings = Settings()
        self.config_path = config_path or os.path.join(
            os.path.dirname(__file__), "config.json"
        )
        self.dynamic_config = {}
        self.load_dynamic_config()
    
    def load_dynamic_config(self):
        """Load dynamic configuration from JSON file"""
        if os.path.exists(self.config_path):
            try:
                with open(self.config_path, 'r') as f:
                    self.dynamic_config = json.load(f)
                logger.info(f"Loaded dynamic config from {self.config_path}")
            except Exception as e:
                logger.error(f"Failed to load dynamic config: {e}")
                self.dynamic_config = {}
    
    def save_dynamic_config(self):
        """Save dynamic configuration to JSON file"""
        try:
            os.makedirs(os.path.dirname(self.config_path), exist_ok=True)
            with open(self.config_path, 'w') as f:
                json.dump(self.dynamic_config, f, indent=2)
            logger.info(f"Saved dynamic config to {self.config_path}")
        except Exception as e:
            logger.error(f"Failed to save dynamic config: {e}")
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value with fallback to settings"""
        # Check dynamic config first
        if key in self.dynamic_config:
            return self.dynamic_config[key]
        
        # Fall back to settings
        return getattr(self.settings, key, default)
    
    def set(self, key: str, value: Any):
        """Set dynamic configuration value"""
        self.dynamic_config[key] = value
        self.save_dynamic_config()
    
    def get_all(self) -> Dict[str, Any]:
        """Get all configuration values"""
        config = self.settings.model_dump()
        config.update(self.dynamic_config)
        return config
    
    def get_all_dynamic(self) -> Dict[str, Any]:
        """Get all dynamic configuration values"""
        return self.dynamic_config.copy()
    
    def get_path(self, relative_path: str) -> Path:
        """Get absolute path from relative path"""
        return Path(self.get('repo_path', '.')).parent / relative_path
    
    def validate_required_keys(self) -> Dict[str, bool]:
        """Validate that required configuration keys are present"""
        validation = {
            'mongodb_uri': bool(self.get('mongodb_uri')),
            'repo_path': bool(self.get('repo_path')) and os.path.exists(self.get('repo_path')),
            'docs_path': bool(self.get('docs_path')),
            'openai_api_key': bool(self.get('openai_api_key')),
        }
        return validation

# Global configuration manager
config = ConfigManager()