import { z } from 'zod';

export const createDraftSchema = z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(10),
    dateOfBirth: z.string().optional(),
    bloodGroup: z.string().optional(),
});

export const updateDraftSchema = z.object({
    step: z.number().int().min(1).max(6),
    data: z.record(z.string(), z.any())
});

export const completeAdmissionSchema = z.object({
    draftId: z.string().uuid()
});

export const bulkAdmissionRowSchema = z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(10),
    dateOfBirth: z.string().optional(),
    bloodGroup: z.string().optional(),
    parentName: z.string().optional(),
    parentPhone: z.string().optional(),
    parentAddress: z.string().optional(),
    roomId: z.string().uuid(),
    feeAmount: z.number().positive(),
    feeDescription: z.string()
});
