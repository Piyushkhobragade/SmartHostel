import type { ElementType } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * KpiCard — compact operational KPI card for Mission Control.
 *
 * Severity top-bar (4px) conveys alert state at a glance.
 * Trend arrow (up/down/flat) shows direction vs previous period.
 * Colour is passed by the caller (Dashboard maps severity → CSS var string).
 */

export type KpiTrend = 'up' | 'down' | 'flat';
export type KpiSeverity = 'ok' | 'warn' | 'critical';

interface KpiCardProps {
    label: string;
    value: string | number;
    sub: string;
    /** Accent colour as CSS rgb string */
    color: string;
    /** Lucide icon component */
    icon: ElementType;
    severity?: KpiSeverity;
    trend?: KpiTrend;
    trendLabel?: string;
    loading?: boolean;
}

const TREND_ICON = {
    up: TrendingUp,
    down: TrendingDown,
    flat: Minus,
} as const;

export default function KpiCard({
    label,
    value,
    sub,
    color,
    icon: Icon,
    trend,
    trendLabel,
    loading = false,
}: KpiCardProps) {
    const TrendIcon = trend ? TREND_ICON[trend] : null;

    return (
        <div
            className="rounded border flex flex-col overflow-hidden"
            style={{
                background: 'rgb(var(--bg-panel))',
                borderColor: `${color}30`,
                boxShadow: `0 0 0 1px ${color}15`,
            }}
        >
            {/* Severity top bar */}
            <div className="h-[3px] w-full flex-shrink-0" style={{ background: color }} />

            {/* Card body */}
            <div className="flex items-start justify-between gap-2 px-3 py-2.5">
                <div className="flex flex-col gap-0.5 min-w-0">
                    <span
                        className="text-[10px] font-semibold uppercase tracking-wider truncate"
                        style={{ color: 'rgb(var(--text-secondary))' }}
                    >
                        {label}
                    </span>

                    {loading ? (
                        <div
                            className="h-5 w-16 rounded animate-pulse mt-0.5"
                            style={{ background: 'rgb(var(--border-color))' }}
                        />
                    ) : (
                        <span
                            className="text-lg font-bold tabular-nums leading-tight"
                            style={{ color }}
                        >
                            {value}
                        </span>
                    )}

                    <span
                        className="text-[10px] truncate"
                        style={{ color: 'rgb(var(--text-muted))' }}
                    >
                        {sub}
                    </span>

                    {/* Trend row */}
                    {TrendIcon && trendLabel && (
                        <div className="flex items-center gap-1 mt-0.5">
                            <TrendIcon className="w-3 h-3 flex-shrink-0" style={{ color }} />
                            <span
                                className="text-[10px]"
                                style={{ color: 'rgb(var(--text-muted))' }}
                            >
                                {trendLabel}
                            </span>
                        </div>
                    )}
                </div>

                <div
                    className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}18` }}
                >
                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                </div>
            </div>
        </div>
    );
}
