import { Request, Response, NextFunction } from 'express';

export type UserRole = 'admin' | 'user';

export const requireRole = (...roles: UserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.appUser) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = 'user';

    if (!roles.includes(userRole as UserRole)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `This action requires one of the following roles: ${roles.join(', ')}`,
      });
    }

    (req as any).userRole = userRole;
    next();
  };
};

export const requireUser = requireRole("user");
export const requireAdmin = requireRole("admin");
