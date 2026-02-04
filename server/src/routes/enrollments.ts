import { Router, Response, Request } from 'express';
import { z } from 'zod';
import { Enrollment } from '@/models/Enrollment';
import { PaymentTerms } from '@/models/PaymentTerms';
import { FormSubmission } from '@/models/FormSubmission';
import { calculateRevenueMetrics, calculateCommission, getActivePaymentTerms } from '@/utils/revenue';
import { logSuccess, logError, logWithDetails } from '@/utils/logger';
import { formatResponse, formatError } from '@/utils/helpers';
import { AuthRequest, authenticate } from '@/middleware/auth';

const router = Router();

// Validation schemas
const enrollmentSchema = z.object({
  submissionId: z.string(),
  parentName: z.string().min(2),
  whatsappNumber: z.string().min(10),
  childAgeRange: z.enum(['5-7', '8-10', '11-14']),
  status: z.enum(['inquiry', 'enrolled', 'completed', 'cancelled', 'no_show']).optional(),
  totalAmount: z.number().min(0).optional(),
  paidAmount: z.number().min(0).optional(),
  notes: z.string().optional()
});

const paymentSchema = z.object({
  amount: z.number().min(0, 'Amount must be positive'),
  method: z.enum(['cash', 'bank_transfer', 'mpesa', 'upi', 'cheque', 'other']),
  notes: z.string().optional(),
  date: z.string().optional(),
  mpesaReference: z.string().optional()
});

const paymentTermsSchema = z.object({
  signupCommissionRate: z.number().min(0).max(100),
  enrollmentCommissionRate: z.number().min(0).max(100),
  currency: z.enum(['KES', 'INR', 'USD', 'EUR', 'GBP']).optional(),
  minimumPayoutAmount: z.number().min(0).optional(),
  payoutFrequency: z.enum(['weekly', 'biweekly', 'monthly', 'quarterly']).optional(),
  payoutDay: z.number().min(0).max(31).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  includesTax: z.boolean().optional(),
  notes: z.string().optional()
});

// Middleware to check superadmin role
const checkSuperAdmin = (req: AuthRequest, res: Response, next: () => void) => {
  if (req.adminRole !== 'super_admin') {
    return res.status(403).json(formatError('Only superadmin can access this resource', 403));
  }
  next();
};

// POST /api/enrollments - Create new enrollment
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json(formatError('Unauthorized', 401));
    }

    const validation = enrollmentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(formatError('Invalid enrollment data'));
    }

    const { submissionId, parentName, whatsappNumber, childAgeRange, status, totalAmount, paidAmount, notes } = validation.data;

    // Check if submission exists
    const submission = await FormSubmission.findById(submissionId);
    if (!submission) {
      return res.status(404).json(formatError('Submission not found', 404));
    }

    // Check if enrollment already exists
    const existingEnrollment = await Enrollment.findOne({ submissionId });
    if (existingEnrollment) {
      return res.status(400).json(formatError('Enrollment already exists for this submission'));
    }

    const enrollment = new Enrollment({
      submissionId,
      parentName,
      whatsappNumber,
      childAgeRange,
      status: status || 'inquiry',
      totalAmount: totalAmount || 0,
      paidAmount: paidAmount || 0,
      notes
    });

    await enrollment.save();

    // Log the activity
    await logWithDetails(
      req.userId,
      'create_enrollment',
      'enrollment',
      {
        parentName,
        childAgeRange,
        totalAmount,
        paidAmount
      },
      enrollment._id.toString()
    );

    return res.status(201).json(
      formatResponse(enrollment, 'Enrollment created successfully')
    );
  } catch (error: unknown) {
    console.error('Create enrollment error:', error);
    if (req.userId) {
      await logError(
        req.userId,
        'create_enrollment',
        'enrollment',
        error instanceof Error ? error : 'Unknown error'
      );
    }
    return res.status(500).json(formatError('Failed to create enrollment'));
  }
});

// GET /api/enrollments/:submissionId - Get enrollment for a submission
router.get('/:submissionId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json(formatError('Unauthorized', 401));
    }

    const enrollment = await Enrollment.findOne({ submissionId: req.params.submissionId });
    if (!enrollment) {
      return res.status(404).json(formatError('Enrollment not found', 404));
    }

    return res.json(formatResponse(enrollment, 'Enrollment retrieved'));
  } catch (error: unknown) {
    console.error('Get enrollment error:', error);
    return res.status(500).json(formatError('Failed to retrieve enrollment'));
  }
});

// PATCH /api/enrollments/:submissionId - Update enrollment
router.patch('/:submissionId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json(formatError('Unauthorized', 401));
    }

    const { status, totalAmount, paidAmount, notes } = req.body;
    const updateData: Record<string, unknown> = {};

    if (status) updateData.status = status;
    if (totalAmount !== undefined) updateData.totalAmount = totalAmount;
    if (paidAmount !== undefined) updateData.paidAmount = paidAmount;
    if (notes) updateData.notes = notes;

    // Set enrollment date if transitioning to enrolled
    if (status === 'enrolled' && !updateData.enrollmentDate) {
      updateData.enrollmentDate = new Date();
    }

    // Set completion date if transitioning to completed
    if (status === 'completed' && !updateData.completionDate) {
      updateData.completionDate = new Date();
    }

    const enrollment = await Enrollment.findOneAndUpdate(
      { submissionId: req.params.submissionId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!enrollment) {
      return res.status(404).json(formatError('Enrollment not found', 404));
    }

    // Log the activity
    await logWithDetails(
      req.userId,
      'update_enrollment',
      'enrollment',
      updateData,
      enrollment._id.toString()
    );

    return res.json(formatResponse(enrollment, 'Enrollment updated'));
  } catch (error: unknown) {
    console.error('Update enrollment error:', error);
    if (req.userId) {
      await logError(
        req.userId,
        'update_enrollment',
        'enrollment',
        error instanceof Error ? error : 'Unknown error'
      );
    }
    return res.status(500).json(formatError('Failed to update enrollment'));
  }
});

// POST /api/enrollments/:submissionId/payment - Record a payment
router.post('/:submissionId/payment', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json(formatError('Unauthorized', 401));
    }

    const validation = paymentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(formatError('Invalid payment data'));
    }

    const { amount, method, notes, date, mpesaReference } = validation.data;

    const enrollment = await Enrollment.findOne({ submissionId: req.params.submissionId });
    if (!enrollment) {
      return res.status(404).json(formatError('Enrollment not found', 404));
    }

    // Add payment to history
    if (!enrollment.payments) {
      enrollment.payments = [];
    }

    const paymentRecord: Record<string, unknown> = {
      date: date ? new Date(date) : new Date(),
      amount,
      method,
      notes
    };

    enrollment.payments.push(paymentRecord as { date: Date; amount: number; method: "cash" | "bank_transfer" | "upi" | "cheque" | "other"; notes?: string });

    // Update paid amount
    enrollment.paidAmount = (enrollment.paidAmount || 0) + amount;

    // Recalculate pending amount
    enrollment.pendingAmount = Math.max(0, (enrollment.totalAmount || 0) - enrollment.paidAmount);

    // Update payment status
    if (enrollment.paidAmount >= enrollment.totalAmount) {
      enrollment.paymentStatus = 'full';
    } else if (enrollment.paidAmount > 0) {
      enrollment.paymentStatus = 'partial';
    } else {
      enrollment.paymentStatus = 'unpaid';
    }

    await enrollment.save();

    // Log the activity
    await logWithDetails(
      req.userId,
      'record_payment',
      'enrollment',
      {
        enrollmentId: enrollment._id,
        amount,
        method,
        newPaymentStatus: enrollment.paymentStatus,
        totalPaid: enrollment.paidAmount
      },
      enrollment._id.toString()
    );

    return res.json(
      formatResponse(enrollment, 'Payment recorded successfully')
    );
  } catch (error: unknown) {
    console.error('Record payment error:', error);
    if (req.userId) {
      await logError(
        req.userId,
        'record_payment',
        'enrollment',
        error instanceof Error ? error : 'Unknown error'
      );
    }
    return res.status(500).json(formatError('Failed to record payment'));
  }
});

// GET /api/enrollments - Get all enrollments (admin only)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json(formatError('Unauthorized', 401));
    }

    const { status, paymentStatus, page = 1, limit = 50, sort = '-createdAt' } = req.query as Record<string, string | string[] | undefined>;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const skip = (Number(page) - 1) * Number(limit);

    const enrollments = await Enrollment.find(filter)
      .sort(sort as string)
      .skip(skip)
      .limit(Number(limit));

    const total = await Enrollment.countDocuments(filter);

    // Get active payment terms to calculate commission
    const paymentTerms = await getActivePaymentTerms();

    // Calculate commission for each enrollment
    const enrollmentsWithCommission = enrollments.map(enrollment => {
      const enrollmentObj = enrollment.toObject();
      const commission = calculateCommission(
        enrollment.totalAmount || 0,
        enrollment.status,
        paymentTerms.enrollmentCommissionRate,
        paymentTerms.attendanceCommissionRate
      );
      
      return {
        ...enrollmentObj,
        commissionEarned: {
          enrollmentCommission: commission.enrollment,
          attendanceCommission: commission.attendance,
          totalCommission: commission.total,
          currency: paymentTerms.currency || 'KES'
        }
      };
    });

    return res.json(
      formatResponse(
        {
          enrollments: enrollmentsWithCommission,
          pagination: {
            total,
            pages: Math.ceil(total / Number(limit)),
            current: Number(page),
            limit: Number(limit)
          }
        },
        'Enrollments retrieved'
      )
    );
  } catch (error: unknown) {
    console.error('Get enrollments error:', error);
    return res.status(500).json(formatError('Failed to retrieve enrollments'));
  }
});

// GET /api/enrollments/revenue/metrics - Get revenue metrics (superadmin only)
router.get('/revenue/metrics', authenticate, checkSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const metrics = await calculateRevenueMetrics();
    return res.json(formatResponse(metrics, 'Revenue metrics calculated'));
  } catch (error: unknown) {
    console.error('Get revenue metrics error:', error);
    return res.status(500).json(formatError('Failed to calculate revenue metrics'));
  }
});

// GET /api/enrollments/revenue/terms - Get payment terms (superadmin only)
router.get('/revenue/terms', authenticate, checkSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const terms = await getActivePaymentTerms();
    return res.json(formatResponse(terms, 'Payment terms retrieved'));
  } catch (error: unknown) {
    console.error('Get payment terms error:', error);
    return res.status(500).json(formatError('Failed to retrieve payment terms'));
  }
});

// PUT /api/enrollments/revenue/terms - Update payment terms (superadmin only)
router.put('/revenue/terms', authenticate, checkSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const validation = paymentTermsSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(formatError('Invalid payment terms data'));
    }

    // Deactivate old terms
    await PaymentTerms.updateOne(
      { isActive: true },
      { isActive: false }
    );

    // Create new terms
    const newTerms = await PaymentTerms.create({
      ...validation.data,
      isActive: true,
      effectiveFrom: new Date(),
      updatedBy: req.userEmail || 'unknown'
    });

    return res.json(
      formatResponse(newTerms, 'Payment terms updated successfully')
    );
  } catch (error: unknown) {
    console.error('Update payment terms error:', error);
    return res.status(500).json(formatError('Failed to update payment terms'));
  }
});

export default router;
