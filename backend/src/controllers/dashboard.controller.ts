import { Request, Response } from 'express';
import { getDashboardSummary, getOperationalIntelligence } from '../services/dashboard.service';

export const getDashboard = async (req: Request, res: Response) => {
  try {
    const summary = await getDashboardSummary();
    res.json(summary);
  } catch (error) {
    console.error('Failed to fetch dashboard summary:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
};

export const getIntelligence = async (req: Request, res: Response) => {
  try {
    const intelligence = await getOperationalIntelligence();
    res.json(intelligence);
  } catch (error) {
    console.error('Failed to fetch operational intelligence:', error);
    res.status(500).json({ error: 'Failed to fetch operational intelligence' });
  }
};
