import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';

const router = Router();

// GET /api/enrollments - List all enrollments
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const offset = (page - 1) * limit;

    // Get total count
    let totalCount = 0;
    const countResult = await supabaseAdmin
      .from('enrollments')
      .select('id', { count: 'exact', head: true });
    
    if (!countResult.error) {
      totalCount = countResult.count || 0;
    }

    const { data, error } = await supabaseAdmin
      .from('enrollments')
      .select(`
        id,
        enrollment_amount,
        status,
        created_at,
        form_submissions (
          parent_name,
          whatsapp_number,
          status
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: {
        enrollments: data || [],
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit) || 1
        }
      },
    });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    // Return empty data instead of error
    res.json({
      success: true,
      data: {
        enrollments: [],
        pagination: {
          page: 1,
          limit: 25,
          total: 0,
          pages: 0
        }
      },
    });
  }
});

// POST /api/enrollments - Create enrollment
router.post('/', async (req: Request, res: Response) => {
  try {
    const { submission_id, enrollment_amount } = req.body;

    if (!submission_id || !enrollment_amount) {
      return res.status(400).json({
        success: false,
        error: 'submission_id and enrollment_amount required',
      });
    }

    const { data, error } = await supabaseAdmin
      .from('enrollments')
      .insert({
        submission_id,
        enrollment_amount,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('Error creating enrollment:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create enrollment',
    });
  }
});

// GET /api/enrollments/:id - Get enrollment details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('enrollments')
      .select(`
        *,
        form_submissions (
          parent_name,
          whatsapp_number,
          status
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Enrollment not found',
      });
    }

    res.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('Error fetching enrollment:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch enrollment',
    });
  }
});

// PUT /api/enrollments/:id - Update enrollment
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { enrollment_amount, status } = req.body;

    const updates: Record<string, unknown> = {};
    if (enrollment_amount !== undefined) updates.enrollment_amount = enrollment_amount;
    if (status !== undefined) updates.status = status;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
      });
    }

    const { data, error } = await supabaseAdmin
      .from('enrollments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('Error updating enrollment:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update enrollment',
    });
  }
});

// DELETE /api/enrollments/:id - Delete enrollment
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('enrollments')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Enrollment deleted',
    });
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete enrollment',
    });
  }
});

// GET /api/enrollments/revenue/metrics - Get revenue metrics
router.get('/revenue/metrics', async (req: Request, res: Response) => {
  try {
    // Get counts
    const { count: totalEnrollments } = await supabaseAdmin
      .from('enrollments')
      .select('id', { count: 'exact', head: true });

    const { count: totalAttended } = await supabaseAdmin
      .from('attendance')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'attended');

    // Get total enrollment revenue
    const { data: enrollmentData, error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .select('enrollment_amount');

    if (enrollmentError) throw enrollmentError;

    const totalRevenue = (enrollmentData || []).reduce((sum, e) => sum + (e.enrollment_amount || 0), 0);

    // Get payment terms with defaults
    let paymentTerms = {
      enrollmentRate: 20,
      attendanceRate: 10,
      currency: 'KES'
    };

    const { data: termsData } = await supabaseAdmin
      .from('payment_terms')
      .select('*')
      .single();

    if (termsData) {
      paymentTerms = {
        enrollmentRate: termsData.enrollment_commission_rate || 20,
        attendanceRate: termsData.attendance_commission_rate || 10,
        currency: termsData.currency || 'KES'
      };
    }

    res.json({
      success: true,
      data: {
        totalSignups: 0,
        totalReach: 0,
        totalEnrollments: totalEnrollments || 0,
        totalShowUps: totalAttended || 0,
        totalFullyPaid: 0,
        totalPartiallyPaid: 0,
        totalUnpaid: 0,
        enrollmentRevenue: totalRevenue,
        attendanceRevenue: 0,
        totalRevenue: totalRevenue,
        enrollmentCommissionTotal: (totalRevenue * (paymentTerms.enrollmentRate / 100)) || 0,
        attendanceCommissionTotal: 0,
        breakdown: {
          byStatus: {},
          byPaymentStatus: {},
          byAgeGroup: {}
        },
        payoutInfo: {
          nextPayoutDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          frequency: 'weekly',
          minimumAmount: 1000,
          pendingPayout: 0
        },
        paymentTerms: paymentTerms
      }
    });
  } catch (error) {
    console.error('Error fetching revenue metrics:', error);
    res.json({
      success: true,
      data: {
        totalSignups: 0,
        totalReach: 0,
        totalEnrollments: 0,
        totalShowUps: 0,
        totalFullyPaid: 0,
        totalPartiallyPaid: 0,
        totalUnpaid: 0,
        enrollmentRevenue: 0,
        attendanceRevenue: 0,
        totalRevenue: 0,
        enrollmentCommissionTotal: 0,
        attendanceCommissionTotal: 0,
        breakdown: {
          byStatus: {},
          byPaymentStatus: {},
          byAgeGroup: {}
        },
        payoutInfo: {
          nextPayoutDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          frequency: 'weekly',
          minimumAmount: 1000,
          pendingPayout: 0
        },
        paymentTerms: {
          enrollmentRate: 20,
          attendanceRate: 10,
          currency: 'KES'
        }
      }
    });
  }
});

// GET /api/enrollments/revenue/terms - Get payment terms
router.get('/revenue/terms', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('payment_terms')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    // Return defaults if no terms found
    const terms = data || {
      enrollment_commission_rate: 25,
      attendance_commission_rate: 15,
      currency: 'KES',
      payout_frequency: 'monthly',
      minimum_payout: 1000
    };

    res.json({
      success: true,
      data: terms
    });
  } catch (error) {
    console.error('Error fetching payment terms:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch payment terms'
    });
  }
});

export default router;
