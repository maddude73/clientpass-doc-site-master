/**
 * AI Gateway Initialization
 * 
 * Handles initialization of the AI Gateway service
 */

import { initializeAIGateway, AIGatewayConfig } from './aiGateway';

/**
 * Initialize AI Gateway from environment variables
 */
export function initializeAIGatewayFromEnv(): void {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

    if (!apiKey) {
        console.warn('AI Gateway: VITE_GOOGLE_API_KEY not found in environment variables');
        return;
    }

    const config: AIGatewayConfig = {
        provider: 'google',
        apiKey,
        model: import.meta.env.VITE_GEMINI_MODEL_ID || 'gemini-2.0-flash-exp',
        temperature: parseFloat(import.meta.env.VITE_AI_TEMPERATURE || '0.7'),
        maxTokens: parseInt(import.meta.env.VITE_AI_MAX_TOKENS || '8192'),
    };

    try {
        const gateway = initializeAIGateway(config);
        console.log('AI Gateway initialized successfully:', gateway.getProviderInfo());
    } catch (error) {
        console.error('Failed to initialize AI Gateway:', error);
    }
}

/**
 * Check if AI Gateway is properly configured
 */
export function isAIGatewayConfigured(): boolean {
    return !!import.meta.env.VITE_GOOGLE_API_KEY;
}
