#!/usr/bin/env node

/**
 * Fix existing documentation files with proper MongoDB ObjectIds
 * This replaces document names with valid ObjectIds in frontmatter
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DOCS_DIR = path.join(__dirname, '../public/docs');
const frontmatterRegex = /^---\s*\nid:\s*(.*)\s*\nrevision:\s*(.*)\s*\n---\s*/;

function generateObjectId() {
    // Generate a valid MongoDB ObjectId (24 character hex string)
    const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
    const randomBytes = crypto.randomBytes(5).toString('hex');
    const counter = Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
    return timestamp + randomBytes + counter;
}

function isValidObjectId(id) {
    // Check if ID is a valid 24-character hex string (MongoDB ObjectId format)
    return /^[0-9a-fA-F]{24}$/.test(id.trim());
}

function fixDocumentId(filePath, fileName) {
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Check if frontmatter exists
    const match = fileContent.match(frontmatterRegex);
    if (!match) {
        console.log(`○ No frontmatter found: ${fileName}`);
        return false;
    }

    const currentId = match[1].trim();
    const revision = match[2].trim();

    // Check if ID is already a valid ObjectId
    if (isValidObjectId(currentId)) {
        console.log(`○ Valid ObjectId already exists: ${fileName} (${currentId})`);
        return false;
    }

    // Generate new ObjectId
    const newObjectId = generateObjectId();

    // Replace the frontmatter with new ObjectId
    const newFrontmatter = `---
id: ${newObjectId}
revision: ${revision}
---
`;

    const updatedContent = fileContent.replace(frontmatterRegex, newFrontmatter);

    // Write updated content
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log(`✓ Fixed ObjectId: ${fileName} (${currentId} → ${newObjectId})`);
    return true;
}

async function main() {
    console.log('🔧 Fixing MongoDB ObjectIds in documentation frontmatter...\n');

    try {
        const files = fs.readdirSync(DOCS_DIR);
        let fixedCount = 0;
        let skippedCount = 0;

        for (const file of files) {
            if (file.endsWith('.md')) {
                const filePath = path.join(DOCS_DIR, file);

                // Skip if it's a directory or doesn't exist
                if (!fs.statSync(filePath).isFile()) {
                    continue;
                }

                const wasFixed = fixDocumentId(filePath, file);
                if (wasFixed) {
                    fixedCount++;
                } else {
                    skippedCount++;
                }
            }
        }

        console.log(`\n📊 Summary:`);
        console.log(`  ✅ Files fixed: ${fixedCount}`);
        console.log(`  ○ Files skipped (already valid): ${skippedCount}`);

        if (fixedCount > 0) {
            console.log(`\nNext steps:`);
            console.log(`  1. Run: node update-docs.cjs`);
            console.log(`  2. Run: node upload-embeddings-to-atlas.cjs`);
            console.log(`  3. Test the chat system to verify documents are accessible`);
        }

    } catch (error) {
        console.error('❌ Error fixing ObjectIds:', error.message);
        process.exit(1);
    }
}

main();