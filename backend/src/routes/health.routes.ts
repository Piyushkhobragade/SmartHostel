import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import client from 'prom-client';
import { env } from '../config/env';
import { isHealthy as ollamaHealth } from '../services/ai/ollama';
import { getSchedulerStatus } from '../services/scheduler';

const router = Router();

// Create a Registry which registers the metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Histogram for HTTP request durations
export const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});
register.registerMetric(httpRequestDurationMicroseconds);

// Liveness probe (Kubernetes /healthz)
router.get('/healthz', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Readiness probe (Kubernetes /readyz)
router.get('/readyz', async (req: Request, res: Response) => {
  try {
    // Check DB connection
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok', db: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// Prometheus metrics endpoint
router.get('/metrics', async (req: Request, res: Response) => {
  // Guard with token if configured
  if (env.METRICS_TOKEN) {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${env.METRICS_TOKEN}`) {
      return res.status(401).send('Unauthorized');
    }
  }

  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

/**
 * GET /health/ai
 *
 * Composite AI subsystem health check.
 * Returns live status for: PostgreSQL, Ollama, Intelligence Scheduler.
 * Never throws — all checks are isolated. Always returns 200 with a status object.
 */
router.get('/health/ai', async (_req: Request, res: Response) => {
  const [dbResult, ollamaResult] = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`.then(() => ({ ok: true })).catch((e: unknown) => ({
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    })),
    ollamaHealth(),
  ]);

  const db = dbResult.status === 'fulfilled' ? dbResult.value : { ok: false, error: 'DB check failed' };
  const ollama = ollamaResult.status === 'fulfilled' ? ollamaResult.value : { ok: false, reachable: false, error: 'Ollama check failed' };
  const scheduler = getSchedulerStatus();

  const allHealthy = (db as { ok: boolean }).ok && (ollama as { ok: boolean }).ok && scheduler.running;

  res.status(200).json({
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    components: {
      database: db,
      ollama,
      scheduler,
    },
  });
});

export default router;
