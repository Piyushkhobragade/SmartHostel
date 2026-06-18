import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminUser() {
    try {
        console.log('👤 Creating admin user...');

        // Check if admin already exists
        const existing = await prisma.user.findUnique({
            where: { username: 'admin' }
        });

        if (existing) {
            console.log('✅ Admin user already exists');
            return;
        }

        // Hash the password
        // ⚠️ IMPORTANT: This is a demo password. MUST be changed in production!
        const passwordHash = await bcrypt.hash('Admin@123', 10);

        // Create admin user
        await prisma.user.create({
            data: {
                username: 'admin',
                passwordHash: passwordHash,
                role: 'ADMIN'
            }
        });

        console.log('✅ Admin user created successfully!');
        console.log('   Username: admin');
        console.log('   Password: Admin@123');
        console.log('');
        console.log('⚠️  WARNING: Change this password in production!');

    } catch (error) {
        console.error('❌ Error creating admin user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdminUser();
