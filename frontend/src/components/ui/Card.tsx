import type { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
    variant?: 'default' | 'glass' | 'bordered';
    hover?: boolean;
}

export default function Card({ children, className = '', variant = 'default', hover = false }: CardProps) {
    const baseStyles = 'p-6 rounded-2xl transition-all duration-200 border';

    const variantStyles = {
        default: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md',
        glass: 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl',
        bordered: 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 shadow-sm hover:shadow-md',
    };

    const hoverStyles = hover ? 'hover:scale-[1.01] hover:-translate-y-0.5' : '';

    return (
        <div className={`${baseStyles} ${variantStyles[variant]} ${hoverStyles} ${className}`}>
            {children}
        </div>
    );
}
