import express, { Request, Response } from "express";
import { db } from "../db/client";
import { incomeCategories } from "../db/schema";
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
      .from(incomeCategories)
      .orderBy(asc(incomeCategories.name));

    res.json({ categories });
  } catch (err) {
    console.error("Error fetching income categories:", err);
    sendError(res, ErrorKeys.category.fetchFailed, 500);
  }
});

router.post("/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return sendError(res, ErrorKeys.common.unauthorized, 401);

  const { name } = req.body;
  if (!name)
    return sendError(res, ErrorKeys.validation.nameRequired, 400);

  try {
    const [category] = await db
      .insert(incomeCategories)
      .values({ name })
      .returning();

    res.status(201).json({ category });
  } catch (err) {
    console.error("Error creating income category:", err);
    sendError(res, ErrorKeys.category.createFailed, 500);
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return sendError(res, ErrorKeys.common.unauthorized, 401);

  const categoryId = parseRouteParam(req.params.id);
  if (isNaN(categoryId))
    return sendError(res, ErrorKeys.common.invalidId, 400);

  const { name } = req.body;
  if (!name)
    return sendError(res, ErrorKeys.validation.nameRequired, 400);

  try {
    const [existing] = await db
      .select()
      .from(incomeCategories)
      .where(eq(incomeCategories.id, categoryId));

    if (!existing) return sendError(res, ErrorKeys.category.notFound, 404);

    const [updated] = await db
      .update(incomeCategories)
      .set({ name, lastModifiedAt: new Date() })
      .where(eq(incomeCategories.id, categoryId))
      .returning();

    res.json({ category: updated });
  } catch (err) {
    console.error("Error updating income category:", err);
    sendError(res, ErrorKeys.category.updateFailed, 500);
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return sendError(res, ErrorKeys.common.unauthorized, 401);

  const categoryId = parseRouteParam(req.params.id);
  if (isNaN(categoryId))
    return sendError(res, ErrorKeys.common.invalidId, 400);

  try {
    const [existing] = await db
      .select()
      .from(incomeCategories)
      .where(eq(incomeCategories.id, categoryId));

    if (!existing) return sendError(res, ErrorKeys.category.notFound, 404);

    await db
      .delete(incomeCategories)
      .where(eq(incomeCategories.id, categoryId));

    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error("Error deleting income category:", err);
    sendError(res, ErrorKeys.category.deleteFailed, 500);
  }
});

export default router;
