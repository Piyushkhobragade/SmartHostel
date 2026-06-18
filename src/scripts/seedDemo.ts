/**
 * Rich seed script for SmartHostel X demo data.
 * Run with:  npx ts-node src/scripts/seedDemo.ts
 *
 * Seeds:
 *  - 20 rooms across 2 blocks (A, B), 2 floors each
 *  - 15 active residents spread across rooms
 *  - Attendance for last 7 days
 *  - 5 fee invoices (3 overdue, 2 pending)
 *  - 4 maintenance requests (1 URGENT)
 *  - 3 visitor logs (1 active)
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const ROOMS: Array<{
    roomNumber: string; capacity: number; type: string; floor: string; block: string;
}> = [
    // Block A — Floor 1
    { roomNumber: 'A101', capacity: 2, type: 'AC', floor: '1', block: 'A' },
    { roomNumber: 'A102', capacity: 3, type: 'AC', floor: '1', block: 'A' },
    { roomNumber: 'A103', capacity: 2, type: 'NON_AC', floor: '1', block: 'A' },
    { roomNumber: 'A104', capacity: 4, type: 'DORMITORY', floor: '1', block: 'A' },
    { roomNumber: 'A105', capacity: 1, type: 'SINGLE', floor: '1', block: 'A' },
    // Block A — Floor 2
    { roomNumber: 'A201', capacity: 2, type: 'AC', floor: '2', block: 'A' },
    { roomNumber: 'A202', capacity: 2, type: 'AC', floor: '2', block: 'A' },
    { roomNumber: 'A203', capacity: 3, type: 'NON_AC', floor: '2', block: 'A' },
    { roomNumber: 'A204', capacity: 2, type: 'AC', floor: '2', block: 'A' },
    { roomNumber: 'A205', capacity: 4, type: 'DORMITORY', floor: '2', block: 'A' },
    // Block B — Floor 1
    { roomNumber: 'B101', capacity: 2, type: 'AC', floor: '1', block: 'B' },
    { roomNumber: 'B102', capacity: 2, type: 'NON_AC', floor: '1', block: 'B' },
    { roomNumber: 'B103', capacity: 3, type: 'AC', floor: '1', block: 'B' },
    { roomNumber: 'B104', capacity: 2, type: 'SINGLE', floor: '1', block: 'B' },
    { roomNumber: 'B105', capacity: 4, type: 'DORMITORY', floor: '1', block: 'B' },
    // Block B — Floor 2
    { roomNumber: 'B201', capacity: 2, type: 'AC', floor: '2', block: 'B' },
    { roomNumber: 'B202', capacity: 2, type: 'AC', floor: '2', block: 'B' },
    { roomNumber: 'B203', capacity: 3, type: 'NON_AC', floor: '2', block: 'B' },
    { roomNumber: 'B204', capacity: 2, type: 'AC', floor: '2', block: 'B' },
    { roomNumber: 'B205', capacity: 1, type: 'SINGLE', floor: '2', block: 'B' },
];

const RESIDENTS = [
    { fullName: 'Arjun Sharma', email: 'arjun.sharma@example.com', phone: '9876543201', roomIdx: 0 },
    { fullName: 'Priya Patel', email: 'priya.patel@example.com', phone: '9876543202', roomIdx: 0 },
    { fullName: 'Rohit Verma', email: 'rohit.verma@example.com', phone: '9876543203', roomIdx: 1 },
    { fullName: 'Sneha Gupta', email: 'sneha.gupta@example.com', phone: '9876543204', roomIdx: 1 },
    { fullName: 'Kiran Mehta', email: 'kiran.mehta@example.com', phone: '9876543205', roomIdx: 2 },
    { fullName: 'Rahul Singh', email: 'rahul.singh@example.com', phone: '9876543206', roomIdx: 3 },
    { fullName: 'Anjali Rao', email: 'anjali.rao@example.com', phone: '9876543207', roomIdx: 3 },
    { fullName: 'Vikram Das', email: 'vikram.das@example.com', phone: '9876543208', roomIdx: 5 },
    { fullName: 'Neha Joshi', email: 'neha.joshi@example.com', phone: '9876543209', roomIdx: 5 },
    { fullName: 'Aditya Kumar', email: 'aditya.kumar@example.com', phone: '9876543210', roomIdx: 10 },
    { fullName: 'Meera Nair', email: 'meera.nair@example.com', phone: '9876543211', roomIdx: 10 },
    { fullName: 'Suresh Pillai', email: 'suresh.pillai@example.com', phone: '9876543212', roomIdx: 12 },
    { fullName: 'Deepa Menon', email: 'deepa.menon@example.com', phone: '9876543213', roomIdx: 15 },
    { fullName: 'Rajesh Yadav', email: 'rajesh.yadav@example.com', phone: '9876543214', roomIdx: 16 },
    { fullName: 'Pooja Sinha', email: 'pooja.sinha@example.com', phone: '9876543215', roomIdx: 18 },
];

async function main() {
    console.log('🌱 Starting rich demo seed...');

    // 1. Seed rooms
    console.log('  🏠 Seeding rooms...');
    const createdRooms: any[] = [];
    for (const r of ROOMS) {
        const existing = await prisma.room.findUnique({ where: { roomNumber: r.roomNumber } });
        if (!existing) {
            const room = await prisma.room.create({ data: { ...r, status: 'AVAILABLE', currentOccupancy: 0 } });
            createdRooms.push(room);
        } else {
            createdRooms.push(existing);
        }
    }
    console.log(`  ✅ ${createdRooms.length} rooms ready`);

    // 2. Seed residents
    console.log('  👤 Seeding residents...');
    const createdResidents: any[] = [];
    for (const r of RESIDENTS) {
        const existing = await prisma.resident.findUnique({ where: { email: r.email } });
        if (!existing) {
            const room = createdRooms[r.roomIdx];
            const resident = await prisma.resident.create({
                data: {
                    fullName: r.fullName,
                    email: r.email,
                    phone: r.phone,
                    status: 'ACTIVE',
                    roomId: room.id,
                }
            });
            await prisma.room.update({ where: { id: room.id }, data: { currentOccupancy: { increment: 1 }, status: 'OCCUPIED' } });
            createdResidents.push(resident);
        } else {
            createdResidents.push(existing);
        }
    }
    console.log(`  ✅ ${createdResidents.length} residents ready`);

    // 3. Seed attendance for last 7 days
    console.log('  📅 Seeding attendance...');
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);

        for (const resident of createdResidents) {
            const existing = await prisma.attendanceLog.findFirst({ where: { residentId: resident.id, date: d } });
            if (!existing) {
                // Simulate some absentees
                const isAbsent = Math.random() < 0.1;
                await prisma.attendanceLog.create({
                    data: {
                        residentId: resident.id,
                        date: d,
                        status: isAbsent ? 'ABSENT' : 'PRESENT',
                        method: 'MANUAL',
                    }
                });
            }
        }
    }
    console.log('  ✅ Attendance seeded');

    // 4. Seed fee invoices
    console.log('  💰 Seeding fee invoices...');
    const feeData = [
        { residentIdx: 0, amount: 8500, daysOverdue: 15, status: 'OVERDUE', desc: 'Monthly Hostel Fee - May 2026' },
        { residentIdx: 2, amount: 9200, daysOverdue: 8, status: 'OVERDUE', desc: 'Monthly Hostel Fee - May 2026' },
        { residentIdx: 4, amount: 8500, daysOverdue: 5, status: 'OVERDUE', desc: 'Monthly Hostel Fee - May 2026' },
        { residentIdx: 6, amount: 8500, daysFuture: 7, status: 'PENDING', desc: 'Monthly Hostel Fee - June 2026' },
        { residentIdx: 9, amount: 9200, daysFuture: 14, status: 'PENDING', desc: 'Monthly Hostel Fee - June 2026' },
    ];

    for (const f of feeData) {
        const resident = createdResidents[f.residentIdx];
        if (!resident) continue;
        const existing = await prisma.feeInvoice.findFirst({ where: { residentId: resident.id, description: f.desc } });
        if (!existing) {
            const dueDate = new Date();
            if ((f as any).daysOverdue) dueDate.setDate(dueDate.getDate() - (f as any).daysOverdue);
            if ((f as any).daysFuture) dueDate.setDate(dueDate.getDate() + (f as any).daysFuture);
            await prisma.feeInvoice.create({
                data: { residentId: resident.id, amount: f.amount, dueDate, description: f.desc, status: f.status }
            });
        }
    }
    console.log('  ✅ Fee invoices seeded');

    // 5. Seed maintenance requests
    console.log('  🔧 Seeding maintenance requests...');
    const maintenanceData = [
        { residentIdx: 0, category: 'ELECTRICAL', description: 'Room light flickering and one switch not working.', priority: 'URGENT', status: 'OPEN' },
        { residentIdx: 3, category: 'PLUMBING', description: 'Bathroom tap leaking continuously for 2 days.', priority: 'HIGH', status: 'OPEN' },
        { residentIdx: 7, category: 'CARPENTRY', description: 'Wardrobe door hinge broken, cannot close properly.', priority: 'MEDIUM', status: 'IN_PROGRESS' },
        { residentIdx: 11, category: 'CLEANING', description: 'Common area cleaning required, drain blocked.', priority: 'MEDIUM', status: 'OPEN' },
    ];

    for (const m of maintenanceData) {
        const resident = createdResidents[m.residentIdx];
        if (!resident) continue;
        const existing = await prisma.maintenanceRequest.findFirst({ where: { residentId: resident.id, category: m.category } });
        if (!existing) {
            await prisma.maintenanceRequest.create({
                data: { residentId: resident.id, category: m.category, description: m.description, priority: m.priority, status: m.status }
            });
        }
    }
    console.log('  ✅ Maintenance requests seeded');

    // 6. Seed visitor logs
    console.log('  🧑‍🤝‍🧑 Seeding visitor logs...');
    const visitorData = [
        { residentIdx: 0, visitorName: 'Ramesh Sharma', purpose: 'Family Visit', checkInTime: new Date(Date.now() - 3600000), checkOutTime: new Date() },
        { residentIdx: 1, visitorName: 'Sunita Patel', purpose: 'Academic', checkInTime: new Date(Date.now() - 7200000), checkOutTime: new Date(Date.now() - 3600000) },
        { residentIdx: 4, visitorName: 'Vikash Mehta', purpose: 'Friend', checkInTime: new Date(Date.now() - 1800000), checkOutTime: null }, // Still present
    ];

    for (const v of visitorData) {
        const resident = createdResidents[v.residentIdx];
        if (!resident) continue;
        await prisma.visitorLog.create({
            data: {
                residentId: resident.id,
                visitorName: v.visitorName,
                purpose: v.purpose,
                checkInTime: v.checkInTime,
                checkOutTime: v.checkOutTime,
                idType: 'AADHAR',
                idLast4: Math.floor(1000 + Math.random() * 9000).toString(),
            }
        });
    }
    console.log('  ✅ Visitor logs seeded');

    console.log('\n🎉 Demo data seeded successfully!');
    console.log('   Blocks: A (floors 1-2), B (floors 1-2)');
    console.log(`   Rooms: ${createdRooms.length} | Residents: ${createdResidents.length}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
