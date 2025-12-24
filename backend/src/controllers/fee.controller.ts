import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getInvoices = async (req: Request, res: Response) => {
    try {
        const { status, residentId } = req.query;
        const where: any = {};

        if (status) {
            where.status = status as string;
        }

        if (residentId) {
            where.residentId = residentId as string;
        }

        const invoices = await prisma.feeInvoice.findMany({
            where,
            include: {
                resident: {
                    select: {
                        id: true,
                        fullName: true
                    }
                },
                payments: true
            },
            orderBy: {
                dueDate: 'asc'
            }
        });

        res.json(invoices);
    } catch (error) {
        console.error('Failed to fetch invoices:', error);
        res.status(500).json({ error: 'Failed to fetch invoices' });
    }
};

export const createInvoice = async (req: Request, res: Response) => {
    try {
        const { residentId, amount, dueDate, description } = req.body;

        const invoice = await prisma.feeInvoice.create({
            data: {
                residentId,
                amount,
                dueDate: new Date(dueDate),
                description,
                status: 'PENDING'
            },
            include: {
                resident: {
                    select: {
                        id: true,
                        fullName: true
                    }
                },
                payments: true
            }
        });

        res.json(invoice);
    } catch (error) {
        console.error('Failed to create invoice:', error);
        res.status(500).json({ error: 'Failed to create invoice' });
    }
};

export const createPayment = async (req: Request, res: Response) => {
    try {
        const { invoiceId, amount, method, reference } = req.body;

        // Get the invoice
        const invoice = await prisma.feeInvoice.findUnique({
            where: { id: invoiceId },
            include: { payments: true }
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        // Validate payment amount
        const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
        const remaining = invoice.amount - totalPaid;

        if (amount > remaining) {
            return res.status(400).json({
                error: `Payment amount exceeds remaining balance. Remaining: ${remaining}`
            });
        }

        // Create payment and update invoice status in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create payment
            const payment = await tx.payment.create({
                data: {
                    invoiceId,
                    residentId: invoice.residentId,
                    amount,
                    method,
                    reference: reference || null
                }
            });

            // Calculate new total paid
            const newTotalPaid = totalPaid + amount;

            // Determine new status
            let newStatus = 'PENDING';
            if (newTotalPaid >= invoice.amount) {
                newStatus = 'PAID';
            } else if (newTotalPaid > 0) {
                newStatus = 'PARTIAL';
            }

            // Update invoice status
            const updatedInvoice = await tx.feeInvoice.update({
                where: { id: invoiceId },
                data: { status: newStatus },
                include: {
                    resident: {
                        select: {
                            id: true,
                            fullName: true
                        }
                    },
                    payments: true
                }
            });

            return { payment, invoice: updatedInvoice };
        });

        res.json(result);
    } catch (error) {
        console.error('Failed to create payment:', error);
        res.status(500).json({ error: 'Failed to create payment' });
    }
};
