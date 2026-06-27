import { Request, Response, NextFunction } from 'express';
import { db } from "../db/client";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { verifyAccessToken } from "../services/jwtService";

export default async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const TEST_USER_ID = process.env.TEST_USER_ID ? parseInt(process.env.TEST_USER_ID) : null;

  if (TEST_USER_ID !== null && !isNaN(TEST_USER_ID)) {
    try {
      const [appUser] = await db.select().from(users).where(eq(users.id, TEST_USER_ID));
      if (!appUser) {
        return res.status(401).json({ error: "Test user not found in database" });
      }

      req.appUser = appUser;
      console.log(`TESTING MODE: Bypassing auth for user ID ${TEST_USER_ID}`);
      return next();
    } catch (err) {
      console.error("Test user fetch error:", err);
      return res.status(500).json({ error: "Failed to fetch test user" });
    }
  }

  const auth = req.headers.authorization;
  if (!auth)
    return res.status(401).json({ error: "Missing authorization header" });

  const token = auth.replace(/^Bearer\s+/i, "");
  try {
    const payload = verifyAccessToken(token);
    const [appUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.sub));

    if (!appUser) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.appUser = appUser;
    next();
  } catch (err) {
    console.error("auth error", err);
    return res.status(401).json({ error: "Invalid token" });
  }
}
