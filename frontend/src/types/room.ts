// Room Type Definitions

export interface Room {
    id: string;
    roomNumber: string;
    capacity: number;
    currentOccupancy: number;
    type: RoomType;
    status: RoomStatus;
    residents?: ResidentInRoom[];
    createdAt?: string;
    updatedAt?: string;
}

export type RoomType = 'AC' | 'NON_AC';

export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED';

export interface RoomFormData {
    roomNumber: string;
    capacity: number;
    type: RoomType;
    status: RoomStatus;
}

export interface ResidentInRoom {
    id: string;
    fullName: string;
    status: string;
}
