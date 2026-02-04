import { Router, Response } from 'express';
import { z } from 'zod';
import { Admin } from '@/models/Admin';
import { generateToken, formatResponse, formatError } from '@/utils/helpers';
import { authenticate, AuthRequest } from '@/middleware/auth';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const createAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  role: z.enum(['super_admin', 'admin', 'viewer']).default('admin')
});

// POST /api/auth/login - Login
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json(formatError('Invalid email or password'));
    }

    const { email, password } = validation.data;

    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json(formatError('Invalid credentials', 401));
    }

    if (!admin.isActive) {
      return res.status(403).json(formatError('Account is inactive', 403));
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    const token = generateToken(admin._id.toString(), admin.role);

    return res.json(
      formatResponse(
        {
          token,
          admin: {
            id: admin._id,
            email: admin.email,
            fullName: admin.fullName,
            role: admin.role
          }
        },
        'Logged in successfully'
      )
    );
  } catch (error: unknown) {
    console.error('Login error:', error);
    return res.status(500).json(formatError('Login failed'));
  }
});

// POST /api/auth/register - Create admin (super_admin only)
router.post('/register', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Only super_admin can create new admins
    if (req.role !== 'super_admin') {
      return res.status(403).json(formatError('Only super admins can create users', 403));
    }

    const validation = createAdminSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json(formatError('Invalid data'));
    }

    const { email, password, fullName, role } = validation.data;

    // Check if admin already exists
    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(409).json(formatError('Email already in use', 409));
    }

    const admin = new Admin({
      email,
      password,
      fullName,
      role
    });

    await admin.save();

    return res.status(201).json(
      formatResponse(
        {
          id: admin._id,
          email: admin.email,
          fullName: admin.fullName,
          role: admin.role
        },
        'Admin created successfully'
      )
    );
  } catch (error: unknown) {
    console.error('Register error:', error);
    return res.status(500).json(formatError('Failed to create admin'));
  }
});

// GET /api/auth/me - Get current admin
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const admin = await Admin.findById(req.userId).select('-password');

    if (!admin) {
      return res.status(404).json(formatError('Admin not found', 404));
    }

    return res.json(formatResponse(admin, 'Admin retrieved'));
  } catch (error: unknown) {
    console.error('Get me error:', error);
    return res.status(500).json(formatError('Failed to retrieve admin'));
  }
});

// POST /api/auth/logout - Logout (frontend handles token deletion)
router.post('/logout', authenticate, (req: AuthRequest, res: Response) => {
  return res.json(formatResponse({}, 'Logged out successfully'));
});

export default router;
