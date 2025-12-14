"""
Document Processing Consumer - Kafka Streams Implementation
Consumes source change events and processes documentation updates
Integrates with MongoDB Atlas for RAG updates
"""

import asyncio
import json
import logging
import os
from typing import Dict, Any, List, Optional
from datetime import datetime
from pathlib import Path

import pymongo
from dotenv import load_dotenv
from pymongo import MongoClient
import openai

from kafka_config import TopicName
from kafka_event_bus import kafka_event_bus

logger = logging.getLogger(__name__)

class DocumentProcessingConsumer:
    """
    Kafka consumer for document processing events
    Processes source repository changes and updates RAG system
    """
    
    def __init__(self):
        self.mongo_client: Optional[MongoClient] = None
        self.db = None
        self.collection = None
        self.openai_client = None
        self.is_running = False
        
        # Load environment configuration
        load_dotenv()
        
        # MongoDB Atlas configuration
        self.mongo_uri = os.getenv('MONGODB_URI')
        self.database_name = os.getenv('MONGODB_DATABASE', 'clientpass_docs')
        self.collection_name = os.getenv('MONGODB_COLLECTION', 'document_chunks')
        
        if not self.mongo_uri:
            raise ValueError("MONGODB_URI not found in environment variables. Please check your .env file.")
        
        # OpenAI configuration
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        
    async def initialize(self):
        """Initialize the document processing consumer"""
        try:
            logger.info("🔧 Initializing Document Processing Consumer...")
            
            # Initialize MongoDB connection
            await self._initialize_mongodb()
            
            # Initialize OpenAI client
            await self._initialize_openai()
            
            # Subscribe to Kafka topics
            await self._subscribe_to_topics()
            
            logger.info("✅ Document Processing Consumer initialized")
            self.is_running = True
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Document Processing Consumer: {e}")
            raise
    
    async def _initialize_mongodb(self):
        """Initialize MongoDB Atlas connection"""
        try:
            logger.info("🍃 Connecting to MongoDB Atlas...")
            
            self.mongo_client = MongoClient(self.mongo_uri)
            self.db = self.mongo_client[self.database_name]
            self.collection = self.db[self.collection_name]
            
            # Test connection
            self.db.command('ping')
            
            # Get collection stats
            stats = self.db.command('collStats', self.collection_name)
            doc_count = stats.get('count', 0)
            
            logger.info(f"✅ MongoDB Atlas connected - {doc_count} documents indexed")
            
        except Exception as e:
            logger.error(f"❌ MongoDB Atlas connection failed: {e}")
            raise
    
    async def _initialize_openai(self):
        """Initialize OpenAI client"""
        try:
            if not self.openai_api_key:
                logger.warning("⚠️ OpenAI API key not found - RAG updates will be limited")
                return
            
            openai.api_key = self.openai_api_key
            self.openai_client = openai
            
            logger.info("🤖 OpenAI client initialized")
            
        except Exception as e:
            logger.error(f"❌ OpenAI initialization failed: {e}")
            raise
    
    async def _subscribe_to_topics(self):
        """Subscribe to relevant Kafka topics"""
        try:
            # Subscribe to document processing events
            await kafka_event_bus.subscribe(
                topic=TopicName.DOCUMENT_PROCESSING.value,
                group_id="document-processing-consumer",
                handler=self._handle_document_processing
            )
            
            # Subscribe to source changes
            await kafka_event_bus.subscribe(
                topic=TopicName.SOURCE_CHANGES.value,
                group_id="source-changes-consumer", 
                handler=self._handle_source_changes
            )
            
            logger.info("🔔 Subscribed to Kafka topics")
            
        except Exception as e:
            logger.error(f"❌ Failed to subscribe to topics: {e}")
            raise
    
    def _handle_document_processing(self, message: Dict[str, Any]):
        """Handle document processing events"""
        try:
            event_type = message.get('event_type')
            logger.info(f"📋 Processing document event: {event_type}")
            
            if event_type == 'source_repo_changes_detected':
                asyncio.create_task(self._process_source_repository_changes(message))
            else:
                logger.debug(f"🔄 Unhandled document processing event: {event_type}")
                
        except Exception as e:
            logger.error(f"❌ Error handling document processing: {e}")
    
    def _handle_source_changes(self, message: Dict[str, Any]):
        """Handle source change events"""
        try:
            event_type = message.get('event_type')
            logger.info(f"📂 Processing source change: {event_type}")
            
            if event_type == 'source_repository_changes':
                asyncio.create_task(self._process_repository_commits(message))
            else:
                logger.debug(f"🔄 Unhandled source change event: {event_type}")
                
        except Exception as e:
            logger.error(f"❌ Error handling source changes: {e}")
    
    async def _process_source_repository_changes(self, message: Dict[str, Any]):
        """Process source repository changes for documentation"""
        try:
            commits = message.get('commits', [])
            source_repo = message.get('source_repo', '')
            
            logger.info(f"🔍 Processing {len(commits)} commits from {source_repo}")
            
            # Generate documentation for each commit
            documentation_updates = []
            
            for commit in commits:
                commit_hash = commit.get('commit_hash', '')
                commit_message = commit.get('message', '')
                files_changed = commit.get('files_changed', [])
                impact = commit.get('impact', '')
                
                logger.info(f"📝 Processing commit {commit_hash}: {commit_message}")
                
                # Generate documentation content
                doc_content = await self._generate_commit_documentation(
                    commit_hash, commit_message, files_changed, impact
                )
                
                if doc_content:
                    documentation_updates.append({
                        'commit_hash': commit_hash,
                        'title': f"Commit {commit_hash}: {commit_message}",
                        'content': doc_content,
                        'files_changed': files_changed,
                        'timestamp': datetime.utcnow().isoformat(),
                        'source_repo': source_repo
                    })
            
            # Update RAG system
            if documentation_updates:
                await self._update_rag_system(documentation_updates)
                
                # Publish RAG update event
                await self._publish_rag_update_event(documentation_updates)
            
        except Exception as e:
            logger.error(f"❌ Error processing source repository changes: {e}")
    
    async def _process_repository_commits(self, message: Dict[str, Any]):
        """Process repository commits from source changes"""
        try:
            commits = message.get('commits', [])
            commit_count = message.get('commit_count', len(commits))
            
            logger.info(f"🔄 Processing {commit_count} repository commits")
            
            # Process each commit
            for commit in commits:
                await self._process_single_commit(commit, message)
                
        except Exception as e:
            logger.error(f"❌ Error processing repository commits: {e}")
    
    async def _process_single_commit(self, commit: Dict[str, Any], context: Dict[str, Any]):
        """Process a single commit for documentation updates"""
        try:
            commit_hash = commit.get('commit_hash', '')
            message = commit.get('message', '')
            files_changed = commit.get('files_changed', [])
            
            logger.info(f"⚙️ Processing single commit {commit_hash}: {message}")
            
            # Create commit documentation entry
            commit_doc = {
                'type': 'commit_update',
                'commit_hash': commit_hash,
                'message': message,
                'files_changed': files_changed,
                'impact': commit.get('impact', ''),
                'source_repo': context.get('source_repo', ''),
                'processed_date': datetime.utcnow().isoformat()
            }
            
            # Add to MongoDB
            await self._add_commit_to_rag(commit_doc)
            
        except Exception as e:
            logger.error(f"❌ Error processing single commit: {e}")
    
    async def _generate_commit_documentation(self, 
                                           commit_hash: str, 
                                           message: str, 
                                           files_changed: List[str], 
                                           impact: str) -> str:
        """Generate documentation content for a commit"""
        try:
            # Create documentation content
            doc_lines = [
                f"## Commit {commit_hash}",
                f"",
                f"**Message:** {message}",
                f"**Impact:** {impact}",
                f"**Date:** {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}",
                f"",
                f"### Files Changed",
                ""
            ]
            
            for file_path in files_changed:
                doc_lines.append(f"- `{file_path}`")
            
            doc_lines.extend([
                "",
                f"### Description",
                f"This commit addresses: {impact}",
                f"",
                f"The changes in this commit affect the following components:",
                ""
            ])
            
            # Analyze file types for component classification
            component_types = set()
            for file_path in files_changed:
                if 'components/pages/' in file_path:
                    component_types.add('Page Components')
                elif 'components/boost/' in file_path:
                    component_types.add('Boost Features')
                elif 'components/ui/' in file_path:
                    component_types.add('UI Components')
                else:
                    component_types.add('Core Application')
            
            for component in component_types:
                doc_lines.append(f"- {component}")
            
            return '\n'.join(doc_lines)
            
        except Exception as e:
            logger.error(f"❌ Error generating commit documentation: {e}")
            return ""
    
    async def _update_rag_system(self, documentation_updates: List[Dict[str, Any]]):
        """Update RAG system with new documentation"""
        try:
            logger.info(f"🔄 Updating RAG system with {len(documentation_updates)} documents")
            
            for doc_update in documentation_updates:
                await self._add_document_to_rag(doc_update)
            
            logger.info("✅ RAG system updated successfully")
            
        except Exception as e:
            logger.error(f"❌ Error updating RAG system: {e}")
    
    async def _add_document_to_rag(self, doc_data: Dict[str, Any]):
        """Add a document to the RAG system"""
        try:
            # Create document chunk for RAG
            document_chunk = {
                'title': doc_data.get('title', ''),
                'content': doc_data.get('content', ''),
                'commit_hash': doc_data.get('commit_hash', ''),
                'files_changed': doc_data.get('files_changed', []),
                'source_repo': doc_data.get('source_repo', ''),
                'timestamp': doc_data.get('timestamp', ''),
                'type': 'source_commit_update',
                'processed_date': datetime.utcnow().isoformat()
            }
            
            # Insert into MongoDB
            result = self.collection.insert_one(document_chunk)
            
            logger.info(f"📄 Added document to RAG: {result.inserted_id}")
            
        except Exception as e:
            logger.error(f"❌ Error adding document to RAG: {e}")
    
    async def _add_commit_to_rag(self, commit_data: Dict[str, Any]):
        """Add commit information to RAG system"""
        try:
            # Insert commit data into MongoDB
            result = self.collection.insert_one(commit_data)
            
            logger.info(f"💾 Added commit {commit_data.get('commit_hash')} to RAG: {result.inserted_id}")
            
        except Exception as e:
            logger.error(f"❌ Error adding commit to RAG: {e}")
    
    async def _publish_rag_update_event(self, documentation_updates: List[Dict[str, Any]]):
        """Publish RAG update event"""
        try:
            rag_event = {
                'event_type': 'rag_system_updated',
                'documents_added': len(documentation_updates),
                'update_type': 'source_commits',
                'timestamp': datetime.utcnow().isoformat()
            }
            
            await kafka_event_bus.publish(
                topic=TopicName.RAG_UPDATES.value,
                message=rag_event,
                key=f"rag_update_{int(datetime.utcnow().timestamp())}"
            )
            
            logger.info(f"📤 Published RAG update event for {len(documentation_updates)} documents")
            
        except Exception as e:
            logger.error(f"❌ Error publishing RAG update event: {e}")
    
    async def get_rag_stats(self) -> Dict[str, Any]:
        """Get RAG system statistics"""
        try:
            total_docs = self.collection.count_documents({})
            commit_docs = self.collection.count_documents({'type': 'source_commit_update'})
            
            return {
                'total_documents': total_docs,
                'commit_documents': commit_docs,
                'last_updated': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Error getting RAG stats: {e}")
            return {}
    
    async def shutdown(self):
        """Gracefully shutdown the consumer"""
        logger.info("🛑 Shutting down Document Processing Consumer...")
        
        self.is_running = False
        
        # Close MongoDB connection
        if self.mongo_client:
            self.mongo_client.close()
            logger.info("🍃 MongoDB connection closed")
        
        logger.info("✅ Document Processing Consumer shutdown complete")

# Global consumer instance
document_processing_consumer = DocumentProcessingConsumer()