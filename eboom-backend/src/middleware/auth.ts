import { Request, Response, NextFunction } from 'express';
import supabase from "../supabaseClient";
import { db } from "../db/client";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export default async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // ============================================================================
  // TESTING BYPASS - If TEST_USER_ID env var is set, bypass authentication
  // Set TEST_USER_ID in .env to a valid user ID for testing
  // ============================================================================
  const TEST_USER_ID = process.env.TEST_USER_ID ? parseInt(process.env.TEST_USER_ID) : null;

  if (TEST_USER_ID !== null && !isNaN(TEST_USER_ID)) {
    try {
      console.log('IDDD:', TEST_USER_ID)
      const [appUser] = await db.select().from(users).where(eq(users.id, TEST_USER_ID));
      if (!appUser) {
        return res.status(401).json({ error: "Test user not found in database" });
      }

      // Create a mock Supabase user object
      req.user = {
        id: TEST_USER_ID,
        email: appUser.email,
        user_metadata: {
          appUserId: appUser.id,
        },
      } as any;
      console.log('done')
      req.appUser = appUser;

      console.log(`TESTING MODE: Bypassing auth for user ID ${TEST_USER_ID}`);
      return next();
    } catch (err) {
      console.error("Test user fetch error:", err);
      return res.status(500).json({ error: "Failed to fetch test user" });
    }
  }

  // ============================================================================
  // NORMAL AUTHENTICATION
  // ============================================================================
  const auth = req.headers.authorization;
  if (!auth)
    return res.status(401).json({ error: "Missing authorization header" });
  const token = auth.replace(/^Bearer\s+/i, "");
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user)
      return res.status(401).json({ error: "Invalid token" });

    // Attach Supabase user to request
    req.user = data.user;

    // Optionally fetch and attach app user details
    const appUserId = data.user.user_metadata?.appUserId;
    if (appUserId) {
      const [appUser] = await db.select().from(users).where(eq(users.id, appUserId));
      if (appUser) {
        req.appUser = appUser;
      }
    }

    next();
  } catch (err) {
    console.error("auth error", err);
    res.status(500).json({ error: "Authentication failed" });
  }
}

