const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') }); // Load .env from backend directory
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

    for (const file of markdownFiles) {
      const filePath = path.join(DOCS_DIR, file);
      const fileContent = await fs.readFile(filePath, 'utf8');

      const { content, data: frontmatter } = matter(fileContent);
      const docId = frontmatter.id || path.basename(file, '.md'); // Use ID from frontmatter or filename

      // Convert markdown to plain text (strip HTML tags and replace newlines with spaces)
      const plainText = md.render(content).replace(/<[^>]*>/g, '').replace(/\n/g, ' '); // Strip HTML tags and replace newlines
      
      // Simple chunking logic
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

        const embedding = await getEmbedding(chunk.trim()); // Generate embedding for the chunk

        allChunks.push({
          doc_id: docId,
          content: chunk.trim(),
          start_char: currentPosition,
          end_char: currentPosition + chunk.length,
          source_file: file,
          frontmatter: frontmatter, // Include frontmatter for potential metadata
          embedding: embedding // Add the embedding
        });

        currentPosition += (chunk.length - CHUNK_OVERLAP);
        if (currentPosition < 0) currentPosition = 0; // Ensure no negative position
      }
    }

    await fs.writeFile(OUTPUT_FILE, JSON.stringify(allChunks, null, 2), 'utf8');
    console.log(`Successfully extracted, chunked, and embedded ${allChunks.length} chunks to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Error during extraction, chunking, and embedding:', error);
  }
}

extractAndChunkDocs();
