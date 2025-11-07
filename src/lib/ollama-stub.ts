// Browser-safe stub for Ollama
// The real Ollama package uses Node.js modules (fs, path) which don't work in browsers
// This stub allows the code to compile for browsers while keeping Ollama server-side only

export class Ollama {
    constructor() {
        console.warn('Ollama is only available in server-side environments');
    }

    async chat(): Promise<never> {
        throw new Error('Ollama is only available on the server side');
    }

    async generate(): Promise<never> {
        throw new Error('Ollama is only available on the server side');
    }

    async embeddings(): Promise<never> {
        throw new Error('Ollama is only available on the server side');
    }
}

export default Ollama;
