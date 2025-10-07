const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') }); // Load .env from backend directory
const matter = require('gray-matter');
const MarkdownIt = require('markdown-it');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Configuration
const DOCS_DIR = path.join(__dirname, '../public/docs');
const OUTPUT_FILE = path.join(__dirname, 'docs-chunks-batch.json'); // Output file for chunks
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY; // Google AI Studio API Key

const CHUNK_SIZE = 500; // characters
// const CHUNK_OVERLAP = 100; // characters (removed)
const BATCH_SIZE = 10; // Number of chunks to send in each batch embedding request

const md = new MarkdownIt();
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

async function getEmbeddingsBatch(texts) {
  if (!GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY environment variable is not set.');
  }
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const requests = texts.map(text => ({ content: { parts: [{ text }] } }));
  const result = await model.batchEmbedContents({ requests });
  return result.embeddings.map(e => e.values);
}

async function extractAndChunkDocsBatch() {
  const allChunks = [];
  const allPlainTexts = []; // To store plain texts for batch embedding

  try {
    const files = await fs.readdir(DOCS_DIR);
    const markdownFiles = files.filter(file => path.extname(file) === '.md');

    for (const file of markdownFiles) {
      const filePath = path.join(DOCS_DIR, file);
      const fileContent = await fs.readFile(filePath, 'utf8');

      const { content, data: frontmatter } = matter(fileContent);
      const docId = frontmatter.id || path.basename(file, '.md'); // Use ID from frontmatter or filename

      // Convert markdown to plain text (strip HTML tags and replace newlines with spaces)
      const plainText = md.render(content).replace(/<[^>]*>/g, '').replace(/\n/g, ' ');
      
      // Simple fixed-size chunking logic
      let currentPosition = 0;
      while (currentPosition < plainText.length) {
        let chunk = plainText.substring(currentPosition, currentPosition + CHUNK_SIZE);
        
        allChunks.push({
          doc_id: docId,
          content: chunk.trim(),
          start_char: currentPosition,
          end_char: currentPosition + chunk.length,
          source_file: file,
          frontmatter: frontmatter, // Include frontmatter for potential metadata
          embedding: null // Placeholder for embedding
        });
        allPlainTexts.push(chunk.trim());

        currentPosition += CHUNK_SIZE; // Move to the next chunk
      }
    }

    // Generate embeddings in batches
    console.log(`Generating embeddings for ${allPlainTexts.length} chunks in batches...`);
    for (let i = 0; i < allPlainTexts.length; i += BATCH_SIZE) {
      const batchTexts = allPlainTexts.slice(i, i + BATCH_SIZE);
      const batchEmbeddings = await getEmbeddingsBatch(batchTexts);

      for (let j = 0; j < batchEmbeddings.length; j++) {
        allChunks[i + j].embedding = batchEmbeddings[j];
      }
      console.log(`Processed batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allPlainTexts.length / BATCH_SIZE)}`);
    }


    await fs.writeFile(OUTPUT_FILE, JSON.stringify(allChunks, null, 2), 'utf8');
    console.log(`Successfully extracted, chunked, and embedded ${allChunks.length} chunks to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Error during extraction, chunking, and embedding:', error);
  }
}

extractAndChunkDocsBatch();