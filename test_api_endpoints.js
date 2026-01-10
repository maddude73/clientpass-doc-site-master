#!/usr/bin/env node

// Test script for API endpoints
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5500';

async function testEndpoints() {
    console.log('🧪 Testing API Endpoints...\n');

    // Test 1: Get all documents
    try {
        console.log('1. Testing GET /api/docs');
        const response = await fetch(`${API_BASE}/api/docs`);
        console.log(`   Status: ${response.status}`);
        if (response.ok) {
            const docs = await response.json();
            console.log(`   ✅ Found ${docs.length} documents`);
        } else {
            console.log(`   ❌ Error: ${response.statusText}`);
        }
    } catch (error) {
        console.log(`   ❌ Connection Error: ${error.message}`);
    }

    // Test 2: Search endpoint
    try {
        console.log('\n2. Testing POST /api/docs/search');
        const response = await fetch(`${API_BASE}/api/docs/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: 'How does the architecture work?'
            })
        });
        console.log(`   Status: ${response.status}`);
        if (response.ok) {
            const result = await response.json();
            console.log(`   ✅ Got answer: ${result.answer?.substring(0, 100)}...`);
        } else {
            const error = await response.text();
            console.log(`   ❌ Error: ${error}`);
        }
    } catch (error) {
        console.log(`   ❌ Connection Error: ${error.message}`);
    }

    // Test 3: Test prompt endpoint
    try {
        console.log('\n3. Testing POST /api/test-prompt');
        const response = await fetch(`${API_BASE}/api/test-prompt`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                provider: 'openai',
                config: {
                    apiKey: process.env.OPENAI_API_KEY || 'test-key',
                    systemPrompt: 'You are a helpful assistant.'
                },
                userMessage: 'Hello, this is a test.'
            })
        });
        console.log(`   Status: ${response.status}`);
        if (response.ok) {
            const result = await response.json();
            console.log(`   ✅ Got response: ${result.response?.substring(0, 100)}...`);
        } else {
            const error = await response.text();
            console.log(`   ❌ Error: ${error}`);
        }
    } catch (error) {
        console.log(`   ❌ Connection Error: ${error.message}`);
    }

    console.log('\n🏁 Testing complete!');
}

if (require.main === module) {
    testEndpoints();
}

module.exports = { testEndpoints };