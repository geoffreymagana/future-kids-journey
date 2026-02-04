import { Router, Response, Request } from 'express';
import { z } from 'zod';
import { Attendance } from '@/models/Attendance';
import { Enrollment } from '@/models/Enrollment';
import { FormSubmission } from '@/models/FormSubmission';
import { logSuccess, logError, logWithDetails } from '@/utils/logger';
import { formatResponse, formatError } from '@/utils/helpers';
import { AuthRequest, authenticate } from '@/middleware/auth';
import crypto from 'crypto';

const router = Router();

// Validation schemas
const recordAttendanceSchema = z.object({
  enrollmentId: z.string().min(1),
  workshopDate: z.string().datetime().or(z.date()),
  status: z.enum(['pending', 'attended', 'absent', 'cancelled']),
  attendanceDate: z.string().datetime().or(z.date()).optional(),
  notes: z.string().optional()
});

const queryAttendanceSchema = z.object({
  enrollmentId: z.string().optional(),
  submissionId: z.string().optional(),
  status: z.enum(['pending', 'attended', 'absent', 'cancelled']).optional(),
  workshopDate: z.string().optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional()
});

/**
 * Generate unique QR code for attendance
 */
function generateQRCode(enrollmentId: string): string {
  return crypto
    .createHash('sha256')
    .update(`${enrollmentId}-${Date.now()}-${Math.random()}`)
    .digest('hex')
    .substring(0, 20)
    .toUpperCase();
}

// POST /api/attendance - Create attendance record for an enrollment
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json(formatError('Unauthorized', 401));
    }

    const validation = recordAttendanceSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(formatError('Invalid attendance data'));
    }

    const { enrollmentId, workshopDate, status, attendanceDate, notes } = validation.data;

    // Verify enrollment exists
    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) {
      return res.status(404).json(formatError('Enrollment not found', 404));
    }

    // Check if attendance already exists for this enrollment and workshop date
    const existingAttendance = await Attendance.findOne({
      enrollmentId,
      workshopDate: new Date(workshopDate)
    });

    if (existingAttendance) {
      return res.status(409).json(formatError('Attendance already recorded for this enrollment and date'));
    }

    // Create attendance record with QR code
    const qrCode = generateQRCode(enrollmentId);

    const attendance = new Attendance({
      enrollmentId,
      submissionId: enrollment.submissionId,
      workshopDate: new Date(workshopDate),
      status,
      attendanceDate: attendanceDate ? new Date(attendanceDate) : null,
      notes,
      qrCode,
      recordedBy: req.userId,
      recordedAt: new Date()
    });

    await attendance.save();

    // Populate references for response
    await attendance.populate([
      { path: 'enrollmentId' },
      { path: 'submissionId' }
    ]);

    // Log the activity
    await logWithDetails(
      req.userId,
      'record_attendance',
      'attendance',
      {
        enrollmentId,
        workshopDate,
        status,
        qrCode
      },
      attendance._id.toString()
    );

    return res.status(201).json(
      formatResponse(attendance, 'Attendance recorded successfully')
    );
  } catch (error: unknown) {
    console.error('Create attendance error:', error);
    if (req.userId) {
      await logError(
        req.userId,
        'record_attendance',
        'attendance',
        error instanceof Error ? error : 'Unknown error'
      );
    }
    return res.status(500).json(formatError('Failed to record attendance'));
  }
});

// GET /api/attendance - List attendance records with filters
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json(formatError('Unauthorized', 401));
    }

    const validation = queryAttendanceSchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json(formatError('Invalid query parameters'));
    }

    const { enrollmentId, submissionId, status, workshopDate, page = 1, limit = 25 } = validation.data;

    // Build filter
    const filter: Record<string, unknown> = {};
    if (enrollmentId) filter.enrollmentId = enrollmentId;
    if (submissionId) filter.submissionId = submissionId;
    if (status) filter.status = status;
    if (workshopDate) {
      const date = new Date(workshopDate);
      filter.workshopDate = {
        $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
      };
    }

    // Count total
    const total = await Attendance.countDocuments(filter);

    // Fetch paginated results
    const attendances = await Attendance.find(filter)
      .populate('enrollmentId')
      .populate('submissionId')
      .sort({ workshopDate: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const pages = Math.ceil(total / limit);

    return res.json(
      formatResponse(
        {
          attendances,
          pagination: { total, pages, limit }
        },
        'Attendance records fetched'
      )
    );
  } catch (error: unknown) {
    console.error('List attendance error:', error);
    return res.status(500).json(formatError('Failed to fetch attendance records'));
  }
});

// GET /api/attendance/:id - Get specific attendance record
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json(formatError('Unauthorized', 401));
    }

    const attendance = await Attendance.findById(req.params.id)
      .populate('enrollmentId')
      .populate('submissionId');

    if (!attendance) {
      return res.status(404).json(formatError('Attendance record not found', 404));
    }

    return res.json(formatResponse(attendance, 'Attendance record fetched'));
  } catch (error: unknown) {
    console.error('Get attendance error:', error);
    return res.status(500).json(formatError('Failed to fetch attendance record'));
  }
});

// GET /api/attendance/qr/:qrCode - Validate QR code and get enrollment info
router.get('/qr/:qrCode', async (req: Request, res: Response) => {
  try {
    const { qrCode } = req.params;

    const attendance = await Attendance.findOne({ qrCode })
      .populate('enrollmentId')
      .populate('submissionId');

    if (!attendance) {
      return res.status(404).json(formatError('QR code not found', 404));
    }

    // Check if already marked as attended
    if (attendance.status === 'attended') {
      return res.status(409).json(formatError('Attendance already recorded for this QR code'));
    }

    // Populate submission to get parent name
    const populatedAttendance = await Attendance.findOne({ qrCode })
      .populate('enrollmentId')
      .populate('submissionId');

    if (!populatedAttendance) {
      return res.status(404).json(formatError('Attendance record not found', 404));
    }

    const submissionData = populatedAttendance.submissionId as unknown as { parentName: string };

    // Return enrollment info for confirmation
    return res.json(
      formatResponse(
        {
          attendanceId: attendance._id,
          enrollmentId: attendance.enrollmentId._id,
          parentName: submissionData.parentName,
          workshopDate: attendance.workshopDate,
          status: attendance.status
        },
        'QR code validated'
      )
    );
  } catch (error: unknown) {
    console.error('QR validation error:', error);
    return res.status(500).json(formatError('Failed to validate QR code'));
  }
});

// PATCH /api/attendance/:id - Update attendance record
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json(formatError('Unauthorized', 401));
    }

    const { status, attendanceDate, notes } = req.body;

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (attendanceDate && typeof attendanceDate === 'string') {
      updateData.attendanceDate = new Date(attendanceDate);
    }
    if (notes !== undefined) updateData.notes = notes;
    updateData.recordedBy = req.userId;
    updateData.recordedAt = new Date();

    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate(['enrollmentId', 'submissionId']);

    if (!attendance) {
      return res.status(404).json(formatError('Attendance record not found', 404));
    }

    // Log the activity
    await logWithDetails(
      req.userId,
      'update_attendance',
      'attendance',
      updateData,
      attendance._id.toString()
    );

    return res.json(formatResponse(attendance, 'Attendance updated'));
  } catch (error: unknown) {
    console.error('Update attendance error:', error);
    if (req.userId) {
      await logError(
        req.userId,
        'update_attendance',
        'attendance',
        error instanceof Error ? error : 'Unknown error',
        req.params.id
      );
    }
    return res.status(500).json(formatError('Failed to update attendance'));
  }
});

// DELETE /api/attendance/:id - Delete attendance record
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json(formatError('Unauthorized', 401));
    }

    const attendance = await Attendance.findByIdAndDelete(req.params.id);

    if (!attendance) {
      return res.status(404).json(formatError('Attendance record not found', 404));
    }

    return res.json(formatResponse(null, 'Attendance record deleted'));
  } catch (error: unknown) {
    console.error('Delete attendance error:', error);
    return res.status(500).json(formatError('Failed to delete attendance'));
  }
});

export default router;
