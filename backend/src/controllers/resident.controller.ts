import { Request, Response } from 'express';
import { residentService } from '../services/resident.service';

export const getResidents = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const status = req.query.status as string | undefined;

        const result = await residentService.getResidents({ page, limit, status });
        res.json(result);
    } catch (error) {
        console.error("GET RESIDENTS ERROR:", error);
        res.status(500).json({ error: 'Failed to fetch residents' });
    }
};

export const createResident = async (req: Request, res: Response) => {
    try {
        const resident = await residentService.createResident(req.body);
        res.json(resident);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create resident' });
    }
};

export const updateResident = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const resident = await residentService.updateResident(id, req.body);
        res.json(resident);
    } catch (error: any) {
        console.error(error);
        if (error.message === 'Resident not found') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to update resident' });
    }
};

export const deleteResident = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        await residentService.deleteResident(id);
        res.json({ message: 'Resident deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete resident' });
    }
};
