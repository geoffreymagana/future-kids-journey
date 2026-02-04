import { Router, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { formatResponse, formatError } from '../utils/helpers.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/admin/logs - Get activity logs
router.get('/logs', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const offset = (page - 1) * limit;

    // Get total count (handle case where table doesn't exist)
    let totalCount = 0;
    const countResult = await supabaseAdmin
      .from('activity_logs')
      .select('id', { count: 'exact', head: true });
    
    if (!countResult.error) {
      totalCount = countResult.count || 0;
    }

    // Get paginated records
    const { data: logs, error } = await supabaseAdmin
      .from('activity_logs')
      .select(`
        id,
        admin_id,
        action,
        entity_type,
        entity_id,
        changes,
        created_at,
        admin:admins(email, role)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Return safe defaults if table doesn't exist or no data
    const safeLogs = logs || [];

    return res.json(
      formatResponse(
        {
          logs: safeLogs,
          pagination: {
            page,
            limit,
            total: totalCount,
            pages: Math.ceil(totalCount / limit) || 1
          }
        },
        'Activity logs retrieved'
      )
    );
  } catch (error: unknown) {
    console.error('Get activity logs error:', error);
    // Return empty data instead of error to prevent frontend crashes
    return res.json(
      formatResponse(
        {
          logs: [],
          pagination: {
            page: 1,
            limit: 25,
            total: 0,
            pages: 0
          }
        },
        'No activity logs available'
      )
    );
  }
});

// GET /api/admin/error-logs - Get error logs
router.get('/error-logs', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const offset = (page - 1) * limit;

    // Get total count (handle case where table doesn't exist)
    let totalCount = 0;
    const countResult = await supabaseAdmin
      .from('activity_logs')
      .select('id', { count: 'exact', head: true })
      .eq('action', 'error');
    
    if (!countResult.error) {
      totalCount = countResult.count || 0;
    }

    // Get paginated records
    const { data: logs, error } = await supabaseAdmin
      .from('activity_logs')
      .select(`
        id,
        action,
        entity_type,
        changes,
        created_at
      `)
      .eq('action', 'error')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Return safe defaults if table doesn't exist or no data
    const safeLogs = logs || [];

    return res.json(
      formatResponse(
        {
          logs: safeLogs,
          pagination: {
            page,
            limit,
            total: totalCount,
            pages: Math.ceil(totalCount / limit) || 1
          }
        },
        'Error logs retrieved'
      )
    );
  } catch (error: unknown) {
    console.error('Get error logs error:', error);
    // Return empty data instead of error to prevent frontend crashes
    return res.json(
      formatResponse(
        {
          logs: [],
          pagination: {
            page: 1,
            limit: 25,
            total: 0,
            pages: 0
          }
        },
        'No error logs available'
      )
    );
  }
});

export default router;
