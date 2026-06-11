/**
 * SmartHostel — Comprehensive Demo Seed
 *
 * Creates realistic dummy data for every model:
 *   Rooms, Residents, Student Accounts, Attendance, Visitors,
 *   Fees, Payments, Maintenance, Assets, Mess, Alerts, Timeline, Knowledge Docs
 *
 * Run: npx ts-node prisma/seed.ts
 * Or:  npx prisma db seed
 */

import { PrismaClient, ResidentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱  Seeding SmartHostel demo data...\n');

  // ── 0. Clear existing data (order matters for FK constraints) ─────────────
  await prisma.copilotMessage.deleteMany();
  await prisma.copilotConversation.deleteMany();
  await prisma.operationalEvent.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.feeInvoice.deleteMany();
  await prisma.messSubscription.deleteMany();
  await prisma.roomSwapRequest.deleteMany();
  await prisma.maintenanceRequest.deleteMany();
  await prisma.visitorLog.deleteMany();
  await prisma.attendanceLog.deleteMany();
  await prisma.occupancyHistory.deleteMany();
  await prisma.knowledgeDocument.deleteMany();
  await prisma.hostelConfig.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.user.deleteMany();
  await prisma.resident.deleteMany();
  await prisma.room.deleteMany();

  console.log('  ✅ Cleared old data');

  // ── 1. Hostel Config ──────────────────────────────────────────────────────
  await prisma.hostelConfig.createMany({
    data: [
      { key: 'hostel_name',   value: '"Sunrise Boys Hostel"',  category: 'GENERAL' },
      { key: 'hostel_email',  value: '"warden@sunrisehostel.in"', category: 'GENERAL' },
      { key: 'hostel_phone',  value: '"+91-9876543210"',        category: 'GENERAL' },
      { key: 'late_fee_per_day', value: '50',                   category: 'FEES' },
      { key: 'mess_veg_fee',  value: '2500',                    category: 'FEES' },
      { key: 'mess_nonveg_fee', value: '3200',                  category: 'FEES' },
      { key: 'curfew_time',   value: '"22:00"',                 category: 'RULES' },
      { key: 'visitor_hours', value: '"09:00-20:00"',           category: 'RULES' },
    ],
  });
  console.log('  ✅ Hostel config');

  // ── 2. Rooms ──────────────────────────────────────────────────────────────
  const roomData = [
    // Block A — Ground Floor
    { roomNumber: 'A-101', capacity: 2, type: 'DOUBLE', floor: '1', block: 'A' },
    { roomNumber: 'A-102', capacity: 2, type: 'DOUBLE', floor: '1', block: 'A' },
    { roomNumber: 'A-103', capacity: 1, type: 'SINGLE', floor: '1', block: 'A' },
    { roomNumber: 'A-104', capacity: 3, type: 'TRIPLE', floor: '1', block: 'A' },
    // Block A — First Floor
    { roomNumber: 'A-201', capacity: 2, type: 'DOUBLE', floor: '2', block: 'A' },
    { roomNumber: 'A-202', capacity: 2, type: 'DOUBLE', floor: '2', block: 'A' },
    { roomNumber: 'A-203', capacity: 1, type: 'SINGLE', floor: '2', block: 'A' },
    // Block B
    { roomNumber: 'B-101', capacity: 2, type: 'DOUBLE', floor: '1', block: 'B' },
    { roomNumber: 'B-102', capacity: 3, type: 'TRIPLE', floor: '1', block: 'B' },
    { roomNumber: 'B-201', capacity: 2, type: 'DOUBLE', floor: '2', block: 'B' },
    { roomNumber: 'B-202', capacity: 1, type: 'SINGLE', floor: '2', block: 'B' },
    // Block C — Premium
    { roomNumber: 'C-101', capacity: 1, type: 'SINGLE', floor: '1', block: 'C' },
    { roomNumber: 'C-102', capacity: 2, type: 'DOUBLE', floor: '1', block: 'C' },
  ];

  const rooms = await Promise.all(
    roomData.map(r =>
      prisma.room.create({
        data: { ...r, status: 'AVAILABLE', currentOccupancy: 0 },
      })
    )
  );

  const roomMap: Record<string, string> = {};
  rooms.forEach(r => { roomMap[r.roomNumber] = r.id; });
  console.log(`  ✅ ${rooms.length} rooms`);

  // ── 3. Residents ──────────────────────────────────────────────────────────
  const residentsData = [
    { fullName: 'Arjun Sharma',      email: 'arjun.sharma@student.edu',   phone: '9876501001', roomNumber: 'A-101', status: ResidentStatus.ACTIVE },
    { fullName: 'Rahul Mehta',       email: 'rahul.mehta@student.edu',    phone: '9876501002', roomNumber: 'A-101', status: ResidentStatus.ACTIVE },
    { fullName: 'Priya Patel',       email: 'priya.patel@student.edu',    phone: '9876501003', roomNumber: 'A-102', status: ResidentStatus.ACTIVE },
    { fullName: 'Sneha Reddy',       email: 'sneha.reddy@student.edu',    phone: '9876501004', roomNumber: 'A-102', status: ResidentStatus.ACTIVE },
    { fullName: 'Vikram Singh',      email: 'vikram.singh@student.edu',   phone: '9876501005', roomNumber: 'A-103', status: ResidentStatus.ACTIVE },
    { fullName: 'Ananya Krishnan',   email: 'ananya.k@student.edu',       phone: '9876501006', roomNumber: 'A-104', status: ResidentStatus.ACTIVE },
    { fullName: 'Rohan Das',         email: 'rohan.das@student.edu',      phone: '9876501007', roomNumber: 'A-104', status: ResidentStatus.ACTIVE },
    { fullName: 'Kavya Nair',        email: 'kavya.nair@student.edu',     phone: '9876501008', roomNumber: 'A-104', status: ResidentStatus.ACTIVE },
    { fullName: 'Aditya Kumar',      email: 'aditya.kumar@student.edu',   phone: '9876501009', roomNumber: 'A-201', status: ResidentStatus.ACTIVE },
    { fullName: 'Divya Menon',       email: 'divya.menon@student.edu',    phone: '9876501010', roomNumber: 'A-201', status: ResidentStatus.ACTIVE },
    { fullName: 'Suresh Babu',       email: 'suresh.babu@student.edu',    phone: '9876501011', roomNumber: 'A-202', status: ResidentStatus.ACTIVE },
    { fullName: 'Meena Iyer',        email: 'meena.iyer@student.edu',     phone: '9876501012', roomNumber: 'A-202', status: ResidentStatus.INACTIVE },
    { fullName: 'Karthik Rao',       email: 'karthik.rao@student.edu',    phone: '9876501013', roomNumber: 'A-203', status: ResidentStatus.ACTIVE },
    { fullName: 'Pooja Sharma',      email: 'pooja.sharma@student.edu',   phone: '9876501014', roomNumber: 'B-101', status: ResidentStatus.ACTIVE },
    { fullName: 'Nikhil Verma',      email: 'nikhil.verma@student.edu',   phone: '9876501015', roomNumber: 'B-101', status: ResidentStatus.ACTIVE },
    { fullName: 'Bhavana Guptha',    email: 'bhavana.g@student.edu',      phone: '9876501016', roomNumber: 'B-102', status: ResidentStatus.ACTIVE },
    { fullName: 'Harish Pillai',     email: 'harish.pillai@student.edu',  phone: '9876501017', roomNumber: 'B-102', status: ResidentStatus.SUSPENDED },
    { fullName: 'Lakshmi Devi',      email: 'lakshmi.d@student.edu',      phone: '9876501018', roomNumber: 'B-102', status: ResidentStatus.ACTIVE },
    { fullName: 'Sanjay Patil',      email: 'sanjay.patil@student.edu',   phone: '9876501019', roomNumber: 'B-201', status: ResidentStatus.ACTIVE },
    { fullName: 'Ritu Agarwal',      email: 'ritu.agarwal@student.edu',   phone: '9876501020', roomNumber: 'B-201', status: ResidentStatus.ACTIVE },
    { fullName: 'Deepak Joshi',      email: 'deepak.joshi@student.edu',   phone: '9876501021', roomNumber: 'B-202', status: ResidentStatus.ACTIVE },
    { fullName: 'Swati Chauhan',     email: 'swati.chauhan@student.edu',  phone: '9876501022', roomNumber: 'C-101', status: ResidentStatus.ACTIVE },
    { fullName: 'Manish Tiwari',     email: 'manish.tiwari@student.edu',  phone: '9876501023', roomNumber: 'C-102', status: ResidentStatus.ACTIVE },
    { fullName: 'Geeta Pandey',      email: 'geeta.pandey@student.edu',   phone: '9876501024', roomNumber: 'C-102', status: ResidentStatus.ACTIVE },
  ];

  const residents = await Promise.all(
    residentsData.map(r =>
      prisma.resident.create({
        data: {
          fullName: r.fullName,
          email:    r.email,
          phone:    r.phone,
          status:   r.status,
          roomId:   roomMap[r.roomNumber],
        },
      })
    )
  );

  // Update room occupancies
  const occupancyCount: Record<string, number> = {};
  residentsData.forEach(r => {
    occupancyCount[r.roomNumber] = (occupancyCount[r.roomNumber] || 0) + 1;
  });
  for (const [roomNumber, count] of Object.entries(occupancyCount)) {
    const isAvailable = count < roomData.find(r => r.roomNumber === roomNumber)!.capacity;
    await prisma.room.update({
      where: { roomNumber },
      data: {
        currentOccupancy: count,
        status: isAvailable ? 'PARTIALLY_OCCUPIED' : 'OCCUPIED',
      },
    });
  }
  console.log(`  ✅ ${residents.length} residents`);

  // ── 4. User Accounts ──────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 10);
  const adminHash    = await bcrypt.hash('admin123',    10);

  // Admin account
  await prisma.user.create({
    data: {
      username:     'admin',
      passwordHash: adminHash,
      role:         'ADMIN',
    },
  });

  // Staff account
  await prisma.user.create({
    data: {
      username:     'warden',
      passwordHash: adminHash,
      role:         'STAFF',
    },
  });

  // Student accounts (one per resident, username = first name + last 3 digits of phone)
  const studentAccountResidents = residents.slice(0, 10); // first 10 residents get login
  for (const r of studentAccountResidents) {
    const username = r.fullName.split(' ')[0].toLowerCase() + r.phone.slice(-3);
    await prisma.user.create({
      data: {
        username,
        passwordHash: passwordHash,
        role:         'STUDENT',
        residentId:   r.id,
      },
    });
  }
  console.log('  ✅ User accounts (admin / warden / 10 students)');

  // ── 5. Attendance Logs (last 30 days) ─────────────────────────────────────
  const today = new Date();
  const attendanceLogs: Array<{
    residentId: string;
    status: string;
    date: Date;
    method: string;
    checkInTime: Date | null;
  }> = [];
  const statuses = ['PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'ABSENT', 'PRESENT', 'LATE'];
  for (let day = 0; day < 30; day++) {
    const date = new Date(today);
    date.setDate(today.getDate() - day);
    date.setHours(0, 0, 0, 0);

    for (const resident of residents) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const checkIn = status === 'PRESENT' || status === 'LATE' ? new Date(date.getTime() + (status === 'LATE' ? 9 : 7) * 3600000) : null;
      attendanceLogs.push({
        residentId:  resident.id,
        status,
        date,
        method:      day < 7 ? 'QR_SCAN' : 'MANUAL',
        checkInTime: checkIn,
      });
    }
  }
  await prisma.attendanceLog.createMany({ data: attendanceLogs });
  console.log(`  ✅ ${attendanceLogs.length} attendance records`);

  // ── 6. Visitor Logs ───────────────────────────────────────────────────────
  const purposes = ['Family Visit', 'Academic Assistance', 'Delivery', 'Friend Visit', 'Medical Support'];
  const idTypes  = ['AADHAR', 'PAN', 'DRIVING_LICENSE', 'PASSPORT'];
  const visitorNames = ['Ramesh Sharma', 'Sunita Mehta', 'Prakash Patel', 'Geeta Reddy', 'Mohan Kumar', 'Sita Devi', 'Rajesh Singh', 'Anita Das', 'Vinod Nair', 'Kamla Iyer'];

  const visitorData: Array<{
    visitorName: string;
    residentId: string;
    checkInTime: Date;
    checkOutTime: Date | null;
    purpose: string;
    idType: string;
    idLast4: string;
    preRegistered: boolean;
  }> = [];
  for (let i = 0; i < 25; i++) {
    const daysAgo = Math.floor(Math.random() * 14);
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() - daysAgo);
    checkIn.setHours(10 + Math.floor(Math.random() * 8), 0, 0, 0);
    const stillInside = i < 3; // 3 visitors currently inside
    const checkOut = stillInside ? null : new Date(checkIn.getTime() + (1 + Math.random() * 3) * 3600000);

    visitorData.push({
      visitorName:  visitorNames[i % visitorNames.length],
      residentId:   residents[i % residents.length].id,
      checkInTime:  checkIn,
      checkOutTime: checkOut,
      purpose:      purposes[i % purposes.length],
      idType:       idTypes[i % idTypes.length],
      idLast4:      String(1000 + Math.floor(Math.random() * 9000)),
      preRegistered: i % 3 === 0,
    });
  }
  await prisma.visitorLog.createMany({ data: visitorData });
  console.log(`  ✅ ${visitorData.length} visitor logs`);

  // ── 7. Assets ─────────────────────────────────────────────────────────────
  const assetsData = [
    { name: 'Ceiling Fan — A-101',    category: 'Electronics',  status: 'FUNCTIONAL',  location: 'Room A-101' },
    { name: 'Ceiling Fan — A-102',    category: 'Electronics',  status: 'REPAIR',      location: 'Room A-102' },
    { name: 'Study Table — A-103',    category: 'Furniture',    status: 'FUNCTIONAL',  location: 'Room A-103' },
    { name: 'Wardrobe — A-104',       category: 'Furniture',    status: 'BROKEN',      location: 'Room A-104' },
    { name: 'Water Purifier — Block A', category: 'Appliances', status: 'FUNCTIONAL',  location: 'Block A Corridor' },
    { name: 'Washing Machine #1',     category: 'Appliances',   status: 'FUNCTIONAL',  location: 'Laundry Room' },
    { name: 'Washing Machine #2',     category: 'Appliances',   status: 'REPAIR',      location: 'Laundry Room' },
    { name: 'Projector — Common Room', category: 'Electronics', status: 'FUNCTIONAL',  location: 'Common Room' },
    { name: 'Sofa Set — Lobby',       category: 'Furniture',    status: 'FUNCTIONAL',  location: 'Main Lobby' },
    { name: 'Refrigerator — Kitchen', category: 'Appliances',   status: 'WORKING',     location: 'Kitchen' },
    { name: 'Generator #1',           category: 'Electronics',  status: 'FUNCTIONAL',  location: 'Generator Room' },
    { name: 'Generator #2',           category: 'Electronics',  status: 'RETIRED',     location: 'Generator Room' },
    { name: 'CCTV Camera — Gate',     category: 'Electronics',  status: 'FUNCTIONAL',  location: 'Main Gate' },
    { name: 'Water Cooler — Block B', category: 'Appliances',   status: 'FUNCTIONAL',  location: 'Block B Corridor' },
    { name: 'Bed Frame — B-101',      category: 'Furniture',    status: 'FUNCTIONAL',  location: 'Room B-101' },
  ];

  const assets = await Promise.all(
    assetsData.map((a, i) =>
      prisma.asset.create({
        data: {
          ...a,
          purchasedAt: new Date(2023, i % 12, (i * 7 % 28) + 1),
        },
      })
    )
  );
  console.log(`  ✅ ${assets.length} assets`);

  // ── 8. Maintenance Requests ───────────────────────────────────────────────
  const maintenanceData = [
    { desc: 'Fan making loud noise at night, needs immediate repair', category: 'Electrical', priority: 'HIGH',   status: 'OPEN',        assetIdx: 1, residentIdx: 0 },
    { desc: 'Wardrobe door hinge broken, cannot lock properly',       category: 'Furniture',  priority: 'MEDIUM', status: 'IN_PROGRESS', assetIdx: 3, residentIdx: 6 },
    { desc: 'Washing machine drum not spinning, clothes get wet',     category: 'Plumbing',   priority: 'URGENT', status: 'OPEN',        assetIdx: 6, residentIdx: 2 },
    { desc: 'Leaking tap in washroom, water wastage since 3 days',    category: 'Plumbing',   priority: 'HIGH',   status: 'OPEN',        assetIdx: null, residentIdx: 4 },
    { desc: 'Room light flickering, possible wiring issue',           category: 'Electrical', priority: 'MEDIUM', status: 'RESOLVED',    assetIdx: null, residentIdx: 1 },
    { desc: 'Window glass cracked, safety hazard',                    category: 'Furniture',  priority: 'HIGH',   status: 'IN_PROGRESS', assetIdx: null, residentIdx: 8 },
    { desc: 'Common room AC not cooling properly',                    category: 'Electrical', priority: 'MEDIUM', status: 'OPEN',        assetIdx: null, residentIdx: null },
    { desc: 'Bathroom drain clogged on 2nd floor',                    category: 'Plumbing',   priority: 'HIGH',   status: 'RESOLVED',    assetIdx: null, residentIdx: 10 },
    { desc: 'Study table drawer stuck, cannot open',                  category: 'Furniture',  priority: 'LOW',    status: 'OPEN',        assetIdx: 2, residentIdx: 12 },
    { desc: 'CCTV camera angle needs adjustment — blind spot at gate', category: 'Electrical', priority: 'MEDIUM', status: 'OPEN',        assetIdx: 12, residentIdx: null },
    { desc: 'Water cooler not dispensing cold water',                  category: 'Electrical', priority: 'MEDIUM', status: 'CLOSED',      assetIdx: 13, residentIdx: null },
    { desc: 'Main entrance door lock stiff and hard to operate',      category: 'Other',      priority: 'MEDIUM', status: 'OPEN',        assetIdx: null, residentIdx: null },
  ];

  const maintenanceRecords = await Promise.all(
    maintenanceData.map(m =>
      prisma.maintenanceRequest.create({
        data: {
          description: m.desc,
          category:    m.category,
          priority:    m.priority,
          status:      m.status,
          assetId:     m.assetIdx !== null ? assets[m.assetIdx].id : null,
          residentId:  m.residentIdx !== null ? residents[m.residentIdx].id : null,
          resolvedAt:  m.status === 'RESOLVED' || m.status === 'CLOSED' ? new Date() : null,
        },
      })
    )
  );
  console.log(`  ✅ ${maintenanceRecords.length} maintenance requests`);

  // ── 9. Fee Invoices & Payments ────────────────────────────────────────────
  const months = ['June 2026', 'May 2026', 'April 2026'];
  const feeInvoices: Array<{ id: string; residentId: string; amount: number; dueDate: Date; description: string; status: string; issuedAt: Date; createdAt: Date; updatedAt: Date }> = [];

  for (const resident of residents) {
    for (let m = 0; m < months.length; m++) {
      const dueDate = new Date(2026, 5 - m, 5); // 5th of each month
      const isPaid   = m > 0 || Math.random() > 0.35; // April/May fully paid; some June pending
      const isOverdue = !isPaid && dueDate < today;

      const invoice = await prisma.feeInvoice.create({
        data: {
          residentId:  resident.id,
          amount:      5500,
          dueDate,
          description: `Hostel Fee — ${months[m]}`,
          status:      isPaid ? 'PAID' : (isOverdue ? 'OVERDUE' : 'PENDING'),
          issuedAt:    new Date(dueDate.getTime() - 7 * 24 * 3600000),
        },
      });
      feeInvoices.push(invoice);

      if (isPaid) {
        await prisma.payment.create({
          data: {
            invoiceId:  invoice.id,
            residentId: resident.id,
            amount:     5500,
            paidAt:     new Date(dueDate.getTime() - Math.random() * 5 * 24 * 3600000),
            method:     ['UPI', 'NET_BANKING', 'CASH', 'CHEQUE'][Math.floor(Math.random() * 4)],
            reference:  'TXN' + Math.floor(Math.random() * 9999999).toString().padStart(7, '0'),
          },
        });
      }
    }
  }
  console.log(`  ✅ ${feeInvoices.length} fee invoices + payments`);

  // ── 10. Mess Subscriptions ────────────────────────────────────────────────
  const messPlans = [
    { planName: 'Veg Plan',     monthlyFee: 2500 },
    { planName: 'Non-Veg Plan', monthlyFee: 3200 },
    { planName: 'Veg Plan',     monthlyFee: 2500 },
  ];

  await Promise.all(
    residents.slice(0, 18).map((r, i) =>
      prisma.messSubscription.create({
        data: {
          residentId: r.id,
          planName:   messPlans[i % messPlans.length].planName,
          monthlyFee: messPlans[i % messPlans.length].monthlyFee,
          startDate:  new Date(2026, 3, 1),
          endDate:    null,
          isActive:   true,
        },
      })
    )
  );
  console.log('  ✅ Mess subscriptions');

  // ── 11. Alerts ────────────────────────────────────────────────────────────
  await prisma.alert.createMany({
    data: [
      {
        type:           'FEE_OVERDUE',
        severity:       'HIGH',
        status:         'ACTIVE',
        title:          '8 residents have overdue fees',
        description:    'Multiple residents have not paid June 2026 hostel fees. Total outstanding: ₹44,000.',
        recommendation: 'Send payment reminders and escalate to parents if unpaid within 3 days.',
        confidence:     0.97,
      },
      {
        type:           'MAINTENANCE_URGENT',
        severity:       'CRITICAL',
        status:         'ACTIVE',
        title:          'Washing machine failure — Laundry Room',
        description:    'Washing Machine #2 has been non-functional for 4 days. 12 residents affected.',
        recommendation: 'Contact vendor for emergency repair. ETA should be within 24 hours.',
        confidence:     1.0,
      },
      {
        type:           'ATTENDANCE_ANOMALY',
        severity:       'MEDIUM',
        status:         'ACKNOWLEDGED',
        title:          'Harish Pillai — 5 consecutive absences',
        description:    'Resident in Room B-102 has been absent for 5 consecutive days without leave application.',
        recommendation: 'Contact resident and notify parents.',
        confidence:     0.92,
        acknowledgedAt: new Date(),
      },
      {
        type:           'VISITOR_OVERSTAY',
        severity:       'MEDIUM',
        status:         'ACTIVE',
        title:          '3 visitors have not checked out',
        description:    'Three visitors who checked in today have not checked out past visitor hours (20:00).',
        recommendation: 'Verify visitor status and initiate checkout procedure.',
        confidence:     0.88,
      },
      {
        type:           'OCCUPANCY_LOW',
        severity:       'LOW',
        status:         'RESOLVED',
        title:          'Room A-202 occupancy below threshold',
        description:    'One resident checked out from A-202 last week, leaving it below minimum occupancy.',
        recommendation: 'Consider reassigning a waitlisted applicant.',
        confidence:     0.75,
        resolvedAt:     new Date(),
      },
    ],
  });
  console.log('  ✅ Alerts');

  // ── 12. Occupancy History (30 days) ───────────────────────────────────────
  const occupancyHistory: Array<{ date: Date; totalBeds: number; occupiedBeds: number }> = [];
  const totalBeds = 34;
  for (let day = 0; day < 30; day++) {
    const date = new Date();
    date.setDate(today.getDate() - day);
    occupancyHistory.push({
      date,
      totalBeds,
      occupiedBeds: 20 + Math.floor(Math.random() * 6), // 20-26 occupied
    });
  }
  await prisma.occupancyHistory.createMany({ data: occupancyHistory });
  console.log('  ✅ Occupancy history');

  // ── 13. Operational Events (Timeline) ────────────────────────────────────
  await prisma.operationalEvent.createMany({
    data: [
      {
        type:        'RESIDENT_REGISTERED',
        entityType:  'RESIDENT',
        entityId:    residents[0].id,
        title:       'New resident registered: Arjun Sharma',
        description: 'Arjun Sharma checked into Room A-101.',
        severity:    'INFO',
        createdAt:   new Date(today.getTime() - 2 * 24 * 3600000),
      },
      {
        type:        'MAINTENANCE_CREATED',
        entityType:  'MAINTENANCE',
        entityId:    maintenanceRecords[0].id,
        title:       'Urgent: Washing machine failure reported',
        description: 'Washing Machine #2 in Laundry Room stopped working.',
        severity:    'WARNING',
        createdAt:   new Date(today.getTime() - 4 * 24 * 3600000),
      },
      {
        type:        'FEE_OVERDUE',
        entityType:  'FEE',
        entityId:    feeInvoices[0].id,
        title:       'Fee overdue alerts generated',
        description: '8 residents have crossed the June 2026 payment deadline.',
        severity:    'WARNING',
        createdAt:   new Date(today.getTime() - 1 * 24 * 3600000),
      },
      {
        type:        'VISITOR_CHECKIN',
        entityType:  'VISITOR',
        entityId:    'bulk',
        title:       '3 visitors currently on premises',
        description: 'Three visitors checked in today and have not yet checked out.',
        severity:    'INFO',
        createdAt:   new Date(),
      },
      {
        type:        'ATTENDANCE_MARKED',
        entityType:  'ATTENDANCE',
        entityId:    'daily',
        title:       'Daily attendance recorded',
        description: `Attendance marked for ${residents.length} residents. 2 absences noted.`,
        severity:    'INFO',
        createdAt:   new Date(),
      },
    ],
  });
  console.log('  ✅ Operational timeline');

  // ── 14. Room Swap Requests ────────────────────────────────────────────────
  await prisma.roomSwapRequest.createMany({
    data: [
      {
        residentId:      residents[1].id,
        currentRoomId:   roomMap['A-101'],
        requestedRoomId: roomMap['A-203'],
        reason:          'Roommate snores loudly, affecting my sleep and studies',
        status:          'PENDING',
      },
      {
        residentId:      residents[16].id,
        currentRoomId:   roomMap['B-102'],
        requestedRoomId: roomMap['C-101'],
        reason:          'Need a quiet single room for final year exam preparation',
        status:          'APPROVED',
      },
      {
        residentId:      residents[11].id,
        currentRoomId:   roomMap['A-202'],
        requestedRoomId: roomMap['B-201'],
        reason:          'Closer to library, better for project work',
        status:          'REJECTED',
      },
    ],
  });
  console.log('  ✅ Room swap requests');

  // ── 15. Knowledge Documents ───────────────────────────────────────────────
  await prisma.knowledgeDocument.createMany({
    data: [
      {
        title:    'Hostel Rules & Regulations',
        category: 'RULES',
        tags:     'rules,conduct,discipline,behaviour',
        content:  `1. Curfew time is 10:00 PM daily. Late entry requires prior written permission from the warden.
2. Visitors are allowed only between 9:00 AM and 8:00 PM. Visitors must register at the gate.
3. Consumption of alcohol, tobacco, or drugs on hostel premises is strictly prohibited.
4. Residents must maintain cleanliness in their rooms and common areas.
5. Loud music or noise is not permitted after 9:00 PM.
6. Residents must carry their ID card at all times.
7. Any damage to hostel property will be charged to the responsible resident.
8. Ragging of any form is strictly prohibited and will result in immediate expulsion.
9. Electrical appliances (iron, heater) are not permitted in rooms.
10. Residents must report any maintenance issues promptly to the warden's office.`,
      },
      {
        title:    'Fee Payment Policy',
        category: 'POLICY',
        tags:     'fees,payment,due,late,fine',
        content:  `Hostel fee of ₹5,500 per month is due by the 5th of every month.
Late payment attracts a fine of ₹50 per day after the due date.
Accepted payment methods: UPI, Net Banking, Cash, Cheque (payable to "Sunrise Boys Hostel").
Receipts are issued immediately for cash payments and within 24 hours for online transactions.
Non-payment for 2 consecutive months will result in suspension of hostel services.
Students on scholarship must submit scholarship letter for fee waiver requests.`,
      },
      {
        title:    'Mess & Dining Information',
        category: 'FAQ',
        tags:     'mess,food,meal,dining,timing,menu',
        content:  `Mess Plans Available:
- Veg Plan: ₹2,500/month (Breakfast, Lunch, Dinner)
- Non-Veg Plan: ₹3,200/month (includes non-veg items for lunch and dinner)

Meal Timings:
- Breakfast: 7:00 AM – 9:00 AM
- Lunch: 12:00 PM – 2:00 PM
- Snacks: 4:00 PM – 5:00 PM
- Dinner: 7:00 PM – 9:00 PM

Mess is closed on the 1st Sunday of every month for deep cleaning.
Residents must show their mess card or hostel ID at the dining hall entrance.
Special diet requests must be submitted 48 hours in advance to the mess manager.`,
      },
      {
        title:    'Leave & Outing Procedure',
        category: 'PROCEDURE',
        tags:     'leave,outing,permission,gate pass',
        content:  `For day outings (return before 10 PM):
- Submit an outing request via the app or at the warden's office.
- Parent/guardian notification is sent automatically.

For overnight leave (1+ nights):
- Submit leave application at least 24 hours in advance.
- Attach parent/guardian written consent.
- Medical leave requires a doctor's certificate.

Emergency leave:
- Contact the warden directly at +91-9876543210.
- Documentation must be submitted within 24 hours of return.

Unapproved absence for more than 3 consecutive days will be treated as unauthorized leave and disciplinary action will be taken.`,
      },
      {
        title:    'Emergency Contacts & Procedures',
        category: 'CONTACT',
        tags:     'emergency,contact,ambulance,police,fire,warden',
        content:  `Emergency Contacts:
- Warden (24/7): +91-9876543210
- Duty Staff (Night): +91-9876543211
- Nearest Hospital (City General): +91-0422-2345678 (2 km away)
- Police Station: 100 or +91-0422-2234567
- Fire Department: 101
- Ambulance: 108

In case of medical emergency:
1. Call 108 (ambulance) immediately.
2. Inform the warden on duty.
3. Do not move the patient unless in immediate danger.

In case of fire:
1. Activate the nearest fire alarm.
2. Evacuate to the assembly point (main gate area).
3. Call 101.
4. Do not use lifts during evacuation.`,
      },
      {
        title:    'Internet & WiFi Policy',
        category: 'POLICY',
        tags:     'wifi,internet,network,usage',
        content:  `WiFi is available in all rooms and common areas (24/7).
Network: SmartHostel_Resident | Password: provided at check-in.

Usage Policy:
- Streaming is limited to 720p during peak hours (8 PM – 11 PM) to ensure fair bandwidth.
- Torrenting and downloading copyrighted content is strictly prohibited.
- VPN usage is allowed but must not be used to bypass hostel network policies.
- Any misuse will result in temporary suspension of internet access.

For technical issues, contact: tech@sunrisehostel.in or raise a maintenance ticket.`,
      },
    ],
  });
  console.log('  ✅ Knowledge documents (6)');

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  🎉  Seed complete! Login credentials:');
  console.log('');
  console.log('  👤 Admin:   username=admin      password=admin123');
  console.log('  👤 Warden:  username=warden     password=admin123');
  console.log('  🎓 Student: username=arjun001   password=password123');
  console.log('  🎓 Student: username=rahul002   password=password123');
  console.log('  🎓 Student: username=priya003   password=password123');
  console.log('');
  console.log('  📊 Data seeded:');
  console.log(`     • ${rooms.length} rooms across 3 blocks`);
  console.log(`     • ${residents.length} residents`);
  console.log(`     • ${attendanceLogs.length} attendance records (30 days)`);
  console.log(`     • ${visitorData.length} visitor logs`);
  console.log(`     • ${assets.length} assets`);
  console.log(`     • ${maintenanceRecords.length} maintenance requests`);
  console.log(`     • ${feeInvoices.length} fee invoices`);
  console.log('     • Mess subscriptions, alerts, knowledge docs & more');
  console.log('═══════════════════════════════════════════════════════════\n');
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
