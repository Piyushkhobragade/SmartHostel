import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';
import { wardenChat, generateMorningBriefing } from '../services/ai/copilot.service';
import { PromptInjectionError, InputTooLongError } from '../utils/promptSecurity';
import { logger } from '../lib/logger';

/**
 * POST /api/copilot/chat
 * Send a message to the AI Warden Copilot.
 * Requires ADMIN or STAFF role.
 */
export const chat = async (req: AuthRequest, res: Response) => {
    try {
        const { message, conversationId } = req.body;
        const userId = req.user!.id;

        if (!message || typeof message !== 'string' || message.trim().length < 2) {
            return res.status(400).json({ error: 'A message is required.' });
        }

        const result = await wardenChat(userId, message.trim(), conversationId);
        res.json(result);
    } catch (error: any) {
        if (error instanceof PromptInjectionError) {
            return res.status(400).json({ error: 'Input blocked: prompt injection detected.' });
        }
        if (error instanceof InputTooLongError) {
            return res.status(400).json({ error: error.message });
        }
        if (error.message?.includes('timed out') || error.message?.includes('Ollama') || error.message?.includes('503')) {
            logger.warn({ err: error.message }, 'Copilot chat: AI service unavailable');
            return res.status(503).json({
                error: 'AI service is temporarily unavailable. Please try again in a moment.',
                details: error.message,
            });
        }
        logger.error({ err: error.message }, 'Copilot chat error');
        res.status(500).json({ error: 'Failed to process message.' });
    }
};

/**
 * GET /api/copilot/conversations
 * List all conversations for the current user.
 */
export const getConversations = async (req: AuthRequest, res: Response) => {
    try {
        const conversations = await prisma.copilotConversation.findMany({
            where: { userId: req.user!.id },
            include: {
                _count: { select: { messages: true } },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                }
            },
            orderBy: { updatedAt: 'desc' },
            take: 20,
        });

        res.json(conversations.map(c => ({
            id: c.id,
            title: c.title,
            messageCount: c._count.messages,
            lastMessage: c.messages[0]?.content?.slice(0, 80) || '',
            updatedAt: c.updatedAt,
        })));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch conversations.' });
    }
};

/**
 * GET /api/copilot/conversations/:id
 * Get a conversation with full message history.
 */
export const getConversation = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const conversation = await prisma.copilotConversation.findFirst({
            where: { id, userId: req.user!.id },
            include: {
                messages: { orderBy: { createdAt: 'asc' } }
            }
        });

        if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });
        res.json(conversation);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch conversation.' });
    }
};

/**
 * DELETE /api/copilot/conversations/:id
 * Delete a conversation.
 */
export const deleteConversation = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.copilotConversation.deleteMany({
            where: { id, userId: req.user!.id }
        });
        res.json({ message: 'Conversation deleted.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete conversation.' });
    }
};

/**
 * GET /api/copilot/briefing
 * Generate a morning operational briefing (cached for 1h in production).
 */
export const getBriefing = async (req: AuthRequest, res: Response) => {
    try {
        const briefing = await generateMorningBriefing();
        res.json({
            briefing,
            generatedAt: new Date().toISOString(),
        });
    } catch (error: any) {
        if (error.message?.includes('timed out') || error.message?.includes('Ollama') || error.message?.includes('503')) {
            logger.warn({ err: error.message }, 'Copilot briefing: AI service unavailable');
            return res.status(503).json({
                error: 'AI service unavailable.',
                details: error.message,
            });
        }
        logger.error({ err: error.message }, 'Briefing error');
        res.status(500).json({ error: 'Failed to generate briefing.' });
    }
};
