/**
 * ScoreRing — SVG circular gauge showing a 0–100 health score.
 * Colour is passed by caller (Dashboard maps score→colour using business logic).
 * Uses CSS variable tokens for neutral elements.
 */

interface ScoreRingProps {
    /** 0–100 health score */
    score: number;
    /** Human-readable health label, e.g. 'Optimal', 'Warning' */
    label: string;
    /** Accent colour as CSS rgb string, e.g. 'rgb(var(--color-success))' */
    color: string;
    /** Diameter in pixels. Default: 64 */
    size?: number;
    /** Stroke width. Default: 5 */
    strokeWidth?: number;
}

export default function ScoreRing({
    score,
    label,
    color,
    size = 64,
    strokeWidth = 5,
}: ScoreRingProps) {
    const r = (size - strokeWidth * 2) / 2;
    const circ = 2 * Math.PI * r;
    const pct = Math.max(0, Math.min(100, score));
    const offset = circ - (pct / 100) * circ;

    return (
        <div className="flex flex-col items-center gap-0.5" style={{ minWidth: size }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                {/* Track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    strokeWidth={strokeWidth}
                    fill="none"
                    stroke="rgb(var(--border-color))"
                />
                {/* Progress */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    strokeWidth={strokeWidth}
                    fill="none"
                    stroke={color}
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
                {/* Score text (counter-rotated) */}
                <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="central"
                    style={{
                        transform: `rotate(90deg) translate(0px, -${size}px)`,
                        transformOrigin: `${size / 2}px ${size / 2}px`,
                        fontSize: size * 0.22,
                        fontWeight: 700,
                        fill: color,
                        fontFamily: 'inherit',
                    }}
                >
                    {Math.round(pct)}
                </text>
            </svg>
            <span
                className="text-[10px] font-medium text-center leading-tight"
                style={{ color: 'rgb(var(--text-muted))' }}
            >
                {label}
            </span>
        </div>
    );
}
