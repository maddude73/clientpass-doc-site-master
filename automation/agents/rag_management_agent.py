#!/usr/bin/env python3
"""
RAG Management Agent
Handles vector embeddings and MongoDB Atlas Vector Search operations
"""

import asyncio
import os
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
from loguru import logger
import numpy as np

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from base_agent import BaseAgent
from events import EventType
from config import config

class RAGManagementAgent(BaseAgent):
    """Manages RAG (Retrieval-Augmented Generation) operations with MongoDB Atlas Vector Search"""
    
    def __init__(self):
        super().__init__("RAGManagement")
        
        # Configuration - Read from environment with fallbacks
        import os
        self.mongodb_uri = config.get('mongodb_uri') or os.getenv('MONGODB_URI')
        self.database_name = config.get('mongodb_database', 'docs')
        self.vector_collection = config.get('document_collection', 'document_chunks')
        self.vector_index_name = config.get('vector_index_name', 'vector_index')
        self.embedding_model = config.get('embedding_model', 'text-embedding-3-small')
        self.embedding_dimensions = config.get('embedding_dimensions', 1536)
        self.chunk_size = config.get('chunk_size', 1000)
        self.chunk_overlap = config.get('chunk_overlap', 200)
        
        # Processing queue
        self.processing_queue = asyncio.Queue()
        
        # RAG state
        self.documents_indexed = 0
        self.embeddings_generated = 0
        self.last_sync_time = None
        
        # MongoDB Atlas connection
        self.mongo_client = None
        self.db = None
        self.embeddings_collection = None
        
        # Check for dependencies and configuration
        self.rag_enabled = self._check_dependencies() and self._check_configuration()
        
        if not self.rag_enabled:
            logger.warning("RAG functionality disabled - check dependencies (pymongo, openai) and MongoDB Atlas configuration")
        else:
            logger.info("RAG Management agent initialized with MongoDB Atlas Vector Search")
    
    def _check_dependencies(self) -> bool:
        """Check if required RAG dependencies are installed"""
        try:
            import pymongo
            import openai
            return True
        except ImportError:
            return False
            
    def _check_configuration(self) -> bool:
        """Check if MongoDB Atlas is properly configured"""
        if not self.mongodb_uri:
            logger.info("MongoDB Atlas URI not configured - RAG functionality disabled")
            return False
            
        if not self.mongodb_uri.startswith('mongodb+srv://'):
            logger.warning(f"MongoDB URI appears to be local instance, not Atlas: {self.mongodb_uri}")
            logger.info("For production use, configure MongoDB Atlas with MONGODB_URI environment variable")
            return False
            
        return True
    
    async def _setup_event_subscriptions(self):
        """Setup event subscriptions"""
        # Listen for document changes that require RAG updates
        self.subscribe_to_event(EventType.DOCUMENT_PROCESSING, self._handle_document_event)
        
        # Listen for RAG update requests
        self.subscribe_to_event(EventType.RAG_UPDATE, self._handle_rag_request)
        
        
        # Listen for daily maintenance
        self.subscribe_to_event(EventType.DAILY_MAINTENANCE, self._handle_maintenance)
    
    async def initialize(self):
        """Initialize the RAG management agent"""
        try:
            if not self.rag_enabled:
                logger.info("RAG agent initialized in disabled mode")
                return
            
            # Initialize MongoDB Atlas connection
            await self._initialize_atlas_connection()
            
            # Load existing index state
            await self._load_index_state()
            
            logger.info(f"RAGManagement initialized with {self.documents_indexed} indexed documents")
            
        except Exception as e:
            logger.error(f"Failed to initialize RAGManagement: {e}")
            raise
    
    async def process(self):
        """Main processing loop"""
        try:
            if not self.rag_enabled:
                await asyncio.sleep(30)  # Sleep longer when disabled
                return
            
            # Process queued RAG operations
            if not self.processing_queue.empty():
                try:
                    rag_task = await asyncio.wait_for(
                        self.processing_queue.get(),
                        timeout=1.0
                    )
                    await self._process_rag_task(rag_task)
                except asyncio.TimeoutError:
                    pass
            
            # Periodic maintenance
            await asyncio.sleep(10)
            
        except Exception as e:
            logger.error(f"Error in RAGManagement processing: {e}")
            raise
    
    async def cleanup(self):
        """Cleanup resources"""
        try:
            if self.mongo_client:
                self.mongo_client.close()
                logger.info("MongoDB Atlas connection closed")
        except Exception as e:
            logger.error(f"Error closing MongoDB connection: {e}")
        
        logger.info("RAGManagement cleanup complete")
    
    async def _initialize_atlas_connection(self):
        """Initialize MongoDB Atlas connection and collections"""
        try:
            if not self.rag_enabled:
                return
                
            import pymongo
            
            # Create MongoDB client
            self.mongo_client = pymongo.MongoClient(self.mongodb_uri)
            
            # Get database
            self.db = self.mongo_client[self.database_name]
            
            # Get or create embeddings collection
            self.embeddings_collection = self.db[self.vector_collection]
            
            # Test connection
            self.mongo_client.admin.command('ping')
            
            # Ensure vector search index exists (log info but don't create - needs to be done via Atlas UI)
            logger.info(f"Using vector search index: {self.vector_index_name}")
            logger.info("Note: Vector search index must be created in MongoDB Atlas UI")
            
            logger.info("MongoDB Atlas connection initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize MongoDB Atlas connection: {e}")
            self.rag_enabled = False
    
    async def _load_index_state(self):
        """Load the current index state"""
        try:
            if not self.rag_enabled:
                return
                
            # Get count of indexed documents from MongoDB Atlas
            self.documents_indexed = self.embeddings_collection.count_documents({})
            
            # Load last sync time from config
            self.last_sync_time = config.get('rag.last_sync_time')
            if self.last_sync_time:
                self.last_sync_time = datetime.fromisoformat(self.last_sync_time)
            
            logger.info(f"Loaded index state: {self.documents_indexed} documents")
            
        except Exception as e:
            logger.error(f"Failed to load index state: {e}")
    
    async def _process_rag_task(self, task: Dict[str, Any]):
        """Process a RAG task"""
        try:
            if not self.rag_enabled:
                logger.warning("Cannot process RAG task - functionality disabled")
                return
                
            action = task.get('action')
            
            logger.debug(f"Processing RAG task: {action}")
            
            if action == 'index_document':
                await self._index_document(task)
            elif action == 'update_document':
                await self._update_document(task)
            elif action == 'delete_document':
                await self._delete_document(task)
            elif action == 'search':
                await self._search_documents(task)
            elif action == 'sync_all':
                await self._sync_all_documents()
            else:
                logger.warning(f"Unknown RAG task action: {action}")
            
        except Exception as e:
            logger.error(f"Failed to process RAG task: {e}")
    
    async def _index_document(self, task: Dict[str, Any]):
        """Index a document for vector search"""
        try:
            file_path = Path(task.get('file_path'))
            content = task.get('content')
            
            if not content and file_path.exists():
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
            
            if not content:
                logger.warning(f"No content to index for {file_path}")
                return
            
            # Create document chunks
            chunks = await self._create_chunks(content, str(file_path))
            
            # Generate embeddings and store
            await self._store_chunks(chunks, str(file_path))
            
            self.documents_indexed += 1
            self.embeddings_generated += len(chunks)
            
            logger.info(f"Indexed document: {file_path} ({len(chunks)} chunks)")
            
        except Exception as e:
            logger.error(f"Failed to index document: {e}")
    
    async def _create_chunks(self, content: str, file_path: str) -> List[Dict[str, Any]]:
        """Create chunks from document content"""
        try:
            # Simple chunking by characters
            chunks = []
            chunk_id = 0
            
            for i in range(0, len(content), self.chunk_size - self.chunk_overlap):
                chunk_text = content[i:i + self.chunk_size]
                
                if len(chunk_text.strip()) < 50:  # Skip very small chunks
                    continue
                
                chunks.append({
                    'id': f"{file_path}#{chunk_id}",
                    'text': chunk_text,
                    'metadata': {
                        'source': file_path,
                        'chunk_id': chunk_id,
                        'start_char': i,
                        'end_char': i + len(chunk_text),
                        'indexed_at': datetime.now().isoformat()
                    }
                })
                chunk_id += 1
            
            return chunks
            
        except Exception as e:
            logger.error(f"Failed to create chunks: {e}")
            return []
    
    async def _store_chunks(self, chunks: List[Dict[str, Any]], file_path: str):
        """Store chunks with embeddings in MongoDB Atlas"""
        try:
            if not chunks:
                return
            
            # Generate embeddings for chunks
            documents_to_insert = []
            
            for chunk in chunks:
                # Generate embedding for the chunk text
                embedding = await self._generate_embedding(chunk['text'])
                
                if embedding:
                    document = {
                        'doc_id': chunk['metadata']['source'].replace('.md', '').split('/')[-1],
                        'content': chunk['text'],
                        'embedding': embedding,
                        'start_char': chunk['metadata']['start_char'],
                        'end_char': chunk['metadata']['end_char'],
                        'source_file': chunk['metadata']['source'].split('/')[-1],
                        'frontmatter': {},  # Could extract from file if needed
                        'indexed_at': datetime.now()
                    }
                    documents_to_insert.append(document)
            
            # Insert into MongoDB Atlas
            if documents_to_insert:
                # Use replace_one with upsert to handle updates
                for doc in documents_to_insert:
                    self.embeddings_collection.replace_one(
                        {'_id': doc['_id']},
                        doc,
                        upsert=True
                    )
                
                logger.debug(f"Stored {len(documents_to_insert)} chunks for {file_path}")
            
        except Exception as e:
            logger.error(f"Failed to store chunks: {e}")
    
    async def _generate_embedding(self, text: str) -> Optional[List[float]]:
        """Generate embedding for text using OpenAI API"""
        try:
            import openai
            import random
            
            # Set up OpenAI client
            openai_api_key = config.get('openai_api_key')
            if not openai_api_key:
                logger.warning("OpenAI API key not configured - using mock embeddings")
                # Return mock embedding for testing
                return [random.random() for _ in range(self.embedding_dimensions)]
            
            client = openai.OpenAI(api_key=openai_api_key)
            
            # Generate embedding
            response = client.embeddings.create(
                model=self.embedding_model,
                input=text
            )
            
            embedding = response.data[0].embedding
            logger.debug(f"Generated embedding with {len(embedding)} dimensions")
            return embedding
            
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            # Return mock embedding as fallback
            import random
            return [random.random() for _ in range(self.embedding_dimensions)]
    
    async def _update_document(self, task: Dict[str, Any]):
        """Update an existing document in the index"""
        try:
            file_path = task.get('file_path')
            
            # Delete existing chunks for this document
            await self._delete_document({'file_path': file_path})
            
            # Re-index the document
            await self._index_document(task)
            
            logger.info(f"Updated document index: {file_path}")
            
        except Exception as e:
            logger.error(f"Failed to update document: {e}")
    
    async def _delete_document(self, task: Dict[str, Any]):
        """Delete a document from the index"""
        try:
            file_path = task.get('file_path')
            
            # Delete all chunks for this document from MongoDB Atlas
            source_file = Path(file_path).name
            result = self.embeddings_collection.delete_many({
                'source_file': source_file
            })
            
            logger.info(f"Deleted {result.deleted_count} chunks for {file_path}")
            
        except Exception as e:
            logger.error(f"Failed to delete document: {e}")
    
    async def _search_documents(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Search documents using MongoDB Atlas Vector Search"""
        try:
            query = task.get('query', '')
            limit = task.get('limit', 10)
            
            if not query:
                return {'results': [], 'error': 'No query provided'}
            
            # Generate embedding for the query
            query_embedding = await self._generate_embedding(query)
            if not query_embedding:
                return {'results': [], 'error': 'Failed to generate query embedding'}
            
            # Perform vector search using MongoDB Atlas Vector Search
            pipeline = [
                {
                    '$vectorSearch': {
                        'index': self.vector_index_name,
                        'path': 'embedding',
                        'queryVector': query_embedding,
                        'numCandidates': limit * 10,  # Oversample for better results
                        'limit': limit
                    }
                },
                {
                    '$addFields': {
                        'score': {'$meta': 'vectorSearchScore'}
                    }
                }
            ]
            
            # Execute search
            cursor = self.embeddings_collection.aggregate(pipeline)
            results = list(cursor)
            
            # Format results
            search_results = []
            for doc in results:
                search_results.append({
                    'id': doc.get('_id'),
                    'content': doc.get('content'),
                    'source_file': doc.get('source_file'),
                    'score': doc.get('score', 0),
                    'doc_id': doc.get('doc_id')
                })
            
            logger.info(f"Vector search query '{query}' returned {len(search_results)} results")
            
            return {
                'results': search_results,
                'query': query,
                'total_results': len(search_results)
            }
            
        except Exception as e:
            logger.error(f"Failed to search documents: {e}")
            return {'results': [], 'error': str(e)}
    
    async def _sync_all_documents(self):
        """Sync all documentation files to the RAG index"""
        try:
            docs_path = Path('public/docs')
            if not docs_path.exists():
                logger.warning("Documents directory not found")
                return
            
            synced_count = 0
            
            for doc_file in docs_path.rglob("*.md"):
                await self.processing_queue.put({
                    'action': 'index_document',
                    'file_path': doc_file
                })
                synced_count += 1
            
            # Update last sync time
            self.last_sync_time = datetime.now()
            config.set('rag.last_sync_time', self.last_sync_time.isoformat())
            
            logger.info(f"Queued {synced_count} documents for RAG sync")
            
        except Exception as e:
            logger.error(f"Failed to sync all documents: {e}")
    
    async def _handle_document_event(self, event):
        """Handle document processing events"""
        try:
            if not self.rag_enabled:
                return
                
            action = event.data.get('action')
            file_path = event.data.get('file_path')
            
            if not file_path:
                return
            
            # Only process markdown files
            if not file_path.endswith('.md'):
                return
            
            if action in ['processed', 'created']:
                # Queue for indexing
                await self.processing_queue.put({
                    'action': 'index_document',
                    'file_path': file_path
                })
                
            elif action == 'deleted':
                # Queue for deletion
                await self.processing_queue.put({
                    'action': 'delete_document',
                    'file_path': file_path
                })
            
            logger.info(f"Queued RAG task: {action} for {file_path}")
            
        except Exception as e:
            logger.error(f"Failed to handle document event: {e}")
    
    async def _handle_rag_request(self, event):
        """Handle RAG operation requests"""
        try:
            request_data = event.data
            action = request_data.get('action')
            
            if action == 'search':
                # Perform search and publish results
                results = await self._search_documents(request_data)
                
                event_bus.publish(
                    EventType.RAG_UPDATE,
                    self.name,
                    {
                        'action': 'search_results',
                        'results': results,
                        'request_id': request_data.get('request_id'),
                        'timestamp': datetime.now().isoformat()
                    }
                )
            else:
                # Queue other RAG operations
                await self.processing_queue.put(request_data)
            
            logger.info(f"Handled RAG request: {action}")
            
        except Exception as e:
            logger.error(f"Failed to handle RAG request: {e}")
    
    async def _handle_maintenance(self, event):
        """Handle daily maintenance tasks"""
        try:
            if not self.rag_enabled:
                return
                
            logger.info("Starting RAG maintenance tasks")
            
            # Sync all documents if it's been a while
            if (not self.last_sync_time or 
                (datetime.now() - self.last_sync_time).days >= 1):
                await self._sync_all_documents()
            
            # Publish maintenance completion
            event_bus.publish(
                EventType.DAILY_MAINTENANCE,
                self.name,
                {
                    'action': 'completed',
                    'documents_indexed': self.documents_indexed,
                    'embeddings_generated': self.embeddings_generated,
                    'timestamp': datetime.now().isoformat()
                }
            )
            
            logger.info("RAG maintenance completed")
            
        except Exception as e:
            logger.error(f"Failed to handle maintenance: {e}")