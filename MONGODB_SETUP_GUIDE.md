# MongoDB Atlas Setup Instructions for Kafka + LangGraph System

## Issue Identified

The system is trying to connect to MongoDB Atlas cluster: `cluster0.wqz8n.mongodb.net` which doesn't exist or is incorrectly configured.

## Quick Fix Options

### Option 1: Use Local MongoDB (Development)

```bash
# Install MongoDB locally
brew install mongodb/brew/mongodb-community
brew services start mongodb-community

# Update your .env file:
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=clientpass_docs
MONGODB_COLLECTION=document_chunks
```

### Option 2: Setup MongoDB Atlas (Production)

#### Step 1: Create Atlas Account

1. Go to https://www.mongodb.com/atlas
2. Sign up for free account
3. Create a new project: "ClientPass Documentation"

#### Step 2: Create Cluster

```bash
# In Atlas UI:
# 1. Click "Build a Database"
# 2. Choose "M0 Sandbox" (Free tier)
# 3. Select region closest to you
# 4. Name cluster: "clientpass-docs"
```

#### Step 3: Configure Database Access

```bash
# In Atlas UI:
# 1. Go to "Database Access"
# 2. Add Database User:
#    - Username: clientpass-user
#    - Password: [generate strong password]
#    - Role: Atlas Admin (for setup)
```

#### Step 4: Configure Network Access

```bash
# In Atlas UI:
# 1. Go to "Network Access"
# 2. Add IP Address:
#    - IP: 0.0.0.0/0 (Allow all - for development)
#    - Or your specific IP for security
```

#### Step 5: Get Connection String

```bash
# In Atlas UI:
# 1. Go to "Database" → "Connect"
# 2. Choose "Connect your application"
# 3. Copy connection string
# 4. Replace <password> with your user password
```

#### Step 6: Create Vector Search Index

```javascript
// In Atlas UI → Collections → Create Index → Atlas Search
{
  "name": "vector_index",
  "definition": {
    "fields": [
      {
        "type": "vector",
        "path": "embedding",
        "numDimensions": 1536,
        "similarity": "cosine"
      }
    ]
  }
}
```

### Option 3: Test Mode Configuration

Update your `.env` file to disable MongoDB for testing:

```env
# Disable MongoDB for testing
ENABLE_MONGODB=false
ENABLE_AI_GENERATION=false

# Use mock services
MONGODB_URI=mock://localhost
TEST_MODE=true

# Keep Kafka settings (these work)
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
```

## Production Environment File

Create `automation/.env` with these settings:

```env
# AI Provider (choose one)
OPENAI_API_KEY=sk-your-openai-key-here
# ANTHROPIC_API_KEY=your-anthropic-key
# GOOGLE_API_KEY=your-google-key

# MongoDB Atlas (update with your cluster)
MONGODB_URI=mongodb+srv://username:password@your-cluster.mongodb.net/
MONGODB_DATABASE=clientpass_docs
MONGODB_COLLECTION=document_chunks

# Kafka (working)
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_CLIENT_ID=doc-automation-system
KAFKA_GROUP_ID=doc-automation-group

# Source Monitoring
SOURCE_REPO_PATH=/Users/rhfluker/Projects/clientpass-doc-site-master
DOCS_OUTPUT_PATH=/Users/rhfluker/Projects/clientpass-doc-site-master/public/docs

# System Settings
LOG_LEVEL=INFO
HEALTH_CHECK_INTERVAL=300
DEBOUNCE_DELAY=5
```

## Testing Your Setup

### Test MongoDB Connection

```python
python -c "
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()
uri = os.getenv('MONGODB_URI')
print(f'Testing: {uri[:50]}...')

try:
    client = MongoClient(uri)
    db = client.admin
    server_info = db.command('ismaster')
    print('✅ MongoDB Atlas connection successful!')
    client.close()
except Exception as e:
    print(f'❌ MongoDB connection failed: {e}')
"
```

### Test Full System

```bash
# Run with test mode first
python test_kafka_system.py

# Then try production mode
cd automation
python kafka_orchestrator.py
```

## Next Steps

1. **For Development**: Use Option 1 (Local MongoDB)
2. **For Production**: Use Option 2 (MongoDB Atlas)
3. **For Testing Only**: Use Option 3 (Test Mode)

The Kafka system is working perfectly - you just need to configure the database layer!
