#!/bin/bash

# LangGraph Automation Daemon
# Runs the automated LangGraph processor in the background

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
VENV_DIR="$PROJECT_DIR/.venv"
LOG_DIR="$SCRIPT_DIR/logs"
PID_FILE="$SCRIPT_DIR/automation_daemon.pid"
LOG_FILE="$LOG_DIR/automation_daemon.log"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

start_automation() {
    echo "🤖 Starting LangGraph Automation System..."
    
    # Check if already running
    if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        echo "❌ Automation system is already running (PID: $(cat "$PID_FILE"))"
        exit 1
    fi
    
    # Activate virtual environment and start
    cd "$PROJECT_DIR"
    source "$VENV_DIR/bin/activate"
    cd "$SCRIPT_DIR"
    
    # Start in background
    nohup python3 automated_langgraph_monitor.py > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    
    echo "✅ Automation system started (PID: $(cat "$PID_FILE"))"
    echo "📄 Logs: $LOG_FILE"
    echo "🔄 Monitoring for trigger files..."
}

stop_automation() {
    echo "🛑 Stopping LangGraph Automation System..."
    
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            kill "$PID"
            echo "✅ Automation system stopped (PID: $PID)"
        else
            echo "⚠️ Process not running"
        fi
        rm -f "$PID_FILE"
    else
        echo "⚠️ PID file not found"
    fi
}

status_automation() {
    if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        PID=$(cat "$PID_FILE")
        echo "✅ Automation system is running (PID: $PID)"
        echo "📄 Log file: $LOG_FILE"
        
        # Show recent activity
        if [ -f "$LOG_FILE" ]; then
            echo "📊 Recent activity:"
            tail -5 "$LOG_FILE"
        fi
    else
        echo "❌ Automation system is not running"
        if [ -f "$PID_FILE" ]; then
            rm -f "$PID_FILE"
        fi
    fi
}

restart_automation() {
    stop_automation
    sleep 2
    start_automation
}

show_logs() {
    if [ -f "$LOG_FILE" ]; then
        echo "📄 Showing automation logs (press Ctrl+C to exit):"
        tail -f "$LOG_FILE"
    else
        echo "❌ Log file not found: $LOG_FILE"
    fi
}

case "$1" in
    start)
        start_automation
        ;;
    stop)
        stop_automation
        ;;
    status)
        status_automation
        ;;
    restart)
        restart_automation
        ;;
    logs)
        show_logs
        ;;
    *)
        echo "🤖 LangGraph Automation Daemon"
        echo ""
        echo "Usage: $0 {start|stop|status|restart|logs}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the automation system"
        echo "  stop    - Stop the automation system" 
        echo "  status  - Check system status"
        echo "  restart - Restart the automation system"
        echo "  logs    - Show live logs"
        echo ""
        exit 1
        ;;
esac

exit 0