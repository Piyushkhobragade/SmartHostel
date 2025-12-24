import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAttendance = async (req: Request, res: Response) => {
    try {
        const { date, residentId } = req.query;
        const where: any = {};

        if (date) {
            const searchDate = new Date(date as string);
            const nextDay = new Date(searchDate);
            nextDay.setDate(nextDay.getDate() + 1);

            where.date = {
                gte: searchDate,
                lt: nextDay
            };
        }

        if (residentId) {
            where.residentId = residentId as string;
        }

        const attendance = await prisma.attendanceLog.findMany({
            where,
            include: {
                resident: true,
            },
            orderBy: {
                date: 'desc',
            },
        });
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch attendance' });
    }
};

export const markAttendance = async (req: Request, res: Response) => {
    try {
        const { residentId, date, status, checkInTime, method } = req.body;
        const attendance = await prisma.attendanceLog.create({
            data: {
                residentId,
                date: new Date(date),
                status,
                method: method || 'MANUAL',
                checkInTime: checkInTime ? new Date(checkInTime) : null,
            },
        });
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ error: 'Failed to mark attendance' });
    }
};
