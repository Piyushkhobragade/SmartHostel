import { useState, useEffect } from 'react';
import { timelineAPI } from '../../services/api';
import { Activity, AlertTriangle, Info, Clock, CheckCircle, ShieldAlert, Zap } from 'lucide-react';

/**
 * OperationalTimeline — real-time alert and event feed.
 * Uses CSS variable tokens exclusively (no Tailwind dark: prefixes).
 */

interface Alert {
    id: string;
    type: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    title: string;
    description: string;
    recommendation: string;
    status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';
    createdAt: string;
}

interface Event {
    id: string;
    type: string;
    entityType: string;
    title: string;
    severity: string;
    createdAt: string;
}

/** Maps severity to CSS var colour string */
const SEVERITY_COLOR: Record<string, string> = {
    CRITICAL: 'rgb(var(--color-danger))',
    HIGH:     'rgb(var(--color-warning))',
    MEDIUM:   'rgb(var(--color-warning))',
    LOW:      'rgb(var(--color-info))',
    INFO:     'rgb(var(--text-muted))',
    WARNING:  'rgb(var(--color-warning))',
};

const SEVERITY_ICON: Record<string, React.ElementType> = {
    CRITICAL: ShieldAlert,
    HIGH:     AlertTriangle,
    MEDIUM:   AlertTriangle,
    LOW:      Info,
    INFO:     Info,
    WARNING:  AlertTriangle,
};

export default function OperationalTimeline() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [triggering, setTriggering] = useState(false);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [alertsRes, eventsRes] = await Promise.all([
                timelineAPI.getAlerts({ status: 'ACTIVE' }),
                timelineAPI.getEvents({ limit: 50 }),
            ]);
            setAlerts(alertsRes.data || []);
            setEvents(eventsRes.data.events || []);
        } catch (error) {
            console.error('Failed to fetch timeline data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRunIntelligence = async () => {
        try {
            setTriggering(true);
            await fetch('http://localhost:3000/api/intelligence/run', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            });
            await fetchData();
        } catch (error) {
            console.error('Failed to run intelligence checks', error);
        } finally {
            setTriggering(false);
        }
    };

    const handleUpdateAlert = async (id: string, status: string) => {
        try {
            if (status === 'ACKNOWLEDGED') await timelineAPI.acknowledgeAlert(id);
            if (status === 'RESOLVED')     await timelineAPI.resolveAlert(id);
            if (status === 'DISMISSED')    await timelineAPI.dismissAlert(id);
            fetchData();
        } catch (error) {
            console.error('Failed to update alert', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
                <div
                    className="rounded-full h-10 w-10 border-2 border-b-transparent animate-spin"
                    style={{ borderColor: 'rgb(var(--color-primary))' }}
                />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1
                        className="text-xl font-bold flex items-center gap-2"
                        style={{ color: 'rgb(var(--text-primary))' }}
                    >
                        <Activity className="w-5 h-5" style={{ color: 'rgb(var(--color-primary))' }} />
                        Operational Timeline &amp; Alerts
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: 'rgb(var(--text-muted))' }}>
                        Real-time intelligence and hostel events
                    </p>
                </div>
                <button
                    onClick={handleRunIntelligence}
                    disabled={triggering}
                    className="btn btn-primary flex items-center gap-2 px-4 py-2"
                >
                    <Zap className={`w-4 h-4 ${triggering ? 'animate-pulse' : ''}`} />
                    {triggering ? 'Running Checks...' : 'Run Intelligence Checks'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Risk Monitor */}
                <div className="lg:col-span-1">
                    <div
                        className="rounded-xl p-4"
                        style={{
                            background: 'rgb(var(--bg-panel))',
                            border: '1px solid rgb(var(--border-color))',
                        }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold flex items-center gap-2" style={{ color: 'rgb(var(--text-primary))' }}>
                                <ShieldAlert className="w-5 h-5" style={{ color: 'rgb(var(--color-danger))' }} />
                                Risk Monitor
                            </h2>
                            <span
                                className="text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{
                                    background: 'rgb(var(--bg-app))',
                                    color: 'rgb(var(--text-secondary))',
                                    border: '1px solid rgb(var(--border-color))',
                                }}
                            >
                                {alerts.length}
                            </span>
                        </div>

                        {alerts.length === 0 ? (
                            <div className="text-center py-8">
                                <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-40" style={{ color: 'rgb(var(--color-success))' }} />
                                <p className="text-sm font-medium" style={{ color: 'rgb(var(--text-secondary))' }}>All clear</p>
                                <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-muted))' }}>No active alerts</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {alerts.map(alert => {
                                    const color = SEVERITY_COLOR[alert.severity] ?? SEVERITY_COLOR.INFO;
                                    const Icon = SEVERITY_ICON[alert.severity] ?? Info;
                                    return (
                                        <div
                                            key={alert.id}
                                            className="rounded-lg relative overflow-hidden"
                                            style={{
                                                background: 'rgb(var(--bg-app))',
                                                border: `1px solid ${color}30`,
                                                padding: '12px 12px 12px 16px',
                                            }}
                                        >
                                            {/* Severity left bar */}
                                            <div
                                                className="absolute top-0 left-0 w-1 h-full"
                                                style={{ background: color }}
                                            />
                                            <div className="flex items-center gap-2 mb-2">
                                                <span
                                                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                                                    style={{
                                                        color,
                                                        background: `${color}18`,
                                                        border: `1px solid ${color}40`,
                                                    }}
                                                >
                                                    <Icon className="w-3 h-3" />
                                                    {alert.severity}
                                                </span>
                                                <span className="text-[10px]" style={{ color: 'rgb(var(--text-muted))' }}>
                                                    {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <h3 className="font-semibold text-sm mb-1 leading-tight" style={{ color: 'rgb(var(--text-primary))' }}>
                                                {alert.title}
                                            </h3>
                                            <p className="text-xs mb-3" style={{ color: 'rgb(var(--text-secondary))' }}>
                                                {alert.description}
                                            </p>
                                            {alert.recommendation && (
                                                <div
                                                    className="mb-3 p-2 rounded text-xs"
                                                    style={{
                                                        background: 'rgb(var(--bg-panel))',
                                                        border: '1px solid rgb(var(--border-color))',
                                                        color: 'rgb(var(--text-secondary))',
                                                    }}
                                                >
                                                    <span className="font-semibold block mb-0.5" style={{ color: 'rgb(var(--color-primary))' }}>
                                                        Recommendation:
                                                    </span>
                                                    {alert.recommendation}
                                                </div>
                                            )}
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleUpdateAlert(alert.id, 'ACKNOWLEDGED')}
                                                    className="flex-1 text-[11px] font-medium py-1.5 rounded-lg transition-colors"
                                                    style={{
                                                        background: 'rgb(var(--bg-panel))',
                                                        border: '1px solid rgb(var(--border-color))',
                                                        color: 'rgb(var(--text-secondary))',
                                                    }}
                                                >
                                                    Acknowledge
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateAlert(alert.id, 'RESOLVED')}
                                                    className="flex-1 text-[11px] font-medium py-1.5 rounded-lg transition-colors"
                                                    style={{
                                                        color: 'rgb(var(--color-success))',
                                                        background: 'rgba(var(--color-success), 0.08)',
                                                        border: '1px solid rgba(var(--color-success), 0.30)',
                                                    }}
                                                >
                                                    Resolve
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Timeline Feed */}
                <div className="lg:col-span-2">
                    <div
                        className="rounded-xl p-4"
                        style={{
                            background: 'rgb(var(--bg-panel))',
                            border: '1px solid rgb(var(--border-color))',
                        }}
                    >
                        <h2
                            className="font-bold flex items-center gap-2 mb-5"
                            style={{ color: 'rgb(var(--text-primary))' }}
                        >
                            <Clock className="w-5 h-5" style={{ color: 'rgb(var(--color-primary))' }} />
                            Event Timeline
                        </h2>

                        {events.length === 0 ? (
                            <div className="text-center py-10">
                                <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: 'rgb(var(--text-muted))' }} />
                                <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>No events recorded yet.</p>
                            </div>
                        ) : (
                            <div
                                className="relative border-l-2 ml-3 space-y-5 pb-2"
                                style={{ borderColor: 'rgb(var(--border-color))' }}
                            >
                                {events.map((event, index) => {
                                    const color = SEVERITY_COLOR[event.severity] ?? SEVERITY_COLOR.INFO;
                                    return (
                                        <div
                                            key={event.id}
                                            className="relative pl-6 animate-fadeIn"
                                            style={{ animationDelay: `${index * 40}ms` }}
                                        >
                                            {/* Timeline dot */}
                                            <div
                                                className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 flex-shrink-0"
                                                style={{
                                                    background: color,
                                                    borderColor: 'rgb(var(--bg-panel))',
                                                }}
                                            />
                                            <div
                                                className="rounded-lg p-3"
                                                style={{
                                                    background: 'rgb(var(--bg-app))',
                                                    border: '1px solid rgb(var(--border-color))',
                                                }}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className="text-[10px] font-bold uppercase tracking-wider"
                                                            style={{ color: 'rgb(var(--text-secondary))' }}
                                                        >
                                                            {event.entityType}
                                                        </span>
                                                        <span className="text-[10px]" style={{ color: 'rgb(var(--text-muted))' }}>
                                                            · {new Date(event.createdAt).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    {event.severity !== 'INFO' && (
                                                        <span
                                                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase"
                                                            style={{
                                                                color,
                                                                background: `${color}18`,
                                                                border: `1px solid ${color}40`,
                                                            }}
                                                        >
                                                            {event.severity}
                                                        </span>
                                                    )}
                                                </div>
                                                <h3
                                                    className="font-semibold text-sm"
                                                    style={{ color: 'rgb(var(--text-primary))' }}
                                                >
                                                    {event.title}
                                                </h3>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
