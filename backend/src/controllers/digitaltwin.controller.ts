import { Request, Response } from 'express';
import prisma from '../lib/prisma';

/**
 * GET /api/twin/overview
 * Returns hostel layout grouped by block → floor → rooms
 */
export const getOverview = async (req: Request, res: Response) => {
    try {
        const rooms = await prisma.room.findMany({
            include: {
                _count: {
                    select: { residents: { where: { status: 'ACTIVE' } } }
                }
            },
            orderBy: [{ block: 'asc' }, { floor: 'asc' }, { roomNumber: 'asc' }]
        });

        const layout: Record<string, Record<string, Array<{
            id: string;
            roomNumber: string;
            capacity: number;
            currentOccupancy: number;
            status: string;
            type: string;
        }>>> = {};

        rooms.forEach(room => {
            const block = room.block || 'Main';
            const floor = room.floor || 'G';
            if (!layout[block]) layout[block] = {};
            if (!layout[block][floor]) layout[block][floor] = [];

            layout[block][floor].push({
                id: room.id,
                roomNumber: room.roomNumber,
                capacity: room.capacity,
                currentOccupancy: room._count.residents,
                status: room.status,
                type: room.type
            });
        });

        res.json(layout);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch twin overview.' });
    }
};

/**
 * GET /api/twin/heatmap/:type
 * Returns normalized heatmap values per room for occupancy | maintenance | cost
 */
export const getHeatmap = async (req: Request, res: Response) => {
    try {
        const { type } = req.params;
        const rooms = await prisma.room.findMany({
            select: { id: true, roomNumber: true, capacity: true, currentOccupancy: true }
        });

        type HeatPoint = { roomId: string; value: number; label: string };
        let heatmapData: HeatPoint[] = [];

        if (type === 'occupancy') {
            heatmapData = rooms.map(r => ({
                roomId: r.id,
                value: r.capacity > 0 ? r.currentOccupancy / r.capacity : 0,
                label: `${r.currentOccupancy}/${r.capacity} beds`
            }));
        }

        else if (type === 'maintenance') {
            // Maintenance is linked to residents who live in rooms
            // Aggregate: count open requests per room via resident
            const openRequests = await prisma.maintenanceRequest.findMany({
                where: { status: { in: ['OPEN', 'IN_PROGRESS'] }, residentId: { not: null } },
                include: { resident: { select: { roomId: true } } }
            });

            const countByRoom: Record<string, number> = {};
            openRequests.forEach(req => {
                const rId = req.resident?.roomId;
                if (rId) countByRoom[rId] = (countByRoom[rId] || 0) + 1;
            });

            const maxCount = Math.max(...Object.values(countByRoom), 1);
            heatmapData = rooms.map(r => {
                const count = countByRoom[r.id] || 0;
                return {
                    roomId: r.id,
                    value: count / maxCount,
                    label: count > 0 ? `${count} open issue${count !== 1 ? 's' : ''}` : 'No issues'
                };
            });
        }

        else if (type === 'cost') {
            // Unpaid fees linked to residents in each room
            const unpaidFees = await prisma.feeInvoice.findMany({
                where: { status: { in: ['PENDING', 'OVERDUE'] } },
                include: { resident: { select: { roomId: true } } }
            });

            const costByRoom: Record<string, number> = {};
            unpaidFees.forEach(fee => {
                const rId = fee.resident?.roomId;
                if (rId) costByRoom[rId] = (costByRoom[rId] || 0) + fee.amount;
            });

            const maxCost = Math.max(...Object.values(costByRoom), 1);
            heatmapData = rooms.map(r => {
                const cost = costByRoom[r.id] || 0;
                return {
                    roomId: r.id,
                    value: maxCost > 0 ? cost / maxCost : 0,
                    label: cost > 0 ? `₹${cost.toLocaleString('en-IN')} pending` : 'No dues'
                };
            });
        }

        res.json(heatmapData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch heatmap.' });
    }
};

/**
 * GET /api/twin/room/:id
 * Deep-dive operational profile for a single room
 */
export const getRoomProfile = async (req: Request, res: Response) => {
    try {
        const room = await prisma.room.findUnique({
            where: { id: req.params.id },
            include: {
                residents: {
                    where: { status: 'ACTIVE' },
                    include: {
                        feeInvoices: { where: { status: { in: ['PENDING', 'OVERDUE'] } } },
                        maintenanceReqs: { where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }
                    }
                },
                _count: { select: { residents: { where: { status: 'ACTIVE' } } } }
            }
        });

        if (!room) return res.status(404).json({ error: 'Room not found.' });

        const activeMaintenance = room.residents.flatMap(r => r.maintenanceReqs);
        const totalPendingFees = room.residents.reduce((sum, res) =>
            sum + res.feeInvoices.reduce((s, inv) => s + inv.amount, 0), 0
        );

        res.json({
            id: room.id,
            roomNumber: room.roomNumber,
            capacity: room.capacity,
            currentOccupancy: room._count.residents,
            status: room.status,
            type: room.type,
            block: room.block,
            floor: room.floor,
            residents: room.residents.map(r => ({
                id: r.id,
                fullName: r.fullName,
                phone: r.phone,
                pendingFees: r.feeInvoices.reduce((s, inv) => s + inv.amount, 0)
            })),
            activeMaintenance,
            totalPendingFees
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch room profile.' });
    }
};
