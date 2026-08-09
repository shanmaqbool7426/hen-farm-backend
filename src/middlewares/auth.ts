import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export interface AuthedRequest extends Request {
  userId?: string;
  userRole?: 'buyer' | 'seller' | 'admin';
}

// Verifies the Bearer token and trusts req.userId/req.userRole from it alone -
// never from client-supplied body/query/params. This is what makes every
// "is this really you" check in the app real instead of honor-system.
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    req.userRole = payload.role;
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired session - please log in again' });
  }
}

export function requireAdminRole(req: AuthedRequest, res: Response, next: NextFunction) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ success: false, error: 'Only platform admin can perform this action' });
  }
  next();
}
