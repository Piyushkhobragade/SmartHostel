import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../../lib/logger';
import { env } from '../../config/env';

export interface AiMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface AiHealth {
    ok: boolean;
    model: string;
    error?: string;
    actionRequired?: string;
}

// Ensure we have an instance if key exists
const genAI = env.GEMINI_API_KEY ? new GoogleGenerativeAI(env.GEMINI_API_KEY) : null;
export const GEMINI_MODEL = env.GEMINI_MODEL || 'gemini-2.5-flash';

// Ordered list of fallback models to try if the primary is overloaded or unavailable
const MODEL_FALLBACK_CHAIN = [
    GEMINI_MODEL,
    'gemini-2.5-flash-lite',
    'gemini-flash-latest',
];

/**
 * Calls a single model and returns the response text.
 * Throws the original error so the caller can try the next model.
 */
async function callModel(
    modelName: string,
    messages: AiMessage[],
    options?: { temperature?: number; numPredict?: number; timeout?: number }
): Promise<string> {
    if (!genAI) throw new Error('GEMINI_API_KEY is not set.');

    const systemMessage = messages.find(m => m.role === 'system')?.content;
    const history = messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
    }));

    const lastMessage = history.pop();
    if (!lastMessage) throw new Error('No user message provided to AI');

    const modelOptions: any = {
        model: modelName,
        generationConfig: {
            temperature: options?.temperature ?? 0.3,
            maxOutputTokens: options?.numPredict ?? 1024,
        }
    };

    if (systemMessage) {
        modelOptions.systemInstruction = systemMessage;
    }

    const model = genAI.getGenerativeModel(modelOptions);
    const chatSession = model.startChat({ history });
    const result = await chatSession.sendMessage(lastMessage.parts[0].text);
    return result.response.text().trim();
}

/**
 * Multi-turn chat — primary interface for Copilot and Knowledge AI.
 * Automatically falls back through MODEL_FALLBACK_CHAIN on 503/overload errors.
 */
export async function chat(
    messages: AiMessage[],
    options?: { temperature?: number; numPredict?: number; timeout?: number }
): Promise<string> {
    if (!genAI) {
        throw new Error('GEMINI_API_KEY is not set in the environment variables. AI features are disabled.');
    }

    let lastError: any;

    for (const modelName of MODEL_FALLBACK_CHAIN) {
        try {
            const response = await callModel(modelName, messages, options);
            if (modelName !== MODEL_FALLBACK_CHAIN[0]) {
                logger.info(`[Gemini] Used fallback model '${modelName}' successfully.`);
            }
            return response;
        } catch (error: any) {
            const msg: string = error?.message ?? '';
            const isRetryable =
                msg.includes('503') ||
                msg.includes('Service Unavailable') ||
                msg.includes('overloaded') ||
                msg.includes('high demand');

            if (isRetryable) {
                logger.warn(`[Gemini] Model '${modelName}' overloaded, trying next fallback...`);
                lastError = error;
                continue;
            }

            // Non-retryable error (e.g. 400, 401, 404) — fail immediately
            logger.error({ err: msg, model: modelName }, '[Gemini] Non-retryable API Error');
            throw new Error(`Gemini API Error: ${msg}`);
        }
    }

    // All models failed
    logger.error({ err: lastError?.message }, '[Gemini] All fallback models exhausted');
    throw new Error(`Gemini API Error (all models overloaded): ${lastError?.message}`);
}

/**
 * Single-turn generation — simpler interface for one-shot tasks.
 */
export async function generate(
    prompt: string,
    system?: string,
    options?: { temperature?: number }
): Promise<string> {
    const messages: AiMessage[] = [];
    if (system) messages.push({ role: 'system', content: system });
    messages.push({ role: 'user', content: prompt });
    return chat(messages, options);
}

// ─── Health Check ─────────────────────────────────────────────────────────────

/**
 * Comprehensive health check — returns structured status for the /health/ai endpoint.
 */
export async function isHealthy(): Promise<AiHealth> {
    if (!env.GEMINI_API_KEY) {
        return {
            ok: false,
            model: GEMINI_MODEL,
            error: 'GEMINI_API_KEY is missing',
            actionRequired: 'Add GEMINI_API_KEY to your .env file'
        };
    }
    return {
        ok: true,
        model: GEMINI_MODEL
    };
}

// ─── Startup Diagnostics ──────────────────────────────────────────────────────

export async function startupDiagnostics(): Promise<void> {
    logger.info({ model: GEMINI_MODEL, fallbackChain: MODEL_FALLBACK_CHAIN }, '[Gemini] Running AI diagnostics...');

    const health = await isHealthy();

    if (!health.ok) {
        logger.warn(
            { error: health.error, action: health.actionRequired },
            '[Gemini] ⚠️  AI API key missing. AI features will be unavailable. ' +
            'The rest of the application is fully operational.'
        );
        return;
    }

    logger.info(`[Gemini] ✅ AI ready. Primary model: '${GEMINI_MODEL}'. Fallback chain: ${MODEL_FALLBACK_CHAIN.join(' → ')}`);
}
