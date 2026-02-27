import express, { Request, Response } from "express";
import { db } from "../../db/client";
import {
  incomeResources,
  incomeResourceCategories,
} from "../../db/schema";
import { eq, and, ilike, count, desc } from "drizzle-orm";
import { parsePaginationParams, checkCanvasAccess } from "./helpers";

const router = express.Router({ mergeParams: true });

// GET /canvases/:canvasId/income-resources - Get all income resources for a canvas
router.get("/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseInt(req.params.canvasId);
  if (isNaN(canvasId)) {
    return res.status(400).json({ error: "Invalid canvas ID" });
  }

  try {
    const hasAccess = await checkCanvasAccess(canvasId, user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied to this canvas" });
    }

    const { page, limit, search, offset } = parsePaginationParams(req);

    const whereCondition = search
      ? and(eq(incomeResources.canvasId, canvasId), eq(incomeResources.isArchived, false), ilike(incomeResources.name, `%${search}%`))
      : and(eq(incomeResources.canvasId, canvasId), eq(incomeResources.isArchived, false));

    const [{ total }] = await db
      .select({ total: count() })
      .from(incomeResources)
      .where(whereCondition);

    const resources = await db
      .select({
        incomeResource: incomeResources,
        category: incomeResourceCategories,
      })
      .from(incomeResources)
      .leftJoin(
        incomeResourceCategories,
        eq(incomeResources.incomeResourceCategoryId, incomeResourceCategories.id)
      )
      .where(whereCondition)
      .orderBy(desc(incomeResources.lastModifiedAt))
      .limit(limit)
      .offset(offset);

    const formattedResources = resources.map((r) => ({
      ...r.incomeResource,
      category: r.category,
    }));

    res.json({ incomeResources: formattedResources, items: formattedResources, total, page, limit });
  } catch (err) {
    console.error("Error fetching income resources:", err);
    res.status(500).json({ error: "Failed to fetch income resources" });
  }
});

// POST /canvases/:canvasId/income-resources - Create a new income resource
router.post("/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseInt(req.params.canvasId);
  if (isNaN(canvasId)) {
    return res.status(400).json({ error: "Invalid canvas ID" });
  }

  const {
    name,
    incomeResourceCategoryId,
    currency,
    amount,
    isRecurring,
    recurrencePattern,
    photoUrl,
    description,
  } = req.body;

  if (!name || !incomeResourceCategoryId) {
    return res.status(400).json({
      error: "Name, category is required",
    });
  }

  try {
    const hasAccess = await checkCanvasAccess(canvasId, user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied to this canvas" });
    }

    const [newResource] = await db
      .insert(incomeResources)
      .values({
        canvasId,
        name,
        incomeResourceCategoryId,
        amount,
        currency,
        isRecurring: isRecurring || false,
        ownerId: user.id,
        recurrencePattern: recurrencePattern || null,
        photoUrl: photoUrl || null,
        description: description || null,
        createdBy: user.id,
        lastModifiedBy: user.id,
      })
      .returning();

    res.status(201).json({ incomeResource: newResource });
  } catch (err) {
    console.error("Error creating income resource:", err);
    res.status(500).json({ error: "Failed to create income resource" });
  }
});

export default router;
