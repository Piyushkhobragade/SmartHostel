/**
 * Canonical loading spinner.
 * Replaces the duplicated `border-4 border-blue-600 border-t-transparent
 * rounded-full animate-spin` pattern used across all student pages.
 *
 * Usage:
 *   <Spinner />               — default medium, centred in flex container
 *   <Spinner size="sm" />     — small (w-6 h-6)
 *   <Spinner size="lg" />     — large (w-16 h-16)
 *   <Spinner label="Loading your data..." />
 */

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    label?: string;
    /** Full-page centred wrapper (default true) */
    fullPage?: boolean;
}

const SIZE = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-4',
    lg: 'w-16 h-16 border-4',
} as const;

export default function Spinner({ size = 'md', label, fullPage = true }: SpinnerProps) {
    const ring = (
        <div
            className={`${SIZE[size]} rounded-full animate-spin border-t-transparent`}
            style={{ borderColor: `rgb(var(--color-primary)) transparent transparent transparent` }}
        />
    );

    if (!fullPage) return ring;

    return (
        <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
                {ring}
                {label && (
                    <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
                        {label}
                    </p>
                )}
            </div>
        </div>
    );
}
