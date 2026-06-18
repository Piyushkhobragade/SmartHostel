import prisma from '../lib/prisma';

export const roomService = {
    async getRooms() {
        return await prisma.room.findMany({
            include: {
                residents: true,
            },
        });
    },

    async createRoom(data: { roomNumber: string, capacity: number, type: string, status?: string }) {
        return await prisma.room.create({
            data: {
                roomNumber: data.roomNumber,
                capacity: data.capacity,
                type: data.type,
                status: data.status || 'AVAILABLE',
                currentOccupancy: 0
            },
        });
    },

    async updateRoom(id: string, data: { roomNumber?: string, capacity?: number, type?: string, status?: string }) {
        return await prisma.room.update({
            where: { id },
            data,
        });
    },

    async deleteRoom(id: string) {
        return await prisma.room.delete({
            where: { id },
        });
    }
};
