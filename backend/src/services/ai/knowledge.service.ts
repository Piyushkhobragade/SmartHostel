import prisma from '../../lib/prisma';
import { chat, OllamaMessage } from './ollama';

/**
 * Knowledge AI Service
 *
 * Implements a simple RAG (Retrieval Augmented Generation) pattern:
 * 1. Search KnowledgeDocument table for relevant documents (PostgreSQL ILIKE)
 * 2. Build a grounded prompt with matching documents as context
 * 3. Call Qwen3 via Ollama with strict instructions to only answer from context
 * 4. Return answer + source references
 *
 * No vector database needed — Qwen3's large context window handles this well
 * for a hostel-scale knowledge base (< 100 documents).
 */

const SYSTEM_PROMPT = `You are the SmartHostel X Knowledge Assistant. Your job is to answer questions about hostel rules, policies, procedures, and information.

RULES:
1. Only answer based on the documents provided in the context below.
2. If the answer is not in the provided documents, respond with: "I don't have information about this. Please contact the hostel office or warden."
3. Be concise and helpful. Use bullet points for lists.
4. Always cite which document(s) you used at the end of your answer using: "Source: [Document Title]"
5. Do not make up information. Do not guess.
6. Use a friendly, professional tone.`;

export interface KnowledgeAnswer {
    answer: string;
    sources: { id: string; title: string; category: string }[];
    confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'NO_MATCH';
}

/**
 * Search knowledge documents using simple keyword matching.
 * Uses PostgreSQL ILIKE for case-insensitive search across title, content, and tags.
 */
async function searchDocuments(question: string, limit = 5) {
    // Extract meaningful keywords (skip common words)
    const stopWords = new Set(['what', 'when', 'where', 'how', 'who', 'why', 'is', 'are', 'the', 'a', 'an', 'and', 'or', 'can', 'i', 'my', 'do', 'does']);
    const keywords = question.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopWords.has(w));

    if (keywords.length === 0) {
        // No useful keywords — return all active docs (up to limit)
        return prisma.knowledgeDocument.findMany({
            where: { isActive: true },
            take: limit,
        });
    }

    // Search for each keyword, score by number of matches
    const results = await prisma.knowledgeDocument.findMany({
        where: {
            isActive: true,
            OR: keywords.map(kw => ({
                OR: [
                    { title: { contains: kw, mode: 'insensitive' as const } },
                    { content: { contains: kw, mode: 'insensitive' as const } },
                    { tags: { contains: kw, mode: 'insensitive' as const } },
                ]
            }))
        },
        take: limit * 2, // Get more, then score and trim
    });

    // Score by keyword match count
    const scored = results.map(doc => {
        const text = `${doc.title} ${doc.content} ${doc.tags || ''}`.toLowerCase();
        const score = keywords.filter(kw => text.includes(kw)).length;
        return { doc, score };
    });

    return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(s => s.doc);
}

/**
 * Main Q&A function — answers a question using the knowledge base + Qwen3.
 */
export async function answerQuestion(question: string): Promise<KnowledgeAnswer> {
    // 1. Find relevant documents
    const docs = await searchDocuments(question);

    if (docs.length === 0) {
        return {
            answer: "I don't have information about this. Please contact the hostel office or warden directly.",
            sources: [],
            confidence: 'NO_MATCH',
        };
    }

    // 2. Build context block from matching documents
    const contextBlock = docs.map(doc =>
        `--- Document: "${doc.title}" [Category: ${doc.category}] ---\n${doc.content}`
    ).join('\n\n');

    // 3. Build the conversation for Qwen3
    const messages: OllamaMessage[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        {
            role: 'user',
            content: `Here are the relevant hostel knowledge documents:\n\n${contextBlock}\n\n---\n\nQuestion: ${question}`
        }
    ];

    // 4. Call Qwen3 via Ollama
    const answer = await chat(messages, { temperature: 0.2 }); // Low temp for factual answers

    // 5. Determine confidence based on whether Ollama said it doesn't know
    const noMatchPhrases = ["don't have information", "not in the provided", "cannot find", "no information"];
    const isNoMatch = noMatchPhrases.some(phrase => answer.toLowerCase().includes(phrase));

    return {
        answer,
        sources: docs.map(d => ({ id: d.id, title: d.title, category: d.category })),
        confidence: isNoMatch ? 'LOW' : docs.length >= 3 ? 'HIGH' : 'MEDIUM',
    };
}

/**
 * Seed initial knowledge documents — called once during setup.
 * Only inserts if the collection is empty.
 */
export async function seedKnowledgeDocuments() {
    const count = await prisma.knowledgeDocument.count();
    if (count > 0) return; // Already seeded

    const documents = [
        {
            title: 'Visitor Policy',
            category: 'RULES',
            tags: 'visitors,guests,overnight,timing',
            content: `VISITOR POLICY - SmartHostel X

1. Visiting Hours: Visitors are allowed between 9:00 AM and 9:00 PM only.
2. Overnight Stay: Overnight stay of visitors is strictly NOT permitted.
3. Visitor Registration: All visitors must be registered at the main gate with a valid government photo ID.
4. Pre-registration: Residents are encouraged to pre-register their visitors through the Student Portal to speed up the check-in process.
5. Maximum Visitors: A maximum of 2 visitors per resident at any given time.
6. Visitor Responsibility: The resident is fully responsible for the conduct of their visitor during the visit.
7. Restricted Areas: Visitors are not allowed in dining areas or common rooms after 7:00 PM.`
        },
        {
            title: 'Fee Payment Policy',
            category: 'POLICY',
            tags: 'fees,payment,due date,fine,penalty,hostel charges',
            content: `FEE PAYMENT POLICY - SmartHostel X

1. Due Date: Monthly hostel fees are due by the 10th of every month.
2. Late Fee: A late fee of ₹200 per week is charged for payments received after the due date.
3. Payment Methods: Fees can be paid via Cash, UPI, NEFT/RTGS Bank Transfer, or Debit/Credit Card at the hostel office.
4. Receipt: Always collect and keep the payment receipt. Report any discrepancy within 7 days.
5. Non-Payment: Non-payment of fees for 2 consecutive months may result in cancellation of hostel allotment.
6. Refund Policy: Fees paid are not refundable except in case of medical emergency (with documentation).
7. Fee Structure: The current monthly fee is displayed in the Student Portal under My Fees.`
        },
        {
            title: 'Mess Timings and Rules',
            category: 'POLICY',
            tags: 'mess,food,dining,breakfast,lunch,dinner,timing,meal',
            content: `MESS TIMINGS AND RULES - SmartHostel X

Meal Timings:
- Breakfast: 7:00 AM - 9:00 AM
- Lunch: 12:00 PM - 2:00 PM
- Snacks: 4:30 PM - 5:30 PM
- Dinner: 7:30 PM - 9:30 PM

Rules:
1. Mess ID: Students must show their ID card to avail mess services.
2. Outside Food: Outside food is not allowed in the dining hall.
3. Cleanliness: Students must return their plates and cutlery to the designated area after eating.
4. Dress Code: Proper attire (no sleeveless, shorts) required in the dining hall.
5. Mess Off: If you will be absent for more than 3 consecutive days, inform the mess in advance.
6. Special Diet: Students with specific dietary requirements must register with the warden's office.
7. Complaints: Food quality complaints should be submitted through the Student Portal or directly to the mess supervisor.`
        },
        {
            title: 'Room Rules and Responsibilities',
            category: 'RULES',
            tags: 'room,cleanliness,inspection,furniture,damage,checkout',
            content: `ROOM RULES AND RESPONSIBILITIES - SmartHostel X

1. Cleanliness: Each resident is responsible for keeping their room clean. Weekly room inspections are conducted.
2. Damage: Any damage to hostel property (furniture, fixtures, electrical fittings) will be charged to the responsible resident.
3. Electrical Appliances: Personal electrical appliances (except laptops, phones, fans) require prior permission from the warden.
4. Room Changes: Room change requests must be submitted through the Student Portal or in writing to the warden. Changes are subject to availability.
5. Noise: Strict silence must be maintained between 10:00 PM and 6:00 AM.
6. Prohibition: Smoking, alcohol, and other prohibited substances are absolutely not allowed in the hostel premises.
7. Room Checkout: On final checkout, the room must be handed back in the same condition as received (normal wear excepted).`
        },
        {
            title: 'Gate Timings and Curfew',
            category: 'RULES',
            tags: 'gate,curfew,timing,late,night,outing,permission',
            content: `GATE TIMINGS AND CURFEW - SmartHostel X

Regular Gate Timings:
- Main Gate Open: 6:00 AM
- Main Gate Close: 10:00 PM (Weekdays), 11:00 PM (Weekends)

Late Entry:
1. Students arriving after gate close must have a prior late-entry pass approved by the warden.
2. Habitual late entries (more than 3 times a month) will be reported to parents/guardians.
3. Emergency late entries (medical, family emergency) should be communicated to the warden immediately.

Overnight Out:
1. Overnight out permission must be applied at least 24 hours in advance.
2. Parents/Guardians must provide written consent.
3. Maximum 3 overnight passes per month are permitted.`
        },
        {
            title: 'Maintenance Request Procedure',
            category: 'PROCEDURE',
            tags: 'maintenance,repair,complaint,plumbing,electrical,furniture,request',
            content: `MAINTENANCE REQUEST PROCEDURE - SmartHostel X

How to Submit a Maintenance Request:
1. Log in to the Student Portal.
2. Navigate to "My Room" and click "Report Issue".
3. Select the category (Plumbing, Electrical, Furniture, AC, Cleaning, Internet, Other).
4. Describe the issue clearly.
5. Select priority (Low / Medium / High / Urgent).
6. Submit the request.

Response Times:
- Urgent: Response within 2 hours.
- High Priority: Resolved within 24 hours.
- Medium Priority: Resolved within 3 working days.
- Low Priority: Resolved within 7 working days.

Escalation:
- If your request is not addressed within the expected time, contact the warden's office directly.
- You can view the status of your request in "My Room" → Open Issues.`
        },
        {
            title: 'Leave Procedure',
            category: 'PROCEDURE',
            tags: 'leave,absence,home,holiday,permission,vacation,outstation',
            content: `LEAVE PROCEDURE - SmartHostel X

For Short Leave (1-3 days):
1. Inform the warden or floor in-charge verbally or via the Student Portal.
2. Return by the agreed date.

For Extended Leave (more than 3 days):
1. Submit a leave application to the warden's office at least 48 hours in advance.
2. Get written approval before leaving.
3. Inform the mess to pause your meal subscription if needed.

Medical Leave:
1. In case of hospitalization, inform the warden immediately.
2. A medical certificate from a registered doctor is required on return.
3. Extended medical leave (> 7 days) requires parent/guardian notification.

Attendance Impact:
- Approved leave days are marked as "LEAVE" in the attendance system and do not count as absences.`
        },
        {
            title: 'Emergency Contacts',
            category: 'CONTACT',
            tags: 'emergency,contact,phone,warden,security,ambulance,fire,police',
            content: `EMERGENCY CONTACTS - SmartHostel X

Hostel Contacts:
- Warden's Office: +91-XXXX-XXXXXX (9 AM - 6 PM)
- Warden Mobile (Emergency): +91-XXXX-XXXXXX (24/7)
- Security Desk (Main Gate): +91-XXXX-XXXXXX (24/7)
- Hostel Office: +91-XXXX-XXXXXX

Emergency Services:
- Ambulance: 108
- Police: 100
- Fire: 101
- Women Helpline: 1091

On-Campus Medical:
- Campus Health Center: +91-XXXX-XXXXXX (8 AM - 8 PM)

How to Reach Us:
- Email: hostel@smarthostelx.edu.in
- In person: Warden's Office, Ground Floor, Block A

For non-emergency queries, use the Student Portal AI Assistant.`
        },
        {
            title: 'Internet and Wi-Fi Policy',
            category: 'POLICY',
            tags: 'internet,wifi,network,speed,data,usage,vpn,download',
            content: `INTERNET AND WI-FI POLICY - SmartHostel X

Access:
1. Each resident receives a unique Wi-Fi login credential on arrival.
2. Sharing your credentials with non-residents is strictly prohibited.
3. Wi-Fi is available 24/7 in all rooms and common areas.

Usage Policy:
1. Internet usage is monitored for network performance purposes.
2. Illegal downloads, torrenting, and accessing prohibited websites are banned.
3. Heavy bandwidth usage (large downloads, video calls) is allowed during off-peak hours (11 PM - 7 AM) to ensure fair usage.
4. VPN usage is allowed for academic purposes only.

Speed and Data:
- Standard speed: 50 Mbps shared per floor.
- No hard data cap, but fair use policy applies.

Issues:
- Report internet issues through the Student Portal (Maintenance → Internet).
- Expected resolution: Within 24 hours.`
        },
        {
            title: 'Laundry Facilities',
            category: 'PROCEDURE',
            tags: 'laundry,washing,clothes,machine,schedule,laundromat',
            content: `LAUNDRY FACILITIES - SmartHostel X

Laundry Room Location: Ground Floor, Block B (near common room)

Timings: 7:00 AM - 10:00 PM daily

Usage:
1. Washing machines are available on a first-come, first-served basis.
2. Do not leave clothes in the machine unattended for more than 30 minutes after the cycle completes.
3. Each resident gets a maximum of 2 machine loads per day.
4. Detergent is not provided — bring your own.
5. Clothes should not be dried inside rooms (use the designated drying area near the laundry room).

Responsibility:
- The hostel is not responsible for lost or damaged clothing.
- Report machine malfunctions through the Student Portal (Maintenance → Other).`
        },
        {
            title: 'Anti-Ragging Policy',
            category: 'RULES',
            tags: 'ragging,bullying,harassment,safety,complaint,report,misconduct',
            content: `ANTI-RAGGING POLICY - SmartHostel X

Zero Tolerance:
SmartHostel X has a ZERO TOLERANCE policy towards ragging, bullying, and harassment of any kind.

What Constitutes Ragging:
- Physical, verbal, or mental harassment of any student.
- Forcing students to perform degrading acts.
- Any form of intimidation or coercion.

If You Experience Ragging:
1. Report immediately to the warden or any faculty member.
2. Call the National Anti-Ragging Helpline: 1800-180-5522 (24/7, free).
3. File an online complaint at: www.antiragging.in
4. You can also report anonymously through the hostel suggestion box.

Action Taken:
- All complaints are investigated immediately.
- Perpetrators face strict disciplinary action including expulsion from the hostel.
- Your identity as a complainant is kept confidential.`
        },
        {
            title: 'Room Change Request Policy',
            category: 'POLICY',
            tags: 'room change,transfer,swap,request,roommate,relocation',
            content: `ROOM CHANGE REQUEST POLICY - SmartHostel X

When Can You Request a Room Change:
1. Medical reasons (with doctor's certificate).
2. Extreme compatibility issues with current roommate (after counseling attempt).
3. Academic reasons (e.g., need a quieter environment).
4. Security concerns.

How to Request:
1. Submit a room change request through the Student Portal.
2. Clearly state your reason.
3. Your request will be reviewed by the warden within 3 working days.
4. You will be notified of the decision and, if approved, the new room assignment.

Important Notes:
- Room changes are subject to availability.
- Approved room changes can happen once per semester.
- If you have a specific room/roommate preference, mention it in your request.
- Frivolous or repeated requests without valid reason may be declined.`
        },
    ];

    await prisma.knowledgeDocument.createMany({ data: documents });
    console.log(`✅ [Knowledge] Seeded ${documents.length} knowledge documents.`);
}
