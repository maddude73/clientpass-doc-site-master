#!/usr/bin/env python3
"""
Document Management Agent
Handles document processing, validation, and organization
"""

import asyncio
import os
import shutil
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
from loguru import logger

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from base_agent import BaseAgent
from events import event_bus, EventType
from config import config

class DocumentManagementAgent(BaseAgent):
    """Manages document processing and organization"""
    
    def __init__(self):
        super().__init__("DocumentManagement")
        
        # Configuration
        self.docs_path = Path(config.get('document_management.docs_path', 'public/docs/'))
        self.backup_path = Path(config.get('document_management.backup_path', 'data/backups/'))
        self.processing_queue = asyncio.Queue()
        
        # Supported document formats
        self.supported_formats = config.get('document_management.supported_formats', [
            '.md', '.txt', '.json', '.yaml', '.yml'
        ])
        
        # Document validation rules
        self.validation_rules = config.get('document_management.validation_rules', {
            'max_file_size_mb': 10,
            'required_sections': [],
            'forbidden_patterns': []
        })
        
        logger.info(f"DocumentManagement agent configured for path: {self.docs_path}")
    
    def _setup_event_subscriptions(self):
        """Setup event subscriptions"""
        # Listen for file changes to process documents
        event_bus.subscribe(EventType.FILE_CHANGE, self._handle_file_change)
        
        # Listen for document processing requests
        event_bus.subscribe(EventType.DOCUMENT_PROCESSING, self._handle_document_request)
    
    async def initialize(self):
        """Initialize the document management agent"""
        try:
            # Ensure directories exist
            self.docs_path.mkdir(parents=True, exist_ok=True)
            self.backup_path.mkdir(parents=True, exist_ok=True)
            
            # Initial document scan
            await self._scan_existing_documents()
            
            logger.info("DocumentManagement initialized")
            
        except Exception as e:
            logger.error(f"Failed to initialize DocumentManagement: {e}")
            raise
    
    async def process(self):
        """Main processing loop"""
        try:
            # Process queued documents
            if not self.processing_queue.empty():
                try:
                    document_task = await asyncio.wait_for(
                        self.processing_queue.get(),
                        timeout=1.0
                    )
                    await self._process_document_task(document_task)
                except asyncio.TimeoutError:
                    pass
            
            # Periodic maintenance
            await asyncio.sleep(5)
            
        except Exception as e:
            logger.error(f"Error in DocumentManagement processing: {e}")
            raise
    
    async def cleanup(self):
        """Cleanup resources"""
        logger.info("DocumentManagement cleanup complete")
    
    async def _scan_existing_documents(self):
        """Scan existing documents and validate them"""
        try:
            document_count = 0
            
            for doc_file in self.docs_path.rglob("*"):
                if doc_file.is_file() and doc_file.suffix in self.supported_formats:
                    # Queue for validation
                    await self.processing_queue.put({
                        'action': 'validate',
                        'file_path': doc_file,
                        'timestamp': datetime.now()
                    })
                    document_count += 1
            
            logger.info(f"Queued {document_count} documents for validation")
            
        except Exception as e:
            logger.error(f"Failed to scan existing documents: {e}")
    
    async def _process_document_task(self, task: Dict[str, Any]):
        """Process a document task"""
        try:
            action = task.get('action')
            file_path = Path(task.get('file_path'))
            
            logger.debug(f"Processing document task: {action} for {file_path}")
            
            if action == 'validate':
                await self._validate_document(file_path)
            elif action == 'backup':
                await self._backup_document(file_path)
            elif action == 'process':
                await self._process_document(file_path)
            elif action == 'organize':
                await self._organize_document(file_path)
            else:
                logger.warning(f"Unknown document task action: {action}")
            
        except Exception as e:
            logger.error(f"Failed to process document task: {e}")
    
    async def _validate_document(self, file_path: Path) -> Dict[str, Any]:
        """Validate a document against rules"""
        try:
            validation_result = {
                'file_path': str(file_path),
                'valid': True,
                'issues': [],
                'warnings': [],
                'metadata': {}
            }
            
            # Check if file exists
            if not file_path.exists():
                validation_result['valid'] = False
                validation_result['issues'].append('File does not exist')
                return validation_result
            
            # Check file size
            file_size_mb = file_path.stat().st_size / (1024 * 1024)
            max_size = self.validation_rules.get('max_file_size_mb', 10)
            
            if file_size_mb > max_size:
                validation_result['valid'] = False
                validation_result['issues'].append(f'File size {file_size_mb:.1f}MB exceeds limit {max_size}MB')
            
            # Read and validate content
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    validation_result['metadata']['size'] = len(content)
                    validation_result['metadata']['lines'] = len(content.splitlines())
                    
                    # Check for required sections (for markdown)
                    if file_path.suffix == '.md':
                        await self._validate_markdown_document(content, validation_result)
                    
            except UnicodeDecodeError:
                validation_result['valid'] = False
                validation_result['issues'].append('File encoding is not UTF-8')
            except Exception as e:
                validation_result['warnings'].append(f'Content validation error: {e}')
            
            # Log validation result
            if not validation_result['valid']:
                logger.warning(f"Document validation failed for {file_path}: {validation_result['issues']}")
            elif validation_result['warnings']:
                logger.warning(f"Document validation warnings for {file_path}: {validation_result['warnings']}")
            
            return validation_result
            
        except Exception as e:
            logger.error(f"Failed to validate document {file_path}: {e}")
            return {
                'file_path': str(file_path),
                'valid': False,
                'issues': [f'Validation error: {e}']
            }
    
    async def _validate_markdown_document(self, content: str, validation_result: Dict[str, Any]):
        """Validate markdown-specific content"""
        try:
            lines = content.splitlines()
            
            # Check for title (first H1)
            has_title = False
            for line in lines[:10]:  # Check first 10 lines
                if line.startswith('# '):
                    has_title = True
                    break
            
            if not has_title:
                validation_result['warnings'].append('No title (H1) found in first 10 lines')
            
            # Check for empty content
            non_empty_lines = [line for line in lines if line.strip()]
            if len(non_empty_lines) < 5:
                validation_result['warnings'].append('Document appears to have minimal content')
            
            # Check for broken links (basic check)
            import re
            link_pattern = re.compile(r'\[([^\]]+)\]\(([^)]+)\)')
            links = link_pattern.findall(content)
            
            validation_result['metadata']['links_count'] = len(links)
            
        except Exception as e:
            validation_result['warnings'].append(f'Markdown validation error: {e}')
    
    async def _backup_document(self, file_path: Path):
        """Create a backup of a document"""
        try:
            if not file_path.exists():
                logger.warning(f"Cannot backup non-existent file: {file_path}")
                return
            
            # Create backup filename with timestamp
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_name = f"{file_path.stem}_{timestamp}{file_path.suffix}"
            backup_file = self.backup_path / backup_name
            
            # Ensure backup directory exists
            backup_file.parent.mkdir(parents=True, exist_ok=True)
            
            # Copy file to backup location
            shutil.copy2(file_path, backup_file)
            
            logger.info(f"Created backup: {backup_file}")
            
        except Exception as e:
            logger.error(f"Failed to backup document {file_path}: {e}")
    
    async def _process_document(self, file_path: Path):
        """Process a document (extract metadata, format, etc.)"""
        try:
            # Validate first
            validation_result = await self._validate_document(file_path)
            
            if not validation_result['valid']:
                logger.warning(f"Skipping processing of invalid document: {file_path}")
                return
            
            # Extract document metadata
            metadata = await self._extract_document_metadata(file_path)
            
            # Publish document processed event
            event_bus.publish(
                EventType.DOCUMENT_PROCESSING,
                self.name,
                {
                    'action': 'processed',
                    'file_path': str(file_path),
                    'metadata': metadata,
                    'validation': validation_result,
                    'timestamp': datetime.now().isoformat()
                }
            )
            
            logger.info(f"Processed document: {file_path}")
            
        except Exception as e:
            logger.error(f"Failed to process document {file_path}: {e}")
    
    async def _extract_document_metadata(self, file_path: Path) -> Dict[str, Any]:
        """Extract metadata from a document"""
        try:
            metadata = {
                'file_path': str(file_path),
                'name': file_path.name,
                'extension': file_path.suffix,
                'size': file_path.stat().st_size,
                'modified': datetime.fromtimestamp(file_path.stat().st_mtime).isoformat(),
                'created': datetime.fromtimestamp(file_path.stat().st_ctime).isoformat()
            }
            
            # Extract content-based metadata
            if file_path.suffix == '.md':
                metadata.update(await self._extract_markdown_metadata(file_path))
            
            return metadata
            
        except Exception as e:
            logger.error(f"Failed to extract metadata from {file_path}: {e}")
            return {'error': str(e)}
    
    async def _extract_markdown_metadata(self, file_path: Path) -> Dict[str, Any]:
        """Extract metadata from markdown files"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            lines = content.splitlines()
            metadata = {
                'line_count': len(lines),
                'character_count': len(content),
                'word_count': len(content.split())
            }
            
            # Extract title
            for line in lines[:10]:
                if line.startswith('# '):
                    metadata['title'] = line[2:].strip()
                    break
            
            # Count headers
            headers = []
            for line in lines:
                if line.startswith('#'):
                    level = len(line.split()[0])
                    headers.append({'level': level, 'text': line[level:].strip()})
            
            metadata['headers'] = headers
            metadata['header_count'] = len(headers)
            
            return metadata
            
        except Exception as e:
            logger.error(f"Failed to extract markdown metadata: {e}")
            return {}
    
    async def _organize_document(self, file_path: Path):
        """Organize document into appropriate directory structure"""
        try:
            # This could implement logic to move documents to appropriate
            # subdirectories based on their content, metadata, etc.
            logger.debug(f"Organizing document: {file_path}")
            
            # For now, just log that organization was requested
            event_bus.publish(
                EventType.DOCUMENT_PROCESSING,
                self.name,
                {
                    'action': 'organized',
                    'file_path': str(file_path),
                    'timestamp': datetime.now().isoformat()
                }
            )
            
        except Exception as e:
            logger.error(f"Failed to organize document {file_path}: {e}")
    
    async def _handle_file_change(self, event):
        """Handle file change events"""
        try:
            changes = event.data.get('changes', [])
            
            for change in changes:
                file_path = Path(change['path'])
                
                # Only process documents in our watched path
                if not str(file_path).startswith(str(self.docs_path)):
                    continue
                
                # Only process supported formats
                if file_path.suffix not in self.supported_formats:
                    continue
                
                change_type = change['type']
                
                if change_type in ['added', 'modified']:
                    # Queue document for processing
                    await self.processing_queue.put({
                        'action': 'process',
                        'file_path': file_path,
                        'change_type': change_type,
                        'timestamp': datetime.now()
                    })
                    
                    logger.info(f"Queued document for processing: {file_path} ({change_type})")
                
                elif change_type == 'deleted':
                    logger.info(f"Document deleted: {file_path}")
                    
                    # Publish document deletion event
                    event_bus.publish(
                        EventType.DOCUMENT_PROCESSING,
                        self.name,
                        {
                            'action': 'deleted',
                            'file_path': str(file_path),
                            'timestamp': datetime.now().isoformat()
                        }
                    )
            
        except Exception as e:
            logger.error(f"Failed to handle file change event: {e}")
    
    async def _handle_document_request(self, event):
        """Handle document processing requests"""
        try:
            request_data = event.data
            action = request_data.get('action')
            file_path = request_data.get('file_path')
            
            if not action or not file_path:
                logger.warning("Invalid document processing request")
                return
            
            # Queue the requested action
            await self.processing_queue.put({
                'action': action,
                'file_path': Path(file_path),
                'timestamp': datetime.now()
            })
            
            logger.info(f"Queued document request: {action} for {file_path}")
            
        except Exception as e:
            logger.error(f"Failed to handle document request: {e}")