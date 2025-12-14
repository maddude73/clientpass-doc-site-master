#!/usr/bin/env python3

import os
import sys
from pathlib import Path

# Add automation directory to path
automation_dir = Path(__file__).parent
sys.path.insert(0, str(automation_dir))

# Load environment and configuration
from dotenv import load_dotenv
load_dotenv(automation_dir / '.env')

from config import config

print("=== Configuration Debug ===")
print(f"MongoDB URI: {config.mongodb_uri[:50]}..." if config.mongodb_uri else "MongoDB URI: None")
print(f"Embedding Model: {config.embedding_model}")
print(f"Database: {config.mongodb_database}")
print(f"Collection: {config.document_collection}")
print(f"Vector Index: {config.vector_index_name}")

# Test direct environment access
print("\n=== Environment Variables ===")
print(f"MONGODB_URI: {os.getenv('MONGODB_URI')[:50]}..." if os.getenv('MONGODB_URI') else "MONGODB_URI: None")
print(f"EMBEDDING_MODEL: {os.getenv('EMBEDDING_MODEL', 'Not set')}")