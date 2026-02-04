import { Router, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { formatResponse, formatError } from '../utils/helpers.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/attendance - Get attendance records with pagination
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const offset = (page - 1) * limit;

    // Get total count (handle case where table doesn't exist)
    let totalCount = 0;
    const countResult = await supabaseAdmin
      .from('attendance')
      .select('id', { count: 'exact', head: true });
    
    if (!countResult.error) {
      totalCount = countResult.count || 0;
    }

    // Get paginated records with enrollment details
    const { data: attendances, error } = await supabaseAdmin
      .from('attendance')
      .select(`
        id,
        qr_code,
        status,
        attended_at,
        created_at,
        enrollment:enrollments(
          id,
          submission:form_submissions(
            id,
            parent_name,
            whatsapp_number
          )
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Return safe defaults if table doesn't exist or no data
    const safeAttendances = attendances || [];

    return res.json(
      formatResponse(
        {
          attendances: safeAttendances,
          pagination: {
            page,
            limit,
            total: totalCount,
            pages: Math.ceil(totalCount / limit) || 1
          }
        },
        'Attendance records retrieved'
      )
    );
  } catch (error: unknown) {
    console.error('Get attendance error:', error);
    // Return empty data instead of error to prevent frontend crashes
    return res.json(
      formatResponse(
        {
          attendances: [],
          pagination: {
            page: 1,
            limit: 25,
            total: 0,
            pages: 0
          }
        },
        'No attendance data available'
      )
    );
  }
});

// GET /api/attendance/:id - Get single attendance record
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: attendance, error } = await supabaseAdmin
      .from('attendance')
      .select(`
        *,
        enrollment:enrollments(
          *,
          submission:form_submissions(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    return res.json(formatResponse(attendance, 'Attendance record retrieved'));
  } catch (error: unknown) {
    console.error('Get attendance error:', error);
    return res.status(500).json(formatError('Failed to retrieve attendance record'));
  }
});

export default router;
