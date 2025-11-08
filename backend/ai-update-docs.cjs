#!/usr/bin/env node

/**
 * AI-Powered Documentation Update Script
 * 
 * This script analyzes changes in the source project (style-referral-ring)
 * and uses AI to automatically generate documentation updates.
 * 
 * Usage:
 *   node ai-update-docs.cjs [options]
 * 
 * Options:
 *   --provider <name>    LLM provider: openai, anthropic, google, ollama (default: openai)
 *   --model <name>       Model name (provider-specific)
 *   --no-review          Skip interactive review, auto-approve all changes
 *   --auto-commit        Automatically commit changes after applying
 *   --since <date>       Analyze changes since date (default: last sync or 30 days)
 *   --dry-run            Show what would be updated without making changes
 * 
 * Examples:
 *   node ai-update-docs.cjs --no-review --auto-commit
 *   node ai-update-docs.cjs --provider anthropic --model claude-3-5-sonnet-20241022
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config({ path: '.env.local' });

// Configuration
const CONFIG = {
    sourceProjectPath: process.env.SOURCE_PROJECT_PATH || '/Users/rhfluker/Projects/style-referral-ring',
    docSitePath: process.env.DOC_SITE_PATH || '/Users/rhfluker/Projects/clientpass-doc-site-master',
    docsPath: path.join(process.env.DOC_SITE_PATH || '/Users/rhfluker/Projects/clientpass-doc-site-master', 'public/docs'),
    syncTrackingFile: path.join(process.env.DOC_SITE_PATH || '/Users/rhfluker/Projects/clientpass-doc-site-master', '.last-sync-date'),

    // LLM Provider Configuration
    llmProvider: process.env.LLM_PROVIDER || 'openai',
    openaiApiKey: process.env.OPENAI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    googleApiKey: process.env.GOOGLE_API_KEY,
    ollamaHost: process.env.OLLAMA_HOST || 'http://localhost:11434',
    ollamaModel: process.env.OLLAMA_MODEL || 'llama3.1:70b',

    // Model Defaults - Updated to latest versions as of Nov 2025
    defaultModels: {
        openai: 'gpt-4o',                      // GPT-4o: Proven stable model (GPT-5 has compatibility issues)
        anthropic: 'claude-sonnet-4-5',        // Claude 4.5 Sonnet: Smartest for complex agents and coding
        google: 'gemini-2.5-flash',            // Gemini 2.5 Flash: Best price-performance (latest)
        ollama: 'llama3.1:70b'                 // Llama 3.1 70B
    }
};;

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
    provider: CONFIG.llmProvider,
    model: null,
    review: true,
    autoCommit: false,
    since: null,
    dryRun: false
};

for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
        case '--provider':
            options.provider = args[++i];
            break;
        case '--model':
            options.model = args[++i];
            break;
        case '--review':
            options.review = args[++i] !== 'false';
            break;
        case '--no-review':
            options.review = false;
            break;
        case '--auto-commit':
            options.autoCommit = true;
            break;
        case '--since':
            options.since = args[++i];
            break;
        case '--dry-run':
            options.dryRun = true;
            break;
    }
}

// Set default model if not specified
if (!options.model) {
    options.model = CONFIG.defaultModels[options.provider];
}

console.log('🤖 AI Documentation Update Script');
console.log('=====================================');
console.log(`Provider: ${options.provider}`);
console.log(`Model: ${options.model}`);
console.log(`Review Mode: ${options.review ? 'ON' : 'OFF'}`);
console.log(`Dry Run: ${options.dryRun ? 'YES' : 'NO'}`);
console.log('=====================================\n');

/**
 * Get the last sync date from tracking file
 */
function getLastSyncDate() {
    if (options.since) {
        return options.since;
    }

    if (fs.existsSync(CONFIG.syncTrackingFile)) {
        return fs.readFileSync(CONFIG.syncTrackingFile, 'utf8').trim();
    }

    return '30 days ago';
}

/**
 * Execute git command in source project
 */
function gitCommand(command) {
    try {
        const result = execSync(command, {
            cwd: CONFIG.sourceProjectPath,
            encoding: 'utf8'
        });
        return result.trim();
    } catch (error) {
        console.error(`Git command failed: ${command}`);
        console.error(error.message);
        return '';
    }
}

/**
 * Analyze changes in source project
 */
function analyzeSourceChanges(since) {
    console.log(`📊 Analyzing changes since: ${since}\n`);

    const changes = {
        components: [],
        pages: [],
        migrations: [],
        apis: [],
        hooks: [],
        packages: [],
        commits: []
    };

    // Get changed files
    const changedFiles = gitCommand(`git diff --name-only "HEAD@{${since}}" HEAD`).split('\n').filter(Boolean);

    // Categorize changes
    changedFiles.forEach(file => {
        if (file.startsWith('src/components/')) changes.components.push(file);
        else if (file.startsWith('src/pages/')) changes.pages.push(file);
        else if (file.startsWith('supabase/migrations/')) changes.migrations.push(file);
        else if (file.startsWith('src/integrations/') || file.startsWith('src/api/')) changes.apis.push(file);
        else if (file.startsWith('src/hooks/')) changes.hooks.push(file);
        else if (file === 'package.json') changes.packages.push(file);
    });

    // Get commit messages for context
    const commits = gitCommand(`git log --since="${since}" --pretty=format:"%h|%s|%b" --no-merges`).split('\n').filter(Boolean);
    changes.commits = commits.map(commit => {
        const [hash, subject, body] = commit.split('|');
        return { hash, subject, body: body || '' };
    });

    return changes;
}

/**
 * Get file diffs for detailed analysis
 */
function getFileDiffs(files, since) {
    const diffs = {};

    files.forEach(file => {
        const diff = gitCommand(`git diff "HEAD@{${since}}" HEAD -- ${file}`);
        if (diff) {
            diffs[file] = diff;
        }
    });

    return diffs;
}

/**
 * Determine which documentation files need updates based on changes
 */
function determineDocsToUpdate(changes) {
    const docsToUpdate = new Set();

    if (changes.components.length > 0) {
        docsToUpdate.add('COMPONENT_GUIDE.md');
        docsToUpdate.add('FRONTEND_OVERVIEW.md');
    }

    if (changes.pages.length > 0) {
        docsToUpdate.add('NAVIGATION_FLOW.md');
        docsToUpdate.add('USER_STORIES.md');
        docsToUpdate.add('SRS.md');
    }

    if (changes.migrations.length > 0) {
        docsToUpdate.add('DATABASE_SCHEMA.md');
        docsToUpdate.add('ARCHITECTURE.md');
        docsToUpdate.add('SYSTEM_DESIGN.md');
    }

    if (changes.apis.length > 0) {
        docsToUpdate.add('INTEGRATION_GUIDE.md');
        docsToUpdate.add('SYSTEM_DESIGN.md');
        docsToUpdate.add('ARCHITECTURE.md');
    }

    if (changes.hooks.length > 0) {
        docsToUpdate.add('SYSTEM_DESIGN.md');
        docsToUpdate.add('FRONTEND_OVERVIEW.md');
    }

    if (changes.packages.length > 0) {
        docsToUpdate.add('ARCHITECTURE.md');
        docsToUpdate.add('INTEGRATION_GUIDE.md');
    }

    // Always update CHANGELOG
    docsToUpdate.add('CHANGELOG.md');

    return Array.from(docsToUpdate);
}

/**
 * Read current documentation content
 */
function readDocumentation(docName) {
    const docPath = path.join(CONFIG.docsPath, docName);

    if (!fs.existsSync(docPath)) {
        return null;
    }

    const content = fs.readFileSync(docPath, 'utf8');

    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
    let frontmatter = {};
    let body = content;

    if (frontmatterMatch) {
        const frontmatterText = frontmatterMatch[1];
        frontmatterText.split('\n').forEach(line => {
            const [key, value] = line.split(':').map(s => s.trim());
            if (key && value) {
                frontmatter[key] = value;
            }
        });
        body = content.substring(frontmatterMatch[0].length);
    }

    return {
        path: docPath,
        frontmatter,
        body,
        fullContent: content
    };
}

/**
 * Call LLM API to generate documentation updates
 */
async function generateDocumentationUpdate(docName, currentDoc, changes, diffs) {
    console.log(`\n🤖 Generating updates for ${docName}...`);

    const prompt = buildPrompt(docName, currentDoc, changes, diffs);

    let response;

    switch (options.provider) {
        case 'openai':
            response = await callOpenAI(prompt);
            break;
        case 'anthropic':
            response = await callAnthropic(prompt);
            break;
        case 'google':
            response = await callGoogle(prompt);
            break;
        case 'ollama':
            response = await callOllama(prompt);
            break;
        default:
            throw new Error(`Unsupported provider: ${options.provider}`);
    }

    return response;
}

/**
 * Build prompt for documentation update
 */
function buildPrompt(docName, currentDoc, changes, diffs) {
    const docType = docName.replace('.md', '');

    let prompt = `You are a technical documentation expert. Your task is to update the ${docType} documentation based on recent code changes.

# Current Documentation
${currentDoc ? currentDoc.body : 'No existing documentation found.'}

# Recent Changes Summary
- Components changed: ${changes.components.length}
- Pages changed: ${changes.pages.length}
- Database migrations: ${changes.migrations.length}
- API changes: ${changes.apis.length}
- Hooks changed: ${changes.hooks.length}
- Package changes: ${changes.packages.length}

# Commit History
${changes.commits.map(c => `- ${c.hash}: ${c.subject}`).join('\n')}

# Detailed Changes
`;

    // Add relevant diffs based on doc type
    const relevantFiles = getRelevantFilesForDoc(docType, changes);
    relevantFiles.forEach(file => {
        if (diffs[file]) {
            prompt += `\n## ${file}\n\`\`\`diff\n${diffs[file].substring(0, 2000)}\n\`\`\`\n`;
        }
    });

    prompt += `\n# Instructions
1. Analyze the changes and their impact on this documentation
2. Update the documentation to reflect the new changes
3. Maintain the existing structure and format
4. Increment the revision number in frontmatter
5. Update the "Last Updated" date to ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
6. Add new sections if needed for new features
7. Update existing sections that are affected by the changes

# Output Format
Return ONLY the updated documentation content including frontmatter. Do not include any explanations or comments outside the documentation.

# Updated Documentation:
`;

    return prompt;
}

/**
 * Get relevant files for a specific documentation type
 */
function getRelevantFilesForDoc(docType, changes) {
    const relevance = {
        'ARCHITECTURE': [...changes.migrations, ...changes.apis, ...changes.packages],
        'SYSTEM_DESIGN': [...changes.migrations, ...changes.apis, ...changes.hooks],
        'DATABASE_SCHEMA': [...changes.migrations],
        'COMPONENT_GUIDE': [...changes.components],
        'FRONTEND_OVERVIEW': [...changes.components, ...changes.hooks],
        'NAVIGATION_FLOW': [...changes.pages],
        'USER_STORIES': [...changes.pages, ...changes.components],
        'SRS': [...changes.pages, ...changes.apis],
        'INTEGRATION_GUIDE': [...changes.apis, ...changes.packages],
        'CHANGELOG': [...changes.components, ...changes.pages, ...changes.migrations, ...changes.apis, ...changes.hooks, ...changes.packages]
    };

    return relevance[docType] || [];
}

/**
 * OpenAI API call
 */
/**
 * Sleep utility for retry delays
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * OpenAI API call with retry logic
 */
async function callOpenAI(prompt, retryCount = 0) {
    const MAX_RETRIES = 5;

    if (!CONFIG.openaiApiKey) {
        throw new Error('OPENAI_API_KEY not set in environment');
    }

    try {
        const requestBody = {
            model: options.model,
            messages: [
                { role: 'system', content: 'You are a technical documentation expert specializing in software architecture and design documentation.' },
                { role: 'user', content: prompt }
            ],
            max_completion_tokens: 4000  // Updated parameter name for newer models
        };

        // Only add temperature for models that support it (not GPT-5 series)
        if (!options.model.startsWith('gpt-5')) {
            requestBody.temperature = 0.3;
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.openaiApiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (!response.ok) {
            // Check if it's a rate limit error
            if (response.status === 429 && retryCount < MAX_RETRIES) {
                const retryAfter = parseFloat(data.error?.message?.match(/try again in ([\d.]+)s/)?.[1] || '2');
                const backoffDelay = Math.max(retryAfter * 1000, Math.pow(2, retryCount) * 1000);

                console.log(`⏳ Rate limit hit. Waiting ${(backoffDelay / 1000).toFixed(1)}s before retry ${retryCount + 1}/${MAX_RETRIES}...`);
                await sleep(backoffDelay);

                return callOpenAI(prompt, retryCount + 1);
            }

            throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
        }

        return data.choices[0].message.content;
    } catch (error) {
        if (error.message.includes('Rate limit') && retryCount < MAX_RETRIES) {
            const backoffDelay = Math.pow(2, retryCount) * 1000;
            console.log(`⏳ Rate limit error. Waiting ${(backoffDelay / 1000).toFixed(1)}s before retry ${retryCount + 1}/${MAX_RETRIES}...`);
            await sleep(backoffDelay);
            return callOpenAI(prompt, retryCount + 1);
        }
        throw error;
    }
}

/**
 * Anthropic API call
 */
async function callAnthropic(prompt) {
    if (!CONFIG.anthropicApiKey) {
        throw new Error('ANTHROPIC_API_KEY not set in environment');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': CONFIG.anthropicApiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: options.model,
            max_tokens: 4000,
            messages: [
                { role: 'user', content: prompt }
            ]
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(`Anthropic API error: ${data.error?.message || 'Unknown error'}`);
    }

    return data.content[0].text;
}

/**
 * Google AI API call
 */
async function callGoogle(prompt) {
    if (!CONFIG.googleApiKey) {
        throw new Error('GOOGLE_API_KEY not set in environment');
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${options.model}:generateContent?key=${CONFIG.googleApiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(`Google AI API error: ${data.error?.message || 'Unknown error'}`);
    }

    return data.candidates[0].content.parts[0].text;
}

/**
 * Ollama API call
 */
async function callOllama(prompt) {
    const response = await fetch(`${CONFIG.ollamaHost}/api/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: options.model,
            prompt: prompt,
            stream: false
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(`Ollama API error: ${data.error || 'Unknown error'}`);
    }

    return data.response;
}

/**
 * Review proposed changes
 */
async function reviewChanges(docName, currentContent, proposedContent) {
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📄 Proposed changes for ${docName}`);
    console.log('='.repeat(60));
    console.log(proposedContent.substring(0, 1000));
    console.log('\n... (truncated for review) ...\n');
    console.log('='.repeat(60));

    return new Promise((resolve) => {
        readline.question('\nApprove these changes? (y/n/e to edit): ', (answer) => {
            readline.close();
            resolve(answer.toLowerCase());
        });
    });
}

/**
 * Apply documentation updates
 */
function applyDocumentationUpdate(docName, newContent) {
    const docPath = path.join(CONFIG.docsPath, docName);

    if (options.dryRun) {
        console.log(`[DRY RUN] Would write to: ${docPath}`);
        return;
    }

    // Strip markdown code fence wrappers if present (AI sometimes wraps output in ```markdown)
    let cleanContent = newContent.trim();
    if (cleanContent.startsWith('```markdown')) {
        cleanContent = cleanContent.slice(11).trim(); // Remove ```markdown
    }
    if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3).trim(); // Remove closing ```
    }

    fs.writeFileSync(docPath, cleanContent, 'utf8');
    console.log(`✅ Updated ${docName}`);
}

/**
 * Main execution
 */
async function main() {
    try {
        // 1. Get last sync date
        const since = getLastSyncDate();
        console.log(`📅 Analyzing changes since: ${since}\n`);

        // 2. Analyze source changes
        const changes = analyzeSourceChanges(since);

        if (changes.commits.length === 0) {
            console.log('✅ No changes detected since last sync.');
            return;
        }

        console.log(`\n📊 Change Summary:`);
        console.log(`   Components: ${changes.components.length}`);
        console.log(`   Pages: ${changes.pages.length}`);
        console.log(`   Migrations: ${changes.migrations.length}`);
        console.log(`   APIs: ${changes.apis.length}`);
        console.log(`   Hooks: ${changes.hooks.length}`);
        console.log(`   Commits: ${changes.commits.length}`);

        // 3. Determine docs to update
        const docsToUpdate = determineDocsToUpdate(changes);
        console.log(`\n📝 Documentation files to update: ${docsToUpdate.length}`);
        docsToUpdate.forEach(doc => console.log(`   - ${doc}`));

        // 4. Get detailed diffs
        const allFiles = [...changes.components, ...changes.pages, ...changes.migrations, ...changes.apis, ...changes.hooks, ...changes.packages];
        const diffs = getFileDiffs(allFiles, since);

        // 5. Generate and apply updates for each doc
        for (const docName of docsToUpdate) {
            const currentDoc = readDocumentation(docName);
            const updatedContent = await generateDocumentationUpdate(docName, currentDoc, changes, diffs);

            if (options.review) {
                const approval = await reviewChanges(docName, currentDoc?.fullContent, updatedContent);

                if (approval === 'y') {
                    applyDocumentationUpdate(docName, updatedContent);
                } else if (approval === 'e') {
                    console.log(`⏸️  Skipping ${docName} - manual edit requested`);
                } else {
                    console.log(`⏭️  Skipping ${docName}`);
                }
            } else {
                applyDocumentationUpdate(docName, updatedContent);
            }
        }

        // 6. Update sync tracking
        if (!options.dryRun) {
            const today = new Date().toISOString().split('T')[0];
            fs.writeFileSync(CONFIG.syncTrackingFile, today, 'utf8');
            console.log(`\n✅ Updated sync tracking file: ${today}`);
        }

        console.log('\n✨ Documentation update complete!');

        if (options.autoCommit && !options.dryRun) {
            console.log('\n📦 Committing changes...');
            execSync('git add public/docs/', { cwd: CONFIG.docSitePath });
            execSync(`git commit -m "docs: AI-generated updates based on source changes"`, { cwd: CONFIG.docSitePath });
            console.log('✅ Changes committed');
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { main };
