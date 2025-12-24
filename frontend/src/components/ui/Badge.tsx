import type { ReactNode } from 'react';

interface BadgeProps {
    children: ReactNode;
    variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
    className?: string;
}

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
    const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

    const variantStyles = {
        success: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800',
        warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800',
        danger: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800',
        info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
        default: 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-slate-600',
    };

    return (
        <span className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
            {children}
        </span>
    );
}
