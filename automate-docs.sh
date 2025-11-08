#!/bin/bash

# Documentation Automation Script
# This script automates the documentation update process after pulling changes from style-referral-ring
# For full workflow details, see DOCUMENTATION_UPDATE_WORKFLOW.md

set -e  # Exit on error

# Configuration
STYLE_REFERRAL_RING_PATH="/Users/rhfluker/Projects/style-referral-ring"
DOC_SITE_PATH="/Users/rhfluker/Projects/clientpass-doc-site-master"
BACKEND_PATH="$DOC_SITE_PATH/backend"

# Parse command line arguments
AI_UPDATE=false
REVIEW=true
AUTO_COMMIT=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --ai-update)
      AI_UPDATE=true
      shift
      ;;
    --no-review)
      REVIEW=false
      shift
      ;;
    --auto-commit)
      AUTO_COMMIT=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--ai-update] [--no-review] [--auto-commit]"
      exit 1
      ;;
  esac
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "================================================"
echo "ClientPass Documentation Automation Script"
echo "================================================"
if [ "$AI_UPDATE" = true ]; then
  echo -e "${BLUE}Mode: AI-Powered Update${NC}"
else
  echo "Mode: Manual Update with Detection"
fi
echo ""

# 1. Pull latest changes from the source repository
echo -e "${GREEN}Step 1: Pulling latest changes from style-referral-ring...${NC}"
cd "$STYLE_REFERRAL_RING_PATH"
git pull origin main
LAST_COMMIT=$(git log -1 --pretty=format:"%h - %s (%ar)")
echo "Latest commit: $LAST_COMMIT"
cd "$DOC_SITE_PATH"
echo ""

# 2. Identify new pages/features
echo -e "${GREEN}Step 2: Identifying new pages and components...${NC}"
SOURCE_PAGES_DIR="$STYLE_REFERRAL_RING_PATH/src/pages"
SOURCE_COMPONENTS_DIR="$STYLE_REFERRAL_RING_PATH/src/components"
DOCS_PAGES_DIR="$DOC_SITE_PATH/public/docs"

# Get the list of existing doc files (without extension)
existing_docs=$(ls "$DOCS_PAGES_DIR" | sed -e 's/\.md$//')

# Get the list of source pages (without extension)
source_pages=$(ls "$SOURCE_PAGES_DIR" | sed -e 's/\.tsx$//' | sed -e 's/Page$//')

new_pages=()
for page in $source_pages; do
    # Convert page name to uppercase to match the doc names
    uppercase_page=$(echo "$page" | tr '[:lower:]' '[:upper:]')
    if ! echo "$existing_docs" | grep -q -w "$uppercase_page"; then
        new_pages+=("$page")
    fi
done

if [ ${#new_pages[@]} -eq 0 ]; then
    echo "No new pages to document."
else
    echo "Found ${#new_pages[@]} new pages to document:"
    for page in "${new_pages[@]}"; do
        echo "  - $page"
    done
fi
echo ""

# 3. Analyze changes in source project to identify docs needing updates
echo -e "${GREEN}Step 3: Analyzing source project changes...${NC}"

# Get last sync date from a tracking file (or use 30 days ago as fallback)
SYNC_TRACKING_FILE="$DOC_SITE_PATH/.last-sync-date"
if [ -f "$SYNC_TRACKING_FILE" ]; then
    LAST_SYNC_DATE=$(cat "$SYNC_TRACKING_FILE")
    echo "Last sync: $LAST_SYNC_DATE"
else
    LAST_SYNC_DATE="30 days ago"
    echo "No previous sync found, analyzing last 30 days"
fi

cd "$STYLE_REFERRAL_RING_PATH"

# Analyze different areas of changes
docs_to_review=()

# Check for component changes
echo ""
echo "→ Checking component changes..."
COMPONENT_CHANGES=$(git diff --name-only "HEAD@{$LAST_SYNC_DATE}" HEAD -- src/components/ 2>/dev/null | wc -l)
if [ "$COMPONENT_CHANGES" -gt 0 ]; then
    echo "  Found $COMPONENT_CHANGES component file(s) changed"
    echo -e "${YELLOW}  ⚠ Review: COMPONENT_GUIDE.md, FRONTEND_OVERVIEW.md${NC}"
    docs_to_review+=("COMPONENT_GUIDE.md" "FRONTEND_OVERVIEW.md")
    
    # Show which components changed
    git diff --name-only "HEAD@{$LAST_SYNC_DATE}" HEAD -- src/components/ 2>/dev/null | sed 's/^/    - /' | head -10
fi

# Check for page changes
echo ""
echo "→ Checking page changes..."
PAGE_CHANGES=$(git diff --name-only "HEAD@{$LAST_SYNC_DATE}" HEAD -- src/pages/ 2>/dev/null | wc -l)
if [ "$PAGE_CHANGES" -gt 0 ]; then
    echo "  Found $PAGE_CHANGES page file(s) changed"
    echo -e "${YELLOW}  ⚠ Review: NAVIGATION_FLOW.md, USER_STORIES.md${NC}"
    docs_to_review+=("NAVIGATION_FLOW.md" "USER_STORIES.md")
    
    # Show which pages changed
    git diff --name-only "HEAD@{$LAST_SYNC_DATE}" HEAD -- src/pages/ 2>/dev/null | sed 's/^/    - /' | head -10
fi

# Check for database schema changes
echo ""
echo "→ Checking database schema changes..."
MIGRATIONS_DIR="$STYLE_REFERRAL_RING_PATH/supabase/migrations"
if [ -d "$MIGRATIONS_DIR" ]; then
    RECENT_MIGRATIONS=$(git diff --name-only "HEAD@{$LAST_SYNC_DATE}" HEAD -- supabase/migrations/ 2>/dev/null | wc -l)
    if [ "$RECENT_MIGRATIONS" -gt 0 ]; then
        echo "  Found $RECENT_MIGRATIONS migration file(s) changed"
        echo -e "${YELLOW}  ⚠ Review: DATABASE_SCHEMA.md, ARCHITECTURE.md${NC}"
        docs_to_review+=("DATABASE_SCHEMA.md" "ARCHITECTURE.md")
        
        # Show which migrations
        git diff --name-only "HEAD@{$LAST_SYNC_DATE}" HEAD -- supabase/migrations/ 2>/dev/null | sed 's/^/    - /'
    fi
fi

# Check for API/integration changes
echo ""
echo "→ Checking API and integration changes..."
API_CHANGES=$(git diff --name-only "HEAD@{$LAST_SYNC_DATE}" HEAD -- src/integrations/ src/api/ 2>/dev/null | wc -l)
if [ "$API_CHANGES" -gt 0 ]; then
    echo "  Found $API_CHANGES API/integration file(s) changed"
    echo -e "${YELLOW}  ⚠ Review: INTEGRATION_GUIDE.md, SYSTEM_DESIGN.md${NC}"
    docs_to_review+=("INTEGRATION_GUIDE.md" "SYSTEM_DESIGN.md")
    
    # Show which files changed
    git diff --name-only "HEAD@{$LAST_SYNC_DATE}" HEAD -- src/integrations/ src/api/ 2>/dev/null | sed 's/^/    - /' | head -10
fi

# Check for hook changes (often indicate new features)
echo ""
echo "→ Checking custom hooks..."
HOOK_CHANGES=$(git diff --name-only "HEAD@{$LAST_SYNC_DATE}" HEAD -- src/hooks/ 2>/dev/null | wc -l)
if [ "$HOOK_CHANGES" -gt 0 ]; then
    echo "  Found $HOOK_CHANGES hook file(s) changed"
    echo -e "${YELLOW}  ⚠ Review: SYSTEM_DESIGN.md, FRONTEND_OVERVIEW.md${NC}"
    docs_to_review+=("SYSTEM_DESIGN.md")
    
    # Show which hooks changed
    git diff --name-only "HEAD@{$LAST_SYNC_DATE}" HEAD -- src/hooks/ 2>/dev/null | sed 's/^/    - /'
fi

# Check package.json for new dependencies
echo ""
echo "→ Checking for new dependencies..."
PACKAGE_JSON_CHANGES=$(git diff "HEAD@{$LAST_SYNC_DATE}" HEAD -- package.json 2>/dev/null | grep '^+' | grep '"' | grep -v '^+++' | wc -l)
if [ "$PACKAGE_JSON_CHANGES" -gt 0 ]; then
    echo "  Found changes in package.json"
    echo -e "${YELLOW}  ⚠ Review: ARCHITECTURE.md, INTEGRATION_GUIDE.md${NC}"
    docs_to_review+=("ARCHITECTURE.md")
    
    # Show new packages added
    echo "  New/updated packages:"
    git diff "HEAD@{$LAST_SYNC_DATE}" HEAD -- package.json 2>/dev/null | grep '^+' | grep '"' | grep -v '^+++' | sed 's/^/    /'
fi

# Generate a summary report
echo ""
echo "================================================"
echo -e "${YELLOW}Documentation Review Summary${NC}"
echo "================================================"

if [ ${#docs_to_review[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ No significant changes detected${NC}"
else
    echo "The following documentation files may need updates:"
    echo ""
    # Remove duplicates and sort
    unique_docs=($(echo "${docs_to_review[@]}" | tr ' ' '\n' | sort -u | tr '\n' ' '))
    for doc in "${unique_docs[@]}"; do
        echo "  📝 $doc"
    done
    echo ""
    echo "Review changes since $LAST_SYNC_DATE:"
    echo "  cd $STYLE_REFERRAL_RING_PATH"
    echo "  git log --since=\"$LAST_SYNC_DATE\" --oneline"
    echo "  git diff HEAD@{$LAST_SYNC_DATE} HEAD"
fi
echo "================================================"
echo ""

cd "$DOC_SITE_PATH"

# If AI update mode is enabled, run the AI update script
if [ "$AI_UPDATE" = true ]; then
  echo ""
  echo "================================================"
  echo -e "${BLUE}🤖 Running AI-Powered Documentation Update${NC}"
  echo "================================================"
  echo ""
  
  AI_ARGS=""
  [ "$REVIEW" = false ] && AI_ARGS="$AI_ARGS --no-review"
  [ "$AUTO_COMMIT" = true ] && AI_ARGS="$AI_ARGS --auto-commit"
  
  cd "$BACKEND_PATH"
  node ai-update-docs.cjs $AI_ARGS
  
  echo ""
  echo "================================================"
  echo -e "${GREEN}✨ AI Update Complete!${NC}"
  echo "================================================"
  echo ""
  echo "AI has generated documentation updates based on source changes."
  echo "Review the changes and proceed to chunking/embedding steps."
  echo ""
  
  cd "$DOC_SITE_PATH"
fi

# 4. Create placeholder documentation for new features (if any)
if [ ${#new_pages[@]} -gt 0 ]; then
    echo -e "${GREEN}Step 4: Creating placeholder documentation...${NC}"
    for page in "${new_pages[@]}"; do
        uppercase_page=$(echo "$page" | tr '[:lower:]' '[:upper:]')
        doc_file="$DOCS_PAGES_DIR/${uppercase_page}.md"
        
        # Generate frontmatter with placeholder ID and initial revision
        cat > "$doc_file" << EOF
---
id: pending
revision: 1
---

# $page

**Last Updated**: $(date +"%B %d, %Y")

## Overview

This document describes the $page feature.

## Purpose

[To be documented]

## User Stories

[To be documented]

## Technical Implementation

[To be documented]

## Database Schema

[To be documented]

## API Endpoints

[To be documented]

## UI Components

[To be documented]

## Testing

[To be documented]
EOF
        echo "  Created: $doc_file"
    done
    echo ""
fi

# 5. Generate document chunks and embeddings
echo -e "${GREEN}Step 5: Generating document chunks and embeddings...${NC}"
cd "$BACKEND_PATH"

# Check which provider to use for embeddings
if [ ! -z "$OPENAI_API_KEY" ] || grep -q "OPENAI_API_KEY=" .env.local 2>/dev/null; then
    echo "  → Using OpenAI batch embedding (fast)..."
    node extract-and-chunk-docs-batch.cjs
    
    echo "  → Uploading to MongoDB Atlas..."
    node upload-embeddings-to-atlas.cjs
elif command -v ollama &> /dev/null; then
    echo "  → Using Ollama for embeddings (local)..."
    node extract-and-chunk-docs.cjs
    node upload-embeddings-to-atlas.cjs
else
    echo "  → Using Google AI for embeddings (slower)..."
    node extract-and-chunk-docs.cjs
fi
echo ""

# 6. Sync documents to MongoDB
echo -e "${GREEN}Step 6: Syncing documents to MongoDB...${NC}"
node update-docs.cjs
echo ""

# 7. Test embeddings
echo -e "${GREEN}Step 7: Testing embeddings...${NC}"
node test-embedding.cjs
echo ""

# 8. Git commit and push
echo -e "${GREEN}Step 8: Git operations...${NC}"
cd "$DOC_SITE_PATH"
git status

if [ ${#new_pages[@]} -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}New documentation files created. Review and commit:${NC}"
    for page in "${new_pages[@]}"; do
        uppercase_page=$(echo "$page" | tr '[:lower:]' '[:upper:]')
        echo "  - public/docs/${uppercase_page}.md"
    done
    echo ""
    echo "Run the following commands to commit:"
    echo "  git add public/docs/"
    echo "  git commit -m \"docs: Add documentation for new features\""
    echo "  git push origin main"
else
    echo ""
    echo -e "${GREEN}✓ No new pages detected. If you made manual updates, commit them:${NC}"
    echo "  git add public/docs/"
    echo "  git commit -m \"docs: Update documentation\""
    echo "  git push origin main"
fi
echo ""

echo "================================================"
echo -e "${GREEN}✨ Automation complete!${NC}"
echo "================================================"
echo ""
echo "Next steps:"
if [ "$AI_UPDATE" = true ]; then
  echo "1. ✅ AI has generated documentation updates"
  echo "2. Review the generated content in public/docs/"
  echo "3. Test the documentation site locally: npm run dev"
  if [ "$AUTO_COMMIT" = false ]; then
    echo "4. Commit and push changes to trigger Vercel deployment"
    echo "   git add public/docs/"
    echo "   git commit -m \"docs: AI-generated updates\""
    echo "   git push origin main"
  else
    echo "4. ✅ Changes already committed and ready to push"
  fi
else
  echo "1. Review identified changes and update docs manually"
  echo "2. Update CHANGELOG.md with changes"
  echo "3. Increment revision numbers in updated docs"
  echo "4. Test the documentation site locally: npm run dev"
  echo "5. Commit and push changes to trigger Vercel deployment"
fi
echo ""
echo "For detailed workflow, see: DOCUMENTATION_UPDATE_WORKFLOW.md"
echo ""
echo -e "${YELLOW}💡 Tip: Run with --ai-update flag to auto-generate doc updates using AI${NC}"
