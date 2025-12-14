#!/usr/bin/env python3
"""
Repository Validation Script for Docker Environment
Validates that all required repositories are accessible and properly configured
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

def check_repository_access():
    """Validate repository configuration for Docker deployment"""
    
    print("🔍 Repository Access Validation")
    print("=" * 50)
    
    # Load environment
    load_dotenv()
    
    errors = []
    warnings = []
    
    # Check main project repository
    current_dir = Path.cwd()
    git_dir = current_dir / ".git"
    
    if git_dir.exists():
        print(f"✅ Main project Git repository: {current_dir}")
    else:
        errors.append(f"Main project is not a Git repository: {current_dir}")
    
    # Check source repository
    source_repo = os.getenv('SOURCE_REPO_PATH', '../style-referral-ring')
    source_path = Path(source_repo).resolve()
    
    if source_path.exists():
        source_git = source_path / ".git"
        if source_git.exists():
            print(f"✅ Source repository: {source_path}")
        else:
            warnings.append(f"Source path exists but is not a Git repository: {source_path}")
    else:
        errors.append(f"Source repository not found: {source_path}")
    
    # Check documentation directory
    docs_path = Path(os.getenv('DOCS_PATH', './public/docs'))
    if docs_path.exists():
        doc_count = len(list(docs_path.glob("*.md")))
        print(f"✅ Documentation directory: {docs_path} ({doc_count} .md files)")
    else:
        warnings.append(f"Documentation directory not found: {docs_path}")
    
    # Check Docker compose configuration
    compose_file = Path("docker-compose.yml")
    if compose_file.exists():
        compose_content = compose_file.read_text()
        if "SOURCE_REPO_PATH" in compose_content:
            print("✅ Docker Compose configured for repository mounting")
        else:
            warnings.append("Docker Compose may not be configured for repository mounting")
    else:
        errors.append("Docker Compose file not found")
    
    # Check environment file
    env_file = Path(".env")
    if env_file.exists():
        env_content = env_file.read_text()
        required_vars = ["MONGODB_URI", "OPENAI_API_KEY", "SOURCE_REPO_PATH"]
        missing_vars = []
        
        for var in required_vars:
            if f"{var}=" not in env_content:
                missing_vars.append(var)
        
        if missing_vars:
            errors.extend([f"Missing environment variable: {var}" for var in missing_vars])
        else:
            print("✅ Environment file configured with required variables")
    else:
        errors.append("Environment file (.env) not found")
    
    # Check Git configuration
    try:
        import subprocess
        git_name = subprocess.check_output(["git", "config", "user.name"], text=True).strip()
        git_email = subprocess.check_output(["git", "config", "user.email"], text=True).strip()
        print(f"✅ Git configuration: {git_name} <{git_email}>")
    except (subprocess.CalledProcessError, FileNotFoundError):
        warnings.append("Git not configured or not available")
    
    # Report results
    print("\n" + "=" * 50)
    print("📊 Validation Results:")
    
    if errors:
        print(f"\n❌ ERRORS ({len(errors)}):")
        for error in errors:
            print(f"  - {error}")
    
    if warnings:
        print(f"\n⚠️  WARNINGS ({len(warnings)}):")
        for warning in warnings:
            print(f"  - {warning}")
    
    if not errors and not warnings:
        print("\n🎉 ALL CHECKS PASSED!")
        print("Your repositories are properly configured for Docker deployment.")
        return True
    elif not errors:
        print(f"\n✅ VALIDATION PASSED with {len(warnings)} warnings")
        print("You can proceed with Docker deployment.")
        return True
    else:
        print(f"\n❌ VALIDATION FAILED with {len(errors)} errors")
        print("Please fix the errors before proceeding with Docker deployment.")
        return False

def show_docker_mounts():
    """Show how repositories will be mounted in Docker"""
    
    print("\n🐳 Docker Volume Mounts:")
    print("-" * 30)
    
    current_dir = Path.cwd()
    source_repo = os.getenv('SOURCE_REPO_PATH', '../style-referral-ring')
    docs_path = os.getenv('DOCS_PATH', './public/docs')
    
    mounts = [
        (str(current_dir), "/app/data/monitored/clientpass-doc-site", "Main Project"),
        (source_repo, "/app/data/monitored/source-repo", "Source Repository"),
        (docs_path, "/app/data/monitored/docs", "Documentation"),
    ]
    
    for host_path, container_path, description in mounts:
        resolved_path = Path(host_path).resolve()
        status = "✅" if resolved_path.exists() else "❌"
        print(f"{status} {description}:")
        print(f"   Host: {resolved_path}")
        print(f"   Container: {container_path}")
        print()

def show_next_steps():
    """Show next steps for Docker deployment"""
    
    print("🚀 Next Steps:")
    print("-" * 15)
    print("1. Fix any errors or warnings above")
    print("2. Run: ./docker-setup.sh setup")
    print("3. Run: ./docker-setup.sh start")
    print("4. Check health: curl http://localhost:8000/health")
    print("5. Monitor logs: ./docker-setup.sh logs")

if __name__ == "__main__":
    success = check_repository_access()
    show_docker_mounts()
    show_next_steps()
    
    sys.exit(0 if success else 1)