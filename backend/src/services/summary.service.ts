import prisma from "../lib/prisma";

export const summaryService = {
    async getSummary() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [totalResidents, totalRooms, rooms, todaysAttendanceCount] =
            await Promise.all([
                prisma.resident.count(),
                prisma.room.count(),
                prisma.room.findMany({
                    select: {
                        currentOccupancy: true,
                    },
                }),
                prisma.attendanceLog.count({
                    where: {
                        date: {
                            gte: today,
                            lt: tomorrow,
                        },
                        status: "PRESENT",
                    },
                }),
            ]);

        const occupiedRooms = rooms.filter(
            (room) => room.currentOccupancy > 0
        ).length;

        const occupancyRatePercent =
            totalRooms === 0
                ? 0
                : Math.round((occupiedRooms / totalRooms) * 100);

        return {
            totalResidents,
            totalRooms,
            occupiedRooms,
            occupancyRatePercent,
            todaysAttendanceCount,
        };
    },
};
