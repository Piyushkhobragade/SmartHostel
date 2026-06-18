import { Request, Response } from 'express';
import { visitorService } from '../services/visitor.service';

export const getVisitors = async (req: Request, res: Response) => {
    try {
        const { residentId, date } = req.query;
        const visitors = await visitorService.getVisitors({
            residentId: residentId as string,
            date: date as string
        });
        res.json(visitors);
    } catch (error) {
        console.error('Failed to fetch visitors:', error);
        res.status(500).json({ error: 'Failed to fetch visitors' });
    }
};

export const createVisitor = async (req: Request, res: Response) => {
    try {
        const visitor = await visitorService.createVisitor(req.body);
        res.json(visitor);
    } catch (error) {
        console.error('Failed to create visitor:', error);
        res.status(500).json({ error: 'Failed to create visitor' });
    }
};

export const checkoutVisitor = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const visitor = await visitorService.checkoutVisitor(id);
        res.json(visitor);
    } catch (error) {
        console.error('Failed to checkout visitor:', error);
        res.status(500).json({ error: 'Failed to checkout visitor' });
    }
};
