import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getOccupancyData = async (req: Request, res: Response) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const occupancyData = await prisma.occupancyHistory.findMany({
            where: {
                date: {
                    gte: thirtyDaysAgo
                }
            },
            orderBy: {
                date: 'asc'
            },
            select: {
                date: true,
                totalBeds: true,
                occupiedBeds: true
            }
        });

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

        const historicalData = await prisma.occupancyHistory.findMany({
            orderBy: {
                date: 'asc'
            },
            take: 30
        });

        if (historicalData.length === 0) {
            return res.status(404).json({
                error: 'No occupancy data available'
            });
        }

        const occupancyRates = historicalData.map((d: any) => {
            return (d.occupiedBeds / d.totalBeds) * 100;
        });

        const n = occupancyRates.length;

        const movingAverage =
            occupancyRates.reduce((sum: number, value: number) => sum + value, 0) / n;

        const xMean = (n - 1) / 2;

        const yMean = movingAverage;

        let numerator = 0;
        let denominator = 0;

        occupancyRates.forEach((rate: number, index: number) => {
            numerator += (index - xMean) * (rate - yMean);
            denominator += Math.pow(index - xMean, 2);
        });

        const slope = denominator === 0 ? 0 : numerator / denominator;

        const forecast: any[] = [];

        for (let i = 1; i <= 30; i++) {

            const forecastDate = new Date();
            forecastDate.setDate(forecastDate.getDate() + i);

            const trendPrediction = yMean + slope * (n + i);

            const predictedRate =
                (0.6 * trendPrediction) + (0.4 * movingAverage);

            const boundedPrediction =
                Math.max(0, Math.min(100, predictedRate));

            forecast.push({
                date: forecastDate.toISOString().split('T')[0],
                predictedOccupancyRate:
                    Math.round(boundedPrediction * 10) / 10,
                method: 'Linear Regression + Moving Average'
            });
        }

        res.json({
            forecast,
            metadata: {
                historicalDays: n,
                movingAverage:
                    Math.round(movingAverage * 10) / 10,
                trend:
                    slope > 0
                        ? 'increasing'
                        : slope < 0
                            ? 'decreasing'
                            : 'stable',
                trendSlope:
                    Math.round(slope * 100) / 100,
                note:
                    'Statistical forecast for educational purposes.'
            }
        });

    } catch (error) {

        console.error('Failed to generate forecast:', error);

        res.status(500).json({
            error: 'Failed to generate forecast'
        });
    }
};
