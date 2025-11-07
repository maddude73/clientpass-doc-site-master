/**
 * AI Gateway Service
 * 
 * Centralized AI service layer that abstracts the underlying AI provider.
 * This allows for easy switching between different AI providers (OpenAI, Anthropic, Google, etc.)
 * and provides consistent error handling, rate limiting, and caching.
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

// AI Provider types
export type AIProvider = 'google' | 'openai' | 'anthropic';

// Configuration interface
export interface AIGatewayConfig {
    provider: AIProvider;
    apiKey: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
}

// Request/Response interfaces
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface ChatRequest {
    messages: ChatMessage[];
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
}

export interface ChatResponse {
    content: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    model: string;
    finishReason?: string;
}

export interface EmbeddingRequest {
    text: string | string[];
    model?: string;
}

export interface EmbeddingResponse {
    embeddings: number[][];
    model: string;
    usage?: {
        totalTokens: number;
    };
}

/**
 * Main AI Gateway class
 */
export class AIGateway {
    private config: AIGatewayConfig;
    private googleAI?: GoogleGenerativeAI;
    private chatModel?: GenerativeModel;
    private embeddingModel?: GenerativeModel;

    constructor(config: AIGatewayConfig) {
        this.config = {
            model: 'gemini-2.0-flash-exp',
            temperature: 0.7,
            maxTokens: 8192,
            ...config,
        };

        this.initializeProvider();
    }

    /**
     * Initialize the AI provider based on configuration
     */
    private initializeProvider(): void {
        switch (this.config.provider) {
            case 'google':
                this.googleAI = new GoogleGenerativeAI(this.config.apiKey);
                this.chatModel = this.googleAI.getGenerativeModel({
                    model: this.config.model || 'gemini-2.0-flash-exp'
                });
                this.embeddingModel = this.googleAI.getGenerativeModel({
                    model: 'text-embedding-004'
                });
                break;
            case 'openai':
                // TODO: Implement OpenAI provider
                throw new Error('OpenAI provider not yet implemented');
            case 'anthropic':
                // TODO: Implement Anthropic provider
                throw new Error('Anthropic provider not yet implemented');
            default:
                throw new Error(`Unsupported AI provider: ${this.config.provider}`);
        }
    }

    /**
     * Send a chat completion request
     */
    async chat(request: ChatRequest): Promise<ChatResponse> {
        try {
            switch (this.config.provider) {
                case 'google':
                    return await this.googleChat(request);
                case 'openai':
                    throw new Error('OpenAI provider not yet implemented');
                case 'anthropic':
                    throw new Error('Anthropic provider not yet implemented');
                default:
                    throw new Error(`Unsupported AI provider: ${this.config.provider}`);
            }
        } catch (error) {
            console.error('AI Gateway chat error:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Google-specific chat implementation
     */
    private async googleChat(request: ChatRequest): Promise<ChatResponse> {
        if (!this.chatModel) {
            throw new Error('Google chat model not initialized');
        }

        // Convert messages to Google format
        const history = request.messages
            .filter(msg => msg.role !== 'system')
            .map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }],
            }));

        // Extract system message if present
        const systemMessage = request.messages.find(msg => msg.role === 'system');
        const systemInstruction = systemMessage?.content;

        // Get the last user message
        const lastMessage = request.messages[request.messages.length - 1];
        if (lastMessage.role !== 'user') {
            throw new Error('Last message must be from user');
        }

        // Create chat session
        const chat = this.chatModel.startChat({
            history: history.slice(0, -1),
            generationConfig: {
                temperature: request.temperature ?? this.config.temperature,
                maxOutputTokens: request.maxTokens ?? this.config.maxTokens,
            },
            ...(systemInstruction && { systemInstruction }),
        });

        // Send message
        const result = await chat.sendMessage(lastMessage.content);
        const response = result.response;
        const text = response.text();

        return {
            content: text,
            model: this.config.model || 'gemini-2.0-flash-exp',
            usage: response.usageMetadata ? {
                promptTokens: response.usageMetadata.promptTokenCount || 0,
                completionTokens: response.usageMetadata.candidatesTokenCount || 0,
                totalTokens: response.usageMetadata.totalTokenCount || 0,
            } : undefined,
            finishReason: response.candidates?.[0]?.finishReason,
        };
    }

    /**
     * Generate embeddings for text
     */
    async embedText(request: EmbeddingRequest): Promise<EmbeddingResponse> {
        try {
            switch (this.config.provider) {
                case 'google':
                    return await this.googleEmbedText(request);
                case 'openai':
                    throw new Error('OpenAI provider not yet implemented');
                case 'anthropic':
                    throw new Error('Anthropic does not support embeddings');
                default:
                    throw new Error(`Unsupported AI provider: ${this.config.provider}`);
            }
        } catch (error) {
            console.error('AI Gateway embedding error:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Google-specific embedding implementation
     */
    private async googleEmbedText(request: EmbeddingRequest): Promise<EmbeddingResponse> {
        if (!this.embeddingModel) {
            throw new Error('Google embedding model not initialized');
        }

        const texts = Array.isArray(request.text) ? request.text : [request.text];

        if (texts.length === 1) {
            // Single embedding
            const result = await this.embeddingModel.embedContent(texts[0]);

            return {
                embeddings: [result.embedding.values],
                model: 'text-embedding-004',
            };
        } else {
            // Batch embeddings
            const result = await this.embeddingModel.batchEmbedContents({
                requests: texts.map(text => ({
                    content: { role: 'user', parts: [{ text }] }
                }))
            });

            return {
                embeddings: result.embeddings.map(e => e.values),
                model: 'text-embedding-004',
            };
        }
    }

    /**
     * Handle errors and provide user-friendly messages
     */
    private handleError(error: any): Error {
        if (error.message?.includes('API key')) {
            return new Error('AI service authentication failed. Please check your API key.');
        }
        if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
            return new Error('AI service rate limit exceeded. Please try again later.');
        }
        if (error.message?.includes('timeout')) {
            return new Error('AI service request timed out. Please try again.');
        }
        return error instanceof Error ? error : new Error('Unknown AI service error');
    }

    /**
     * Test connection to the AI provider
     */
    async testConnection(): Promise<boolean> {
        try {
            const response = await this.chat({
                messages: [{ role: 'user', content: 'Test' }],
                maxTokens: 10,
            });
            return response.content.length > 0;
        } catch {
            return false;
        }
    }

    /**
     * Get provider information
     */
    getProviderInfo(): { provider: AIProvider; model: string } {
        return {
            provider: this.config.provider,
            model: this.config.model || 'unknown',
        };
    }
}

/**
 * Singleton instance for easy access throughout the application
 */
let gatewayInstance: AIGateway | null = null;

/**
 * Initialize the AI Gateway with configuration
 */
export function initializeAIGateway(config: AIGatewayConfig): AIGateway {
    gatewayInstance = new AIGateway(config);
    return gatewayInstance;
}

/**
 * Get the singleton AI Gateway instance
 */
export function getAIGateway(): AIGateway {
    if (!gatewayInstance) {
        throw new Error('AI Gateway not initialized. Call initializeAIGateway() first.');
    }
    return gatewayInstance;
}

/**
 * Helper function to create a chat request from a simple prompt
 */
export function createChatRequest(
    prompt: string,
    systemPrompt?: string,
    options?: Partial<ChatRequest>
): ChatRequest {
    const messages: ChatMessage[] = [];

    if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    return {
        messages,
        ...options,
    };
}

export default AIGateway;
