import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const messSubscriptionService = {
    // List all mess subscriptions with optional filter by active status
    async listMessSubscriptions(isActive?: boolean) {
        const where = isActive !== undefined ? { isActive } : {};

        return await prisma.messSubscription.findMany({
            where,
            include: {
                resident: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        phone: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    },

    // Get a single mess subscription by ID
    async getMessSubscriptionById(id: string) {
        return await prisma.messSubscription.findUnique({
            where: { id },
            include: {
                resident: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });
    },

    // Create a new mess subscription
    async createMessSubscription(data: {
        residentId: string;
        planName: string;
        monthlyFee: number;
        startDate: Date;
        endDate?: Date;
    }) {
        return await prisma.messSubscription.create({
            data: {
                residentId: data.residentId,
                planName: data.planName,
                monthlyFee: data.monthlyFee,
                startDate: data.startDate,
                endDate: data.endDate,
                isActive: true,
            },
            include: {
                resident: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
            },
        });
    },

    // Update an existing mess subscription
    async updateMessSubscription(id: string, data: {
        planName?: string;
        monthlyFee?: number;
        startDate?: Date;
        endDate?: Date;
        isActive?: boolean;
    }) {
        return await prisma.messSubscription.update({
            where: { id },
            data,
            include: {
                resident: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
            },
        });
    },

    // Deactivate a mess subscription
    async deactivateMessSubscription(id: string) {
        return await prisma.messSubscription.update({
            where: { id },
            data: {
                isActive: false,
                endDate: new Date(),
            },
            include: {
                resident: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
            },
        });
    },

    // Get active subscriptions for a specific resident
    async getResidentActiveSubscription(residentId: string) {
        return await prisma.messSubscription.findFirst({
            where: {
                residentId,
                isActive: true,
            },
            include: {
                resident: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
            },
        });
    },
};
