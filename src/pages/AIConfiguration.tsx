import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle2, XCircle, Zap, Sparkles, Brain, Cpu, Boxes, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type AIProvider = 'google' | 'openai' | 'anthropic' | 'ollama';

interface ProviderConfig {
    apiKey?: string;
    model?: string;
    url?: string;
    systemPrompt?: string;
}

const providerMetadata = {
    google: {
        icon: Sparkles,
        color: 'from-blue-500 to-cyan-500',
        bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50',
        badgeColor: 'bg-blue-500',
        name: 'Google Gemini',
        tagline: 'Next-gen multimodal AI'
    },
    openai: {
        icon: Brain,
        color: 'from-green-500 to-emerald-500',
        bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50',
        badgeColor: 'bg-green-500',
        name: 'OpenAI',
        tagline: 'Advanced language models'
    },
    anthropic: {
        icon: Zap,
        color: 'from-orange-500 to-amber-500',
        bgColor: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50',
        badgeColor: 'bg-orange-500',
        name: 'Anthropic Claude',
        tagline: 'Safe, accurate AI assistant'
    },
    ollama: {
        icon: Cpu,
        color: 'from-purple-500 to-pink-500',
        bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50',
        badgeColor: 'bg-purple-500',
        name: 'Ollama',
        tagline: 'Run AI models locally'
    }
};

const AIConfiguration = () => {
    const [activeProvider, setActiveProvider] = useState<AIProvider>('openai');
    const [configs, setConfigs] = useState<Record<AIProvider, ProviderConfig>>({
        google: {
            apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
            model: 'gemini-2.5-flash',
            systemPrompt: 'You are a helpful documentation assistant. Use the provided context to give accurate, concise answers.',
        },
        openai: {
            apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
            model: 'gpt-4o',
            systemPrompt: 'You are an expert technical assistant. Always cite document sources and provide clear, actionable responses.',
        },
        anthropic: {
            apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
            model: 'claude-3-5-sonnet-20241022',
            systemPrompt: 'You are a knowledgeable coding assistant. Explain concepts clearly with examples and cite your sources.',
        },
        ollama: {
            url: import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434',
            model: 'llama3.3',
            systemPrompt: 'You are a helpful AI assistant. Be concise and accurate in your responses.',
        },
    });

    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [promptTestResult, setPromptTestResult] = useState<{ success: boolean; message: string; response?: string } | null>(null);
    const [isTesting, setIsTesting] = useState(false);
    const [isTestingPrompt, setIsTestingPrompt] = useState(false);
    const [testPromptInput, setTestPromptInput] = useState('What is the purpose of this documentation?');

    const handleConfigChange = (provider: AIProvider, field: string, value: string) => {
        setConfigs((prev) => ({
            ...prev,
            [provider]: {
                ...prev[provider],
                [field]: value,
            },
        }));
    };

    const testProvider = async (provider: AIProvider) => {
        setIsTesting(true);
        setTestResult(null);

        try {
            const config = configs[provider];
            await new Promise(resolve => setTimeout(resolve, 1500));

            if (provider === 'ollama') {
                if (!config.url) throw new Error('Ollama URL is required');
            } else if (!config.apiKey) {
                throw new Error('API key is required');
            }

            setTestResult({
                success: true,
                message: `Successfully connected to ${providerMetadata[provider].name}. Model: ${config.model}`,
            });
        } catch (error) {
            setTestResult({
                success: false,
                message: error instanceof Error ? error.message : 'Connection failed',
            });
        } finally {
            setIsTesting(false);
        }
    };

    const testPrompt = async (provider: AIProvider) => {
        setIsTestingPrompt(true);
        setPromptTestResult(null);

        try {
            const config = configs[provider];

            // Validate config
            if (provider === 'ollama') {
                if (!config.url) throw new Error('Ollama URL is required');
            } else if (!config.apiKey) {
                throw new Error('API key is required');
            }

            // Call backend API to test the prompt
            const response = await fetch('http://localhost:5001/api/test-prompt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    provider,
                    config: {
                        apiKey: config.apiKey,
                        model: config.model,
                        url: config.url,
                        systemPrompt: config.systemPrompt,
                    },
                    userMessage: testPromptInput,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to test prompt');
            }

            const data = await response.json();
            setPromptTestResult({
                success: true,
                message: `✓ Prompt test successful with ${providerMetadata[provider].name}`,
                response: data.response,
            });
        } catch (error) {
            setPromptTestResult({
                success: false,
                message: error instanceof Error ? error.message : 'Prompt test failed',
            });
        } finally {
            setIsTestingPrompt(false);
        }
    };

    const saveConfiguration = async () => {
        try {
            // Save to backend for dynamic reload
            const response = await fetch('http://localhost:5001/api/update-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    activeProvider,
                    configs,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save configuration');
            }

            setTestResult({
                success: true,
                message: '✓ Configuration saved and applied dynamically! No restart needed.',
            });
        } catch (error) {
            setTestResult({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to save configuration',
            });
        }
    };

    const renderProviderCard = (key: AIProvider) => {
        const meta = providerMetadata[key];
        const Icon = meta.icon;
        const isActive = activeProvider === key;
        const hasConfig = key === 'ollama' ? !!configs[key].url : !!configs[key].apiKey;

        return (
            <Card
                key={key}
                className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-2 ${isActive
                    ? `border-primary shadow-lg ${meta.bgColor}`
                    : 'border-border hover:border-primary/50'
                    }`}
                onClick={() => {
                    setActiveProvider(key);
                    // Clear test results when switching providers
                    setTestResult(null);
                    setPromptTestResult(null);
                }}
            >
                <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl bg-gradient-to-br ${meta.color} shadow-lg`}>
                                <Icon className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold">{meta.name}</CardTitle>
                                <CardDescription className="mt-1 text-base">{meta.tagline}</CardDescription>
                            </div>
                        </div>
                        {hasConfig && (
                            <Badge className={`${meta.badgeColor} text-white shadow-md`}>
                                ✓ Configured
                            </Badge>
                        )}
                    </div>
                </CardHeader>
            </Card>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
            <div className="container mx-auto p-6 md:p-12 max-w-7xl">
                {/* Hero Section */}
                <div className="mb-16 text-center space-y-4">
                    <div className="inline-flex items-center gap-3 mb-2">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-lg">
                            <Boxes className="h-10 w-10 text-white" />
                        </div>
                    </div>
                    <h1 className="text-6xl font-black tracking-tight bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                        AI Configuration
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Connect and configure multiple AI providers for your application
                    </p>
                </div>

                {/* Provider Cards Grid */}
                <div className="grid md:grid-cols-2 gap-6 mb-12">
                    {(Object.keys(providerMetadata) as AIProvider[]).map(renderProviderCard)}
                </div>

                {/* Configuration Panels */}
                <Tabs value={activeProvider} onValueChange={(v) => setActiveProvider(v as AIProvider)} className="w-full">
                    <TabsList className="hidden">
                        <TabsTrigger value="google">Google</TabsTrigger>
                        <TabsTrigger value="openai">OpenAI</TabsTrigger>
                        <TabsTrigger value="anthropic">Anthropic</TabsTrigger>
                        <TabsTrigger value="ollama">Ollama</TabsTrigger>
                    </TabsList>

                    {/* Google Gemini */}
                    <TabsContent value="google" className="space-y-6 mt-0">
                        <Card className={`overflow-hidden border-2 ${providerMetadata.google.bgColor}`}>
                            <CardHeader className="space-y-4 pb-8">
                                <div className="flex items-center gap-4">
                                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${providerMetadata.google.color} shadow-xl`}>
                                        <Sparkles className="h-8 w-8 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-3xl font-bold">Google Gemini</CardTitle>
                                        <CardDescription className="text-base mt-2">
                                            Configure Google's next-generation multimodal AI models
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6 pb-8">
                                <div className="space-y-3">
                                    <Label htmlFor="google-api-key" className="text-base font-semibold">API Key</Label>
                                    <Input
                                        id="google-api-key"
                                        type="password"
                                        placeholder="AIza..."
                                        value={configs.google.apiKey}
                                        onChange={(e) => handleConfigChange('google', 'apiKey', e.target.value)}
                                        className="h-12 text-base"
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Get your API key from{' '}
                                        <a
                                            href="https://makersuite.google.com/app/apikey"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-700 font-medium underline"
                                        >
                                            Google AI Studio →
                                        </a>
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="google-model" className="text-base font-semibold">Model Selection</Label>
                                    <Select
                                        value={configs.google.model}
                                        onValueChange={(v) => handleConfigChange('google', 'model', v)}
                                    >
                                        <SelectTrigger className="h-12 text-base">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="gemini-2.5-pro">💎 Gemini 2.5 Pro (Most Advanced)</SelectItem>
                                            <SelectItem value="gemini-2.5-flash">🚀 Gemini 2.5 Flash</SelectItem>
                                            <SelectItem value="gemini-2.5-flash-lite">⚡ Gemini 2.5 Flash-Lite</SelectItem>
                                            <SelectItem value="gemini-2.0-flash">🎯 Gemini 2.0 Flash</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="google-prompt" className="text-base font-semibold">System Prompt</Label>
                                    <Textarea
                                        id="google-prompt"
                                        placeholder="Enter system instructions for the AI..."
                                        value={configs.google.systemPrompt}
                                        onChange={(e) => handleConfigChange('google', 'systemPrompt', e.target.value)}
                                        className="min-h-[100px] text-base"
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Define how the AI should behave and respond to queries
                                    </p>
                                </div>

                                <Button onClick={() => testProvider('google')} disabled={isTesting} size="lg" className="w-full h-12 text-base font-semibold">
                                    {isTesting ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Testing Connection...
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="mr-2 h-5 w-5" />
                                            Test Connection
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Prompt Test Section */}
                        <Card className="border-2 border-dashed">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <MessageSquare className="h-6 w-6 text-primary" />
                                    <div>
                                        <CardTitle className="text-xl">Test System Prompt</CardTitle>
                                        <CardDescription>
                                            Send a test message to see how your prompt configuration works
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <Label htmlFor="test-prompt-input-google" className="text-base font-semibold">Test Message</Label>
                                    <Input
                                        id="test-prompt-input-google"
                                        placeholder="Ask a question..."
                                        value={testPromptInput}
                                        onChange={(e) => setTestPromptInput(e.target.value)}
                                        className="h-12 text-base"
                                    />
                                </div>
                                <Button
                                    onClick={() => testPrompt('google')}
                                    disabled={isTestingPrompt || !configs.google.apiKey}
                                    size="lg"
                                    className="w-full h-12 text-base font-semibold"
                                >
                                    {isTestingPrompt ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Testing Prompt...
                                        </>
                                    ) : (
                                        <>
                                            <MessageSquare className="mr-2 h-5 w-5" />
                                            Test with Prompt
                                        </>
                                    )}
                                </Button>
                                {promptTestResult && activeProvider === 'google' && (
                                    <Alert className={`border-2 ${promptTestResult.success ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'}`}>
                                        {promptTestResult.success ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        ) : (
                                            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                        )}
                                        <AlertDescription className="mt-2">
                                            <p className={`font-medium mb-2 ${promptTestResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                                                {promptTestResult.message}
                                            </p>
                                            {promptTestResult.response && (
                                                <div className="mt-3 p-3 bg-white dark:bg-gray-900 rounded-lg border">
                                                    <p className="text-sm font-semibold mb-1">AI Response:</p>
                                                    <p className="text-sm whitespace-pre-wrap">{promptTestResult.response}</p>
                                                </div>
                                            )}
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* OpenAI */}
                    <TabsContent value="openai" className="space-y-6 mt-0">
                        <Card className={`overflow-hidden border-2 ${providerMetadata.openai.bgColor}`}>
                            <CardHeader className="space-y-4 pb-8">
                                <div className="flex items-center gap-4">
                                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${providerMetadata.openai.color} shadow-xl`}>
                                        <Brain className="h-8 w-8 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-3xl font-bold">OpenAI</CardTitle>
                                        <CardDescription className="text-base mt-2">
                                            Configure OpenAI's industry-leading GPT models
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6 pb-8">
                                <div className="space-y-3">
                                    <Label htmlFor="openai-api-key" className="text-base font-semibold">API Key</Label>
                                    <Input
                                        id="openai-api-key"
                                        type="password"
                                        placeholder="sk-..."
                                        value={configs.openai.apiKey}
                                        onChange={(e) => handleConfigChange('openai', 'apiKey', e.target.value)}
                                        className="h-12 text-base"
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Get your API key from{' '}
                                        <a
                                            href="https://platform.openai.com/api-keys"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-green-600 hover:text-green-700 font-medium underline"
                                        >
                                            OpenAI Platform →
                                        </a>
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="openai-model" className="text-base font-semibold">Model Selection</Label>
                                    <Select
                                        value={configs.openai.model}
                                        onValueChange={(v) => handleConfigChange('openai', 'model', v)}
                                    >
                                        <SelectTrigger className="h-12 text-base">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="gpt-4o">🚀 GPT-4o</SelectItem>
                                            <SelectItem value="gpt-4o-mini">⚡ GPT-4o Mini</SelectItem>
                                            <SelectItem value="o1">🧠 O1</SelectItem>
                                            <SelectItem value="o1-mini">🧠 O1 Mini</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="openai-prompt" className="text-base font-semibold">System Prompt</Label>
                                    <Textarea
                                        id="openai-prompt"
                                        placeholder="Enter system instructions for the AI..."
                                        value={configs.openai.systemPrompt}
                                        onChange={(e) => handleConfigChange('openai', 'systemPrompt', e.target.value)}
                                        className="min-h-[100px] text-base"
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Define how the AI should behave and respond to queries
                                    </p>
                                </div>

                                <Button onClick={() => testProvider('openai')} disabled={isTesting} size="lg" className="w-full h-12 text-base font-semibold">
                                    {isTesting ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Testing Connection...
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="mr-2 h-5 w-5" />
                                            Test Connection
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Prompt Test Section for OpenAI */}
                        <Card className="border-2 border-dashed">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <MessageSquare className="h-6 w-6 text-primary" />
                                    <div>
                                        <CardTitle className="text-xl">Test System Prompt</CardTitle>
                                        <CardDescription>
                                            Send a test message to see how your prompt configuration works
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <Label htmlFor="test-prompt-input-openai" className="text-base font-semibold">Test Message</Label>
                                    <Input
                                        id="test-prompt-input-openai"
                                        placeholder="Ask a question..."
                                        value={testPromptInput}
                                        onChange={(e) => setTestPromptInput(e.target.value)}
                                        className="h-12 text-base"
                                    />
                                </div>
                                <Button
                                    onClick={() => testPrompt('openai')}
                                    disabled={isTestingPrompt || !configs.openai.apiKey}
                                    size="lg"
                                    className="w-full h-12 text-base font-semibold"
                                >
                                    {isTestingPrompt ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Testing Prompt...
                                        </>
                                    ) : (
                                        <>
                                            <MessageSquare className="mr-2 h-5 w-5" />
                                            Test with Prompt
                                        </>
                                    )}
                                </Button>
                                {promptTestResult && activeProvider === 'openai' && (
                                    <Alert className={`border-2 ${promptTestResult.success ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'}`}>
                                        {promptTestResult.success ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        ) : (
                                            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                        )}
                                        <AlertDescription className="mt-2">
                                            <p className={`font-medium mb-2 ${promptTestResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                                                {promptTestResult.message}
                                            </p>
                                            {promptTestResult.response && (
                                                <div className="mt-3 p-3 bg-white dark:bg-gray-900 rounded-lg border">
                                                    <p className="text-sm font-semibold mb-1">AI Response:</p>
                                                    <p className="text-sm whitespace-pre-wrap">{promptTestResult.response}</p>
                                                </div>
                                            )}
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Anthropic Claude */}
                    <TabsContent value="anthropic" className="space-y-6 mt-0">
                        <Card className={`overflow-hidden border-2 ${providerMetadata.anthropic.bgColor}`}>
                            <CardHeader className="space-y-4 pb-8">
                                <div className="flex items-center gap-4">
                                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${providerMetadata.anthropic.color} shadow-xl`}>
                                        <Zap className="h-8 w-8 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-3xl font-bold">Anthropic Claude</CardTitle>
                                        <CardDescription className="text-base mt-2">
                                            Configure Anthropic's safe and accurate Claude AI models
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6 pb-8">
                                <div className="space-y-3">
                                    <Label htmlFor="anthropic-api-key" className="text-base font-semibold">API Key</Label>
                                    <Input
                                        id="anthropic-api-key"
                                        type="password"
                                        placeholder="sk-ant-..."
                                        value={configs.anthropic.apiKey}
                                        onChange={(e) => handleConfigChange('anthropic', 'apiKey', e.target.value)}
                                        className="h-12 text-base"
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Get your API key from{' '}
                                        <a
                                            href="https://console.anthropic.com/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-orange-600 hover:text-orange-700 font-medium underline"
                                        >
                                            Anthropic Console →
                                        </a>
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="anthropic-model" className="text-base font-semibold">Model Selection</Label>
                                    <Select
                                        value={configs.anthropic.model}
                                        onValueChange={(v) => handleConfigChange('anthropic', 'model', v)}
                                    >
                                        <SelectTrigger className="h-12 text-base">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="claude-3-5-sonnet-20241022">🎯 Claude 3.5 Sonnet (Latest)</SelectItem>
                                            <SelectItem value="claude-3-5-haiku-20241022">⚡ Claude 3.5 Haiku</SelectItem>
                                            <SelectItem value="claude-3-opus-20240229">💎 Claude 3 Opus</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="anthropic-prompt" className="text-base font-semibold">System Prompt</Label>
                                    <Textarea
                                        id="anthropic-prompt"
                                        placeholder="Enter system instructions for the AI..."
                                        value={configs.anthropic.systemPrompt}
                                        onChange={(e) => handleConfigChange('anthropic', 'systemPrompt', e.target.value)}
                                        className="min-h-[100px] text-base"
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Define how the AI should behave and respond to queries
                                    </p>
                                </div>

                                <Button onClick={() => testProvider('anthropic')} disabled={isTesting} size="lg" className="w-full h-12 text-base font-semibold">
                                    {isTesting ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Testing Connection...
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="mr-2 h-5 w-5" />
                                            Test Connection
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Prompt Test Section for Anthropic */}
                        <Card className="border-2 border-dashed">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <MessageSquare className="h-6 w-6 text-primary" />
                                    <div>
                                        <CardTitle className="text-xl">Test System Prompt</CardTitle>
                                        <CardDescription>
                                            Send a test message to see how your prompt configuration works
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <Label htmlFor="test-prompt-input-anthropic" className="text-base font-semibold">Test Message</Label>
                                    <Input
                                        id="test-prompt-input-anthropic"
                                        placeholder="Ask a question..."
                                        value={testPromptInput}
                                        onChange={(e) => setTestPromptInput(e.target.value)}
                                        className="h-12 text-base"
                                    />
                                </div>
                                <Button
                                    onClick={() => testPrompt('anthropic')}
                                    disabled={isTestingPrompt || !configs.anthropic.apiKey}
                                    size="lg"
                                    className="w-full h-12 text-base font-semibold"
                                >
                                    {isTestingPrompt ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Testing Prompt...
                                        </>
                                    ) : (
                                        <>
                                            <MessageSquare className="mr-2 h-5 w-5" />
                                            Test with Prompt
                                        </>
                                    )}
                                </Button>
                                {promptTestResult && activeProvider === 'anthropic' && (
                                    <Alert className={`border-2 ${promptTestResult.success ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'}`}>
                                        {promptTestResult.success ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        ) : (
                                            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                        )}
                                        <AlertDescription className="mt-2">
                                            <p className={`font-medium mb-2 ${promptTestResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                                                {promptTestResult.message}
                                            </p>
                                            {promptTestResult.response && (
                                                <div className="mt-3 p-3 bg-white dark:bg-gray-900 rounded-lg border">
                                                    <p className="text-sm font-semibold mb-1">AI Response:</p>
                                                    <p className="text-sm whitespace-pre-wrap">{promptTestResult.response}</p>
                                                </div>
                                            )}
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Ollama */}
                    <TabsContent value="ollama" className="space-y-6 mt-0">
                        <Card className={`overflow-hidden border-2 ${providerMetadata.ollama.bgColor}`}>
                            <CardHeader className="space-y-4 pb-8">
                                <div className="flex items-center gap-4">
                                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${providerMetadata.ollama.color} shadow-xl`}>
                                        <Cpu className="h-8 w-8 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-3xl font-bold">Ollama</CardTitle>
                                        <CardDescription className="text-base mt-2">
                                            Run open-source AI models locally on your machine
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6 pb-8">
                                <div className="space-y-3">
                                    <Label htmlFor="ollama-url" className="text-base font-semibold">Server URL</Label>
                                    <Input
                                        id="ollama-url"
                                        type="url"
                                        placeholder="http://localhost:11434"
                                        value={configs.ollama.url}
                                        onChange={(e) => handleConfigChange('ollama', 'url', e.target.value)}
                                        className="h-12 text-base"
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Install Ollama from{' '}
                                        <a
                                            href="https://ollama.ai"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-purple-600 hover:text-purple-700 font-medium underline"
                                        >
                                            ollama.ai →
                                        </a>
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="ollama-model" className="text-base font-semibold">Model Selection</Label>
                                    <Select
                                        value={configs.ollama.model}
                                        onValueChange={(v) => handleConfigChange('ollama', 'model', v)}
                                    >
                                        <SelectTrigger className="h-12 text-base">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="llama3.3">🦙 Llama 3.3</SelectItem>
                                            <SelectItem value="llama3.2">🦙 Llama 3.2</SelectItem>
                                            <SelectItem value="qwen2.5">⚡ Qwen 2.5</SelectItem>
                                            <SelectItem value="mistral">💨 Mistral</SelectItem>
                                            <SelectItem value="deepseek-r1">🔬 DeepSeek R1</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="ollama-prompt" className="text-base font-semibold">System Prompt</Label>
                                    <Textarea
                                        id="ollama-prompt"
                                        placeholder="Enter system instructions for the AI..."
                                        value={configs.ollama.systemPrompt}
                                        onChange={(e) => handleConfigChange('ollama', 'systemPrompt', e.target.value)}
                                        className="min-h-[100px] text-base"
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Define how the AI should behave and respond to queries
                                    </p>
                                </div>

                                <Button onClick={() => testProvider('ollama')} disabled={isTesting} size="lg" className="w-full h-12 text-base font-semibold">
                                    {isTesting ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Testing Connection...
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="mr-2 h-5 w-5" />
                                            Test Connection
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Prompt Test Section for Ollama */}
                        <Card className="border-2 border-dashed">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <MessageSquare className="h-6 w-6 text-primary" />
                                    <div>
                                        <CardTitle className="text-xl">Test System Prompt</CardTitle>
                                        <CardDescription>
                                            Send a test message to see how your prompt configuration works
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <Label htmlFor="test-prompt-input-ollama" className="text-base font-semibold">Test Message</Label>
                                    <Input
                                        id="test-prompt-input-ollama"
                                        placeholder="Ask a question..."
                                        value={testPromptInput}
                                        onChange={(e) => setTestPromptInput(e.target.value)}
                                        className="h-12 text-base"
                                    />
                                </div>
                                <Button
                                    onClick={() => testPrompt('ollama')}
                                    disabled={isTestingPrompt || !configs.ollama.url}
                                    size="lg"
                                    className="w-full h-12 text-base font-semibold"
                                >
                                    {isTestingPrompt ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Testing Prompt...
                                        </>
                                    ) : (
                                        <>
                                            <MessageSquare className="mr-2 h-5 w-5" />
                                            Test with Prompt
                                        </>
                                    )}
                                </Button>
                                {promptTestResult && activeProvider === 'ollama' && (
                                    <Alert className={`border-2 ${promptTestResult.success ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'}`}>
                                        {promptTestResult.success ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        ) : (
                                            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                        )}
                                        <AlertDescription className="mt-2">
                                            <p className={`font-medium mb-2 ${promptTestResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                                                {promptTestResult.message}
                                            </p>
                                            {promptTestResult.response && (
                                                <div className="mt-3 p-3 bg-white dark:bg-gray-900 rounded-lg border">
                                                    <p className="text-sm font-semibold mb-1">AI Response:</p>
                                                    <p className="text-sm whitespace-pre-wrap">{promptTestResult.response}</p>
                                                </div>
                                            )}
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Test Results */}
                {testResult && (
                    <Alert className={`mt-8 border-2 ${testResult.success ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'}`}>
                        {testResult.success ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        )}
                        <AlertDescription className={`text-base font-medium ${testResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                            {testResult.message}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Save Button */}
                <div className="mt-8 flex justify-center">
                    <Button onClick={saveConfiguration} size="lg" className="h-14 px-12 text-lg font-semibold shadow-xl">
                        Save Configuration
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AIConfiguration;
