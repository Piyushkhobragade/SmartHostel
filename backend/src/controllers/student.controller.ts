import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';
import { studentAsk } from '../services/ai/student.service';
import { PromptInjectionError, InputTooLongError } from '../utils/promptSecurity';
import { logger } from '../lib/logger';
import { sanitizeMarkdown } from '../utils/sanitizer';

/**
 * Helper to get residentId from JWT — all student endpoints use this.
 * STUDENT JWT contains residentId set at login time.
 */
function getResidentId(req: AuthRequest): string | null {
    return req.user?.residentId || null;
}

/**
 * GET /api/student/dashboard
 * Aggregated dashboard: room info, attendance summary, next fee due, recent visitors.
 */
export const getStudentDashboard = async (req: AuthRequest, res: Response) => {
    const residentId = getResidentId(req);
    if (!residentId) {
        return res.status(403).json({ error: 'Student profile not linked to this account.' });
    }

    try {
        const resident = await prisma.resident.findUnique({
            where: { id: residentId },
            include: {
                room: true,
            }
        });

        if (!resident) {
            return res.status(404).json({ error: 'Resident profile not found.' });
        }

        // Attendance in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [attendanceLogs, nextDueFee, recentVisitors, openMaintenance] = await Promise.all([
            prisma.attendanceLog.findMany({
                where: { residentId, date: { gte: thirtyDaysAgo } },
                orderBy: { date: 'desc' },
                take: 30,
            }),
            prisma.feeInvoice.findFirst({
                where: { residentId, status: { in: ['PENDING', 'OVERDUE'] } },
                orderBy: { dueDate: 'asc' },
            }),
            prisma.visitorLog.findMany({
                where: { residentId },
                orderBy: { checkInTime: 'desc' },
                take: 3,
            }),
            prisma.maintenanceRequest.count({
                where: {
                    residentId,
                    status: { in: ['OPEN', 'IN_PROGRESS'] }
                }
            })
        ]);

        const presentDays = attendanceLogs.filter(a => a.status === 'PRESENT').length;
        const attendanceRate = attendanceLogs.length > 0
            ? Math.round((presentDays / attendanceLogs.length) * 100)
            : 0;

        // Streak: count consecutive PRESENT from most recent
        let streak = 0;
        for (const log of attendanceLogs) {
            if (log.status === 'PRESENT') streak++;
            else break;
        }

        res.json({
            resident: {
                id: resident.id,
                fullName: resident.fullName,
                email: resident.email,
                phone: resident.phone,
                status: resident.status,
            },
            room: resident.room,
            attendance: {
                rate: attendanceRate,
                streak,
                presentDays,
                totalTracked: attendanceLogs.length,
            },
            nextDueFee: nextDueFee ? {
                id: nextDueFee.id,
                amount: nextDueFee.amount,
                dueDate: nextDueFee.dueDate,
                description: nextDueFee.description,
                status: nextDueFee.status,
            } : null,
            recentVisitors,
            openMaintenanceCount: openMaintenance,
        });
    } catch (error) {
        console.error('Student dashboard error:', error);
        res.status(500).json({ error: 'Failed to load dashboard.' });
    }
};

/**
 * GET /api/student/room
 * Current room details + roommates + active maintenance for that room.
 */
export const getStudentRoom = async (req: AuthRequest, res: Response) => {
    const residentId = getResidentId(req);
    if (!residentId) return res.status(403).json({ error: 'Student profile not linked.' });

    try {
        const resident = await prisma.resident.findUnique({
            where: { id: residentId },
            include: { room: true }
        });

        if (!resident?.room) {
            return res.json({ room: null, roommates: [], maintenance: [] });
        }

        const [roommates, maintenance] = await Promise.all([
            prisma.resident.findMany({
                where: { roomId: resident.roomId!, id: { not: residentId }, status: 'ACTIVE' },
                select: { id: true, fullName: true, email: true, phone: true }
            }),
            prisma.maintenanceRequest.findMany({
                where: { residentId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
                orderBy: { createdAt: 'desc' },
                take: 10,
            })
        ]);

        res.json({
            room: resident.room,
            roommates,
            maintenance,
        });
    } catch (error) {
        console.error('Student room error:', error);
        res.status(500).json({ error: 'Failed to load room details.' });
    }
};

/**
 * GET /api/student/attendance
 * Own attendance history with optional date filter.
 */
export const getStudentAttendance = async (req: AuthRequest, res: Response) => {
    const residentId = getResidentId(req);
    if (!residentId) return res.status(403).json({ error: 'Student profile not linked.' });

    try {
        const { month, year } = req.query;
        const where: any = { residentId };

        if (month && year) {
            const startDate = new Date(Number(year), Number(month) - 1, 1);
            const endDate = new Date(Number(year), Number(month), 1);
            where.date = { gte: startDate, lt: endDate };
        } else {
            // Default: last 60 days
            const sixtyDaysAgo = new Date();
            sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
            where.date = { gte: sixtyDaysAgo };
        }

        const logs = await prisma.attendanceLog.findMany({
            where,
            orderBy: { date: 'desc' },
        });

        const presentCount = logs.filter(l => l.status === 'PRESENT').length;
        const absentCount = logs.filter(l => l.status === 'ABSENT').length;
        const leaveCount = logs.filter(l => l.status === 'LEAVE').length;

        res.json({
            logs,
            summary: {
                total: logs.length,
                present: presentCount,
                absent: absentCount,
                leave: leaveCount,
                rate: logs.length > 0 ? Math.round((presentCount / logs.length) * 100) : 0,
            }
        });
    } catch (error) {
        console.error('Student attendance error:', error);
        res.status(500).json({ error: 'Failed to load attendance.' });
    }
};

/**
 * GET /api/student/fees
 * Own invoices + payments.
 */
export const getStudentFees = async (req: AuthRequest, res: Response) => {
    const residentId = getResidentId(req);
    if (!residentId) return res.status(403).json({ error: 'Student profile not linked.' });

    try {
        const invoices = await prisma.feeInvoice.findMany({
            where: { residentId },
            include: { payments: true },
            orderBy: { dueDate: 'desc' },
        });

        const totalOwed = invoices
            .filter(i => i.status !== 'PAID')
            .reduce((sum, i) => sum + i.amount, 0);
        const totalPaid = invoices
            .filter(i => i.status === 'PAID')
            .reduce((sum, i) => sum + i.amount, 0);

        res.json({ invoices, summary: { totalOwed, totalPaid } });
    } catch (error) {
        console.error('Student fees error:', error);
        res.status(500).json({ error: 'Failed to load fees.' });
    }
};

/**
 * GET /api/student/visitors
 * Own visitor history.
 */
export const getStudentVisitors = async (req: AuthRequest, res: Response) => {
    const residentId = getResidentId(req);
    if (!residentId) return res.status(403).json({ error: 'Student profile not linked.' });

    try {
        const visitors = await prisma.visitorLog.findMany({
            where: { residentId },
            orderBy: { checkInTime: 'desc' },
        });
        res.json(visitors);
    } catch (error) {
        console.error('Student visitors error:', error);
        res.status(500).json({ error: 'Failed to load visitors.' });
    }
};

/**
 * POST /api/student/visitors
 * Pre-register a visitor.
 */
export const createStudentVisitor = async (req: AuthRequest, res: Response) => {
    const residentId = getResidentId(req);
    if (!residentId) return res.status(403).json({ error: 'Student profile not linked.' });

    try {
        const { visitorName, purpose, idType, idLast4 } = req.body;
        if (!visitorName || !purpose || !idType || !idLast4) {
            return res.status(400).json({ error: 'visitorName, purpose, idType, and idLast4 are required.' });
        }

        const visitor = await prisma.visitorLog.create({
            data: {
                visitorName,
                residentId,
                purpose,
                idType,
                idLast4,
                preRegistered: true,
            }
        });
        res.status(201).json(visitor);
    } catch (error) {
        console.error('Student visitor create error:', error);
        res.status(500).json({ error: 'Failed to register visitor.' });
    }
};

/**
 * POST /api/student/maintenance
 * Submit a maintenance request (auto-linked to student's resident record).
 */
export const createStudentMaintenance = async (req: AuthRequest, res: Response) => {
    const residentId = getResidentId(req);
    if (!residentId) return res.status(403).json({ error: 'Student profile not linked.' });

    try {
        const { category, description, priority } = req.body;
        if (!category || !description) {
            return res.status(400).json({ error: 'category and description are required.' });
        }

        const request = await prisma.maintenanceRequest.create({
            data: {
                residentId,
                category,
                description,
                priority: priority || 'MEDIUM',
                status: 'OPEN',
            }
        });
        res.status(201).json(request);
    } catch (error) {
        logger.error({ err: error }, 'Student maintenance error');
        res.status(500).json({ error: 'Failed to submit maintenance request.' });
    }
};

/**
 * POST /api/student/ask
 * Student AI — answers questions using the student's own data + knowledge corpus.
 *
 * Security guarantees:
 * - STUDENT role required (enforced in router via requireRole(['STUDENT']))
 * - residentId comes exclusively from JWT — question text never influences data selection
 * - No conversation history (stateless, session-only)
 * - No write operations performed
 */
export const askStudentAI = async (req: AuthRequest, res: Response) => {
    const residentId = getResidentId(req);
    if (!residentId) {
        return res.status(403).json({ error: 'Student profile not linked to this account.' });
    }

    try {
        const { question } = req.body;
        if (!question || typeof question !== 'string' || question.trim().length < 2) {
            return res.status(400).json({ error: 'A question of at least 2 characters is required.' });
        }

        const result = await studentAsk(residentId, question.trim());
        if (result.answer) result.answer = sanitizeMarkdown(result.answer);
        res.json(result);
    } catch (error: any) {
        // 400: client input violations — do not log as server errors
        if (error instanceof PromptInjectionError) {
            return res.status(400).json({ error: 'Input blocked: prompt injection detected.' });
        }
        if (error instanceof InputTooLongError) {
            return res.status(400).json({ error: error.message });
        }
        // 503: AI service unavailable
        if (error.message?.includes('timed out') || error.message?.includes('Ollama') || error.message?.includes('503')) {
            logger.warn({ err: error.message }, 'Student AI: AI service unavailable');
            return res.status(503).json({
                error: 'AI service is temporarily unavailable. Please try again in a moment.',
                details: error.message,
            });
        }
        logger.error({ err: error.message }, 'Student AI ask error');
        res.status(500).json({ error: 'Failed to process your question. Please try again.' });
    }
};
