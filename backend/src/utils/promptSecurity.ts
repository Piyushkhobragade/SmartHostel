/**
 * Prompt Security Utilities — Phase 7B
 *
 * Provides defence-in-depth for all AI input/output paths.
 *
 * Design principles:
 *  - Sanitize at ingestion, not at display (fail-fast)
 *  - Never silently drop content — throw structured errors
 *  - All limits are configurable via constants, not magic numbers
 *  - No regex that can ReDoS (linear patterns only)
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** Maximum characters allowed in a single user AI input */
export const MAX_INPUT_CHARS = 2_000;

/** Maximum characters for the operational context block injected per turn */
export const MAX_CONTEXT_CHARS = 8_000;

/** Maximum characters for a knowledge question */
export const MAX_QUESTION_CHARS = 1_000;

/**
 * Known prompt injection prefixes — linear scan, not regex backtracking.
 * These are checked case-insensitively after trimming.
 */
const INJECTION_PREFIXES: readonly string[] = [
    'ignore all previous',
    'ignore previous instructions',
    'disregard all previous',
    'forget all previous',
    'ignore your instructions',
    'ignore the above',
    'new instruction:',
    'system:',
    'system prompt:',
    'you are now',
    'your new role',
    'act as if',
    'pretend you are',
    'pretend to be',
    '[system]',
    '<system>',
    '###system',
    '---system',
];

/** Patterns that suggest jailbreak attempts — linear substring check */
const INJECTION_SUBSTRINGS: readonly string[] = [
    'dan mode',
    'developer mode',
    'jailbreak',
    'ignore all constraints',
    'no restrictions',
    'without restrictions',
    'unrestricted mode',
    'bypass safety',
];

// ─── Input Sanitisation ───────────────────────────────────────────────────────

export class PromptInjectionError extends Error {
    constructor(reason: string) {
        super(`Prompt injection detected: ${reason}`);
        this.name = 'PromptInjectionError';
    }
}

export class InputTooLongError extends Error {
    constructor(actual: number, limit: number) {
        super(`Input too long: ${actual} characters exceeds limit of ${limit}`);
        this.name = 'InputTooLongError';
    }
}

/**
 * Sanitise a user-supplied AI input.
 *
 * Steps:
 *  1. Trim whitespace
 *  2. Enforce character limit
 *  3. Check for known injection prefixes
 *  4. Check for known injection substrings
 *  5. Strip null bytes and control characters
 *
 * Returns the cleaned string, or throws PromptInjectionError / InputTooLongError.
 */
export function sanitizeInput(
    raw: string,
    opts?: { maxChars?: number; context?: string }
): string {
    const limit = opts?.maxChars ?? MAX_INPUT_CHARS;
    const context = opts?.context ?? 'input';

    // 1. Trim
    let text = raw.trim();

    // 2. Length guard
    if (text.length > limit) {
        throw new InputTooLongError(text.length, limit);
    }

    // 3. Empty guard
    if (text.length === 0) {
        throw new Error(`AI ${context} cannot be empty`);
    }

    // 4. Prefix injection check (first 100 chars of lowercased text)
    const lower = text.toLowerCase();
    const prefix100 = lower.slice(0, 100);
    for (const pattern of INJECTION_PREFIXES) {
        if (prefix100.includes(pattern)) {
            throw new PromptInjectionError(`matched prefix "${pattern}" in ${context}`);
        }
    }

    // 5. Substring injection check (full text)
    for (const pattern of INJECTION_SUBSTRINGS) {
        if (lower.includes(pattern)) {
            throw new PromptInjectionError(`matched substring "${pattern}" in ${context}`);
        }
    }

    // 6. Strip null bytes and non-printable control characters (except \n \r \t)
    // eslint-disable-next-line no-control-regex
    text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    return text;
}

// ─── Context Budget ───────────────────────────────────────────────────────────

/**
 * Truncate an operational context block to fit within token budget.
 * Adds a truncation notice if content was cut so the model knows context is partial.
 */
export function budgetContext(context: string, maxChars: number = MAX_CONTEXT_CHARS): string {
    if (context.length <= maxChars) return context;
    const truncated = context.slice(0, maxChars);
    return truncated + '\n\n[NOTE: Operational context truncated to fit context window.]';
}

// ─── Response Validation ─────────────────────────────────────────────────────

/**
 * Validate that an AI response is usable.
 * Returns the trimmed response, or a safe fallback string on failure.
 *
 * Does NOT throw — a bad AI response should surface as a degraded answer,
 * not a 500 error (the user's question was valid, the model was unreliable).
 */
export function validateResponse(
    raw: string,
    opts?: { minLength?: number; fallback?: string }
): string {
    const min = opts?.minLength ?? 10;
    const fallback = opts?.fallback ?? 'I was unable to generate a response. Please try again.';

    if (!raw || typeof raw !== 'string') return fallback;

    const trimmed = raw.trim();
    if (trimmed.length < min) return fallback;

    // Guard against model echoing the system prompt back verbatim
    const lower = trimmed.toLowerCase();
    if (
        lower.startsWith('you are the smarthostel') ||
        lower.startsWith('system prompt:') ||
        lower.startsWith('[system]')
    ) {
        return fallback;
    }

    return trimmed;
}

// ─── Severity Extraction ──────────────────────────────────────────────────────

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';

/**
 * Extract the highest severity mentioned in an AI response.
 * Checks for [CRITICAL], [HIGH], [MEDIUM], [LOW] bracket notation.
 */
export function extractSeverity(text: string): Severity {
    const order: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    const upper = text.toUpperCase();
    for (const level of order) {
        if (upper.includes(`[${level}]`)) return level;
    }
    return 'NONE';
}

/**
 * Extract the most actionable recommendation sentence from an AI response.
 * Looks for sentences containing recommendation keywords.
 */
export function extractRecommendation(text: string): string {
    const sentences = text.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 15);
    const keywords = /recommend|suggest|action|should|immediate|contact|escalat|notify|review/i;
    return sentences.find(s => keywords.test(s)) ?? sentences[sentences.length - 1] ?? '';
}
