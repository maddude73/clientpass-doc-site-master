# Multi-Agent System (MAS) Documentation

## Overview

The Multi-Agent System (MAS) is an intelligent automation framework that manages documentation updates, monitoring, and maintenance for the ClientPass project. It consists of 5 specialized agents working together through an event-driven architecture.

## Architecture

### Core Components

1. **Event Bus System** (`events.py`)

   - Centralized pub/sub communication between agents
   - Typed events with structured data
   - Async handler support

2. **Configuration Management** (`config.py`)

   - Environment variable support
   - Dynamic JSON configuration
   - Settings validation with Pydantic

3. **Base Agent Class** (`base_agent.py`)

   - Common agent functionality
   - Lifecycle management (start, stop, cleanup)
   - Health monitoring and metrics

4. **Orchestrator** (`orchestrator.py`)
   - System coordinator and manager
   - Agent lifecycle control
   - System health monitoring

### Specialized Agents

#### 1. Change Detection Agent (`change_detection_agent.py`)

**Purpose**: Monitor file system and Git repository for changes

**Key Features**:

- File checksum monitoring
- Git commit tracking
- Configurable watch paths and file extensions
- Real-time change notifications

**Events Published**:

- `FILE_CHANGE`: When files are added, modified, or deleted
- `GIT_CHANGE`: When new Git commits are detected

**Configuration**:

```json
{
  "change_detection": {
    "watch_paths": ["public/docs/", "src/"],
    "file_extensions": [".md", ".tsx", ".ts", ".js"],
    "check_interval": 30,
    "git_check_interval": 300
  }
}
```

#### 2. Document Management Agent (`document_management_agent.py`)

**Purpose**: Process, validate, and organize documentation files

**Key Features**:

- Document validation against rules
- Metadata extraction
- Backup management
- Content analysis for markdown files

**Events Subscribed**:

- `FILE_CHANGE`: Process changed documents
- `DOCUMENT_PROCESSING`: Handle document requests

**Events Published**:

- `DOCUMENT_PROCESSING`: Document processing results

**Validation Rules**:

- File size limits
- Content validation
- Required sections check
- Encoding validation

#### 3. RAG Management Agent (`rag_management_agent.py`)

**Purpose**: Handle vector embeddings and search functionality

**Key Features**:

- ChromaDB integration
- Document chunking and indexing
- Vector similarity search
- Automatic embedding generation

**Events Subscribed**:

- `DOCUMENT_PROCESSING`: Index processed documents
- `RAG_UPDATE`: Handle search requests
- `DAILY_MAINTENANCE`: Periodic sync

**Events Published**:

- `RAG_UPDATE`: Search results and status updates

**Dependencies**:

- ChromaDB for vector storage
- Sentence transformers for embeddings (optional)

#### 4. Logging & Audit Agent (`logging_audit_agent.py`)

**Purpose**: System logging, auditing, and monitoring

**Key Features**:

- Comprehensive audit trails
- Event logging and analysis
- Error detection and alerting
- Automated report generation

**Events Subscribed**:

- All event types (for auditing)

**Events Published**:

- `ERROR`: Error notifications
- `SYSTEM_STATUS`: Analysis and reports

**Audit Records**:

```json
{
  "timestamp": "2025-12-13T10:30:00.000Z",
  "event_type": "FILE_CHANGE",
  "source": "ChangeDetection",
  "data": {...},
  "severity": "info",
  "agent_id": "uuid",
  "session_id": "uuid"
}
```

#### 5. Scheduler Agent (`scheduler_agent.py`)

**Purpose**: Manage periodic tasks and maintenance operations

**Key Features**:

- Cron-like task scheduling
- Multiple schedule types (interval, daily, weekly, cron)
- Task management (add, remove, enable, disable)
- Automatic maintenance tasks

**Default Tasks**:

- Daily maintenance (2 AM)
- Health checks (every 5 minutes)
- RAG sync checks (hourly)
- Weekly reports (Sunday 6 AM)

**Schedule Types**:

```json
{
  "interval": { "type": "interval", "interval": 300 },
  "daily": { "type": "daily", "time": "02:00:00" },
  "weekly": { "type": "weekly", "weekday": 0, "time": "06:00:00" },
  "cron": { "type": "cron", "hour": 2, "minute": 0 }
}
```

## Event Types

The system uses strongly typed events for communication:

```python
class EventType(Enum):
    FILE_CHANGE = "file_change"
    GIT_CHANGE = "git_change"
    DOCUMENT_PROCESSING = "document_processing"
    RAG_UPDATE = "rag_update"
    DAILY_MAINTENANCE = "daily_maintenance"
    HEALTH_CHECK = "health_check"
    SYSTEM_STATUS = "system_status"
    ERROR = "error"
    CHANGE_DETECTION = "change_detection"
```

## Installation & Setup

### Prerequisites

```bash
# Required Python packages
pip install loguru
pip install pydantic pydantic-settings

# Optional (for RAG functionality)
pip install chromadb
pip install sentence-transformers
```

### Configuration

1. **Environment Variables** (`.env`):

```bash
# System settings
MAS_LOG_LEVEL=INFO
MAS_SESSION_ID=auto

# Agent settings
CHANGE_DETECTION_ENABLED=true
DOCUMENT_MANAGEMENT_ENABLED=true
RAG_MANAGEMENT_ENABLED=true
LOGGING_AUDIT_ENABLED=true
SCHEDULER_ENABLED=true

# Paths
PROJECT_ROOT=/path/to/project
DOCS_PATH=public/docs
LOGS_PATH=automation/logs
```

2. **Dynamic Configuration** (`automation/config.json`):

```json
{
  "change_detection": {
    "watch_paths": ["public/docs/", "src/"],
    "file_extensions": [".md", ".tsx", ".ts", ".js"],
    "check_interval": 30
  },
  "document_management": {
    "docs_path": "public/docs/",
    "backup_path": "data/backups/",
    "validation_rules": {
      "max_file_size_mb": 10
    }
  },
  "rag": {
    "chroma_db_path": "chroma_db",
    "chunk_size": 1000,
    "chunk_overlap": 200
  },
  "logging": {
    "logs_path": "logs",
    "retention_days": 30
  },
  "scheduler": {
    "check_interval": 30
  }
}
```

## Usage

### Starting the System

```bash
cd automation
python orchestrator.py
```

### Using the CLI

```bash
# Check system status
python cli.py status

# Trigger manual change detection
python cli.py detect-changes

# Generate audit report
python cli.py audit-report --type daily

# RAG search
python cli.py search "vector embeddings"
```

### Programmatic Usage

```python
from automation.orchestrator import MultiAgentOrchestrator
from automation.events import event_bus, EventType

# Create and start system
orchestrator = MultiAgentOrchestrator()
await orchestrator.start()

# Publish events
event_bus.publish(
    EventType.CHANGE_DETECTION,
    'manual',
    {'action': 'force_scan'}
)

# Subscribe to events
def handle_file_change(event):
    print(f"File changed: {event.data}")

event_bus.subscribe(EventType.FILE_CHANGE, handle_file_change)
```

## Integration with Documentation Workflow

The MAS integrates with the existing documentation workflow:

1. **Change Detection**: Monitors `public/docs/` and source files
2. **Document Processing**: Validates and processes documentation
3. **RAG Updates**: Automatically updates vector embeddings
4. **Audit Trail**: Tracks all documentation changes
5. **Scheduled Maintenance**: Performs regular system maintenance

### Integration Points

- **Git Hooks**: Trigger change detection on commits
- **CI/CD Pipeline**: Run validation before deployment
- **Documentation Site**: Provide real-time search via RAG
- **Monitoring**: System health and performance metrics

## Monitoring & Observability

### Logs

- **System Logs**: `automation/logs/automation.log`
- **Audit Logs**: `automation/logs/audit/audit_YYYYMMDD.json`
- **Agent Logs**: Individual agent logging with structured data

### Health Checks

```python
# Get system status
status = orchestrator.get_system_status()

# Individual agent health
for agent in agents:
    health = await agent.health_check()
```

### Metrics

- Events processed per agent
- Error rates and counts
- Processing times
- System uptime
- Document index statistics

## Error Handling & Recovery

### Error Types

1. **Agent Errors**: Individual agent failures
2. **System Errors**: Orchestrator or infrastructure issues
3. **Configuration Errors**: Invalid settings or missing files
4. **Dependency Errors**: Missing packages or services

### Recovery Strategies

1. **Automatic Restart**: Agents restart on failure
2. **Graceful Degradation**: System continues with reduced functionality
3. **Error Isolation**: Agent failures don't affect others
4. **Audit Trail**: All errors logged for analysis

### Manual Recovery

```bash
# Restart individual agent
python cli.py restart-agent ChangeDetection

# Full system restart
python cli.py restart-system

# Clear error state
python cli.py clear-errors
```

## Deployment

### Development

```bash
cd automation
python orchestrator.py
```

### Production

```bash
# Using systemd service
sudo systemctl start clientpass-mas
sudo systemctl enable clientpass-mas

# Using Docker
docker build -t clientpass-mas .
docker run -d --name mas clientpass-mas

# Using PM2
pm2 start orchestrator.py --name clientpass-mas
```

### Environment-Specific Configuration

- **Development**: Full logging, debug mode
- **Staging**: Production-like with verbose logging
- **Production**: Optimized performance, error alerting

## Future Enhancements

1. **Machine Learning**: Predictive maintenance and optimization
2. **Distributed Deployment**: Multi-server agent distribution
3. **Advanced Scheduling**: More complex cron expressions
4. **Integration APIs**: REST/GraphQL APIs for external systems
5. **Real-time Dashboard**: Web-based monitoring interface
6. **Advanced Analytics**: ML-powered insights and recommendations

## Troubleshooting

### Common Issues

1. **Agent Won't Start**: Check dependencies and configuration
2. **High Memory Usage**: Adjust chunk sizes and batch processing
3. **Slow Performance**: Review task scheduling and intervals
4. **Missing Events**: Verify event bus subscriptions

### Debug Mode

```bash
# Enable debug logging
export MAS_LOG_LEVEL=DEBUG
python orchestrator.py

# Check specific agent
python cli.py debug ChangeDetection
```

### Support

- **Logs**: Check `automation/logs/` for detailed information
- **Configuration**: Verify settings in `.env` and `config.json`
- **Dependencies**: Ensure all required packages are installed
- **Documentation**: Refer to individual agent documentation

---

**Last Updated**: December 13, 2025  
**Version**: 1.0.0  
**Maintained By**: ClientPass Development Team
