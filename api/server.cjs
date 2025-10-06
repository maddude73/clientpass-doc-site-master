require('dotenv').config();
// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/docdb'; // Replace with your MongoDB URI
console.log('Connecting to MongoDB:', MONGODB_URI);

// Middleware
app.use(cors()); // Enable CORS for frontend access
app.use(bodyParser.json()); // Parse JSON request bodies

// MongoDB Connection
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Document Schema and Model
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

const Document = mongoose.model('Document', documentSchema);

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

// Start the server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
