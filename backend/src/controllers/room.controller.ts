import { Request, Response } from 'express';
import { roomService } from '../services/room.service';

export const getRooms = async (req: Request, res: Response) => {
    try {
        const rooms = await roomService.getRooms();
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch rooms' });
    }
};

export const createRoom = async (req: Request, res: Response) => {
    try {
        const room = await roomService.createRoom(req.body);
        res.json(room);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create room' });
    }
};

export const updateRoom = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const room = await roomService.updateRoom(id, req.body);
        res.json(room);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update room' });
    }
};

export const deleteRoom = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        await roomService.deleteRoom(id);
        res.json({ message: 'Room deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete room' });
    }
};
