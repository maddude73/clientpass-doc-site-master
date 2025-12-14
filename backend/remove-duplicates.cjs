#!/usr/bin/env node

/**
 * Remove duplicate/stub documentation files
 * This script removes the confirmed stub files that are duplicates of underscore versions
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '../public/docs');

// Confirmed duplicate files to delete (stub versions)
const DUPLICATES_TO_DELETE = [
    'AFFILIATEAUTH.md',
    'AFFILIATEDASHBOARD.md',
    'AFFILIATEINDEX.md',
    'AFFILIATEMARKETPLACE.md',
    'BOOSTPROFILE.md',
    'CLIENTDASHBOARD.md',
    'CLIENTREFERRAL.md',
    'COVERAGEMODE.md',
    'OPENCHAIRALERTS.md',
    'OPENCHAIRLIST.md',
    'POSTOPENCHAIR.md',
    'PRODASHBOARD.md',
    'REFERRALTIMERS.md',
    'SHAREANDEARN.md',
    'STYLISTPROFILE.md',
    'STYLISTPROFILESETUP.md',
    'SUITETOOLS.md',
    'WAITINGFORRESPONSE.md'
];

function deleteStubFiles() {
    console.log('🗑️  Removing duplicate stub documentation files...\n');

    let deletedCount = 0;
    let errorCount = 0;

    for (const fileName of DUPLICATES_TO_DELETE) {
        const filePath = path.join(DOCS_DIR, fileName);

        try {
            if (fs.existsSync(filePath)) {
                // Verify it's a stub file (should be short)
                const content = fs.readFileSync(filePath, 'utf8');
                const lines = content.split('\n').length;

                if (lines <= 15) { // Stub files are typically 8-10 lines
                    fs.unlinkSync(filePath);
                    console.log(`✅ Deleted stub file: ${fileName} (${lines} lines)`);
                    deletedCount++;
                } else {
                    console.log(`⚠️  Skipped ${fileName} - too long (${lines} lines), manual review needed`);
                }
            } else {
                console.log(`○ File not found: ${fileName}`);
            }
        } catch (error) {
            console.log(`❌ Error deleting ${fileName}: ${error.message}`);
            errorCount++;
        }
    }

    console.log(`\n📊 Cleanup Summary:`);
    console.log(`  ✅ Files deleted: ${deletedCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    console.log(`  📁 Remaining docs: ${fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.md')).length}`);

    console.log(`\n🚀 Next steps:`);
    console.log(`  1. Run document sync: node update-docs.cjs`);
    console.log(`  2. Regenerate chunks: node batch-chunk-docs.cjs`);
    console.log(`  3. Update embeddings: node upload-embeddings-to-atlas.cjs`);
}

deleteStubFiles();