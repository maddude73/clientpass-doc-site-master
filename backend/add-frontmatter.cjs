#!/usr/bin/env node

/**
 * Add frontmatter to documentation files that are missing it
 * This ensures all docs have proper id and revision fields for MongoDB sync
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DOCS_DIR = path.join(__dirname, '../public/docs');
const frontmatterRegex = /^---\s*\nid:\s*(.*)\s*\nrevision:\s*(.*)\s*\n---\s*/;

function generateObjectId() {
    // Generate a valid MongoDB ObjectId (24 character hex string)
    // Format: 4-byte timestamp + 5-byte random + 3-byte counter
    const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
    const randomBytes = crypto.randomBytes(5).toString('hex');
    const counter = Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
    return timestamp + randomBytes + counter;
}

function addFrontmatterToFile(filePath, fileName) {
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Check if frontmatter already exists
    const match = fileContent.match(frontmatterRegex);
    if (match) {
        console.log(`○ Frontmatter already exists: ${fileName}`);
        return false;
    }

    // Generate frontmatter
    const docId = generateDocId(fileName);
    const frontmatter = `---
id: ${docId}
revision: 1
---

`;

    // Add frontmatter to beginning of file
    const updatedContent = frontmatter + fileContent;

    // Write updated content
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log(`✓ Added frontmatter to: ${fileName} (id: ${docId})`);
    return true;
}

async function main() {
    console.log('🔧 Adding frontmatter to documentation files...\n');

    try {
        const files = fs.readdirSync(DOCS_DIR);
        let updatedCount = 0;
        let skippedCount = 0;

        for (const file of files) {
            if (file.endsWith('.md')) {
                const filePath = path.join(DOCS_DIR, file);

                // Skip if it's a directory or doesn't exist
                if (!fs.statSync(filePath).isFile()) {
                    continue;
                }

                const wasUpdated = addFrontmatterToFile(filePath, file);
                if (wasUpdated) {
                    updatedCount++;
                } else {
                    skippedCount++;
                }
            }
        }

        console.log(`\n📊 Summary:`);
        console.log(`  ✅ Files updated: ${updatedCount}`);
        console.log(`  ○ Files skipped (already have frontmatter): ${skippedCount}`);
        console.log(`\nNext steps:`);
        console.log(`  1. Run: node update-docs.cjs`);
        console.log(`  2. Run: node upload-embeddings-to-atlas.cjs`);
        console.log(`  3. Test the chat system to verify documents are accessible`);

    } catch (error) {
        console.error('❌ Error adding frontmatter:', error.message);
        process.exit(1);
    }
}

main();