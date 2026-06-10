import type { ComponentType, ReactNode } from 'react';

/**
 * EmptyState — canonical empty state using CSS variable tokens.
 * No hardcoded Tailwind colours.
 */

interface EmptyStateProps {
    icon: ComponentType<{ className?: string; style?: React.CSSProperties }>;
    title: string;
    description: string;
    action?: ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                style={{ background: 'rgb(var(--bg-app))' }}
            >
                <Icon
                    className="w-7 h-7"
                    style={{ color: 'rgb(var(--text-muted))' }}
                />
            </div>
            <h3
                className="text-base font-semibold mb-1"
                style={{ color: 'rgb(var(--text-primary))' }}
            >
                {title}
            </h3>
            <p
                className="text-sm mb-4 max-w-xs"
                style={{ color: 'rgb(var(--text-muted))' }}
            >
                {description}
            </p>
            {action && <div>{action}</div>}
        </div>
    );
}
