import express, { Express, Request, Response } from 'express';
import cors from 'cors';

import authRoutes from '@/routes/auth.supabase.js';
import formsRoutes from '@/routes/forms.supabase.js';
import enrollmentsRoutes from '@/routes/enrollments.supabase.js';
import attendanceRoutes from '@/routes/attendance.supabase.js';
import adminRoutes from '@/routes/admin.supabase.js';
import { authenticate } from '@/middleware/auth';
import { getClientIP, getUserAgent } from '@/utils/analytics';

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
// TODO: Re-implement with Supabase when needed
// This route currently redirects to home as a placeholder
app.get('/s/:code', (req: Request, res: Response) => {
  // Placeholder: redirect to home
  // When needed, implement with Supabase query to share_metrics table
  return res.redirect(302, '/');
});

// Routes (now using Supabase)
app.use('/api/auth', authRoutes);
app.use('/api/forms', formsRoutes);
app.use('/api/enrollments', enrollmentsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', adminRoutes);
// Old attendance and admin routes removed - use enrollments and auth routes instead

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

// Start server (using Supabase PostgreSQL)
const startServer = async () => {
  try {
    console.log('✅ Starting server with Supabase PostgreSQL backend');

    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📡 API: http://localhost:${PORT}/api`);
      console.log(`🔐 Auth: POST http://localhost:${PORT}/api/auth/login`);
      console.log(`📝 Forms: POST http://localhost:${PORT}/api/forms/submit`);
      console.log(`📊 Enrollments: GET http://localhost:${PORT}/api/enrollments`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
