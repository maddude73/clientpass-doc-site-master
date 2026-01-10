# Copilot Instructions for ClientPass Documentation System

## Project Overview

**ClientPass** is a dual-system application with a React/TypeScript frontend for documentation viewing and a Python multi-agent automation system for intelligent documentation management. The automation system monitors source code changes and auto-generates technical documentation using AI.

## Architecture

### Frontend Stack (Vite + React + TypeScript)

- **Build Tool**: Vite with React SWC plugin
- **UI Framework**: shadcn/ui components built on Radix UI
- **Routing**: React Router v6 with protected routes via AuthContext
- **Auth**: Supabase authentication and user management
- **State**: React Query (TanStack Query) for server state
- **API Integration**: Express server at `/api` proxied through Vite (port 5500)
- **Styling**: Tailwind CSS with CVA (class-variance-authority) for component variants

### Backend/Automation Stack (Python Multi-Agent System)

- **Orchestration**: Event-driven architecture via `events.py` EventBus
- **6 Specialized Agents**:
  - `ChangeDetectionAgent`: Monitors file system and Git changes (.tsx, .ts, .js, .py, .md)
  - `DocumentManagementAgent`: Generates/updates markdown documentation
  - `RAGManagementAgent`: Manages MongoDB Atlas vector embeddings (1536-dim)
  - `LoggingAuditAgent`: System health monitoring and audit trails
  - `SchedulerAgent`: Coordinates maintenance tasks and agent synchronization
  - `SelfHealingAgent`: Auto-recovery, resource monitoring, fixes 20+ issue types
- **AI Providers**: OpenAI GPT-4o, Anthropic Claude, Google Gemini (multi-LLM support)
- **Data Storage**: MongoDB Atlas with Vector Search for embeddings
- **Configuration**: Pydantic Settings with `.env` variables via `config.py`

### Key Patterns

#### Agent Communication Pattern

All agents inherit from `BaseAgent` and communicate via publish/subscribe EventBus:

```python
# Subscribing to events
event_bus.subscribe(EventType.FILE_CHANGE, self._handle_file_change)

# Publishing events
await event_bus.publish(EventType.DOCUMENT_UPDATED, {'file': 'path.md', 'status': 'success'})
```

#### Frontend Component Pattern (shadcn/ui)

Components use absolute imports via `@/` alias and follow shadcn conventions:

```tsx
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
```

#### Path Resolution

- **Frontend**: Use `@/` for all imports (maps to `./src`)
- **Backend**: Absolute paths required (e.g., `/Users/rhfluker/Projects/clientpass-doc-site-master/public/docs/`)
- **Python imports**: Relative imports within `automation/` directory

## Development Workflows

### Frontend Development

```bash
npm run dev              # Start Vite dev server on port 8080
npm run build            # Production build with code splitting
npm run preview          # Preview production build
```

### Multi-Agent System

```bash
# From automation/ directory
python3 orchestrator.py                  # Start all agents
python3 -m pytest test_*.py             # Run agent tests
python3 test_comprehensive_requirements.py  # Full SRS validation

# Environment setup
cp .env.example .env
# Required env vars: MONGODB_URI, OPENAI_API_KEY, REPO_PATH
```

### Testing Patterns

#### Comprehensive Test Suite Architecture

The system uses a structured testing approach with `test_comprehensive_requirements.py` as the master test runner:

**Test Suite Structure**:

```python
class TestSuiteRunner:
    async def run_all_tests(self):
        # 11 test categories covering all SRS requirements
        await self.test_change_detection_agent()      # REQ-001 (7 sub-tests)
        await self.test_document_management_agent()   # REQ-002 (8 sub-tests)
        await self.test_rag_management_agent()        # REQ-003 (8 sub-tests)
        await self.test_logging_audit_agent()         # REQ-004 (8 sub-tests)
        await self.test_scheduler_agent()             # REQ-005 (5 sub-tests)
        await self.test_self_healing_agent()          # REQ-006 (13 sub-tests)
        await self.test_orchestrator()                # Integration tests
        await self.test_performance_requirements()    # NFR-001 to NFR-004
        await self.test_reliability_requirements()    # NFR-005 to NFR-008
        await self.test_security_requirements()       # NFR-009 to NFR-012
        await self.test_scalability_requirements()    # NFR-013 to NFR-016
```

**Key Testing Patterns**:

1. **Temporary Directory Isolation**: Each test uses `tempfile.mkdtemp()` for clean environments
2. **Mock EventBus**: Use `patch.object(event_bus, 'publish')` to capture events
3. **Agent Lifecycle Testing**: Test `initialize()`, `process()`, `cleanup()` sequence
4. **Timing Validation**: Measure operation timing to verify performance targets (e.g., <1s for change detection)
5. **Async Testing**: All tests are `async def` using `pytest-asyncio`

**Test Execution**:

```bash
# Run full SRS validation (60+ requirements)
python3 test_comprehensive_requirements.py

# Run specific agent tests
python3 -m pytest test_self_healing.py -v
python3 -m pytest test_redis_migration.py -v

# Run with coverage
pytest --cov=agents --cov-report=html
```

**Test Report Generation**: Test runner creates `test_report.json` with:

- Pass/fail status for each requirement
- Detailed error messages
- Performance metrics
- 95%+ pass rate considered success

**Frontend Testing**:

- React components with React Query hooks
- Testing Library conventions
- Mock Supabase client for auth tests

**Integration Testing**:

- Test Redis event bus with multiple consumers
- Validate Kafka + LangGraph workflows (`test_langgraph_integration.py`)
- Cross-agent communication patterns (`test_redis_realworld.py`)

## Critical Conventions

### Security (Snyk Integration)

**Always run Snyk scans on new code** - See `.github/instructions/snyk_rules.instructions.md`:

- Run `snyk_code_scan` on generated code in supported languages
- Fix security issues using Snyk results context
- Rescan after fixes until no issues remain

### File Monitoring Filters

`ChangeDetectionAgent` only monitors: `.tsx`, `.ts`, `.js`, `.py`, `.md`
Configure via `config.json`:

```json
{
  "change_detection": {
    "watch_paths": ["public/docs/", "src/"],
    "file_extensions": [".md", ".tsx", ".ts", ".js"],
    "debounce_seconds": 5
  }
}
```

### Documentation Structure

- **Generated Docs**: `public/docs/` (markdown with YAML frontmatter)
- **Architecture Docs**: `automation/*.md` (SRS, ARCHITECTURE, PROCESS_FLOW, etc.)
- **Index**: `public/docs/DOCUMENTATION_INDEX.md` (auto-updated)

### MongoDB Atlas Vector Search

- **Collection**: `document_embeddings` in `docs` database
- **Index**: `vector_index` with 1536 dimensions
- **Embedding Model**: `text-embedding-3-small` (OpenAI)
- **Chunking**: 1000 chars with 200 overlap (configurable in `config.py`)

### Agent Lifecycle

All agents follow this pattern (inherited from `BaseAgent`):

```python
async def initialize(self) -> None  # Setup resources
async def process(self) -> None     # Main processing loop
async def cleanup(self) -> None     # Graceful shutdown
def get_health_status(self) -> Dict # Health reporting
```

### Error Handling & Recovery

- **Self-Healing Agent**: Monitors health every 30s, applies fixes within 60s
- **Fix Cooldown**: 10-minute cooldown between fix attempts (prevents thrashing)
- **Auto-restart**: Unresponsive agents restarted automatically
- **Health Baseline**: System establishes baseline in `automation/data/health/baseline.json`

## Integration Points

### Supabase Integration

- **Client**: `src/integrations/supabase/client.ts`
- **Auth Flow**: `AuthContext.tsx` wraps app, enforces protected routes
- **User Roles**: Stylist, SuiteOwner, Affiliate, Client, Admin
- **Subscriptions**: Checked via Supabase Functions

### API Server (Express)

- **File**: `api/server.cjs`
- **Port**: 5500 (proxied through Vite dev server)
- **Features**: MongoDB document queries, AI chat endpoints (OpenAI, Anthropic, Gemini)
- **Retry Logic**: `callWithRetry()` with exponential backoff (5 retries)
- **Security**: Input sanitization for MongoDB queries

### Event-Driven Processing

The system uses an in-memory EventBus for real-time agent coordination:

- **Events**: 15+ event types in `EventType` enum
- **Async Handlers**: All handlers are async for concurrent processing
- **No External Queue**: Simple in-process pub/sub (consider Redis/Kafka for distributed deployment)

## Common Tasks

### Adding a New Agent

1. Create agent class inheriting from `BaseAgent` in `automation/agents/`
2. Implement required methods: `initialize()`, `process()`, `cleanup()`
3. Subscribe to relevant events in `initialize()`
4. Register agent in `orchestrator.py` `_create_agents()`
5. Add configuration section to `config.py` Settings

### Adding Frontend Components

1. Use shadcn/ui CLI: `npx shadcn@latest add <component>`
2. Place custom components in `src/components/`
3. Use absolute imports: `import { MyComponent } from "@/components/MyComponent"`
4. Follow Radix UI patterns for accessibility

### Modifying Documentation Generation

1. Edit `DocumentManagementAgent._generate_documentation()` for AI prompts
2. Configure LLM via env vars: `OPENAI_MODEL`, `ANTHROPIC_MODEL`
3. Update `_format_markdown_content()` for output formatting
4. Trigger regeneration via `EVENT_TYPE.DOCUMENT_PROCESSING` event

### Debugging Agent Issues

1. Check logs: `automation/logs/automation.log` (configured in `config.py`)
2. Review health status: `SelfHealingAgent.health_history`
3. Inspect events: Add debug logging in EventBus handlers
4. Test individual agents: Import agent, call `initialize()`, `process()`, `cleanup()`

## Performance Targets (SRS Requirements)

- **Documentation Processing**: <15 seconds per update (NFR-001)
- **Change Detection**: <1 second processing time (REQ-001.6)
- **Vector Search**: <2 second response time (NFR-004)
- **System Uptime**: 99.9% availability target (NFR-005)
- **Concurrent Operations**: 100+ file monitoring, 20+ self-healing fixes

## Docker Deployment

### Container Architecture

The system uses Docker Compose for local development and production deployment with 3 main services:

#### Kafka Service (Message Broker)

```yaml
# KRaft mode (no Zookeeper) - Kafka 7.5.0
# Ports: 9092 (external), 29092 (internal), 9101 (JMX)
# 3 partitions, 24-hour log retention, 1GB heap
```

**Health Check**: `kafka-topics --bootstrap-server localhost:9092 --list`

#### Kafka UI (Monitoring)

```yaml
# Web UI on port 8080
# Real-time topic visualization, consumer lag monitoring
```

#### Documentation Automation Service

```yaml
# Multi-stage build from automation/Dockerfile
# Python 3.11-slim base
# Runs orchestrator.py with all 6 agents
```

### Docker Commands

```bash
# Start all services (Kafka + UI + Automation)
docker-compose up -d

# View logs
docker-compose logs -f docs-automation
docker-compose logs -f kafka

# Rebuild after code changes
docker-compose build docs-automation
docker-compose up -d docs-automation

# Stop services (preserves data)
docker-compose stop

# Remove everything (including volumes)
docker-compose down -v

# Check service health
docker-compose ps
```

### Environment Variables for Docker

Required in `.env` or `docker-compose.yml`:

```bash
MONGODB_URI=mongodb+srv://...  # MongoDB Atlas connection
OPENAI_API_KEY=sk-...          # OpenAI API key
KAFKA_BOOTSTRAP_SERVERS=kafka:29092  # Internal Kafka address
REDIS_URL=redis://localhost:6379     # Redis for event bus
REPO_PATH=/app                       # Mounted volume path
```

### Volume Mounts

- `./automation:/app` - Code hot-reload in dev mode
- `./public/docs:/app/public/docs` - Generated documentation
- `kafka-data:/var/lib/kafka/data` - Kafka persistent storage
- `./logs:/app/logs` - Application logs

### Dockerfile Multi-Stage Build

1. **Builder stage**: Install build dependencies, compile Python packages
2. **Production stage**: Minimal runtime with only necessary packages
3. **Entrypoint**: `docker-entrypoint.sh` handles initialization and graceful shutdown

### Production Deployment Notes

- Set `APP_ENV=production` for production optimizations
- Configure external MongoDB Atlas (not in Docker)
- Use managed Kafka service (AWS MSK, Confluent Cloud) for scale
- Set proper resource limits in `docker-compose.yml`:
  ```yaml
  deploy:
    resources:
      limits:
        cpus: "2"
        memory: 2G
  ```

## References

- **Architecture**: `automation/ARCHITECTURE_MULTI_AGENT_SYSTEM.md`
- **SRS**: `automation/SRS_MULTI_AGENT_SYSTEM.md`
- **Process Flow**: `automation/PROCESS_FLOW_MULTI_AGENT_SYSTEM.md`
- **Component Docs**: `public/docs/*.md`
- **shadcn/ui Docs**: https://ui.shadcn.com
- **Vite Config**: `vite.config.ts` (aliases, proxy, build optimizations)
- **Docker Compose**: `docker-compose.yml` (3-service stack with Kafka)
- **Dockerfile**: `automation/Dockerfile` (multi-stage Python build)
