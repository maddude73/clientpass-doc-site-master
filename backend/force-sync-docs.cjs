#!/usr/bin/env node

/**
 * Force sync documentation to MongoDB
 * This bypasses revision checks and forces the local version to MongoDB
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const DOCS_DIR = path.join(__dirname, '../public/docs');
const API_BASE_URL = process.env.API_URL || 'https://clientpass-doc-site.vercel.app/api';

const frontmatterRegex = /^---\s*\nid:\s*(.*)\s*\nrevision:\s*(.*)\s*\n---\s*/;

async function forceSyncDoc(fileName) {
    const filePath = path.join(DOCS_DIR, fileName);
    const fileContent = fs.readFileSync(filePath, 'utf8');

    const match = fileContent.match(frontmatterRegex);
    if (!match) {
        console.log(`⏭️  Skipping ${fileName} - no frontmatter`);
        return;
    }

    const id = match[1];
    const revision = parseInt(match[2]);
    const content = fileContent.replace(frontmatterRegex, '');
    const name = path.basename(fileName, '.md');

    try {
        // First, try to update with force flag
        const response = await axios.put(
            `${API_BASE_URL}/docs/${name}`,
            { content, lastUpdatedBy: 'force-sync-script', revision },
            {
                params: { force: true },
                validateStatus: () => true
            }
        );

        if (response.status === 200) {
            console.log(`✅ Force synced: ${name} (revision ${revision})`);
        } else {
            console.log(`⚠️  ${name}: ${response.data.message || response.statusText}`);
        }
    } catch (error) {
        console.error(`❌ Error syncing ${name}:`, error.message);
    }
}

async function main() {
    console.log('🔄 Force syncing documentation to MongoDB...\n');

    const files = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.md'));

    // Sync the conflicted files first
    const conflictedFiles = [
        'ARCHITECTURE.md',
        'DATABASE_SCHEMA.md',
        'HLA.md',
        'SRS.md',
        'SYSTEM_DESIGN.md',
        'USER_STORIES.md',
        'AI_OPPORTUNITIES.md'
    ];

    console.log('📝 Syncing conflicted files:\n');
    for (const file of conflictedFiles) {
        if (fs.existsSync(path.join(DOCS_DIR, file))) {
            await forceSyncDoc(file);
        }
    }

    console.log('\n✨ Force sync complete!\n');
    console.log('Run update-docs.cjs to sync remaining files normally.');
}

main();
