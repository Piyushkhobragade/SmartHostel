import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
        res.status(500).json({ error: 'Failed to fetch occupancy data' });
    }
};

export const getFeesData = async (req: Request, res: Response) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Get all invoices from last 30 days
        const invoices = await prisma.feeInvoice.findMany({
            where: {
                issuedAt: {
                    gte: thirtyDaysAgo
                }
            },
            include: {
                payments: true
            }
        });

        // Group by date
        const feesMap = new Map<string, { totalInvoiced: number; totalPaid: number }>();

        invoices.forEach(invoice => {
            const dateKey = invoice.issuedAt.toISOString().split('T')[0];

            if (!feesMap.has(dateKey)) {
                feesMap.set(dateKey, { totalInvoiced: 0, totalPaid: 0 });
            }

            const dayData = feesMap.get(dateKey)!;
            dayData.totalInvoiced += invoice.amount;

            // Add payments for this invoice
            invoice.payments.forEach(payment => {
                const paymentDateKey = payment.paidAt.toISOString().split('T')[0];

                if (!feesMap.has(paymentDateKey)) {
                    feesMap.set(paymentDateKey, { totalInvoiced: 0, totalPaid: 0 });
                }

                feesMap.get(paymentDateKey)!.totalPaid += payment.amount;
            });
        });

        // Convert to array and sort by date
        const feesData = Array.from(feesMap.entries())
            .map(([date, data]) => ({
                date,
                totalInvoiced: data.totalInvoiced,
                totalPaid: data.totalPaid
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

        res.json(feesData);
    } catch (error) {
        console.error('Failed to fetch fees data:', error);
        res.status(500).json({ error: 'Failed to fetch fees data' });
    }
};

/**
 * Statistical Occupancy Forecasting
 * Uses simple linear regression and moving average to predict next 7 days
 * Educational implementation - suitable for student projects
 */
export const getForecast = async (req: Request, res: Response) => {
    try {
        // Get historical occupancy data (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const historicalData = await prisma.occupancyHistory.findMany({
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

        if (historicalData.length < 7) {
            return res.status(400).json({
                error: 'Insufficient historical data for forecasting. Need at least 7 days.'
            });
        }

        // Calculate occupancy rates for historical data
        const occupancyRates = historicalData.map(d => (d.occupiedBeds / d.totalBeds) * 100);

        // Simple Linear Regression
        // Formula: y = mx + b
        // where x is day index, y is occupancy rate
        const n = occupancyRates.length;
        const xValues = Array.from({ length: n }, (_, i) => i); // [0, 1, 2, ..., n-1]

        // Calculate means
        const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
        const yMean = occupancyRates.reduce((sum, y) => sum + y, 0) / n;

        // Calculate slope (m) and intercept (b)
        let numerator = 0;
        let denominator = 0;

        for (let i = 0; i < n; i++) {
            numerator += (xValues[i] - xMean) * (occupancyRates[i] - yMean);
            denominator += Math.pow(xValues[i] - xMean, 2);
        }

        const slope = denominator !== 0 ? numerator / denominator : 0;
        const intercept = yMean - slope * xMean;

        // Calculate 7-day moving average for smoothing
        const last7Days = occupancyRates.slice(-7);
        const movingAverage = last7Days.reduce((sum, rate) => sum + rate, 0) / last7Days.length;

        // Generate forecast for next 7 days
        const forecast = [];
        const lastDate = new Date(historicalData[historicalData.length - 1].date);
        const avgTotalBeds = historicalData[historicalData.length - 1].totalBeds;

        for (let i = 1; i <= 7; i++) {
            const forecastDate = new Date(lastDate);
            forecastDate.setDate(forecastDate.getDate() + i);

            // Predict using linear trend
            const trendPrediction = slope * (n + i - 1) + intercept;

            // Combine trend with moving average (weighted average)
            // 60% trend + 40% moving average for stability
            const predictedRate = (0.6 * trendPrediction) + (0.4 * movingAverage);

            // Ensure prediction is within realistic bounds (0-100%)
            const boundedPrediction = Math.max(0, Math.min(100, predictedRate));

            forecast.push({
                date: forecastDate.toISOString().split('T')[0],
                predictedOccupancyRate: Math.round(boundedPrediction * 10) / 10, // Round to 1 decimal
                method: 'Linear Regression + Moving Average'
            });
        }

        res.json({
            forecast,
            metadata: {
                historicalDays: n,
                movingAverage: Math.round(movingAverage * 10) / 10,
                trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
                trendSlope: Math.round(slope * 100) / 100,
                note: 'Statistical forecast for educational purposes. Not financial advice.'
            }
        });
    } catch (error) {
        console.error('Failed to generate forecast:', error);
        res.status(500).json({ error: 'Failed to generate forecast' });
    }
};
