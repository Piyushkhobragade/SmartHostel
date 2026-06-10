import prisma from '../lib/prisma';

export const feeService = {
    async getInvoices(filters: { status?: string; residentId?: string }) {
        const where: any = {};
        if (filters.status) where.status = filters.status;
        if (filters.residentId) where.residentId = filters.residentId;

        return await prisma.feeInvoice.findMany({
            where,
            include: {
                resident: { select: { id: true, fullName: true } },
                payments: true
            },
            orderBy: { dueDate: 'asc' }
        });
    },

    async createInvoice(data: { residentId: string; amount: number; dueDate: string | Date; description: string }) {
        return await prisma.feeInvoice.create({
            data: {
                residentId: data.residentId,
                amount: data.amount,
                dueDate: new Date(data.dueDate),
                description: data.description,
                status: 'PENDING'
            },
            include: {
                resident: { select: { id: true, fullName: true } },
                payments: true
            }
        });
    },

    async createPayment(data: { invoiceId: string; amount: number; method: string; reference?: string }) {
        const invoice = await prisma.feeInvoice.findUnique({
            where: { id: data.invoiceId },
            include: { payments: true }
        });

        if (!invoice) {
            throw new Error('Invoice not found');
        }

        const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
        const remaining = invoice.amount - totalPaid;

        if (data.amount > remaining) {
            throw new Error(`Payment amount exceeds remaining balance. Remaining: ${remaining}`);
        }

        return await prisma.$transaction(async (tx) => {
            const payment = await tx.payment.create({
                data: {
                    invoiceId: data.invoiceId,
                    residentId: invoice.residentId,
                    amount: data.amount,
                    method: data.method,
                    reference: data.reference || null
                }
            });

            const newTotalPaid = totalPaid + data.amount;
            let newStatus = 'PENDING';
            if (newTotalPaid >= invoice.amount) {
                newStatus = 'PAID';
            } else if (newTotalPaid > 0) {
                newStatus = 'PARTIAL';
            }

            const updatedInvoice = await tx.feeInvoice.update({
                where: { id: data.invoiceId },
                data: { status: newStatus },
                include: {
                    resident: { select: { id: true, fullName: true } },
                    payments: true
                }
            });

            return { payment, invoice: updatedInvoice };
        });
    }
};
