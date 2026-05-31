import { db } from '../../db/client';
import { User, users } from '../../db/schema';
import { eq } from 'drizzle-orm';

export async function getUserByAppUserId(appUserId: number): Promise<User | null> {
  try {
    const [appUser] = await db.select().from(users).where(eq(users.id, appUserId));
    if (!appUser) return null;

    return appUser;
  } catch (error) {
    console.error('Error fetching user from users table:', error);
    return null;
  }
}

export function formatUserResponse(appUser: User): Partial<User> {
  return {
    id: appUser.id,
    email: appUser.email,
    firstName: appUser.firstName,
    lastName: appUser.lastName,
    age: appUser.age,
    photoUrl: appUser.photoUrl,
    phone: appUser.phone,
    emailVerified: appUser.emailVerified || false,
  };
}

export interface TokenData {
  userId: string;
  email: string;
  expiresAt: Date;
}

export const resetTokens = new Map<string, TokenData>();
export const verificationTokens = new Map<string, TokenData>();

setInterval(() => {
  const now = new Date();
  for (const [token, data] of resetTokens.entries()) {
    if (data.expiresAt < now) {
      resetTokens.delete(token);
    }
  }
  for (const [token, data] of verificationTokens.entries()) {
    if (data.expiresAt < now) {
      verificationTokens.delete(token);
    }
  }
}, 60 * 60 * 1000);
