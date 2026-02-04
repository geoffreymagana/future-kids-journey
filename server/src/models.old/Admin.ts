import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAdmin extends Document {
  email: string;
  password: string;
  fullName: string;
  role: 'super_admin' | 'admin' | 'viewer';
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const adminSchema = new Schema<IAdmin>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([-.]?\w+)*@\w+([-.]?\w+)*(.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false // Don't return password by default
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required']
    },
    role: {
      type: String,
      enum: ['super_admin', 'admin', 'viewer'],
      default: 'admin'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: Date
  },
  {
    timestamps: true,
    collection: 'admins'
  }
);

// Hash password before saving
adminSchema.pre<IAdmin>('save', async function (this: IAdmin & { isModified: (field: string) => boolean }, next: (err?: Error) => void) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare passwords
adminSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

export const Admin = mongoose.model<IAdmin>('Admin', adminSchema);
