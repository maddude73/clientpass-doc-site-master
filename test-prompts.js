#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_BASE_URL = 'http://localhost:5500';
const PROMPTS_DIR = path.join(__dirname, 'prompts');
const OUTPUT_DIR = path.join(__dirname, 'test-results');

// Provider configurations - using unified prompt for all
const PROVIDERS = {
    openai: {
        name: 'OpenAI',
        model: 'gpt-5-mini',
        promptFile: 'unified-enhanced-prompt.md',
        icon: '🤖'
    },
    google: {
        name: 'Google Gemini',
        model: 'gemini-3-pro',
        promptFile: 'unified-enhanced-prompt.md',
        icon: '🧠'
    },
    anthropic: {
        name: 'Anthropic Claude',
        model: 'claude-3-5-sonnet-20241022',
        promptFile: 'unified-enhanced-prompt.md',
        icon: '🎯'
    },
    ollama: {
        name: 'Ollama',
        model: 'llama3.2',
        promptFile: 'unified-enhanced-prompt.md',
        icon: '⚡'
    }
};

// Helper functions
async function readPromptFile(filename) {
    try {
        const content = await fs.readFile(path.join(PROMPTS_DIR, filename), 'utf8');
        // Extract the actual prompt from between the triple backticks
        const match = content.match(/```\n([\s\S]*?)\n```/);
        return match ? match[1].trim() : content;
    } catch (error) {
        console.warn(`Warning: Could not read ${filename}, using default prompt`);
        return 'You are a helpful documentation assistant for ClientPass.';
    }
}

async function updateProviderConfig(provider, systemPrompt, model) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/update-config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                activeProvider: provider,
                configs: {
                    [provider]: {
                        systemPrompt: systemPrompt,
                        model: model,
                        // Include API keys from environment if available
                        ...(provider === 'google' && { apiKey: process.env.VITE_GEMINI_API_KEY }),
                        ...(provider === 'openai' && { apiKey: process.env.VITE_OPENAI_API_KEY }),
                        ...(provider === 'anthropic' && { apiKey: process.env.VITE_ANTHROPIC_API_KEY }),
                        ...(provider === 'ollama' && { url: process.env.VITE_OLLAMA_URL || 'http://localhost:11434' })
                    }
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Config update failed: ${response.status}`);
        }
        return true;
    } catch (error) {
        console.error(`Failed to update config for ${provider}:`, error.message);
        return false;
    }
}

async function queryProvider(question, provider, config) {
    try {
        console.log(`${config.icon} Testing ${config.name}...`);

        // Update configuration for this provider
        const systemPrompt = await readPromptFile(config.promptFile);
        const configSuccess = await updateProviderConfig(provider, systemPrompt, config.model);

        if (!configSuccess) {
            return {
                provider,
                config,
                systemPrompt,
                error: 'Failed to update provider configuration',
                response: null,
                duration: 0
            };
        }

        // Small delay to ensure config is applied
        await new Promise(resolve => setTimeout(resolve, 500));

        const startTime = Date.now();

        const response = await fetch(`${API_BASE_URL}/api/docs/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: question })
        });

        const duration = Date.now() - startTime;

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        console.log(`✅ ${config.name} completed (${duration}ms)`);

        return {
            provider,
            config,
            systemPrompt,
            error: null,
            response: data,
            duration
        };

    } catch (error) {
        console.error(`❌ ${config.name} failed:`, error.message);
        return {
            provider,
            config,
            systemPrompt: await readPromptFile(config.promptFile),
            error: error.message,
            response: null,
            duration: 0
        };
    }
}

async function runParallelTests(question) {
    console.log(`\n🚀 Running parallel tests for: "${question}"\n`);

    const startTime = Date.now();

    // Run all provider tests in parallel
    const promises = Object.entries(PROVIDERS).map(([provider, config]) =>
        queryProvider(question, provider, config)
    );

    const results = await Promise.all(promises);
    const totalDuration = Date.now() - startTime;

    console.log(`\n🏁 All tests completed in ${totalDuration}ms\n`);

    return { results, totalDuration, question };
}

function generateMarkdownReport(testData) {
    const { results, totalDuration, question } = testData;
    const timestamp = new Date().toISOString();

    let markdown = `# AI Provider Comparison Test Results

**Question**: "${question}"  
**Test Date**: ${timestamp}  
**Total Duration**: ${totalDuration}ms  
**Providers Tested**: ${results.length}

---

`;

    // Summary table
    markdown += `## Summary\n\n| Provider | Model | Status | Duration | Response Length |\n`;
    markdown += `|----------|-------|--------|----------|----------------|\n`;

    results.forEach(result => {
        const status = result.error ? '❌ Error' : '✅ Success';
        const responseLength = result.response?.answer ? `${result.response.answer.length} chars` : 'N/A';
        markdown += `| ${result.config.icon} ${result.config.name} | ${result.config.model} | ${status} | ${result.duration}ms | ${responseLength} |\n`;
    });

    markdown += `\n---\n\n`;

    // Detailed responses
    results.forEach((result, index) => {
        markdown += `## ${result.config.icon} ${result.config.name} (${result.config.model})\n\n`;

        // Add system prompt
        markdown += `### System Prompt:\n\n\`\`\`\n${result.systemPrompt}\n\`\`\`\n\n`;

        if (result.error) {
            markdown += `**❌ Error**: ${result.error}\n\n`;
        } else {
            markdown += `**⏱️ Response Time**: ${result.duration}ms\n`;
            if (result.response.sources && result.response.sources.length > 0) {
                markdown += `**📚 Sources**: ${result.response.sources.join(', ')}\n`;
            }
            markdown += `\n### Response:\n\n${result.response.answer}\n\n`;
        }

        if (index < results.length - 1) {
            markdown += `---\n\n`;
        }
    });

    // Analysis section
    markdown += `## Analysis\n\n`;
    const successful = results.filter(r => !r.error);
    const failed = results.filter(r => r.error);

    if (successful.length > 0) {
        const avgDuration = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
        const fastestProvider = successful.reduce((min, r) => r.duration < min.duration ? r : min);
        const avgResponseLength = successful.reduce((sum, r) => sum + (r.response?.answer?.length || 0), 0) / successful.length;

        markdown += `- **Successful Responses**: ${successful.length}/${results.length}\n`;
        markdown += `- **Average Response Time**: ${Math.round(avgDuration)}ms\n`;
        markdown += `- **Fastest Provider**: ${fastestProvider.config.name} (${fastestProvider.duration}ms)\n`;
        markdown += `- **Average Response Length**: ${Math.round(avgResponseLength)} characters\n`;
    }

    if (failed.length > 0) {
        markdown += `- **Failed Providers**: ${failed.map(r => r.config.name).join(', ')}\n`;
    }

    return markdown;
}

async function ensureOutputDirectory() {
    try {
        await fs.mkdir(OUTPUT_DIR, { recursive: true });
    } catch (error) {
        // Directory already exists, which is fine
    }
}

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log(`
Usage: node test-prompts.js "Your question here"

Example:
  node test-prompts.js "How do I configure authentication in ClientPass?"
  node test-prompts.js "What are the API endpoints for user management?"

This will test the question against all AI providers and generate a comparison report.
`);
        process.exit(1);
    }

    const question = args.join(' ');

    try {
        await ensureOutputDirectory();

        console.log('🧪 AI Provider Prompt Testing Script');
        console.log('=====================================');

        // Run the tests
        const testData = await runParallelTests(question);

        // Generate report
        const markdown = generateMarkdownReport(testData);

        // Save report
        const filename = `test-${Date.now()}.md`;
        const filepath = path.join(OUTPUT_DIR, filename);
        await fs.writeFile(filepath, markdown);

        console.log(`📝 Report saved to: ${filepath}`);
        console.log(`\n🎯 Summary:`);
        console.log(`- Total providers tested: ${testData.results.length}`);
        console.log(`- Successful responses: ${testData.results.filter(r => !r.error).length}`);
        console.log(`- Total test duration: ${testData.totalDuration}ms`);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Test interrupted by user');
    process.exit(0);
});

main();
