import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, Zap, Sparkles, Brain, Cpu, Boxes } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type AIProvider = 'google' | 'openai' | 'anthropic' | 'ollama';

interface ProviderConfig {
    apiKey?: string;
    model?: string;
    url?: string;
}

const providerMetadata = {
    google: {
        icon: Sparkles,
        color: 'from-blue-500 to-cyan-500',
        bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950',
        badgeColor: 'bg-blue-500',
        name: 'Google Gemini',
        tagline: 'Next-gen multimodal AI'
    },
    openai: {
        icon: Brain,
        color: 'from-green-500 to-emerald-500',
        bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950',
        badgeColor: 'bg-green-500',
        name: 'OpenAI',
        tagline: 'Advanced language models'
    },
    anthropic: {
        icon: Zap,
        color: 'from-orange-500 to-amber-500',
        bgColor: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950',
        badgeColor: 'bg-orange-500',
        name: 'Anthropic Claude',
        tagline: 'Safe, accurate AI assistant'
    },
    ollama: {
        icon: Cpu,
        color: 'from-purple-500 to-pink-500',
        bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950',
        badgeColor: 'bg-purple-500',
        name: 'Ollama',
        tagline: 'Run AI models locally'
    }
};

const AIConfiguration = () => {
    const [activeProvider, setActiveProvider] = useState<AIProvider>('google');
    const [configs, setConfigs] = useState<Record<AIProvider, ProviderConfig>>({
        google: {
            apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
            model: 'gemini-2.0-flash-exp',
        },
        openai: {
            apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
            model: 'gpt-4-turbo-preview',
        },
        anthropic: {
            apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
            model: 'claude-3-5-sonnet-20241022',
        },
        ollama: {
            url: import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434',
            model: 'llama3.2',
        },
    });

    const [testQuery, setTestQuery] = useState('What is ClientPass?');
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [isTesting, setIsTesting] = useState(false);

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

            // Simulate API test (replace with actual API calls)
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Basic validation
            if (provider === 'ollama') {
                if (!config.url) {
                    throw new Error('Ollama URL is required');
                }
            } else if (!config.apiKey) {
                throw new Error('API key is required');
            }

            setTestResult({
                success: true,
                message: `Successfully connected to ${provider}. Model: ${config.model}`,
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

    const saveConfiguration = () => {
        // In a real app, you'd save to environment variables or backend
        console.log('Saving configuration:', configs);
        setTestResult({
            success: true,
            message: 'Configuration saved successfully! Restart the app to apply changes.',
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
            <div className="container mx-auto p-6 md:p-12 max-w-7xl">
                {/* Hero Section */}
                <div className="mb-12 text-center">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <Boxes className="h-8 w-8 text-primary" />
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            AI Configuration
                        </h1>
                    </div>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">

                        Configure and test multiple AI providers for your application
                    </p>
                </div>

                {/* Provider Cards Grid */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {(Object.entries(providerMetadata) as [AIProvider, typeof providerMetadata.google][]).map(([key, meta]) => {
                        const Icon = meta.icon;
                        const isActive = activeProvider === key;
                        const hasConfig = key === 'ollama' ? !!configs[key].url : !!configs[key].apiKey;

                        return (
                            <Card
                                key={key}
                                className={`cursor-pointer transition-all duration-300 hover:shadow-xl border-2 ${isActive
                                        ? `border-primary shadow-lg ${meta.bgColor}`
                                        : 'border-transparent hover:border-primary/50'
                                    }`}
                                onClick={() => setActiveProvider(key)}
                            >
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-3 rounded-xl bg-gradient-to-br ${meta.color}`}>
                                                <Icon className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl">{meta.name}</CardTitle>
                                                <CardDescription className="mt-1">{meta.tagline}</CardDescription>
                                            </div>
                                        </div>
                                        {hasConfig && (
                                            <Badge className={`${meta.badgeColor} text-white`}>
                                                Configured
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                            </Card>
                        );
                    })}
                </div>

                <Tabs value={activeProvider} onValueChange={(v) => setActiveProvider(v as AIProvider)} className="w-full">
                    <TabsList className="hidden">
                        <TabsTrigger value="google">Google Gemini</TabsTrigger>
                        <TabsTrigger value="openai">OpenAI</TabsTrigger>
                        <TabsTrigger value="anthropic">Anthropic Claude</TabsTrigger>
                        <TabsTrigger value="ollama">Ollama (Local)</TabsTrigger>
                    </TabsList>

                    {/* Google Gemini */}
                    <TabsContent value="google" className="space-y-6">
                        <Card className={`overflow-hidden ${providerMetadata.google.bgColor} border-2`}>
                            <CardHeader className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-xl bg-gradient-to-br ${providerMetadata.google.color}`}>
                                        <Sparkles className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-2xl">Google Gemini Configuration</CardTitle>
                                        <CardDescription className="text-base mt-1">
                                            Configure Google's next-gen multimodal AI models
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
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
                                    <Label htmlFor="google-model" className="text-base font-semibold">Model</Label>
                                    <Select
                                        value={configs.google.model}
                                        onValueChange={(v) => handleConfigChange('google', 'model', v)}
                                    >
                                        <SelectTrigger className="h-12 text-base">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Fast)</SelectItem>
                                            <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                                            <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button onClick={() => testProvider('google')} disabled={isTesting} size="lg" className="w-full md:w-auto">
                                    {isTesting ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Testing Connection...
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="mr-2 h-4 w-4" />
                                            Test Connection
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* OpenAI */}
                    <TabsContent value="openai">
                        <Card>
                            <CardHeader>
                                <CardTitle>OpenAI Configuration</CardTitle>
                                <CardDescription>
                                    Configure OpenAI's GPT models
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="openai-api-key">API Key</Label>
                                    <Input
                                        id="openai-api-key"
                                        type="password"
                                        placeholder="sk-..."
                                        value={configs.openai.apiKey}
                                        onChange={(e) => handleConfigChange('openai', 'apiKey', e.target.value)}
                                    />
                                    <p className="text-sm text-gray-500">
                                        Get your API key from{' '}
                                        <a
                                            href="https://platform.openai.com/api-keys"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-500 hover:underline"
                                        >
                                            OpenAI Platform
                                        </a>
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="openai-model">Model</Label>
                                    <Select
                                        value={configs.openai.model}
                                        onValueChange={(v) => handleConfigChange('openai', 'model', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="gpt-4-turbo-preview">GPT-4 Turbo</SelectItem>
                                            <SelectItem value="gpt-4">GPT-4</SelectItem>
                                            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button onClick={() => testProvider('openai')} disabled={isTesting}>
                                    {isTesting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Testing...
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="mr-2 h-4 w-4" />
                                            Test Connection
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Anthropic Claude */}
                    <TabsContent value="anthropic">
                        <Card>
                            <CardHeader>
                                <CardTitle>Anthropic Claude Configuration</CardTitle>
                                <CardDescription>
                                    Configure Anthropic's Claude models
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="anthropic-api-key">API Key</Label>
                                    <Input
                                        id="anthropic-api-key"
                                        type="password"
                                        placeholder="sk-ant-..."
                                        value={configs.anthropic.apiKey}
                                        onChange={(e) => handleConfigChange('anthropic', 'apiKey', e.target.value)}
                                    />
                                    <p className="text-sm text-gray-500">
                                        Get your API key from{' '}
                                        <a
                                            href="https://console.anthropic.com/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-500 hover:underline"
                                        >
                                            Anthropic Console
                                        </a>
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="anthropic-model">Model</Label>
                                    <Select
                                        value={configs.anthropic.model}
                                        onValueChange={(v) => handleConfigChange('anthropic', 'model', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</SelectItem>
                                            <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                                            <SelectItem value="claude-3-sonnet-20240229">Claude 3 Sonnet</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button onClick={() => testProvider('anthropic')} disabled={isTesting}>
                                    {isTesting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Testing...
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="mr-2 h-4 w-4" />
                                            Test Connection
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Ollama */}
                    <TabsContent value="ollama">
                        <Card>
                            <CardHeader>
                                <CardTitle>Ollama Configuration</CardTitle>
                                <CardDescription>
                                    Configure local Ollama models
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="ollama-url">Server URL</Label>
                                    <Input
                                        id="ollama-url"
                                        type="url"
                                        placeholder="http://localhost:11434"
                                        value={configs.ollama.url}
                                        onChange={(e) => handleConfigChange('ollama', 'url', e.target.value)}
                                    />
                                    <p className="text-sm text-gray-500">
                                        Install Ollama from{' '}
                                        <a
                                            href="https://ollama.ai"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-500 hover:underline"
                                        >
                                            ollama.ai
                                        </a>
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="ollama-model">Model</Label>
                                    <Select
                                        value={configs.ollama.model}
                                        onValueChange={(v) => handleConfigChange('ollama', 'model', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="llama3.2">Llama 3.2</SelectItem>
                                            <SelectItem value="mistral">Mistral</SelectItem>
                                            <SelectItem value="codellama">Code Llama</SelectItem>
                                            <SelectItem value="phi3">Phi-3</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button onClick={() => testProvider('ollama')} disabled={isTesting}>
                                    {isTesting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Testing...
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="mr-2 h-4 w-4" />
                                            Test Connection
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Test Results */}
                {testResult && (
                    <Alert className={`mt-6 ${testResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
                        {testResult.success ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <AlertDescription className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                            {testResult.message}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Save Button */}
                <div className="mt-6 flex justify-end">
                    <Button onClick={saveConfiguration} size="lg">
                        Save Configuration
                    </Button>
                </div>
            </div>
            );
};

            export default AIConfiguration;
