import { User } from '../db/schema';

declare global {
  namespace Express {
    interface Request {
      appUser?: User;
    }
  }
}

export {};
