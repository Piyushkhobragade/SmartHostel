import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all assets
export const getAssets = async (req: Request, res: Response) => {
    try {
        const { category, status } = req.query;
        const where: any = {};

        if (category) {
            where.category = category as string;
        }

        if (status) {
            where.status = status as string;
        }

        const assets = await prisma.asset.findMany({
            where,
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(assets);
    } catch (error) {
        console.error('Failed to fetch assets:', error);
        res.status(500).json({ error: 'Failed to fetch assets' });
    }
};

// Create asset
export const createAsset = async (req: Request, res: Response) => {
    try {
        const { name, category, status, location, purchasedAt } = req.body;

        const asset = await prisma.asset.create({
            data: {
                name,
                category,
                status,
                location,
                purchasedAt: purchasedAt ? new Date(purchasedAt) : null
            }
        });

        res.json(asset);
    } catch (error) {
        console.error('Failed to create asset:', error);
        res.status(500).json({ error: 'Failed to create asset' });
    }
};

// Update asset
export const updateAsset = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, category, status, location, purchasedAt } = req.body;

        const asset = await prisma.asset.update({
            where: { id },
            data: {
                name,
                category,
                status,
                location,
                purchasedAt: purchasedAt ? new Date(purchasedAt) : null
            }
        });

        res.json(asset);
    } catch (error) {
        console.error('Failed to update asset:', error);
        res.status(500).json({ error: 'Failed to update asset' });
    }
};

// Delete asset
export const deleteAsset = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.asset.delete({
            where: { id }
        });

        res.json({ message: 'Asset deleted successfully' });
    } catch (error) {
        console.error('Failed to delete asset:', error);
        res.status(500).json({ error: 'Failed to delete asset' });
    }
};
