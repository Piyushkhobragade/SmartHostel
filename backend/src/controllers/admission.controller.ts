import { Request, Response } from 'express';
import { admissionService } from '../services/admission.service';

export const createDraft = async (req: Request, res: Response) => {
    try {
        const draft = await admissionService.createDraft(req.body);
        res.status(201).json(draft);
    } catch (error: any) {
        console.error("CREATE DRAFT ERROR:", error);
        res.status(500).json({ error: error.message || 'Failed to create draft' });
    }
};

export const updateDraft = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const { step, data } = req.body;
        const updated = await admissionService.updateDraft(id, step, data);
        res.json(updated);
    } catch (error: any) {
        console.error("UPDATE DRAFT ERROR:", error);
        if (error.message.includes('not found') || error.message.includes('already completed')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: error.message || 'Failed to update draft' });
    }
};

export const getDrafts = async (req: Request, res: Response) => {
    try {
        const drafts = await admissionService.getDrafts();
        res.json(drafts);
    } catch (error: any) {
        console.error("GET DRAFTS ERROR:", error);
        res.status(500).json({ error: error.message || 'Failed to fetch drafts' });
    }
};

export const completeAdmission = async (req: Request, res: Response) => {
    try {
        const { draftId } = req.body;
        const actorId = (req as any).user?.id; // from auth middleware
        const result = await admissionService.completeAdmission(draftId, actorId);
        res.json(result);
    } catch (error: any) {
        console.error("COMPLETE ADMISSION ERROR:", error);

        // Unique constraint — email or phone already registered
        if (
            error.code === 'P2002' ||
            (error.message && error.message.toLowerCase().includes('unique constraint'))
        ) {
            const field = error.meta?.target?.[0] || 'email or phone';
            return res.status(409).json({
                error: `A resident with this ${field} is already registered. Please use different contact details.`
            });
        }

        if (error.message && error.message.includes('full capacity')) {
            return res.status(409).json({ error: error.message });
        }
        if (error.message && error.message.includes('already registered')) {
            return res.status(409).json({ error: error.message });
        }
        res.status(500).json({ error: error.message || 'Failed to complete admission' });
    }
};


export const processBulkAdmission = async (req: Request, res: Response) => {
    try {
        const rows = req.body.rows;
        const actorId = (req as any).user?.id;
        const results = await admissionService.processBulkAdmission(rows, actorId);
        res.json(results);
    } catch (error: any) {
        console.error("BULK ADMISSION ERROR:", error);
        res.status(500).json({ error: error.message || 'Failed to process bulk admission' });
    }
};

export const uploadDocument = async (req: Request, res: Response) => {
    try {
        // Mock document upload for this phase (presigned URL / local storage logic)
        // In reality, multer middleware handles the file
        const file = (req as any).file;
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        // Mock S3 Key generation
        const s3Key = `admissions/documents/${Date.now()}_${file.originalname}`;
        const fileUrl = `https://mock-s3-bucket.s3.amazonaws.com/${s3Key}`;

        res.json({ s3Key, fileUrl, originalName: file.originalname });
    } catch (error: any) {
        console.error("UPLOAD DOCUMENT ERROR:", error);
        res.status(500).json({ error: error.message || 'Failed to upload document' });
    }
};
