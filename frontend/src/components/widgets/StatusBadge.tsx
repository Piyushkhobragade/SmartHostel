/* eslint-disable react-refresh/only-export-components, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/**
 * StatusBadge — canonical status badge for the entire application.
 *
 * Replaces:
 *  - components/ui/Badge.tsx  (Tailwind hardcoded colours)
 *  - inline getStatusBadge() helpers in Fees, Maintenance, Assets, etc.
 *
 * Uses CSS variable tokens exclusively.
 * Colour variant maps to design-system semantic tokens.
 */

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'muted';

interface StatusBadgeProps {
    label: string;
    variant: StatusVariant;
    /** If true, shows a pulsing dot (use for CRITICAL/live items) */
    pulse?: boolean;
    className?: string;
}

const VARIANT_TOKENS: Record<StatusVariant, { color: string; bg: string; border: string }> = {
    success: {
        color: 'rgb(var(--color-success))',
        bg: 'rgba(var(--color-success), 0.10)',
        border: 'rgba(var(--color-success), 0.30)',
    },
    warning: {
        color: 'rgb(var(--color-warning))',
        bg: 'rgba(var(--color-warning), 0.10)',
        border: 'rgba(var(--color-warning), 0.30)',
    },
    danger: {
        color: 'rgb(var(--color-danger))',
        bg: 'rgba(var(--color-danger), 0.10)',
        border: 'rgba(var(--color-danger), 0.30)',
    },
    info: {
        color: 'rgb(var(--color-info))',
        bg: 'rgba(var(--color-info), 0.10)',
        border: 'rgba(var(--color-info), 0.30)',
    },
    muted: {
        color: 'rgb(var(--text-muted))',
        bg: 'rgba(var(--border-color), 0.40)',
        border: 'rgba(var(--border-color), 0.60)',
    },
};

export default function StatusBadge({
    label,
    variant,
    pulse = false,
    className = '',
}: StatusBadgeProps) {
    const tokens = VARIANT_TOKENS[variant];

    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${className}`}
            style={{
                color: tokens.color,
                background: tokens.bg,
                border: `1px solid ${tokens.border}`,
            }}
        >
            {pulse && (
                <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0"
                    style={{ background: tokens.color }}
                />
            )}
            {label}
        </span>
    );
}

/**
 * Convenience helper — maps a raw status string to a StatusVariant.
 * Use this in DataGrid column accessors so every page uses the same mapping logic.
 */
export function resolveVariant(status: string): StatusVariant {
    const s = status.toUpperCase();
    if (['ACTIVE', 'PRESENT', 'PAID', 'RESOLVED', 'CLOSED', 'AVAILABLE', 'FUNCTIONAL'].includes(s)) return 'success';
    if (['PENDING', 'PARTIAL', 'IN_PROGRESS', 'MAINTENANCE'].includes(s)) return 'warning';
    if (['OPEN', 'OVERDUE', 'URGENT', 'SUSPENDED', 'ABSENT', 'DAMAGED', 'DISPOSED'].includes(s)) return 'danger';
    if (['INSIDE', 'ASSIGNED', 'OCCUPIED', 'RESERVED'].includes(s)) return 'info';
    return 'muted';
}
