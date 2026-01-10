#!/usr/bin/env node

// Test AI Configuration endpoints
const http = require('http');

console.log('🧪 Testing AI Configuration Endpoints...\n');

// Test 1: Update Config endpoint
console.log('1. Testing POST /api/update-config');
const configData = JSON.stringify({
    activeProvider: 'openai',
    configs: {
        openai: {
            apiKey: 'test-key',
            model: 'gpt-4-turbo-preview',
            systemPrompt: 'Test prompt'
        }
    }
});

const configOptions = {
    hostname: 'localhost',
    port: 5500,
    path: '/api/update-config',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(configData)
    }
};

const configReq = http.request(configOptions, (res) => {
    console.log(`   Status: ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        if (res.statusCode === 200) {
            console.log('   ✅ Config update working');
            console.log('   Response:', data.substring(0, 100));
        } else {
            console.log('   ❌ Config update failed');
            console.log('   Error:', data);
        }
        testPromptEndpoint();
    });
}).on('error', (e) => {
    console.error(`   ❌ Connection error: ${e.message}`);
    testPromptEndpoint();
});

configReq.write(configData);
configReq.end();

function testPromptEndpoint() {
    // Test 2: Test Prompt endpoint
    console.log('\n2. Testing POST /api/test-prompt');
    const promptData = JSON.stringify({
        provider: 'openai',
        config: {
            apiKey: process.env.OPENAI_API_KEY || 'test-key',
            model: 'gpt-4-turbo-preview',
            systemPrompt: 'You are a helpful assistant.'
        },
        userMessage: 'Hello, this is a test.'
    });

    const promptOptions = {
        hostname: 'localhost',
        port: 5500,
        path: '/api/test-prompt',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(promptData)
        }
    };

    const promptReq = http.request(promptOptions, (res) => {
        console.log(`   Status: ${res.statusCode}`);

        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            if (res.statusCode === 200) {
                console.log('   ✅ Test prompt working');
            } else {
                console.log('   ❌ Test prompt failed');
                console.log('   Error:', data.substring(0, 200));
            }
            console.log('\n🎯 AI Configuration should now be functional!');
        });
    }).on('error', (e) => {
        console.error(`   ❌ Connection error: ${e.message}`);
    });

    promptReq.write(promptData);
    promptReq.end();
}