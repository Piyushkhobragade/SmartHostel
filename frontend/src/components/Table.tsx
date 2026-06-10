import { Search } from 'lucide-react';

/**
 * Table — legacy simple table using CSS variable tokens.
 *
 * Used by: Attendance.tsx, Mess.tsx (Fees migrated to DataGrid).
 * No hardcoded Tailwind colours.
 */

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
        <div
            className="rounded-lg overflow-hidden"
            style={{
                background: 'rgb(var(--bg-panel))',
                border: '1px solid rgb(var(--border-color))',
            }}
        >
            {/* Toolbar */}
            {onSearch && (
                <div
                    className="px-4 py-3 border-b"
                    style={{ borderColor: 'rgb(var(--border-color))' }}
                >
                    <div className="relative max-w-sm">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                            style={{ color: 'rgb(var(--text-muted))' }}
                        />
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            onChange={e => onSearch(e.target.value)}
                            className="input-field pl-9"
                        />
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr
                            className="border-b"
                            style={{ borderColor: 'rgb(var(--border-color))' }}
                        >
                            {columns.map((col, i) => (
                                <th
                                    key={i}
                                    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${col.className ?? ''}`}
                                    style={{ color: 'rgb(var(--text-secondary))' }}
                                >
                                    {col.header}
                                </th>
                            ))}
                            {actions && (
                                <th
                                    className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider"
                                    style={{ color: 'rgb(var(--text-secondary))' }}
                                >
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="border-b" style={{ borderColor: 'rgb(var(--border-color))' }}>
                                    {columns.map((_, j) => (
                                        <td key={j} className="px-4 py-3">
                                            <div
                                                className="h-4 rounded animate-pulse"
                                                style={{ width: `${50 + (j * 20) % 40}%`, background: 'rgb(var(--border-color))' }}
                                            />
                                        </td>
                                    ))}
                                    {actions && <td className="px-4 py-3" />}
                                </tr>
                            ))
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-4">
                                    {emptyState ?? (
                                        <div
                                            className="text-center text-sm py-8"
                                            style={{ color: 'rgb(var(--text-muted))' }}
                                        >
                                            {emptyMessage}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ) : (
                            data.map(item => (
                                <tr
                                    key={item.id}
                                    className="border-b transition-colors"
                                    style={{ borderColor: 'rgb(var(--border-color))' }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLElement).style.background = 'rgba(var(--border-color), 0.3)';
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                                    }}
                                >
                                    {columns.map((col, j) => (
                                        <td
                                            key={j}
                                            className="px-4 py-3"
                                            style={{ color: 'rgb(var(--text-primary))' }}
                                        >
                                            {typeof col.accessor === 'function'
                                                ? col.accessor(item)
                                                : (item[col.accessor] as React.ReactNode)}
                                        </td>
                                    ))}
                                    {actions && (
                                        <td className="px-4 py-3 text-right">
                                            {actions(item)}
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
