import type { InputHTMLAttributes } from 'react';

/**
 * Input — canonical form input using CSS variable tokens.
 * No hardcoded Tailwind colours.
 */

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export default function Input({ label, error, className = '', ...props }: InputProps) {
    return (
        <div className="w-full">
            {label && (
                <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: 'rgb(var(--text-secondary))' }}
                >
                    {label}
                </label>
            )}
            <input
                className={`input-field ${error ? 'border-[rgb(var(--color-danger))]' : ''} ${className}`}
                style={error ? { borderColor: 'rgb(var(--color-danger))' } : undefined}
                {...props}
            />
            {error && (
                <p
                    className="mt-1 text-xs"
                    style={{ color: 'rgb(var(--color-danger))' }}
                >
                    {error}
                </p>
            )}
        </div>
    );
}
