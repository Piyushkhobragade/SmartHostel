import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    className?: string;
}

interface TableProps<T> {
    data: T[];
    columns: Column<T>[];
    isLoading?: boolean;
    emptyMessage?: string;
    emptyState?: React.ReactNode;
    onSearch?: (query: string) => void;
    searchPlaceholder?: string;
    actions?: (item: T) => React.ReactNode;
}

export default function Table<T extends { id: string }>({
    data,
    columns,
    isLoading,
    emptyMessage = 'No data found',
    emptyState,
    onSearch,
    searchPlaceholder = 'Search...',
    actions,
}: TableProps<T>) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Table Header / Toolbar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/50">
                {onSearch && (
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            onChange={(e) => onSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <button className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 transition-colors">
                        <Filter className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            {columns.map((col, index) => (
                                <th
                                    key={index}
                                    className={`px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider ${col.className || ''}`}
                                >
                                    {col.header}
                                </th>
                            ))}
                            {actions && (
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {isLoading ? (
                            <tr>
                                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-12 text-center">
                                    <div className="flex justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-4">
                                    {emptyState || (
                                        <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                                            {emptyMessage}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ) : (
                            data.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150">
                                    {columns.map((col, index) => (
                                        <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                                            {typeof col.accessor === 'function'
                                                ? col.accessor(item)
                                                : (item[col.accessor] as React.ReactNode)}
                                        </td>
                                    ))}
                                    {actions && (
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {actions(item)}
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination (Mock) */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/30 dark:bg-slate-800/30">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                    Showing <span className="font-semibold text-slate-900 dark:text-slate-100">1</span> to <span className="font-semibold text-slate-900 dark:text-slate-100">{Math.min(10, data.length)}</span> of{' '}
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{data.length}</span> results
                </div>
                <div className="flex gap-2">
                    <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors" disabled>
                        <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors" disabled>
                        <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                </div>
            </div>
        </div>
    );
}
