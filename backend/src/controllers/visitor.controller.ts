import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getVisitors = async (req: Request, res: Response) => {
    try {
        const { residentId, date } = req.query;
        const where: any = {};

        if (residentId) {
            where.residentId = residentId as string;
        }

        if (date) {
            const searchDate = new Date(date as string);
            const nextDay = new Date(searchDate);
            nextDay.setDate(nextDay.getDate() + 1);

            where.checkInTime = {
                gte: searchDate,
                lt: nextDay
            };
        }

        const visitors = await prisma.visitorLog.findMany({
            where,
            include: {
                resident: {
                    select: {
                        id: true,
                        fullName: true
                    }
                }
            },
            orderBy: {
                checkInTime: 'desc'
            }
        });

        res.json(visitors);
    } catch (error) {
        console.error('Failed to fetch visitors:', error);
        res.status(500).json({ error: 'Failed to fetch visitors' });
    }
};

export const createVisitor = async (req: Request, res: Response) => {
    try {
        const { visitorName, residentId, purpose, idType, idLast4 } = req.body;

        const visitor = await prisma.visitorLog.create({
            data: {
                visitorName,
                residentId,
                purpose,
                idType,
                idLast4
            },
            include: {
                resident: {
                    select: {
                        id: true,
                        fullName: true
                    }
                }
            }
        });

        res.json(visitor);
    } catch (error) {
        console.error('Failed to create visitor:', error);
        res.status(500).json({ error: 'Failed to create visitor' });
    }
};

export const checkoutVisitor = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const visitor = await prisma.visitorLog.update({
            where: { id },
            data: {
                checkOutTime: new Date()
            },
            include: {
                resident: {
                    select: {
                        id: true,
                        fullName: true
                    }
                }
            }
        });

        res.json(visitor);
    } catch (error) {
        console.error('Failed to checkout visitor:', error);
        res.status(500).json({ error: 'Failed to checkout visitor' });
    }
};
