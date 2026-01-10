# Documentation Update Workflow

This guide documents the complete workflow for updating the ClientPass documentation site after pulling changes from the source project (`style-referral-ring`).

## Overview

The documentation update process involves:

1. Reviewing changes from source project
2. Updating core documentation files
3. Generating embeddings for AI search
4. Syncing to MongoDB Atlas
5. Deploying to production

---

## Prerequisites

### Required Tools

- Node.js (v18+)
- Git
- Access to MongoDB Atlas cluster
- Access to Vercel deployment
- Ollama (for local embeddings) or OpenAI API key

### Environment Setup

1. **Configure environment variables** in `backend/.env.local`:

```bash
cp backend/.env.example backend/.env.local
```

Edit `backend/.env.local`:

```bash
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_TEST_URI=mongodb+srv://username:password@cluster.mongodb.net/test

# API Configuration (for embeddings)
OPENAI_API_KEY=your_openai_key  # OR use Ollama locally

# Ollama Configuration (if using local embeddings)
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=nomic-embed-text
```

2. **Install dependencies**:

```bash
# Root project
npm install

# Backend services
cd backend
npm install
```

---

## Step 1: Review Source Project Changes

### Pull Latest Changes from Source

```bash
# Navigate to source project
cd /path/to/style-referral-ring

# Pull latest changes
git pull origin main

# Review commit history since last sync
git log --since="2024-10-01" --oneline

# Check for new features/components
git diff <last-sync-commit> HEAD
```

### Identify Documentation Gaps

Review the following areas for changes:

1. **New Features**: Check for new components, pages, or functionality
2. **Architecture Changes**: Database schema, API endpoints, integration patterns
3. **Requirements**: New user stories, use cases, or business requirements
4. **Design Updates**: UI/UX changes, wireframes, navigation flow

**Key Files to Review in Source Project:**

- `src/components/` - New React components
- `src/pages/` - New pages or features
- `supabase/migrations/` - Database schema changes
- `README.md` - Feature announcements
- `package.json` - New dependencies/integrations

---

## Step 2: Update Documentation Files

### Core Documentation Files

Located in `public/docs/`, update the following as needed:

#### 2.1 Architecture & Design Documents

- **`ARCHITECTURE.md`** - High-level system architecture
- **`SYSTEM_DESIGN.md`** - Detailed technical design
- **`HLA.md`** - High-level architecture overview
- **`DATABASE_SCHEMA.md`** - Database structure and relationships

#### 2.2 Requirements & Planning

- **`SRS.md`** - Software Requirements Specification
  - Add new functional requirements (REQ-XXX format)
  - Update non-functional requirements
- **`USER_STORIES.md`** - User story backlog
  - Organize by epics
  - Include acceptance criteria

#### 2.3 Process & Implementation Guides

- **`INTEGRATION_GUIDE.md`** - Third-party integrations
- **`COMPONENT_GUIDE.md`** - Component usage documentation
- **`NAVIGATION_FLOW.md`** - User journey flows

#### 2.4 Change Tracking

- **`CHANGELOG.md`** - Document all changes with:
  - Version number
  - Date of changes
  - Major features added
  - Architecture changes
  - Database schema updates
  - Breaking changes (if any)
  - Migration guide

### Documentation Standards

**Frontmatter Format** (top of each .md file):

```markdown
---
id: <mongodb_document_id>
revision: <increment_by_1>
---
```

**Timestamp Format**:

```markdown
**Last Updated**: November 8, 2025
```

**Requirement ID Format**:

- Functional: `REQ-XXX` (e.g., REQ-701 to REQ-710)
- Performance: `PERF-XX`
- Security: `SEC-XX`
- Usability: `USAB-XX`

### Update Checklist

For each new feature identified:

- [ ] Add architecture section to `ARCHITECTURE.md`
- [ ] Add detailed design to `SYSTEM_DESIGN.md`
- [ ] Add database tables/fields to `DATABASE_SCHEMA.md`
- [ ] Add requirements (10 per feature) to `SRS.md`
- [ ] Add user stories (10 per feature) to `USER_STORIES.md`
- [ ] Document in `CHANGELOG.md`
- [ ] Update revision numbers in frontmatter
- [ ] Update "Last Updated" timestamps

---

## Step 3: Generate Document Chunks and Embeddings

### 3.1 Extract and Chunk Documentation

**Script**: `backend/extract-and-chunk-docs.cjs`

This script:

- Reads all markdown files from `public/docs/`
- Strips frontmatter
- Splits content into semantic chunks (~500 tokens)
- Preserves context with headers
- Outputs to `backend/docs-chunks.json`

**Run the chunking process**:

```bash
cd backend
node extract-and-chunk-docs.cjs
```

**Output**: Creates `docs-chunks.json` with structure:

```json
[
  {
    "docName": "ARCHITECTURE",
    "content": "chunk content...",
    "metadata": {
      "section": "1. System Overview",
      "chunkIndex": 0
    }
  }
]
```

### 3.2 Generate Embeddings

**Script**: `backend/upload-embeddings-to-atlas.cjs`

This script:

- Reads chunks from `docs-chunks.json`
- Generates vector embeddings (384 dimensions)
- Uploads to MongoDB Atlas with vector search index
- Uses either Ollama (local) or OpenAI API

**Option A: Using Ollama (Local)**

```bash
# Start Ollama service (if not running)
ollama pull nomic-embed-text

# Generate embeddings
cd backend
node upload-embeddings-to-atlas.cjs
```

**Option B: Using OpenAI API**

```bash
# Ensure OPENAI_API_KEY is set in .env
cd backend
node upload-embeddings-to-atlas.cjs --provider openai
```

**What it does**:

1. Connects to MongoDB Atlas
2. Creates/updates `doc_embeddings` collection
3. For each chunk:
   - Generates 384-dimensional vector embedding
   - Stores: `{ docName, content, embedding, metadata, createdAt }`
4. Creates vector search index if needed

**Vector Search Index Configuration**:

```json
{
  "mappings": {
    "dynamic": true,
    "fields": {
      "embedding": {
        "type": "knnVector",
        "dimensions": 384,
        "similarity": "cosine"
      }
    }
  }
}
```

### 3.3 Verify Embeddings

**Test the embeddings**:

```bash
cd backend
node test-embedding.cjs
```

This will:

- Query the vector database with a test question
- Return top 5 most relevant chunks
- Display similarity scores

---

## Step 4: Sync Documentation to MongoDB

### 4.1 Update Documentation Collection

**Script**: `backend/update-docs.cjs`

This script:

- Reads markdown files with frontmatter
- Extracts document ID and revision number
- Syncs content to MongoDB `docs` collection via API

**Run the sync**:

```bash
cd backend
node update-docs.cjs
```

**What happens**:

1. Reads all `.md` files from `public/docs/`
2. Extracts frontmatter (id, revision)
3. Strips frontmatter from content
4. Makes PUT request to `/api/docs/:name`
5. Handles responses:
   - `200`: Successfully updated
   - `304`: No changes (same revision)
   - `404`: Creates new document (POST)
   - `409`: Conflict (manual review needed)

**API Endpoint**: `https://clientpass-doc-site.vercel.app/api/docs/:name`

### 4.2 Verify MongoDB Sync

**Check via MongoDB Atlas UI**:

1. Navigate to Collections → `docs`
2. Verify documents have updated `updatedAt` timestamps
3. Check revision numbers match frontmatter

**Check via API**:

```bash
# Get specific document
curl https://clientpass-doc-site.vercel.app/api/docs/ARCHITECTURE

# List all documents
curl https://clientpass-doc-site.vercel.app/api/docs
```

---

## Step 5: Test and Deploy

### 5.1 Local Testing

**Start development server**:

```bash
npm run dev
```

**Test the following**:

1. Browse documentation at `http://localhost:5173`
2. Test AI chatbot with questions about new features
3. Verify search functionality works
4. Check document navigation and links

### 5.2 Git Commit and Push

**Stage changes**:

```bash
git status  # Review changes
git add public/docs/  # Add updated documentation
git add backend/update-docs.cjs  # If modified
```

**Commit with descriptive message**:

```bash
git commit -m "docs: Update documentation with [Feature Name]

- Added [Feature] to ARCHITECTURE.md
- Updated SYSTEM_DESIGN.md with detailed design
- Enhanced DATABASE_SCHEMA.md with new tables
- Added [X] new requirements to SRS.md (REQ-XXX-XXX)
- Added [X] new user stories to USER_STORIES.md
- Updated CHANGELOG.md with version X.X.X changes
- Updated all docs to revision XX with [Date] timestamps"
```

**Push to GitHub**:

```bash
git push origin main
```

### 5.3 Automatic Deployment

Vercel automatically deploys when you push to `main`:

1. Monitors GitHub repository
2. Builds project on push
3. Deploys to production URL
4. Updates `deployment_urls.txt`

**Monitor deployment**:

- Check Vercel dashboard: https://vercel.com/dashboard
- View logs for build errors
- Test production URL: https://clientpass-doc-site.vercel.app

### 5.4 Post-Deployment Verification

**Verify production deployment**:

```bash
# Check API health
curl https://clientpass-doc-site.vercel.app/api/health

# Verify updated document
curl https://clientpass-doc-site.vercel.app/api/docs/ARCHITECTURE
```

**Test AI features**:

1. Open chatbot interface
2. Ask questions about new features
3. Verify responses reference updated documentation
4. Check embedding search returns relevant chunks

---

## Common Tasks

### Batch Update All Documents

```bash
cd backend
node update-docs.cjs
```

### Regenerate All Embeddings

```bash
cd backend
# Re-chunk documents
node extract-and-chunk-docs.cjs

# Generate new embeddings
node upload-embeddings-to-atlas.cjs
```

### Sync from MongoDB to Local Files

```bash
cd backend
node sync-docs-from-db.cjs
```

### Test LLM Generation

```bash
cd backend
node test-llm-generation.cjs
```

---

## Troubleshooting

### Issue: "No changes to commit"

**Cause**: Files already committed or no modifications made.
**Solution**: Check `git status` and verify files were actually modified.

### Issue: "Error updating document"

**Cause**: API endpoint unreachable or authentication failed.
**Solution**:

- Verify Vercel URL in `backend/update-docs.cjs`
- Check MongoDB connection string in `.env`
- Ensure no CORS issues

### Issue: Embeddings not generating

**Cause**: Ollama not running or API key missing.
**Solution**:

```bash
# Check Ollama status
curl http://localhost:11434/api/tags

# Or set OpenAI key
export OPENAI_API_KEY=your_key
```

### Issue: Vector search not working

**Cause**: Vector search index not created in MongoDB Atlas.
**Solution**:

1. Go to MongoDB Atlas → Database → Search Indexes
2. Create index on `doc_embeddings` collection
3. Use the vector search index configuration above

---

## File Reference

### Documentation Files

- `public/docs/*.md` - All documentation markdown files

### Backend Scripts

- `backend/extract-and-chunk-docs.cjs` - Chunk documents for embeddings
- `backend/upload-embeddings-to-atlas.cjs` - Generate and upload embeddings
- `backend/update-docs.cjs` - Sync docs to MongoDB
- `backend/sync-docs-from-db.cjs` - Pull docs from MongoDB
- `backend/test-embedding.cjs` - Test vector search
- `backend/test-llm-generation.cjs` - Test AI generation

### API Server

- `api/server.cjs` - Express server with documentation API endpoints

### Configuration

- `backend/.env` - Environment variables (not in git)
- `.gitignore` - Excludes sensitive files
- `vercel.json` - Vercel deployment configuration

---

## Best Practices

1. **Always increment revision numbers** when updating documentation
2. **Update timestamps** to current date in "Last Updated" field
3. **Test embeddings locally** before pushing to production
4. **Document breaking changes** in CHANGELOG.md
5. **Commit frequently** with descriptive messages
6. **Verify MongoDB sync** after running update-docs.cjs
7. **Test AI chatbot** after embedding updates
8. **Keep .gitignore updated** to exclude sensitive files

---

## Quick Reference Commands

```bash
# Full update workflow
cd /path/to/clientpass-doc-site-master

# 1. Update documentation files (manually)
# 2. Generate chunks and embeddings
cd backend
node extract-and-chunk-docs.cjs
node upload-embeddings-to-atlas.cjs

# 3. Sync to MongoDB
node update-docs.cjs

# 4. Commit and push
cd ..
git add public/docs/ backend/
git commit -m "docs: Update documentation with [changes]"
git push origin main

# 5. Verify deployment
curl https://clientpass-doc-site.vercel.app/api/docs
```

---

**Last Updated**: November 8, 2025
**Maintained By**: ClientPass Development Team
