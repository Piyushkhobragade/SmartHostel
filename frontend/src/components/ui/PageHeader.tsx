import type { ReactNode } from 'react';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    action?: ReactNode;
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                    {title}
                </h1>
                {subtitle && (
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {subtitle}
                    </p>
                )}
            </div>
            {action && (
                <div className="flex-shrink-0">
                    {action}
                </div>
            )}
        </div>
    );
}
