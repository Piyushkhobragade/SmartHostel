import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import residentRoutes from './routes/resident.routes';
import roomRoutes from './routes/room.routes';
import attendanceRoutes from './routes/attendance.routes';
import summaryRoutes from './routes/summary.routes';
import visitorRoutes from './routes/visitor.routes';
import feeRoutes from './routes/fee.routes';
import analyticsRoutes from './routes/analytics.routes';
import assetRoutes from './routes/asset.routes';
import maintenanceRoutes from './routes/maintenance.routes';
import messRoutes from './routes/mess.routes';
import studentRoutes from './routes/student.routes';
import knowledgeRoutes from './routes/knowledge.routes';
import copilotRoutes from './routes/copilot.routes';
import intelligenceRoutes from './routes/intelligence.routes';
import digitaltwinRoutes from './routes/digitaltwin.routes';
import dashboardRoutes from './routes/dashboard.routes';
import { verifyToken } from './middleware/auth.middleware';
import { initializeDatabase } from './utils/dbInit';
import { seedKnowledgeDocuments } from './services/ai/knowledge.service';
import { startupDiagnostics } from './services/ai/ollama';
import { startScheduler, stopScheduler } from './services/scheduler';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './lib/logger';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter, authLimiter } from './middleware/rateLimiter';
import healthRoutes from './routes/health.routes';
import crypto from 'crypto';

const app = express();
const PORT = env.PORT;

app.use(helmet());
app.use(pinoHttp({ 
    logger,
    genReqId: function (req, res) {
        const id = crypto.randomUUID();
        res.setHeader('X-Request-Id', id);
        return id;
    }
}));
app.use(generalLimiter);
app.use(cors());
app.use(express.json());

// Health and Metrics endpoints
app.use('/', healthRoutes);

app.get('/', (req, res) => {
    res.send('Smart Hostel API is running');
});

// Specific rate limiter for login
app.use('/api/auth/login', authLimiter);

// Public routes (no authentication required)
app.use('/api/auth', authRoutes);

// Protected routes (require authentication + role-based access)
app.use('/api/residents', verifyToken, residentRoutes);
app.use('/api/rooms', verifyToken, roomRoutes);
app.use('/api/attendance', verifyToken, attendanceRoutes);
app.use('/api/summary', verifyToken, summaryRoutes);
app.use('/api/visitors', verifyToken, visitorRoutes);
app.use('/api/fees', verifyToken, feeRoutes);
app.use('/api/analytics', verifyToken, analyticsRoutes);
app.use('/api/assets', verifyToken, assetRoutes);
app.use('/api/maintenance', verifyToken, maintenanceRoutes);
app.use('/api/mess/subscriptions', verifyToken, messRoutes);
app.use('/api/student', verifyToken, studentRoutes);
app.use('/api/knowledge', verifyToken, knowledgeRoutes);
app.use('/api/copilot', verifyToken, copilotRoutes);
app.use('/api', verifyToken, intelligenceRoutes);
app.use('/api/twin', verifyToken, digitaltwinRoutes);
app.use('/api/dashboard', verifyToken, dashboardRoutes);

// Global Error Handler (must be the last middleware)
app.use(errorHandler);

const startServer = async () => {
    try {
        await initializeDatabase();
        await seedKnowledgeDocuments();

        // Start the intelligence scheduler (runs immediately, then every 30 min)
        startScheduler();

        // Run Ollama startup diagnostics (non-blocking — AI degrades gracefully)
        void startupDiagnostics();

        app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
        });
    } catch (err) {
        logger.fatal({ err }, 'Fatal error during startup');
        process.exit(1);
    }
};

// Graceful shutdown — stop scheduler before process exits
process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Stopping scheduler...');
    stopScheduler();
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received. Stopping scheduler...');
    stopScheduler();
    process.exit(0);
});

startServer();
