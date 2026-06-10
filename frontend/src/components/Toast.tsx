import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useEffect } from 'react';

/**
 * Toast — notification component using CSS variable tokens.
 * No hardcoded Tailwind colours.
 */

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
}

const ICON = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
};

const TYPE_COLOUR: Record<ToastType, string> = {
    success: 'rgb(var(--color-success))',
    error: 'rgb(var(--color-danger))',
    info: 'rgb(var(--color-info))',
};

export default function Toast({ message, type, onClose }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const Icon = ICON[type];
    const colour = TYPE_COLOUR[type];

    return (
        <div
            className="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-[280px] max-w-sm animate-slide-in-right"
            style={{
                background: 'rgb(var(--bg-panel))',
                border: `1px solid ${colour}40`,
                borderLeft: `3px solid ${colour}`,
            }}
        >
            <Icon className="w-4 h-4 flex-shrink-0" style={{ color: colour }} />
            <p
                className="flex-1 text-sm font-medium"
                style={{ color: 'rgb(var(--text-primary))' }}
            >
                {message}
            </p>
            <button
                onClick={onClose}
                className="flex-shrink-0 hover:opacity-70 transition-opacity"
                style={{ color: 'rgb(var(--text-muted))' }}
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}
