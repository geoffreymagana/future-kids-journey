import mongoose, { Document, Schema } from 'mongoose';

export interface IEnrollment extends Document {
  submissionId: mongoose.Types.ObjectId; // Reference to FormSubmission
  parentName: string;
  whatsappNumber: string;
  childAgeRange: string;
  numberOfKids: number; // NEW: Number of kids being enrolled (can differ from signup)
  
  // Enrollment Status Tracking
  status: 'inquiry' | 'enrolled' | 'completed' | 'cancelled' | 'no_show';
  workshopAttended: boolean; // NEW: Did parent attend workshop
  enrollmentDate?: Date;
  completionDate?: Date;
  
  // Payment Tracking
  paymentStatus: 'unpaid' | 'partial' | 'full' | 'refunded';
  totalAmount: number; // Total enrollment cost (set manually by admin)
  paidAmount: number; // Amount already paid
  pendingAmount: number; // Amount still owed
  
  // Payment History
  payments?: Array<{
    date: Date;
    amount: number;
    method: 'cash' | 'bank_transfer' | 'upi' | 'cheque' | 'other';
    notes?: string;
    recordedBy?: string; // Admin ID who recorded payment
    mpesaReference?: string;
  }>;
  
  // Commission Tracking (auto-calculated based on status and PaymentTerms)
  commissionEarned?: {
    signupCommission?: number; // From initial signup
    enrollmentCommission?: number; // From enrollment
    totalCommission?: number; // Total earned
    currency?: string; // INR, USD, etc.
  };
  
  // Manual Notes
  notes?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>(
  {
    submissionId: {
      type: Schema.Types.ObjectId,
      ref: 'FormSubmission',
      required: [true, 'Submission ID is required'],
      unique: true
    },
    parentName: {
      type: String,
      required: [true, 'Parent name is required']
    },
    whatsappNumber: {
      type: String,
      required: [true, 'WhatsApp number is required']
    },
    childAgeRange: {
      type: String,
      enum: ['5-7', '8-10', '11-14'],
      required: [true, 'Child age range is required']
    },
    numberOfKids: {
      type: Number,
      default: 1,
      min: 1,
      max: 10,
      required: true
    },
    
    // Enrollment Status
    status: {
      type: String,
      enum: ['inquiry', 'enrolled', 'completed', 'cancelled', 'no_show'],
      default: 'inquiry'
    },
    workshopAttended: {
      type: Boolean,
      default: false
    },
    enrollmentDate: Date,
    completionDate: Date,
    
    // Payment Tracking
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partial', 'full', 'refunded'],
      default: 'unpaid'
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    pendingAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    
    // Payment History
    payments: [{
      date: { type: Date, default: Date.now },
      amount: { type: Number, required: true, min: 0 },
      method: {
        type: String,
        enum: ['cash', 'bank_transfer', 'mpesa', 'upi', 'cheque', 'other'],
        required: true
      },
      notes: String,
      recordedBy: String, // Admin user ID who recorded payment
      mpesaReference: String
    }],
    
    // Commission Tracking
    commissionEarned: {
      signupCommission: { type: Number, default: 0 },
      enrollmentCommission: { type: Number, default: 0 },
      totalCommission: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' }
    },
    
    notes: String
  },
  {
    timestamps: true,
    collection: 'enrollments'
  }
);

// Indexes for efficient queries
enrollmentSchema.index({ submissionId: 1 });
enrollmentSchema.index({ status: 1 });
enrollmentSchema.index({ paymentStatus: 1 });
enrollmentSchema.index({ createdAt: -1 });
enrollmentSchema.index({ enrollmentDate: -1 });
enrollmentSchema.index({ 'commissionEarned.totalCommission': -1 }); // For revenue sorting

// Pre-save hook to calculate pending amount
enrollmentSchema.pre('save', function(next) {
  if (this.totalAmount && this.paidAmount !== undefined) {
    this.pendingAmount = Math.max(0, this.totalAmount - this.paidAmount);
    
    // Auto-update payment status based on amounts
    if (this.paidAmount === 0) {
      this.paymentStatus = 'unpaid';
    } else if (this.paidAmount >= this.totalAmount) {
      this.paymentStatus = 'full';
    } else {
      this.paymentStatus = 'partial';
    }
  }
  next();
});

export const Enrollment = mongoose.model<IEnrollment>(
  'Enrollment',
  enrollmentSchema
);
