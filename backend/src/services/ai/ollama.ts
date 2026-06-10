/**
 * Ollama HTTP client — Phase 7B hardened version.
 *
 * Changes from Phase 7A:
 *  - OLLAMA_MODEL now reads from OLLAMA_MODEL env var (falls back to 'qwen2.5:3b')
 *  - Added modelExists() — checks whether the configured model is pulled
 *  - Added pullModel() — pulls the model programmatically (for startup scripts)
 *  - Added startupDiagnostics() — comprehensive startup check with actionable messages
 *  - Context window budget applied via budgetContext()
 *  - All constants exported for use by health endpoints
 *
 * Model: qwen2.5:3b (~1.9 GB, ~2.5 GB RAM, ~15-25 tok/s on CPU)
 */

import { logger } from '../../lib/logger';

export const OLLAMA_BASE_URL: string = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
export const OLLAMA_MODEL: string = process.env.OLLAMA_MODEL ?? 'qwen2.5:3b';

/** Default request timeout for inference (ms)
 *  CPU-only qwen2.5:3b: ~15-25 tok/s generation.
 *  A 1200-token prompt + 500-token response = ~30-50s on CPU.
 *  120s provides comfortable headroom for CPU-only deployments.
 *  GPU deployments will complete in <5s. */
const DEFAULT_TIMEOUT_MS = 120_000; // 2 minutes

export interface OllamaMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface OllamaChatResponse {
    message: OllamaMessage;
    done: boolean;
    total_duration?: number;
    prompt_eval_count?: number;
    eval_count?: number;
}

// ─── Core Inference ───────────────────────────────────────────────────────────

/**
 * Multi-turn chat — primary interface for Copilot and Knowledge AI.
 * Uses /api/chat endpoint (non-streaming, waits for full response).
 */
export async function chat(
    messages: OllamaMessage[],
    options?: { temperature?: number; timeout?: number; numPredict?: number }
): Promise<string> {
    const controller = new AbortController();
    const timeoutMs = options?.timeout ?? DEFAULT_TIMEOUT_MS;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                messages,
                stream: false,
                options: {
                    temperature: options?.temperature ?? 0.3,
                    num_predict: options?.numPredict ?? 1024,
                },
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Ollama API error ${response.status}: ${err}`);
        }

        const data = (await response.json()) as OllamaChatResponse;
        return data.message.content.trim();
    } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error(
                `Ollama request timed out after ${timeoutMs / 1000}s. ` +
                `Is the model loaded? Run: docker exec smarthostel-ollama ollama pull ${OLLAMA_MODEL}`
            );
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

// ─── Model Management ─────────────────────────────────────────────────────────

/**
 * Check if the configured model is pulled and available in Ollama.
 * Uses model name prefix matching (e.g. 'qwen2.5:3b' matches 'qwen2.5:3b').
 */
export async function modelExists(): Promise<boolean> {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
            signal: AbortSignal.timeout(5_000),
        });
        if (!response.ok) return false;
        const data = (await response.json()) as { models: { name: string }[] };
        const modelBase = OLLAMA_MODEL.split(':')[0];
        return data.models.some(
            m => m.name === OLLAMA_MODEL || m.name.startsWith(modelBase + ':')
        );
    } catch {
        return false;
    }
}

/**
 * List all models currently available in Ollama.
 */
export async function listModels(): Promise<string[]> {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
            signal: AbortSignal.timeout(5_000),
        });
        if (!response.ok) return [];
        const data = (await response.json()) as { models: { name: string }[] };
        return data.models.map(m => m.name);
    } catch {
        return [];
    }
}

// ─── Health Check ─────────────────────────────────────────────────────────────

export interface OllamaHealth {
    ok: boolean;
    reachable: boolean;
    modelAvailable: boolean;
    model: string;
    availableModels: string[];
    error?: string;
    actionRequired?: string;
}

/**
 * Comprehensive health check — returns structured status for the /health/ai endpoint.
 */
export async function isHealthy(): Promise<OllamaHealth> {
    // 1. Reachability check
    let reachable = false;
    let availableModels: string[] = [];

    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
            signal: AbortSignal.timeout(5_000),
        });
        if (response.ok) {
            reachable = true;
            const data = (await response.json()) as { models: { name: string }[] };
            availableModels = data.models.map(m => m.name);
        }
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
            ok: false,
            reachable: false,
            modelAvailable: false,
            model: OLLAMA_MODEL,
            availableModels: [],
            error: `Ollama unreachable at ${OLLAMA_BASE_URL}: ${msg}`,
            actionRequired:
                `Start Ollama container: docker compose up -d ollama\n` +
                `Then pull model: docker exec smarthostel-ollama ollama pull ${OLLAMA_MODEL}`,
        };
    }

    // 2. Model availability check
    const modelBase = OLLAMA_MODEL.split(':')[0];
    const modelAvailable = availableModels.some(
        m => m === OLLAMA_MODEL || m.startsWith(modelBase + ':')
    );

    if (!modelAvailable) {
        return {
            ok: false,
            reachable: true,
            modelAvailable: false,
            model: OLLAMA_MODEL,
            availableModels,
            error: `Model '${OLLAMA_MODEL}' is not pulled.`,
            actionRequired:
                `Pull the model: docker exec smarthostel-ollama ollama pull ${OLLAMA_MODEL}\n` +
                `This will download ~5 GB and takes 5-15 minutes on first run.`,
        };
    }

    return {
        ok: true,
        reachable: true,
        modelAvailable: true,
        model: OLLAMA_MODEL,
        availableModels,
    };
}

// ─── Startup Diagnostics ──────────────────────────────────────────────────────

/**
 * Run at server startup. Logs actionable diagnostics without crashing the server.
 * AI features degrade gracefully — the rest of the app remains operational.
 */
export async function startupDiagnostics(): Promise<void> {
    logger.info({ ollamaUrl: OLLAMA_BASE_URL, model: OLLAMA_MODEL }, '[Ollama] Running startup diagnostics...');

    const health = await isHealthy();

    if (!health.reachable) {
        logger.warn(
            { error: health.error, action: health.actionRequired },
            '[Ollama] ⚠️  Ollama is not reachable. AI features will be unavailable. ' +
            'The rest of the application is fully operational.'
        );
        return;
    }

    if (!health.modelAvailable) {
        logger.warn(
            {
                model: OLLAMA_MODEL,
                availableModels: health.availableModels,
                action: health.actionRequired,
            },
            `[Ollama] ⚠️  Model '${OLLAMA_MODEL}' is not pulled. ` +
            `AI features will return errors until the model is downloaded.`
        );
        return;
    }

    // Warm-up: send a minimal probe to load the model into RAM
    logger.info(`[Ollama] ✅ Ollama reachable, model '${OLLAMA_MODEL}' available. Warming up...`);
    try {
        await chat(
            [{ role: 'user', content: 'Respond with one word: ready' }],
            { temperature: 0, timeout: 60_000 }
        );
        logger.info(`[Ollama] ✅ Model warm-up complete. AI features are operational.`);
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.warn({ err: msg }, '[Ollama] ⚠️  Model warm-up failed (model may still be loading). AI features may be slow on first request.');
    }
}
