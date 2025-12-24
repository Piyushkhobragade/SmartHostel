import type { ReactNode } from 'react';

interface PageContainerProps {
    children: ReactNode;
    title?: string;
    subtitle?: string;
    action?: ReactNode;
}

export default function PageContainer({ children, title, subtitle, action }: PageContainerProps) {
    return (
        <div className="space-y-6">
            {(title || action) && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {title && (
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    )}
                    {action && <div className="flex-shrink-0">{action}</div>}
                </div>
            )}
            {children}
        </div>
    );
}
