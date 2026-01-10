# 🐳 Docker Setup Guide - ClientPass Documentation Automation

## Overview

This guide provides complete Docker containerization for the Kafka + LangGraph + MongoDB Atlas documentation automation system. The setup includes:

- **Kafka Streams** with KRaft (no Zookeeper needed)
- **Documentation Automation System** (Python container)
- **MongoDB Atlas Integration** (primary vector database)
- **Kafka UI** for monitoring and management
- **Health Checks** and monitoring endpoints
- **Optional Services**: Redis, Prometheus, Grafana

## 🚀 Quick Start

### 1. Prerequisites

```bash
# Install Docker and Docker Compose
# macOS (via Homebrew)
brew install docker docker-compose

# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io docker-compose

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker
```

### 2. Environment Setup

```bash
# Clone and navigate to project
cd /Users/rhfluker/Projects/clientpass-doc-site-master

# Copy environment template
cp .env.docker .env

# Edit environment file with your credentials
nano .env
```

**Required Environment Variables:**

```bash
# MongoDB Atlas (REQUIRED)
MONGODB_URI=mongodb+srv://devuser01:rUjj6PAnKzABPZ0b@cluster0.o6oyvqv.mongodb.net/clientpass_docs

# OpenAI API (REQUIRED)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Repository Paths (REQUIRED for monitoring)
SOURCE_REPO_PATH=../style-referral-ring
CLIENTPASS_REPO_PATH=./
DOCS_PATH=./public/docs
```

**🔧 Repository Configuration:**

The system monitors multiple repositories for changes. Ensure these paths exist:

```bash
# Verify repository access
ls -la ../style-referral-ring  # Source repository
ls -la ./public/docs          # Documentation directory
ls -la ./.git                 # Main project Git repository

# Run repository setup (automatically configures paths)
./setup-repositories.sh
```

### 3. One-Command Setup

```bash
# Setup and start everything
./docker-setup.sh setup
./docker-setup.sh start
```

## 📋 Complete Setup Instructions

### Step 1: Initial Setup

```bash
# Make setup script executable (if not already)
chmod +x docker-setup.sh

# Run initial setup
./docker-setup.sh setup
```

This will:

- ✅ Check Docker/Docker Compose installation
- ✅ Create `.env` file from template
- ✅ Validate required environment variables
- ✅ Build Docker images

### Step 2: Configure Environment

Edit `.env` file with your actual credentials:

```bash
# Required - MongoDB Atlas
MONGODB_URI=mongodb+srv://devuser01:rUjj6PAnKzABPZ0b@cluster0.o6oyvqv.mongodb.net/clientpass_docs
MONGODB_DATABASE=clientpass_docs
MONGODB_COLLECTION=document_chunks

# Required - OpenAI API
OPENAI_API_KEY=sk-your-actual-api-key-here
OPENAI_MODEL=gpt-4o

# Optional - Kafka (defaults work for Docker)
KAFKA_BOOTSTRAP_SERVERS=kafka:29092
KAFKA_CLIENT_ID=doc-automation-system
```

### Step 3: Start Services

```bash
# Start core services (Kafka + Documentation Automation)
./docker-setup.sh start

# OR start with monitoring (Prometheus + Grafana)
./docker-setup.sh start-all


./docker-setup.sh start-dev
```

## 🔧 Service Management

### Repository Validation (IMPORTANT!)

Before starting Docker services, validate your repository configuration:

```bash
# Validate repository access and configuration
python3 validate-repositories.py

# Setup repositories automatically
./setup-repositories.sh

# Check which repositories will be monitored
grep -E "(SOURCE_REPO_PATH|DOCS_PATH)" .env
```

### Core Commands

```bash
# Check service status
./docker-setup.sh status

# View logs
./docker-setup.sh logs                    # Main application logs
./docker-setup.sh logs kafka              # Kafka logs
./docker-setup.sh logs kafka-ui           # Kafka UI logs

# Stop services
./docker-setup.sh stop

# Restart services
./docker-setup.sh restart

# Run system tests
./docker-setup.sh test

# Clean up everything
./docker-setup.sh cleanup
```

### Manual Docker Commands

```bash
# Build images manually
docker-compose build --no-cache

# Start specific services
docker-compose up -d kafka kafka-ui docs-automation

# View all containers
docker-compose ps

# Follow logs
docker-compose logs -f docs-automation

# Stop everything
docker-compose down

# Remove all volumes and data
docker-compose down -v --remove-orphans
```

## 🌐 Service URLs

After starting, access these services:

| Service                  | URL                                   | Description                |
| ------------------------ | ------------------------------------- | -------------------------- |
| **Kafka UI**             | http://localhost:8080                 | Kafka management interface |
| **Documentation System** | http://localhost:8000                 | Health check endpoint      |
| **Health Check**         | http://localhost:8000/health          | Docker health check        |
| **Detailed Health**      | http://localhost:8000/health/detailed | Full system status         |
| **Metrics**              | http://localhost:8000/metrics         | Prometheus metrics         |

| **Redis** | http://localhost:6379 | Performance caching (caching profile) |
| **Prometheus** | http://localhost:9090 | Metrics collection (monitoring profile) |
| **Grafana** | http://localhost:3000 | Metrics visualization (admin/admin123) |

## 🏗️ Architecture

### Container Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Network                           │
│                                                             │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────────┐ │
│  │    Kafka    │    │  Kafka UI    │    │ Docs Automation │ │
│  │   :29092    │◄──►│    :8080     │    │     :8000      │ │
│  │             │    │              │    │                │ │
│  └─────────────┘    └──────────────┘    └────────────────┘ │
│                                                  │          │
│                                                  ▼          │
│                                      MongoDB Atlas (Primary) │
│                                      Vector Database Cloud   │
└─────────────────────────────────────────────────────────────┘
```

### Volume Mapping

```
Host                           Container
├── ./automation              → /app (source code)
├── docs-data volume          → /app/data (persistent data)
├── docs-logs volume          → /app/logs (application logs)
├── kafka-data volume         → /var/lib/kafka/data (Kafka storage)
├── ./.env                    → /app/.env (configuration)
└── Repository Mounts:
    ├── ./                    → /app/data/monitored/clientpass-doc-site
    ├── ../source-repo        → /app/data/monitored/source-repo
    └── ./public/docs         → /app/data/monitored/docs

Note: Vector storage is handled by MongoDB Atlas (external cloud)
```

## 🔍 Health Monitoring

### Health Check Endpoints

```bash
# Quick health check (for Docker)
curl http://localhost:8000/health

# Detailed system status
curl http://localhost:8000/health/detailed

# Prometheus metrics
curl http://localhost:8000/metrics

# Service information
curl http://localhost:8000/status
```

### Health Check Response

```json
{
  "status": "healthy",
  "components": {
    "mongodb": "healthy",
    "kafka": "healthy"
  },
  "timestamp": "2025-12-14T20:05:36.992456"
}
```

## 🔧 Configuration Profiles

### Default Profile (Core Services)

```bash
./docker-setup.sh start
```

- Kafka + Kafka UI
- Documentation Automation System
- **MongoDB Atlas integration** (vector database)

### Monitoring Profile

```bash
./docker-setup.sh start-all
```

- Core services +
- Prometheus (metrics collection)
- Grafana (metrics visualization)

### Caching Profile

```bash
docker-compose --profile caching up -d
```

- Core services +
- Redis (for performance caching)

## 🐛 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failed

```bash
# Check environment variable
grep MONGODB_URI .env

# Test connection manually
docker-compose exec docs-automation python3 -c "
import pymongo, os
from dotenv import load_dotenv
load_dotenv()
client = pymongo.MongoClient(os.getenv('MONGODB_URI'))
client.admin.command('ping')
print('✅ MongoDB connection successful')
"
```

#### 2. Kafka Not Starting

```bash
# Check Kafka logs
./docker-setup.sh logs kafka

# Verify Kafka is healthy
docker-compose ps kafka
```

#### 3. Health Check Failing

```bash
# Check application logs
./docker-setup.sh logs docs-automation

# Test health endpoint manually
curl -v http://localhost:8000/health
```

#### 4. Container Won't Start

```bash
# Check container logs
docker-compose logs docs-automation

# Rebuild images
./docker-setup.sh cleanup
./docker-setup.sh setup
```

### Debug Mode

```bash
# Start with debug logging
LOG_LEVEL=DEBUG ./docker-setup.sh start

# Run container in debug mode
docker-compose run --rm docs-automation bash
```

## 📊 Performance Tuning

### Production Settings

Edit `.env` for production:

```bash
# Performance
MAX_CONCURRENT_OPERATIONS=20
BATCH_SIZE=100
WORKER_THREADS=8

# Logging
LOG_LEVEL=INFO

# Memory
KAFKA_HEAP_OPTS="-Xmx2G -Xms2G"
```

### Resource Requirements

| Component       | CPU         | Memory    | Storage   |
| --------------- | ----------- | --------- | --------- |
| Kafka           | 0.5-1 CPU   | 1-2GB     | 10GB+     |
| Docs Automation | 0.5 CPU     | 512MB-1GB | 1GB       |
| Kafka UI        | 0.1 CPU     | 256MB     | Minimal   |
| **Total**       | **1-2 CPU** | **2-4GB** | **15GB+** |

## 🔒 Security

### Production Security Checklist

- [ ] Change default passwords in `.env`
- [ ] Use Docker secrets for sensitive data
- [ ] Enable TLS for Kafka (production)
- [ ] Set up proper network policies
- [ ] Regular security updates
- [ ] Monitor access logs

### Docker Secrets (Recommended)

```yaml
# docker-compose.yml addition
secrets:
  mongodb_uri:
    external: true
  openai_key:
    external: true

services:
  docs-automation:
    secrets:
      - mongodb_uri
      - openai_key
```

## 🚀 Deployment

### Local Development

```bash
./docker-setup.sh start-dev
```

### Staging Environment

```bash
APP_ENV=staging ./docker-setup.sh start-all
```

### Production Environment

```bash
APP_ENV=production ./docker-setup.sh start-all
```

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Kafka Docker Guide](https://docs.confluent.io/platform/current/installation/docker/config-reference.html)
- [MongoDB Atlas Connection Guide](https://docs.atlas.mongodb.com/connect-to-cluster/)
- [System Architecture Guide](KAFKA_LANGGRAPH_SETUP_GUIDE.md)

---

## ✅ Success Verification

After setup, you should see:

```bash
./docker-setup.sh status

# Expected output:
[SUCCESS] Services started successfully
- Kafka UI: http://localhost:8080
- Documentation Automation: http://localhost:8000
- Health Check: http://localhost:8000/health

# Test system
curl http://localhost:8000/health
# Response: {"status": "healthy", ...}
```

🎉 **Your Kafka + LangGraph + MongoDB Atlas system is now running in Docker!**
