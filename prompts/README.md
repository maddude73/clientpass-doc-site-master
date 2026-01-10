# AI Provider Prompt Comparison

This folder contains different system prompts designed for each AI provider to optimize their unique strengths:

## Prompt Styles

### 📘 [OpenAI Prompt](./openai-prompt.md)

- **Focus**: Technical precision and code examples
- **Style**: Professional, developer-focused
- **Strengths**: Structured responses with detailed implementation
- **Format**: Headers, code blocks, numbered processes

### 🧠 [Gemini Prompt](./gemini-prompt.md)

- **Focus**: Comprehensive analysis with visual elements
- **Style**: Conversational yet informative
- **Strengths**: Cross-referencing, pattern recognition
- **Format**: Summary boxes, bullet hierarchies, emojis

### 🎯 [Claude Prompt](./claude-prompt.md)

- **Focus**: Thoughtful, safety-conscious guidance
- **Style**: Thorough and anticipatory
- **Strengths**: Progressive disclosure, security considerations
- **Format**: Prerequisites, important notes, extensive comments

### ⚡ [Ollama Prompt](./ollama-prompt.md)

- **Focus**: Practical, get-things-done approach
- **Style**: Direct and action-oriented
- **Strengths**: Quick solutions, troubleshooting, testing
- **Format**: Simple markdown, runnable examples, quick tests

## Testing Instructions

1. **Update Server Configuration**: Replace the system prompts in `api/server.cjs` with content from these files
2. **Test Same Query**: Ask the same question across all providers
3. **Compare Results**: Evaluate formatting, completeness, and usefulness
4. **Choose Best**: Select the prompt style that produces the most helpful responses

## Evaluation Criteria

- **Clarity**: How easy is it to understand the response?
- **Completeness**: Does it answer the full question?
- **Actionability**: Can you implement the solution immediately?
- **Consistency**: Is the formatting predictable across responses?
- **Source Attribution**: Are documentation sources properly cited?
