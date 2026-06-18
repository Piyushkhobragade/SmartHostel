import prisma from '../lib/prisma';

export const assetService = {
    async getAssets(filters: { category?: string; status?: string }) {
        const where: any = {};

        if (filters.category) {
            where.category = filters.category;
        }

        if (filters.status) {
            where.status = filters.status;
        }

        return await prisma.asset.findMany({
            where,
            orderBy: {
                createdAt: 'desc'
            }
        });
    },

    async createAsset(data: { name: string; category: string; status: string; location: string; purchasedAt?: string }) {
        return await prisma.asset.create({
            data: {
                name: data.name,
                category: data.category,
                status: data.status,
                location: data.location,
                purchasedAt: data.purchasedAt ? new Date(data.purchasedAt) : null
            }
        });
    },

    async updateAsset(id: string, data: { name?: string; category?: string; status?: string; location?: string; purchasedAt?: string }) {
        return await prisma.asset.update({
            where: { id },
            data: {
                name: data.name,
                category: data.category,
                status: data.status,
                location: data.location,
                purchasedAt: data.purchasedAt ? new Date(data.purchasedAt) : undefined
            }
        });
    },

    async deleteAsset(id: string) {
        return await prisma.asset.delete({
            where: { id }
        });
    }
};
