import express, { Request, Response } from "express";
import { db } from "../../db/client";
import {
  canvases,
  canvasMembers,
  currencies,
} from "../../db/schema";
import { eq, and } from "drizzle-orm";

const router = express.Router();

// GET /canvases - Get all canvases for the authenticated user
router.get("/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  try {
    const memberships = await db
      .select({
        canvas: canvases,
        member: canvasMembers,
      })
      .from(canvasMembers)
      .innerJoin(canvases, eq(canvasMembers.canvasId, canvases.id))
      .where(and(eq(canvasMembers.userId, user.id), eq(canvases.isArchived, false)));

    const userCanvases = memberships.map((m) => ({
      ...m.canvas,
      isOwner: m.member.isOwner,
      roleId: m.member.roleId,
    }));

    res.json({ canvases: userCanvases });
  } catch (err) {
    console.error("Error fetching canvases:", err);
    res.status(500).json({ error: "Failed to fetch canvases" });
  }
});

// GET /canvases/:id - Get a specific canvas
router.get("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseInt(req.params.id);
  if (isNaN(canvasId)) {
    return res.status(400).json({ error: "Invalid canvas ID" });
  }

  try {
    const [membership] = await db
      .select()
      .from(canvasMembers)
      .where(
        and(
          eq(canvasMembers.canvasId, canvasId),
          eq(canvasMembers.userId, user.id)
        )
      );

    if (!membership) {
      return res.status(403).json({ error: "Access denied to this canvas" });
    }

    const [canvas] = await db
      .select()
      .from(canvases)
      .where(eq(canvases.id, canvasId));

    if (!canvas) {
      return res.status(404).json({ error: "Canvas not found" });
    }

    res.json({
      canvas: {
        ...canvas,
        isOwner: membership.isOwner,
        roleId: membership.roleId,
      },
    });
  } catch (err) {
    console.error("Error fetching canvas:", err);
    res.status(500).json({ error: "Failed to fetch canvas" });
  }
});

// POST /canvases - Create a new canvas
router.post("/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { name, description, canvasType, photoUrl, baseCurrencyId } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Canvas name is required" });
  }

  if (!baseCurrencyId) {
    return res.status(400).json({ error: "Base currency is required" });
  }

  try {
    const [selectedCurrency] = await db
      .select({ id: currencies.id })
      .from(currencies)
      .where(eq(currencies.id, Number(baseCurrencyId)));

    if (!selectedCurrency) {
      return res.status(400).json({ error: "Invalid base currency" });
    }

    const [newCanvas] = await db
      .insert(canvases)
      .values({
        name,
        description: description || null,
        canvasType: canvasType || null,
        photoUrl: photoUrl || null,
        createdBy: user.id,
        lastModifiedBy: user.id,
      })
      .returning();

    await db.insert(canvasMembers).values({
      canvasId: newCanvas.id,
      userId: user.id,
      baseCurrencyId: selectedCurrency.id,
      isOwner: true,
      createdBy: user.id,
      lastModifiedBy: user.id,
    });

    res.status(201).json({ canvas: newCanvas });
  } catch (err) {
    console.error("Error creating canvas:", err);
    res.status(500).json({ error: "Failed to create canvas" });
  }
});

// PUT /canvases/:id - Update a canvas
router.put("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseInt(req.params.id);
  if (isNaN(canvasId)) {
    return res.status(400).json({ error: "Invalid canvas ID" });
  }

  const { name, description, canvasType, photoUrl, isArchived } = req.body;

  try {
    const [membership] = await db
      .select()
      .from(canvasMembers)
      .where(
        and(
          eq(canvasMembers.canvasId, canvasId),
          eq(canvasMembers.userId, user.id)
        )
      );

    if (!membership) {
      return res.status(403).json({ error: "Access denied to this canvas" });
    }

    if (!membership.isOwner) {
      return res
        .status(403)
        .json({ error: "Only canvas owner can update canvas" });
    }

    const [updatedCanvas] = await db
      .update(canvases)
      .set({
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(canvasType !== undefined && { canvasType }),
        ...(photoUrl !== undefined && { photoUrl }),
        ...(isArchived !== undefined && { isArchived }),
        lastModifiedBy: user.id,
        lastModifiedAt: new Date(),
      })
      .where(eq(canvases.id, canvasId))
      .returning();

    if (!updatedCanvas) {
      return res.status(404).json({ error: "Canvas not found" });
    }

    res.json({ canvas: updatedCanvas });
  } catch (err) {
    console.error("Error updating canvas:", err);
    res.status(500).json({ error: "Failed to update canvas" });
  }
});

// DELETE /canvases/:id - Archive a canvas
router.delete("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseInt(req.params.id);
  if (isNaN(canvasId)) {
    return res.status(400).json({ error: "Invalid canvas ID" });
  }

  try {
    const [membership] = await db
      .select()
      .from(canvasMembers)
      .where(
        and(
          eq(canvasMembers.canvasId, canvasId),
          eq(canvasMembers.userId, user.id)
        )
      );

    if (!membership) {
      return res.status(403).json({ error: "Access denied to this canvas" });
    }

    if (!membership.isOwner) {
      return res
        .status(403)
        .json({ error: "Only canvas owner can delete canvas" });
    }

    await db
      .update(canvases)
      .set({
        isArchived: true,
        lastModifiedBy: user.id,
        lastModifiedAt: new Date(),
      })
      .where(eq(canvases.id, canvasId));

    res.json({ message: "Canvas archived successfully" });
  } catch (err) {
    console.error("Error deleting canvas:", err);
    res.status(500).json({ error: "Failed to delete canvas" });
  }
});

export default router;
