import prisma from '../lib/prisma';

export const maintenanceService = {
    async getMaintenanceRequests(filters: { status?: string; category?: string }) {
        const where: any = {};
        if (filters.status) where.status = filters.status;
        if (filters.category) where.category = filters.category;

        return await prisma.maintenanceRequest.findMany({
            where,
            include: {
                resident: { select: { id: true, fullName: true } },
                asset: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    },

    async createMaintenanceRequest(data: { assetId?: string; residentId?: string; category: string; description: string }) {
        return await prisma.maintenanceRequest.create({
            data: {
                assetId: data.assetId || null,
                residentId: data.residentId || null,
                category: data.category,
                description: data.description,
                status: 'OPEN'
            },
            include: {
                resident: { select: { id: true, fullName: true } },
                asset: { select: { id: true, name: true } }
            }
        });
    },

    async updateMaintenanceRequest(id: string, data: { status: string }) {
        return await prisma.maintenanceRequest.update({
            where: { id },
            data: { status: data.status },
            include: {
                resident: { select: { id: true, fullName: true } },
                asset: { select: { id: true, name: true } }
            }
        });
    }
};
