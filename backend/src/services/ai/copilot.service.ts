import prisma from '../../lib/prisma';
import { chat, AiMessage } from './gemini';
import {
    sanitizeInput,
    budgetContext,
    validateResponse,
    extractSeverity,
    extractRecommendation,
} from '../../utils/promptSecurity';

/**
 * AI Warden Copilot Service — Phase 7B hardened
 *
 * Warden asks a natural language question. The Copilot:
 * 1. Sanitizes the user message (injection protection, length limit)
 * 2. Pulls live operational data from PostgreSQL (context injection)
 * 3. Budgets the context block to stay within the model's context window
 * 4. Sends to Qwen3:8b with a warden-role system prompt
 * 5. Validates the response before persisting or returning
 * 6. Returns answer + structured evidence panel data
 *
 * Design principles:
 * - AI recommends, human approves. No autonomous actions.
 * - Every answer is grounded in real database state.
 * - Evidence panel shows exactly which data the AI used.
 */

const WARDEN_SYSTEM_PROMPT = `You are the SmartHostel X AI Warden Copilot — an intelligent operational assistant for hostel management.

Your role is to help the warden make informed decisions by analyzing real-time hostel data and providing actionable insights.

BEHAVIOR:
1. Always base your analysis on the operational data provided in this conversation.
2. Be concise but thorough. Lead with the most critical insight.
3. When you identify a risk or issue, clearly state its severity: [LOW], [MEDIUM], [HIGH], or [CRITICAL].
4. Always recommend a specific next action the warden should take.
5. If the data doesn't support a conclusion, say so clearly rather than guessing.
6. Format responses in clear sections with bullet points for readability.
7. You are an assistant — the warden makes all final decisions.

TONE: Professional, direct, data-driven. Like a trusted senior staff member briefing the warden.`;

/**
 * Pull live operational snapshot for context injection.
 * This gives Qwen3 real data to reason about.
 */
async function getOperationalContext(): Promise<string> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
        totalRooms,
        totalResidents,
        activeResidents,
        todayAttendance,
        openMaintenance,
        urgentMaintenance,
        overdueInvoices,
        activeVisitors,
        recentAlerts,
        maintenanceByCategory,
        attendanceLast7Days,
        topOverdueResidents,
    ] = await Promise.all([
        prisma.room.count(),
        prisma.resident.count(),
        prisma.resident.count({ where: { status: 'ACTIVE' } }),
        prisma.attendanceLog.findMany({
            where: { date: { gte: today } },
            include: { resident: { select: { fullName: true } } },
        }),
        prisma.maintenanceRequest.count({
            where: { status: { in: ['OPEN', 'IN_PROGRESS'] } }
        }),
        prisma.maintenanceRequest.findMany({
            where: { status: { in: ['OPEN', 'IN_PROGRESS'] }, priority: 'URGENT' },
            include: { resident: { select: { fullName: true } } },
            take: 5,
        }),
        prisma.feeInvoice.findMany({
            where: { status: { in: ['PENDING', 'OVERDUE'] }, dueDate: { lt: now } },
            include: { resident: { select: { fullName: true } } },
            orderBy: { dueDate: 'asc' },
            take: 10,
        }),
        prisma.visitorLog.count({
            where: { checkOutTime: null }
        }),
        prisma.alert.findMany({
            where: { status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' },
            take: 5,
        }),
        prisma.maintenanceRequest.groupBy({
            by: ['category'],
            where: { createdAt: { gte: thirtyDaysAgo } },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
        }),
        prisma.attendanceLog.groupBy({
            by: ['date', 'status'],
            where: { date: { gte: sevenDaysAgo } },
            _count: { id: true },
        }),
        prisma.feeInvoice.findMany({
            where: { status: { in: ['PENDING', 'OVERDUE'] } },
            include: { resident: { select: { fullName: true } } },
            orderBy: { amount: 'desc' },
            take: 5,
        }),
    ]);

    const presentToday = todayAttendance.filter(a => a.status === 'PRESENT').length;
    const absentToday = todayAttendance.filter(a => a.status === 'ABSENT').length;
    const attendanceRate = todayAttendance.length > 0
        ? Math.round((presentToday / todayAttendance.length) * 100)
        : null;

    const totalOverdue = overdueInvoices.reduce((s, i) => s + i.amount, 0);

    const context = `
=== SMARTHOSTEL X — LIVE OPERATIONAL SNAPSHOT ===
Date/Time: ${now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

--- OCCUPANCY ---
Total Rooms: ${totalRooms}
Total Residents: ${totalResidents} (Active: ${activeResidents})

--- ATTENDANCE (TODAY) ---
${todayAttendance.length > 0
        ? `Marked: ${todayAttendance.length} | Present: ${presentToday} | Absent: ${absentToday} | Rate: ${attendanceRate}%`
        : 'Attendance not yet marked for today.'}
${absentToday > 0 ? `Absent residents: ${todayAttendance.filter(a => a.status === 'ABSENT').map(a => a.resident.fullName).join(', ')}` : ''}

--- MAINTENANCE ---
Open/In-Progress Requests: ${openMaintenance}
${urgentMaintenance.length > 0
        ? `URGENT Issues (${urgentMaintenance.length}): ${urgentMaintenance.map(m => `${m.category} - ${m.description.slice(0, 50)}`).join('; ')}`
        : 'No urgent maintenance issues.'}
${maintenanceByCategory.length > 0
        ? `By Category (last 30 days): ${maintenanceByCategory.map(g => `${g.category}: ${g._count.id}`).join(', ')}`
        : ''}

--- FEES ---
Overdue Invoices: ${overdueInvoices.length} | Total Overdue Amount: ₹${totalOverdue.toLocaleString('en-IN')}
${overdueInvoices.length > 0
        ? `Overdue residents: ${overdueInvoices.slice(0, 5).map(i => `${i.resident.fullName} (₹${i.amount})`).join(', ')}`
        : 'No overdue fees.'}
${topOverdueResidents.length > 0
        ? `Highest outstanding: ${topOverdueResidents[0].resident.fullName} - ₹${topOverdueResidents[0].amount}`
        : ''}

--- VISITORS ---
Active Visitors on Premises: ${activeVisitors}

--- ACTIVE ALERTS ---
${recentAlerts.length > 0
        ? recentAlerts.map(a => `[${a.severity}] ${a.title}: ${a.description}`).join('\n')
        : 'No active alerts.'}

=== END SNAPSHOT ===
`;

    return context.trim();
}

export interface CopilotResponse {
    answer: string;
    conversationId: string;
    evidencePanel: {
        dataPointsUsed: string[];
        recommendation: string;
        severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'NONE';
    };
}

/**
 * Main Copilot chat function.
 * Maintains conversation history for multi-turn interactions.
 */
export async function wardenChat(
    userId: string,
    message: string,
    conversationId?: string
): Promise<CopilotResponse> {
    // 1. Get or create conversation
    let conversation;
    if (conversationId) {
        conversation = await prisma.copilotConversation.findUnique({
            where: { id: conversationId },
            include: {
                messages: { orderBy: { createdAt: 'asc' }, take: 20 } // Last 20 messages
            }
        });
    }

    if (!conversation) {
        conversation = await prisma.copilotConversation.create({
            data: {
                userId,
                title: message.slice(0, 60) + (message.length > 60 ? '...' : ''),
            },
            include: { messages: true }
        });
    }

    // 2. Sanitize user input (Phase 7B: injection protection + length limit)
    const safeMessage = sanitizeInput(message, { maxChars: 2_000, context: 'warden message' });

    // 3. Pull live operational context and apply context window budget
    const rawContext = await getOperationalContext();
    const operationalContext = budgetContext(rawContext);

    // 4. Build message history for Qwen3
    const ollamaMessages: AiMessage[] = [
        { role: 'system', content: WARDEN_SYSTEM_PROMPT },
        {
            role: 'user',
            content: `Here is the current real-time hostel operational data:\n\n${operationalContext}\n\nUse this data to answer the warden's questions accurately.`
        },
        { role: 'assistant', content: 'Understood. I have reviewed the current operational snapshot. How can I assist you?' },
    ];

    // Add conversation history (up to last 20 messages)
    for (const msg of conversation.messages) {
        ollamaMessages.push({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
        });
    }

    // Add current sanitized user message — injected AFTER system prompt, never before
    ollamaMessages.push({ role: 'user', content: safeMessage });

    // 5. Get Qwen3 response and validate
    const rawAnswer = await chat(ollamaMessages, { temperature: 0.4, timeout: 240_000 });
    const answer = validateResponse(rawAnswer, {
        fallback: 'I was unable to generate a response to that question. Please try rephrasing.',
    });

    // 6. Persist both messages (use safeMessage for stored user content)
    await prisma.copilotMessage.createMany({
        data: [
            { conversationId: conversation.id, role: 'user', content: safeMessage },
            { conversationId: conversation.id, role: 'assistant', content: answer },
        ]
    });

    // 7. Extract evidence panel using shared prompt security helpers
    const severity = extractSeverity(answer);
    const recommendation = extractRecommendation(answer);

    // Build data points list from what was in context
    const dataPoints: string[] = [];
    if (answer.toLowerCase().includes('attendance')) dataPoints.push('Today\'s attendance data');
    if (answer.toLowerCase().includes('maintenance')) dataPoints.push('Open maintenance requests');
    if (answer.toLowerCase().includes('fee') || answer.toLowerCase().includes('overdue')) dataPoints.push('Fee & invoice status');
    if (answer.toLowerCase().includes('visitor')) dataPoints.push('Active visitor count');
    if (answer.toLowerCase().includes('alert')) dataPoints.push('Active system alerts');
    if (answer.toLowerCase().includes('room') || answer.toLowerCase().includes('occupan')) dataPoints.push('Room occupancy data');
    if (dataPoints.length === 0) dataPoints.push('Operational snapshot');

    return {
        answer,
        conversationId: conversation.id,
        evidencePanel: {
            dataPointsUsed: dataPoints,
            recommendation,
            severity: severity === 'NONE' ? 'NONE' : severity,
        }
    };
}

/**
 * Generate the morning briefing — a proactive summary the warden sees on login.
 */
export async function generateMorningBriefing(): Promise<string> {
    const rawContext = await getOperationalContext();
    const context = budgetContext(rawContext);

    const messages: AiMessage[] = [
        { role: 'system', content: WARDEN_SYSTEM_PROMPT },
        {
            role: 'user',
            content: `${context}\n\nGenerate a concise morning briefing for the warden. Cover:
1. Current occupancy and attendance status
2. Any urgent maintenance that needs immediate attention
3. Fee collection status and overdue amounts
4. Any active alerts or concerns
5. Top 3 action items for today

Keep it brief — the warden reads this in under 2 minutes.`
        }
    ];

    const raw = await chat(messages, { temperature: 0.3 });
    return validateResponse(raw, { fallback: 'Morning briefing unavailable. Please try again.' });
}
