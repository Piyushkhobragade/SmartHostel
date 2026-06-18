import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { answerQuestion, seedKnowledgeDocuments } from '../services/ai/knowledge.service';
import { isHealthy } from '../services/ai/gemini';
import { AuthRequest } from '../middleware/auth.middleware';
import { PromptInjectionError, InputTooLongError } from '../utils/promptSecurity';
import { logger } from '../lib/logger';
import { sanitizeMarkdown } from '../utils/sanitizer';

/**
 * GET /api/knowledge
 * List all knowledge documents (ADMIN only).
 */
export const getDocuments = async (req: Request, res: Response) => {
    try {
        const { category, isActive } = req.query;
        const where: any = {};
        if (category) where.category = category as string;
        if (isActive !== undefined) where.isActive = isActive === 'true';

        const docs = await prisma.knowledgeDocument.findMany({
            where,
            orderBy: [{ category: 'asc' }, { title: 'asc' }],
        });
        res.json(docs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch knowledge documents.' });
    }
};

/**
 * POST /api/knowledge
 * Create a knowledge document (ADMIN only).
 */
export const createDocument = async (req: Request, res: Response) => {
    try {
        const { title, content, category, tags } = req.body;
        if (!title || !content || !category) {
            return res.status(400).json({ error: 'title, content, and category are required.' });
        }

        const doc = await prisma.knowledgeDocument.create({
            data: { title, content, category, tags: tags || null, isActive: true }
        });
        res.status(201).json(doc);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create knowledge document.' });
    }
};

/**
 * PUT /api/knowledge/:id
 * Update a knowledge document (ADMIN only).
 */
export const updateDocument = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, content, category, tags, isActive } = req.body;

        const doc = await prisma.knowledgeDocument.update({
            where: { id },
            data: {
                ...(title !== undefined && { title }),
                ...(content !== undefined && { content }),
                ...(category !== undefined && { category }),
                ...(tags !== undefined && { tags }),
                ...(isActive !== undefined && { isActive }),
            }
        });
        res.json(doc);
    } catch (error: any) {
        if (error.code === 'P2025') return res.status(404).json({ error: 'Document not found.' });
        res.status(500).json({ error: 'Failed to update knowledge document.' });
    }
};

/**
 * DELETE /api/knowledge/:id
 * Delete a knowledge document (ADMIN only).
 */
export const deleteDocument = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.knowledgeDocument.delete({ where: { id } });
        res.json({ message: 'Document deleted.' });
    } catch (error: any) {
        if (error.code === 'P2025') return res.status(404).json({ error: 'Document not found.' });
        res.status(500).json({ error: 'Failed to delete document.' });
    }
};

/**
 * POST /api/knowledge/ask
 * Ask a question — all authenticated roles.
 * Returns AI answer grounded in knowledge base documents.
 */
export const askQuestion = async (req: AuthRequest, res: Response) => {
    try {
        const { question } = req.body;
        if (!question || typeof question !== 'string' || question.trim().length < 3) {
            return res.status(400).json({ error: 'A question of at least 3 characters is required.' });
        }

        const result = await answerQuestion(question.trim());
        if (result.answer) result.answer = sanitizeMarkdown(result.answer);
        res.json(result);
    } catch (error: any) {
        // 400: Client input violations — do not log as server errors
        if (error instanceof PromptInjectionError) {
            return res.status(400).json({ error: 'Input blocked: prompt injection detected.' });
        }
        if (error instanceof InputTooLongError) {
            return res.status(400).json({ error: error.message });
        }
        // 503: AI service unavailable
        if (error.message?.includes('timed out') || error.message?.includes('Ollama') || error.message?.includes('503')) {
            logger.warn({ err: error.message }, 'Knowledge ask: AI service unavailable');
            return res.status(503).json({
                error: 'AI service is temporarily unavailable. Please try again in a moment.',
                details: error.message,
            });
        }
        logger.error({ err: error.message }, 'Knowledge ask error');
        res.status(500).json({ error: 'Failed to process question.' });
    }
};

/**
 * GET /api/knowledge/health
 * Check Ollama + model health status.
 */
export const checkHealth = async (_req: Request, res: Response) => {
    const health = await isHealthy();
    res.status(health.ok ? 200 : 503).json(health);
};

/**
 * POST /api/knowledge/seed
 * Seed initial knowledge documents (ADMIN only, idempotent).
 */
export const seedDocuments = async (_req: Request, res: Response) => {
    try {
        await seedKnowledgeDocuments();
        const count = await prisma.knowledgeDocument.count();
        res.json({ message: `Knowledge base ready. Total documents: ${count}` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to seed knowledge documents.' });
    }
};
