# Multi-Agent System Shutdown and Status Guide

## Overview

This guide provides comprehensive instructions for checking shutdown status and managing the multi-agent system lifecycle.

## Shutdown Status Checking

### Quick Manual Checks

#### 1. Process Check

Check for running orchestrator processes:

```bash
ps aux | grep orchestrator | grep -v grep
ps aux | grep "python.*agent" | grep -v grep
```

#### 2. Log Check

Monitor recent log entries:

```bash
tail -f /Users/rhfluker/Projects/clientpass-doc-site-master/automation/logs/audit/audit_20251213.json
```

#### 3. Port Check

Verify no ports are in use:

```bash
lsof -i :5500  # Check if any ports are in use
```

### Automated Status Checker

Use the comprehensive status checker script:

```bash
cd /Users/rhfluker/Projects/clientpass-doc-site-master/automation
python3 check_shutdown_status.py
```

This script provides:

- Running process detection
- Recent log analysis
- Lock file checking
- Port usage verification
- Interactive system status

## Shutdown Status Indicators

### ✅ System is Properly Shut Down When:

- No `orchestrator.py` processes appear in `ps aux`
- Recent log entries show `status: stopped` for all agents
- No Python processes running from the automation directory
- All system ports are free
- Agent status shows "stopped" for all 6 agents

### ❌ System is Still Running If:

- Python processes with `orchestrator` in the name are visible
- Logs show agents with `status: started` or `status: running`
- System ports are still occupied
- Agent health monitoring loops are active

## Force Shutdown Commands

If graceful shutdown fails, use these force commands:

```bash
# Kill orchestrator processes
pkill -f orchestrator

# Kill any automation processes
pkill -f "python.*automation"

# Kill specific process by PID
kill -9 <PID>

# Kill all Python processes (use with caution)
pkill -f python3
```

## System Startup and Shutdown Process

### Starting the System

```bash
cd /Users/rhfluker/Projects/clientpass-doc-site-master/automation
source /Users/rhfluker/Projects/clientpass-doc-site-master/.venv/bin/activate
python3 orchestrator.py
```

### Graceful Shutdown

The system responds to:

- `Ctrl+C` (SIGINT)
- `SIGTERM` signal
- Programmatic `await orchestrator.shutdown()`

### Shutdown Sequence

1. **Signal Reception**: Orchestrator receives shutdown signal
2. **Running Flag**: Sets `running = False` to break agent loops
3. **Agent Shutdown**: Stops all 6 agents with 10-second timeout per agent
4. **Resource Cleanup**: Each agent calls cleanup methods
5. **Final Logging**: Publishes shutdown events to audit log
6. **Process Exit**: Clean process termination

## Troubleshooting Shutdown Issues

### Common Issues and Solutions

#### Hanging Processes

```bash
# Check for hanging processes
ps aux | grep python | grep automation

# Force kill if needed
pkill -9 -f orchestrator
```

#### Log Analysis

```bash
# Check recent shutdown events
tail -20 /Users/rhfluker/Projects/clientpass-doc-site-master/automation/logs/audit/audit_*.json | grep -E "(stopped|shutdown)"

# Monitor real-time logs
tail -f /Users/rhfluker/Projects/clientpass-doc-site-master/automation/logs/audit/audit_*.json
```

#### Port Conflicts

```bash
# Check port usage
lsof -i :5500
netstat -an | grep LISTEN

# Free ports if needed
sudo lsof -ti:5500 | xargs kill -9
```

## Performance Metrics

### Expected Shutdown Times

- **Startup Time**: ~31 seconds (includes MongoDB Atlas connection)
- **Shutdown Time**: ~3 seconds (with all 6 agents)
- **Agent Stop Timeout**: 10 seconds per agent maximum

### System Health Indicators

- All 6 agents successfully start and stop
- Clean resource cleanup (MongoDB connections, file handles)
- No memory leaks or hanging processes
- Proper event logging throughout lifecycle

## Production Deployment

### Pre-Deployment Checklist

- [ ] All agents start successfully
- [ ] Graceful shutdown works properly
- [ ] No hanging processes after shutdown
- [ ] Log files are properly generated
- [ ] MongoDB Atlas connection is stable
- [ ] Self-healing capabilities are functional

### Monitoring in Production

- Monitor audit logs for shutdown events
- Set up process monitoring alerts
- Track system resource usage
- Verify agent health status regularly

## Integration with External Systems

### CI/CD Integration

```bash
# Test startup and shutdown in CI
cd automation
python3 -c "
import asyncio
from orchestrator import MultiAgentOrchestrator
async def test():
    o = MultiAgentOrchestrator()
    await o.start()
    await asyncio.sleep(5)
    await o.shutdown()
asyncio.run(test())
"
```

### Docker Integration

```dockerfile
# Graceful shutdown in containers
STOPSIGNAL SIGTERM
CMD ["python3", "orchestrator.py"]
```

## Security Considerations

- Shutdown status checking reveals no sensitive information
- Force shutdown commands require appropriate permissions
- Log files contain audit trails for security compliance
- Process isolation prevents interference between agents

## Related Documentation

- [System Architecture](ARCHITECTURE.md)
- [Agent Configuration](agent_configuration.md)
- [MongoDB Atlas Setup](MONGODB_ATLAS_SETUP.md)
- [Self-Healing Guide](self_healing_guide.md)
