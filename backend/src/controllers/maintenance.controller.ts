import { Request, Response } from 'express';
import { maintenanceService } from '../services/maintenance.service';

export const getMaintenanceRequests = async (req: Request, res: Response) => {
    try {
        const { status, category } = req.query;
        const requests = await maintenanceService.getMaintenanceRequests({
            status: status as string,
            category: category as string
        });
        res.json(requests);
    } catch (error) {
        console.error('Failed to fetch maintenance requests:', error);
        res.status(500).json({ error: 'Failed to fetch maintenance requests' });
    }
};

export const createMaintenanceRequest = async (req: Request, res: Response) => {
    try {
        const request = await maintenanceService.createMaintenanceRequest(req.body);
        res.json(request);
    } catch (error) {
        console.error('Failed to create maintenance request:', error);
        res.status(500).json({ error: 'Failed to create maintenance request' });
    }
};

export const updateMaintenanceRequest = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const { status } = req.body;
        const request = await maintenanceService.updateMaintenanceRequest(id, { status });
        res.json(request);
    } catch (error) {
        console.error('Failed to update maintenance request:', error);
        res.status(500).json({ error: 'Failed to update maintenance request' });
    }
};
