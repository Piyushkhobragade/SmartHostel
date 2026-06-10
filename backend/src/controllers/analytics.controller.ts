import { Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service';

export const getOccupancyData = async (req: Request, res: Response) => {
    try {
        const occupancyData = await analyticsService.getOccupancyData();
        res.json(occupancyData);
    } catch (error) {
        console.error('Failed to fetch occupancy data:', error);
        res.status(500).json({
            error: 'Failed to fetch occupancy data'
        });
    }
};

export const getOccupancyForecast = async (req: Request, res: Response) => {
    try {
        const result = await analyticsService.getOccupancyForecast();
        res.json(result);
    } catch (error: any) {
        console.error('Failed to generate forecast:', error);
        if (error.message === 'No occupancy data available') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({
            error: 'Failed to generate forecast'
        });
    }
};
