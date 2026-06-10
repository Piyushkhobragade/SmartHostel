/**
 * HealthPip — small coloured pill label showing a health status string.
 * Colour is passed by caller.
 */

interface HealthPipProps {
    /** Status label, e.g. 'Optimal', 'Warning', 'Critical' */
    label: string;
    /** Accent colour as CSS rgb string */
    color: string;
}

export default function HealthPip({ label, color }: HealthPipProps) {
    return (
        <span
            className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
            style={{
                color,
                background: `${color}18`,
                border: `1px solid ${color}40`,
            }}
        >
            <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: color }}
            />
            {label}
        </span>
    );
}
