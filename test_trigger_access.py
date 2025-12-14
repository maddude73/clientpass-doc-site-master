#!/usr/bin/env python3
"""
Direct test of trigger file processing
"""

import os
import json

trigger_file = "/Users/rhfluker/Projects/clientpass-doc-site-master/automation/TRIGGER_SOURCE_PROCESSING"

print(f"🔍 Checking trigger file: {trigger_file}")
print(f"📍 File exists: {os.path.exists(trigger_file)}")

if os.path.exists(trigger_file):
    print("📄 Reading trigger file content...")
    try:
        with open(trigger_file, 'r') as f:
            content = f.read()
        print(f"✅ File content length: {len(content)} characters")
        
        data = json.loads(content)
        commits = data.get('source_commits', [])
        print(f"📦 Found {len(commits)} commits in trigger file")
        
        for i, commit in enumerate(commits[:3], 1):
            print(f"  {i}. {commit.get('commit_hash', 'unknown')[:8]} - {commit.get('message', 'No message')}")
        
    except Exception as e:
        print(f"❌ Error reading trigger file: {e}")
else:
    print("❌ Trigger file not found!")

print("\n🔍 Listing automation directory contents:")
automation_dir = "/Users/rhfluker/Projects/clientpass-doc-site-master/automation"
try:
    files = os.listdir(automation_dir)
    for f in files:
        if 'TRIGGER' in f.upper():
            print(f"  📄 {f}")
except Exception as e:
    print(f"❌ Error listing directory: {e}")