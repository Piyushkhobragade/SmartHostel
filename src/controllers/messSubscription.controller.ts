import { Request, Response } from 'express';
import { messSubscriptionService } from '../services/messSubscription.service';

export const messSubscriptionController = {
    // GET /api/mess/subscriptions
    async listMessSubscriptions(req: Request, res: Response) {
        try {
            const { isActive } = req.query;
            const activeFilter = isActive === 'true' ? true : isActive === 'false' ? false : undefined;

            const subscriptions = await messSubscriptionService.listMessSubscriptions(activeFilter);
            res.json(subscriptions);
        } catch (error) {
            console.error('Error listing mess subscriptions:', error);
            res.status(500).json({ error: 'Failed to fetch mess subscriptions' });
        }
    },

    // GET /api/mess/subscriptions/:id
    async getMessSubscription(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const subscription = await messSubscriptionService.getMessSubscriptionById(id);

            if (!subscription) {
                return res.status(404).json({ error: 'Mess subscription not found' });
            }

            res.json(subscription);
        } catch (error) {
            console.error('Error fetching mess subscription:', error);
            res.status(500).json({ error: 'Failed to fetch mess subscription' });
        }
    },

    // POST /api/mess/subscriptions
    async createMessSubscription(req: Request, res: Response) {
        try {
            const { residentId, planName, monthlyFee, startDate, endDate } = req.body;

            // Validation
            if (!residentId || !planName || !monthlyFee || !startDate) {
                return res.status(400).json({
                    error: 'Missing required fields: residentId, planName, monthlyFee, startDate'
                });
            }

            if (monthlyFee <= 0) {
                return res.status(400).json({ error: 'Monthly fee must be greater than 0' });
            }

            const subscription = await messSubscriptionService.createMessSubscription({
                residentId,
                planName,
                monthlyFee: parseFloat(monthlyFee),
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : undefined,
            });

            res.status(201).json(subscription);
        } catch (error: any) {
            console.error('Error creating mess subscription:', error);

            // Handle foreign key constraint errors
            if (error.code === 'P2003') {
                return res.status(400).json({ error: 'Resident not found' });
            }

            res.status(500).json({ error: 'Failed to create mess subscription' });
        }
    },

    // PUT /api/mess/subscriptions/:id
    async updateMessSubscription(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { planName, monthlyFee, startDate, endDate, isActive } = req.body;

            // Validate monthlyFee if provided
            if (monthlyFee !== undefined && monthlyFee <= 0) {
                return res.status(400).json({ error: 'Monthly fee must be greater than 0' });
            }

            const updateData: any = {};
            if (planName !== undefined) updateData.planName = planName;
            if (monthlyFee !== undefined) updateData.monthlyFee = parseFloat(monthlyFee);
            if (startDate !== undefined) updateData.startDate = new Date(startDate);
            if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
            if (isActive !== undefined) updateData.isActive = isActive;

            const subscription = await messSubscriptionService.updateMessSubscription(id, updateData);
            res.json(subscription);
        } catch (error: any) {
            console.error('Error updating mess subscription:', error);

            if (error.code === 'P2025') {
                return res.status(404).json({ error: 'Mess subscription not found' });
            }

            res.status(500).json({ error: 'Failed to update mess subscription' });
        }
    },

    // PATCH /api/mess/subscriptions/:id/deactivate
    async deactivateMessSubscription(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const subscription = await messSubscriptionService.deactivateMessSubscription(id);
            res.json(subscription);
        } catch (error: any) {
            console.error('Error deactivating mess subscription:', error);

            if (error.code === 'P2025') {
                return res.status(404).json({ error: 'Mess subscription not found' });
            }

            res.status(500).json({ error: 'Failed to deactivate mess subscription' });
        }
    },
};
