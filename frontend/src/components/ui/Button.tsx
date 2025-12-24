import type { ReactNode, ButtonHTMLAttributes } from 'react';

import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    fullWidth?: boolean;
}

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transform';

    const variantStyles = {
        primary: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700 text-white shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-blue-500',
        secondary: 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-900 dark:text-gray-100 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] border border-gray-200 dark:border-slate-600 focus-visible:ring-gray-400',
        ghost: 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-gray-400',
        danger: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 dark:from-red-500 dark:to-red-600 dark:hover:from-red-600 dark:hover:to-red-700 text-white shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-red-500',
    };

    const sizeStyles = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
    };

    const widthStyles = fullWidth ? 'w-full' : '';

    return (
        <button
            className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {children}
        </button>
    );
}
