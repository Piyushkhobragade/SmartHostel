import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Button — canonical button component for SmartHostel.
 *
 * Single source of truth. Replaces:
 *  - components/Button.tsx  (old, Tailwind hardcoded colours)
 *  - components/ui/Button.tsx (old, gradient Tailwind)
 *
 * Uses CSS variable tokens exclusively.
 *
 * API notes:
 *  - `loading` is the canonical prop name.
 *  - `isLoading` is a deprecated alias kept for backward compatibility
 *    during migration. Remove after all call sites are updated.
 *  - `fullWidth` stretches the button to 100% width.
 *  - `variant` includes 'warning' in addition to the original set.
 */

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'warning';
    size?: 'sm' | 'md' | 'lg';
    /** Canonical loading state prop */
    loading?: boolean;
    /** @deprecated Use `loading` instead */
    isLoading?: boolean;
    fullWidth?: boolean;
}

const BASE =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ' +
    'disabled:opacity-50 disabled:cursor-not-allowed';

const SIZE: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
};

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    isLoading = false,
    fullWidth = false,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    const isSpinning = loading || isLoading;

    // Variant styles using CSS vars — no Tailwind hardcoded colours
    const variantStyle: React.CSSProperties = (() => {
        switch (variant) {
            case 'primary':
                return {
                    background: 'rgb(var(--color-primary))',
                    color: '#fff',
                };
            case 'danger':
                return {
                    background: 'rgb(var(--color-danger))',
                    color: '#fff',
                };
            case 'warning':
                return {
                    background: 'rgb(var(--color-warning))',
                    color: '#fff',
                };
            case 'secondary':
                return {
                    background: 'rgb(var(--bg-app))',
                    color: 'rgb(var(--text-primary))',
                    border: '1px solid rgb(var(--border-color))',
                };
            case 'ghost':
                return {
                    background: 'transparent',
                    color: 'rgb(var(--text-secondary))',
                    border: '1px solid transparent',
                };
        }
    })();

    return (
        <button
            className={`${BASE} ${SIZE[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
            style={variantStyle}
            disabled={disabled || isSpinning}
            {...props}
        >
            {isSpinning && <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />}
            {children}
        </button>
    );
}
