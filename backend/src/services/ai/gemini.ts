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
export const GEMINI_MODEL = env.GEMINI_MODEL || 'gemini-1.5-flash';

/**
 * Multi-turn chat — primary interface for Copilot and Knowledge AI.
 */
export async function chat(
    messages: AiMessage[],
    options?: { temperature?: number; numPredict?: number; timeout?: number }
): Promise<string> {
    if (!genAI) {
        throw new Error('GEMINI_API_KEY is not set in the environment variables. AI features are disabled.');
    }

    // Extract system message if present
    const systemMessage = messages.find(m => m.role === 'system')?.content;
    const history = messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
    }));

    // The last message should be passed to sendMessage, so we pop it
    const lastMessage = history.pop();
    if (!lastMessage) throw new Error('No user message provided to AI');

    const modelOptions: any = { 
        model: GEMINI_MODEL,
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

    try {
        const result = await chatSession.sendMessage(lastMessage.parts[0].text);
        return result.response.text().trim();
    } catch (error: any) {
        logger.error({ err: error.message }, '[Gemini] API Error');
        throw new Error(`Gemini API Error: ${error.message}`);
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
    logger.info({ model: GEMINI_MODEL }, '[Gemini] Running AI diagnostics...');

    const health = await isHealthy();

    if (!health.ok) {
        logger.warn(
            { error: health.error, action: health.actionRequired },
            '[Gemini] ⚠️  AI API key missing. AI features will be unavailable. ' +
            'The rest of the application is fully operational.'
        );
        return;
    }

    logger.info(`[Gemini] ✅ AI Configuration healthy using model '${GEMINI_MODEL}'.`);
}
