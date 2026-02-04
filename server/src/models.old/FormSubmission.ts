import mongoose, { Document, Schema } from 'mongoose';

export interface IFormSubmission extends Document {
  parentName: string;
  whatsappNumber: string;
  childAgeRange: string;
  numberOfKids?: number; // NEW: How many kids the parent has
  referralLink?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string; // NEW: Browser session ID for duplicate detection
  submittedAt: Date;
  status: 'new' | 'contacted' | 'enrolled' | 'no_response';
  notes?: string;
  source?: 'facebook' | 'instagram' | 'twitter' | 'whatsapp' | 'reddit' | 'telegram' | 'tiktok' | 'linkedin' | 'direct' | 'email' | 'organic' | 'other';
  sharedTo?: Array<'facebook' | 'instagram' | 'twitter' | 'whatsapp' | 'reddit' | 'telegram' | 'tiktok' | 'linkedin' | 'email' | 'copy'>;
  
  // Duplicate detection
  isDuplicate: boolean; // Flag indicating this is a duplicate submission
  duplicateOf?: string; // Reference to the original submission ID
  hasDuplicates: boolean; // Flag indicating other submissions are duplicates of this one
  duplicateSubmissions?: string[]; // References to duplicate submission IDs
  
  // Production analytics: separate share tracking metrics
  shareCode?: string; // Unique code for /s/:code redirect tracking
  shareMetrics?: {
    clicks: Array<{
      platform: string;
      timestamp: Date;
      ip?: string;
    }>;
    intents: Array<{
      platform: string;
      timestamp: Date;
    }>;
    visits: Array<{
      code: string;
      timestamp: Date;
      ip?: string;
      userAgent?: string;
    }>;
  };
  lastShareTrack?: {
    platform: string;
    ip: string;
    timestamp: Date;
  }; // For dedup: track last share to prevent duplicates within 5 second window
}

const formSubmissionSchema = new Schema<IFormSubmission>(
  {
    parentName: {
      type: String,
      required: [true, 'Parent name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters']
    },
    whatsappNumber: {
      type: String,
      required: [true, 'WhatsApp number is required'],
      trim: true
    },
    childAgeRange: {
      type: String,
      required: [true, 'Child age range is required'],
      enum: ['5-7', '8-10', '11-14']
    },
    numberOfKids: {
      type: Number,
      default: 1,
      min: 1,
      max: 10
    },
    referralLink: String,
    ipAddress: String,
    userAgent: String,
    sessionId: String, // Browser session ID for duplicate detection
    status: {
      type: String,
      enum: ['new', 'contacted', 'enrolled', 'no_response'],
      default: 'new'
    },
    notes: String,
    source: {
      type: String,
      enum: ['facebook', 'instagram', 'twitter', 'whatsapp', 'reddit', 'telegram', 'tiktok', 'linkedin', 'direct', 'email', 'organic', 'other'],
      default: 'direct'
    },
    sharedTo: [{
      type: String,
      enum: ['facebook', 'instagram', 'twitter', 'whatsapp', 'reddit', 'telegram', 'tiktok', 'linkedin', 'email', 'copy']
    }],
    isDuplicate: {
      type: Boolean,
      default: false,
      index: true
    },
    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FormSubmission',
      default: null
    },
    hasDuplicates: {
      type: Boolean,
      default: false,
      index: true
    },
    duplicateSubmissions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FormSubmission'
    }],
    shareCode: {
      type: String,
      unique: true,
      sparse: true
    },
    shareMetrics: {
      clicks: [{
        platform: String,
        timestamp: { type: Date, default: Date.now },
        ip: String
      }],
      intents: [{
        platform: String,
        timestamp: { type: Date, default: Date.now }
      }],
      visits: [{
        code: String,
        timestamp: { type: Date, default: Date.now },
        ip: String,
        userAgent: String
      }]
    },
    lastShareTrack: {
      platform: String,
      ip: String,
      timestamp: Date
    }
  },
  {
    timestamps: true,
    collection: 'form_submissions'
  }
);

// Index for faster queries
formSubmissionSchema.index({ submittedAt: -1 });
formSubmissionSchema.index({ status: 1 });
formSubmissionSchema.index({ childAgeRange: 1 });
formSubmissionSchema.index({ source: 1 });
formSubmissionSchema.index({ 'sharedTo': 1 });
formSubmissionSchema.index({ shareCode: 1 }); // For /s/:code redirect lookups
formSubmissionSchema.index({ 'lastShareTrack.ip': 1, 'lastShareTrack.platform': 1, 'lastShareTrack.timestamp': -1 }); // For dedup queries
formSubmissionSchema.index({ whatsappNumber: 1, submittedAt: -1 }); // For duplicate detection
formSubmissionSchema.index({ isDuplicate: 1, hasDuplicates: 1 }); // For finding duplicates

export const FormSubmission = mongoose.model<IFormSubmission>(
  'FormSubmission',
  formSubmissionSchema
);
