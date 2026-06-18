/**
 * Intelligence Scheduler — Phase 7B
 *
 * Runs the intelligence engine checks every 30 minutes via node-cron.
 *
 * Design guarantees:
 *  - Idempotent: a run-lock prevents concurrent executions
 *  - Logged: every run is recorded with timing and outcome
 *  - Failure-isolated: exceptions are caught and logged, never crash the server
 *  - Observable: getSchedulerStatus() exposes state to the /health/ai endpoint
 *  - Graceful: stopScheduler() cleanly tears down the cron job on server shutdown
 */

import cron, { ScheduledTask } from 'node-cron';
import { runIntelligenceChecks } from './ai/intelligence.service';
import { logger } from '../lib/logger';

// ─── State ────────────────────────────────────────────────────────────────────

export interface SchedulerStatus {
    running: boolean;
    cronExpression: string;
    lastRunAt: string | null;
    lastRunDurationMs: number | null;
    lastRunResult: {
        checksRun: string[];
        alertsCreated: number;
        eventsLogged: number;
    } | null;
    lastRunError: string | null;
    totalRuns: number;
    totalErrors: number;
}

const CRON_EXPRESSION = '*/30 * * * *'; // Every 30 minutes

let schedulerTask: ScheduledTask | null = null;
let isRunLocked = false;

const status: SchedulerStatus = {
    running: false,
    cronExpression: CRON_EXPRESSION,
    lastRunAt: null,
    lastRunDurationMs: null,
    lastRunResult: null,
    lastRunError: null,
    totalRuns: 0,
    totalErrors: 0,
};

// ─── Core Run Logic ───────────────────────────────────────────────────────────

/**
 * Execute one intelligence check cycle.
 * Protected by a run-lock to prevent concurrent executions if a run
 * takes longer than the cron interval (should not happen but is defensive).
 */
async function runIntelligenceCycle(): Promise<void> {
    if (isRunLocked) {
        logger.warn('[Scheduler] ⚠️  Skipping intelligence run — previous run still in progress.');
        return;
    }

    isRunLocked = true;
    const startTime = Date.now();
    status.lastRunAt = new Date().toISOString();
    status.totalRuns++;

    logger.info(`[Scheduler] 🔄 Intelligence run #${status.totalRuns} starting...`);

    try {
        const result = await runIntelligenceChecks();
        const durationMs = Date.now() - startTime;

        status.lastRunDurationMs = durationMs;
        status.lastRunResult = result;
        status.lastRunError = null;

        logger.info(
            {
                checksRun: result.checksRun,
                alertsCreated: result.alertsCreated,
                eventsLogged: result.eventsLogged,
                durationMs,
            },
            `[Scheduler] ✅ Intelligence run #${status.totalRuns} complete (${durationMs}ms) — ` +
            `${result.alertsCreated} alerts created, ${result.eventsLogged} events logged.`
        );
    } catch (err: unknown) {
        const durationMs = Date.now() - startTime;
        const message = err instanceof Error ? err.message : String(err);

        status.lastRunDurationMs = durationMs;
        status.lastRunError = message;
        status.totalErrors++;

        logger.error(
            { err: message, run: status.totalRuns, durationMs },
            `[Scheduler] ❌ Intelligence run #${status.totalRuns} failed after ${durationMs}ms: ${message}`
        );
        // Do NOT re-throw — scheduler must survive individual run failures
    } finally {
        isRunLocked = false;
    }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

/**
 * Start the intelligence scheduler.
 * Runs immediately on startup (first cycle), then every 30 minutes.
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export function startScheduler(): void {
    if (schedulerTask) {
        logger.warn('[Scheduler] startScheduler() called but scheduler is already running.');
        return;
    }

    status.running = true;

    // Run immediately on startup so the first check isn't delayed 30 minutes
    void runIntelligenceCycle();

    schedulerTask = cron.schedule(CRON_EXPRESSION, () => {
        void runIntelligenceCycle();
    });

    logger.info(
        { cronExpression: CRON_EXPRESSION },
        '[Scheduler] ✅ Intelligence scheduler started. ' +
        'Next scheduled run in 30 minutes.'
    );
}

/**
 * Stop the scheduler cleanly. Called on SIGTERM / server shutdown.
 */
export function stopScheduler(): void {
    if (schedulerTask) {
        schedulerTask.stop();
        schedulerTask = null;
    }
    status.running = false;
    logger.info('[Scheduler] Intelligence scheduler stopped.');
}

/**
 * Returns current scheduler status for the /health/ai endpoint.
 * Never throws — health endpoints must always respond.
 */
export function getSchedulerStatus(): SchedulerStatus {
    return { ...status };
}

/**
 * Manually trigger one intelligence run outside the cron schedule.
 * Used by the POST /api/intelligence/run endpoint.
 * Returns the run result directly so the controller can respond with it.
 */
export async function triggerManualRun(): Promise<{
    checksRun: string[];
    alertsCreated: number;
    eventsLogged: number;
}> {
    if (isRunLocked) {
        throw new Error('Intelligence run already in progress. Please wait and try again.');
    }
    await runIntelligenceCycle();
    return status.lastRunResult ?? { checksRun: [], alertsCreated: 0, eventsLogged: 0 };
}
