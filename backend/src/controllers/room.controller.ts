import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getRooms = async (req: Request, res: Response) => {
    try {
        const rooms = await prisma.room.findMany({
            include: {
                residents: true,
            },
        });
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch rooms' });
    }
};

export const createRoom = async (req: Request, res: Response) => {
    try {
        const { roomNumber, capacity, type, status } = req.body;
        const room = await prisma.room.create({
            data: {
                roomNumber,
                capacity,
                type,
                status: status || 'AVAILABLE',
                currentOccupancy: 0
            },
        });
        res.json(room);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create room' });
    }
};

export const updateRoom = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { roomNumber, capacity, type, status } = req.body;
        const room = await prisma.room.update({
            where: { id },
            data: { roomNumber, capacity, type, status },
        });
        res.json(room);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update room' });
    }
};

export const deleteRoom = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.room.delete({ where: { id } });
        res.json({ message: 'Room deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete room' });
    }
};
