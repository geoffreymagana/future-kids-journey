import { Router, Response } from 'express';
import { ActivityLog } from '@/models/ActivityLog';
import { formatResponse, formatError } from '@/utils/helpers';
import { AuthRequest, authenticate } from '@/middleware/auth';

const router = Router();

// Middleware to check superadmin role
const checkSuperAdmin = (req: AuthRequest, res: Response, next: () => void) => {
  if (req.adminRole !== 'super_admin') {
    return res.status(403).json(formatError('Only superadmin can access this resource', 403));
  }
  next();
};

// GET /api/admin/logs - Get activity logs with filtering
router.get('/logs', authenticate, checkSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { action, resource, status, page = '1', limit = '20' } = req.query;

    // Build filter query
    const filter: Record<string, unknown> = {};

    if (action && action !== 'all') {
      filter.action = action;
    }

    if (resource && resource !== 'all') {
      filter.resource = resource;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    // Parse pagination
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Fetch logs with pagination
    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ActivityLog.countDocuments(filter)
    ]);

    const pages = Math.ceil(total / limitNum);

    return res.json(
      formatResponse(
        {
          logs,
          pagination: { pages, total, page: pageNum, limit: limitNum }
        },
        'Activity logs fetched successfully'
      )
    );
  } catch (error: unknown) {
    console.error('Get activity logs error:', error);
    return res.status(500).json(formatError('Failed to fetch activity logs'));
  }
});

// GET /api/admin/error-logs - Get error logs only
router.get('/error-logs', authenticate, checkSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { action, resource, page = '1', limit = '20' } = req.query;

    // Build filter query - always filter for errors
    const filter: Record<string, unknown> = { status: 'error' };

    if (action && action !== 'all') {
      filter.action = action;
    }

    if (resource && resource !== 'all') {
      filter.resource = resource;
    }

    // Parse pagination
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Fetch error logs with pagination
    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ActivityLog.countDocuments(filter)
    ]);

    const pages = Math.ceil(total / limitNum);

    return res.json(
      formatResponse(
        {
          logs,
          pagination: { pages, total, page: pageNum, limit: limitNum }
        },
        'Error logs fetched successfully'
      )
    );
  } catch (error: unknown) {
    console.error('Get error logs error:', error);
    return res.status(500).json(formatError('Failed to fetch error logs'));
  }
});

export default router;
