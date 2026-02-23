import express, { Request, Response } from "express";
import { db } from "../db/client";
import { walletCategories } from "../db/schema";
import { eq, asc } from "drizzle-orm";

const router = express.Router();

/**
 * GET /
 * List all wallet categories
 */
router.get("/", async (req: Request, res: Response) => {
    const user = req.appUser;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    try {
        const categories = await db
            .select()
            .from(walletCategories)
            .orderBy(asc(walletCategories.name));

        res.json({ categories });
    } catch (err) {
        console.error("Error fetching wallet categories:", err);
        res.status(500).json({ error: "Failed to fetch wallet categories" });
    }
});

/**
 * POST /
 * Create a custom wallet category
 */
router.post("/", async (req: Request, res: Response) => {
    const user = req.appUser;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { name, photoUrl } = req.body;

    if (!name)
        return res.status(400).json({ error: "Category name is required" });

    try {
        const [category] = await db
            .insert(walletCategories)
            .values({
                name,
                photoUrl: photoUrl ?? null,
                isSystemCategory: false,
                createdBy: user.id,
                lastModifiedBy: user.id,
            })
            .returning();

        res.status(201).json({ category });
    } catch (err) {
        console.error("Error creating wallet category:", err);
        res.status(500).json({ error: "Failed to create wallet category" });
    }
});

/**
 * PUT /:id
 * Update a custom wallet category
 */
router.put("/:id", async (req: Request, res: Response) => {
    const user = req.appUser;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const categoryId = parseInt(req.params.id);
    if (isNaN(categoryId))
        return res.status(400).json({ error: "Invalid category ID" });

    const { name, photoUrl } = req.body;

    if (!name)
        return res.status(400).json({ error: "Category name is required" });

    try {
        const [existing] = await db
            .select()
            .from(walletCategories)
            .where(eq(walletCategories.id, categoryId));

        if (!existing)
            return res.status(404).json({ error: "Category not found" });

        if (existing.isSystemCategory)
            return res
                .status(403)
                .json({ error: "System categories cannot be modified" });

        const [updated] = await db
            .update(walletCategories)
            .set({
                name,
                photoUrl: photoUrl ?? null,
                lastModifiedBy: user.id,
                lastModifiedAt: new Date(),
            })
            .where(eq(walletCategories.id, categoryId))
            .returning();

        res.json({ category: updated });
    } catch (err) {
        console.error("Error updating wallet category:", err);
        res.status(500).json({ error: "Failed to update wallet category" });
    }
});

/**
 * DELETE /:id
 * Delete a custom wallet category
 */
router.delete("/:id", async (req: Request, res: Response) => {
    const user = req.appUser;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const categoryId = parseInt(req.params.id);
    if (isNaN(categoryId))
        return res.status(400).json({ error: "Invalid category ID" });

    try {
        const [existing] = await db
            .select()
            .from(walletCategories)
            .where(eq(walletCategories.id, categoryId));

        if (!existing)
            return res.status(404).json({ error: "Category not found" });

        if (existing.isSystemCategory)
            return res
                .status(403)
                .json({ error: "System categories cannot be deleted" });

        await db
            .delete(walletCategories)
            .where(eq(walletCategories.id, categoryId));

        res.json({ message: "Category deleted successfully" });
    } catch (err) {
        console.error("Error deleting wallet category:", err);
        res.status(500).json({ error: "Failed to delete wallet category" });
    }
});

export default router;