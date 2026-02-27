import { Request } from "express";
import { db } from "../../db/client";
import { canvasMembers } from "../../db/schema";
import { eq, and } from "drizzle-orm";

export function parsePaginationParams(req: Request) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const search = (req.query.search as string) || "";
  const offset = (page - 1) * limit;
  return { page, limit, search, offset };
}

export async function checkCanvasAccess(
  canvasId: number,
  userId: number
): Promise<boolean> {
  const [membership] = await db
    .select()
    .from(canvasMembers)
    .where(
      and(eq(canvasMembers.canvasId, canvasId), eq(canvasMembers.userId, userId))
    );
  return !!membership;
}
