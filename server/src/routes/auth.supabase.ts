import { Router, Response } from 'express';
import { z } from 'zod';
import bcryptjs from 'bcryptjs';
import { supabaseAdmin } from '../lib/supabase.js';
import { generateToken, formatResponse, formatError } from '../utils/helpers.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const createAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['super_admin', 'admin']).default('admin')
});

// POST /api/auth/login - Login
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json(formatError('Invalid email or password'));
    }

    const { email, password } = validation.data;

    // Get admin from database
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('email', email)
      .single();

    if (adminError || !admin) {
      return res.status(401).json(formatError('Invalid credentials', 401));
    }

    // Check password
    const passwordMatch = await bcryptjs.compare(password, admin.password_hash);
    if (!passwordMatch) {
      return res.status(401).json(formatError('Invalid credentials', 401));
    }

    if (!admin.is_active) {
      return res.status(403).json(formatError('Account is inactive', 403));
    }

    // Generate token
    const token = generateToken(admin.id, admin.role);

    return res.json(
      formatResponse(
        {
          token,
          admin: {
            id: admin.id,
            email: admin.email,
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

// POST /api/auth/setup - Create first admin (only works if no admins exist)
router.post('/setup', async (req: AuthRequest, res: Response) => {
  try {
    // Check if any admins already exist
    const { count } = await supabaseAdmin
      .from('admins')
      .select('*', { count: 'exact', head: true });

    if (count && count > 0) {
      return res.status(403).json(formatError('Setup already completed. Use /register to create additional admins.', 403));
    }

    const validation = createAdminSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json(formatError('Invalid data'));
    }

    const { email, password } = validation.data;

    // Hash password
    const passwordHash = await bcryptjs.hash(password, 10);

    // Create first admin as super_admin
    const { data: admin, error } = await supabaseAdmin
      .from('admins')
      .insert({
        email,
        password_hash: passwordHash,
        role: 'super_admin',
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    // Generate token
    const token = generateToken(admin.id, admin.role);

    return res.status(201).json(
      formatResponse(
        {
          token,
          admin: {
            id: admin.id,
            email: admin.email,
            role: admin.role
          }
        },
        'Admin created successfully'
      )
    );
  } catch (error: unknown) {
    console.error('Setup error:', error);
    return res.status(500).json(formatError('Setup failed'));
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

    const { email, password, role } = validation.data;

    // Check if admin already exists
    const { data: existing } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return res.status(409).json(formatError('Email already in use', 409));
    }

    // Hash password
    const passwordHash = await bcryptjs.hash(password, 10);

    // Create new admin
    const { data: admin, error } = await supabaseAdmin
      .from('admins')
      .insert({
        email,
        password_hash: passwordHash,
        role,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json(
      formatResponse(
        {
          id: admin.id,
          email: admin.email,
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
    const { data: admin, error } = await supabaseAdmin
      .from('admins')
      .select('id, email, role, is_active')
      .eq('id', req.userId)
      .single();

    if (error || !admin) {
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

// GET /api/auth/admins - List all admins (super_admin only)
router.get('/admins', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (req.role !== 'super_admin') {
      return res.status(403).json(formatError('Only super admins can view admins', 403));
    }

    const { data: admins, error } = await supabaseAdmin
      .from('admins')
      .select('id, email, role, is_active, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.json(formatResponse(admins, 'Admins retrieved'));
  } catch (error: unknown) {
    console.error('Get admins error:', error);
    return res.status(500).json(formatError('Failed to retrieve admins'));
  }
});

// PATCH /api/auth/admins/:id - Update admin status (super_admin only)
router.patch('/admins/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (req.role !== 'super_admin') {
      return res.status(403).json(formatError('Only super admins can update admins', 403));
    }

    const { is_active, role } = req.body;
    const updateData: Record<string, unknown> = {};
    
    if (is_active !== undefined) updateData.is_active = is_active;
    if (role !== undefined) updateData.role = role;

    const { data: admin, error } = await supabaseAdmin
      .from('admins')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !admin) {
      return res.status(404).json(formatError('Admin not found', 404));
    }

    return res.json(formatResponse(admin, 'Admin updated'));
  } catch (error: unknown) {
    console.error('Update admin error:', error);
    return res.status(500).json(formatError('Failed to update admin'));
  }
});

export default router;
