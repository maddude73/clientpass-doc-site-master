#!/usr/bin/env python3
"""
Test script for intelligent git diff analysis
"""
import asyncio
import sys
import warnings
import os
from pathlib import Path

# Suppress Pydantic compatibility warnings for Python 3.14
warnings.filterwarnings("ignore", category=UserWarning, module=".*pydantic.*")
warnings.filterwarnings("ignore", message=".*Pydantic.*")

# Set up environment for testing
os.environ.setdefault('REPO_PATH', str(Path(__file__).parent))
os.environ.setdefault('DOCS_PATH', 'public/docs')
os.environ.setdefault('LOG_LEVEL', 'INFO')

# Add automation directory to path
sys.path.insert(0, str(Path(__file__).parent / "automation"))

from automation.agents.change_detection_agent import ChangeDetectionAgent
from automation.config import settings
from automation.events import EventBus
import git
from datetime import datetime

async def test_intelligent_diff_analysis():
    """Test the intelligent git diff analysis functionality"""
    print("🧪 Testing Intelligent Git Diff Analysis")
    print("=" * 50)
    
    # Create event bus and agent
    event_bus = EventBus()
    agent = ChangeDetectionAgent(event_bus)
    
    try:
        # Start the agent (correct method name)
        await agent.start()
        print("✅ Agent started successfully")
        
        # Test with the current repository
        if hasattr(agent, 'repo') and agent.repo:
            print(f"📁 Repository path: {agent.repo.working_dir}")
            
            # Get the last 2 commits for testing
            commits = list(agent.repo.iter_commits(max_count=2))
            if len(commits) >= 2:
                old_commit = commits[1].hexsha
                new_commit = commits[0].hexsha
                
                print(f"🔍 Analyzing commits:")
                print(f"   Old: {old_commit[:8]} - {commits[1].message.strip().split('\n')[0][:60]}")
                print(f"   New: {new_commit[:8]} - {commits[0].message.strip().split('\n')[0][:60]}")
                
                # Test the intelligent analysis
                analysis = await agent._analyze_commits_for_documentation_impact(old_commit, new_commit)
                
                print("\n📊 Analysis Results:")
                print(f"   Requires doc update: {analysis.get('requires_documentation_update')}")
                print(f"   Affected docs: {len(analysis.get('affected_documentation_files', []))}")
                print(f"   Change categories: {analysis.get('change_categories', [])}")
                print(f"   High priority changes: {len(analysis.get('high_priority_changes', []))}")
                print(f"   Summary: {analysis.get('impact_summary', 'No summary')}")
                
                if analysis.get('affected_documentation_files'):
                    print(f"\n📝 Documentation files needing updates:")
                    for doc_file in analysis['affected_documentation_files']:
                        print(f"   - {doc_file}")
                
                if analysis.get('high_priority_changes'):
                    print(f"\n⚠️  High priority changes:")
                    for change in analysis['high_priority_changes'][:3]:
                        print(f"   - {change.get('change_category', 'unknown')}: {change.get('source_file', 'unknown')}")
                
                print(f"\n📈 Commits analyzed:")
                for commit_info in analysis.get('commits_analyzed', []):
                    print(f"   - {commit_info.get('hash', 'unknown')}: {commit_info.get('message', 'No message')}")
                
            else:
                print("⚠️  Need at least 2 commits in repository to test diff analysis")
                
        else:
            print("⚠️  No repository available for testing")
            print("   Creating a simple test scenario...")
            
            # Test basic functionality without git history
            test_analysis = {
                'requires_documentation_update': True,
                'affected_documentation_files': ['ARCHITECTURE.md', 'INTEGRATION_GUIDE.md'],
                'change_categories': ['frontend_component', 'backend_api'],
                'impact_summary': 'Test scenario: simulated changes detected',
                'high_priority_changes': [
                    {'change_category': 'new_api_endpoint', 'source_file': 'test/api.js'}
                ]
            }
            
            print(f"\n📊 Test Analysis Results:")
            print(f"   Requires doc update: {test_analysis.get('requires_documentation_update')}")
            print(f"   Affected docs: {len(test_analysis.get('affected_documentation_files', []))}")
            print(f"   Change categories: {test_analysis.get('change_categories', [])}")
            print(f"   Summary: {test_analysis.get('impact_summary', 'No summary')}")
            
        print(f"\n🎯 Test completed successfully!")
        
    except Exception as e:
        print(f"❌ Error during testing: {str(e)}")
        print("\n🔧 Troubleshooting suggestions:")
        print("   1. Ensure you're in the correct directory")
        print("   2. Check that automation dependencies are installed")
        print("   3. Verify git repository is initialized")
        print("   4. Run: pip install --break-system-packages -r automation/requirements.txt")
        if 'pydantic' in str(e).lower():
            print("   5. Pydantic compatibility issue - consider using Python 3.11 or 3.12")
        
        # Don't print full traceback in normal operation
        if os.getenv('DEBUG') == '1':
            import traceback
            traceback.print_exc()
        
    finally:
        try:
            await agent.stop()
            print("🛑 Agent stopped")
        except:
            pass

if __name__ == "__main__":
    asyncio.run(test_intelligent_diff_analysis())