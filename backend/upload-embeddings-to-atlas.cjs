const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') }); // Load .env.local from backend directory

// Configuration
const EMBEDDINGS_FILE = path.join(__dirname, 'docs-chunks-batch.json');
const MONGODB_URI = process.env.MONGODB_URI; // MongoDB connection string from .env.local
const DB_NAME = 'docs'; // Your MongoDB database name
const COLLECTION_NAME = 'document_chunks'; // Collection to store chunks and embeddings

async function uploadEmbeddingsToAtlas() {
  if (!MONGODB_URI) {
    console.error('❌ Error: MONGODB_URI environment variable is not set in .env.local file.');
    process.exit(1);
  }

  let client;
  try {
    console.log('📂 Loading embeddings file...');
    const chunks = JSON.parse(await fs.readFile(EMBEDDINGS_FILE, 'utf8'));
    console.log(`✓ Loaded ${chunks.length} chunks from ${EMBEDDINGS_FILE}`);

    console.log('\n🔌 Connecting to MongoDB Atlas...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✓ Connected to MongoDB Atlas');

    const database = client.db(DB_NAME);
    const collection = database.collection(COLLECTION_NAME);

    // Clear existing data in the collection (optional, for fresh uploads)
    console.log(`\n🗑️  Clearing existing data in ${COLLECTION_NAME} collection...`);
    const deleteResult = await collection.deleteMany({});
    console.log(`✓ Cleared ${deleteResult.deletedCount} existing documents`);

    // Insert new chunks with progress
    console.log(`\n📤 Uploading ${chunks.length} chunks to ${COLLECTION_NAME} collection...`);

    // Batch insert for better performance with progress
    const BATCH_SIZE = 100;
    let uploadedCount = 0;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, Math.min(i + BATCH_SIZE, chunks.length));
      await collection.insertMany(batch);
      uploadedCount += batch.length;
      process.stdout.write(`  → Uploaded ${uploadedCount}/${chunks.length} chunks...\r`);
    }

    console.log(`\n✅ Successfully uploaded ${uploadedCount} documents to MongoDB Atlas`);
  } catch (error) {
    console.error('\n❌ Error during upload to MongoDB Atlas:', error.message);
    throw error;
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 MongoDB connection closed');
    }
  }
}

uploadEmbeddingsToAtlas();
