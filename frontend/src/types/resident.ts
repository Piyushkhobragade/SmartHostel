// Resident Type Definitions

export interface Resident {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    status: ResidentStatus;
    roomId?: string | null;
    checkInDate?: string;
    checkOutDate?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export type ResidentStatus = 'ACTIVE' | 'INACTIVE' | 'CHECKOUT';

export interface ResidentFormData {
    fullName: string;
    email: string;
    phone: string;
    status: ResidentStatus;
    roomId?: string;
}

export interface ResidentWithRoom extends Resident {
    room?: {
        id: string;
        roomNumber: string;
    };
}
