import prisma from '../lib/prisma';

export const visitorService = {
    async getVisitors(filters: { residentId?: string; date?: string }) {
        const where: any = {};

        if (filters.residentId) {
            where.residentId = filters.residentId;
        }

        if (filters.date) {
            const searchDate = new Date(filters.date);
            const nextDay = new Date(searchDate);
            nextDay.setDate(nextDay.getDate() + 1);

            where.checkInTime = {
                gte: searchDate,
                lt: nextDay
            };
        }

        return await prisma.visitorLog.findMany({
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
    },

    async createVisitor(data: { visitorName: string; residentId: string; purpose: string; idType: string; idLast4: string }) {
        return await prisma.visitorLog.create({
            data: {
                visitorName: data.visitorName,
                residentId: data.residentId,
                purpose: data.purpose,
                idType: data.idType,
                idLast4: data.idLast4
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
    },

    async checkoutVisitor(id: string) {
        return await prisma.visitorLog.update({
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
    }
};
