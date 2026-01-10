#!/usr/bin/env python3
"""
Simple trigger via file touch to activate change detection
"""

import os
import time

# Simple approach - just touch a file in the docs directory to trigger change detection
docs_file = "/Users/rhfluker/Projects/clientpass-doc-site-master/public/docs/TRIGGER_TEST.md" 

print("🔧 Creating trigger file to activate change detection...")

# Create a simple file
with open(docs_file, 'w') as f:
    f.write(f"# Trigger Test\n\nCreated at: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")

print("✅ Trigger file created - MAS should detect this change and process the trigger")
print("🎯 Check MAS terminal for source processing activity!")