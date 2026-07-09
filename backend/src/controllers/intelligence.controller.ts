import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';
import { triggerManualRun } from '../services/scheduler';

/**
 * GET /api/timeline
 * Operational event feed with pagination and filters.
 */
export const getTimeline = async (req: Request, res: Response) => {
    try {
        const { entityType, severity, limit = '50', offset = '0' } = req.query;
        const where: any = {};
        if (entityType) where.entityType = entityType as string;
        if (severity) where.severity = severity as string;

        const [events, total] = await Promise.all([
            prisma.operationalEvent.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: Math.min(Number(limit), 100),
                skip: Number(offset),
            }),
            prisma.operationalEvent.count({ where })
        ]);

        res.json({ events, total });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch timeline.' });
    }
};

/**
 * GET /api/alerts
 * Get active alerts (Risk Monitor feed).
 */
export const getAlerts = async (req: Request, res: Response) => {
    try {
        const { status, severity } = req.query;
        const where: any = {};
        if (status) where.status = status as string;
        else where.status = { not: 'DISMISSED' }; // Default: show all non-dismissed
        if (severity) where.severity = severity as string;

        const alerts = await prisma.alert.findMany({
            where,
            orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }], // CRITICAL first
        });

        // Sort: CRITICAL > HIGH > MEDIUM > LOW
        const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        alerts.sort((a, b) =>
            (severityOrder[a.severity as keyof typeof severityOrder] ?? 4) -
            (severityOrder[b.severity as keyof typeof severityOrder] ?? 4)
        );

        res.json(alerts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch alerts.' });
    }
};

/**
 * PATCH /api/alerts/:id
 * Update alert status (acknowledge, resolve, dismiss).
 */
export const updateAlert = async (req: AuthRequest, res: Response) => {
    try {
        const id = String(req.params.id);
        const { status } = req.body;

        if (!['ACKNOWLEDGED', 'RESOLVED', 'DISMISSED'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Use ACKNOWLEDGED, RESOLVED, or DISMISSED.' });
        }

        const updateData: any = { status };
        if (status === 'ACKNOWLEDGED') updateData.acknowledgedAt = new Date();
        if (status === 'RESOLVED') updateData.resolvedAt = new Date();

        const alert = await prisma.alert.update({
            where: { id },
            data: updateData,
        });

        // Log the action as an event
        await prisma.operationalEvent.create({
            data: {
                type: `ALERT_${status}`,
                entityType: 'ALERT',
                entityId: id,
                title: `Alert ${status.toLowerCase()}: ${alert.title}`,
                severity: 'INFO',
            }
        });

        res.json(alert);
    } catch (error: any) {
        if (error.code === 'P2025') return res.status(404).json({ error: 'Alert not found.' });
        res.status(500).json({ error: 'Failed to update alert.' });
    }
};

/**
 * POST /api/intelligence/run
 * Manually trigger intelligence checks (ADMIN only).
 * Respects the scheduler run-lock — returns 409 if a run is already in progress.
 */
export const runChecks = async (_req: Request, res: Response) => {
    try {
        const result = await triggerManualRun();
        res.json({ success: true, ...result });
    } catch (error: any) {
        // Run-lock conflict
        if (error.message?.includes('already in progress')) {
            return res.status(409).json({ error: error.message });
        }
        res.status(500).json({ error: 'Intelligence check failed.', details: error.message });
    }
};
