import express, { Request, Response } from "express";
import { db } from "../db/client";
import { incomeCategories } from "../db/schema";
import { eq, asc } from "drizzle-orm";
import { parseRouteParam } from "./routeParams";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  try {
    const categories = await db
      .select()
      .from(incomeCategories)
      .orderBy(asc(incomeCategories.name));

    res.json({ categories });
  } catch (err) {
    console.error("Error fetching income categories:", err);
    res.status(500).json({ error: "Failed to fetch income categories" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { name } = req.body;
  if (!name)
    return res.status(400).json({ error: "Category name is required" });

  try {
    const [category] = await db
      .insert(incomeCategories)
      .values({ name })
      .returning();

    res.status(201).json({ category });
  } catch (err) {
    console.error("Error creating income category:", err);
    res.status(500).json({ error: "Failed to create income category" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const categoryId = parseRouteParam(req.params.id);
  if (isNaN(categoryId))
    return res.status(400).json({ error: "Invalid category ID" });

  const { name } = req.body;
  if (!name)
    return res.status(400).json({ error: "Category name is required" });

  try {
    const [existing] = await db
      .select()
      .from(incomeCategories)
      .where(eq(incomeCategories.id, categoryId));

    if (!existing) return res.status(404).json({ error: "Category not found" });

    const [updated] = await db
      .update(incomeCategories)
      .set({ name, lastModifiedAt: new Date() })
      .where(eq(incomeCategories.id, categoryId))
      .returning();

    res.json({ category: updated });
  } catch (err) {
    console.error("Error updating income category:", err);
    res.status(500).json({ error: "Failed to update income category" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const categoryId = parseRouteParam(req.params.id);
  if (isNaN(categoryId))
    return res.status(400).json({ error: "Invalid category ID" });

  try {
    const [existing] = await db
      .select()
      .from(incomeCategories)
      .where(eq(incomeCategories.id, categoryId));

    if (!existing) return res.status(404).json({ error: "Category not found" });

    await db
      .delete(incomeCategories)
      .where(eq(incomeCategories.id, categoryId));

    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error("Error deleting income category:", err);
    res.status(500).json({ error: "Failed to delete income category" });
  }
});

export default router;
