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
import { verifyToken } from './middleware/auth.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Smart Hostel API is running');
});

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

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
