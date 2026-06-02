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
        try {
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
                defaultEnvContent = [
                    '# Runtime environment for SmartHostel X backend.',
                    'DATABASE_URL="postgresql://smarthostel:smarthostel_secret@localhost:5432/smarthosteldb"',
                    'JWT_SECRET="smarthostel-default-development-jwt-secret-key-12345"',
                    'NODE_ENV=development',
                    'PORT=3000',
                    'OLLAMA_BASE_URL="http://localhost:11434"'
                ].join('\n');
            }

            fs.writeFileSync(envPath, defaultEnvContent, 'utf8');
            console.log('✅ [DB-Init] .env file created successfully with local development defaults.');
        } catch (error) {
            console.warn('⚠️ [DB-Init] Warning: Could not create local .env file (might be a read-only filesystem or container environment):', error);
        }
    }

    // Load environment variables
    dotenv.config({ path: envPath });

    if (!process.env.DATABASE_URL) {
        process.env.DATABASE_URL = 'postgresql://smarthostel:smarthostel_secret@localhost:5432/smarthosteldb';
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
    }

    // 4. Ensure demo Student user exists
    try {
        const existingStudent = await prisma.user.findUnique({
            where: { username: 'student' }
        });

        if (!existingStudent) {
            console.log('➕ [DB-Init] Seeding demo student account...');

            // Create a demo resident if none exist
            let demoResident = await prisma.resident.findFirst({
                where: { email: 'demo.student@smarthostel.com' }
            });

            if (!demoResident) {
                // Find or create a room
                let demoRoom = await prisma.room.findFirst();
                if (!demoRoom) {
                    demoRoom = await prisma.room.create({
                        data: {
                            roomNumber: '101',
                            capacity: 2,
                            type: 'AC',
                            status: 'OCCUPIED',
                            floor: '1',
                            block: 'A',
                            currentOccupancy: 1,
                        }
                    });
                }

                demoResident = await prisma.resident.create({
                    data: {
                        fullName: 'Demo Student',
                        email: 'demo.student@smarthostel.com',
                        phone: '9876543210',
                        status: 'ACTIVE',
                        roomId: demoRoom.id,
                    }
                });

                // Seed 7 days of attendance
                const attendanceData: { residentId: string; date: Date; status: string; method: string }[] = [];
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    d.setHours(0, 0, 0, 0);
                    attendanceData.push({
                        residentId: demoResident.id,
                        date: d,
                        status: i === 2 ? 'ABSENT' : 'PRESENT',
                        method: 'MANUAL',
                    });
                }
                await prisma.attendanceLog.createMany({ data: attendanceData });

                // Seed a pending fee invoice
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + 7);
                await prisma.feeInvoice.create({
                    data: {
                        residentId: demoResident.id,
                        amount: 8500,
                        dueDate,
                        description: 'Monthly Hostel Fee - June 2026',
                        status: 'PENDING',
                    }
                });
            }

            const studentPasswordHash = await bcrypt.hash('Student@123', 10);
            await prisma.user.create({
                data: {
                    username: 'student',
                    passwordHash: studentPasswordHash,
                    role: 'STUDENT',
                    residentId: demoResident.id,
                }
            });
            console.log('✅ [DB-Init] Demo student account seeded!');
            console.log('   Username: student');
            console.log('   Password: Student@123');
        }
    } catch (error) {
        console.error('❌ [DB-Init] Error seeding student:', error);
    } finally {
        await prisma.$disconnect();
    }
}
