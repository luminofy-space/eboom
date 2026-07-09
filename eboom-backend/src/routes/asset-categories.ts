import express, { Request, Response } from "express";
import { db } from "../db/client";
import { assetCategories } from "../db/schema";
import { eq, asc } from "drizzle-orm";
import { parseRouteParam } from "./routeParams";
import { ErrorKeys } from "../errors/errorKeys";
import { sendError } from "../errors/sendError";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return sendError(res, ErrorKeys.common.unauthorized, 401);

  try {
    const categories = await db
      .select()
      .from(assetCategories)
      .orderBy(asc(assetCategories.name));

    res.json({ categories });
  } catch (err) {
    console.error("Error fetching asset categories:", err);
    sendError(res, ErrorKeys.category.fetchFailed, 500);
  }
});

router.post("/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return sendError(res, ErrorKeys.common.unauthorized, 401);

  const { name } = req.body;
  if (!name) return sendError(res, ErrorKeys.validation.nameRequired, 400);

  try {
    const [category] = await db
      .insert(assetCategories)
      .values({
        name,
        isSystematic: false,
        createdBy: user.id,
        lastModifiedBy: user.id,
      })
      .returning();

    res.status(201).json({ category });
  } catch (err) {
    console.error("Error creating asset category:", err);
    sendError(res, ErrorKeys.category.createFailed, 500);
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return sendError(res, ErrorKeys.common.unauthorized, 401);

  const categoryId = parseRouteParam(req.params.id);
  if (isNaN(categoryId)) return sendError(res, ErrorKeys.common.invalidId, 400);

  const { name } = req.body;
  if (!name) return sendError(res, ErrorKeys.validation.nameRequired, 400);

  try {
    const [existing] = await db
      .select()
      .from(assetCategories)
      .where(eq(assetCategories.id, categoryId));

    if (!existing) return sendError(res, ErrorKeys.category.notFound, 404);
    if (existing.isSystematic) {
      return sendError(res, ErrorKeys.category.systemImmutable, 403);
    }

    const [updated] = await db
      .update(assetCategories)
      .set({ name, lastModifiedAt: new Date(), lastModifiedBy: user.id })
      .where(eq(assetCategories.id, categoryId))
      .returning();

    res.json({ category: updated });
  } catch (err) {
    console.error("Error updating asset category:", err);
    sendError(res, ErrorKeys.category.updateFailed, 500);
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return sendError(res, ErrorKeys.common.unauthorized, 401);

  const categoryId = parseRouteParam(req.params.id);
  if (isNaN(categoryId)) return sendError(res, ErrorKeys.common.invalidId, 400);

  try {
    const [existing] = await db
      .select()
      .from(assetCategories)
      .where(eq(assetCategories.id, categoryId));

    if (!existing) return sendError(res, ErrorKeys.category.notFound, 404);
    if (existing.isSystematic) {
      return sendError(res, ErrorKeys.category.systemUndeletable, 403);
    }

    await db.delete(assetCategories).where(eq(assetCategories.id, categoryId));

    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error("Error deleting asset category:", err);
    sendError(res, ErrorKeys.category.deleteFailed, 500);
  }
});

export default router;
