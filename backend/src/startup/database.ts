import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export async function initializeDatabase(): Promise<void> {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🚀 SmartHostel Database Startup");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    try {
        await prisma.$connect();

        await prisma.$queryRaw`SELECT 1`;

        console.log("✅ PostgreSQL connection established.");
    } catch (error) {
        console.error("❌ Failed to connect to PostgreSQL");
        console.error(error);
        process.exit(1);
    }
}
