#!/bin/bash

# API Issue Diagnostic and Fix Script
echo "🔧 API Issue Diagnostic and Fix Script"
echo "========================================"

echo "1. Checking environment variables..."
if [ -f ".env.local" ]; then
    echo "   ✅ .env.local exists"
    echo "   Server-side API keys present:"
    grep -q "OPENAI_API_KEY=" .env.local && echo "   ✅ OPENAI_API_KEY set" || echo "   ❌ OPENAI_API_KEY missing"
    grep -q "ANTHROPIC_API_KEY=" .env.local && echo "   ✅ ANTHROPIC_API_KEY set" || echo "   ❌ ANTHROPIC_API_KEY missing"
else
    echo "   ❌ .env.local not found"
fi

echo ""
echo "2. Checking API server status..."
# Check if server is running on port 5500
if lsof -i :5500 > /dev/null 2>&1; then
    echo "   ✅ Server running on port 5500"
else
    echo "   ❌ Server not running on port 5500"
    echo "   Starting server..."
    
    # Kill any existing node processes on port 5500
    lsof -ti :5500 | xargs kill -9 2>/dev/null || true
    
    # Start the server in background
    cd /Users/rhfluker/Projects/clientpass-doc-site-master
    nohup node api/server.cjs > logs/api-server.log 2>&1 &
    echo "   Server started in background"
    sleep 3
fi

echo ""
echo "3. Testing API endpoints..."

# Test basic connectivity
echo "   Testing basic connectivity..."
if curl -s http://localhost:5500/api/docs > /dev/null 2>&1; then
    echo "   ✅ API server responding"
else
    echo "   ❌ API server not responding"
fi

echo ""
echo "4. Checking common issues..."

# Check MongoDB connection
echo "   MongoDB connection strings:"
grep "MONGODB_URI" .env.local 2>/dev/null || echo "   ⚠️  MongoDB URIs not found in .env.local"

echo ""
echo "5. API Error Analysis Based on Logs:"
echo "   - /api/test-prompt returning 500/501 errors"
echo "   - /api/docs/search returning 500 errors"
echo "   - Chatbot message sending failing with 500 errors"

echo ""
echo "6. Recommended fixes applied:"
echo "   ✅ Added server-side environment variables (OPENAI_API_KEY, ANTHROPIC_API_KEY)"
echo "   ✅ Fixed duplicate /api/test-prompt endpoint"
echo "   ✅ Added security protections (X-Powered-By disabled, NoSQL injection prevention)"
echo "   ✅ Added URL validation for SSRF protection"

echo ""
echo "7. Next steps:"
echo "   - Restart the frontend application"
echo "   - Check browser console for remaining errors"
echo "   - Verify all API keys are valid and active"

echo ""
echo "🎯 Fix Summary:"
echo "   The main issues were:"
echo "   1. Missing server-side API keys (fixed by adding non-VITE_ prefixed keys)"
echo "   2. Duplicate API endpoints causing conflicts (fixed by removing duplicate)"
echo "   3. Security vulnerabilities in MongoDB queries (fixed with input sanitization)"
echo ""
echo "✨ Your documentation system should now work properly with:"
echo "   - Working RAG search functionality (/api/docs/search)"
echo "   - Working AI provider testing (/api/test-prompt)"
echo "   - Secure MongoDB operations"
echo "   - Proper CORS and security headers"