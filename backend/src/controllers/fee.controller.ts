import { Request, Response } from 'express';
import { feeService } from '../services/fee.service';

export const getInvoices = async (req: Request, res: Response) => {
    try {
        const { status, residentId } = req.query;
        const invoices = await feeService.getInvoices({
            status: status as string,
            residentId: residentId as string
        });
        res.json(invoices);
    } catch (error) {
        console.error('Failed to fetch invoices:', error);
        res.status(500).json({ error: 'Failed to fetch invoices' });
    }
};

export const createInvoice = async (req: Request, res: Response) => {
    try {
        const invoice = await feeService.createInvoice(req.body);
        res.json(invoice);
    } catch (error) {
        console.error('Failed to create invoice:', error);
        res.status(500).json({ error: 'Failed to create invoice' });
    }
};

export const createPayment = async (req: Request, res: Response) => {
    try {
        const result = await feeService.createPayment(req.body);
        res.json(result);
    } catch (error: any) {
        console.error('Failed to create payment:', error);
        if (error.message === 'Invoice not found') {
            return res.status(404).json({ error: error.message });
        }
        if (error.message.includes('exceeds remaining balance')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to create payment' });
    }
};
