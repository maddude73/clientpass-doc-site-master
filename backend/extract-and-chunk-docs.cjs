const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') }); // Load .env.local from backend directory
const matter = require('gray-matter');
const MarkdownIt = require('markdown-it');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Configuration
const DOCS_DIR = path.join(__dirname, '../public/docs');
const OUTPUT_FILE = path.join(__dirname, 'docs-chunks.json'); // Output file for chunks
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY; // Google AI Studio API Key

const CHUNK_SIZE = 500; // characters
const CHUNK_OVERLAP = 100; // characters

const md = new MarkdownIt();
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

async function getEmbedding(text) {
  if (!GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY environment variable is not set.');
  }
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent([text]); // Corrected content format
  return result.embedding.values;
}

async function extractAndChunkDocs() {
  const allChunks = [];

  try {
    const files = await fs.readdir(DOCS_DIR);
    const markdownFiles = files.filter(file => path.extname(file) === '.md');

    console.log(`Found ${markdownFiles.length} markdown files to process`);

    for (let i = 0; i < markdownFiles.length; i++) {
      const file = markdownFiles[i];
      const filePath = path.join(DOCS_DIR, file);

      console.log(`[${i + 1}/${markdownFiles.length}] Processing ${file}...`);

      const fileContent = await fs.readFile(filePath, 'utf8');

      const { content, data: frontmatter } = matter(fileContent);
      const docId = frontmatter.id || path.basename(file, '.md'); // Use ID from frontmatter or filename

      // Convert markdown to plain text (strip HTML tags and replace newlines with spaces)
      const plainText = md.render(content).replace(/<[^>]*>/g, '').replace(/\n/g, ' '); // Strip HTML tags and replace newlines

      // First pass: Create all chunks without embeddings
      const fileChunks = [];
      let currentPosition = 0;
      while (currentPosition < plainText.length) {
        let chunk = plainText.substring(currentPosition, currentPosition + CHUNK_SIZE);

        // Try to end chunk at a sentence boundary or word boundary
        const lastSentenceEnd = chunk.lastIndexOf('.');
        const lastWordEnd = chunk.lastIndexOf(' ');

        if (lastSentenceEnd > CHUNK_SIZE - CHUNK_OVERLAP) {
          chunk = chunk.substring(0, lastSentenceEnd + 1);
        } else if (lastWordEnd > CHUNK_SIZE - CHUNK_OVERLAP) {
          chunk = chunk.substring(0, lastWordEnd);
        }

        fileChunks.push({
          doc_id: docId,
          content: chunk.trim(),
          start_char: currentPosition,
          end_char: currentPosition + chunk.length,
          source_file: file,
          frontmatter: frontmatter
        });

        currentPosition += (chunk.length - CHUNK_OVERLAP);
        if (currentPosition < 0) currentPosition = 0;
      }

      // Second pass: Generate embeddings in parallel batches
      console.log(`  → Generating embeddings for ${fileChunks.length} chunks...`);
      const BATCH_SIZE = 10; // Process 10 chunks in parallel

      for (let j = 0; j < fileChunks.length; j += BATCH_SIZE) {
        const batch = fileChunks.slice(j, Math.min(j + BATCH_SIZE, fileChunks.length));
        process.stdout.write(`  → Processing chunks ${j + 1}-${Math.min(j + BATCH_SIZE, fileChunks.length)}/${fileChunks.length}...\r`);

        // Generate embeddings in parallel for this batch
        const embeddings = await Promise.all(
          batch.map(chunk => getEmbedding(chunk.content))
        );

        // Add embeddings to chunks
        batch.forEach((chunk, idx) => {
          chunk.embedding = embeddings[idx];
          allChunks.push(chunk);
        });
      }

      console.log(`  ✓ Generated ${fileChunks.length} chunks for ${file}                    `);
    }

    await fs.writeFile(OUTPUT_FILE, JSON.stringify(allChunks, null, 2), 'utf8');
    console.log(`\n✅ Successfully processed ${markdownFiles.length} files into ${allChunks.length} chunks → ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('\n❌ Error during extraction, chunking, and embedding:', error);
    throw error;
  }
}

extractAndChunkDocs();
