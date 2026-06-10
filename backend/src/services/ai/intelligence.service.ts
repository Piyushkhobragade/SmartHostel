import prisma from '../../lib/prisma';
import { generate } from './ollama';

/**
 * Intelligence Service
 *
 * Runs pattern detection and alert generation on hostel data.
 * Called on-demand (API trigger) or scheduled (cron in production).
 *
 * Produces:
 * - OperationalEvent records (timeline feed)
 * - Alert records (risk monitor)
 * - AI-generated descriptions + recommendations
 *
 * Design: Simple rule-based triggers + AI narrative generation.
 * Faculty-friendly: the AI explains WHY something is an alert,
 * not just that it is one.
 */

// ─── ALERT THRESHOLD CONSTANTS ───────────────────────────────────────────────
const THRESHOLDS = {
    ATTENDANCE_CRITICAL: 60,   // % — trigger CRITICAL alert
    ATTENDANCE_LOW: 75,        // % — trigger HIGH alert
    OVERDUE_COUNT: 5,          // invoices — trigger MEDIUM alert
    OVERDUE_AMOUNT: 50000,     // ₹ — trigger HIGH alert
    URGENT_MAINTENANCE: 3,     // count — trigger HIGH alert
    OPEN_MAINTENANCE: 10,      // count — trigger MEDIUM alert
    VISITOR_AFTER_HOURS: 0,    // count after 9PM — trigger alert
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function today(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

async function createAlertIfNew(data: {
    type: string;
    severity: string;
    title: string;
    description: string;
    recommendation?: string;
    confidence?: number;
    evidence?: any;
}) {
    // Deduplicate: don't create same alert type if one is already ACTIVE from today
    const existing = await prisma.alert.findFirst({
        where: {
            type: data.type,
            status: 'ACTIVE',
            createdAt: { gte: today() }
        }
    });
    if (existing) return null;

    return prisma.alert.create({
        data: {
            ...data,
            status: 'ACTIVE',
            evidence: data.evidence ? JSON.stringify(data.evidence) : undefined,
        }
    });
}

async function logEvent(data: {
    type: string;
    entityType: string;
    entityId: string;
    title: string;
    description?: string;
    severity?: string;
    metadata?: any;
}) {
    return prisma.operationalEvent.create({
        data: {
            ...data,
            severity: data.severity || 'INFO',
            metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
        }
    });
}

// ─── INTELLIGENCE CHECKS ─────────────────────────────────────────────────────

/**
 * Check 1: Attendance anomaly detection
 */
async function checkAttendance(): Promise<void> {
    const todayDate = today();
    const logs = await prisma.attendanceLog.findMany({
        where: { date: { gte: todayDate } }
    });

    if (logs.length === 0) return; // Not yet marked

    const presentCount = logs.filter(l => l.status === 'PRESENT').length;
    const rate = Math.round((presentCount / logs.length) * 100);

    if (rate < THRESHOLDS.ATTENDANCE_CRITICAL) {
        const aiDesc = await generate(
            `Hostel attendance today: ${presentCount} present out of ${logs.length} residents (${rate}%). Generate a 2-sentence alert description explaining the risk and recommended action for the warden.`,
            'You are a hostel management AI. Be concise and professional.',
            { temperature: 0.3 }
        ).catch(() => `Only ${rate}% attendance recorded today. ${logs.length - presentCount} residents unaccounted for.`);

        await createAlertIfNew({
            type: 'ATTENDANCE_CRITICAL',
            severity: 'CRITICAL',
            title: `Critical Attendance: ${rate}% present`,
            description: aiDesc,
            recommendation: 'Conduct an immediate roll call and contact absent residents.',
            confidence: 0.95,
            evidence: { rate, present: presentCount, total: logs.length }
        });

        await logEvent({
            type: 'ATTENDANCE_ANOMALY',
            entityType: 'HOSTEL',
            entityId: 'global',
            title: `Critical attendance: ${rate}%`,
            description: aiDesc,
            severity: 'CRITICAL',
        });
    } else if (rate < THRESHOLDS.ATTENDANCE_LOW) {
        await createAlertIfNew({
            type: 'ATTENDANCE_LOW',
            severity: 'HIGH',
            title: `Low Attendance: ${rate}%`,
            description: `Attendance is below the 75% threshold. ${logs.length - presentCount} residents marked absent today.`,
            recommendation: 'Review absent residents and follow up.',
            confidence: 0.9,
            evidence: { rate, present: presentCount, total: logs.length }
        });
    }
}

/**
 * Check 2: Fee overdue detection
 */
async function checkFees(): Promise<void> {
    const now = new Date();
    const overdueInvoices = await prisma.feeInvoice.findMany({
        where: { status: { in: ['PENDING', 'OVERDUE'] }, dueDate: { lt: now } },
        include: { resident: { select: { fullName: true, phone: true } } }
    });

    if (overdueInvoices.length === 0) return;

    const totalAmount = overdueInvoices.reduce((s, i) => s + i.amount, 0);

    // Update overdue status
    await prisma.feeInvoice.updateMany({
        where: { status: 'PENDING', dueDate: { lt: now } },
        data: { status: 'OVERDUE' }
    });

    const severity = totalAmount > THRESHOLDS.OVERDUE_AMOUNT ? 'HIGH' : 'MEDIUM';

    await createAlertIfNew({
        type: 'FEES_OVERDUE',
        severity,
        title: `${overdueInvoices.length} Overdue Invoices — ₹${totalAmount.toLocaleString('en-IN')}`,
        description: `${overdueInvoices.length} fee invoices are past due, totaling ₹${totalAmount.toLocaleString('en-IN')}. Top defaulters: ${overdueInvoices.slice(0, 3).map(i => i.resident.fullName).join(', ')}.`,
        recommendation: 'Send payment reminders to overdue residents. Issue formal notices for invoices overdue by more than 30 days.',
        confidence: 1.0,
        evidence: {
            count: overdueInvoices.length,
            totalAmount,
            topDefaulters: overdueInvoices.slice(0, 5).map(i => ({ name: i.resident.fullName, amount: i.amount }))
        }
    });

    await logEvent({
        type: 'FEES_OVERDUE',
        entityType: 'FINANCE',
        entityId: 'global',
        title: `Fee collection alert: ₹${totalAmount.toLocaleString('en-IN')} overdue`,
        severity,
    });
}

/**
 * Check 3: Maintenance backlog detection
 */
async function checkMaintenance(): Promise<void> {
    const [openCount, urgentRequests] = await Promise.all([
        prisma.maintenanceRequest.count({
            where: { status: { in: ['OPEN', 'IN_PROGRESS'] } }
        }),
        prisma.maintenanceRequest.findMany({
            where: { status: 'OPEN', priority: 'URGENT' },
            include: { resident: { select: { fullName: true } } }
        })
    ]);

    if (urgentRequests.length >= THRESHOLDS.URGENT_MAINTENANCE) {
        await createAlertIfNew({
            type: 'MAINTENANCE_URGENT_BACKLOG',
            severity: 'HIGH',
            title: `${urgentRequests.length} Urgent Maintenance Requests Pending`,
            description: `${urgentRequests.length} URGENT maintenance requests are unresolved. Categories: ${[...new Set(urgentRequests.map(r => r.category))].join(', ')}.`,
            recommendation: 'Assign maintenance staff immediately to urgent requests.',
            confidence: 1.0,
            evidence: { urgentCount: urgentRequests.length, requests: urgentRequests.map(r => ({ category: r.category, desc: r.description.slice(0, 50) })) }
        });
    } else if (openCount >= THRESHOLDS.OPEN_MAINTENANCE) {
        await createAlertIfNew({
            type: 'MAINTENANCE_BACKLOG',
            severity: 'MEDIUM',
            title: `Maintenance Backlog: ${openCount} Open Requests`,
            description: `${openCount} maintenance requests are open or in-progress. This is above the normal threshold of ${THRESHOLDS.OPEN_MAINTENANCE}.`,
            recommendation: 'Review and prioritize the maintenance queue. Assign additional staff if needed.',
            confidence: 0.85,
            evidence: { openCount }
        });
    }

    if (openCount > 0) {
        await logEvent({
            type: 'MAINTENANCE_STATUS',
            entityType: 'MAINTENANCE',
            entityId: 'global',
            title: `Maintenance check: ${openCount} open requests, ${urgentRequests.length} urgent`,
            severity: urgentRequests.length > 0 ? 'WARNING' : 'INFO',
        });
    }
}

/**
 * Check 4: After-hours visitor detection
 */
async function checkVisitors(): Promise<void> {
    const now = new Date();
    const hour = now.getHours();

    // After 9 PM
    if (hour < 21) return;

    const activeVisitors = await prisma.visitorLog.findMany({
        where: { checkOutTime: null },
        include: { resident: { select: { fullName: true } } }
    });

    if (activeVisitors.length === 0) return;

    await createAlertIfNew({
        type: 'VISITOR_AFTER_HOURS',
        severity: 'MEDIUM',
        title: `${activeVisitors.length} Visitor(s) on Premises After Hours`,
        description: `${activeVisitors.length} visitor(s) have not checked out after 9:00 PM. Residents: ${activeVisitors.map(v => v.resident.fullName).join(', ')}.`,
        recommendation: 'Security should verify and request visitor checkout. Inform residents of visitor policy.',
        confidence: 0.9,
        evidence: { count: activeVisitors.length, visitors: activeVisitors.map(v => v.id) }
    });

    await logEvent({
        type: 'VISITOR_AFTER_HOURS',
        entityType: 'SECURITY',
        entityId: 'global',
        title: `After-hours visitors detected: ${activeVisitors.length}`,
        severity: 'WARNING',
    });
}

// ─── OCCUPANCY SNAPSHOT ───────────────────────────────────────────────────────

async function snapshotOccupancy(): Promise<void> {
    const [totalBeds, occupiedBeds] = await Promise.all([
        prisma.room.aggregate({ _sum: { capacity: true } }),
        prisma.room.aggregate({ _sum: { currentOccupancy: true } }),
    ]);

    await prisma.occupancyHistory.create({
        data: {
            date: new Date(),
            totalBeds: totalBeds._sum.capacity || 0,
            occupiedBeds: occupiedBeds._sum.currentOccupancy || 0,
        }
    });
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

/**
 * Run all intelligence checks. Called on-demand via /api/intelligence/run.
 */
export async function runIntelligenceChecks(): Promise<{
    checksRun: string[];
    alertsCreated: number;
    eventsLogged: number;
}> {
    const before = {
        alerts: await prisma.alert.count({ where: { status: 'ACTIVE' } }),
        events: await prisma.operationalEvent.count(),
    };

    await Promise.allSettled([
        checkAttendance(),
        checkFees(),
        checkMaintenance(),
        checkVisitors(),
        snapshotOccupancy(),
    ]);

    const after = {
        alerts: await prisma.alert.count({ where: { status: 'ACTIVE' } }),
        events: await prisma.operationalEvent.count(),
    };

    return {
        checksRun: ['attendance', 'fees', 'maintenance', 'visitors', 'occupancy_snapshot'],
        alertsCreated: after.alerts - before.alerts,
        eventsLogged: after.events - before.events,
    };
}
