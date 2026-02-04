import { ActivityLog } from '@/models/ActivityLog';

export interface LogEntry {
  adminId: string;
  adminEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  status: 'success' | 'error';
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an activity to the database
 */
export const logActivity = async (entry: LogEntry): Promise<void> => {
  try {
    await ActivityLog.create({
      adminId: entry.adminId,
      adminEmail: entry.adminEmail,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      details: entry.details,
      status: entry.status,
      errorMessage: entry.errorMessage,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      timestamp: new Date()
    });
  } catch (error) {
    // Log to console but don't throw - logging shouldn't break the main operation
    console.error('Failed to log activity:', error);
  }
};

/**
 * Helper to log successful operation
 */
export const logSuccess = async (
  adminId: string,
  action: string,
  resource: string,
  resourceId?: string,
  details?: Record<string, unknown>,
  adminEmail?: string
): Promise<void> => {
  await logActivity({
    adminId,
    adminEmail,
    action,
    resource,
    resourceId,
    details,
    status: 'success'
  });
};

/**
 * Helper to log failed operation
 */
export const logError = async (
  adminId: string,
  action: string,
  resource: string,
  error: Error | string,
  resourceId?: string,
  adminEmail?: string
): Promise<void> => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  await logActivity({
    adminId,
    adminEmail,
    action,
    resource,
    resourceId,
    status: 'error',
    errorMessage
  });
};

/**
 * Helper to log with custom fields
 */
export const logWithDetails = async (
  adminId: string,
  action: string,
  resource: string,
  details: Record<string, unknown>,
  resourceId?: string,
  adminEmail?: string
): Promise<void> => {
  await logActivity({
    adminId,
    adminEmail,
    action,
    resource,
    resourceId,
    details,
    status: 'success'
  });
};
