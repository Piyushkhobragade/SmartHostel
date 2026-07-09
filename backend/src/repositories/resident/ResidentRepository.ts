import prisma from "../../lib/prisma";
import {
    Prisma,
    Resident,
    ResidentStatus,
} from "@prisma/client";

export class ResidentRepository {
    async findMany(
        where: Prisma.ResidentWhereInput,
        skip: number,
        take: number
    ) {
        return prisma.resident.findMany({
            where,
            skip,
            take,
            orderBy: {
                createdAt: "desc",
            },
            include: {
                room: {
                    select: {
                        id: true,
                        roomNumber: true,
                    },
                },
            },
        });
    }

    async count(where: Prisma.ResidentWhereInput) {
        return prisma.resident.count({ where });
    }

    async findById(id: string) {
        return prisma.resident.findUnique({
            where: { id },
        });
    }

    async create(
        tx: Prisma.TransactionClient,
        data: Prisma.ResidentCreateInput
    ): Promise<Resident> {
        return tx.resident.create({
            data,
        });
    }

    async update(
        tx: Prisma.TransactionClient,
        id: string,
        data: Prisma.ResidentUpdateInput
    ): Promise<Resident> {
        return tx.resident.update({
            where: { id },
            data,
        });
    }

    async delete(
        tx: Prisma.TransactionClient,
        id: string
    ): Promise<Resident> {
        return tx.resident.delete({
            where: { id },
        });
    }
}

export const residentRepository = new ResidentRepository();
