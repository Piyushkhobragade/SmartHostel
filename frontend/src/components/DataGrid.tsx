/* eslint-disable react-refresh/only-export-components, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
    ChevronUp, ChevronDown, ChevronsUpDown, Search, X,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    Download, SlidersHorizontal, Loader2, Inbox,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export type SortDir = 'asc' | 'desc';

export interface ColumnDef<T> {
    /** Unique key used for sort/filter state */
    key: string;
    /** Column header label */
    header: string;
    /** Render function or data key */
    accessor: keyof T | ((row: T) => React.ReactNode);
    /** If true, column can be sorted */
    sortable?: boolean;
    /** Width hint (Tailwind w-* value), e.g. "w-48" */
    width?: string;
    /** If provided, renders a dropdown column filter */
    filterOptions?: { label: string; value: string }[];
    /** Display alignment */
    align?: 'left' | 'center' | 'right';
}

export interface BulkAction<T> {
    label: string;
    icon?: React.ReactNode;
    variant?: 'primary' | 'danger' | 'warning' | 'default';
    onClick: (selectedRows: T[]) => void;
}

export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface DataGridProps<T extends { id: string }> {
    /** The dataset to display */
    data: T[];
    /** Column definitions */
    columns: ColumnDef<T>[];
    /** Loading skeleton */
    loading?: boolean;
    /** Empty state slot */
    emptyState?: React.ReactNode;
    /** Per-row action buttons (rendered in last column) */
    rowActions?: (row: T) => React.ReactNode;
    /** Bulk actions that appear when rows are selected */
    bulkActions?: BulkAction<T>[];
    /** If true, shows row checkboxes for selection */
    selectable?: boolean;
    /** Server-side pagination info. If undefined, client-side pagination is used */
    pagination?: PaginationInfo;
    /** Called when page changes (server-side mode) */
    onPageChange?: (page: number) => void;
    /** Called when page size changes */
    onLimitChange?: (limit: number) => void;
    /** Called when sort changes (server-side) */
    onSortChange?: (key: string, dir: SortDir) => void;
    /** Called when search changes */
    onSearchChange?: (q: string) => void;
    /** Client-side search predicate override */
    searchFilter?: (row: T, query: string) => boolean;
    /** CSV export: provide column keys to include */
    csvExport?: { filename?: string };
    /** Panel title shown in top-left of the grid toolbar */
    title?: string;
    /** Subtitle / description */
    subtitle?: string;
    /** Slot for extra toolbar buttons (e.g. "+ Add" button) */
    toolbarActions?: React.ReactNode;
    /** Controlled client-side filter state passed from parent */
    externalFilters?: Record<string, string>;
}

// ─── Badge helper ─────────────────────────────────────────────────────────────

const VARIANT_CLASSES: Record<string, string> = {
    primary: 'bg-[rgb(var(--color-primary))] text-white hover:opacity-90',
    danger: 'bg-[rgb(var(--color-danger))] text-white hover:opacity-90',
    warning: 'bg-[rgb(var(--color-warning))] text-white hover:opacity-90',
    default: 'bg-[rgb(var(--bg-app))] border border-[rgb(var(--border-color))] text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--border-color))]',
};

// ─── Sort Icon ────────────────────────────────────────────────────────────────

function SortIcon({ col, sortKey, sortDir }: { col: string; sortKey: string; sortDir: SortDir }) {
    if (sortKey !== col) return <ChevronsUpDown className="w-3.5 h-3.5 opacity-30 ml-1 flex-shrink-0" />;
    return sortDir === 'asc'
        ? <ChevronUp className="w-3.5 h-3.5 ml-1 flex-shrink-0 text-[rgb(var(--color-primary))]" />
        : <ChevronDown className="w-3.5 h-3.5 ml-1 flex-shrink-0 text-[rgb(var(--color-primary))]" />;
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

function SkeletonRow({ cols }: { cols: number }) {
    return (
        <tr className="border-b border-[rgb(var(--border-color))]">
            {Array.from({ length: cols }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <div className="h-4 rounded bg-[rgb(var(--border-color))] animate-pulse" style={{ width: `${55 + (i * 17) % 35}%` }} />
                </td>
            ))}
        </tr>
    );
}

// ─── DataGrid ─────────────────────────────────────────────────────────────────

export function DataGrid<T extends { id: string }>({
    data,
    columns,
    loading = false,
    emptyState,
    rowActions,
    bulkActions = [],
    selectable = false,
    pagination,
    onPageChange,
    onLimitChange,
    onSortChange,
    onSearchChange,
    searchFilter,
    csvExport,
    title,
    subtitle,
    toolbarActions,
    externalFilters,
}: DataGridProps<T>) {
    // ── State ──
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState('');
    const [sortDir, setSortDir] = useState<SortDir>('asc');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [colFilters, setColFilters] = useState<Record<string, string>>({});
    const [clientPage, setClientPage] = useState(1);
    const [pageSize, setPageSize] = useState(pagination?.limit ?? 20);
    const [showFiltersBar, setShowFiltersBar] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);

    // reset page when search/filter changes
    useEffect(() => { setClientPage(1); }, [search, colFilters, externalFilters]);

    // ── Handlers ──
    const handleSearch = useCallback((q: string) => {
        setSearch(q);
        onSearchChange?.(q);
    }, [onSearchChange]);

    const handleSort = useCallback((key: string) => {
        const newDir: SortDir = (sortKey === key && sortDir === 'asc') ? 'desc' : 'asc';
        setSortKey(key);
        setSortDir(newDir);
        onSortChange?.(key, newDir);
    }, [sortKey, sortDir, onSortChange]);

    // (moved handleSelectAll below processedData)

    const handleSelectRow = useCallback((id: string, checked: boolean) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (checked) next.add(id);
            else next.delete(id);
            return next;
        });
    }, []);

    const clearSelection = () => setSelectedIds(new Set());

    // ── Client-side pipeline ──
    const processedData = useMemo(() => {
        if (pagination) return data; // server handles everything

        let result = [...data];

        // Global search
        if (search) {
            result = result.filter(row => {
                if (searchFilter) return searchFilter(row, search);
                return Object.values(row as any).some(v =>
                    String(v).toLowerCase().includes(search.toLowerCase())
                );
            });
        }

        // Column filters
        const activeFilters = { ...colFilters, ...(externalFilters ?? {}) };
        Object.entries(activeFilters).forEach(([key, val]) => {
            if (!val) return;
            result = result.filter(row => String((row as any)[key]) === val);
        });

        // Sorting
        if (sortKey) {
            result.sort((a, b) => {
                const av = (a as any)[sortKey];
                const bv = (b as any)[sortKey];
                if (av == null) return 1;
                if (bv == null) return -1;
                const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
                return sortDir === 'asc' ? cmp : -cmp;
            });
        }

        return result;
    }, [data, search, colFilters, externalFilters, sortKey, sortDir, pagination, searchFilter]);

    const handleSelectAll = useCallback((checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(processedData.map(r => r.id)));
        } else {
            setSelectedIds(new Set());
        }
    }, [processedData]);

    // ── Client-side pagination ──
    const clientTotal = processedData.length;
    const clientTotalPages = Math.max(1, Math.ceil(clientTotal / pageSize));
    const currentPage = pagination ? pagination.page : clientPage;
    const totalPages = pagination ? pagination.totalPages : clientTotalPages;
    const total = pagination ? pagination.total : clientTotal;

    const pagedData = useMemo(() => {
        if (pagination) return data;
        const start = (clientPage - 1) * pageSize;
        return processedData.slice(start, start + pageSize);
    }, [processedData, clientPage, pageSize, pagination, data]);

    const selectedRows = useMemo(
        () => pagedData.filter(r => selectedIds.has(r.id)),
        [pagedData, selectedIds]
    );

    const allPageSelected = pagedData.length > 0 && pagedData.every(r => selectedIds.has(r.id));
    const someSelected = selectedIds.size > 0;

    // ── CSV Export ──
    const handleExport = () => {
        const rows = processedData;
        const headers = columns.map(c => c.header);
        const csvRows = rows.map(row =>
            columns.map(col => {
                if (typeof col.accessor === 'function') return '';
                return `"${String((row as any)[col.accessor as string] ?? '').replace(/"/g, '""')}"`;
            }).join(',')
        );
        const blob = new Blob([`${headers.join(',')}\n${csvRows.join('\n')}`], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${csvExport?.filename ?? 'export'}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const hasFilterOptions = columns.some(c => c.filterOptions?.length);

    // ── Render ──
    return (
        <div className="panel rounded-lg flex flex-col">
            {/* ── Toolbar ── */}
            <div className="flex flex-col gap-3 px-4 py-3 border-b border-[rgb(var(--border-color))]">
                {/* Row 1: title + actions */}
                {(title || toolbarActions) && (
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                            {title && <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))] tracking-wide uppercase">{title}</h2>}
                            {subtitle && <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5">{subtitle}</p>}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            {toolbarActions}
                        </div>
                    </div>
                )}

                {/* Row 2: search + filter toggle + export */}
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[180px] max-w-sm">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[rgb(var(--text-muted))]" />
                        <input
                            ref={searchRef}
                            type="text"
                            value={search}
                            onChange={e => handleSearch(e.target.value)}
                            placeholder="Search..."
                            aria-label="Search table"
                            className="input-field pl-8 pr-8 py-1.5 text-xs"
                        />
                        {search && (
                            <button
                                onClick={() => handleSearch('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Filter toggle */}
                    {hasFilterOptions && (
                        <button
                            onClick={() => setShowFiltersBar(v => !v)}
                            className={`btn text-xs gap-1.5 ${showFiltersBar
                                ? 'border-[rgb(var(--color-primary))] text-[rgb(var(--color-primary))]'
                                : 'border-[rgb(var(--border-color))] text-[rgb(var(--text-secondary))] hover:border-[rgb(var(--color-primary))]'}`}
                        >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            Filters
                            {Object.values(colFilters).filter(Boolean).length > 0 && (
                                <span className="ml-0.5 bg-[rgb(var(--color-primary))] text-white text-[10px] rounded-full px-1.5 py-0.5">
                                    {Object.values(colFilters).filter(Boolean).length}
                                </span>
                            )}
                        </button>
                    )}

                    {/* CSV Export */}
                    {csvExport && (
                        <button
                            onClick={handleExport}
                            className="btn text-xs gap-1.5 border-[rgb(var(--border-color))] text-[rgb(var(--text-secondary))] hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))]"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Export
                        </button>
                    )}

                    {/* Total count */}
                    <span className="ml-auto text-xs text-[rgb(var(--text-muted))] whitespace-nowrap">
                        {loading ? '…' : `${total.toLocaleString()} record${total !== 1 ? 's' : ''}`}
                    </span>
                </div>

                {/* Column filters bar */}
                {showFiltersBar && hasFilterOptions && (
                    <div className="flex items-center gap-3 flex-wrap pt-1 border-t border-[rgb(var(--border-color))]">
                        {columns.filter(c => c.filterOptions?.length).map(col => (
                            <div key={col.key} className="flex items-center gap-1.5">
                                <label className="text-xs text-[rgb(var(--text-muted))] whitespace-nowrap">{col.header}:</label>
                                <select
                                    value={colFilters[col.key] ?? ''}
                                    onChange={e => setColFilters(prev => ({ ...prev, [col.key]: e.target.value }))}
                                    className="input-field text-xs py-1 w-auto"
                                >
                                    <option value="">All</option>
                                    {col.filterOptions!.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                        {Object.values(colFilters).some(Boolean) && (
                            <button
                                onClick={() => setColFilters({})}
                                className="text-xs text-[rgb(var(--color-danger))] hover:underline ml-1"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* ── Bulk action bar ── */}
            {someSelected && bulkActions.length > 0 && (
                <div className="flex items-center gap-3 px-4 py-2 bg-[rgba(var(--color-primary),0.08)] border-b border-[rgb(var(--border-color))] flex-wrap">
                    <span className="text-xs font-medium text-[rgb(var(--color-primary))]">
                        {selectedIds.size} selected
                    </span>
                    <div className="flex gap-2 flex-wrap">
                        {bulkActions.map((action, i) => (
                            <button
                                key={i}
                                onClick={() => { action.onClick(selectedRows); clearSelection(); }}
                                className={`btn text-xs gap-1.5 ${VARIANT_CLASSES[action.variant ?? 'default']}`}
                            >
                                {action.icon}
                                {action.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={clearSelection}
                        className="ml-auto text-xs text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* ── Table ── */}
            <div className="overflow-x-auto flex-1">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="border-b border-[rgb(var(--border-color))]">
                            {selectable && (
                                <th className="w-10 px-4 py-2.5">
                                    <input
                                        type="checkbox"
                                        checked={allPageSelected}
                                        onChange={e => handleSelectAll(e.target.checked)}
                                        className="rounded border-[rgb(var(--border-color))] accent-[rgb(var(--color-primary))]"
                                    />
                                </th>
                            )}
                            {columns.map(col => (
                                <th
                                    key={col.key}
                                    className={`px-4 py-2.5 text-left text-xs font-semibold tracking-wider uppercase text-[rgb(var(--text-secondary))] whitespace-nowrap select-none ${col.width ?? ''} ${col.sortable ? 'cursor-pointer hover:text-[rgb(var(--text-primary))]' : ''} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}
                                    onClick={() => col.sortable && handleSort(col.key)}
                                >
                                    <div className={`inline-flex items-center ${col.align === 'right' ? 'flex-row-reverse' : ''}`}>
                                        {col.header}
                                        {col.sortable && <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />}
                                    </div>
                                </th>
                            ))}
                            {rowActions && (
                                <th className="px-4 py-2.5 text-right text-xs font-semibold tracking-wider uppercase text-[rgb(var(--text-secondary))] w-24">
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {loading
                            ? Array.from({ length: 8 }).map((_, i) => (
                                <SkeletonRow key={i} cols={(selectable ? 1 : 0) + columns.length + (rowActions ? 1 : 0)} />
                            ))
                            : pagedData.length === 0
                                ? (
                                    <tr>
                                        <td colSpan={(selectable ? 1 : 0) + columns.length + (rowActions ? 1 : 0)}>
                                            {emptyState ?? (
                                                <div className="flex flex-col items-center justify-center py-16 text-[rgb(var(--text-muted))]">
                                                    <Inbox className="w-10 h-10 mb-3 opacity-40" />
                                                    <p className="text-sm font-medium">No records found</p>
                                                    {search && <p className="text-xs mt-1">Try adjusting your search or filters</p>}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )
                                : pagedData.map((row, ri) => (
                                    <tr
                                        key={row.id}
                                        className={`border-b border-[rgb(var(--border-color))] transition-colors duration-100 ${selectedIds.has(row.id)
                                            ? 'bg-[rgba(var(--color-primary),0.06)]'
                                            : ri % 2 === 0
                                                ? 'hover:bg-[rgba(var(--border-color),0.4)]'
                                                : 'bg-[rgba(var(--border-color),0.15)] hover:bg-[rgba(var(--border-color),0.4)]'
                                            }`}
                                    >
                                        {selectable && (
                                            <td className="px-4 py-2.5 w-10">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(row.id)}
                                                    onChange={e => handleSelectRow(row.id, e.target.checked)}
                                                    onClick={e => e.stopPropagation()}
                                                    className="rounded border-[rgb(var(--border-color))] accent-[rgb(var(--color-primary))]"
                                                />
                                            </td>
                                        )}
                                        {columns.map(col => {
                                            const val = typeof col.accessor === 'function'
                                                ? col.accessor(row)
                                                : (row as any)[col.accessor as string];
                                            return (
                                                <td
                                                    key={col.key}
                                                    className={`px-4 py-2.5 text-[rgb(var(--text-primary))] ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}
                                                >
                                                    {val}
                                                </td>
                                            );
                                        })}
                                        {rowActions && (
                                            <td className="px-4 py-2.5 text-right">
                                                {rowActions(row)}
                                            </td>
                                        )}
                                    </tr>
                                ))
                        }
                    </tbody>
                </table>
            </div>

            {/* ── Pagination Footer ── */}
            {!loading && total > 0 && (
                <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-[rgb(var(--border-color))] flex-wrap">
                    {/* Page size */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-[rgb(var(--text-muted))]">Rows per page:</span>
                        <select
                            value={pageSize}
                            onChange={e => {
                                const v = Number(e.target.value);
                                setPageSize(v);
                                setClientPage(1);
                                onLimitChange?.(v);
                            }}
                            className="input-field text-xs py-1 w-auto"
                        >
                            {[10, 20, 50, 100].map(n => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                    </div>

                    {/* Page info */}
                    <span className="text-xs text-[rgb(var(--text-muted))]">
                        Page <span className="font-medium text-[rgb(var(--text-primary))]">{currentPage}</span> of{' '}
                        <span className="font-medium text-[rgb(var(--text-primary))]">{totalPages}</span>
                        <span className="ml-2 text-[rgb(var(--text-muted))]">({total.toLocaleString()} total)</span>
                    </span>

                    {/* Page buttons */}
                    <div className="flex items-center gap-1">
                        {[
                            { icon: <ChevronsLeft className="w-3.5 h-3.5" />, disabled: currentPage <= 1, go: 1 },
                            { icon: <ChevronLeft className="w-3.5 h-3.5" />, disabled: currentPage <= 1, go: currentPage - 1 },
                            { icon: <ChevronRight className="w-3.5 h-3.5" />, disabled: currentPage >= totalPages, go: currentPage + 1 },
                            { icon: <ChevronsRight className="w-3.5 h-3.5" />, disabled: currentPage >= totalPages, go: totalPages },
                        ].map((btn, i) => (
                            <button
                                key={i}
                                disabled={btn.disabled}
                                onClick={() => {
                                    if (pagination) onPageChange?.(btn.go);
                                    else setClientPage(btn.go);
                                }}
                                className="p-1.5 rounded border border-[rgb(var(--border-color))] text-[rgb(var(--text-secondary))] hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                {btn.icon}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Loading overlay for server-side refetch */}
            {loading && pagination && (
                <div className="absolute inset-0 flex items-center justify-center bg-[rgb(var(--bg-panel))]/60 rounded-lg z-10">
                    <Loader2 className="w-6 h-6 animate-spin text-[rgb(var(--color-primary))]" />
                </div>
            )}
        </div>
    );
}

export default DataGrid;
