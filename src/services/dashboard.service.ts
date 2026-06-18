import prisma from '../lib/prisma';

export interface DashboardSummary {
  totalResidents: number;
  activeResidents: number;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  occupancyRate: number;
  pendingMaintenance: number;
  openMaintenance: number;
  pendingFees: number;
  overdueInvoices: number;
  totalPendingAmount: number;
  activeVisitors: number;
  attendanceSummary: {
    date: string;
    present: number;
    total: number;
  }[];
  recentActivity: {
    type: string;
    message: string;
    createdAt: string;
  }[];
}

export interface OccupancyHealth {
  totalBeds: number;
  occupiedBeds: number;
  vacantBeds: number;
  occupancyRate: number;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  maintenanceRooms: number;
  reservedRooms: number;
  // Per-type breakdown
  typeBreakdown: {
    type: string;
    total: number;
    occupied: number;
    occupancyRate: number;
  }[];
  // Vacancy by block/floor
  blockBreakdown: {
    label: string;
    total: number;
    occupied: number;
    vacant: number;
  }[];
  // Health signal
  healthScore: number; // 0-100
  healthLabel: 'Critical' | 'Warning' | 'Healthy' | 'Optimal';
}

export interface MaintenanceHealth {
  totalOpen: number;
  totalPending: number;
  totalInProgress: number;
  totalResolved: number;
  totalClosed: number;
  urgentItems: number;
  highPriorityItems: number;
  avgResolutionHours: number | null; // avg hours from OPEN → RESOLVED for recent items
  priorityDistribution: { priority: string; count: number }[];
  categoryDistribution: { category: string; count: number }[];
  openItemsList: {
    id: string;
    description: string;
    category: string;
    priority: string;
    createdAt: string;
    residentName: string | null;
    assetName: string | null;
    ageHours: number;
  }[];
  healthScore: number;
  healthLabel: 'Critical' | 'Warning' | 'Healthy' | 'Optimal';
}

export interface FinancialHealth {
  totalInvoiced: number;
  totalCollected: number;
  totalOutstanding: number;
  totalOverdue: number;
  collectionRate: number; // %
  overdueCount: number;
  pendingCount: number;
  partialCount: number;
  // Monthly revenue (last 6 months)
  monthlyRevenue: { month: string; invoiced: number; collected: number }[];
  // Overdue residents
  overdueResidents: {
    residentId: string;
    residentName: string;
    totalOverdue: number;
    invoiceCount: number;
    oldestDueDaysAgo: number;
  }[];
  healthScore: number;
  healthLabel: 'Critical' | 'Warning' | 'Healthy' | 'Optimal';
}

export interface OperationalAlert {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'MAINTENANCE' | 'FINANCIAL' | 'OCCUPANCY' | 'VISITOR';
  title: string;
  description: string;
  actionUrl?: string;
  createdAt: string;
}

export interface OperationalIntelligence {
  generatedAt: string;
  occupancy: OccupancyHealth;
  maintenance: MaintenanceHealth;
  financial: FinancialHealth;
  alerts: OperationalAlert[];
  overallHealthScore: number;
  overallHealthLabel: 'Critical' | 'Warning' | 'Healthy' | 'Optimal';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function scoreToLabel(score: number): 'Critical' | 'Warning' | 'Healthy' | 'Optimal' {
  if (score >= 80) return 'Optimal';
  if (score >= 60) return 'Healthy';
  if (score >= 35) return 'Warning';
  return 'Critical';
}

function monthKey(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

// ─── Occupancy Intelligence ───────────────────────────────────────────────────

async function computeOccupancyHealth(): Promise<OccupancyHealth> {
  const rooms = await prisma.room.findMany({
    select: {
      id: true,
      type: true,
      status: true,
      capacity: true,
      currentOccupancy: true,
      floor: true,
      block: true,
    },
  });

  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => r.currentOccupancy > 0).length;
  const availableRooms = rooms.filter((r) => r.status === 'AVAILABLE' && r.currentOccupancy === 0).length;
  const maintenanceRooms = rooms.filter((r) => r.status === 'MAINTENANCE').length;
  const reservedRooms = rooms.filter((r) => r.status === 'RESERVED').length;
  const totalBeds = rooms.reduce((s, r) => s + r.capacity, 0);
  const occupiedBeds = rooms.reduce((s, r) => s + r.currentOccupancy, 0);
  const vacantBeds = totalBeds - occupiedBeds;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  // Per-type breakdown
  const typeMap: Record<string, { total: number; occupied: number; beds: number; occupiedBeds: number }> = {};
  for (const r of rooms) {
    if (!typeMap[r.type]) typeMap[r.type] = { total: 0, occupied: 0, beds: 0, occupiedBeds: 0 };
    typeMap[r.type].total += 1;
    typeMap[r.type].beds += r.capacity;
    typeMap[r.type].occupiedBeds += r.currentOccupancy;
    if (r.currentOccupancy > 0) typeMap[r.type].occupied += 1;
  }
  const typeBreakdown = Object.entries(typeMap).map(([type, v]) => ({
    type,
    total: v.total,
    occupied: v.occupied,
    occupancyRate: v.beds > 0 ? Math.round((v.occupiedBeds / v.beds) * 100) : 0,
  }));

  // Block breakdown
  const blockMap: Record<string, { total: number; occupied: number; vacant: number }> = {};
  for (const r of rooms) {
    const label = [r.block && `Block ${r.block}`, r.floor && `Floor ${r.floor}`].filter(Boolean).join(' ') || 'Unassigned';
    if (!blockMap[label]) blockMap[label] = { total: 0, occupied: 0, vacant: 0 };
    blockMap[label].total += r.capacity;
    blockMap[label].occupied += r.currentOccupancy;
    blockMap[label].vacant += r.capacity - r.currentOccupancy;
  }
  const blockBreakdown = Object.entries(blockMap).map(([label, v]) => ({ label, ...v }));

  // Occupancy health score: ideal is 70-90%
  let healthScore: number;
  if (occupancyRate >= 70 && occupancyRate <= 90) healthScore = 95;
  else if (occupancyRate >= 60 && occupancyRate < 70) healthScore = 75;
  else if (occupancyRate > 90 && occupancyRate <= 100) healthScore = 65; // over-crowded
  else if (occupancyRate >= 40) healthScore = 50;
  else healthScore = 25;
  // Penalise for maintenance rooms
  healthScore -= Math.min(20, maintenanceRooms * 5);

  return {
    totalBeds,
    occupiedBeds,
    vacantBeds,
    occupancyRate,
    totalRooms,
    occupiedRooms,
    availableRooms,
    maintenanceRooms,
    reservedRooms,
    typeBreakdown,
    blockBreakdown,
    healthScore: Math.max(0, Math.min(100, healthScore)),
    healthLabel: scoreToLabel(Math.max(0, Math.min(100, healthScore))),
  };
}

// ─── Maintenance Intelligence ─────────────────────────────────────────────────

async function computeMaintenanceHealth(): Promise<MaintenanceHealth> {
  const now = new Date();

  const allRequests = await prisma.maintenanceRequest.findMany({
    select: {
      id: true,
      description: true,
      category: true,
      status: true,
      priority: true,
      createdAt: true,
      resolvedAt: true,
      resident: { select: { fullName: true } },
      asset: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const statusCounts = { OPEN: 0, PENDING: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0 };
  for (const r of allRequests) {
    if (r.status in statusCounts) {
      statusCounts[r.status as keyof typeof statusCounts]++;
    }
  }

  // Priority distribution across active items
  const priorityMap: Record<string, number> = {};
  const categoryMap: Record<string, number> = {};
  const openItems: MaintenanceHealth['openItemsList'] = [];

  for (const r of allRequests) {
    if (['OPEN', 'PENDING', 'IN_PROGRESS'].includes(r.status)) {
      const p = r.priority || 'MEDIUM';
      priorityMap[p] = (priorityMap[p] || 0) + 1;
      categoryMap[r.category] = (categoryMap[r.category] || 0) + 1;
      openItems.push({
        id: r.id,
        description: r.description,
        category: r.category,
        priority: p,
        createdAt: r.createdAt.toISOString(),
        residentName: r.resident?.fullName || null,
        assetName: r.asset?.name || null,
        ageHours: Math.round((now.getTime() - r.createdAt.getTime()) / 3_600_000),
      });
    }
  }

  // Sort by priority (URGENT first), then age
  const priorityOrder = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];
  openItems.sort((a, b) => {
    const pa = priorityOrder.indexOf(a.priority);
    const pb = priorityOrder.indexOf(b.priority);
    if (pa !== pb) return pa - pb;
    return b.ageHours - a.ageHours;
  });

  // Avg resolution time (from recent resolved items)
  const resolvedWithTime = allRequests.filter((r) => r.status === 'RESOLVED' && r.resolvedAt);
  const avgResolutionHours = resolvedWithTime.length > 0
    ? Math.round(
        resolvedWithTime.reduce((sum, r) => sum + (r.resolvedAt!.getTime() - r.createdAt.getTime()), 0) /
        resolvedWithTime.length / 3_600_000
      )
    : null;

  const urgentItems = priorityMap['URGENT'] || 0;
  const highPriorityItems = priorityMap['HIGH'] || 0;

  // Health score
  let healthScore = 100;
  healthScore -= urgentItems * 20;
  healthScore -= highPriorityItems * 8;
  healthScore -= (priorityMap['MEDIUM'] || 0) * 3;
  healthScore -= (priorityMap['LOW'] || 0) * 1;
  // Penalise for items open > 72h
  const staleItems = openItems.filter((i) => i.ageHours > 72).length;
  healthScore -= staleItems * 5;

  return {
    totalOpen: statusCounts.OPEN,
    totalPending: statusCounts.PENDING,
    totalInProgress: statusCounts.IN_PROGRESS,
    totalResolved: statusCounts.RESOLVED,
    totalClosed: statusCounts.CLOSED,
    urgentItems,
    highPriorityItems,
    avgResolutionHours,
    priorityDistribution: Object.entries(priorityMap).map(([priority, count]) => ({ priority, count })),
    categoryDistribution: Object.entries(categoryMap).map(([category, count]) => ({ category, count })),
    openItemsList: openItems.slice(0, 20),
    healthScore: Math.max(0, Math.min(100, healthScore)),
    healthLabel: scoreToLabel(Math.max(0, Math.min(100, healthScore))),
  };
}

// ─── Financial Intelligence ───────────────────────────────────────────────────

async function computeFinancialHealth(): Promise<FinancialHealth> {
  const now = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [allInvoices, allPayments] = await Promise.all([
    prisma.feeInvoice.findMany({
      include: {
        resident: { select: { id: true, fullName: true } },
        payments: { select: { amount: true, paidAt: true } },
      },
      orderBy: { issuedAt: 'asc' },
    }),
    prisma.payment.findMany({
      where: { paidAt: { gte: sixMonthsAgo } },
      select: { amount: true, paidAt: true },
    }),
  ]);

  const totalInvoiced = allInvoices.reduce((s, i) => s + i.amount, 0);
  const totalCollected = allPayments.reduce((s, p) => s + p.amount, 0);
  const totalOutstanding = allInvoices
    .filter((i) => ['PENDING', 'PARTIAL'].includes(i.status))
    .reduce((s, i) => s + i.amount, 0);

  const overdueInvoices = allInvoices.filter(
    (i) => ['PENDING', 'PARTIAL'].includes(i.status) && new Date(i.dueDate) < now
  );
  const totalOverdue = overdueInvoices.reduce((s, i) => s + i.amount, 0);
  const overdueCount = overdueInvoices.length;
  const pendingCount = allInvoices.filter((i) => i.status === 'PENDING').length;
  const partialCount = allInvoices.filter((i) => i.status === 'PARTIAL').length;

  const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 100;

  // Monthly revenue (last 6 months) - bucketed by issuedAt month
  const monthMap: Record<string, { invoiced: number; collected: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    monthMap[monthKey(d)] = { invoiced: 0, collected: 0 };
  }
  for (const inv of allInvoices) {
    const k = monthKey(new Date(inv.issuedAt));
    if (monthMap[k]) monthMap[k].invoiced += inv.amount;
  }
  for (const pay of allPayments) {
    const k = monthKey(new Date(pay.paidAt));
    if (monthMap[k]) monthMap[k].collected += pay.amount;
  }
  const monthlyRevenue = Object.entries(monthMap).map(([month, v]) => ({ month, ...v }));

  // Overdue residents grouped
  const residentOverdueMap: Record<string, { residentId: string; residentName: string; totalOverdue: number; invoiceCount: number; oldestDueMs: number }> = {};
  for (const inv of overdueInvoices) {
    const rid = inv.resident.id;
    if (!residentOverdueMap[rid]) {
      residentOverdueMap[rid] = {
        residentId: rid,
        residentName: inv.resident.fullName,
        totalOverdue: 0,
        invoiceCount: 0,
        oldestDueMs: inv.dueDate.getTime(),
      };
    }
    residentOverdueMap[rid].totalOverdue += inv.amount;
    residentOverdueMap[rid].invoiceCount += 1;
    residentOverdueMap[rid].oldestDueMs = Math.min(residentOverdueMap[rid].oldestDueMs, inv.dueDate.getTime());
  }
  const overdueResidents = Object.values(residentOverdueMap)
    .map((r) => ({
      residentId: r.residentId,
      residentName: r.residentName,
      totalOverdue: r.totalOverdue,
      invoiceCount: r.invoiceCount,
      oldestDueDaysAgo: Math.round((now.getTime() - r.oldestDueMs) / 86_400_000),
    }))
    .sort((a, b) => b.totalOverdue - a.totalOverdue)
    .slice(0, 10);

  // Health score
  let healthScore = collectionRate;
  if (overdueCount > 10) healthScore -= 20;
  else if (overdueCount > 5) healthScore -= 10;
  else if (overdueCount > 0) healthScore -= 5;
  if (collectionRate < 50) healthScore = Math.min(healthScore, 30);

  return {
    totalInvoiced: Math.round(totalInvoiced * 100) / 100,
    totalCollected: Math.round(totalCollected * 100) / 100,
    totalOutstanding: Math.round(totalOutstanding * 100) / 100,
    totalOverdue: Math.round(totalOverdue * 100) / 100,
    collectionRate,
    overdueCount,
    pendingCount,
    partialCount,
    monthlyRevenue,
    overdueResidents,
    healthScore: Math.max(0, Math.min(100, healthScore)),
    healthLabel: scoreToLabel(Math.max(0, Math.min(100, healthScore))),
  };
}

// ─── Alert Centre ─────────────────────────────────────────────────────────────

function buildAlerts(
  occupancy: OccupancyHealth,
  maintenance: MaintenanceHealth,
  financial: FinancialHealth,
  activeVisitors: number
): OperationalAlert[] {
  const alerts: OperationalAlert[] = [];
  const now = new Date().toISOString();
  let seq = 0;

  const push = (
    severity: OperationalAlert['severity'],
    category: OperationalAlert['category'],
    title: string,
    description: string
  ) => {
    alerts.push({ id: `alert-${++seq}`, severity, category, title, description, createdAt: now });
  };

  // ── Maintenance alerts ──
  if (maintenance.urgentItems > 0) {
    push('CRITICAL', 'MAINTENANCE', `${maintenance.urgentItems} Urgent Maintenance Issue${maintenance.urgentItems > 1 ? 's' : ''}`,
      `${maintenance.urgentItems} request${maintenance.urgentItems > 1 ? 's' : ''} marked URGENT require immediate attention.`);
  }
  if (maintenance.highPriorityItems > 0) {
    push('HIGH', 'MAINTENANCE', `${maintenance.highPriorityItems} High-Priority Requests`,
      `${maintenance.highPriorityItems} high-priority maintenance issue${maintenance.highPriorityItems > 1 ? 's' : ''} are open.`);
  }
  const staleItems = maintenance.openItemsList.filter((i) => i.ageHours > 72);
  if (staleItems.length > 0) {
    push('HIGH', 'MAINTENANCE', `${staleItems.length} Stale Request${staleItems.length > 1 ? 's' : ''} (>72h)`,
      `${staleItems.length} maintenance request${staleItems.length > 1 ? 's' : ''} have been open for more than 3 days without resolution.`);
  }

  // ── Financial alerts ──
  if (financial.overdueCount > 0) {
    const sev = financial.overdueCount >= 10 ? 'CRITICAL' : financial.overdueCount >= 5 ? 'HIGH' : 'MEDIUM';
    push(sev, 'FINANCIAL', `${financial.overdueCount} Overdue Invoice${financial.overdueCount > 1 ? 's' : ''}`,
      `₹${financial.totalOverdue.toLocaleString('en-IN')} outstanding across ${financial.overdueCount} overdue invoice${financial.overdueCount > 1 ? 's' : ''}.`);
  }
  if (financial.collectionRate < 60) {
    push('HIGH', 'FINANCIAL', 'Low Fee Collection Rate',
      `Only ${financial.collectionRate}% of invoiced fees have been collected this period.`);
  } else if (financial.collectionRate < 80) {
    push('MEDIUM', 'FINANCIAL', 'Below-Target Fee Collection',
      `Fee collection rate is ${financial.collectionRate}% — target is 80%+.`);
  }

  // ── Occupancy alerts ──
  if (occupancy.occupancyRate < 40) {
    push('HIGH', 'OCCUPANCY', 'Very Low Occupancy',
      `Only ${occupancy.occupancyRate}% of beds are occupied. ${occupancy.vacantBeds} beds are vacant.`);
  } else if (occupancy.occupancyRate > 95) {
    push('HIGH', 'OCCUPANCY', 'Near-Full Capacity',
      `Hostel is at ${occupancy.occupancyRate}% capacity. Only ${occupancy.vacantBeds} beds remain.`);
  }
  if (occupancy.maintenanceRooms > 0) {
    push('MEDIUM', 'OCCUPANCY', `${occupancy.maintenanceRooms} Room${occupancy.maintenanceRooms > 1 ? 's' : ''} Under Maintenance`,
      `${occupancy.maintenanceRooms} room${occupancy.maintenanceRooms > 1 ? 's are' : ' is'} currently offline for maintenance, reducing available capacity.`);
  }

  // ── Visitor alerts ──
  if (activeVisitors > 20) {
    push('MEDIUM', 'VISITOR', 'Elevated Visitor Count',
      `${activeVisitors} visitors are currently checked in. Verify all are expected.`);
  } else if (activeVisitors > 0) {
    push('LOW', 'VISITOR', `${activeVisitors} Active Visitor${activeVisitors > 1 ? 's' : ''} On-Site`,
      `${activeVisitors} visitor${activeVisitors > 1 ? 's are' : ' is'} currently checked in.`);
  }

  // Sort by severity
  const order = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  alerts.sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity));

  return alerts;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function getOperationalIntelligence(): Promise<OperationalIntelligence> {
  const activeVisitors = await prisma.visitorLog.count({ where: { checkOutTime: null } });

  const [occupancy, maintenance, financial] = await Promise.all([
    computeOccupancyHealth(),
    computeMaintenanceHealth(),
    computeFinancialHealth(),
  ]);

  const alerts = buildAlerts(occupancy, maintenance, financial, activeVisitors);
  const overallHealthScore = Math.round((occupancy.healthScore + maintenance.healthScore + financial.healthScore) / 3);

  return {
    generatedAt: new Date().toISOString(),
    occupancy,
    maintenance,
    financial,
    alerts,
    overallHealthScore,
    overallHealthLabel: scoreToLabel(overallHealthScore),
  };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const [
    totalResidents,
    activeResidents,
    rooms,
    maintenanceCounts,
    invoices,
    activeVisitors,
    recentMaintenanceReqs,
    recentVisitors,
    attendanceLogs,
  ] = await Promise.all([
    prisma.resident.count(),
    prisma.resident.count({ where: { status: 'ACTIVE' } }),
    prisma.room.findMany({ select: { status: true, currentOccupancy: true, capacity: true } }),
    prisma.maintenanceRequest.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
    prisma.feeInvoice.findMany({
      where: { status: { in: ['PENDING', 'PARTIAL'] } },
      select: { id: true, status: true, amount: true, dueDate: true },
    }),
    prisma.visitorLog.count({ where: { checkOutTime: null } }),
    prisma.maintenanceRequest.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { category: true, status: true, createdAt: true },
    }),
    prisma.visitorLog.findMany({
      take: 5,
      orderBy: { checkInTime: 'desc' },
      select: { visitorName: true, checkInTime: true },
    }),
    prisma.attendanceLog.findMany({
      where: { date: { gte: last7Days[0] } },
      select: { date: true, status: true },
    }),
  ]);

  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => r.currentOccupancy > 0).length;
  const availableRooms = rooms.filter((r) => r.currentOccupancy === 0 && r.status === 'AVAILABLE').length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  const statusMap = Object.fromEntries(maintenanceCounts.map((m) => [m.status, m._count.status]));
  const pendingMaintenance = (statusMap['PENDING'] || 0) + (statusMap['IN_PROGRESS'] || 0);
  const openMaintenance = statusMap['OPEN'] || 0;

  const now = new Date();
  const overdueInvoices = invoices.filter((i) => new Date(i.dueDate) < now).length;
  const totalPendingAmount = invoices.reduce((sum, i) => sum + i.amount, 0);

  const attendanceSummary = last7Days.map((day) => {
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    const dayLogs = attendanceLogs.filter((log) => {
      const logDate = new Date(log.date);
      return logDate >= day && logDate <= dayEnd;
    });
    return {
      date: day.toISOString().split('T')[0],
      present: dayLogs.filter((l) => l.status === 'PRESENT').length,
      total: dayLogs.length,
    };
  });

  const recentActivity: DashboardSummary['recentActivity'] = [];
  for (const r of recentMaintenanceReqs) {
    recentActivity.push({
      type: 'maintenance',
      message: `Maintenance [${r.category}] — ${r.status}`,
      createdAt: r.createdAt.toISOString(),
    });
  }
  for (const v of recentVisitors) {
    recentActivity.push({
      type: 'visitor',
      message: `Visitor "${v.visitorName}" checked in`,
      createdAt: v.checkInTime.toISOString(),
    });
  }
  recentActivity.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    totalResidents,
    activeResidents,
    totalRooms,
    occupiedRooms,
    availableRooms,
    occupancyRate,
    pendingMaintenance,
    openMaintenance,
    pendingFees: invoices.length,
    overdueInvoices,
    totalPendingAmount,
    activeVisitors,
    attendanceSummary,
    recentActivity: recentActivity.slice(0, 10),
  };
}

