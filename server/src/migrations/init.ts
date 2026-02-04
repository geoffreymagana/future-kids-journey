import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Admin } from '@/models/Admin';

dotenv.config();

const initializeDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/future-kids-journey');
    console.log('✅ Connected to MongoDB');

    // Create super admin if it doesn't exist
    const existingAdmin = await Admin.findOne({
      email: process.env.ADMIN_EMAIL
    });

    if (existingAdmin) {
      console.log('✅ Super admin already exists');
    } else {
      const superAdmin = new Admin({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        fullName: 'Super Administrator',
        role: 'super_admin',
        isActive: true
      });

      await superAdmin.save();
      console.log('✅ Super admin created successfully');
      console.log(`📧 Email: ${superAdmin.email}`);
      console.log('🔑 Password: (as set in .env)');
    }

    console.log('\n✨ Database initialized successfully!');
    process.exit(0);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Initialization failed:', errorMessage);
    process.exit(1);
  }
};

initializeDatabase();
