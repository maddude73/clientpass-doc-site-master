/**
 * AI Chat Example Component
 * 
 * Demonstrates how to use the AI Gateway with React hooks
 */

import { useState } from 'react';
import { useAIChat, useAIGatewayStatus } from '../hooks/useAIGateway';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export function AIChatExample() {
    const [prompt, setPrompt] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('You are a helpful assistant.');

    const { isConnected, isChecking } = useAIGatewayStatus();

    const { sendMessage, response, isLoading, error, reset } = useAIChat({
        onSuccess: (response) => {
            console.log('AI Response received:', response);
        },
        onError: (error) => {
            console.error('AI Error:', error);
        },
        autoRetry: true,
        maxRetries: 3,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        await sendMessage(prompt, systemPrompt);
    };

    const handleReset = () => {
        setPrompt('');
        reset();
    };

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>AI Gateway Example</CardTitle>
                        <CardDescription>
                            Test the AI Gateway integration with Google Gemini
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        {isChecking ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isConnected ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm text-muted-foreground">
                            {isChecking ? 'Checking...' : isConnected ? 'Connected' : 'Disconnected'}
                        </span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error.message}</AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">System Prompt (Optional)</label>
                        <Textarea
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            placeholder="Set the AI's behavior and context..."
                            className="min-h-[80px]"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Your Message</label>
                        <Textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Enter your message here..."
                            className="min-h-[120px]"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button
                            type="submit"
                            disabled={isLoading || !prompt.trim() || !isConnected}
                            className="flex-1"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                'Send Message'
                            )}
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleReset}
                            disabled={isLoading}
                        >
                            Reset
                        </Button>
                    </div>
                </form>

                {response && (
                    <div className="space-y-2 pt-4 border-t">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">AI Response</label>
                            <div className="flex gap-4 text-xs text-muted-foreground">
                                <span>Model: {response.model}</span>
                                {response.usage && (
                                    <span>Tokens: {response.usage.totalTokens}</span>
                                )}
                            </div>
                        </div>
                        <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                            {response.content}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default AIChatExample;
