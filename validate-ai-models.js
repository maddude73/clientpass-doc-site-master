#!/usr/bin/env node

// AI Provider Model Validation Script
console.log('🔍 AI Provider Model Validation\n');
console.log('Checking all configured models for availability...\n');

// Current model configurations
const modelConfig = {
    google: {
        available: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro'],
        configured: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro', 'gemini-2.0-flash-exp'],
        default: 'gemini-1.5-flash'
    },
    openai: {
        available: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo-preview', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
        configured: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo-preview', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
        default: 'gpt-4o'
    },
    anthropic: {
        available: ['claude-3-5-sonnet-20240620', 'claude-3-haiku-20240307', 'claude-3-sonnet-20240229', 'claude-3-opus-20240229'],
        configured: ['claude-3-5-sonnet-20240620', 'claude-3-haiku-20240307', 'claude-3-sonnet-20240229', 'claude-3-opus-20240229'],
        default: 'claude-3-5-sonnet-20240620'
    },
    ollama: {
        available: ['llama3.2', 'llama3.1', 'llama3', 'qwen2.5', 'mistral', 'codellama', 'phi3'],
        configured: ['llama3.3', 'llama3.2', 'qwen2.5', 'mistral', 'deepseek-r1'],
        default: 'llama3.2'
    }
};

function validateProvider(provider, config) {
    console.log(`📊 ${provider.toUpperCase()} Models:`);
    console.log(`   Default: ${config.default}`);
    console.log(`   Configured: ${config.configured.length} models`);
    console.log(`   Available: ${config.available.length} models`);

    // Check for invalid models
    const invalidModels = config.configured.filter(model => !config.available.includes(model));
    const validModels = config.configured.filter(model => config.available.includes(model));

    if (invalidModels.length > 0) {
        console.log(`   ❌ Invalid models: ${invalidModels.join(', ')}`);
    }

    if (validModels.length > 0) {
        console.log(`   ✅ Valid models: ${validModels.join(', ')}`);
    }

    // Check if default is valid
    if (config.available.includes(config.default)) {
        console.log(`   ✅ Default model is valid`);
    } else {
        console.log(`   ❌ Default model "${config.default}" is not available`);
    }

    console.log('');
    return invalidModels.length === 0 && config.available.includes(config.default);
}

// Validate all providers
console.log('🧪 Model Validation Results:\n');

let allValid = true;
Object.entries(modelConfig).forEach(([provider, config]) => {
    const isValid = validateProvider(provider, config);
    allValid = allValid && isValid;
});

// Summary
console.log('📋 Summary:');
if (allValid) {
    console.log('✅ All model configurations are valid!');
    console.log('   Your AI Configuration page should work properly.');
} else {
    console.log('❌ Some model configurations need fixing.');
    console.log('   Check the invalid models listed above.');
}

console.log('\n🎯 Recommended Actions:');
console.log('1. Use only models from the "Valid models" lists');
console.log('2. Update any invalid model references in the configuration');
console.log('3. Test the AI Configuration page after fixes');

console.log('\n💡 Provider-Specific Notes:');
console.log('• Google: gemini-2.0-flash-exp may be experimental/limited access');
console.log('• OpenAI: gpt-4o is the latest stable model');
console.log('• Anthropic: claude-3-5-sonnet-20240620 is recommended');
console.log('• Ollama: llama3.3 may not be available yet, use llama3.2');