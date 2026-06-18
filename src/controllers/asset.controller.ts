import { Request, Response } from 'express';
import { assetService } from '../services/asset.service';

export const getAssets = async (req: Request, res: Response) => {
    try {
        const { category, status } = req.query;
        const assets = await assetService.getAssets({
            category: category as string,
            status: status as string
        });
        res.json(assets);
    } catch (error) {
        console.error('Failed to fetch assets:', error);
        res.status(500).json({ error: 'Failed to fetch assets' });
    }
};

export const createAsset = async (req: Request, res: Response) => {
    try {
        const asset = await assetService.createAsset(req.body);
        res.json(asset);
    } catch (error) {
        console.error('Failed to create asset:', error);
        res.status(500).json({ error: 'Failed to create asset' });
    }
};

export const updateAsset = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const asset = await assetService.updateAsset(id, req.body);
        res.json(asset);
    } catch (error) {
        console.error('Failed to update asset:', error);
        res.status(500).json({ error: 'Failed to update asset' });
    }
};

export const deleteAsset = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await assetService.deleteAsset(id);
        res.json({ message: 'Asset deleted successfully' });
    } catch (error) {
        console.error('Failed to delete asset:', error);
        res.status(500).json({ error: 'Failed to delete asset' });
    }
};
