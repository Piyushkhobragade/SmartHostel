import prisma from "../../lib/prisma";
import { Prisma, Room } from "@prisma/client";

export class RoomRepository {
    async findById(id: string) {
        return prisma.room.findUnique({
            where: { id },
        });
    }

    async incrementOccupancy(
        tx: Prisma.TransactionClient,
        roomId: string
    ): Promise<Room> {
        return tx.room.update({
            where: { id: roomId },
            data: {
                currentOccupancy: {
                    increment: 1,
                },
            },
        });
    }

    async decrementOccupancy(
        tx: Prisma.TransactionClient,
        roomId: string
    ): Promise<Room> {
        return tx.room.update({
            where: { id: roomId },
            data: {
                currentOccupancy: {
                    decrement: 1,
                },
            },
        });
    }
}

export const roomRepository = new RoomRepository();
