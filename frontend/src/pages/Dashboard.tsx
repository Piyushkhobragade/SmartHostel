/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback } from 'react';
import { dashboardAPI } from '../services/api';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    Cell, AreaChart, Area
} from 'recharts';
import {
    Users, BedDouble, Wrench, Banknote, CheckCircle2,
    Database, ShieldAlert, AlertOctagon, AlertTriangle, Info,
    RefreshCw, Zap, Activity, Clock, IndianRupee, BarChart3,
    Building2, X
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import PanelHeader from '../components/widgets/PanelHeader';
import ScoreRing from '../components/widgets/ScoreRing';
import HealthPip from '../components/widgets/HealthPip';
import ProgressBar from '../components/widgets/ProgressBar';
import KpiCard from '../components/widgets/KpiCard';
import type { KpiTrend, KpiSeverity } from '../components/widgets/KpiCard';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardData {
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
    attendanceSummary: { date: string; present: number; total: number }[];
    recentActivity: { type: string; message: string; createdAt: string }[];
}

interface OccupancyHealth {
    totalBeds: number; occupiedBeds: number; vacantBeds: number; occupancyRate: number;
    totalRooms: number; occupiedRooms: number; availableRooms: number;
    maintenanceRooms: number; reservedRooms: number;
    typeBreakdown: { type: string; total: number; occupied: number; occupancyRate: number }[];
    blockBreakdown: { label: string; total: number; occupied: number; vacant: number }[];
    healthScore: number; healthLabel: string;
}

interface MaintenanceHealth {
    totalOpen: number; totalPending: number; totalInProgress: number;
    totalResolved: number; totalClosed: number;
    urgentItems: number; highPriorityItems: number;
    avgResolutionHours: number | null;
    priorityDistribution: { priority: string; count: number }[];
    categoryDistribution: { category: string; count: number }[];
    openItemsList: {
        id: string; description: string; category: string; priority: string;
        createdAt: string; residentName: string | null; assetName: string | null; ageHours: number;
    }[];
    healthScore: number; healthLabel: string;
}

interface FinancialHealth {
    totalInvoiced: number; totalCollected: number; totalOutstanding: number; totalOverdue: number;
    collectionRate: number; overdueCount: number; pendingCount: number; partialCount: number;
    monthlyRevenue: { month: string; invoiced: number; collected: number }[];
    overdueResidents: {
        residentId: string; residentName: string; totalOverdue: number;
        invoiceCount: number; oldestDueDaysAgo: number;
    }[];
    healthScore: number; healthLabel: string;
}

interface OperationalAlert {
    id: string; severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    category: 'MAINTENANCE' | 'FINANCIAL' | 'OCCUPANCY' | 'VISITOR';
    title: string; description: string; createdAt: string;
}

interface Intelligence {
    generatedAt: string;
    occupancy: OccupancyHealth;
    maintenance: MaintenanceHealth;
    financial: FinancialHealth;
    alerts: OperationalAlert[];
    overallHealthScore: number;
    overallHealthLabel: string;
}

// ─── Design Tokens (business-layer colour constants) ──────────────────────────
// These map health/severity concepts to specific chart/indicator colours.
// They are intentionally NOT in index.css — they are data-driven colour decisions,
// not design system surface tokens.

const G = {
    blue:   'rgb(87,148,242)',
    green:  'rgb(115,191,105)',
    orange: 'rgb(255,152,48)',
    red:    'rgb(242,73,92)',
    purple: 'rgb(184,119,217)',
    teal:   'rgb(80,220,195)',
    muted:  'rgb(102,102,119)',
};

const TOOLTIP_STYLE = {
    backgroundColor: 'rgb(24,27,31)',
    borderColor: 'rgb(44,50,53)',
    color: 'rgb(204,204,220)',
    fontSize: '11px',
    borderRadius: '4px',
};

// ─── Business Logic Helpers ───────────────────────────────────────────────────
// Maps domain concepts (health labels, severity, priority) → colours.
// Business logic stays in Dashboard; colours are passed to widgets as props.

function hc(label: string): string {
    if (label === 'Optimal') return G.green;
    if (label === 'Healthy') return G.blue;
    if (label === 'Warning') return G.orange;
    return G.red;
}

function sc(sev: string): string {
    if (sev === 'CRITICAL') return G.red;
    if (sev === 'HIGH') return G.orange;
    if (sev === 'MEDIUM') return G.blue;
    return G.muted;
}

function pc(p: string): string {
    if (p === 'URGENT') return G.red;
    if (p === 'HIGH') return G.orange;
    if (p === 'MEDIUM') return G.blue;
    return G.muted;
}

/** Occupancy → ProgressBar colour thresholds */
function occ_color(pct: number): string {
    return pct > 90 ? G.red : pct >= 70 ? G.green : pct >= 40 ? G.orange : G.red;
}

const fmtINR = (n: number) =>
    `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

// ─── Alert Center ─────────────────────────────────────────────────────────────
// AlertCenter has its own local dismiss state — it stays in Dashboard rather than
// a separate file because it is not reused elsewhere.

function AlertCenter({ alerts }: { alerts: OperationalAlert[] }) {
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());
    const visible = alerts.filter(a => !dismissed.has(a.id));
    const criticalCount = visible.filter(a => a.severity === 'CRITICAL').length;
    const highCount = visible.filter(a => a.severity === 'HIGH').length;

    const SevIcon = ({ sev }: { sev: string }) => {
        const color = sc(sev);
        const props = { className: 'w-3.5 h-3.5 flex-shrink-0', style: { color } };
        if (sev === 'CRITICAL') return <AlertOctagon {...props} />;
        if (sev === 'HIGH') return <AlertTriangle {...props} />;
        return <Info {...props} />;
    };

    if (visible.length === 0) {
        return (
            <div className="rounded border" style={{ background: 'rgb(var(--bg-panel))', borderColor: 'rgb(var(--border-color))' }}>
                <PanelHeader icon={<Zap className="w-3.5 h-3.5" />}>Alert Center</PanelHeader>
                <div className="flex items-center gap-2 px-3 py-3" style={{ color: G.green }}>
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-[12px] font-medium">All systems nominal</span>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded border" style={{
            background: 'rgb(var(--bg-panel))',
            borderColor: criticalCount > 0 ? `${G.red}60` : highCount > 0 ? `${G.orange}60` : 'rgb(var(--border-color))',
            boxShadow: criticalCount > 0 ? `0 0 0 1px ${G.red}30` : highCount > 0 ? `0 0 0 1px ${G.orange}20` : 'none',
        }}>
            <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'rgb(var(--border-color))' }}>
                <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" style={{ color: criticalCount > 0 ? G.red : highCount > 0 ? G.orange : G.blue }} />
                    <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgb(var(--text-secondary))' }}>Alert Center</span>
                    {criticalCount > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse"
                            style={{ background: `${G.red}20`, color: G.red, border: `1px solid ${G.red}40` }}>
                            {criticalCount} CRITICAL
                        </span>
                    )}
                    {highCount > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: `${G.orange}20`, color: G.orange, border: `1px solid ${G.orange}40` }}>
                            {highCount} HIGH
                        </span>
                    )}
                </div>
                <span className="text-[10px]" style={{ color: G.muted }}>{visible.length} active</span>
            </div>
            <div className="divide-panel">
                {visible.map(alert => (
                    <div key={alert.id}
                        className="flex items-start gap-2.5 px-3 py-2.5"
                        style={{ background: alert.severity === 'CRITICAL' ? `${G.red}06` : alert.severity === 'HIGH' ? `${G.orange}06` : 'transparent' }}
                    >
                        <div className="mt-0.5 flex-shrink-0">
                            <SevIcon sev={alert.severity} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-bold uppercase" style={{ color: sc(alert.severity) }}>
                                    {alert.severity}
                                </span>
                                <span className="text-[10px]" style={{ color: G.muted }}>·</span>
                                <span className="text-[10px]" style={{ color: G.muted }}>{alert.category}</span>
                                <span className="text-[12px] font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
                                    {alert.title}
                                </span>
                            </div>
                            <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'rgb(var(--text-muted))' }}>
                                {alert.description}
                            </p>
                        </div>
                        <button
                            onClick={() => setDismissed(prev => new Set([...prev, alert.id]))}
                            className="flex-shrink-0 opacity-30 hover:opacity-100 transition-opacity p-0.5"
                        >
                            <X className="w-3 h-3" style={{ color: 'rgb(var(--text-muted))' }} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Occupancy Panel ──────────────────────────────────────────────────────────

function OccupancyPanel({ data }: { data: OccupancyHealth }) {
    return (
        <div className="rounded border" style={{ background: 'rgb(var(--bg-panel))', borderColor: 'rgb(var(--border-color))' }}>
            <PanelHeader icon={<Building2 className="w-3.5 h-3.5" />}>Occupancy</PanelHeader>
            <div className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                    <ScoreRing score={data.healthScore} label={data.healthLabel} color={hc(data.healthLabel)} size={64} />
                    <div className="flex-1 ml-3 space-y-1.5">
                        <div className="flex justify-between text-[11px]">
                            <span style={{ color: G.muted }}>Beds occupied</span>
                            <span className="font-semibold tabular-nums" style={{ color: 'rgb(var(--text-primary))' }}>
                                {data.occupiedBeds}/{data.totalBeds}
                            </span>
                        </div>
                        <ProgressBar pct={data.occupancyRate} color={occ_color(data.occupancyRate)} height={4} />
                        <div className="flex justify-between text-[11px] pt-0.5">
                            <span style={{ color: G.muted }}>Vacant beds</span>
                            <span className="font-semibold" style={{ color: data.vacantBeds > 0 ? G.orange : G.green }}>
                                {data.vacantBeds}
                            </span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                            <span style={{ color: G.muted }}>Under maint.</span>
                            <span className="font-semibold" style={{ color: data.maintenanceRooms > 0 ? G.red : G.muted }}>
                                {data.maintenanceRooms} rooms
                            </span>
                        </div>
                    </div>
                    <div className="ml-2 self-start">
                        <HealthPip label={data.healthLabel} color={hc(data.healthLabel)} />
                    </div>
                </div>

                {/* Type breakdown */}
                {data.typeBreakdown.length > 0 && (
                    <div className="space-y-1.5 pt-1 border-t" style={{ borderColor: 'rgb(var(--border-color))' }}>
                        <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: G.muted }}>By Type</p>
                        {data.typeBreakdown.map(t => (
                            <div key={t.type} className="space-y-0.5">
                                <div className="flex justify-between text-[10px]">
                                    <span style={{ color: 'rgb(var(--text-secondary))' }}>{t.type}</span>
                                    <span style={{ color: G.muted }}>{t.occupied}/{t.total}</span>
                                </div>
                                <ProgressBar pct={t.occupancyRate} color={occ_color(t.occupancyRate)} height={3} showLabel={false} />
                            </div>
                        ))}
                    </div>
                )}

                {/* Block breakdown */}
                {data.blockBreakdown.filter(b => b.label !== 'Unassigned').length > 0 && (
                    <div className="space-y-1.5 pt-1 border-t" style={{ borderColor: 'rgb(var(--border-color))' }}>
                        <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: G.muted }}>By Block</p>
                        {data.blockBreakdown.map(b => {
                            const pct = b.total > 0 ? Math.round((b.occupied / b.total) * 100) : 0;
                            return (
                                <div key={b.label} className="space-y-0.5">
                                    <div className="flex justify-between text-[10px]">
                                        <span style={{ color: 'rgb(var(--text-secondary))' }}>{b.label}</span>
                                        <span style={{ color: G.muted }}>{b.occupied}/{b.total}</span>
                                    </div>
                                    <ProgressBar pct={pct} color={occ_color(pct)} height={3} showLabel={false} />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Maintenance Panel ────────────────────────────────────────────────────────

function MaintenancePanel({ data }: { data: MaintenanceHealth }) {
    return (
        <div className="rounded border" style={{ background: 'rgb(var(--bg-panel))', borderColor: 'rgb(var(--border-color))' }}>
            <PanelHeader icon={<Wrench className="w-3.5 h-3.5" />}>Maintenance</PanelHeader>
            <div className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                    <ScoreRing score={data.healthScore} label={data.healthLabel} color={hc(data.healthLabel)} size={64} />
                    <div className="flex-1 ml-3 space-y-1.5">
                        <div className="flex justify-between text-[11px]">
                            <span style={{ color: G.muted }}>Open</span>
                            <span className="font-semibold" style={{ color: data.totalOpen > 0 ? G.red : G.muted }}>{data.totalOpen}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                            <span style={{ color: G.muted }}>In Progress</span>
                            <span className="font-semibold" style={{ color: data.totalInProgress > 0 ? G.orange : G.muted }}>{data.totalInProgress}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                            <span style={{ color: G.muted }}>Urgent</span>
                            <span className="font-bold" style={{ color: data.urgentItems > 0 ? G.red : G.muted }}>{data.urgentItems}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                            <span style={{ color: G.muted }}>Avg resolve</span>
                            <span className="font-semibold" style={{ color: 'rgb(var(--text-secondary))' }}>
                                {data.avgResolutionHours != null ? `${data.avgResolutionHours}h` : 'N/A'}
                            </span>
                        </div>
                    </div>
                    <div className="ml-2 self-start">
                        <HealthPip label={data.healthLabel} color={hc(data.healthLabel)} />
                    </div>
                </div>

                {/* Priority mini-bars */}
                {data.priorityDistribution.length > 0 && (
                    <div className="grid grid-cols-4 gap-1.5 pt-1 border-t" style={{ borderColor: 'rgb(var(--border-color))' }}>
                        {['URGENT', 'HIGH', 'MEDIUM', 'LOW'].map(p => {
                            const found = data.priorityDistribution.find(d => d.priority === p);
                            const count = found?.count ?? 0;
                            return (
                                <div key={p} className="flex flex-col items-center gap-0.5 px-1 py-1.5 rounded"
                                    style={{ background: count > 0 ? `${pc(p)}10` : 'transparent', border: `1px solid ${count > 0 ? `${pc(p)}30` : 'transparent'}` }}>
                                    <span className="text-[16px] font-bold tabular-nums" style={{ color: count > 0 ? pc(p) : G.muted }}>{count}</span>
                                    <span className="text-[8px] uppercase font-semibold" style={{ color: count > 0 ? pc(p) : G.muted }}>{p}</span>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Top open issues */}
                {data.openItemsList.length > 0 && (
                    <div className="space-y-1 pt-1 border-t" style={{ borderColor: 'rgb(var(--border-color))' }}>
                        <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: G.muted }}>Active Issues</p>
                        <div className="space-y-1 max-h-[120px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                            {data.openItemsList.slice(0, 5).map(item => (
                                <div key={item.id} className="flex items-center gap-1.5 px-2 py-1.5 rounded"
                                    style={{ background: 'rgb(var(--bg-app))' }}>
                                    <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: pc(item.priority) }} />
                                    <span className="flex-1 text-[11px] truncate" style={{ color: 'rgb(var(--text-primary))' }}>{item.description}</span>
                                    <span className="text-[9px] flex-shrink-0" style={{ color: G.muted }}>{item.ageHours}h</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Financial Panel ──────────────────────────────────────────────────────────

function FinancialPanel({ data }: { data: FinancialHealth }) {
    const hasRevenue = data.monthlyRevenue.some(m => m.invoiced > 0 || m.collected > 0);
    const collColor = data.collectionRate >= 80 ? G.green : data.collectionRate >= 60 ? G.orange : G.red;

    return (
        <div className="rounded border" style={{ background: 'rgb(var(--bg-panel))', borderColor: 'rgb(var(--border-color))' }}>
            <PanelHeader icon={<IndianRupee className="w-3.5 h-3.5" />}>Financial</PanelHeader>
            <div className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                    <ScoreRing score={data.healthScore} label={data.healthLabel} color={hc(data.healthLabel)} size={64} />
                    <div className="flex-1 ml-3 space-y-1.5">
                        <div className="flex justify-between text-[11px]">
                            <span style={{ color: G.muted }}>Collection</span>
                            <span className="font-bold" style={{ color: collColor }}>{data.collectionRate}%</span>
                        </div>
                        <ProgressBar pct={data.collectionRate} color={collColor} height={4} />
                        <div className="flex justify-between text-[11px]">
                            <span style={{ color: G.muted }}>Outstanding</span>
                            <span className="font-semibold" style={{ color: data.totalOutstanding > 0 ? G.orange : G.muted }}>
                                {fmtINR(data.totalOutstanding)}
                            </span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                            <span style={{ color: G.muted }}>Overdue</span>
                            <span className="font-semibold" style={{ color: data.overdueCount > 0 ? G.red : G.muted }}>
                                {data.overdueCount} inv.
                            </span>
                        </div>
                    </div>
                    <div className="ml-2 self-start">
                        <HealthPip label={data.healthLabel} color={hc(data.healthLabel)} />
                    </div>
                </div>

                {/* Revenue chart */}
                {hasRevenue && (
                    <div className="pt-1 border-t" style={{ borderColor: 'rgb(var(--border-color))' }}>
                        <p className="text-[9px] uppercase tracking-wider font-semibold mb-1" style={{ color: G.muted }}>6-Month Revenue</p>
                        <div className="h-[70px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.monthlyRevenue} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={G.blue} stopOpacity={0.25} />
                                            <stop offset="95%" stopColor={G.blue} stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={G.green} stopOpacity={0.25} />
                                            <stop offset="95%" stopColor={G.green} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="month" tick={{ fill: G.muted, fontSize: 9 }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [fmtINR(v), '']} />
                                    <Area type="monotone" dataKey="invoiced" name="Invoiced" stroke={G.blue} fill="url(#invGrad)" strokeWidth={1.5} dot={false} />
                                    <Area type="monotone" dataKey="collected" name="Collected" stroke={G.green} fill="url(#colGrad)" strokeWidth={1.5} dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex gap-3 mt-1">
                            <div className="flex items-center gap-1 text-[9px]" style={{ color: G.muted }}>
                                <div className="w-2 h-0.5 rounded" style={{ background: G.blue }} />Invoiced
                            </div>
                            <div className="flex items-center gap-1 text-[9px]" style={{ color: G.muted }}>
                                <div className="w-2 h-0.5 rounded" style={{ background: G.green }} />Collected
                            </div>
                        </div>
                    </div>
                )}

                {/* Overdue residents */}
                {data.overdueResidents.length > 0 && (
                    <div className="space-y-1 pt-1 border-t" style={{ borderColor: 'rgb(var(--border-color))' }}>
                        <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: G.muted }}>Overdue</p>
                        {data.overdueResidents.slice(0, 4).map(r => (
                            <div key={r.residentId} className="flex items-center justify-between px-2 py-1 rounded"
                                style={{ background: 'rgb(var(--bg-app))' }}>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-medium truncate" style={{ color: 'rgb(var(--text-primary))' }}>{r.residentName}</p>
                                    <p className="text-[9px]" style={{ color: G.muted }}>{r.oldestDueDaysAgo}d overdue</p>
                                </div>
                                <span className="text-[11px] font-bold flex-shrink-0 ml-2" style={{ color: G.red }}>
                                    {fmtINR(r.totalOverdue)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Overall Health Row ───────────────────────────────────────────────────────

function HealthRow({ intel, loading }: { intel: Intelligence | null; loading: boolean }) {
    if (loading || !intel) {
        return (
            <div className="rounded border px-4 py-2 flex items-center gap-3"
                style={{ background: 'rgb(var(--bg-panel))', borderColor: 'rgb(var(--border-color))' }}>
                <div className="h-3 w-24 rounded animate-pulse" style={{ background: 'rgb(44,50,53)' }} />
                <div className="h-3 w-32 rounded animate-pulse" style={{ background: 'rgb(44,50,53)' }} />
            </div>
        );
    }

    const color = hc(intel.overallHealthLabel);
    const domains = [
        { label: 'Occupancy',    score: intel.occupancy.healthScore,    hl: intel.occupancy.healthLabel },
        { label: 'Maintenance',  score: intel.maintenance.healthScore,  hl: intel.maintenance.healthLabel },
        { label: 'Financial',    score: intel.financial.healthScore,    hl: intel.financial.healthLabel },
    ];

    return (
        <div className="rounded border px-3 py-2 flex items-center gap-4 flex-wrap"
            style={{ background: 'rgb(var(--bg-panel))', borderColor: `${color}30`, boxShadow: `0 0 0 1px ${color}15` }}>
            <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" style={{ color }} />
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgb(var(--text-secondary))' }}>
                    Hostel Health
                </span>
                <span className="text-[20px] font-bold tabular-nums" style={{ color }}>{intel.overallHealthScore}</span>
                <HealthPip label={intel.overallHealthLabel} color={color} />
            </div>
            <div className="flex items-center gap-1" style={{ color: 'rgb(var(--border-color))' }}>·</div>
            {domains.map(d => (
                <div key={d.label} className="flex items-center gap-1.5">
                    <span className="text-[10px]" style={{ color: G.muted }}>{d.label}</span>
                    <span className="text-[13px] font-bold tabular-nums" style={{ color: hc(d.hl) }}>{d.score}</span>
                    <HealthPip label={d.hl} color={hc(d.hl)} />
                </div>
            ))}
        </div>
    );
}

// ─── KPI definitions type ─────────────────────────────────────────────────────

interface KpiDef {
    label: string;
    value: string | number;
    sub: string;
    color: string;
    icon: React.ElementType;
    severity?: KpiSeverity;
    trend?: KpiTrend;
    trendLabel?: string;
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
    const [summary, setSummary] = useState<DashboardData | null>(null);
    const [intel, setIntel] = useState<Intelligence | null>(null);
    const [loadingSummary, setLoadingSummary] = useState(true);
    const [loadingIntel, setLoadingIntel] = useState(true);
    const [dbOffline, setDbOffline] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const { showToast } = useToast();

    const fetchSummary = useCallback(async () => {
        try {
            setDbOffline(false);
            const res = await dashboardAPI.getSummary();
            setSummary(res.data);
        } catch {
            setDbOffline(true);
            setSummary(null);
        } finally {
            setLoadingSummary(false);
        }
    }, []);

    const fetchIntel = useCallback(async () => {
        try {
            const res = await dashboardAPI.getIntelligence();
            setIntel(res.data);
        } catch {
            setIntel(null);
        } finally {
            setLoadingIntel(false);
        }
    }, []);

    const refresh = useCallback(async () => {
        setLoadingSummary(true);
        setLoadingIntel(true);
        await Promise.all([fetchSummary(), fetchIntel()]);
        setLastRefresh(new Date());
        showToast('Dashboard refreshed', 'success');
    }, [fetchSummary, fetchIntel, showToast]);

    useEffect(() => {
        fetchSummary();
        fetchIntel();
    }, []);

    const attendanceData = (summary?.attendanceSummary || []).map(d => ({
        day: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
        present: d.present,
        total: d.total,
    }));

    // ── KPI definitions (business logic: severity + colour computed here) ──
    const kpis: KpiDef[] = [
        {
            label: 'Residents',
            value: summary?.totalResidents ?? '—',
            sub: `${summary?.activeResidents ?? 0} active`,
            color: G.blue,
            icon: Users,
            trend: 'flat',
        },
        {
            label: 'Occupancy',
            value: summary ? `${summary.occupancyRate}%` : '—',
            sub: `${summary?.occupiedRooms ?? 0} of ${summary?.totalRooms ?? 0} rooms`,
            color: summary && summary.occupancyRate >= 70 ? G.green : summary && summary.occupancyRate >= 40 ? G.orange : G.red,
            icon: BedDouble,
            severity: summary && summary.occupancyRate < 40 ? 'critical' : summary && summary.occupancyRate < 70 ? 'warn' : 'ok',
            trend: 'flat',
        },
        {
            label: 'Open Issues',
            value: summary?.openMaintenance ?? '—',
            sub: `${summary?.pendingMaintenance ?? 0} in progress · ${intel?.maintenance.urgentItems ?? 0} urgent`,
            color: (summary?.openMaintenance ?? 0) > 0 ? G.orange : G.muted,
            icon: Wrench,
            severity: (intel?.maintenance.urgentItems ?? 0) > 0 ? 'critical' : (summary?.openMaintenance ?? 0) > 0 ? 'warn' : 'ok',
        },
        {
            label: 'Urgent Issues',
            value: intel?.maintenance.urgentItems ?? '—',
            sub: `${intel?.maintenance.highPriorityItems ?? 0} high priority`,
            color: (intel?.maintenance.urgentItems ?? 0) > 0 ? G.red : G.muted,
            icon: ShieldAlert,
            severity: (intel?.maintenance.urgentItems ?? 0) > 0 ? 'critical' : 'ok',
        },
        {
            label: 'Pending Fees',
            value: summary?.pendingFees ?? '—',
            sub: `${summary?.overdueInvoices ?? 0} overdue`,
            color: (summary?.overdueInvoices ?? 0) > 0 ? G.red : (summary?.pendingFees ?? 0) > 0 ? G.orange : G.muted,
            icon: Banknote,
            severity: (summary?.overdueInvoices ?? 0) > 0 ? 'critical' : 'ok',
        },
        {
            label: 'Collection Rate',
            value: intel ? `${intel.financial.collectionRate}%` : '—',
            sub: intel ? fmtINR(intel.financial.totalOutstanding) + ' outstanding' : '',
            color: (intel?.financial.collectionRate ?? 100) >= 80 ? G.green : (intel?.financial.collectionRate ?? 100) >= 60 ? G.orange : G.red,
            icon: IndianRupee,
            severity: (intel?.financial.collectionRate ?? 100) < 60 ? 'critical' : (intel?.financial.collectionRate ?? 100) < 80 ? 'warn' : 'ok',
            trend: (intel?.financial.collectionRate ?? 100) > 0 ? 'up' : 'down',
        },
    ];

    const isLoading = loadingSummary || loadingIntel;

    return (
        <div className="space-y-3 animate-fadeIn">

            {/* DB Offline banner */}
            {dbOffline && (
                <div className="flex items-center gap-2 px-3 py-2 rounded text-[12px]"
                    style={{ background: `${G.red}12`, borderLeft: `3px solid ${G.red}`, color: G.red }}>
                    <Database className="w-4 h-4 flex-shrink-0" />
                    <span className="font-semibold">Database offline</span>
                    <span className="font-normal" style={{ color: 'rgb(var(--text-secondary))' }}>— Ensure backend is running on port 3000</span>
                </div>
            )}

            {/* Header row */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                    <h1 className="text-[13px] font-bold uppercase tracking-widest" style={{ color: 'rgb(var(--text-primary))' }}>
                        Mission Control
                    </h1>
                    <p className="text-[10px]" style={{ color: G.muted }}>
                        Refreshed {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                </div>
                <button
                    onClick={refresh}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded border transition-colors disabled:opacity-50"
                    style={{ borderColor: 'rgb(var(--border-color))', color: 'rgb(var(--text-secondary))', background: 'rgb(var(--bg-panel))' }}
                >
                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Overall health bar */}
            <HealthRow intel={intel} loading={loadingIntel} />

            {/* Alert Center — dominant, always above KPIs */}
            {intel && <AlertCenter alerts={intel.alerts} />}

            {/* KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2">
                {kpis.map(kpi => (
                    <KpiCard
                        key={kpi.label}
                        label={kpi.label}
                        value={kpi.value}
                        sub={kpi.sub}
                        color={kpi.color}
                        icon={kpi.icon}
                        severity={kpi.severity}
                        trend={kpi.trend}
                        trendLabel={kpi.trendLabel}
                        loading={isLoading}
                    />
                ))}
            </div>

            {/* Intelligence panels — 3 col */}
            {intel && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <OccupancyPanel data={intel.occupancy} />
                    <MaintenancePanel data={intel.maintenance} />
                    <FinancialPanel data={intel.financial} />
                </div>
            )}

            {/* Bottom row: attendance chart + activity feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* Attendance chart — 2/3 width */}
                <div className="rounded border lg:col-span-2" style={{ background: 'rgb(var(--bg-panel))', borderColor: 'rgb(var(--border-color))' }}>
                    <PanelHeader icon={<BarChart3 className="w-3.5 h-3.5" />}>Weekly Attendance</PanelHeader>
                    <div className="p-3 h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={attendanceData} barSize={16}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgb(44,50,53)" vertical={false} />
                                <XAxis dataKey="day" tick={{ fill: G.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: G.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                                <Bar dataKey="present" name="Present" fill={G.blue} radius={[2, 2, 0, 0]}>
                                    {attendanceData.map((_, i) => <Cell key={i} fill={G.blue} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Activity feed — 1/3 */}
                <div className="rounded border" style={{ background: 'rgb(var(--bg-panel))', borderColor: 'rgb(var(--border-color))' }}>
                    <PanelHeader icon={<Clock className="w-3.5 h-3.5" />}>Activity</PanelHeader>
                    {summary?.recentActivity && summary.recentActivity.length > 0 ? (
                        <div className="divide-panel">
                            {summary.recentActivity.slice(0, 8).map((ev, i) => (
                                <div key={i} className="flex items-start justify-between gap-2 px-3 py-2">
                                    <div className="flex items-start gap-1.5">
                                        <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0"
                                            style={{ background: ev.type === 'maintenance' ? G.orange : G.blue }} />
                                        <span className="text-[11px] leading-snug" style={{ color: 'rgb(var(--text-primary))' }}>
                                            {ev.message}
                                        </span>
                                    </div>
                                    <span className="text-[9px] flex-shrink-0" style={{ color: G.muted }}>
                                        {new Date(ev.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center px-3 py-6">
                            <span className="text-[11px]" style={{ color: G.muted }}>No recent activity</span>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
