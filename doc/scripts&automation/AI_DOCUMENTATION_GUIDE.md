# AI-Powered Documentation Updates

This guide explains how to use the AI-powered documentation update system to automatically generate documentation based on source code changes.

## Overview

The AI update system analyzes git diffs from the source project and uses LLMs (Large Language Models) to automatically generate documentation updates, saving hours of manual work.

## Features

- ✅ **Multi-Provider Support**: OpenAI, Anthropic (Claude), Google (Gemini), Ollama (local)
- ✅ **Intelligent Analysis**: Categorizes changes by type (components, pages, DB, APIs, etc.)
- ✅ **Smart Document Selection**: Automatically determines which docs need updates
- ✅ **Interactive Review**: Preview and approve changes before applying
- ✅ **Context-Aware Prompts**: Tailored prompts for each documentation type
- ✅ **Automatic Formatting**: Maintains frontmatter, revision numbers, timestamps

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install dotenv  # If not already installed
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp backend/.env.example backend/.env.local
```

Edit `backend/.env.local`:

```bash
# Choose your LLM provider
LLM_PROVIDER=openai  # or: anthropic, google, ollama

# Add your API key (only needed for the provider you choose)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...

# For local Ollama (no API key needed)
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.1:70b

# Project paths (should already be correct)
SOURCE_PROJECT_PATH=/Users/rhfluker/Projects/style-referral-ring
DOC_SITE_PATH=/Users/rhfluker/Projects/clientpass-doc-site-master
```

### 3. Choose Your LLM Provider

#### Option A: OpenAI (GPT-4o) - **Recommended**

- **Best for**: Proven stability, high-quality output with excellent rate limits
- **Model**: `gpt-4o` (Stable, production-ready)
- **Cost**: ~$0.025-0.075 per doc update
- **Rate Limits**: 500K TPM
- **Setup**: Get API key from https://platform.openai.com/api-keys

```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-proj-...
```

**Alternative OpenAI Models:**

- `gpt-4o` (default): Best balance of quality and stability ✅
- `gpt-4.1`: Smartest non-reasoning model
- `gpt-5-mini`: Cost-efficient (may have compatibility issues)
- `gpt-5`: Latest flagship ⚠️ _Note: Has known compatibility issues with some features_
- `o3`: Advanced reasoning model

#### Option B: Anthropic (Claude 4.5 Sonnet)

- **Best for**: Complex agents and coding (smartest model)
- **Model**: `claude-sonnet-4-5` (Nov 2025 - latest Claude 4.5)
- **Cost**: ~$0.015-0.075 per doc update
- **Context**: 200K tokens (1M beta available)
- **Setup**: Get API key from https://console.anthropic.com/

```bash
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

**Alternative Anthropic Models:**

- `claude-sonnet-4-5`: Smartest for complex tasks (default)
- `claude-haiku-4-5`: Fastest with near-frontier intelligence
- `claude-opus-4-1`: Exceptional specialized reasoning

#### Option C: Google (Gemini 2.5 Flash)

- **Best for**: Best price-performance, large scale processing
- **Model**: `gemini-2.5-flash` (Nov 2025 - latest)
- **Cost**: Free tier available, then ~$0.001-0.01 per doc
- **Setup**: Get API key from https://aistudio.google.com/apikey

```bash
LLM_PROVIDER=google
GOOGLE_API_KEY=AIza...
```

**Alternative Google Models:**

- `gemini-2.5-flash`: Best price-performance (default)
- `gemini-2.5-pro`: State-of-the-art thinking model
- `gemini-2.5-flash-lite`: Fastest, most cost-efficient
- `gemini-2.0-flash`: Previous generation workhorse
  GOOGLE_API_KEY=AIza...

````

#### Option D: Ollama (Local)

- **Best for**: Privacy, no API costs, unlimited usage
- **Cost**: Free (uses your hardware)
- **Setup**: Install Ollama and pull a model

```bash
# Install Ollama
brew install ollama  # macOS
# or visit https://ollama.ai for other platforms

# Start Ollama service
ollama serve

# Pull a model (70B recommended for best quality)
ollama pull llama3.1:70b

# Configure
LLM_PROVIDER=ollama
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.1:70b
````

## Usage

### Basic Usage (with Review)

Run the AI update with interactive review:

```bash
./automate-docs.sh --ai-update
```

This will:

1. Pull latest changes from source project
2. Analyze what changed (components, pages, DB, APIs, etc.)
3. Determine which docs need updates
4. Generate AI-powered updates for each doc
5. Show you each change for review (y/n/e)
6. Apply approved changes
7. Run chunking and embedding generation
8. Sync to MongoDB

### Advanced Options

```bash
# AI update without manual review (auto-apply all)
./automate-docs.sh --ai-update --no-review

# AI update with automatic git commit
./automate-docs.sh --ai-update --auto-commit

# Full automation (AI + no review + auto-commit)
./automate-docs.sh --ai-update --no-review --auto-commit
```

### Direct Script Usage

You can also call the AI update script directly:

```bash
cd backend

# Basic usage
node ai-update-docs.cjs

# With options
node ai-update-docs.cjs --provider openai --model gpt-4-turbo-preview
node ai-update-docs.cjs --provider anthropic --model claude-3-5-sonnet-20241022
node ai-update-docs.cjs --provider google --model gemini-1.5-pro
node ai-update-docs.cjs --provider ollama --model llama3.1:70b

# Additional options
node ai-update-docs.cjs --since "7 days ago"  # Analyze last 7 days
node ai-update-docs.cjs --dry-run             # Preview without changing files
node ai-update-docs.cjs --review false        # No review, auto-apply
node ai-update-docs.cjs --auto-commit         # Commit after applying
```

## How It Works

### 1. Change Detection

The script analyzes git diffs since last sync and categorizes changes:

- **Components** (`src/components/`) → Updates `COMPONENT_GUIDE.md`, `FRONTEND_OVERVIEW.md`
- **Pages** (`src/pages/`) → Updates `NAVIGATION_FLOW.md`, `USER_STORIES.md`, `SRS.md`
- **Migrations** (`supabase/migrations/`) → Updates `DATABASE_SCHEMA.md`, `ARCHITECTURE.md`, `SYSTEM_DESIGN.md`
- **APIs** (`src/integrations/`, `src/api/`) → Updates `INTEGRATION_GUIDE.md`, `SYSTEM_DESIGN.md`, `ARCHITECTURE.md`
- **Hooks** (`src/hooks/`) → Updates `SYSTEM_DESIGN.md`, `FRONTEND_OVERVIEW.md`
- **Packages** (`package.json`) → Updates `ARCHITECTURE.md`, `INTEGRATION_GUIDE.md`

### 2. Prompt Engineering

For each doc, the AI receives:

- Current documentation content
- Summary of changes (file counts, commit messages)
- Relevant git diffs (up to 2000 chars per file)
- Specific instructions for that doc type
- Format requirements (frontmatter, structure, etc.)

### 3. AI Generation

The LLM generates updated documentation:

- Analyzes impact of changes
- Updates affected sections
- Adds new sections for new features
- Maintains existing structure and format
- Increments revision number
- Updates "Last Updated" timestamp

### 4. Review & Apply

You review each proposed change:

- `y` - Approve and apply
- `n` - Skip this document
- `e` - Skip and edit manually later

## Examples

### Example 1: New Feature Added

**Source Change**: New `QuickRebookButton.tsx` component added

**AI Analysis**:

```
Components changed: 1
- src/components/QuickRebookButton.tsx

Determining docs to update:
- COMPONENT_GUIDE.md
- FRONTEND_OVERVIEW.md
```

**Generated Update** (COMPONENT_GUIDE.md):

````markdown
### QuickRebookButton

**Purpose**: Allows clients to quickly rebook with a stylist they've visited before.

**Location**: `src/components/QuickRebookButton.tsx`

**Props**:

- `stylistId: string` - ID of the stylist to rebook
- `lastVisitDate: Date` - Date of last appointment
- `onRebook: () => void` - Callback when rebook is initiated

**Usage**:

```tsx
<QuickRebookButton
  stylistId="123"
  lastVisitDate={new Date("2025-01-15")}
  onRebook={() => handleRebook()}
/>
```
````

```

### Example 2: Database Schema Change

**Source Change**: New migration adds `booking_history` table

**AI Analysis**:
```

Migrations changed: 1

- supabase/migrations/20250108_add_booking_history.sql

Determining docs to update:

- DATABASE_SCHEMA.md
- ARCHITECTURE.md
- SYSTEM_DESIGN.md

````

**Generated Update** (DATABASE_SCHEMA.md):
```markdown
### booking_history

Stores historical booking data for analytics and quick rebook features.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Unique identifier |
| client_id | uuid | FOREIGN KEY | Reference to clients table |
| stylist_id | uuid | FOREIGN KEY | Reference to stylists table |
| service_id | uuid | FOREIGN KEY | Reference to services table |
| booked_at | timestamptz | NOT NULL | Booking timestamp |
| completed_at | timestamptz | | Completion timestamp |
| rating | integer | CHECK (rating >= 1 AND rating <= 5) | Client rating |

**Indexes**:
- `idx_booking_history_client` on `client_id`
- `idx_booking_history_stylist` on `stylist_id`
- `idx_booking_history_completed` on `completed_at`
````

## Troubleshooting

### "Provider API key not set"

**Solution**: Add the API key to `backend/.env.local`

```bash
OPENAI_API_KEY=your_key_here
```

### "Ollama not responding"

**Solution**: Make sure Ollama service is running

```bash
ollama serve
# In another terminal
ollama list  # Check if model is downloaded
```

### "Git command failed"

**Solution**: Ensure you've pulled latest from source project first

```bash
cd /Users/rhfluker/Projects/style-referral-ring
git pull origin main
```

### Generated docs are incomplete

**Solution**:

1. Use a more powerful model (GPT-4, Claude 3.5, Llama 70B)
2. Review git diffs manually for complex changes
3. Use `--review` mode to edit before applying

### API rate limits

**Solution**:

- Add delays between requests (modify script)
- Use Ollama (local, no limits)
- Upgrade API plan

## Best Practices

1. **Review AI-generated content**: Always use `--review` mode initially
2. **Test incrementally**: Run after small batches of changes, not months of work
3. **Use appropriate models**:
   - GPT-4o for proven stability and quality (recommended) ✅
   - GPT-4.1 for smartest non-reasoning model
   - Claude 4.5 Sonnet for complex agents and coding
   - Claude 4.5 Haiku for fastest near-frontier intelligence
   - Gemini 2.5 Flash for best price-performance
   - Gemini 2.5 Pro for state-of-the-art thinking
   - Ollama 70B for privacy-sensitive projects
   - GPT-5 models: Use with caution (compatibility issues) ⚠️
4. **Commit frequently**: Use `--auto-commit` after verifying quality
5. **Verify embeddings**: Check that AI updates get properly chunked and embedded

## Cost Estimates

Based on average documentation update (5 docs, 2000 tokens each):

| Provider  | Model             | Cost per Update | Monthly (4 updates) | Status     |
| --------- | ----------------- | --------------- | ------------------- | ---------- |
| OpenAI    | GPT-4o            | $0.025-0.075    | $0.10-0.30          | ✅ Stable  |
| OpenAI    | GPT-4.1           | $0.02-0.08      | $0.08-0.32          | ✅ Stable  |
| OpenAI    | GPT-5-mini        | $0.005-0.02     | $0.02-0.08          | ⚠️ Testing |
| OpenAI    | GPT-5             | $0.03-0.10      | $0.12-0.40          | ⚠️ Issues  |
| Anthropic | Claude 4.5 Sonnet | $0.015-0.075    | $0.06-0.30          | ✅ Stable  |
| Anthropic | Claude 4.5 Haiku  | $0.005-0.025    | $0.02-0.10          | ✅ Stable  |
| Anthropic | Claude 4.5 Opus   | $0.075-0.375    | $0.30-1.50          |
| Google    | Gemini 2.5 Flash  | $0.001-0.01     | $0.004-0.04         |
| Google    | Gemini 2.5 Pro    | $0.002-0.02     | $0.008-0.08         |
| Ollama    | Llama 3.1 70B     | $0 (free)       | $0 (free)           |

**Note**: All models have been updated to the latest November 2025 versions. GPT-5, Claude 4.5, and Gemini 2.5 represent the cutting edge of AI technology.## Future Enhancements

- [x] ~~Rate limit handling with exponential backoff~~
- [ ] Batch processing for multiple docs simultaneously
- [ ] Custom prompt templates per documentation type
- [ ] Diff visualization in review mode
- [ ] GitHub Action integration for automated PR comments
- [ ] Support for diagram generation (Mermaid)
- [ ] Multi-language documentation support
- [ ] A/B testing different prompts for quality

---

**Last Updated**: November 8, 2025
