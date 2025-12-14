#!/usr/bin/env node

/**
 * Remove test and automation files that don't belong in main documentation
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '../public/docs');

// Test and automation files to remove
const TEST_FILES_TO_DELETE = [
    'AUTOMATION_TRIGGER_2.md',
    'COMPLETE_AUTOMATION_TEST.md',
    'ENHANCED_LOGGING_TEST.md',
    'ENHANCED_MONITORING_TEST.md',
    'FINAL_AUTOMATION_TEST.md',
    'OBSERVABILITY_TEST.md',
    'TEST_AGENT_TRIGGER.md',
    'TEST_TRIGGER_2.md',
    'TRIGGER_TEST.md'
];

// Generic placeholder files that can be removed (they have minimal content)
const PLACEHOLDER_FILES = [
    'AUTH.md',           // Generic auth placeholder
    'DASHBOARD.md',      // Generic dashboard placeholder  
    'DASHBOARDS.md',     // Dashboard overview placeholder
    'INDEX.md',          // Main landing page placeholder
    'JOIN.md',           // Join/signup page placeholder
    'NOTFOUND.md',       // 404 error page placeholder
    'AUTOMATCH.md',      // Auto-match stub (likely superseded by AUTO_MATCH_SYSTEM.md)
    'REAL_SOURCE_CHANGES_NOV8.md'  // Temporary change tracking file
];

function removeTestFiles() {
    console.log('🧹 Removing test and placeholder files...\n');

    let deletedCount = 0;
    let errorCount = 0;

    const allFilesToDelete = [...TEST_FILES_TO_DELETE, ...PLACEHOLDER_FILES];

    for (const fileName of allFilesToDelete) {
        const filePath = path.join(DOCS_DIR, fileName);

        try {
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                const lines = content.split('\n').length;

                // Safety check - don't delete files with substantial content
                if (lines <= 25) {
                    fs.unlinkSync(filePath);
                    console.log(`✅ Deleted: ${fileName} (${lines} lines)`);
                    deletedCount++;
                } else {
                    console.log(`⚠️  Skipped ${fileName} - substantial content (${lines} lines), manual review needed`);
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

    const remainingFiles = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.md'));
    console.log(`  📁 Remaining docs: ${remainingFiles.length}`);

    console.log(`\n🎯 Documentation now cleaned up!`);
    console.log(`  • Removed duplicate stub files`);
    console.log(`  • Removed test/automation files`);
    console.log(`  • Removed placeholder files`);
    console.log(`  • Kept all files with substantial documentation content`);
}

removeTestFiles();