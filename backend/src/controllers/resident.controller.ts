import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getResidents = async (req: Request, res: Response) => {
    try {
        const residents = await prisma.resident.findMany();
        res.json(residents);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch residents' });
    }
};

export const createResident = async (req: Request, res: Response) => {
    try {
        const { fullName, email, phone, status, roomId } = req.body;

        // Transaction to ensure atomicity
        const resident = await prisma.$transaction(async (prisma) => {
            const newResident = await prisma.resident.create({
                data: { fullName, email, phone, status: status || 'ACTIVE', roomId },
            });

            if (roomId) {
                await prisma.room.update({
                    where: { id: roomId },
                    data: { currentOccupancy: { increment: 1 } }
                });
            }
            return newResident;
        });

        res.json(resident);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create resident' });
    }
};

export const updateResident = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { fullName, email, phone, status, roomId } = req.body;

        const resident = await prisma.$transaction(async (prisma) => {
            // Get current resident data to check previous room
            const currentResident = await prisma.resident.findUnique({ where: { id } });
            if (!currentResident) throw new Error("Resident not found");

            const oldRoomId = currentResident.roomId;

            // Update resident
            const updatedResident = await prisma.resident.update({
                where: { id },
                data: { fullName, email, phone, status, roomId },
            });

            // Handle occupancy changes if room changed
            if (oldRoomId !== roomId) {
                // Decrement old room
                if (oldRoomId) {
                    await prisma.room.update({
                        where: { id: oldRoomId },
                        data: { currentOccupancy: { decrement: 1 } }
                    });
                }
                // Increment new room
                if (roomId) {
                    await prisma.room.update({
                        where: { id: roomId },
                        data: { currentOccupancy: { increment: 1 } }
                    });
                }
            }

            return updatedResident;
        });

        res.json(resident);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update resident' });
    }
};

export const deleteResident = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.$transaction(async (prisma) => {
            const resident = await prisma.resident.findUnique({ where: { id } });
            if (resident && resident.roomId) {
                await prisma.room.update({
                    where: { id: resident.roomId },
                    data: { currentOccupancy: { decrement: 1 } }
                });
            }
            await prisma.resident.delete({ where: { id } });
        });

        res.json({ message: 'Resident deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete resident' });
    }
};
