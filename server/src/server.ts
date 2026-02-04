import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import authRoutes from '@/routes/auth';
import formsRoutes from '@/routes/forms';
import enrollmentsRoutes from '@/routes/enrollments';
import attendanceRoutes from '@/routes/attendance';
import adminRoutes from '@/routes/admin';
import migrateAttendance from '@/migrations/attendance';
import { authenticate } from '@/middleware/auth';
import { FormSubmission } from '@/models/FormSubmission';
import { getClientIP, getUserAgent } from '@/utils/analytics';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
  })
);

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    success: true, 
    message: 'Future Kids Journey API', 
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      forms: '/api/forms'
    }
  });
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Public redirect route for share links (/s/:code for short URLs)
app.get('/s/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const ip = getClientIP(req);
    const userAgent = getUserAgent(req);

    // Find submission by share code
    const submission = await FormSubmission.findOneAndUpdate(
      { shareCode: code },
      {
        $push: {
          'shareMetrics.visits': {
            code,
            timestamp: new Date(),
            ip,
            userAgent
          }
        }
      },
      { new: true }
    );

    if (!submission) {
      // Code not found, redirect to home
      return res.redirect(302, '/');
    }

    // Redirect to landing page with referral parameter
    return res.redirect(302, `/?ref=${submission._id}`);
  } catch (error: unknown) {
    console.error('Redirect tracking error:', error);
    // On error, still redirect to home
    return res.redirect(302, '/');
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/forms', formsRoutes);
app.use('/api/enrollments', enrollmentsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// Error handler
app.use(
  (
    err: Error & { status?: number },
    req: Request,
    res: Response,
    next: () => void
  ) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error'
    });
  }
);

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/future-kids-journey');
    console.log('✅ Connected to MongoDB');

    // Run migrations
    console.log('🔄 Running migrations...');
    await migrateAttendance();

    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📡 API: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
