import mongoose, { Document, Schema } from 'mongoose';

export interface IActivityLog extends Document {
  adminId: mongoose.Types.ObjectId;
  adminEmail?: string;
  action: string; // 'create_enrollment', 'record_payment', 'update_enrollment', etc.
  resource: string; // 'enrollment', 'payment', 'submission', 'admin', 'settings'
  resourceId?: mongoose.Types.ObjectId;
  details?: Record<string, unknown>;
  status: 'success' | 'error';
  errorMessage?: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
      index: true
    },
    adminEmail: String,
    action: {
      type: String,
      required: true,
      index: true
    },
    resource: {
      type: String,
      required: true,
      index: true
    },
    resourceId: mongoose.Types.ObjectId,
    details: Schema.Types.Mixed,
    status: {
      type: String,
      enum: ['success', 'error'],
      required: true,
      index: true
    },
    errorMessage: String,
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    ipAddress: String,
    userAgent: String
  },
  { 
    timestamps: false,
    collection: 'activity_logs'
  }
);

// Create indexes for efficient querying
activityLogSchema.index({ timestamp: -1 });
activityLogSchema.index({ adminId: 1, timestamp: -1 });
activityLogSchema.index({ resource: 1, timestamp: -1 });
activityLogSchema.index({ status: 1, timestamp: -1 });

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', activityLogSchema);
