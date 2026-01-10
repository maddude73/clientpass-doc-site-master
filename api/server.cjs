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
const PORT = process.env.PORT || 5500;

// Security: Disable X-Powered-By header
app.disable('x-powered-by');

// Helper function to sanitize MongoDB queries
function sanitizeForMongoDB(input) {
  if (typeof input !== 'string') return input;
  // Remove potential MongoDB operators and injection patterns
  return input.replace(/[\$\.{}\[\];]/g, '').trim();
}

// Additional input validation
function validateStringInput(input, fieldName) {
  if (typeof input !== 'string' || input.length === 0) {
    throw new Error(`${fieldName} must be a non-empty string`);
  }
  return sanitizeForMongoDB(input);
}

// Define trusted origins/domains. These can be configured via environment variables in a real app.
const TRUSTED_DOMAINS = [
  'localhost:8080', 'localhost:8081',// Your local frontend development server
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
let openai = null;
let anthropic = null;

if (process.env.OPENAI_API_KEY) {
  // Validate OpenAI API key format
  if (process.env.OPENAI_API_KEY.startsWith('sk-proj-') || process.env.OPENAI_API_KEY.startsWith('sk-')) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('✅ OpenAI client initialized with key:', process.env.OPENAI_API_KEY.substring(0, 12) + '...');
  } else {
    console.error('❌ Invalid OpenAI API key format. Expected format: sk-proj-... or sk-...');
    console.error('Current key starts with:', process.env.OPENAI_API_KEY.substring(0, 10) + '...');
  }
} else {
  console.warn('⚠️ OPENAI_API_KEY not provided - RAG search will be disabled');
}

// Anthropic disabled - using OpenAI only
// if (process.env.ANTHROPIC_API_KEY) {
//   if (process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-')) {
//     anthropic = new Anthropic({
//       apiKey: process.env.ANTHROPIC_API_KEY,
//     });
//     console.log('✅ Anthropic client initialized with key:', process.env.ANTHROPIC_API_KEY.substring(0, 12) + '...');
//   } else {
//     console.error('❌ Invalid Anthropic API key format. Expected format: sk-ant-...');
//     console.error('Current key starts with:', process.env.ANTHROPIC_API_KEY.substring(0, 10) + '...');
//   }
// } else {
//   console.warn('⚠️ ANTHROPIC_API_KEY not provided - RAG search will be disabled');
// }
console.log('Using OpenAI only - Anthropic disabled');

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

// Removed duplicate test-prompt endpoint - using the more complete one below

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
    const docName = sanitizeForMongoDB(req.params.docName).toUpperCase();
    const doc = await Document.findOne({ name: docName });
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
    const sanitizedName = sanitizeForMongoDB(name).toUpperCase();
    const newDoc = new Document({ name: sanitizedName, content });
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
    const docName = sanitizeForMongoDB(req.params.docName).toUpperCase();
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
    const docName = sanitizeForMongoDB(req.params.docName).toUpperCase();
    const deletedDoc = await Document.findOneAndDelete({ name: docName });
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

  // Check if required services are available
  if (!openai) {
    console.error('OpenAI client not configured - OPENAI_API_KEY missing');
    return res.status(503).json({ message: 'OpenAI client not configured. Please set OPENAI_API_KEY.' });
  }

  // Initialize Gemini if not already done
  let genAI;
  if (process.env.GEMINI_API_KEY) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  } else {
    console.error('Gemini API key not configured - GEMINI_API_KEY missing');
    return res.status(503).json({ message: 'Gemini API key not configured. Please set GEMINI_API_KEY.' });
  }

  // Log the search request
  console.log('Processing search request for query:', query);

  try {
    // 1. Generate embedding for the user query using OpenAI
    console.log('Generating embedding for query...');
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: query,
      dimensions: 1536, // Explicitly set dimensions
    });

    if (!embeddingResponse?.data?.[0]?.embedding) {
      throw new Error('Invalid embedding response from OpenAI');
    }

    const queryEmbedding = embeddingResponse.data[0].embedding;
    console.log('Query Embedding dimensions:', queryEmbedding.length);

    // 2. Perform Atlas Vector Search
    console.log('Performing vector search...');
    const collection = docsConnection.collection('document_chunks');

    if (!collection) {
      throw new Error('Database collection not available');
    }

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
    const systemPrompt = dynamicConfig.configs.google?.systemPrompt ||
      'You are a helpful assistant for the ClientPass documentation. Answer questions based on the provided context.';

    const prompt = `Answer the following question based *only* on the provided context. If the answer is not in the context, state that you don't know. Cite the document names you used (e.g., [DEMO_MODE.md]).

Question: ${query}

Context:
${context}

Answer:`;

    // 4. Get answer using AI Gateway pattern (respects activeProvider)
    const activeProvider = dynamicConfig.activeProvider;
    console.log(`Sending prompt to ${activeProvider.toUpperCase()} via AI Gateway...`);
    let llmAnswer;

    try {
      switch (activeProvider) {
        case 'openai':
          if (!openai) {
            throw new Error('OpenAI client not initialized');
          }
          const openaiResponse = await openai.chat.completions.create({
            model: dynamicConfig.configs.openai?.model || 'gpt-5-mini',
            messages: [
              {
                role: 'system',
                content: dynamicConfig.configs.openai?.systemPrompt || 'You are a helpful assistant for the ClientPass documentation. Answer questions based on the provided context.'
              },
              { role: 'user', content: prompt }
            ],
            max_completion_tokens: 1000
          });

          if (!openaiResponse?.choices?.[0]?.message?.content) {
            throw new Error('Invalid response from OpenAI API');
          }

          llmAnswer = openaiResponse.choices[0].message.content;
          break;

        case 'google':
          // Use dynamic API key if available
          const googleApiKey = dynamicConfig.configs.google?.apiKey || process.env.GEMINI_API_KEY;
          console.log('Google API key check:', googleApiKey ? `Key found (${googleApiKey.substring(0, 12)}...)` : 'No key found');

          if (!googleApiKey) {
            throw new Error('Google API key not found in configuration');
          }

          // Use the actual selected model - no proactive fallbacks
          const modelToUse = dynamicConfig.configs.google?.model || 'gemini-2.5-flash';
          console.log('Testing Google model:', modelToUse);

          const dynamicGenAI = new GoogleGenerativeAI(googleApiKey);

          try {
            // Try the actual selected model first
            const geminiModel = dynamicGenAI.getGenerativeModel({
              model: modelToUse,
              systemInstruction: dynamicConfig.configs.google?.systemPrompt || 'You are a helpful assistant for the ClientPass documentation. Answer questions based on the provided context.'
            });

            console.log('Google AI client created with model:', modelToUse);

            const geminiResult = await geminiModel.generateContent(prompt);

            if (!geminiResult?.response?.text()) {
              throw new Error('Invalid response from Gemini API');
            }

            llmAnswer = geminiResult.response.text();
            console.log(`Successfully used ${modelToUse}!`);

          } catch (modelError) {
            console.warn(`❌ Error with ${modelToUse}:`, modelError.message);

            // Only fallback if there's an actual error AND we're not already using the fallback
            if (modelToUse !== 'gemini-2.5-flash') {
              console.log('🔄 Trying fallback: gemini-2.5-flash');

              const fallbackModel = dynamicGenAI.getGenerativeModel({
                model: 'gemini-2.5-flash',
                systemInstruction: dynamicConfig.configs.google?.systemPrompt || 'You are a helpful assistant for the ClientPass documentation. Answer questions based on the provided context.'
              });

              const fallbackResult = await fallbackModel.generateContent(prompt);

              if (!fallbackResult?.response?.text()) {
                throw new Error('Invalid response from fallback Gemini API');
              }

              llmAnswer = fallbackResult.response.text();
              console.log('✅ Fallback to gemini-2.5-flash succeeded');
            } else {
              throw modelError; // Re-throw if already using fallback model
            }
          }
          break;

        case 'anthropic':
          // Use dynamic API key if available
          const anthropicApiKey = dynamicConfig.configs.anthropic?.apiKey || process.env.ANTHROPIC_API_KEY;
          if (!anthropicApiKey) {
            throw new Error('Anthropic API key not found in configuration');
          }

          const dynamicAnthropic = new Anthropic({ apiKey: anthropicApiKey });
          const anthropicResponse = await dynamicAnthropic.messages.create({
            model: dynamicConfig.configs.anthropic?.model || 'claude-3-5-sonnet-20241022',
            max_tokens: 1000,
            system: dynamicConfig.configs.anthropic?.systemPrompt || 'You are a helpful assistant for the ClientPass documentation. Answer questions based on the provided context.',
            messages: [{ role: 'user', content: prompt }]
          });

          if (!anthropicResponse?.content?.[0]?.text) {
            throw new Error('Invalid response from Anthropic API');
          }

          llmAnswer = anthropicResponse.content[0].text;
          break;

        default:
          throw new Error(`Unsupported AI provider: ${activeProvider}`);
      }

      console.log(`${activeProvider.toUpperCase()} answer generated successfully`);

    } catch (providerError) {
      console.error(`Error from ${activeProvider.toUpperCase()} API:`, providerError.message);

      // Provide fallback response with search results
      llmAnswer = `I found relevant information in these documents: ${searchResults.map(r => r.source_file).join(', ')}. Based on the search results, here are the key points related to "${query}":\n\n${searchResults.map((r, i) => `${i + 1}. From ${r.source_file}: ${r.content.substring(0, 200)}...`).join('\n\n')}`;
      console.log(`Using fallback response with search results due to ${activeProvider.toUpperCase()} error`);
    }

    // 5. Return AI Gateway answer and sources
    const sources = searchResults.map(result => result.source_file);
    const uniqueSources = [...new Set(sources)];

    console.log('Search completed successfully, returning response');
    res.json({ answer: llmAnswer, sources: uniqueSources });

  } catch (err) {
    console.error('Error during RAG search:', err);
    console.error('Error stack:', err.stack);

    // Return more specific error messages
    if (err.code === 'invalid_api_key' && err.message.includes('Incorrect API key')) {
      console.error('❌ CRITICAL: Invalid OpenAI API key detected!');
      console.error('Key format check - Current key starts with:', process.env.OPENAI_API_KEY?.substring(0, 12) + '...');
      res.status(401).json({
        message: 'Invalid OpenAI API key. Please check your OPENAI_API_KEY environment variable.',
        error: 'authentication_failed',
        details: 'The API key should start with sk-proj- or sk-. Visit https://platform.openai.com/api-keys to get a valid key.'
      });
    } else if (err.message.includes('OpenAI')) {
      res.status(503).json({ message: 'OpenAI service error: ' + err.message });
    } else if (err.message.includes('Claude') || err.message.includes('Anthropic')) {
      res.status(503).json({ message: 'Anthropic Claude service error: ' + err.message });
    } else if (err.message.includes('Database') || err.message.includes('collection')) {
      res.status(503).json({ message: 'Database service error: ' + err.message });
    } else {
      res.status(500).json({ message: 'Internal server error: ' + err.message });
    }
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
          model: config.model || 'gpt-5-mini',
          messages: [
            { role: 'system', content: config.systemPrompt || 'You are a helpful assistant.' },
            { role: 'user', content: userMessage }
          ],
          max_completion_tokens: 500,
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
        // Validate Ollama URL to prevent SSRF
        if (!config.url.startsWith('http://localhost:') && !config.url.startsWith('http://127.0.0.1:')) {
          return res.status(400).json({ message: 'Ollama URL must be localhost for security' });
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
