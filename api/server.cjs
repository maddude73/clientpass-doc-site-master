// Load environment variables from .env.local for local development
// In Vercel, environment variables are injected automatically
if (!process.env.VERCEL) {
  require('dotenv').config({ path: '.env.local' });
}

// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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

// Initialize OpenAI and Anthropic clients (make them optional to avoid startup errors)
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
}) : null;

// Dynamic configuration storage (in-memory for now, could be moved to DB)
let dynamicConfig = {
  activeProvider: 'openai',
  configs: {
    google: { systemPrompt: 'You are a helpful documentation assistant.' },
    openai: { systemPrompt: 'You are an expert technical assistant.' },
    anthropic: { systemPrompt: 'You are a knowledgeable coding assistant.' },
    ollama: { systemPrompt: 'You are a helpful AI assistant.' }
  }
};

// API Routes

// POST: Update configuration dynamically
app.post('/api/update-config', async (req, res) => {
  try {
    const { activeProvider, configs } = req.body;

    if (activeProvider) {
      dynamicConfig.activeProvider = activeProvider;
    }

    if (configs) {
      dynamicConfig.configs = {
        ...dynamicConfig.configs,
        ...configs
      };
    }

    console.log('Configuration updated:', dynamicConfig);
    res.json({ success: true, message: 'Configuration updated successfully' });
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST: Test prompt with specific provider
app.post('/api/test-prompt', async (req, res) => {
  try {
    const { provider, config, userMessage } = req.body;

    if (!provider || !config || !userMessage) {
      return res.status(400).json({ message: 'Provider, config, and userMessage are required' });
    }

    let response = '';

    switch (provider) {
      case 'google':
        // Note: Gemini support would require @google/generative-ai package
        return res.status(501).json({ message: 'Google Gemini testing not yet implemented' });

      case 'openai':
        const openaiClient = new OpenAI({ apiKey: config.apiKey });
        const openaiResponse = await openaiClient.chat.completions.create({
          model: config.model || 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: config.systemPrompt || 'You are a helpful assistant.' },
            { role: 'user', content: userMessage }
          ],
          max_tokens: 500
        });
        response = openaiResponse.choices[0].message.content;
        break;

      case 'anthropic':
        const anthropicClient = new Anthropic({ apiKey: config.apiKey });
        const anthropicResponse = await anthropicClient.messages.create({
          model: config.model || 'claude-3-5-sonnet-20241022',
          max_tokens: 500,
          system: config.systemPrompt || 'You are a helpful assistant.',
          messages: [{ role: 'user', content: userMessage }]
        });
        response = anthropicResponse.content[0].text;
        break;

      case 'ollama':
        // Basic Ollama support
        const ollamaUrl = config.url || 'http://localhost:11434';
        const ollamaResponse = await fetch(`${ollamaUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: config.model || 'llama3.2',
            prompt: `${config.systemPrompt || 'You are a helpful assistant.'}\n\nUser: ${userMessage}\n\nAssistant:`,
            stream: false
          })
        });
        const ollamaData = await ollamaResponse.json();
        response = ollamaData.response;
        break;

      default:
        return res.status(400).json({ message: 'Invalid provider' });
    }

    res.json({ success: true, response });
  } catch (error) {
    console.error('Error testing prompt:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

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

  if (!openai) {
    return res.status(503).json({ message: 'OpenAI client not configured. Please set OPENAI_API_KEY.' });
  }

  if (!anthropic) {
    return res.status(503).json({ message: 'Anthropic client not configured. Please set ANTHROPIC_API_KEY.' });
  }

  try {
    // 1. Generate embedding for the user query using OpenAI
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: query,
      dimensions: 1536, // Explicitly set dimensions
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;
    console.log('Query Embedding dimensions:', queryEmbedding.length);

    // 2. Perform Atlas Vector Search
    const collection = docsConnection.collection('document_chunks');
    const searchResults = await collection.aggregate([
      {
        $vectorSearch: {
          queryVector: queryEmbedding,
          path: 'embedding',
          numCandidates: 100,
          limit: 5,
          index: 'vector_index'
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

    console.log('Search results count:', searchResults.length);

    // 3. Construct prompt for Claude
    let context = searchResults.map(result => `Document: ${result.source_file}
Content: ${result.content}`).join('\n\n');

    // Use dynamic system prompt if available
    const systemPrompt = dynamicConfig.configs.anthropic?.systemPrompt ||
      'You are a helpful assistant for the ClientPass documentation. Answer questions based on the provided context.';

    const prompt = `${systemPrompt}

Answer the following question based *only* on the provided context. If the answer is not in the context, state that you don't know. Cite the document names you used (e.g., [DEMO_MODE.md]).

Question: ${query}

Context:
${context}

Answer:`;

    // 4. Get answer from Claude
    console.log('Sending prompt to Claude...');
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const llmAnswer = message.content[0].text;
    console.log('Claude Answer:', llmAnswer);

    // 5. Return Claude's answer and sources
    const sources = searchResults.map(result => result.source_file);
    res.json({ answer: llmAnswer, sources: [...new Set(sources)] });

  } catch (err) {
    console.error('Error during RAG search:', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/test-prompt - Test a system prompt with a provider
app.post('/api/test-prompt', async (req, res) => {
  try {
    const { provider, config, userMessage } = req.body;

    if (!provider || !userMessage) {
      return res.status(400).json({ message: 'Provider and userMessage are required' });
    }

    let response = '';

    switch (provider) {
      case 'openai':
        if (!config.apiKey) {
          return res.status(400).json({ message: 'OpenAI API key is required' });
        }
        const openaiClient = new OpenAI({ apiKey: config.apiKey });
        const openaiResponse = await openaiClient.chat.completions.create({
          model: config.model || 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: config.systemPrompt || 'You are a helpful assistant.' },
            { role: 'user', content: userMessage }
          ],
          max_tokens: 500,
        });
        response = openaiResponse.choices[0].message.content;
        break;

      case 'anthropic':
        if (!config.apiKey) {
          return res.status(400).json({ message: 'Anthropic API key is required' });
        }
        const anthropicClient = new Anthropic({ apiKey: config.apiKey });
        const anthropicResponse = await anthropicClient.messages.create({
          model: config.model || 'claude-3-5-sonnet-20241022',
          max_tokens: 500,
          system: config.systemPrompt || 'You are a helpful assistant.',
          messages: [{ role: 'user', content: userMessage }]
        });
        response = anthropicResponse.content[0].text;
        break;

      case 'google':
        if (!config.apiKey) {
          return res.status(400).json({ message: 'Google API key is required' });
        }
        const genAI = new GoogleGenerativeAI(config.apiKey);
        const geminiModel = genAI.getGenerativeModel({ 
          model: config.model || 'gemini-2.5-flash',
          systemInstruction: config.systemPrompt || 'You are a helpful assistant.'
        });
        const geminiResult = await geminiModel.generateContent(userMessage);
        response = geminiResult.response.text();
        break;

      case 'ollama':
        // Note: Ollama would require fetch to local server
        if (!config.url) {
          return res.status(400).json({ message: 'Ollama URL is required' });
        }
        const ollamaResponse = await fetch(`${config.url}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: config.model || 'llama3.2',
            prompt: `${config.systemPrompt || 'You are a helpful assistant.'}\n\nUser: ${userMessage}\nAssistant:`,
            stream: false,
          }),
        });
        const ollamaData = await ollamaResponse.json();
        response = ollamaData.response;
        break;

      default:
        return res.status(400).json({ message: 'Invalid provider' });
    }

    res.json({ success: true, response });

  } catch (err) {
    console.error('Error testing prompt:', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/update-config - Update AI configuration dynamically
app.post('/api/update-config', async (req, res) => {
  try {
    const { activeProvider, configs } = req.body;

    if (!activeProvider || !configs) {
      return res.status(400).json({ message: 'activeProvider and configs are required' });
    }

    // Update in-memory configuration
    dynamicConfig.activeProvider = activeProvider;
    dynamicConfig.configs = configs;

    console.log('Configuration updated:', dynamicConfig);

    res.json({
      success: true,
      message: 'Configuration updated successfully',
      activeProvider: dynamicConfig.activeProvider
    });

  } catch (err) {
    console.error('Error updating configuration:', err);
    res.status(500).json({ message: err.message });
  }
});

// Export for Vercel serverless functions
module.exports = app;

// For local development, start server if not in Vercel environment
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
  });
}
