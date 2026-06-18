import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting analytics seed...');

    // Generate occupancy history for last 30 days
    console.log('📊 Creating occupancy history...');
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        // Simulate varying occupancy (60-95%)
        const totalBeds = 32; // 8 rooms * 4 beds average
        const occupancyRate = 0.6 + (Math.random() * 0.35); // 60-95%
        const occupiedBeds = Math.floor(totalBeds * occupancyRate);

        await prisma.occupancyHistory.create({
            data: {
                date,
                totalBeds,
                occupiedBeds
            }
        });
    }

    console.log('✅ Created 30 days of occupancy history');

    // Generate fee invoices and payments for last 30 days
    console.log('💰 Creating fee invoices and payments...');

    // Get all residents
    const residents = await prisma.resident.findMany();

    if (residents.length === 0) {
        console.log('⚠️  No residents found. Run main seed script first.');
        return;
    }

    let invoiceCount = 0;
    let paymentCount = 0;

    // Create invoices spread over last 30 days
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(9, 0, 0, 0);

        // Create 1-3 invoices per day
        const invoicesPerDay = Math.floor(Math.random() * 3) + 1;

        for (let j = 0; j < invoicesPerDay && j < residents.length; j++) {
            const resident = residents[Math.floor(Math.random() * residents.length)];
            const amount = [3000, 5000, 7000, 10000][Math.floor(Math.random() * 4)];

            const dueDate = new Date(date);
            dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days

            const invoice = await prisma.feeInvoice.create({
                data: {
                    residentId: resident.id,
                    amount,
                    dueDate,
                    description: `Monthly Rent - ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
                    status: 'PENDING',
                    issuedAt: date
                }
            });

            invoiceCount++;

            // 70% chance of payment
            if (Math.random() > 0.3) {
                const paymentDate = new Date(date);
                paymentDate.setDate(paymentDate.getDate() + Math.floor(Math.random() * 5) + 1);
                paymentDate.setHours(14, 0, 0, 0);

                // 60% full payment, 40% partial
                const paymentAmount = Math.random() > 0.4 ? amount : amount * 0.5;

                await prisma.payment.create({
                    data: {
                        invoiceId: invoice.id,
                        residentId: resident.id,
                        amount: paymentAmount,
                        method: ['CASH', 'ONLINE', 'UPI', 'CARD'][Math.floor(Math.random() * 4)],
                        paidAt: paymentDate,
                        reference: Math.random() > 0.5 ? `TXN${Math.floor(Math.random() * 1000000)}` : null
                    }
                });

                // Update invoice status
                const totalPaid = paymentAmount;
                const newStatus = totalPaid >= amount ? 'PAID' : 'PARTIAL';

                await prisma.feeInvoice.update({
                    where: { id: invoice.id },
                    data: { status: newStatus }
                });

                paymentCount++;
            }
        }
    }

    console.log(`✅ Created ${invoiceCount} invoices`);
    console.log(`✅ Created ${paymentCount} payments`);
    console.log('✨ Analytics seed completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error during analytics seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
