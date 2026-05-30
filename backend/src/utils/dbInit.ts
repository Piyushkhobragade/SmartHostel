import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

const prisma = new PrismaClient();

export async function initializeDatabase() {
    console.log('🔄 [DB-Init] Checking database and environment configuration...');

    const backendDir = path.resolve(__dirname, '../..');
    const envPath = path.join(backendDir, '.env');
    const envExamplePath = path.join(backendDir, '.env.example');

    // 1. Ensure .env file exists
    if (!fs.existsSync(envPath)) {
        console.log('⚠️ [DB-Init] .env file not found. Creating default local configuration...');
        
        let defaultEnvContent = '';
        if (fs.existsSync(envExamplePath)) {
            // Read from example, but replace the default Docker SQLite URL with a local one
            const exampleContent = fs.readFileSync(envExamplePath, 'utf8');
            defaultEnvContent = exampleContent.replace(
                'DATABASE_URL="file:/app/data/production.db"',
                'DATABASE_URL="file:./prisma/dev.db"'
            );
            // Ensure JWT_SECRET has a fallback if empty or empty string
            if (!defaultEnvContent.includes('JWT_SECRET=') || defaultEnvContent.includes('JWT_SECRET=""')) {
                defaultEnvContent = defaultEnvContent.replace(
                    /JWT_SECRET=.*/,
                    'JWT_SECRET="smarthostel-default-development-jwt-secret-key-12345"'
                );
            }
        } else {
            // Hardcoded fallback
            defaultEnvContent = [
                '# Runtime environment for SmartHostel backend.',
                'DATABASE_URL="file:./prisma/dev.db"',
                'JWT_SECRET="smarthostel-default-development-jwt-secret-key-12345"',
                'NODE_ENV=development',
                'PORT=3000'
            ].join('\n');
        }

        fs.writeFileSync(envPath, defaultEnvContent, 'utf8');
        console.log('✅ [DB-Init] .env file created successfully with local development defaults.');
    }

    // Load environment variables if they haven't been loaded already
    // This ensures process.env.DATABASE_URL is populated
    dotenv.config({ path: envPath });

    if (!process.env.DATABASE_URL) {
        process.env.DATABASE_URL = 'file:./prisma/dev.db';
    }

    // 2. Run migrations
    try {
        console.log('⚙️ [DB-Init] Verifying database tables and applying migrations...');
        // We use npx prisma migrate deploy to apply pending migrations safely without interactive prompts
        execSync('npx prisma migrate deploy', {
            cwd: backendDir,
            stdio: 'inherit',
            env: { ...process.env }
        });
        console.log('✅ [DB-Init] Database migrations applied successfully.');
    } catch (error) {
        console.error('❌ [DB-Init] Error applying database migrations:', error);
        console.log('⚠️ [DB-Init] Attempting to continue startup...');
    }

    // 3. Ensure Admin user exists
    try {
        console.log('👤 [DB-Init] Verifying default Admin user accounts...');
        
        // Let's connect the Prisma client to ensure it's loaded with the correct URL
        const existingAdmin = await prisma.user.findUnique({
            where: { username: 'admin' }
        });

        if (existingAdmin) {
            console.log('✅ [DB-Init] Default admin user already exists.');
        } else {
            console.log('➕ [DB-Init] Default admin user not found. Seeding admin user...');
            const passwordHash = await bcrypt.hash('Admin@123', 10);
            
            await prisma.user.create({
                data: {
                    username: 'admin',
                    passwordHash: passwordHash,
                    role: 'ADMIN'
                }
            });
            console.log('✅ [DB-Init] Default admin user seeded successfully!');
            console.log('   Username: admin');
            console.log('   Password: Admin@123');
        }
    } catch (error) {
        console.error('❌ [DB-Init] Error seeding admin user:', error);
    } finally {
        await prisma.$disconnect();
    }
}
