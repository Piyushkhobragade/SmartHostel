/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { studentAPI } from '../../services/api';
import {
    BedDouble, Banknote, Users, Wrench,
    ArrowRight, Clock, CheckCircle, AlertCircle,
    CalendarCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Spinner from '../../components/Spinner';
import StatusBadge from '../../components/widgets/StatusBadge';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardData {
    resident: { id: string; fullName: string; email: string; phone: string; status: string };
    room: { roomNumber: string; type: string; floor?: string; block?: string } | null;
    attendance: { rate: number; streak: number; presentDays: number; totalTracked: number };
    nextDueFee: { id: string; amount: number; dueDate: string; description: string; status: string } | null;
    recentVisitors: Record<string, unknown>[];
    openMaintenanceCount: number;
}

// ─── Business logic helpers ───────────────────────────────────────────────────

/** Attendance rate → severity colour token */
function attendanceColor(rate: number): string {
    if (rate >= 85) return 'rgb(var(--color-success))';
    if (rate >= 75) return 'rgb(var(--color-warning))';
    return 'rgb(var(--color-danger))';
}

/** Days until fee → urgency descriptor */
function feeUrgency(days: number | null): { color: string; pulse: boolean; label: string } {
    if (days === null) return { color: 'rgb(var(--color-success))', pulse: false, label: 'No pending fees' };
    if (days < 0)  return { color: 'rgb(var(--color-danger))',  pulse: true,  label: 'OVERDUE' };
    if (days <= 3) return { color: 'rgb(var(--color-danger))',  pulse: true,  label: `${days}d left — pay now` };
    if (days <= 7) return { color: 'rgb(var(--color-warning))', pulse: false, label: `${days} days left` };
    return { color: 'rgb(var(--text-muted))', pulse: false, label: `${days} days left` };
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
    icon: Icon,
    iconColor,
    label,
    value,
    sub,
    subColor,
    urgencyRing,
    pulseRing,
}: {
    icon: React.ElementType;
    iconColor: string;
    label: string;
    value: React.ReactNode;
    sub: string;
    subColor?: string;
    urgencyRing?: string;
    pulseRing?: boolean;
}) {
    return (
        <div
            className="stat-card rounded-xl p-4"
            style={urgencyRing ? { boxShadow: `0 0 0 2px ${urgencyRing}`, borderColor: 'transparent' } : undefined}
        >
            <div className="flex items-center gap-2 mb-2">
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${iconColor.replace('rgb(', 'rgba(').replace(')', ', 0.12)')}` }}
                >
                    <Icon className="w-4 h-4" style={{ color: iconColor }} />
                </div>
                <span className="text-xs font-medium" style={{ color: 'rgb(var(--text-muted))' }}>{label}</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>{value}</div>
            <p
                className={`text-xs mt-0.5 ${pulseRing ? 'animate-pulse font-semibold' : ''}`}
                style={{ color: subColor || 'rgb(var(--text-muted))' }}
            >
                {sub}
            </p>
        </div>
    );
}

// ─── Quick Action Link ────────────────────────────────────────────────────────

function QuickAction({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
    return (
        <Link
            to={to}
            className="flex flex-col items-center gap-2 p-3 rounded-xl border transition-all group"
            style={{
                background: 'rgb(var(--bg-app))',
                borderColor: 'rgb(var(--border-color))',
            }}
        >
            <Icon
                className="w-5 h-5 transition-colors"
                style={{ color: 'rgb(var(--text-muted))' }}
            />
            <span className="text-xs font-medium" style={{ color: 'rgb(var(--text-secondary))' }}>
                {label}
            </span>
        </Link>
    );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function StudentDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        studentAPI.getDashboard()
            .then(r => setData(r.data))
            .catch(() => setError('Failed to load dashboard.'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Spinner label="Loading your hostel..." />;

    if (error || !data) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <AlertCircle className="w-10 h-10 mx-auto mb-2" style={{ color: 'rgb(var(--color-danger))' }} />
                    <p style={{ color: 'rgb(var(--color-danger))' }}>{error || 'No data available'}</p>
                </div>
            </div>
        );
    }

    // ── Business computations ──────────────────────────────────────────────
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    const daysUntilFee = data.nextDueFee
        ? Math.ceil((new Date(data.nextDueFee.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;

    const attColor = attendanceColor(data.attendance.rate);
    const attLow = data.attendance.rate < 75;
    const feeUrg = feeUrgency(daysUntilFee);
    const maintColor = data.openMaintenanceCount > 0
        ? 'rgb(var(--color-warning))'
        : 'rgb(var(--color-success))';

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">

            {/* ── Greeting Hero ───────────────────────────────────────── */}
            <div
                className="rounded-2xl p-6 text-white shadow-lg"
                style={{ background: 'linear-gradient(135deg, rgb(var(--color-primary)), rgb(var(--color-info)))' }}
            >
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-blue-100 text-sm font-medium">{greeting},</p>
                        <h1 className="text-2xl font-bold mt-0.5">{data.resident.fullName} 👋</h1>
                        <p className="text-blue-200 text-sm mt-1">
                            {data.room ? `Room ${data.room.roomNumber}` : 'No room assigned'}
                            {' · '}
                            <StatusBadge
                                label={data.resident.status}
                                variant={data.resident.status === 'ACTIVE' ? 'success' : 'muted'}
                                className="text-[10px]"
                            />
                        </p>
                    </div>
                    <div className="hidden sm:flex flex-col items-end gap-1">
                        <span className="text-white text-xs px-3 py-1 rounded-full font-medium"
                            style={{ background: 'rgba(255,255,255,0.20)' }}>
                            SmartHostel X
                        </span>
                        <span className="text-blue-200 text-xs">Student Portal</span>
                    </div>
                </div>
            </div>

            {/* ── Attendance urgency notice ────────────────────────────── */}
            {attLow && (
                <div
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                    style={{ background: 'rgba(var(--color-danger), 0.10)', borderLeft: '3px solid rgb(var(--color-danger))', color: 'rgb(var(--color-danger))' }}
                >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>
                        Your attendance is <strong>{data.attendance.rate}%</strong> — below the 75% threshold. Please contact the warden.
                    </span>
                </div>
            )}

            {/* ── KPI Strip ───────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Room */}
                <StatCard
                    icon={BedDouble}
                    iconColor="rgb(var(--color-primary))"
                    label="My Room"
                    value={data.room?.roomNumber || '—'}
                    sub={data.room
                        ? `${data.room.type}${data.room.floor ? ` · Floor ${data.room.floor}` : ''}`
                        : 'Not assigned'
                    }
                />

                {/* Attendance */}
                <StatCard
                    icon={CalendarCheck}
                    iconColor={attColor}
                    label="Attendance"
                    value={`${data.attendance.rate}%`}
                    sub={`🔥 ${data.attendance.streak} day streak`}
                    subColor={attColor}
                />

                {/* Fees */}
                <StatCard
                    icon={Banknote}
                    iconColor={data.nextDueFee ? feeUrg.color : 'rgb(var(--color-success))'}
                    label="Next Due"
                    value={data.nextDueFee ? `₹${data.nextDueFee.amount.toLocaleString()}` : 'Clear'}
                    sub={data.nextDueFee ? feeUrg.label : 'No pending fees'}
                    subColor={data.nextDueFee ? feeUrg.color : 'rgb(var(--color-success))'}
                    urgencyRing={feeUrg.pulse || (daysUntilFee !== null && daysUntilFee <= 7 && daysUntilFee >= 0)
                        ? feeUrg.color
                        : undefined}
                    pulseRing={feeUrg.pulse}
                />

                {/* Maintenance */}
                <StatCard
                    icon={Wrench}
                    iconColor={maintColor}
                    label="Open Issues"
                    value={data.openMaintenanceCount}
                    sub={data.openMaintenanceCount === 0 ? 'All clear ✓' : 'maintenance requests'}
                    subColor={maintColor}
                />
            </div>

            {/* ── Quick Actions ────────────────────────────────────────── */}
            <div className="panel p-5 rounded-xl">
                <h2 className="text-sm font-semibold mb-3" style={{ color: 'rgb(var(--text-secondary))' }}>
                    Quick Actions
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <QuickAction to="/student/room" icon={BedDouble} label="My Room" />
                    <QuickAction to="/student/fees" icon={Banknote} label="My Fees" />
                    <QuickAction to="/student/visitors" icon={Users} label="Visitors" />
                    <QuickAction to="/student/attendance" icon={CalendarCheck} label="Attendance" />
                </div>
            </div>

            {/* ── Recent Visitors ──────────────────────────────────────── */}
            {data.recentVisitors.length > 0 && (
                <div className="panel p-5 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-semibold" style={{ color: 'rgb(var(--text-secondary))' }}>
                            Recent Visitors
                        </h2>
                        <Link
                            to="/student/visitors"
                            className="text-xs flex items-center gap-1 hover:underline"
                            style={{ color: 'rgb(var(--color-primary))' }}
                        >
                            View all <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="divide-panel">
                        {data.recentVisitors.map((v: any) => (
                            <div
                                key={v.id}
                                className="flex items-center justify-between py-2"
                                style={{ borderBottom: '1px solid rgb(var(--border-color))' }}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                        style={{ background: 'rgb(var(--color-primary))' }}
                                    >
                                        {String(v.visitorName).charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-[rgb(var(--text-primary))]" style={{ color: 'rgb(var(--text-primary))' }}>
                                            {String(v.visitorName)}
                                        </p>
                                        <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>{v.purpose}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {v.checkOutTime ? (
                                        <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'rgb(var(--color-success))' }}>
                                            <CheckCircle className="w-3 h-3" /> Checked out
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'rgb(var(--color-primary))' }}>
                                            <Clock className="w-3 h-3" /> Active
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
}
