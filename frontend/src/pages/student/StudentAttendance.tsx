/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { studentAPI } from '../../services/api';
import { ChevronLeft, ChevronRight, CalendarCheck, AlertCircle } from 'lucide-react';
import Spinner from '../../components/Spinner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AttendanceRecord {
    id: string;
    date: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';
    checkInTime?: string;
    method: string;
}

interface AttendanceSummary {
    totalDays: number;
    present: number;
    absent: number;
    late: number;
    leave: number;
    rate: number;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    PRESENT: { label: 'Present',  color: 'rgb(var(--color-success))', bg: 'rgba(var(--color-success), 0.15)' },
    ABSENT:  { label: 'Absent',   color: 'rgb(var(--color-danger))',  bg: 'rgba(var(--color-danger), 0.15)'  },
    LATE:    { label: 'Late',     color: 'rgb(var(--color-warning))', bg: 'rgba(var(--color-warning), 0.15)' },
    LEAVE:   { label: 'Leave',    color: 'rgb(var(--color-info))',    bg: 'rgba(var(--color-info), 0.15)'    },
};

function statusColor(status: string): string {
    return STATUS_CONFIG[status]?.color ?? 'rgb(var(--text-muted))';
}
function statusBg(status: string): string {
    return STATUS_CONFIG[status]?.bg ?? 'rgba(var(--border-color), 0.4)';
}
function statusLabel(status: string): string {
    return STATUS_CONFIG[status]?.label ?? status;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
];

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
    return new Date(year, month, 1).getDay(); // 0=Sun
}

function fmtTime(iso?: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

// ─── Rate colour ──────────────────────────────────────────────────────────────

function rateColor(rate: number): string {
    if (rate >= 85) return 'rgb(var(--color-success))';
    if (rate >= 75) return 'rgb(var(--color-warning))';
    return 'rgb(var(--color-danger))';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StudentAttendance() {
    const today = new Date();
    const [year, setYear]   = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth()); // 0-indexed
    const [records, setRecords]   = useState<AttendanceRecord[]>([]);
    const [summary, setSummary]   = useState<AttendanceSummary | null>(null);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState('');

    function computeSummary(recs: AttendanceRecord[]) {
        const present = recs.filter(r => r.status === 'PRESENT').length;
        const absent  = recs.filter(r => r.status === 'ABSENT').length;
        const late    = recs.filter(r => r.status === 'LATE').length;
        const leave   = recs.filter(r => r.status === 'LEAVE').length;
        const total   = recs.length;
        const rate    = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
        setSummary({ totalDays: total, present, absent, late, leave, rate });
    }

    useEffect(() => {
        setLoading(true);
        setError('');
        studentAPI
            .getAttendance({ month: month + 1, year })
            .then(r => {
                const data = r.data;
                // API may return { records, summary } or just an array
                if (Array.isArray(data)) {
                    setRecords(data);
                    computeSummary(data);
                } else {
                    setRecords(data.records ?? data.attendance ?? []);
                    if (data.summary) {
                        setSummary(data.summary);
                    } else {
                        computeSummary(data.records ?? data.attendance ?? []);
                    }
                }
            })
            .catch(() => setError('Failed to load attendance.'))
            .finally(() => setLoading(false));
    }, [month, year]);

    // Build a map: "YYYY-MM-DD" -> record
    const recordMap = new Map<string, AttendanceRecord>();
    records.forEach(r => {
        const key = r.date.split('T')[0];
        recordMap.set(key, r);
    });

    function goBack() {
        if (month === 0) { setYear(y => y - 1); setMonth(11); }
        else setMonth(m => m - 1);
    }
    function goForward() {
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextYear  = month === 11 ? year + 1 : year;
        if (nextYear > today.getFullYear() || (nextYear === today.getFullYear() && nextMonth > today.getMonth())) return;
        if (month === 11) { setYear(y => y + 1); setMonth(0); }
        else setMonth(m => m + 1);
    }

    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay    = getFirstDayOfMonth(year, month);

    // Calendar grid: blanks + days
    const calendarCells: (number | null)[] = [
        ...Array(firstDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">

            {/* ── Page Header ──────────────────────────────────────────── */}
            <div>
                <h1 className="text-xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>
                    My Attendance
                </h1>
                <p className="text-sm mt-0.5" style={{ color: 'rgb(var(--text-muted))' }}>
                    Monthly attendance history and statistics
                </p>
            </div>

            {/* ── Month Navigator ──────────────────────────────────────── */}
            <div
                className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{ background: 'rgb(var(--bg-panel))', border: '1px solid rgb(var(--border-color))' }}
            >
                <button
                    onClick={goBack}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: 'rgb(var(--text-secondary))' }}
                    aria-label="Previous month"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
                    {MONTH_NAMES[month]} {year}
                </span>
                <button
                    onClick={goForward}
                    disabled={isCurrentMonth}
                    className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
                    style={{ color: 'rgb(var(--text-secondary))' }}
                    aria-label="Next month"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {loading ? (
                <Spinner label="Loading attendance..." />
            ) : error ? (
                <div className="flex items-center justify-center h-40">
                    <div className="text-center">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2" style={{ color: 'rgb(var(--color-danger))' }} />
                        <p className="text-sm" style={{ color: 'rgb(var(--color-danger))' }}>{error}</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* ── Summary Pills ──────────────────────────────────── */}
                    {summary && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                { key: 'PRESENT', count: summary.present, label: 'Present' },
                                { key: 'ABSENT',  count: summary.absent,  label: 'Absent'  },
                                { key: 'LATE',    count: summary.late,    label: 'Late'    },
                                { key: 'LEAVE',   count: summary.leave,   label: 'Leave'   },
                            ].map(({ key, count, label }) => (
                                <div
                                    key={key}
                                    className="rounded-xl p-3 text-center"
                                    style={{ background: statusBg(key), border: `1px solid ${statusColor(key)}30` }}
                                >
                                    <p className="text-2xl font-bold" style={{ color: statusColor(key) }}>{count}</p>
                                    <p className="text-xs font-medium mt-0.5" style={{ color: statusColor(key) }}>{label}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Attendance Rate Bar ──────────────────────────── */}
                    {summary && (
                        <div
                            className="rounded-xl p-4"
                            style={{ background: 'rgb(var(--bg-panel))', border: '1px solid rgb(var(--border-color))' }}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold" style={{ color: 'rgb(var(--text-secondary))' }}>
                                    Attendance Rate
                                </span>
                                <span className="text-xl font-bold" style={{ color: rateColor(summary.rate) }}>
                                    {summary.rate}%
                                </span>
                            </div>
                            <div
                                className="h-2 rounded-full overflow-hidden"
                                style={{ background: 'rgb(var(--border-color))' }}
                            >
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${summary.rate}%`,
                                        background: rateColor(summary.rate),
                                    }}
                                />
                            </div>
                            {summary.rate < 75 && (
                                <p className="text-xs mt-2 font-medium" style={{ color: 'rgb(var(--color-danger))' }}>
                                    ⚠ Below 75% minimum — contact your warden immediately
                                </p>
                            )}
                            {summary.rate >= 75 && summary.rate < 85 && (
                                <p className="text-xs mt-2" style={{ color: 'rgb(var(--color-warning))' }}>
                                    Attendance is acceptable — aim for 85%+
                                </p>
                            )}
                            {summary.rate >= 85 && (
                                <p className="text-xs mt-2" style={{ color: 'rgb(var(--color-success))' }}>
                                    Excellent attendance ✓
                                </p>
                            )}
                        </div>
                    )}

                    {/* ── Calendar Grid ────────────────────────────────── */}
                    <div
                        className="rounded-xl overflow-hidden"
                        style={{ border: '1px solid rgb(var(--border-color))' }}
                    >
                        {/* Weekday headers */}
                        <div className="grid grid-cols-7 border-b" style={{ borderColor: 'rgb(var(--border-color))', background: 'rgb(var(--bg-panel))' }}>
                            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                                <div
                                    key={d}
                                    className="text-center py-2 text-[10px] font-semibold uppercase tracking-wider"
                                    style={{ color: 'rgb(var(--text-muted))' }}
                                >
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* Day cells */}
                        <div className="grid grid-cols-7" style={{ background: 'rgb(var(--bg-panel))' }}>
                            {calendarCells.map((day, idx) => {
                                if (day === null) {
                                    return (
                                        <div
                                            key={`blank-${idx}`}
                                            className="aspect-square border-r border-b"
                                            style={{ borderColor: 'rgb(var(--border-color))', background: 'rgb(var(--bg-app))' }}
                                        />
                                    );
                                }
                                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                const record  = recordMap.get(dateStr);
                                const isToday = dateStr === today.toISOString().split('T')[0];
                                const isFuture = new Date(dateStr) > today;

                                return (
                                    <div
                                        key={day}
                                        className="aspect-square border-r border-b flex flex-col items-center justify-center gap-0.5 relative"
                                        style={{
                                            borderColor: 'rgb(var(--border-color))',
                                            background: record ? statusBg(record.status) : 'transparent',
                                        }}
                                        title={record ? `${statusLabel(record.status)} — Check-in: ${fmtTime(record.checkInTime)}` : undefined}
                                    >
                                        <span
                                            className={`text-xs font-semibold ${isToday ? 'w-6 h-6 rounded-full flex items-center justify-center' : ''}`}
                                            style={{
                                                color: isToday ? '#fff' : record ? statusColor(record.status) : isFuture ? 'rgb(var(--text-muted))' : 'rgb(var(--text-secondary))',
                                                background: isToday ? 'rgb(var(--color-primary))' : undefined,
                                            }}
                                        >
                                            {day}
                                        </span>
                                        {record && (
                                            <span
                                                className="text-[8px] font-medium leading-none"
                                                style={{ color: statusColor(record.status) }}
                                            >
                                                {statusLabel(record.status).slice(0, 3)}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Legend ───────────────────────────────────────── */}
                    <div className="flex flex-wrap gap-4 text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                            <div key={key} className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-sm" style={{ background: cfg.bg, border: `1px solid ${cfg.color}` }} />
                                <span>{cfg.label}</span>
                            </div>
                        ))}
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-sm" style={{ background: 'rgb(var(--bg-panel))', border: '1px solid rgb(var(--border-color))' }} />
                            <span>No record</span>
                        </div>
                    </div>

                    {/* ── Day-by-day List ──────────────────────────────── */}
                    {records.length > 0 && (
                        <div
                            className="rounded-xl overflow-hidden"
                            style={{ border: '1px solid rgb(var(--border-color))' }}
                        >
                            <div
                                className="px-4 py-2 flex items-center gap-2"
                                style={{ background: 'rgb(var(--bg-panel))', borderBottom: '1px solid rgb(var(--border-color))' }}
                            >
                                <CalendarCheck className="w-3.5 h-3.5" style={{ color: 'rgb(var(--text-muted))' }} />
                                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>
                                    Daily Log
                                </span>
                            </div>
                            <div style={{ background: 'rgb(var(--bg-panel))' }}>
                                {records
                                    .slice()
                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .map((rec, i, arr) => (
                                        <div
                                            key={rec.id}
                                            className="flex items-center justify-between px-4 py-2.5"
                                            style={{ borderBottom: i < arr.length - 1 ? '1px solid rgb(var(--border-color))' : 'none' }}
                                        >
                                            <div>
                                                <p className="text-sm font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
                                                    {new Date(rec.date).toLocaleDateString('en-IN', {
                                                        weekday: 'short', day: 'numeric', month: 'short'
                                                    })}
                                                </p>
                                                {rec.checkInTime && (
                                                    <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                                                        Check-in: {fmtTime(rec.checkInTime)} · {rec.method}
                                                    </p>
                                                )}
                                            </div>
                                            <span
                                                className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                                                style={{
                                                    background: statusBg(rec.status),
                                                    color: statusColor(rec.status),
                                                    border: `1px solid ${statusColor(rec.status)}40`,
                                                }}
                                            >
                                                {statusLabel(rec.status)}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {records.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <CalendarCheck className="w-12 h-12" style={{ color: 'rgb(var(--border-color))' }} />
                            <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
                                No attendance records for {MONTH_NAMES[month]} {year}
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
