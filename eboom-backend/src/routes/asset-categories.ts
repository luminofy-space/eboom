import express, { Request, Response } from "express";
import { db } from "../db/client";
import { assetCategories } from "../db/schema";
import { eq, asc } from "drizzle-orm";
import { parseRouteParam } from "./routeParams";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  try {
    const categories = await db
      .select()
      .from(assetCategories)
      .orderBy(asc(assetCategories.name));

    res.json({ categories });
  } catch (err) {
    console.error("Error fetching asset categories:", err);
    res.status(500).json({ error: "Failed to fetch asset categories" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Category name is required" });

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
    res.status(500).json({ error: "Failed to create asset category" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const categoryId = parseRouteParam(req.params.id);
  if (isNaN(categoryId)) return res.status(400).json({ error: "Invalid category ID" });

  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Category name is required" });

  try {
    const [existing] = await db
      .select()
      .from(assetCategories)
      .where(eq(assetCategories.id, categoryId));

    if (!existing) return res.status(404).json({ error: "Category not found" });
    if (existing.isSystematic) {
      return res.status(403).json({ error: "System categories cannot be modified" });
    }

    const [updated] = await db
      .update(assetCategories)
      .set({ name, lastModifiedAt: new Date(), lastModifiedBy: user.id })
      .where(eq(assetCategories.id, categoryId))
      .returning();

    res.json({ category: updated });
  } catch (err) {
    console.error("Error updating asset category:", err);
    res.status(500).json({ error: "Failed to update asset category" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const categoryId = parseRouteParam(req.params.id);
  if (isNaN(categoryId)) return res.status(400).json({ error: "Invalid category ID" });

  try {
    const [existing] = await db
      .select()
      .from(assetCategories)
      .where(eq(assetCategories.id, categoryId));

    if (!existing) return res.status(404).json({ error: "Category not found" });
    if (existing.isSystematic) {
      return res.status(403).json({ error: "System categories cannot be deleted" });
    }

    await db.delete(assetCategories).where(eq(assetCategories.id, categoryId));

    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error("Error deleting asset category:", err);
    res.status(500).json({ error: "Failed to delete asset category" });
  }
});

export default router;
