require('dotenv').config();
// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai'); // Import GoogleGenerativeAI

// Helper function for retries with exponential backoff
async function callWithRetry(apiCall, maxRetries = 5, delay = 1000, validate = (result) => result && result.response) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await apiCall();
      console.log('API Call Result:', JSON.stringify(result, null, 2)); // Log the full result for inspection
      // Use the provided validate function for validation
      if (validate(result)) {
        return result;
      } else {
        throw new Error("Invalid API response structure");
      }
    } catch (error) {
      console.error(`Attempt ${i + 1} failed: ${error.message}`);
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      } else {
        throw error; // Re-throw if max retries reached
      }
    }
  }
}

const app = express();
const PORT = process.env.PORT || 5001;

// Define trusted origins/domains. These can be configured via environment variables in a real app.
const TRUSTED_DOMAINS = [
  'localhost:8080', // Your local frontend development server
  '.vercel.app',    // Vercel deployments (wildcard for subdomains)
  // Add your custom production domain here, e.g., 'your-custom-domain.com'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if the origin matches any of the trusted domains
    const isTrusted = TRUSTED_DOMAINS.some(domain => {
      if (domain.startsWith('.')) {
        // Wildcard subdomain match for Vercel
        return origin.endsWith(domain);
      } else {
        // Exact match for localhost or custom domains
        return origin === `http://${domain}` || origin === `https://${domain}`;
      }
    });

    if (isTrusted) {
      callback(null, true);
    } else {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      callback(new Error(msg), false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(bodyParser.json()); // Parse JSON request bodies

// MongoDB Connection for Document content (test database)
const MONGODB_URI_TEST = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/test';
const testConnection = mongoose.createConnection(MONGODB_URI_TEST);
testConnection.on('connected', () => console.log('MongoDB (test DB) connected successfully'));
testConnection.on('error', err => console.error('MongoDB (test DB) connection error:', err));

// MongoDB Connection for Document chunks (docs database)
const MONGODB_URI_DOCS = process.env.MONGODB_URI_DOCS || 'mongodb://localhost:27017/docs';
const docsConnection = mongoose.createConnection(MONGODB_URI_DOCS);
docsConnection.on('connected', () => console.log('MongoDB (docs DB) connected successfully'));
docsConnection.on('error', err => console.error('MongoDB (docs DB) connection error:', err));

// Document Schema and Model for the test database
const documentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  revision: { type: Number, default: 1 },
  comments: [
    {
      ownerId: { type: String, required: true },
      ownerName: { type: String, required: true },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  lastUpdatedBy: { type: String },
});

const Document = testConnection.model('Document', documentSchema);

// Initialize Google Generative AI client
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
const chatModel = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL_ID || "gemini-2.5-pro" });
// API Routes
// GET all documents (optional, for listing)
app.get('/api/docs', async (req, res) => {
  try {
    const documents = await Document.find({});
    res.json(documents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET a single document by name
app.get('/api/docs/:docName', async (req, res) => {
  try {
    const doc = await Document.findOne({ name: req.params.docName.toUpperCase() });
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST (Create) a new document
app.post('/api/docs', async (req, res) => {
  const { name, content } = req.body;
  if (!name || !content) {
    return res.status(400).json({ message: 'Document name and content are required' });
  }
  try {
    const newDoc = new Document({ name: name.toUpperCase(), content });
    await newDoc.save();
    res.status(201).json(newDoc);
  } catch (err) {
    res.status(409).json({ message: 'Document with this name already exists' }); // 409 Conflict
  }
});

// PUT (Update) an existing document by name
app.put('/api/docs/:docName', async (req, res) => {
  const { content, lastUpdatedBy, revision } = req.body;
  if (!content) {
    return res.status(400).json({ message: 'Document content is required' });
  }
  try {
    const docName = req.params.docName.toUpperCase();
    const existingDoc = await Document.findOne({ name: docName });

    if (!existingDoc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (revision !== undefined) {
      if (revision < existingDoc.revision) {
        return res.status(409).json({ message: `Conflict: Your revision ${revision} is older than the current revision ${existingDoc.revision}.` });
      }
      if (revision > existingDoc.revision) {
        return res.status(409).json({ message: `Conflict: Your revision ${revision} is newer than the current revision ${existingDoc.revision}. Please sync your local files first.` });
      }
      if (content === existingDoc.content) {
        console.log('Content is the same, sending 304');
        return res.status(304).send(); // Not Modified
      } else {
        console.log('Content is different, updating document');
      }
    }

    existingDoc.content = content;
    existingDoc.lastUpdatedBy = lastUpdatedBy;
    existingDoc.updatedAt = Date.now();
    existingDoc.revision += 1;
    await existingDoc.save();

    res.json(existingDoc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE a document by name
app.delete('/api/docs/:docName', async (req, res) => {
  try {
    const deletedDoc = await Document.findOneAndDelete({ name: req.params.docName.toUpperCase() });
    if (!deletedDoc) {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST (Add) a new comment to a document
app.post('/api/docs/:docName/comments', async (req, res) => {
  const { ownerId, ownerName, text } = req.body;
  if (!ownerId || !ownerName || !text) {
    return res.status(400).json({ message: 'Owner ID, owner name, and comment text are required' });
  }
  try {
    const updatedDoc = await Document.findOneAndUpdate(
      { name: req.params.docName.toUpperCase() },
      { $push: { comments: { ownerId, ownerName, text, createdAt: new Date() } } },
      { new: true } // Return the updated document
    );
    if (!updatedDoc) {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.status(201).json(updatedDoc.comments[updatedDoc.comments.length - 1]); // Return the newly added comment
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// NEW: POST /api/docs/search for RAG
app.post('/api/docs/search', async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ message: 'Query is required' });
  }

  try {
    // 1. Generate embedding for the user query
    const queryEmbeddingResult = await callWithRetry(
      () => embeddingModel.embedContent([query]),
      5, // maxRetries
      1000, // delay
      (result) => result && result.embedding && result.embedding.values // Custom validation for embedding model
    );
    const queryEmbedding = queryEmbeddingResult.embedding.values;
    console.log('Query Embedding:', queryEmbedding);

    // 2. Perform Atlas Vector Search
    const collection = docsConnection.collection('document_chunks'); // Access the raw collection from docsConnection
    const searchResults = await collection.aggregate([
      {
        $vectorSearch: {
          queryVector: queryEmbedding,
          path: 'embedding',
          numCandidates: 100, // Number of documents to scan
          limit: 5, // Number of results to return
          index: 'vector_index' // Your Atlas Vector Search index name
        }
      },
      {
        $project: {
          _id: 0,
          content: 1,
          source_file: 1,
          score: { $meta: 'vectorSearchScore' }
        }
      }
    ]).toArray();

    // 3. Construct prompt for LLM
    let context = searchResults.map(result => `Document: ${result.source_file}
Content: ${result.content}`).join('\n\n');
    
    const prompt = `You are a helpful assistant for the ClientPass documentation. Answer the following question based *only* on the provided context. If the answer is not in the context, state that you don't know. Cite the document names you used (e.g., [DEMO_MODE.md]).

Question: ${query}

Context:
${context}

Answer:`;

    // 4. Get answer from LLM
    console.log('Sending prompt to LLM:', prompt);
    const chatResult = await callWithRetry(() => chatModel.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] }));
    console.log('LLM Result:', JSON.stringify(chatResult, null, 2)); // Log the full result for inspection

    // Error handling for no candidates or empty response
    if (!chatResult.response || !chatResult.response.candidates || chatResult.response.candidates.length === 0 || !chatResult.response.candidates[0].content || !chatResult.response.candidates[0].content.parts || chatResult.response.candidates[0].content.parts.length === 0) {
      console.error('Invalid LLM response structure:', chatResult);
      return res.status(500).json({ message: 'Failed to get a valid response from the language model.' });
    }

    const llmAnswer = chatResult.response.candidates[0].content.parts[0].text;
    console.log('LLM Answer:', llmAnswer);

    // 5. Return LLM's answer and sources
    const sources = searchResults.map(result => result.source_file);
    res.json({ answer: llmAnswer, sources: [...new Set(sources)] }); // Return unique sources

  } catch (err) {
    console.error('Error during RAG search:', err);
    res.status(500).json({ message: err.message });
  }
});


// Start the server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
