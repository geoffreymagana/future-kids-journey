import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document {
  // Reference to enrollment and submission
  enrollmentId: mongoose.Types.ObjectId;
  submissionId: mongoose.Types.ObjectId;
  
  // Workshop information
  workshopDate: Date; // Date of the workshop
  attendanceDate?: Date; // When they actually attended (null if absent/pending)
  qrCode: string; // Unique QR code for check-in
  
  // Status tracking
  status: 'pending' | 'attended' | 'absent' | 'cancelled';
  notes?: string; // Optional notes about attendance
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  recordedBy?: string; // Admin email who recorded attendance
  recordedAt?: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    enrollmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Enrollment',
      required: [true, 'Enrollment ID is required'],
      index: true
    },
    submissionId: {
      type: Schema.Types.ObjectId,
      ref: 'FormSubmission',
      required: [true, 'Submission ID is required'],
      index: true
    },
    workshopDate: {
      type: Date,
      required: [true, 'Workshop date is required'],
      index: true
    },
    attendanceDate: {
      type: Date,
      default: null,
      sparse: true
    },
    qrCode: {
      type: String,
      required: [true, 'QR code is required'],
      unique: true,
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'attended', 'absent', 'cancelled'],
      default: 'pending',
      index: true
    },
    notes: {
      type: String,
      default: null
    },
    recordedBy: {
      type: String,
      default: null
    },
    recordedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'attendances'
  }
);

// Index for efficient queries by enrollment and date range
attendanceSchema.index({ enrollmentId: 1, workshopDate: 1 });
attendanceSchema.index({ submissionId: 1, workshopDate: 1 });
attendanceSchema.index({ status: 1, workshopDate: 1 });

export const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);
