import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
  role?: string;
  adminRole?: string; // 'super_admin' | 'admin' | 'viewer'
  headers: Request['headers'];
  body: Record<string, unknown>;
  query: Record<string, string | string[] | undefined>;
  params: Record<string, string>;
}

export interface DecodedToken {
  userId: string;
  role: string;
  email?: string;
  adminRole?: string;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = (req.headers.authorization as string | undefined)?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as DecodedToken;
    req.userId = decoded.userId;
    req.role = decoded.role;
    req.userEmail = decoded.email;
    req.adminRole = decoded.adminRole;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.role || !roles.includes(req.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    next();
  };
};
