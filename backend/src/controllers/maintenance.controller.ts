import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all maintenance requests
export const getMaintenanceRequests = async (req: Request, res: Response) => {
    try {
        const { status, category } = req.query;
        const where: any = {};

        if (status) {
            where.status = status as string;
        }

        if (category) {
            where.category = category as string;
        }

        const requests = await prisma.maintenanceRequest.findMany({
            where,
            include: {
                resident: {
                    select: {
                        id: true,
                        fullName: true
                    }
                },
                asset: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(requests);
    } catch (error) {
        console.error('Failed to fetch maintenance requests:', error);
        res.status(500).json({ error: 'Failed to fetch maintenance requests' });
    }
};

// Create maintenance request
export const createMaintenanceRequest = async (req: Request, res: Response) => {
    try {
        const { assetId, residentId, category, description } = req.body;

        const request = await prisma.maintenanceRequest.create({
            data: {
                assetId: assetId || null,
                residentId: residentId || null,
                category,
                description,
                status: 'OPEN'
            },
            include: {
                resident: {
                    select: {
                        id: true,
                        fullName: true
                    }
                },
                asset: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        res.json(request);
    } catch (error) {
        console.error('Failed to create maintenance request:', error);
        res.status(500).json({ error: 'Failed to create maintenance request' });
    }
};

// Update maintenance request status
export const updateMaintenanceRequest = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const request = await prisma.maintenanceRequest.update({
            where: { id },
            data: { status },
            include: {
                resident: {
                    select: {
                        id: true,
                        fullName: true
                    }
                },
                asset: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        res.json(request);
    } catch (error) {
        console.error('Failed to update maintenance request:', error);
        res.status(500).json({ error: 'Failed to update maintenance request' });
    }
};
