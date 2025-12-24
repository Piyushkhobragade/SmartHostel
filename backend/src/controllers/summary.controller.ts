import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getSummary = async (req: Request, res: Response) => {
    try {
        // Get counts in parallel
        const [totalResidents, totalRooms, rooms, todayAttendance] = await Promise.all([
            prisma.resident.count(),
            prisma.room.count(),
            prisma.room.findMany({
                select: {
                    currentOccupancy: true
                }
            }),
            prisma.attendanceLog.count({
                where: {
                    date: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                        lt: new Date(new Date().setHours(23, 59, 59, 999))
                    },
                    status: 'PRESENT'
                }
            })
        ]);

        // Calculate occupied rooms
        const occupiedRooms = rooms.filter(room => room.currentOccupancy > 0).length;

        // Calculate occupancy rate
        const occupancyRatePercent = totalRooms > 0
            ? Math.round((occupiedRooms / totalRooms) * 100)
            : 0;

        res.json({
            totalResidents,
            totalRooms,
            occupiedRooms,
            occupancyRatePercent,
            todaysAttendanceCount: todayAttendance
        });
    } catch (error) {
        console.error('Failed to fetch summary:', error);
        res.status(500).json({ error: 'Failed to fetch summary' });
    }
};
