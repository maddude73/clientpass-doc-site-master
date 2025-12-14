# RAG Search API - Production Environment Setup

## 🚨 Production Error Resolution

**Issue**: `POST /api/docs/search` returning 500 Internal Server Error

**Root Causes**:

1. Missing required environment variables in production deployment
2. **CRITICAL**: Invalid OpenAI API key format (Error: `sk-svcac***WL4A`)

### 🔥 URGENT FIX NEEDED: Invalid OpenAI API Key

The current production deployment has an invalid OpenAI API key:

- **Current (Invalid)**: `sk-svcac***WL4A`
- **Required Format**: `sk-proj-***` or `sk-***`

**Immediate Action Required**:

1. Generate a new OpenAI API key at https://platform.openai.com/api-keys
2. Update the `OPENAI_API_KEY` environment variable in Vercel
3. Redeploy the application

## 📋 Required Environment Variables

### MongoDB Atlas Configuration

```bash
# MongoDB Atlas connection for document storage
MONGODB_URI_TEST=mongodb+srv://username:password@cluster.mongodb.net/test

# MongoDB Atlas connection for document chunks and vector search
MONGODB_URI_DOCS=mongodb+srv://username:password@cluster.mongodb.net/docs
```

### AI API Keys

```bash
# OpenAI API Key (required for text embeddings)
OPENAI_API_KEY=sk-proj-...your-openai-key

# Anthropic Claude API Key (required for response generation)
ANTHROPIC_API_KEY=sk-ant-...your-anthropic-key
```

## 🔧 Vercel Environment Variables Setup

1. **Access Vercel Dashboard**: https://vercel.com/dashboard
2. **Navigate to Project Settings** → Environment Variables
3. **Add the following variables**:

| Variable Name       | Value               | Environment |
| ------------------- | ------------------- | ----------- |
| `MONGODB_URI_TEST`  | `mongodb+srv://...` | Production  |
| `MONGODB_URI_DOCS`  | `mongodb+srv://...` | Production  |
| `OPENAI_API_KEY`    | `sk-proj-...`       | Production  |
| `ANTHROPIC_API_KEY` | `sk-ant-...`        | Production  |

## 🧪 Testing the Fix

### Local Testing

```bash
# Test locally with environment variables
node test_api_search.js

# Test against production
API_BASE=https://clientpass-doc-site.vercel.app node test_api_search.js
```

### Frontend Testing

```bash
# Open browser console and run:
fetch('/api/docs/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: 'What is ClientPass?' })
}).then(r => r.json()).then(console.log)
```

## 🔍 MongoDB Atlas Vector Index Requirements

Ensure the `document_chunks` collection has a vector search index:

```json
{
  "mappings": {
    "dynamic": true,
    "fields": {
      "embedding": {
        "dimensions": 1536,
        "similarity": "cosine",
        "type": "knnVector"
      }
    }
  }
}
```

Index name: `vector_index`

## 🚀 Deployment Checklist

- [ ] MongoDB Atlas clusters accessible from Vercel IP ranges
- [ ] Vector search index `vector_index` exists on `document_chunks` collection
- [ ] OpenAI API key valid and has embedding permissions
- [ ] Anthropic Claude API key valid and has message permissions
- [ ] Environment variables set in Vercel dashboard
- [ ] API endpoint test passes: `node test_api_search.js`

## 🔄 Redeploy After Configuration

After setting environment variables in Vercel:

1. Trigger a new deployment (push to main branch or manual redeploy)
2. Wait for deployment to complete
3. Test the `/api/docs/search` endpoint
4. Verify chatbot functionality on the site

## 🐞 Debugging Production Issues

### Check Vercel Function Logs

1. Visit Vercel Dashboard → Functions tab
2. Look for `/api/docs/search` function
3. Check recent invocations and error logs

### Common Error Messages

- `"OpenAI client not configured"` → Set `OPENAI_API_KEY`
- `"Anthropic client not configured"` → Set `ANTHROPIC_API_KEY`
- `"Database collection not available"` → Check MongoDB connection strings
- `"Invalid embedding response"` → Verify OpenAI API key permissions
- `"Invalid response from Claude API"` → Verify Anthropic API key permissions
- **`"Incorrect API key provided: sk-svcac\***"`** → **CRITICAL\*\*: Replace with valid OpenAI API key

## 🚨 CURRENT PRODUCTION ISSUE: Invalid OpenAI API Key

### Error Details

```
AuthenticationError: 401 Incorrect API key provided: sk-svcac***WL4A
```

### Root Cause

The production environment has an invalid OpenAI API key. The key `sk-svcac***` is not a valid OpenAI API key format.

### Immediate Fix Steps

#### 1. Generate New OpenAI API Key

- Visit: https://platform.openai.com/api-keys
- Click "Create new secret key"
- Copy the key (starts with `sk-proj-` or `sk-`)

#### 2. Update Vercel Environment Variable

- Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables
- Find `OPENAI_API_KEY`
- Replace with new valid key
- Save changes

#### 3. Redeploy Application

```bash
# Option 1: Push to trigger auto-deploy
git commit --allow-empty -m "fix: Update OpenAI API key"
git push origin main

# Option 2: Manual redeploy in Vercel dashboard
```

#### 4. Verify Fix

```bash
# Test the endpoint
curl -X POST https://clientpass-doc-site.vercel.app/api/docs/search \
  -H "Content-Type: application/json" \
  -d '{"query":"What is ClientPass?"}'
```

### Expected Response After Fix

```json
{
  "answer": "ClientPass is...",
  "sources": ["DEMO_MODE.md", "README.md"]
}
```
