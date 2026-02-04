import mongoose, { Document, Schema } from 'mongoose';

export interface IPaymentTerms extends Document {
  // Commission rates (in percentage)
  signupCommissionRate: number; // DEPRECATED: Use attendanceCommissionRate instead
  attendanceCommissionRate: number; // e.g., 15% for workshop attendance
  enrollmentCommissionRate: number; // e.g., 25% when parent enrolls
  
  // Event settings
  eventTicketValue: number; // Default ticket price per child (KES, can override per enrollment)
  
  // Payment terms and conditions
  currency: string; // INR, USD, etc.
  minimumPayoutAmount?: number | null; // Minimum amount before payout is triggered (optional)
  payoutFrequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  payoutDay: number; // Day of week (0-6) or day of month (1-31)
  
  // Tax settings (optional)
  taxRate?: number | null; // e.g., 18% GST (optional)
  includesTax?: boolean;
  
  // Last updated info
  updatedBy: string; // Admin email who last updated
  updatedAt: Date;
  
  // Status
  isActive: boolean;
  effectiveFrom: Date;
  effectiveUntil?: Date;
  
  // Additional terms
  notes?: string;
}

const paymentTermsSchema = new Schema<IPaymentTerms>(
  {
    signupCommissionRate: {
      type: Number,
      deprecated: true,
      min: 0,
      max: 100,
      default: 15
    },
    attendanceCommissionRate: {
      type: Number,
      required: [true, 'Attendance commission rate is required'],
      min: 0,
      max: 100,
      default: 15
    },
    enrollmentCommissionRate: {
      type: Number,
      required: [true, 'Enrollment commission rate is required'],
      min: 0,
      max: 100,
      default: 25
    },
    eventTicketValue: {
      type: Number,
      required: [true, 'Event ticket value is required'],
      min: 0,
      default: 0,
      description: 'Default ticket price per child (in currency set)'
    },
    currency: {
      type: String,
      default: 'KES',
      enum: ['KES', 'INR', 'USD', 'EUR', 'GBP']
    },
    minimumPayoutAmount: {
      type: Number,
      default: null,
      min: 0,
      sparse: true
    },
    payoutFrequency: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly', 'quarterly'],
      default: 'monthly'
    },
    payoutDay: {
      type: Number,
      default: 15, // 15th of month by default
      min: 0,
      max: 31
    },
    taxRate: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
      sparse: true
    },
    includesTax: {
      type: Boolean,
      default: false
    },
    updatedBy: {
      type: String,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    effectiveFrom: {
      type: Date,
      default: Date.now
    },
    effectiveUntil: Date,
    notes: String
  },
  {
    timestamps: false, // We use updatedAt manually
    collection: 'payment_terms'
  }
);

// Pre-save to update timestamp
paymentTermsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Only one active payment terms should exist at a time
paymentTermsSchema.index({ isActive: 1, effectiveFrom: -1 });

export const PaymentTerms = mongoose.model<IPaymentTerms>(
  'PaymentTerms',
  paymentTermsSchema
);
