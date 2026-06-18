import { PrismaClient } from '@prisma/client';

// Singleton Prisma client — import from here instead of new PrismaClient() per file
const prisma = new PrismaClient();

export default prisma;
