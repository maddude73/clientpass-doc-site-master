/**
 * React Hook for AI Gateway
 * 
 * Provides easy access to AI capabilities in React components
 */

import { useState, useCallback, useEffect } from 'react';
import {
    getAIGateway,
    ChatRequest,
    ChatResponse,
    EmbeddingRequest,
    EmbeddingResponse
} from '../services/aiGateway';

export interface UseAIChatOptions {
    onSuccess?: (response: ChatResponse) => void;
    onError?: (error: Error) => void;
    autoRetry?: boolean;
    maxRetries?: number;
}

export interface UseAIChatResult {
    sendMessage: (prompt: string, systemPrompt?: string) => Promise<ChatResponse | null>;
    chat: (request: ChatRequest) => Promise<ChatResponse | null>;
    response: ChatResponse | null;
    isLoading: boolean;
    error: Error | null;
    reset: () => void;
}

/**
 * Hook for AI chat functionality
 */
export function useAIChat(options: UseAIChatOptions = {}): UseAIChatResult {
    const [response, setResponse] = useState<ChatResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const { onSuccess, onError, autoRetry = false, maxRetries = 3 } = options;

    const chat = useCallback(async (request: ChatRequest, retryCount = 0): Promise<ChatResponse | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const gateway = getAIGateway();
            const result = await gateway.chat(request);

            setResponse(result);
            setIsLoading(false);

            if (onSuccess) {
                onSuccess(result);
            }

            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Unknown error');

            // Retry logic
            if (autoRetry && retryCount < maxRetries) {
                console.log(`Retrying AI request (attempt ${retryCount + 1}/${maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
                return chat(request, retryCount + 1);
            }

            setError(error);
            setIsLoading(false);

            if (onError) {
                onError(error);
            }

            return null;
        }
    }, [onSuccess, onError, autoRetry, maxRetries]);

    const sendMessage = useCallback(async (
        prompt: string,
        systemPrompt?: string
    ): Promise<ChatResponse | null> => {
        const messages: ChatRequest['messages'] = [];

        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }

        messages.push({ role: 'user', content: prompt });

        return chat({ messages });
    }, [chat]);

    const reset = useCallback(() => {
        setResponse(null);
        setError(null);
        setIsLoading(false);
    }, []);

    return {
        sendMessage,
        chat,
        response,
        isLoading,
        error,
        reset,
    };
}

export interface UseAIEmbeddingOptions {
    onSuccess?: (response: EmbeddingResponse) => void;
    onError?: (error: Error) => void;
}

export interface UseAIEmbeddingResult {
    embedText: (text: string | string[]) => Promise<EmbeddingResponse | null>;
    embeddings: number[][] | null;
    isLoading: boolean;
    error: Error | null;
    reset: () => void;
}

/**
 * Hook for AI embedding functionality
 */
export function useAIEmbedding(options: UseAIEmbeddingOptions = {}): UseAIEmbeddingResult {
    const [embeddings, setEmbeddings] = useState<number[][] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const { onSuccess, onError } = options;

    const embedText = useCallback(async (text: string | string[]): Promise<EmbeddingResponse | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const gateway = getAIGateway();
            const result = await gateway.embedText({ text });

            setEmbeddings(result.embeddings);
            setIsLoading(false);

            if (onSuccess) {
                onSuccess(result);
            }

            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Unknown error');
            setError(error);
            setIsLoading(false);

            if (onError) {
                onError(error);
            }

            return null;
        }
    }, [onSuccess, onError]);

    const reset = useCallback(() => {
        setEmbeddings(null);
        setError(null);
        setIsLoading(false);
    }, []);

    return {
        embedText,
        embeddings,
        isLoading,
        error,
        reset,
    };
}

export interface UseAIStreamOptions {
    onChunk?: (chunk: string) => void;
    onComplete?: (fullResponse: string) => void;
    onError?: (error: Error) => void;
}

export interface UseAIStreamResult {
    streamMessage: (prompt: string, systemPrompt?: string) => Promise<void>;
    content: string;
    isStreaming: boolean;
    error: Error | null;
    reset: () => void;
}

/**
 * Hook for AI streaming functionality (placeholder for future implementation)
 */
export function useAIStream(options: UseAIStreamOptions = {}): UseAIStreamResult {
    const [content, setContent] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const { onChunk, onComplete, onError } = options;

    const streamMessage = useCallback(async (
        prompt: string,
        systemPrompt?: string
    ): Promise<void> => {
        setIsStreaming(true);
        setError(null);
        setContent('');

        try {
            // TODO: Implement streaming when Google AI SDK supports it
            // For now, fall back to regular chat
            const gateway = getAIGateway();
            const messages: ChatRequest['messages'] = [];

            if (systemPrompt) {
                messages.push({ role: 'system', content: systemPrompt });
            }

            messages.push({ role: 'user', content: prompt });

            const result = await gateway.chat({ messages });

            setContent(result.content);
            setIsStreaming(false);

            if (onComplete) {
                onComplete(result.content);
            }
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Unknown error');
            setError(error);
            setIsStreaming(false);

            if (onError) {
                onError(error);
            }
        }
    }, [onChunk, onComplete, onError]);

    const reset = useCallback(() => {
        setContent('');
        setError(null);
        setIsStreaming(false);
    }, []);

    return {
        streamMessage,
        content,
        isStreaming,
        error,
        reset,
    };
}

/**
 * Hook to check AI Gateway connection status
 */
export function useAIGatewayStatus() {
    const [isConnected, setIsConnected] = useState<boolean | null>(null);
    const [isChecking, setIsChecking] = useState(false);

    const checkConnection = useCallback(async () => {
        setIsChecking(true);
        try {
            const gateway = getAIGateway();
            const connected = await gateway.testConnection();
            setIsConnected(connected);
        } catch {
            setIsConnected(false);
        } finally {
            setIsChecking(false);
        }
    }, []);

    useEffect(() => {
        checkConnection();
    }, [checkConnection]);

    return {
        isConnected,
        isChecking,
        checkConnection,
    };
}
