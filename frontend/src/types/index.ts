// Centralized Type Exports

export * from './resident';
export * from './room';
export * from './fee';

// Common/Shared Types
export interface ApiResponse<T> {
    data: T;
    message?: string;
    success: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
}

export interface SelectOption {
    value: string;
    label: string;
}
