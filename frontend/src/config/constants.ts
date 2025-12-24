// SmartHostel Application Constants

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    DASHBOARD: '/',
    RESIDENTS: '/residents',
    ROOMS: '/rooms',
    ATTENDANCE: '/attendance',
    VISITORS: '/visitors',
    ASSETS: '/assets',
    MAINTENANCE: '/maintenance',
    FEES: '/fees',
    ANALYTICS: '/analytics'
};

export const RESIDENT_STATUS = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    CHECKOUT: 'CHECKOUT'
} as const;

export const ROOM_STATUS = {
    AVAILABLE: 'AVAILABLE',
    OCCUPIED: 'OCCUPIED',
    MAINTENANCE: 'MAINTENANCE',
    RESERVED: 'RESERVED'
} as const;

export const ROOM_TYPE = {
    AC: 'AC',
    NON_AC: 'NON_AC'
} as const;

export const ATTENDANCE_STATUS = {
    PRESENT: 'PRESENT',
    ABSENT: 'ABSENT',
    LEAVE: 'LEAVE'
} as const;

export const ATTENDANCE_METHOD = {
    MANUAL: 'MANUAL',
    BIOMETRIC: 'BIOMETRIC',
    RFID: 'RFID'
} as const;

export const ASSET_STATUS = {
    WORKING: 'WORKING',
    DAMAGED: 'DAMAGED',
    UNDER_REPAIR: 'UNDER_REPAIR',
    DISPOSED: 'DISPOSED'
} as const;

export const MAINTENANCE_STATUS = {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    RESOLVED: 'RESOLVED'
} as const;

export const MAINTENANCE_PRIORITY = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    URGENT: 'URGENT'
} as const;

export const FEE_STATUS = {
    PENDING: 'PENDING',
    PAID: 'PAID',
    OVERDUE: 'OVERDUE',
    CANCELLED: 'CANCELLED'
} as const;

export const PAYMENT_METHOD = {
    CASH: 'CASH',
    CARD: 'CARD',
    UPI: 'UPI',
    BANK_TRANSFER: 'BANK_TRANSFER'
} as const;

export const DATE_FORMAT = {
    DISPLAY: 'MMM DD, YYYY',
    INPUT: 'YYYY-MM-DD',
    DATETIME: 'MMM DD, YYYY HH:mm',
    TIME: 'HH:mm'
};

export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [10, 25, 50, 100]
};

export const VALIDATION = {
    MIN_PASSWORD_LENGTH: 6,
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp']
};
