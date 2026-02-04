import jwt from 'jsonwebtoken';

export const generateToken = (userId: string, role: string): string => {
  return jwt.sign(
    { 
      sub: userId,
      userId, 
      role,
      adminRole: role // Include adminRole field for middleware
    },
    process.env.JWT_SECRET || 'default_secret',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

export const formatResponse = (data: any, message: string = 'Success') => {
  return {
    success: true,
    message,
    data
  };
};

export const formatError = (message: string, statusCode: number = 400) => {
  return {
    success: false,
    message,
    statusCode
  };
};
