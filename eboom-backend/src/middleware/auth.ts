import { Request, Response, NextFunction } from 'express';
import supabase from "../supabaseClient";

export default async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const auth = req.headers.authorization;
  if (!auth)
    return res.status(401).json({ error: "Missing authorization header" });
  const token = auth.replace(/^Bearer\s+/i, "");
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user)
      return res.status(401).json({ error: "Invalid token" });
    req.user = data.user;
    next();
  } catch (err) {
    console.error("auth error", err);
    res.status(500).json({ error: "Authentication failed" });
  }
}

