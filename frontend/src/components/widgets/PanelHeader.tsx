/**
 * PanelHeader — canonical section title row for dashboard panels.
 * Uses CSS variable tokens exclusively.
 */

interface PanelHeaderProps {
    /** Leading icon element (e.g. a Lucide icon at w-3.5 h-3.5) */
    icon?: React.ReactNode;
    children: React.ReactNode;
}

export default function PanelHeader({ icon, children }: PanelHeaderProps) {
    return (
        <div
            className="flex items-center gap-1.5 px-3 py-2 border-b"
            style={{ borderColor: 'rgb(var(--border-color))' }}
        >
            {icon && (
                <span style={{ color: 'rgb(var(--text-muted))' }}>{icon}</span>
            )}
            <span
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: 'rgb(var(--text-secondary))' }}
            >
                {children}
            </span>
        </div>
    );
}
