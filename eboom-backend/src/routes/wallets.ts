import express, { Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { canvasMembers, currencies, walletBalances, walletCategories, wallets } from "../db/schema";

const router = express.Router();

async function checkCanvasAccess(canvasId: number, userId: number): Promise<boolean> {
  const [membership] = await db
    .select()
    .from(canvasMembers)
    .where(and(eq(canvasMembers.canvasId, canvasId), eq(canvasMembers.userId, userId)));
  return !!membership;
}

router.get("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const walletId = parseInt(req.params.id, 10);
  if (isNaN(walletId)) {
    return res.status(400).json({ error: "Invalid wallet ID" });
  }

  try {
    const [walletRecord] = await db
      .select({ wallet: wallets, category: walletCategories })
      .from(wallets)
      .leftJoin(walletCategories, eq(wallets.walletCategoryId, walletCategories.id))
      .where(eq(wallets.id, walletId));

    if (!walletRecord) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    const hasAccess = await checkCanvasAccess(walletRecord.wallet.canvasId, user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    const balances = await db
      .select({ balance: walletBalances, currency: currencies })
      .from(walletBalances)
      .leftJoin(currencies, eq(walletBalances.currencyId, currencies.id))
      .where(eq(walletBalances.walletId, walletId));

    res.json({
      wallet: {
        ...walletRecord.wallet,
        category: walletRecord.category,
        balances: balances.map((b) => ({
          ...b.balance,
          currency: b.currency,
        })),
      },
    });
  } catch (err) {
    console.error("Error fetching wallet:", err);
    res.status(500).json({ error: "Failed to fetch wallet" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const walletId = parseInt(req.params.id, 10);
  if (isNaN(walletId)) {
    return res.status(400).json({ error: "Invalid wallet ID" });
  }

  const { name, walletCategoryId, ownerId, walletNumber, entityId, description, isArchived } =
    req.body;

  try {
    const [existing] = await db.select().from(wallets).where(eq(wallets.id, walletId));
    if (!existing) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    const hasAccess = await checkCanvasAccess(existing.canvasId, user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    const parsedWalletCategoryId =
      walletCategoryId !== undefined ? Number(walletCategoryId) : undefined;
    const parsedOwnerId = ownerId !== undefined ? Number(ownerId) : undefined;
    const parsedEntityId = entityId !== undefined && entityId !== null ? Number(entityId) : entityId;
    if (
      (parsedWalletCategoryId !== undefined && Number.isNaN(parsedWalletCategoryId)) ||
      (parsedOwnerId !== undefined && Number.isNaN(parsedOwnerId))
    ) {
      return res.status(400).json({ error: "Invalid owner or wallet category ID" });
    }

    const [updatedWallet] = await db
      .update(wallets)
      .set({
        ...(name !== undefined && { name }),
        ...(parsedWalletCategoryId !== undefined && { walletCategoryId: parsedWalletCategoryId }),
        ...(parsedOwnerId !== undefined && { ownerId: parsedOwnerId }),
        ...(walletNumber !== undefined && { walletNumber }),
        ...(parsedEntityId !== undefined && { entityId: parsedEntityId }),
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

router.delete("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const walletId = parseInt(req.params.id, 10);
  if (isNaN(walletId)) {
    return res.status(400).json({ error: "Invalid wallet ID" });
  }

  try {
    const [existing] = await db.select().from(wallets).where(eq(wallets.id, walletId));
    if (!existing) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    const hasAccess = await checkCanvasAccess(existing.canvasId, user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

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
