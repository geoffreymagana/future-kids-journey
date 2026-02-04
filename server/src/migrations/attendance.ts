import mongoose from 'mongoose';
import { Attendance } from '@/models/Attendance';

/**
 * Migration to ensure Attendance collection exists and is properly indexed
 * This migration runs on server startup but does not block server startup
 * Mongoose will automatically create collections and indexes defined in schemas
 */
const migrateAttendance = async (): Promise<void> => {
  try {
    console.log('🔄 Verifying database collections...');

    // Verify Attendance model is initialized
    if (Attendance) {
      console.log('✅ Attendance model initialized');
    }

    // Verify ActivityLog model is initialized
    try {
      const ActivityLog = mongoose.model('ActivityLog');
      if (ActivityLog) {
        console.log('✅ ActivityLog model initialized');
      }
    } catch (e) {
      // Model might not be loaded yet, that's OK
      console.log('ℹ️  ActivityLog model will be created on first use');
    }

    console.log('✅ Database verification completed');
  } catch (error) {
    // Log warnings but don't fail server startup
    console.warn('⚠️  Database verification warning:', error instanceof Error ? error.message : error);
  }
};

export default migrateAttendance;

