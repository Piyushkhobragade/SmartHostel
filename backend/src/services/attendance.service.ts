import prisma from "../lib/prisma";

export const attendanceService = {
    async getAttendance(filters: {
        date?: string;
        residentId?: string;
    }) {
        const where: any = {};

        if (filters.date) {
            const start = new Date(filters.date);
            start.setHours(0, 0, 0, 0);

            const end = new Date(start);
            end.setDate(end.getDate() + 1);

            where.date = {
                gte: start,
                lt: end,
            };
        }

        if (filters.residentId) {
            where.residentId = filters.residentId;
        }

        return prisma.attendanceLog.findMany({
            where,
            include: {
                resident: true,
            },
            orderBy: {
                date: "desc",
            },
        });
    },

    async markAttendance(data: {
        residentId: string;
        date: string;
        status: string;
        checkInTime?: string;
        method?: string;
    }) {
        return prisma.attendanceLog.create({
            data: {
                residentId: data.residentId,
                date: new Date(data.date),
                status: data.status,
                method: data.method ?? "MANUAL",
                checkInTime: data.checkInTime
                    ? new Date(data.checkInTime)
                    : null,
            },
        });
    },
};
