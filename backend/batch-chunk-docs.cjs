#!/usr/bin/env node

/**
 * Batch processing version of document chunking to avoid memory issues
 * Processes documents in small batches to prevent heap exhaustion
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '../public/docs');
const BATCH_SIZE = 10; // Process 10 documents at a time

async function chunkDocument(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath, '.md');

    // Simple chunking - split into paragraphs
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    const chunks = paragraphs.map((paragraph, index) => ({
        file_path: fileName,
        chunk_index: index,
        content: paragraph.trim(),
        char_count: paragraph.length
    }));

    return chunks;
}

async function processBatch(files, batchIndex, totalBatches) {
    console.log(`\n📦 Processing batch ${batchIndex + 1}/${totalBatches} (${files.length} files)...`);

    const allChunks = [];

    for (const file of files) {
        const filePath = path.join(DOCS_DIR, file);
        console.log(`  [${file}] Chunking...`);

        try {
            const chunks = await chunkDocument(filePath);
            allChunks.push(...chunks);
            console.log(`  [${file}] ✓ Created ${chunks.length} chunks`);
        } catch (error) {
            console.log(`  [${file}] ❌ Error: ${error.message}`);
        }

        // Force garbage collection between files
        if (global.gc) {
            global.gc();
        }
    }

    return allChunks;
}

async function main() {
    console.log('🔄 Starting batch document chunking...\n');

    try {
        // Get all markdown files
        const allFiles = fs.readdirSync(DOCS_DIR)
            .filter(f => f.endsWith('.md'))
            .filter(f => fs.statSync(path.join(DOCS_DIR, f)).isFile());

        console.log(`📄 Found ${allFiles.length} markdown files`);

        // Split into batches
        const batches = [];
        for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
            batches.push(allFiles.slice(i, i + BATCH_SIZE));
        }

        console.log(`📦 Processing in ${batches.length} batches of ${BATCH_SIZE} files each`);

        const allChunks = [];

        // Process each batch
        for (let i = 0; i < batches.length; i++) {
            const batchChunks = await processBatch(batches[i], i, batches.length);
            allChunks.push(...batchChunks);

            console.log(`  ✅ Batch ${i + 1} complete: ${batchChunks.length} chunks`);

            // Small delay to let garbage collection work
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Save chunks to file
        console.log(`\n💾 Saving ${allChunks.length} chunks to docs-chunks.json...`);
        fs.writeFileSync(
            path.join(__dirname, 'docs-chunks.json'),
            JSON.stringify(allChunks, null, 2),
            'utf8'
        );

        console.log(`✅ Batch chunking complete!`);
        console.log(`📊 Summary:`);
        console.log(`  • Files processed: ${allFiles.length}`);
        console.log(`  • Total chunks: ${allChunks.length}`);
        console.log(`  • Average chunks per file: ${Math.round(allChunks.length / allFiles.length)}`);

        console.log(`\n🚀 Next step: Run embeddings generation`);
        console.log(`   node --max-old-space-size=8192 upload-embeddings-to-atlas.cjs`);

    } catch (error) {
        console.error('❌ Batch chunking failed:', error.message);
        process.exit(1);
    }
}

// Enable manual garbage collection
if (process.argv.includes('--expose-gc')) {
    console.log('🗑️  Garbage collection enabled');
}

main();