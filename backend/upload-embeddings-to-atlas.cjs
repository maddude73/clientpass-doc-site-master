const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') }); // Load .env from backend directory

// Configuration
const EMBEDDINGS_FILE = path.join(__dirname, 'docs-chunks-batch.json');
const MONGODB_URI = process.env.MONGODB_URI; // MongoDB connection string from .env
const DB_NAME = 'docs'; // Your MongoDB database name
const COLLECTION_NAME = 'document_chunks'; // Collection to store chunks and embeddings

async function uploadEmbeddingsToAtlas() {
  if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI environment variable is not set in .env file.');
    process.exit(1);
  }

  let client;
  try {
    const chunks = JSON.parse(await fs.readFile(EMBEDDINGS_FILE, 'utf8'));
    console.log(`Loaded ${chunks.length} chunks from ${EMBEDDINGS_FILE}`);

    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const database = client.db(DB_NAME);
    const collection = database.collection(COLLECTION_NAME);

    // Clear existing data in the collection (optional, for fresh uploads)
    console.log(`Clearing existing data in ${COLLECTION_NAME} collection...`);
    await collection.deleteMany({});
    console.log('Existing data cleared.');

    // Insert new chunks
    console.log(`Inserting ${chunks.length} new chunks into ${COLLECTION_NAME} collection...`);
    const result = await collection.insertMany(chunks);
    console.log(`Successfully inserted ${result.insertedCount} documents.`);

    console.log('Upload to MongoDB Atlas complete.');
  } catch (error) {
    console.error('Error during upload to MongoDB Atlas:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

uploadEmbeddingsToAtlas();
