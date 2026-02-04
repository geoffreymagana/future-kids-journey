import { Router, Response, Request } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase.js';
import { getClientIP, getUserAgent, generateShareCode } from '../utils/analytics.js';
import { formatResponse, formatError } from '../utils/helpers.js';
import { AuthRequest, authenticate } from '../middleware/auth.js';

const router = Router();

// Validation schema
const formSubmissionSchema = z.object({
  name: z.string().min(2).max(100),
  whatsapp: z.string().min(10).max(15),
  ageRange: z.enum(['5-7', '8-10', '11-14']),
  numberOfKids: z.number().int().min(1).max(10).optional(),
  referralLink: z.string().optional(),
  source: z.enum(['facebook', 'instagram', 'twitter', 'whatsapp', 'reddit', 'telegram', 'tiktok', 'linkedin', 'direct', 'email', 'organic', 'other']).optional(),
  sessionId: z.string().optional()
});

// POST /api/forms/submit - Submit form (public)
router.post('/submit', async (req: Request, res: Response) => {
  try {
    const validation = formSubmissionSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json(formatError('Invalid form data'));
    }

    const { name, whatsapp, ageRange, numberOfKids, referralLink, source, sessionId } = validation.data;

    // Check for exact duplicate
    let isDuplicate = false;
    let duplicateOf: string | undefined;

    if (sessionId) {
      const { data: exactDuplicate } = await supabaseAdmin
        .from('form_submissions')
        .select('id, parent_name')
        .eq('parent_name', name)
        .eq('whatsapp_number', whatsapp)
        .maybeSingle();

      if (exactDuplicate) {
        isDuplicate = true;
        duplicateOf = exactDuplicate.id;
      }
    }

    // Create new submission
    const { data: submission, error } = await supabaseAdmin
      .from('form_submissions')
      .insert({
        parent_name: name,
        whatsapp_number: whatsapp,
        status: 'new',
        referral_source: source || 'direct'
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json(
      formatResponse(
        {
          id: submission.id,
          isDuplicate,
          message: isDuplicate 
            ? 'We already have your information. Thank you for your interest! We will reach out soon.'
            : 'Thank you! We will be in touch soon.'
        },
        'Form submitted successfully'
      )
    );
  } catch (error: unknown) {
    console.error('Form submission error:', error);
    return res.status(500).json(formatError('Failed to submit form'));
  }
});

// GET /api/forms/submissions - Get all submissions (admin only)
router.get('/submissions', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json(formatError('Unauthorized', 401));
    }

    const { status, source, page = '1', limit = '50', sort } = req.query as Record<string, string>;

    let query = supabaseAdmin
      .from('form_submissions')
      .select('*', { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (source) query = query.eq('referral_source', source);

    const skip = (Number(page) - 1) * Number(limit);
    const pageNum = Number(page);
    const limitNum = Number(limit);

    // Parse sort parameter (e.g., "-submittedAt" means descending, "submittedAt" means ascending)
    let sortField = 'created_at';
    let sortAscending = false;
    
    if (sort) {
      if (sort.startsWith('-')) {
        sortField = sort.substring(1) === 'submittedAt' ? 'created_at' : sort.substring(1);
        sortAscending = false;
      } else {
        sortField = sort === 'submittedAt' ? 'created_at' : sort;
        sortAscending = true;
      }
    }

    const { data: submissionsData, error, count } = await query
      .order(sortField, { ascending: sortAscending })
      .range(skip, skip + limitNum - 1);

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    // Map Supabase response to match frontend expectations
    const submissions = (submissionsData || []).map((sub: any) => ({
      _id: sub.id,
      parentName: sub.parent_name,
      whatsappNumber: sub.whatsapp_number,
      status: sub.status,
      submittedAt: sub.created_at,
      source: sub.referral_source,
      childAgeRange: sub.age_range,
      numberOfKids: sub.number_of_kids,
      isDuplicate: false,
      sharedTo: [],
      shareMetrics: {
        clicks: [],
        intents: [],
        visits: []
      }
    }));

    return res.json(
      formatResponse(
        {
          submissions,
          pagination: {
            total: count || 0,
            pages: Math.ceil((count || 0) / limitNum),
            current: pageNum,
            limit: limitNum
          }
        },
        'Submissions retrieved'
      )
    );
  } catch (error: unknown) {
    console.error('Get submissions error:', error);
    return res.status(500).json(formatError('Failed to retrieve submissions'));
  }
});

// GET /api/forms/submissions/:id - Get single submission
router.get('/submissions/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json(formatError('Unauthorized', 401));
    }

    const { data: submission, error } = await supabaseAdmin
      .from('form_submissions')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !submission) {
      return res.status(404).json(formatError('Submission not found', 404));
    }

    return res.json(formatResponse(submission, 'Submission retrieved'));
  } catch (error: unknown) {
    console.error('Get submission error:', error);
    return res.status(500).json(formatError('Failed to retrieve submission'));
  }
});

// PATCH /api/forms/submissions/:id - Update submission status
router.patch('/submissions/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json(formatError('Unauthorized', 401));
    }

    const { status } = req.body;
    const updateData: Record<string, unknown> = {};
    
    if (status) updateData.status = status;

    const { data: submission, error } = await supabaseAdmin
      .from('form_submissions')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !submission) {
      return res.status(404).json(formatError('Submission not found', 404));
    }

    return res.json(formatResponse(submission, 'Submission updated'));
  } catch (error: unknown) {
    console.error('Update submission error:', error);
    return res.status(500).json(formatError('Failed to update submission'));
  }
});

// DELETE /api/forms/submissions/:id - Delete submission
router.delete('/submissions/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json(formatError('Unauthorized', 401));
    }

    const { error } = await supabaseAdmin
      .from('form_submissions')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    return res.json(formatResponse({}, 'Submission deleted'));
  } catch (error: unknown) {
    console.error('Delete submission error:', error);
    return res.status(500).json(formatError('Failed to delete submission'));
  }
});

// GET /api/forms/stats - Get submission statistics (authenticated)
router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json(formatError('Unauthorized', 401));
    }

    const { data: stats, error } = await supabaseAdmin
      .from('admin_dashboard_stats')
      .select('*')
      .single();

    if (error) throw error;

    return res.json(formatResponse(stats, 'Stats retrieved'));
  } catch (error: unknown) {
    console.error('Get stats error:', error);
    return res.status(500).json(formatError('Failed to retrieve stats'));
  }
});

// GET /api/forms/public-stats - Get public statistics (no auth required)
router.get('/public-stats', async (req: Request, res: Response) => {
  try {
    // Get count of form submissions
    const { count: totalSubmissions, error: submissionError } = await supabaseAdmin
      .from('form_submissions')
      .select('id', { count: 'exact', head: true });

    if (submissionError) {
      console.error('Submission count error:', submissionError);
      throw submissionError;
    }

    // Get count of enrollments
    const { count: totalEnrollments, error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .select('id', { count: 'exact', head: true });

    if (enrollmentError) {
      console.error('Enrollment count error:', enrollmentError);
      throw enrollmentError;
    }

    // Get count of attendances with status 'attended'
    const { count: totalAttendances, error: attendanceError } = await supabaseAdmin
      .from('attendance')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'attended');

    if (attendanceError) {
      console.error('Attendance count error:', attendanceError);
      throw attendanceError;
    }

    const stats = {
      totalSubmissions: totalSubmissions || 0,
      totalEnrollments: totalEnrollments || 0,
      totalAttendances: totalAttendances || 0
    };

    return res.json(formatResponse(stats, 'Public stats retrieved'));
  } catch (error: unknown) {
    console.error('Get public stats error:', error);
    return res.status(500).json(formatError('Failed to retrieve public stats'));
  }
});

export default router;
