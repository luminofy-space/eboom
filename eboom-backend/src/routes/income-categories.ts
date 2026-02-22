import express, { Request, Response } from "express";
import { db } from "../db/client";
import { incomeResourceCategories } from "../db/schema";
import { eq, asc } from "drizzle-orm";

const router = express.Router();

// GET / - List all income resource categories
router.get("/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  try {
    const categories = await db
      .select()
      .from(incomeResourceCategories)
      .orderBy(asc(incomeResourceCategories.name));

    res.json({ categories });
  } catch (err) {
    console.error("Error fetching income categories:", err);
    res.status(500).json({ error: "Failed to fetch income categories" });
  }
});

// POST / - Create a custom income resource category
router.post("/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Category name is required" });

  try {
    const [category] = await db
      .insert(incomeResourceCategories)
      .values({ name, isSystemCategory: false })
      .returning();

    res.status(201).json({ category });
  } catch (err) {
    console.error("Error creating income category:", err);
    res.status(500).json({ error: "Failed to create income category" });
  }
});

// PUT /:id - Update a custom income resource category
router.put("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const categoryId = parseInt(req.params.id);
  if (isNaN(categoryId)) return res.status(400).json({ error: "Invalid category ID" });

  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Category name is required" });

  try {
    const [existing] = await db
      .select()
      .from(incomeResourceCategories)
      .where(eq(incomeResourceCategories.id, categoryId));

    if (!existing) return res.status(404).json({ error: "Category not found" });
    if (existing.isSystemCategory) return res.status(403).json({ error: "System categories cannot be modified" });

    const [updated] = await db
      .update(incomeResourceCategories)
      .set({ name })
      .where(eq(incomeResourceCategories.id, categoryId))
      .returning();

    res.json({ category: updated });
  } catch (err) {
    console.error("Error updating income category:", err);
    res.status(500).json({ error: "Failed to update income category" });
  }
});

// DELETE /:id - Delete a custom income resource category
router.delete("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const categoryId = parseInt(req.params.id);
  if (isNaN(categoryId)) return res.status(400).json({ error: "Invalid category ID" });

  try {
    const [existing] = await db
      .select()
      .from(incomeResourceCategories)
      .where(eq(incomeResourceCategories.id, categoryId));

    if (!existing) return res.status(404).json({ error: "Category not found" });
    if (existing.isSystemCategory) return res.status(403).json({ error: "System categories cannot be deleted" });

    await db.delete(incomeResourceCategories).where(eq(incomeResourceCategories.id, categoryId));

    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error("Error deleting income category:", err);
    res.status(500).json({ error: "Failed to delete income category" });
  }
});

export default router;
