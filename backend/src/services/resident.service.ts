import prisma from '../lib/prisma';
import { residentRepository } from '../repositories/resident';
import { roomRepository } from '../repositories/room';
import { ResidentStatus } from '@prisma/client';

export const residentService = {
    async getResidents(filters: { page?: number; limit?: number; status?: string }) {
        const page = Math.max(1, filters.page || 1);
        const limit = Math.min(100, Math.max(1, filters.limit || 50));
        const skip = (page - 1) * limit;

        const where: any = {};
        if (filters.status) {
            where.status = filters.status as ResidentStatus;
        }

        const [residents, total] = await Promise.all([
            residentRepository.findMany(where, skip, limit),
            residentRepository.count(where),
        ]);

        return {
            data: residents,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    },

    async createResident(data: { fullName: string; email: string; phone: string; status?: string; roomId?: string | null }) {
        return prisma.$transaction(async (tx) => {
            const resident = await residentRepository.create(tx, {
                fullName: data.fullName,
                email: data.email,
                phone: data.phone,
                status: (data.status as ResidentStatus) ?? ResidentStatus.ACTIVE,
                room: data.roomId
                    ? {
                          connect: {
                              id: data.roomId,
                          },
                      }
                    : undefined,
            });

            if (data.roomId) {
                await roomRepository.incrementOccupancy(tx, data.roomId);
            }

            return resident;
        });
    },

    async updateResident(id: string, data: { fullName?: string; email?: string; phone?: string; status?: string; roomId?: string | null }) {
        return await prisma.$transaction(async (tx) => {
            const currentResident = await tx.resident.findUnique({ where: { id } });
            if (!currentResident) throw new Error('Resident not found');

            const oldRoomId = currentResident.roomId;

            const updatedResident = await tx.resident.update({
                where: { id },
                data: {
                    fullName: data.fullName,
                    email: data.email,
                    phone: data.phone,
                    status: data.status ? (data.status as ResidentStatus) : undefined,
                    roomId: data.roomId,
                },
            });

            // Handle room occupancy changes if room assignment changed
            if (oldRoomId !== data.roomId) {
                if (oldRoomId) {
                    await tx.room.update({
                        where: { id: oldRoomId },
                        data: { currentOccupancy: { decrement: 1 } },
                    });
                }
                if (data.roomId) {
                    await tx.room.update({
                        where: { id: data.roomId },
                        data: { currentOccupancy: { increment: 1 } },
                    });
                }
            }

            return updatedResident;
        });
    },

    async deleteResident(id: string) {
        return await prisma.$transaction(async (tx) => {
            const resident = await tx.resident.findUnique({ where: { id } });

            if (resident?.roomId) {
                await tx.room.update({
                    where: { id: resident.roomId },
                    data: { currentOccupancy: { decrement: 1 } },
                });
            }

            await tx.resident.delete({ where: { id } });
        });
    },
};
