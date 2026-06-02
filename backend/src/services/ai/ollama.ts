/**
 * Ollama HTTP client — all AI services use this single utility.
 * Calls the local Ollama server (default: http://localhost:11434).
 * No SDK needed — Ollama exposes a simple REST API.
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'qwen3:8b';

export interface OllamaMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface OllamaChatResponse {
    message: OllamaMessage;
    done: boolean;
    total_duration?: number;
}

/**
 * Multi-turn chat — primary interface for Copilot and Knowledge AI.
 * Uses /api/chat endpoint (non-streaming, waits for full response).
 */
export async function chat(
    messages: OllamaMessage[],
    options?: { temperature?: number; timeout?: number }
): Promise<string> {
    const controller = new AbortController();
    const timeoutMs = options?.timeout ?? 120_000; // 2 minute default
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                model: MODEL,
                messages,
                stream: false,
                options: {
                    temperature: options?.temperature ?? 0.3, // Lower = more consistent/factual
                    num_predict: 1024,
                }
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Ollama API error ${response.status}: ${err}`);
        }

        const data = await response.json() as OllamaChatResponse;
        return data.message.content.trim();
    } catch (error: any) {
        if (error.name === 'AbortError') {
            throw new Error('Ollama request timed out. Is Ollama running? Try: ollama serve');
        }
        throw error;
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Single-turn generation — simpler interface for one-shot tasks.
 */
export async function generate(
    prompt: string,
    system?: string,
    options?: { temperature?: number }
): Promise<string> {
    const messages: OllamaMessage[] = [];
    if (system) messages.push({ role: 'system', content: system });
    messages.push({ role: 'user', content: prompt });
    return chat(messages, options);
}

/**
 * Health check — returns true if Ollama is reachable and the model is available.
 */
export async function isHealthy(): Promise<{ ok: boolean; model?: string; error?: string }> {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
            signal: AbortSignal.timeout(5000)
        });
        if (!response.ok) return { ok: false, error: `HTTP ${response.status}` };
        const data = await response.json() as { models: { name: string }[] };
        const available = data.models.some(m => m.name.startsWith(MODEL.split(':')[0]));
        return { ok: true, model: MODEL, error: available ? undefined : `Model '${MODEL}' not pulled. Run: ollama pull ${MODEL}` };
    } catch (error: any) {
        return { ok: false, error: `Ollama unreachable: ${error.message}. Run: ollama serve` };
    }
}
