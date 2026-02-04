import { Request } from 'express';
import { FormSubmission } from '@/models/FormSubmission';

export const getClientIP = (req: Request): string => {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
};

export const getUserAgent = (req: Request): string => {
  return req.headers['user-agent'] || 'unknown';
};

/**
 * Generate a unique short code for referral link tracking
 * Format: 6-character alphanumeric code (lowercase)
 * Examples: abc123, xyz789
 */
export const generateShareCode = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Check if a share event is a duplicate (prevent double-counting)
 * Returns true if duplicate detected (same IP + platform within 5 second window)
 * Returns false if this is a new/unique share event
 */
export const checkDedup = async (
  submissionId: string,
  platform: string,
  ip: string
): Promise<boolean> => {
  try {
    const submission = await FormSubmission.findById(submissionId);
    
    if (!submission?.lastShareTrack) {
      return false; // First share, not a duplicate
    }

    const lastTrack = submission.lastShareTrack;
    const timeDiff = Date.now() - lastTrack.timestamp.getTime();
    const DEDUP_WINDOW_MS = 5000; // 5 second window

    // Duplicate if: same IP + same platform + within 5 seconds
    if (
      lastTrack.ip === ip &&
      lastTrack.platform === platform &&
      timeDiff < DEDUP_WINDOW_MS
    ) {
      return true; // This is a duplicate
    }

    return false; // Not a duplicate
  } catch (error) {
    console.error('Dedup check error:', error);
    return false; // On error, allow it (don't block legitimate shares)
  }
};

