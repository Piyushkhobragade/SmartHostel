/**
 * ProgressBar — horizontal bar with automatic colour based on value thresholds.
 * Colour is passed by caller; structural colours use CSS vars.
 */

interface ProgressBarProps {
    /** 0–100 fill percentage */
    pct: number;
    /** Bar colour as CSS rgb string — caller determines colour from business logic */
    color: string;
    /** Show percentage label. Default: true */
    showLabel?: boolean;
    /** Bar height in pixels. Default: 4 */
    height?: number;
}

export default function ProgressBar({
    pct,
    color,
    showLabel = true,
    height = 4,
}: ProgressBarProps) {
    const clamped = Math.max(0, Math.min(100, pct));

    return (
        <div className="flex items-center gap-2 w-full">
            <div
                className="flex-1 rounded-full overflow-hidden"
                style={{ height, background: 'rgb(var(--border-color))' }}
            >
                <div
                    className="h-full rounded-full"
                    style={{
                        width: `${clamped}%`,
                        background: color,
                        transition: 'width 0.5s ease',
                    }}
                />
            </div>
            {showLabel && (
                <span
                    className="text-[11px] font-semibold tabular-nums w-8 text-right flex-shrink-0"
                    style={{ color }}
                >
                    {Math.round(clamped)}%
                </span>
            )}
        </div>
    );
}
