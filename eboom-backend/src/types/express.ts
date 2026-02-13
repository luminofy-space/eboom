import { User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '../db/schema';

declare global {
  namespace Express {
    interface Request {
      user?: SupabaseUser;
      appUser?: User;
    }
  }
}

export {};

