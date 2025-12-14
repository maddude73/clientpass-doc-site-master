#!/bin/bash
# Docker Setup and Management Script for ClientPass Documentation Automation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"
ENV_TEMPLATE=".env.docker"
PROJECT_NAME="clientpass-docs"

# Helper functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Dependencies check passed"
}

setup_environment() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f "$ENV_FILE" ]; then
        if [ -f "$ENV_TEMPLATE" ]; then
            cp "$ENV_TEMPLATE" "$ENV_FILE"
            print_warning "Created $ENV_FILE from template. Please update the required values:"
            print_warning "- MONGODB_URI: Your MongoDB Atlas connection string"
            print_warning "- OPENAI_API_KEY: Your OpenAI API key"
            print_warning "- SOURCE_REPO_PATH: Path to your source repository"
            echo ""
            echo -e "${YELLOW}Required environment variables:${NC}"
            echo "MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/"
            echo "OPENAI_API_KEY=sk-your-openai-api-key-here"
            echo "SOURCE_REPO_PATH=../style-referral-ring"
            echo ""
            read -p "Press Enter after updating .env file to continue..."
        else
            print_error "Environment template file $ENV_TEMPLATE not found"
            exit 1
        fi
    else
        print_success "Environment file $ENV_FILE already exists"
    fi
    
    # Setup repositories
    print_status "Configuring repository access..."
    if [ -f "./setup-repositories.sh" ]; then
        ./setup-repositories.sh
    else
        print_warning "Repository setup script not found. Manual repository configuration may be needed."
    fi
}

validate_environment() {
    print_status "Validating environment configuration..."
    
    source "$ENV_FILE"
    
    if [ -z "$MONGODB_URI" ] || [ "$MONGODB_URI" = "mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/" ]; then
        print_error "MONGODB_URI is not configured properly in $ENV_FILE"
        exit 1
    fi
    
    if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "sk-your-openai-api-key-here" ]; then
        print_error "OPENAI_API_KEY is not configured properly in $ENV_FILE"
        exit 1
    fi
    
    print_success "Environment validation passed"
}

build_images() {
    print_status "Building Docker images..."
    
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" build --no-cache
    
    print_success "Docker images built successfully"
}

start_services() {
    local profile="${1:-}"
    local services_desc="core services (Kafka + Documentation Automation)"
    
    if [ -n "$profile" ]; then
        services_desc="$services_desc with $profile profile"
    fi
    
    print_status "Starting $services_desc..."
    
    if [ -n "$profile" ]; then
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" --profile "$profile" up -d
    else
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d kafka kafka-ui docs-automation
    fi
    
    print_success "Services started successfully"
}

stop_services() {
    print_status "Stopping services..."
    
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down
    
    print_success "Services stopped"
}

show_status() {
    print_status "Checking service status..."
    
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps
    
    echo ""
    print_status "Service URLs:"
    echo "- Kafka UI: http://localhost:8080"
    echo "- Documentation Automation: http://localhost:8000"
    echo "- Health Check: http://localhost:8000/health"
}

show_logs() {
    local service="${1:-docs-automation}"
    
    print_status "Showing logs for $service..."
    
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" logs -f "$service"
}

cleanup() {
    print_status "Cleaning up Docker resources..."
    
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down -v --remove-orphans
    docker system prune -f
    
    print_success "Cleanup completed"
}

run_tests() {
    print_status "Running system tests..."
    
    # Wait for services to be ready
    sleep 30
    
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" exec docs-automation python test_system_complete.py
    
    print_success "Tests completed"
}

show_help() {
    echo "ClientPass Documentation Automation - Docker Management"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  setup       - Setup environment and build images"
    echo "  start       - Start core services"
    echo "  start-all   - Start all services with monitoring"
    echo "  start-dev   - Start with local development services"
    echo "  stop        - Stop all services"
    echo "  restart     - Restart services"
    echo "  status      - Show service status and URLs"
    echo "  logs        - Show logs (default: docs-automation)"
    echo "  test        - Run system tests"
    echo "  cleanup     - Stop services and clean up resources"
    echo "  help        - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 setup                    # Initial setup"
    echo "  $0 start                    # Start core services"
    echo "  $0 start-all                # Start with monitoring"
    echo "  $0 logs kafka               # Show Kafka logs"
    echo "  $0 status                   # Check service status"
}

# Main script logic
case "${1:-help}" in
    "setup")
        check_dependencies
        setup_environment
        validate_environment
        build_images
        print_success "Setup completed! Run '$0 start' to launch services."
        ;;
    
    "start")
        validate_environment
        start_services
        sleep 10
        show_status
        ;;
    
    "start-all")
        validate_environment
        start_services "monitoring"
        sleep 15
        show_status
        print_status "Additional services:"
        echo "- Prometheus: http://localhost:9090"
        echo "- Grafana: http://localhost:3000 (admin/admin123)"
        ;;
    
    "start-dev")
        validate_environment
        start_services "local-dev"
        sleep 10
        show_status
        print_status "Development services:"

        ;;
    
    "stop")
        stop_services
        ;;
    
    "restart")
        stop_services
        sleep 5
        start_services
        ;;
    
    "status")
        show_status
        ;;
    
    "logs")
        show_logs "${2:-docs-automation}"
        ;;
    
    "test")
        run_tests
        ;;
    
    "cleanup")
        cleanup
        ;;
    
    "help"|*)
        show_help
        ;;
esac