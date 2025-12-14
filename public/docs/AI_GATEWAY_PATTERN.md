---
id: 693f2168daca0334f416631e
revision: 1
---
# AI Gateway Pattern

## Overview

The AI Gateway pattern provides a centralized, provider-agnostic interface for AI services in the application. It abstracts the underlying AI provider (Google, OpenAI, Anthropic, etc.) and provides consistent error handling, rate limiting, and a clean API.

## Architecture

```
┌─────────────────┐
│  React Components│
└────────┬────────┘
         │
         ├─── useAIChat()
         ├─── useAIEmbedding()
         └─── useAIStream()
         │
┌────────▼────────┐
│  AI Gateway     │  ◄─── Centralized Service Layer
├─────────────────┤
│ - Chat API      │
│ - Embeddings    │
│ - Streaming     │
│ - Error Handler │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼───┐
│Google │ │OpenAI│  ◄─── Provider Implementations
└───────┘ └──────┘
```

## Features

### 1. Provider Abstraction

- Switch between AI providers without changing application code
- Currently supports Google Gemini (OpenAI and Anthropic coming soon)
- Unified API across all providers

### 2. React Hooks

Easy-to-use React hooks for AI capabilities:

#### useAIChat

```typescript
const { sendMessage, response, isLoading, error } = useAIChat({
  onSuccess: (response) => console.log("Got response", response),
  onError: (error) => console.error("Error", error),
  autoRetry: true,
  maxRetries: 3,
});

await sendMessage("Hello, AI!", "You are a helpful assistant");
```

#### useAIEmbedding

```typescript
const { embedText, embeddings, isLoading, error } = useAIEmbedding({
  onSuccess: (result) => console.log("Embeddings generated", result),
});

await embedText(["text 1", "text 2", "text 3"]);
```

#### useAIGatewayStatus

```typescript
const { isConnected, isChecking, checkConnection } = useAIGatewayStatus();

// Component will show connection status
{
  isConnected ? "AI Connected" : "AI Offline";
}
```

### 3. Error Handling

Automatic error handling with user-friendly messages:

- API key errors
- Rate limiting
- Network timeouts
- Provider-specific errors

### 4. Retry Logic

Built-in exponential backoff retry mechanism:

```typescript
const { sendMessage } = useAIChat({
  autoRetry: true,
  maxRetries: 3,
});
```

### 5. Type Safety

Full TypeScript support with interfaces for all requests and responses:

```typescript
interface ChatRequest {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

interface ChatResponse {
  content: string;
  usage?: TokenUsage;
  model: string;
  finishReason?: string;
}
```

## Usage Examples

### Basic Chat

```typescript
import { useAIChat } from "@/hooks/useAIGateway";

function ChatComponent() {
  const { sendMessage, response, isLoading } = useAIChat();

  const handleSubmit = async (prompt: string) => {
    await sendMessage(prompt);
  };

  return (
    <div>
      <input onChange={(e) => handleSubmit(e.target.value)} />
      {isLoading && <p>Thinking...</p>}
      {response && <p>{response.content}</p>}
    </div>
  );
}
```

### With System Prompt

```typescript
const systemPrompt = `You are a documentation expert. 
Provide clear, concise answers about the codebase.`;

await sendMessage(userQuestion, systemPrompt);
```

### Custom Chat Request

```typescript
const { chat } = useAIChat();

await chat({
  messages: [
    { role: "system", content: "You are a code reviewer" },
    { role: "user", content: "Review this code..." },
    { role: "assistant", content: "Here are my suggestions..." },
    { role: "user", content: "What about performance?" },
  ],
  temperature: 0.3, // Lower temperature for code review
  maxTokens: 2000,
});
```

### Generating Embeddings

```typescript
import { useAIEmbedding } from "@/hooks/useAIGateway";

function SemanticSearch() {
  const { embedText } = useAIEmbedding();

  const handleSearch = async (query: string) => {
    const result = await embedText(query);
    // Use result.embeddings for similarity search
  };

  return <SearchInput onSearch={handleSearch} />;
}
```

### Batch Embeddings

```typescript
const documents = ["doc1", "doc2", "doc3"];
const result = await embedText(documents);
// result.embeddings is an array of embedding vectors
```

## Configuration

### Environment Variables

```env
VITE_GOOGLE_API_KEY=your-api-key
VITE_GEMINI_MODEL_ID=gemini-2.0-flash-exp
VITE_AI_TEMPERATURE=0.7
VITE_AI_MAX_TOKENS=8192
```

### Initialization

The AI Gateway is automatically initialized in `main.tsx`:

```typescript
import { initializeAIGatewayFromEnv } from "./services/aiGatewayInit";

initializeAIGatewayFromEnv();
```

### Manual Initialization

```typescript
import { initializeAIGateway } from "./services/aiGateway";

initializeAIGateway({
  provider: "google",
  apiKey: "your-api-key",
  model: "gemini-2.0-flash-exp",
  temperature: 0.7,
  maxTokens: 8192,
});
```

## Advanced Features

### Custom Error Handling

```typescript
const { sendMessage, error } = useAIChat({
  onError: (error) => {
    if (error.message.includes("rate limit")) {
      // Handle rate limiting
      showNotification("Please wait a moment and try again");
    } else {
      // Handle other errors
      logError(error);
    }
  },
});
```

### Token Usage Tracking

```typescript
const { response } = useAIChat({
  onSuccess: (response) => {
    if (response.usage) {
      console.log("Tokens used:", response.usage.totalTokens);
      trackUsage(response.usage);
    }
  },
});
```

### Connection Testing

```typescript
import { getAIGateway } from "@/services/aiGateway";

const gateway = getAIGateway();
const isConnected = await gateway.testConnection();

if (!isConnected) {
  console.error("AI Gateway connection failed");
}
```

## Benefits

1. **Flexibility**: Easy to switch AI providers
2. **Consistency**: Unified API across providers
3. **Type Safety**: Full TypeScript support
4. **Error Handling**: Automatic retry and user-friendly errors
5. **Testing**: Easy to mock for unit tests
6. **Maintainability**: Centralized AI logic

## Future Enhancements

- [ ] OpenAI provider implementation
- [ ] Anthropic Claude provider implementation
- [ ] Streaming support
- [ ] Response caching
- [ ] Rate limiting per provider
- [ ] Usage analytics dashboard
- [ ] A/B testing different models
- [ ] Cost tracking per request

## Files Structure

```
src/
├── services/
│   ├── aiGateway.ts          # Main gateway implementation
│   └── aiGatewayInit.ts      # Initialization helper
├── hooks/
│   └── useAIGateway.ts       # React hooks
└── components/
    └── AIChatExample.tsx     # Example component
```

## Testing

```typescript
import { initializeAIGateway } from "@/services/aiGateway";

// Mock the gateway for testing
const mockGateway = initializeAIGateway({
  provider: "google",
  apiKey: "test-key",
});

// Test your components with the mock
```

## Related Documentation

- [Google Generative AI SDK](https://github.com/google/generative-ai-js)
- [Environment Variables](./.env.example)
- [React Hooks](https://react.dev/reference/react)
