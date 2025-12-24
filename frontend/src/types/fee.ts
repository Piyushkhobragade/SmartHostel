// Fee/Invoice Type Definitions

export interface FeeInvoice {
    id: string;
    residentId: string;
    amount: number;
    dueDate: string;
    status: FeeStatus;
    paymentDate?: string | null;
    paymentMethod?: PaymentMethod | null;
    resident?: {
        id: string;
        fullName: string;
    };
    createdAt?: string;
    updatedAt?: string;
}

export type FeeStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER';

export interface FeeFormData {
    residentId: string;
    amount: number;
    dueDate: string;
    status: FeeStatus;
}

export interface PaymentData {
    paymentMethod: PaymentMethod;
    paymentDate: string;
}
