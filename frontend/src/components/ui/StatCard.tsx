import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    delay?: number;
}

export default function StatCard({ title, value, icon: Icon, trend, delay = 0 }: StatCardProps) {
    return (
        <div
            className="animate-slide-up bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-200"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {title}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                        {value}
                    </p>
                    {trend && (
                        <p className={`mt-2 text-sm ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                        </p>
                    )}
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
            </div>
        </div>
    );
}
