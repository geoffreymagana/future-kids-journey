import { Router, Response, Request } from 'express';
import { z } from 'zod';
import { FormSubmission } from '@/models/FormSubmission';
import { getClientIP, getUserAgent, checkDedup, generateShareCode } from '@/utils/analytics';
import { formatResponse, formatError } from '@/utils/helpers';
import { AuthRequest, authenticate } from '@/middleware/auth';

const router = Router();

// Validation schema
const formSubmissionSchema = z.object({
  name: z.string().min(2).max(100),
  whatsapp: z.string().min(10).max(15),
  ageRange: z.enum(['5-7', '8-10', '11-14']),
  numberOfKids: z.number().int().min(1).max(10).optional(),
  referralLink: z.string().optional(),
  source: z.enum(['facebook', 'instagram', 'twitter', 'whatsapp', 'reddit', 'telegram', 'tiktok', 'linkedin', 'direct', 'email', 'organic', 'other']).optional(),
  sessionId: z.string().optional() // Browser session ID for duplicate detection
});

// POST /api/forms/submit - Submit form (public)
router.post('/submit', async (req: Request, res: Response) => {
  try {
    const validation = formSubmissionSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json(formatError('Invalid form data'));
    }

    const { name, whatsapp, ageRange, numberOfKids, referralLink, source, sessionId } = validation.data;

    // Check for exact duplicate: sessionId + name + whatsapp all match (AND logic)
    let isDuplicate = false;
    let duplicateOf: string | undefined;

    if (sessionId) {
      // Only check with sessionId if provided
      const exactDuplicate = await FormSubmission.findOne({
        sessionId: sessionId,
        parentName: name,
        whatsappNumber: whatsapp
      }).select('_id parentName');

      if (exactDuplicate) {
        isDuplicate = true;
        duplicateOf = exactDuplicate._id.toString();
      }
    }

    const submission = new FormSubmission({
      parentName: name,
      whatsappNumber: whatsapp,
      childAgeRange: ageRange,
      numberOfKids: numberOfKids || 1,
      referralLink,
      source: source || 'direct',
      ipAddress: getClientIP(req),
      userAgent: getUserAgent(req),
      sessionId,
      isDuplicate,
      duplicateOf
    });

    await submission.save();

    // If this is a duplicate, update the original submission to mark it as having duplicates
    if (duplicateOf) {
      await FormSubmission.findByIdAndUpdate(
        duplicateOf,
        {
          hasDuplicates: true,
          $push: { duplicateSubmissions: submission._id }
        }
      );
    }

    return res.status(201).json(
      formatResponse(
        {
          id: submission._id,
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

    const { status, ageRange, source, page = 1, limit = 50, sort = '-submittedAt' } = req.query as Record<string, string | string[] | undefined>;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (ageRange) filter.childAgeRange = ageRange;
    if (source) filter.source = source;

    const skip = (Number(page) - 1) * Number(limit);

    const submissions = await FormSubmission.find(filter)
      .sort(sort as string)
      .skip(skip)
      .limit(Number(limit));

    const total = await FormSubmission.countDocuments(filter);

    return res.json(
      formatResponse(
        {
          submissions,
          pagination: {
            total,
            pages: Math.ceil(total / Number(limit)),
            current: Number(page),
            limit: Number(limit)
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

    const submission = await FormSubmission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json(formatError('Submission not found', 404));
    }

    return res.json(formatResponse(submission, 'Submission retrieved'));
  } catch (error: unknown) {
    console.error('Get submission error:', error);
    return res.status(500).json(formatError('Failed to retrieve submission'));
  }
});

// PATCH /api/forms/submissions/:id - Update submission status, notes, and shared platforms
router.patch('/submissions/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json(formatError('Unauthorized', 401));
    }

    const { status, notes, sharedTo } = req.body;
    const updateData: Record<string, unknown> = {};
    
    if (status) updateData.status = status;
    if (notes) updateData.notes = notes;
    if (sharedTo) updateData.sharedTo = sharedTo;

    const submission = await FormSubmission.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!submission) {
      return res.status(404).json(formatError('Submission not found', 404));
    }

    return res.json(formatResponse(submission, 'Submission updated'));
  } catch (error: unknown) {
    console.error('Update submission error:', error);
    return res.status(500).json(formatError('Failed to update submission'));
  }
});

// DELETE /api/forms/submissions/:id - Delete submission and cleanup related records
router.delete('/submissions/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json(formatError('Unauthorized', 401));
    }

    const submissionId = req.params.id;

    // Find the submission to check for duplicates
    const submission = await FormSubmission.findById(submissionId);

    if (!submission) {
      return res.status(404).json(formatError('Submission not found', 404));
    }

    // If this submission has duplicates, remove duplicate flag from those
    if (submission.duplicateSubmissions && submission.duplicateSubmissions.length > 0) {
      await FormSubmission.updateMany(
        { _id: { $in: submission.duplicateSubmissions } },
        { isDuplicate: false, duplicateOf: null }
      );
    }

    // If this is a duplicate, remove it from original's duplicateSubmissions
    if (submission.duplicateOf) {
      await FormSubmission.findByIdAndUpdate(
        submission.duplicateOf,
        {
          $pull: { duplicateSubmissions: submissionId },
          $set: { hasDuplicates: false }
        }
      );
    }

    // Delete the submission
    await FormSubmission.findByIdAndDelete(submissionId);

    return res.json(formatResponse(null, 'Submission deleted successfully'));
  } catch (error: unknown) {
    console.error('Delete submission error:', error);
    return res.status(500).json(formatError('Failed to delete submission'));
  }
});

// POST /api/forms/submissions/:id/share - Track share event with dedup and separate metrics
router.post('/submissions/:id/share', async (req: Request, res: Response) => {
  try {
    const { platform } = req.body;

    if (!platform) {
      return res.status(400).json(formatError('Platform is required'));
    }

    const ip = getClientIP(req);
    const userAgent = getUserAgent(req);

    const submission = await FormSubmission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json(formatError('Submission not found', 404));
    }

    // Check if this is a duplicate share attempt (same IP + platform within 5 seconds)
    const isDuplicate = await checkDedup(req.params.id, platform, ip);

    if (isDuplicate) {
      // Still return 200 but indicate it was deduplicated
      return res.json(
        formatResponse(
          {
            id: submission._id,
            shareCode: submission.shareCode,
            deduplicated: true,
            message: 'Share already tracked recently'
          },
          'Share was already tracked'
        )
      );
    }

    // Generate unique share code if this is the first share
    let shareCode = submission.shareCode;
    if (!shareCode) {
      // Generate new code (with uniqueness check)
      let newCode = generateShareCode();
      let attempts = 0;
      while (attempts < 5) {
        const existing = await FormSubmission.findOne({ shareCode: newCode });
        if (!existing) {
          shareCode = newCode;
          break;
        }
        newCode = generateShareCode();
        attempts++;
      }
    }

    // Record the share event in separate metrics
    const now = new Date();
    const updateData = {
      shareCode,
      'shareMetrics.clicks': {
        platform,
        timestamp: now,
        ip
      },
      'shareMetrics.intents': {
        platform,
        timestamp: now
      },
      lastShareTrack: {
        platform,
        ip,
        timestamp: now
      }
    };

    const updatedSubmission = await FormSubmission.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          shareCode,
          lastShareTrack: {
            platform,
            ip,
            timestamp: now
          }
        },
        $push: {
          'shareMetrics.clicks': {
            platform,
            timestamp: now,
            ip
          },
          'shareMetrics.intents': {
            platform,
            timestamp: now
          }
        },
        $addToSet: { sharedTo: platform }
      },
      { new: true }
    );

    return res.json(
      formatResponse(
        {
          id: updatedSubmission?._id,
          shareCode,
          message: 'Share tracked successfully'
        },
        'Share tracked'
      )
    );
  } catch (error: unknown) {
    console.error('Track share error:', error);
    return res.status(500).json(formatError('Failed to track share'));
  }
});

// GET /api/forms/public-stats - Get public statistics (NO AUTH)
router.get('/public-stats', async (req: Request, res: Response) => {
  try {
    const [totalSubmissions, uniqueShares, totalShares] = await Promise.all([
      FormSubmission.countDocuments(),
      FormSubmission.countDocuments({ 'shareMetrics.clicks.0': { $exists: true } }),
      FormSubmission.aggregate([
        { $unwind: { path: '$shareMetrics.clicks', preserveNullAndEmptyArrays: true } },
        { $count: 'totalShares' }
      ])
    ]);

    return res.json(
      formatResponse(
        {
          totalSubmissions,
          uniqueShares,
          totalShares: totalShares[0]?.totalShares || 0
        },
        'Public statistics retrieved'
      )
    );
  } catch (error: unknown) {
    console.error('Get public stats error:', error);
    return res.status(500).json(formatError('Failed to retrieve statistics'));
  }
});

// GET /api/forms/recent - Get recent submissions (public, NO AUTH)
router.get('/recent', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    
    const recentSubmissions = await FormSubmission.find({
      isDuplicate: false // Only show non-duplicate submissions
    })
      .select('_id parentName submittedAt')
      .sort({ submittedAt: -1 })
      .limit(limit);

    return res.json(
      formatResponse(
        {
          submissions: recentSubmissions
        },
        'Recent submissions retrieved'
      )
    );
  } catch (error: unknown) {
    console.error('Get recent submissions error:', error);
    return res.status(500).json(formatError('Failed to retrieve recent submissions'));
  }
});

// GET /api/forms/stats - Get statistics (admin only)
router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json(formatError('Unauthorized', 401));
    }

    const [totalSubmissions, byStatus, byAgeRange, bySource, recentSubmissions, topSharedPlatforms] = await Promise.all([
      FormSubmission.countDocuments(),
      FormSubmission.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      FormSubmission.aggregate([
        { $group: { _id: '$childAgeRange', count: { $sum: 1 } } }
      ]),
      FormSubmission.aggregate([
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      FormSubmission.find().sort({ submittedAt: -1 }).limit(10),
      FormSubmission.aggregate([
        { $unwind: '$sharedTo' },
        { $group: { _id: '$sharedTo', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    return res.json(
      formatResponse(
        {
          totalSubmissions,
          byStatus,
          byAgeRange,
          bySource,
          bySharedTo: topSharedPlatforms,
          recentSubmissions
        },
        'Statistics retrieved'
      )
    );
  } catch (error: unknown) {
    console.error('Get stats error:', error);
    return res.status(500).json(formatError('Failed to retrieve statistics'));
  }
});

export default router;
