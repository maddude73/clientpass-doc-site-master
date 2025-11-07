#!/bin/bash

# Configuration
STYLE_REFERRAL_RING_PATH="/Users/rhfluker/Projects/style-referral-ring"
DOC_SITE_PATH="/Users/rhfluker/Projects/clientpass-doc-site-master"

# 1. Pull latest changes from the source repository
echo "Pulling latest changes from style-referral-ring..."
cd "$STYLE_REFERRAL_RING_PATH"
git pull origin main
cd "$DOC_SITE_PATH"

# 2. Identify new pages/features
echo "Identifying new pages..."
SOURCE_PAGES_DIR="$STYLE_REFERRAL_RING_PATH/src/pages"
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
    exit 0
fi

echo "Found ${#new_pages[@]} new pages to document:"
for page in "${new_pages[@]}"; do
    echo "- $page"
done

# 3. Create placeholder documentation for new features
echo "Creating placeholder documentation..."
for page in "${new_pages[@]}"; do
    uppercase_page=$(echo "$page" | tr '[:lower:]' '[:upper:]')
    doc_file="$DOCS_PAGES_DIR/${uppercase_page}.md"
    echo "# $page" > "$doc_file"
    echo "" >> "$doc_file"
    echo "This document describes the $page feature." >> "$doc_file"
done

# 4. Update the DevDocsPage.tsx file
echo "Updating DevDocsPage.tsx..."
node "$DOC_SITE_PATH/backend/update-dev-docs-page.cjs" "${new_pages[@]}"

# 5. Sync the new documents to the database
echo "Syncing new documents to the database..."
node "$DOC_SITE_PATH/backend/update-docs.cjs"

echo "Automation complete."
