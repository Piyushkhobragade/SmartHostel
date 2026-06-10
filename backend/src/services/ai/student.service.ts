import prisma from '../../lib/prisma';
import { chat, OllamaMessage } from './ollama';
import { sanitizeInput, budgetContext, validateResponse } from '../../utils/promptSecurity';
import { logger } from '../../lib/logger';

// ─── Data Intent Types ───────────────────────────────────────────────────────
type DataIntent = 'fees' | 'attendance' | 'room' | 'maintenance' | 'visitors' | 'profile' | null;

/**
 * Student AI Service — Phase 7D-1
 *
 * Implements a hybrid RAG + personal data pattern for student questions:
 * 1. Fetch the requesting student's own data (fees, attendance, room, maintenance, visitors).
 *    Data is ALWAYS fetched using residentId from the JWT — the question text has NO influence
 *    on which data is retrieved. This is the core cross-user access prevention guarantee.
 * 2. Search the knowledge corpus for relevant policy documents.
 * 3. Build a grounded system prompt with both data and policy context.
 * 4. Send to qwen2.5:3b via Ollama.
 * 5. Return structured answer with data sources + knowledge sources.
 *
 * Constraints (v1):
 * - Session-only: no conversation history stored or sent to Ollama.
 * - No autonomous actions: AI never calls write APIs or modifies data.
 * - No tool execution: pure prompt-in, text-out.
 * - Student-only: requires STUDENT role (enforced in route middleware).
 */

/** System prompt for the Student AI. Explicitly scoped to read-only, own data only. */
const STUDENT_SYSTEM_PROMPT = `You are the SmartHostel X Student Assistant — a helpful, friendly, and accurate AI assistant for hostel students.

YOUR ROLE:
- Answer questions about the student's own hostel situation using their personal data provided below.
- Answer questions about hostel rules, policies, and procedures using the knowledge documents provided below.
- Guide students on how to use the Student Portal.

STRICT RULES — YOU MUST FOLLOW THESE EXACTLY:
1. You are a READ-ONLY assistant. You cannot perform any actions, submit requests, modify data, or execute commands.
2. Only use information from the STUDENT DATA and KNOWLEDGE DOCUMENTS sections provided below.
3. Never reveal data about ANY other student. You only have access to this specific student's information.
4. Never reveal admin intelligence, occupancy analytics, operational alerts, or warden-level information.
5. Use the RELEVANT HOSTEL POLICIES to answer policy/rules questions. If the policies do not contain the answer, reply EXACTLY with the word "NO_POLICY_FOUND" and nothing else.
6. Never fabricate numbers, dates, or amounts. Only state what is in the provided data.
7. Be concise, direct, and friendly. Use bullet points for lists (using plain dashes). Do NOT use any markdown formatting whatsoever — no **bold**, no ## headers, no --- lines, and no tables.
8. When citing policy, mention the policy name at the end: "Source: [Policy Name]"
9. Do not guess. Do not hallucinate. Do not role-play as anyone else.
10. Answer the question directly. Do not apologize.`;

export interface StudentAIAnswer {
    answer: string;
    dataSources: string[];       // Personal data categories used (e.g. ["fees", "attendance"])
    knowledgeSources: { id: string; title: string; category: string }[];
}

/**
 * Build a concise, budgeted context string from the student's own data.
 * CRITICAL: residentId comes exclusively from the JWT. The question text never
 * influences which data is fetched or which residentId is used.
 */
async function buildStudentContext(residentId: string): Promise<{
    contextText: string;
    dataSources: string[];
}> {
    // Fetch all own data in parallel — residentId is from JWT, not user input
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [resident, invoices, attendanceLogs, openMaintenance, recentVisitors] = await Promise.all([
        prisma.resident.findUnique({
            where: { id: residentId },
            include: { room: true },
        }),
        prisma.feeInvoice.findMany({
            where: { residentId },
            include: { payments: { orderBy: { paidAt: 'desc' }, take: 3 } },
            orderBy: { dueDate: 'desc' },
            take: 6,
        }),
        prisma.attendanceLog.findMany({
            where: { residentId, date: { gte: thirtyDaysAgo } },
            orderBy: { date: 'desc' },
            take: 30,
        }),
        prisma.maintenanceRequest.findMany({
            where: { residentId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
            orderBy: { createdAt: 'desc' },
            take: 5,
        }),
        prisma.visitorLog.findMany({
            where: { residentId },
            orderBy: { checkInTime: 'desc' },
            take: 5,
        }),
    ]);

    const sections: string[] = [];
    const dataSources: string[] = [];

    // --- Profile section ---
    if (resident) {
        sections.push(
            `[STUDENT PROFILE]\n` +
            `Name: ${resident.fullName}\n` +
            `Email: ${resident.email}\n` +
            `Phone: ${resident.phone || 'Not provided'}\n` +
            `Status: ${resident.status}\n` +
            (resident.room
                ? `Room: ${resident.room.roomNumber} (${resident.room.type}, Floor ${resident.room.floor ?? 'N/A'}, Capacity: ${resident.room.capacity})`
                : `Room: Not assigned`)
        );
        dataSources.push('profile');
    }

    // --- Fees section ---
    if (invoices.length > 0) {
        const pendingInvoices = invoices.filter(i => i.status !== 'PAID');
        const totalOwed = pendingInvoices.reduce((s, i) => s + i.amount, 0);
        const totalPaid = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.amount, 0);
        const nextDue = pendingInvoices.sort((a, b) =>
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        )[0];

        const invoiceLines = invoices.slice(0, 4).map(inv =>
            `  - ${inv.description || 'Hostel Fee'} | ₹${inv.amount} | Due: ${new Date(inv.dueDate).toDateString()} | Status: ${inv.status}` +
            (inv.payments.length > 0 ? ` | Last payment: ₹${inv.payments[0].amount} on ${new Date(inv.payments[0].paidAt).toDateString()}` : '')
        ).join('\n');

        sections.push(
            `[FEE INFORMATION]\n` +
            `Total Outstanding: ₹${totalOwed}\n` +
            `Total Paid (all time): ₹${totalPaid}\n` +
            (nextDue ? `Next Due: ₹${nextDue.amount} by ${new Date(nextDue.dueDate).toDateString()} [${nextDue.status}]\n` : '') +
            `Recent Invoices:\n${invoiceLines}`
        );
        dataSources.push('fees');
    }

    // --- Attendance section ---
    if (attendanceLogs.length > 0) {
        const presentDays = attendanceLogs.filter(l => l.status === 'PRESENT').length;
        const absentDays = attendanceLogs.filter(l => l.status === 'ABSENT').length;
        const leaveDays = attendanceLogs.filter(l => l.status === 'LEAVE').length;
        const rate = Math.round((presentDays / attendanceLogs.length) * 100);

        // Streak from most recent
        let streak = 0;
        for (const log of attendanceLogs) {
            if (log.status === 'PRESENT') streak++;
            else break;
        }

        sections.push(
            `[ATTENDANCE (Last 30 Days)]\n` +
            `Attendance Rate: ${rate}%\n` +
            `Present: ${presentDays} days | Absent: ${absentDays} days | Leave: ${leaveDays} days\n` +
            `Current Streak: ${streak} consecutive present days\n` +
            `Total Records: ${attendanceLogs.length} days tracked`
        );
        dataSources.push('attendance');
    }

    // --- Maintenance section ---
    if (openMaintenance.length > 0) {
        const maintenanceLines = openMaintenance.map(m =>
            `  - [${m.status}] ${m.category}: ${m.description.slice(0, 80)} | Priority: ${m.priority} | Submitted: ${new Date(m.createdAt).toDateString()}`
        ).join('\n');

        sections.push(
            `[OPEN MAINTENANCE REQUESTS (${openMaintenance.length})]\n${maintenanceLines}`
        );
        dataSources.push('maintenance');
    } else {
        sections.push('[OPEN MAINTENANCE REQUESTS]\nNo open maintenance requests.');
    }

    // --- Visitors section ---
    if (recentVisitors.length > 0) {
        const visitorLines = recentVisitors.map(v =>
            `  - ${v.visitorName} | ${v.purpose} | In: ${new Date(v.checkInTime).toDateString()}` +
            (v.checkOutTime ? ` | Out: ${new Date(v.checkOutTime).toDateString()}` : ' | Still inside')
        ).join('\n');

        sections.push(
            `[RECENT VISITORS (Last ${recentVisitors.length})]\n${visitorLines}`
        );
        dataSources.push('visitors');
    }

    const rawContext = sections.join('\n\n');
    const contextText = budgetContext(rawContext, 6_000); // Reserve 2000 chars for policy docs

    return { contextText, dataSources };
}

/**
 * Detect if a message is a greeting/social phrase that doesn't need RAG.
 * Returns a greeting response string, or null if not a greeting.
 */
function detectGreeting(question: string): string | null {
    const q = question.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
    const greetingPatterns = [
        /^(hi|hey|hello|hiya|yo)$/,
        /^(hi|hey|hello)\s+(there|assistant|bot|ai)?$/,
        /^good\s+(morning|afternoon|evening|night)$/,
        /^how\s+are\s+(you|u)\b/,
        /^(what('s| is)\s+up|sup|wassup)$/,
        /^(thanks|thank\s+you|ty|thx)$/,
        /^(ok|okay|alright|great|cool|got\s+it)$/,
        /^(bye|goodbye|see\s+you|take\s+care)$/,
    ];
    if (greetingPatterns.some(p => p.test(q))) {
        const hour = new Date().getHours();
        const timeOfDay = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
        return `${timeOfDay}! I'm your SmartHostel X Student Assistant. I can help you with your fees, attendance, room details, hostel policies, and maintenance requests. What would you like to know?`;
    }
    return null;
}

/**
 * Detect if the question is asking for structured personal data.
 * Returns the data intent category, or null if the question needs LLM reasoning.
 */
function detectDataIntent(question: string): DataIntent {
    const q = question.toLowerCase().replace(/[^a-z0-9\s]/g, '');

    // Fee intent patterns — match factual fee queries, exclude procedural/policy questions
    if (/\b(fee|fees|owe|owing|outstanding|due|payment|pay|invoice|bill|amount|pending|balance)\b/.test(q) &&
        !/\b(policy|rule|procedure|deadline|late|penalty|fine|waive)\b/.test(q) &&
        !/\bhow\s+(to|do|can|should)\b/.test(q)) {
        return 'fees';
    }

    // Attendance intent patterns
    if (/\b(attendance|present|absent|streak)\b/.test(q) &&
        !/\b(policy|rule|bunk|skip|minimum|required|consequence|what happens|can i)\b/.test(q)) {
        return 'attendance';
    }

    // Room intent patterns — match factual room queries, exclude swap/procedure questions
    if (/\b(room|assigned|allot|accommodation|bed|floor|capacity)\b/.test(q) &&
        !/\b(swap|change|shift|policy|rule|procedure|request)\b/.test(q) &&
        !/\bhow\s+(to|do|can|should)\b/.test(q)) {
        return 'room';
    }

    // Maintenance intent patterns
    if (/\b(maintenance|repair|complaint|issue|request|broken|fix)\b/.test(q) &&
        /\b(status|my|open|pending|track|check)\b/.test(q) &&
        !/\b(how|procedure|submit|new|create)\b/.test(q)) {
        return 'maintenance';
    }

    // Visitor intent patterns
    if (/\b(visitor|guest|visit)/.test(q) &&
        /\b(my|recent|last|who|list|today|came)\b/.test(q) &&
        !/\b(policy|rule|timing|allowed|procedure|how|register)\b/.test(q)) {
        return 'visitors';
    }
    // Also catch "my visitors" or "my recent visitors" directly
    if (/\bmy\s+(recent\s+)?(visitor|guest|visit)/.test(q)) {
        return 'visitors';
    }

    // Profile intent patterns
    if (/\b(profile|my name|my email|my phone|my details|my info|about me|who am i)\b/.test(q)) {
        return 'profile';
    }

    return null;
}

// ─── Deterministic Response Templates ────────────────────────────────────────

/**
 * Format a number as Indian currency with commas.
 * Example: 8500 → "₹8,500"
 */
function formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Format a date in a short, readable form.
 * Example: "10 Jun 2026"
 */
function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
}

/**
 * Build a deterministic fee response from structured data.
 * Always returns the exact same format for the same data.
 */
async function buildFeeTemplate(residentId: string): Promise<StudentAIAnswer> {
    const invoices = await prisma.feeInvoice.findMany({
        where: { residentId },
        include: { payments: { orderBy: { paidAt: 'desc' }, take: 1 } },
        orderBy: { dueDate: 'desc' },
        take: 6,
    });

    if (invoices.length === 0) {
        return {
            answer: 'No fee records found for your account.',
            dataSources: ['fees'],
            knowledgeSources: [],
        };
    }

    const pending = invoices.filter(i => i.status !== 'PAID');
    const totalOwed = pending.reduce((s, i) => s + i.amount, 0);
    const nextDue = pending.sort((a, b) =>
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    )[0];

    const lines: string[] = [];
    lines.push(`Outstanding Fee: ${formatCurrency(totalOwed)}`);
    if (nextDue) {
        lines.push(`Due Date: ${formatDate(nextDue.dueDate)}`);
        lines.push(`Status: ${nextDue.status}`);
    }
    if (pending.length > 1) {
        lines.push(`Pending Invoices: ${pending.length}`);
    }

    // Add recent invoice breakdown
    if (invoices.length > 0) {
        lines.push('');
        lines.push('Recent Invoices:');
        for (const inv of invoices.slice(0, 4)) {
            const desc = inv.description || 'Hostel Fee';
            lines.push(`- ${desc}: ${formatCurrency(inv.amount)} | Due: ${formatDate(inv.dueDate)} | ${inv.status}`);
        }
    }

    return {
        answer: lines.join('\n'),
        dataSources: ['fees'],
        knowledgeSources: [],
    };
}

/**
 * Build a deterministic attendance response from structured data.
 */
async function buildAttendanceTemplate(residentId: string): Promise<StudentAIAnswer> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await prisma.attendanceLog.findMany({
        where: { residentId, date: { gte: thirtyDaysAgo } },
        orderBy: { date: 'desc' },
        take: 30,
    });

    if (logs.length === 0) {
        return {
            answer: 'No attendance records found for the last 30 days.',
            dataSources: ['attendance'],
            knowledgeSources: [],
        };
    }

    const present = logs.filter(l => l.status === 'PRESENT').length;
    const absent = logs.filter(l => l.status === 'ABSENT').length;
    const leave = logs.filter(l => l.status === 'LEAVE').length;
    const rate = Math.round((present / logs.length) * 100);

    let streak = 0;
    for (const log of logs) {
        if (log.status === 'PRESENT') streak++;
        else break;
    }

    const standing = rate >= 75 ? 'Good Standing' : rate >= 60 ? 'Warning' : 'Critical';

    const lines: string[] = [];
    lines.push(`Attendance: ${rate}%`);
    lines.push(`Status: ${standing}`);
    lines.push(`Present: ${present} days | Absent: ${absent} days | Leave: ${leave} days`);
    lines.push(`Current Streak: ${streak} consecutive present days`);
    lines.push(`Period: Last 30 days (${logs.length} days tracked)`);

    return {
        answer: lines.join('\n'),
        dataSources: ['attendance'],
        knowledgeSources: [],
    };
}

/**
 * Build a deterministic room response from structured data.
 */
async function buildRoomTemplate(residentId: string): Promise<StudentAIAnswer> {
    const resident = await prisma.resident.findUnique({
        where: { id: residentId },
        include: { room: true },
    });

    if (!resident) {
        return {
            answer: 'Student profile not found.',
            dataSources: ['profile'],
            knowledgeSources: [],
        };
    }

    if (!resident.room) {
        return {
            answer: 'Room: Not assigned\nPlease contact the warden\'s office for room allocation.',
            dataSources: ['profile'],
            knowledgeSources: [],
        };
    }

    const r = resident.room;
    const lines: string[] = [];
    lines.push(`Room Number: ${r.roomNumber}`);
    lines.push(`Type: ${r.type}`);
    lines.push(`Floor: ${r.floor ?? 'N/A'}`);
    lines.push(`Capacity: ${r.capacity}`);
    lines.push(`Status: Assigned`);

    return {
        answer: lines.join('\n'),
        dataSources: ['profile'],
        knowledgeSources: [],
    };
}

/**
 * Build a deterministic maintenance status response from structured data.
 */
async function buildMaintenanceTemplate(residentId: string): Promise<StudentAIAnswer> {
    const requests = await prisma.maintenanceRequest.findMany({
        where: { residentId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
        orderBy: { createdAt: 'desc' },
        take: 5,
    });

    if (requests.length === 0) {
        return {
            answer: 'No open maintenance requests.',
            dataSources: ['maintenance'],
            knowledgeSources: [],
        };
    }

    const lines: string[] = [];
    lines.push(`Open Requests: ${requests.length}`);
    lines.push('');
    for (const req of requests) {
        lines.push(`- [${req.status}] ${req.category}: ${req.description.slice(0, 80)}`);
        lines.push(`  Priority: ${req.priority} | Submitted: ${formatDate(req.createdAt)}`);
    }

    return {
        answer: lines.join('\n'),
        dataSources: ['maintenance'],
        knowledgeSources: [],
    };
}

/**
 * Build a deterministic visitor list response from structured data.
 */
async function buildVisitorTemplate(residentId: string): Promise<StudentAIAnswer> {
    const visitors = await prisma.visitorLog.findMany({
        where: { residentId },
        orderBy: { checkInTime: 'desc' },
        take: 5,
    });

    if (visitors.length === 0) {
        return {
            answer: 'No recent visitor records found.',
            dataSources: ['visitors'],
            knowledgeSources: [],
        };
    }

    const lines: string[] = [];
    lines.push(`Recent Visitors: ${visitors.length}`);
    lines.push('');
    for (const v of visitors) {
        const status = v.checkOutTime ? 'Exited' : 'Inside';
        lines.push(`- ${v.visitorName} | ${v.purpose} | ${status}`);
        lines.push(`  Check-in: ${formatDate(v.checkInTime)}${v.checkOutTime ? ` | Check-out: ${formatDate(v.checkOutTime)}` : ''}`);
    }

    return {
        answer: lines.join('\n'),
        dataSources: ['visitors'],
        knowledgeSources: [],
    };
}

/**
 * Build a deterministic profile response from structured data.
 */
async function buildProfileTemplate(residentId: string): Promise<StudentAIAnswer> {
    const resident = await prisma.resident.findUnique({
        where: { id: residentId },
        include: { room: true },
    });

    if (!resident) {
        return {
            answer: 'Student profile not found.',
            dataSources: ['profile'],
            knowledgeSources: [],
        };
    }

    const lines: string[] = [];
    lines.push(`Name: ${resident.fullName}`);
    lines.push(`Email: ${resident.email}`);
    lines.push(`Phone: ${resident.phone || 'Not provided'}`);
    lines.push(`Status: ${resident.status}`);
    lines.push(`Room: ${resident.room ? `${resident.room.roomNumber} (${resident.room.type})` : 'Not assigned'}`);

    return {
        answer: lines.join('\n'),
        dataSources: ['profile'],
        knowledgeSources: [],
    };
}

/**
 * Route a detected data intent to its corresponding template builder.
 * Returns a deterministic, formatted response without LLM involvement.
 */
async function buildStructuredResponse(intent: DataIntent, residentId: string): Promise<StudentAIAnswer | null> {
    switch (intent) {
        case 'fees':        return buildFeeTemplate(residentId);
        case 'attendance':  return buildAttendanceTemplate(residentId);
        case 'room':        return buildRoomTemplate(residentId);
        case 'maintenance': return buildMaintenanceTemplate(residentId);
        case 'visitors':    return buildVisitorTemplate(residentId);
        case 'profile':     return buildProfileTemplate(residentId);
        default:            return null;
    }
}

/**
 * Build an intent hint for informal language.
 * When a student uses slang like "bunk" or "skip", this generates a plain-language
 * hint that tells the LLM what policy topic the question relates to.
 * This compensates for the 3B model's limited inference capability.
 */
function buildIntentHint(question: string): string | null {
    const q = question.toLowerCase();

    const hintMap: [RegExp, string][] = [
        [/\b(bunk|skip|ditch|miss|absent)\b.*\b(hostel|class|attendance|room)\b/,
            'The student is asking about skipping attendance. Answer using the Attendance Policy — explain the minimum attendance requirement and consequences.'],
        [/\b(can i|am i allowed|is it ok)\b.*\b(skip|bunk|miss|leave|absent)\b/,
            'The student is asking whether they can skip or be absent. Answer using the Attendance Policy — explain what happens if attendance falls below the minimum.'],
        [/\b(leave|go home|outing|checkout)\b.*\b(without|no)\b.*\b(permission|approval|inform)\b/,
            'The student is asking about leaving without permission. Answer using the Leave Procedure — explain the required steps.'],
        [/\b(can i|am i allowed)\b.*\b(leave|go)\b/,
            'The student is asking about leaving the hostel. Answer using the Leave Procedure — explain the required steps and approval process.'],
    ];

    for (const [pattern, hint] of hintMap) {
        if (pattern.test(q)) return hint;
    }
    return null;
}

/**
 * Expand a question into broader search terms using synonym mapping.
 * Maps informal student language to official hostel terminology.
 */
function expandKeywords(question: string): string[] {
    const synonymMap: Record<string, string[]> = {
        // Attendance-related
        bunk:        ['attendance', 'absent', 'leave'],
        skip:        ['attendance', 'absent', 'leave'],
        absent:      ['attendance', 'leave', 'policy'],
        attendance:  ['attendance', 'present', 'absent', 'leave', 'policy'],
        // Leave/permission
        permission:  ['leave', 'permission', 'checkout', 'procedure'],
        leave:       ['leave', 'checkout', 'permission', 'procedure'],
        go:          ['checkout', 'leave', 'permission', 'procedure'],
        outing:      ['checkout', 'leave', 'permission'],
        home:        ['checkout', 'leave', 'procedure'],
        // Visitor
        visitor:     ['visitor', 'guest', 'timing', 'policy'],
        guest:       ['visitor', 'guest', 'timing', 'policy'],
        friend:      ['visitor', 'guest', 'timing'],
        timing:      ['visitor', 'timing', 'policy'],
        // Fees
        fee:         ['fee', 'payment', 'due', 'invoice'],
        pay:         ['fee', 'payment', 'due', 'invoice'],
        money:       ['fee', 'payment', 'amount'],
        owe:         ['fee', 'outstanding', 'due', 'payment'],
        fine:        ['fee', 'penalty', 'fine'],
        // Maintenance
        repair:      ['maintenance', 'repair', 'request'],
        fix:         ['maintenance', 'repair', 'request'],
        broken:      ['maintenance', 'repair', 'request'],
        issue:       ['maintenance', 'request', 'procedure'],
        complaint:   ['maintenance', 'request', 'complaint'],
        // Mess/food
        mess:        ['mess', 'food', 'meal'],
        food:        ['mess', 'food', 'meal'],
        meal:        ['mess', 'food', 'meal'],
        // Rules
        rule:        ['rules', 'policy', 'regulation'],
        allowed:     ['rules', 'policy', 'allowed', 'permission'],
        prohibited:  ['rules', 'policy', 'prohibited'],
        curfew:      ['rules', 'timing', 'curfew', 'policy'],
        night:       ['curfew', 'timing', 'rules'],
    };

    const stopWords = new Set([
        'what', 'when', 'where', 'how', 'who', 'why', 'is', 'are', 'the', 'a', 'an',
        'and', 'or', 'can', 'i', 'my', 'do', 'does', 'me', 'have', 'has', 'will',
        'would', 'could', 'should', 'for', 'to', 'in', 'of', 'on', 'at', 'this',
        'that', 'it', 'be', 'not', 'no', 'yes', 'if', 'then', 'with', 'from',
    ]);

    const baseKeywords = question.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopWords.has(w));

    const expanded = new Set<string>(baseKeywords);
    for (const word of baseKeywords) {
        const synonyms = synonymMap[word];
        if (synonyms) synonyms.forEach(s => expanded.add(s));
    }

    return Array.from(expanded);
}

/**
 * Search knowledge documents for policy context relevant to the question.
 * Uses semantic keyword expansion + scoring to handle informal student language.
 */
async function searchRelevantPolicies(question: string, limit = 3) {
    const keywords = expandKeywords(question);

    // If no meaningful keywords even after expansion, return empty
    if (keywords.length === 0) return [];

    const results = await prisma.knowledgeDocument.findMany({
        where: {
            isActive: true,
            OR: keywords.map(kw => ({
                OR: [
                    { title: { contains: kw, mode: 'insensitive' as const } },
                    { content: { contains: kw, mode: 'insensitive' as const } },
                    { tags: { contains: kw, mode: 'insensitive' as const } },
                ],
            })),
        },
        take: limit * 3,
    });

    const scored = results.map(doc => {
        const text = `${doc.title} ${doc.content} ${doc.tags ?? ''}`.toLowerCase();
        const score = keywords.filter(kw => text.includes(kw)).length;
        return { doc, score };
    });

    return scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(s => s.doc);
}

/**
 * Main Student AI function.
 *
 * Security guarantees:
 * - residentId is from JWT only (passed by controller after requireRole(['STUDENT']))
 * - question text is sanitized before any use
 * - question text NEVER influences which data is fetched (data is always all-own-data)
 * - no conversation history in v1 (stateless)
 * - no write operations
 */
export async function studentAsk(
    residentId: string,
    question: string
): Promise<StudentAIAnswer> {
    // 1. Sanitize input — throws PromptInjectionError or InputTooLongError if invalid
    const safeQuestion = sanitizeInput(question, {
        maxChars: 500,
        context: 'student question',
    });

    // 2. Greeting intent detection — short-circuits before any DB call or LLM call
    const greetingResponse = detectGreeting(safeQuestion);
    if (greetingResponse) {
        return {
            answer: greetingResponse,
            dataSources: [],
            knowledgeSources: [],
        };
    }

    // 3. Structured data intent detection — deterministic templates, no LLM
    const dataIntent = detectDataIntent(safeQuestion);
    if (dataIntent) {
        logger.info({ residentId, intent: dataIntent }, '[StudentAI] Structured data intent detected — using template');
        const structured = await buildStructuredResponse(dataIntent, residentId);
        if (structured) return structured;
    }

    // 4. Fetch student's own data for LLM context (residentId from JWT, not from question)
    const { contextText: studentContext, dataSources } = await buildStudentContext(residentId);

    // 5. Search knowledge corpus for relevant policy documents
    const policyDocs = await searchRelevantPolicies(safeQuestion);
    const policyContext = policyDocs.length > 0
        ? budgetContext(
            policyDocs.map(doc =>
                `--- Policy: "${doc.title}" [${doc.category}] ---\n${doc.content}`
            ).join('\n\n'),
            2_000
        )
        : '';

    // 6. Build intent hint for informal language — helps 3B model connect slang to policy
    const intentHint = buildIntentHint(safeQuestion);

    // 7. Build Ollama messages — system prompt + student data + policy + question
    const userContent = [
        '=== STUDENT DATA (your personal information) ===',
        studentContext,
        policyDocs.length > 0 ? '\n=== RELEVANT HOSTEL POLICIES ===' : '',
        policyDocs.length > 0 ? policyContext : '',
        '\n---',
        intentHint ? `Hint: ${intentHint}` : '',
        `Question: ${safeQuestion}`,
    ].filter(Boolean).join('\n');

    const messages: OllamaMessage[] = [
        { role: 'system', content: STUDENT_SYSTEM_PROMPT },
        { role: 'user', content: userContent },
    ];

    // 8. Call Ollama — low temperature for factual accuracy, capped response length
    logger.info({ residentId, questionLength: safeQuestion.length, policyDocs: policyDocs.length }, '[StudentAI] Calling Ollama');
    const rawAnswer = await chat(messages, { temperature: 0.2, numPredict: 500 });

    // 9. Validate and sanitize the response
    let answer = validateResponse(rawAnswer, {
        fallback: "I'm sorry, I couldn't generate an answer right now. Please contact the warden's office or hostel office directly.",
    });

    if (answer.includes('NO_POLICY_FOUND')) {
        answer = "I don't have a specific hostel policy for that. Please contact the warden's office directly.";
    }

    return {
        answer,
        dataSources,
        knowledgeSources: policyDocs.map(d => ({ id: d.id, title: d.title, category: d.category })),
    };
}
