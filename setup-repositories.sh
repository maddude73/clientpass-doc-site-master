#!/bin/bash
# Repository Setup Script for Docker Environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Repository configuration
PROJECT_ROOT="/Users/rhfluker/Projects/clientpass-doc-site-master"
SOURCE_REPO="/Users/rhfluker/Projects/style-referral-ring"

check_repositories() {
    print_status "Checking repository access..."
    
    # Check main project repository
    if [ ! -d "$PROJECT_ROOT" ]; then
        print_error "Main project repository not found at: $PROJECT_ROOT"
        return 1
    fi
    
    if [ ! -d "$PROJECT_ROOT/.git" ]; then
        print_error "Main project is not a Git repository: $PROJECT_ROOT"
        return 1
    fi
    
    print_success "Main project repository: $PROJECT_ROOT"
    
    # Check source repository
    if [ ! -d "$SOURCE_REPO" ]; then
        print_warning "Source repository not found at: $SOURCE_REPO"
        print_warning "You may need to clone it or update SOURCE_REPO_PATH in .env"
        
        # Ask user for correct path
        echo ""
        echo "Available repositories in parent directory:"
        find "$(dirname "$PROJECT_ROOT")" -maxdepth 2 -name ".git" -type d 2>/dev/null | sed 's|/.git||' | sort
        echo ""
        
        read -p "Enter the correct path to your source repository (or press Enter to skip): " user_repo_path
        
        if [ -n "$user_repo_path" ] && [ -d "$user_repo_path" ]; then
            SOURCE_REPO="$user_repo_path"
            print_success "Updated source repository: $SOURCE_REPO"
            
            # Update .env file
            if [ -f "$PROJECT_ROOT/.env" ]; then
                sed -i.bak "s|SOURCE_REPO_PATH=.*|SOURCE_REPO_PATH=$SOURCE_REPO|" "$PROJECT_ROOT/.env"
                print_success "Updated .env with new SOURCE_REPO_PATH"
            fi
        else
            print_warning "Skipping source repository - update SOURCE_REPO_PATH in .env manually"
        fi
    else
        print_success "Source repository: $SOURCE_REPO"
    fi
    
    return 0
}

setup_git_access() {
    print_status "Setting up Git access for Docker..."
    
    # Check Git configuration
    if ! git config --global user.name >/dev/null 2>&1; then
        print_warning "Git user.name not set globally"
        read -p "Enter your Git username: " git_username
        git config --global user.name "$git_username"
    fi
    
    if ! git config --global user.email >/dev/null 2>&1; then
        print_warning "Git user.email not set globally"
        read -p "Enter your Git email: " git_email
        git config --global user.email "$git_email"
    fi
    
    print_success "Git configuration:"
    echo "  User: $(git config --global user.name) <$(git config --global user.email)>"
    
    # Check SSH key
    if [ -f ~/.ssh/id_rsa ]; then
        print_success "SSH key found: ~/.ssh/id_rsa"
    elif [ -f ~/.ssh/id_ed25519 ]; then
        print_success "SSH key found: ~/.ssh/id_ed25519"
    else
        print_warning "No SSH key found. You may need to set up SSH access for Git repositories."
        print_warning "Run: ssh-keygen -t ed25519 -C 'your-email@example.com'"
    fi
}

update_env_file() {
    print_status "Updating environment file with repository paths..."
    
    local env_file="$PROJECT_ROOT/.env"
    
    if [ ! -f "$env_file" ]; then
        print_error "Environment file not found: $env_file"
        return 1
    fi
    
    # Update repository paths
    local temp_file=$(mktemp)
    
    # Add or update repository configuration
    {
        echo "# Repository Configuration (Updated by setup)"
        echo "SOURCE_REPO_PATH=$SOURCE_REPO"
        echo "CLIENTPASS_REPO_PATH=$PROJECT_ROOT" 
        echo "DOCS_PATH=$PROJECT_ROOT/public/docs"
        echo ""
        
        # Copy existing env file, skipping old repo config
        grep -v "^SOURCE_REPO_PATH=" "$env_file" | \
        grep -v "^CLIENTPASS_REPO_PATH=" | \
        grep -v "^DOCS_PATH=" | \
        grep -v "^# Repository Configuration"
        
    } > "$temp_file"
    
    mv "$temp_file" "$env_file"
    
    print_success "Environment file updated with repository paths"
}

validate_docker_mounts() {
    print_status "Validating Docker volume mounts..."
    
    local compose_file="$PROJECT_ROOT/docker-compose.yml"
    
    if [ ! -f "$compose_file" ]; then
        print_error "Docker Compose file not found: $compose_file"
        return 1
    fi
    
    # Check if source repository path exists in compose file
    if grep -q "SOURCE_REPO_PATH" "$compose_file"; then
        print_success "Docker Compose configured for repository mounting"
    else
        print_warning "Docker Compose may need repository mount configuration"
    fi
    
    # Validate that mount paths exist
    if [ -d "$SOURCE_REPO" ]; then
        print_success "Source repository accessible for Docker mount"
    else
        print_warning "Source repository path may not be accessible to Docker"
    fi
    
    if [ -d "$PROJECT_ROOT/public/docs" ]; then
        print_success "Documentation directory accessible for Docker mount"
    else
        print_warning "Documentation directory not found: $PROJECT_ROOT/public/docs"
    fi
}

show_repository_status() {
    print_status "Repository Status Summary:"
    echo ""
    echo "📁 Main Project: $PROJECT_ROOT"
    echo "   Git Status: $(cd "$PROJECT_ROOT" && git status --porcelain | wc -l) modified files"
    echo "   Last Commit: $(cd "$PROJECT_ROOT" && git log -1 --format='%h - %s (%cr)')"
    echo ""
    
    if [ -d "$SOURCE_REPO" ]; then
        echo "📁 Source Repository: $SOURCE_REPO"
        echo "   Git Status: $(cd "$SOURCE_REPO" && git status --porcelain | wc -l) modified files"
        echo "   Last Commit: $(cd "$SOURCE_REPO" && git log -1 --format='%h - %s (%cr)')"
    else
        echo "📁 Source Repository: Not configured or not accessible"
    fi
    echo ""
    
    echo "🐳 Docker Mount Points:"
    echo "   Host: $PROJECT_ROOT → Container: /app/data/monitored/clientpass-doc-site"
    echo "   Host: $SOURCE_REPO → Container: /app/data/monitored/source-repo"
    echo "   Host: $PROJECT_ROOT/public/docs → Container: /app/data/monitored/docs"
    echo ""
}

main() {
    echo "🔧 Repository Setup for Docker Environment"
    echo "==========================================="
    echo ""
    
    check_repositories || exit 1
    setup_git_access
    update_env_file || exit 1
    validate_docker_mounts
    
    echo ""
    show_repository_status
    
    echo ""
    print_success "Repository setup completed!"
    print_status "You can now run: ./docker-setup.sh start"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi