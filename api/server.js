require('dotenv').config();
// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/docdb'; // Replace with your MongoDB URI

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
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ message: 'Document content is required' });
  }
  try {
    const updatedDoc = await Document.findOneAndUpdate(
      { name: req.params.docName.toUpperCase() },
      { $set: { content: content, updatedAt: Date.now() }, $inc: { revision: 1 } },
      { new: true } // Return the updated document
    );
    if (!updatedDoc) {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.json(updatedDoc);
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

// Start the server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
