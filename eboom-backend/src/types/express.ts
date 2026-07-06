import { User } from '../db/schema';
import type { CanvasMembership } from '../services/canvasAccessService';

declare global {
  namespace Express {
    interface Request {
      appUser?: User;
      canvasId?: number;
      canvasMembership?: CanvasMembership;
    }
  }
}

export {};
