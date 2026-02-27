import express, { Request, Response } from "express";
import { db } from "../db/client";
import {
  wallets,
  walletCategories,
  canvasMembers,
  assets,
} from "../db/schema";
import { eq, and } from "drizzle-orm";
import type { Wallet, NewWallet, User } from "../db/schema/models";

const router = express.Router();

// Helper function to check canvas access
async function checkCanvasAccess(
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

// ============================================================================
// GET /:id - Get a specific wallet with its assets
// ============================================================================
router.get("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const walletId = parseInt(req.params.id);
  if (isNaN(walletId)) {
    return res.status(400).json({ error: "Invalid wallet ID" });
  }

  try {
    // Get the wallet with category info
    const [wallet] = await db
      .select({
        wallet: wallets,
        category: walletCategories,
      })
      .from(wallets)
      .leftJoin(walletCategories, eq(wallets.walletCategoryId, walletCategories.id))
      .where(eq(wallets.id, walletId));

    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    // Check canvas access
    const hasAccess = await checkCanvasAccess(wallet.wallet.canvasId, user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get assets in this wallet
    const walletAssets = await db
      .select()
      .from(assets)
      .where(eq(assets.walletId, walletId));

    res.json({
      wallet: {
        ...wallet.wallet,
        category: wallet.category,
        assets: walletAssets,
      },
    });
  } catch (err) {
    console.error("Error fetching wallet:", err);
    res.status(500).json({ error: "Failed to fetch wallet" });
  }
});

// ============================================================================
// PUT /:id - Update a wallet
// ============================================================================
router.put("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const walletId = parseInt(req.params.id);
  if (isNaN(walletId)) {
    return res.status(400).json({ error: "Invalid wallet ID" });
  }

  const {
    name,
    walletCategoryId,
    ownerId,
    walletNumber,
    entityId,
    description,
    isArchived,
  } = req.body;

  try {
    // Get the existing wallet to check canvas access
    const [existing] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.id, walletId));

    if (!existing) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    // Check canvas access
    const hasAccess = await checkCanvasAccess(existing.canvasId, user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Update the wallet
    const [updatedWallet] = await db
      .update(wallets)
      .set({
        ...(name !== undefined && { name }),
        ...(walletCategoryId !== undefined && { walletCategoryId }),
        ...(ownerId !== undefined && { ownerId }),
        ...(walletNumber !== undefined && { walletNumber }),
        ...(entityId !== undefined && { entityId }),
        ...(description !== undefined && { description }),
        ...(isArchived !== undefined && { isArchived }),
        lastModifiedBy: user.id,
        lastModifiedAt: new Date(),
      })
      .where(eq(wallets.id, walletId))
      .returning();

    res.json({ wallet: updatedWallet });
  } catch (err) {
    console.error("Error updating wallet:", err);
    res.status(500).json({ error: "Failed to update wallet" });
  }
});

// ============================================================================
// DELETE /:id - Archive a wallet (soft delete)
// ============================================================================
router.delete("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const walletId = parseInt(req.params.id);
  if (isNaN(walletId)) {
    return res.status(400).json({ error: "Invalid wallet ID" });
  }

  try {
    // Get the existing wallet to check canvas access
    const [existing] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.id, walletId));

    if (!existing) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    // Check canvas access
    const hasAccess = await checkCanvasAccess(existing.canvasId, user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Archive the wallet (soft delete)
    await db
      .update(wallets)
      .set({
        isArchived: true,
        lastModifiedBy: user.id,
        lastModifiedAt: new Date(),
      })
      .where(eq(wallets.id, walletId));

    res.json({ message: "Wallet archived successfully" });
  } catch (err) {
    console.error("Error deleting wallet:", err);
    res.status(500).json({ error: "Failed to delete wallet" });
  }
});

export default router;
