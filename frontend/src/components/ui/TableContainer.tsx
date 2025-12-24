import type { ReactNode } from 'react';

interface TableContainerProps {
    children: ReactNode;
    className?: string;
}

export default function TableContainer({ children, className = '' }: TableContainerProps) {
    return (
        <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden ${className}`}>
            <div className="overflow-x-auto">
                {children}
            </div>
        </div>
    );
}
