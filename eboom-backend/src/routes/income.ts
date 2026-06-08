import express, { Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import {
  canvasMembers,
  currencies,
  incomeEntries,
  incomeResourceCategories,
  incomeResources,
  walletCategories,
  wallets,
} from "../db/schema";
import { creditWalletBalance, debitWalletBalance } from "../services/ledgerService";

const router = express.Router();

async function checkCanvasAccess(canvasId: number, userId: number): Promise<boolean> {
  const [membership] = await db
    .select()
    .from(canvasMembers)
    .where(and(eq(canvasMembers.canvasId, canvasId), eq(canvasMembers.userId, userId)));
  return !!membership;
}

router.get("/resources/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const resourceId = parseInt(req.params.id, 10);
  if (isNaN(resourceId)) {
    return res.status(400).json({ error: "Invalid income resource ID" });
  }

  try {
    const [resource] = await db
      .select({ incomeResource: incomeResources, category: incomeResourceCategories })
      .from(incomeResources)
      .leftJoin(
        incomeResourceCategories,
        eq(incomeResources.incomeResourceCategoryId, incomeResourceCategories.id)
      )
      .where(eq(incomeResources.id, resourceId));

    if (!resource) {
      return res.status(404).json({ error: "Income resource not found" });
    }

    const hasAccess = await checkCanvasAccess(resource.incomeResource.canvasId, user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({
      incomeResource: {
        ...resource.incomeResource,
        category: resource.category,
      },
    });
  } catch (err) {
    console.error("Error fetching income resource:", err);
    res.status(500).json({ error: "Failed to fetch income resource" });
  }
});

router.put("/resources/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const resourceId = parseInt(req.params.id, 10);
  if (isNaN(resourceId)) {
    return res.status(400).json({ error: "Invalid income resource ID" });
  }

  const {
    name,
    incomeResourceCategoryId,
    ownerId,
    currency,
    amount,
    isRecurring,
    recurrencePattern,
    description,
    isArchived,
  } = req.body;

  try {
    const [existing] = await db
      .select()
      .from(incomeResources)
      .where(eq(incomeResources.id, resourceId));

    if (!existing) {
      return res.status(404).json({ error: "Income resource not found" });
    }

    const hasAccess = await checkCanvasAccess(existing.canvasId, user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    const parsedCategoryId =
      incomeResourceCategoryId !== undefined ? Number(incomeResourceCategoryId) : undefined;
    const parsedOwnerId = ownerId !== undefined ? Number(ownerId) : undefined;
    if (
      (parsedCategoryId !== undefined && Number.isNaN(parsedCategoryId)) ||
      (parsedOwnerId !== undefined && Number.isNaN(parsedOwnerId))
    ) {
      return res.status(400).json({ error: "Invalid owner or income category ID" });
    }

    const [updated] = await db
      .update(incomeResources)
      .set({
        ...(name !== undefined && { name }),
        ...(parsedCategoryId !== undefined && { incomeResourceCategoryId: parsedCategoryId }),
        ...(parsedOwnerId !== undefined && { ownerId: parsedOwnerId }),
        ...(currency !== undefined && { currency }),
        ...(amount !== undefined && { amount: parseInt(amount, 10) || 0 }),
        ...(isRecurring !== undefined && { isRecurring }),
        ...(recurrencePattern !== undefined && { recurrencePattern }),
        ...(description !== undefined && { description }),
        ...(isArchived !== undefined && { isArchived }),
        lastModifiedBy: user.id,
        lastModifiedAt: new Date(),
      })
      .where(eq(incomeResources.id, resourceId))
      .returning();

    res.json({ incomeResource: updated });
  } catch (err) {
    console.error("Error updating income resource:", err);
    res.status(500).json({ error: "Failed to update income resource" });
  }
});

router.delete("/resources/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const resourceId = parseInt(req.params.id, 10);
  if (isNaN(resourceId)) {
    return res.status(400).json({ error: "Invalid income resource ID" });
  }

  try {
    const [existing] = await db
      .select()
      .from(incomeResources)
      .where(eq(incomeResources.id, resourceId));
    if (!existing) {
      return res.status(404).json({ error: "Income resource not found" });
    }

    const hasAccess = await checkCanvasAccess(existing.canvasId, user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    await db
      .update(incomeResources)
      .set({
        isArchived: true,
        lastModifiedBy: user.id,
        lastModifiedAt: new Date(),
      })
      .where(eq(incomeResources.id, resourceId));

    res.json({ message: "Income resource archived successfully" });
  } catch (err) {
    console.error("Error deleting income resource:", err);
    res.status(500).json({ error: "Failed to delete income resource" });
  }
});

router.get("/resources/:resourceId/transactions", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const resourceId = parseInt(req.params.resourceId, 10);
  if (isNaN(resourceId)) {
    return res.status(400).json({ error: "Invalid income resource ID" });
  }

  try {
    const [resource] = await db
      .select()
      .from(incomeResources)
      .where(eq(incomeResources.id, resourceId));

    if (!resource) return res.status(404).json({ error: "Income resource not found" });

    const hasAccess = await checkCanvasAccess(resource.canvasId, user.id);
    if (!hasAccess) return res.status(403).json({ error: "Access denied" });

    const transactions = await db
      .select({ transaction: incomeEntries, wallet: wallets, walletCategory: walletCategories })
      .from(incomeEntries)
      .leftJoin(wallets, eq(incomeEntries.destinationWalletId, wallets.id))
      .leftJoin(walletCategories, eq(wallets.walletCategoryId, walletCategories.id))
      .where(eq(incomeEntries.incomeResourceId, resourceId));

    res.json({
      transactions: transactions.map((t) => ({
        ...t.transaction,
        destinationWallet: t.wallet ? { ...t.wallet, category: t.walletCategory } : null,
      })),
    });
  } catch (err) {
    console.error("Error fetching income transactions:", err);
    res.status(500).json({ error: "Failed to fetch income transactions" });
  }
});

router.post("/resources/:resourceId/transactions", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const resourceId = parseInt(req.params.resourceId, 10);
  if (isNaN(resourceId)) {
    return res.status(400).json({ error: "Invalid income resource ID" });
  }

  const { destinationWalletId, amount, expectedDate, receivedDate, status, notes, description, photoUrl } =
    req.body;

  if (!destinationWalletId || !amount) {
    return res.status(400).json({ error: "Destination wallet and amount are required" });
  }

  try {
    const [resource] = await db
      .select()
      .from(incomeResources)
      .where(eq(incomeResources.id, resourceId));
    if (!resource) return res.status(404).json({ error: "Income resource not found" });

    const hasAccess = await checkCanvasAccess(resource.canvasId, user.id);
    if (!hasAccess) return res.status(403).json({ error: "Access denied" });

    const [wallet] = await db.select().from(wallets).where(eq(wallets.id, destinationWalletId));
    if (!wallet || wallet.canvasId !== resource.canvasId) {
      return res.status(400).json({ error: "Destination wallet is invalid for this canvas" });
    }

    const [created] = await db
      .insert(incomeEntries)
      .values({
        incomeResourceId: resourceId,
        destinationWalletId,
        amount: String(amount),
        expectedDate: expectedDate || null,
        receivedDate: receivedDate || null,
        status: status || "pending",
        notes: notes || null,
        description: description || null,
        photoUrl: photoUrl || null,
        createdBy: user.id,
        lastModifiedBy: user.id,
      })
      .returning();

    const [currencyRow] = await db
      .select()
      .from(currencies)
      .where(eq(currencies.code, resource.currency))
      .limit(1);

    if (!currencyRow) {
      return res.status(400).json({ error: "Income resource currency is invalid" });
    }

    await creditWalletBalance({
      walletId: destinationWalletId,
      currencyId: currencyRow.id,
      amount: String(amount),
    });

    res.status(201).json({ transaction: created });
  } catch (err) {
    console.error("Error creating income transaction:", err);
    res.status(500).json({ error: "Failed to create income transaction" });
  }
});

router.delete("/transactions/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const transactionId = parseInt(req.params.id, 10);
  if (isNaN(transactionId)) {
    return res.status(400).json({ error: "Invalid transaction ID" });
  }

  try {
    const [existing] = await db.select().from(incomeEntries).where(eq(incomeEntries.id, transactionId));
    if (!existing) return res.status(404).json({ error: "Income transaction not found" });

    const [resource] = await db
      .select()
      .from(incomeResources)
      .where(eq(incomeResources.id, existing.incomeResourceId));
    if (!resource) return res.status(404).json({ error: "Income resource not found" });

    const hasAccess = await checkCanvasAccess(resource.canvasId, user.id);
    if (!hasAccess) return res.status(403).json({ error: "Access denied" });

    const [currencyRow] = await db
      .select()
      .from(currencies)
      .where(eq(currencies.code, resource.currency))
      .limit(1);

    if (currencyRow) {
      await debitWalletBalance({
        walletId: existing.destinationWalletId,
        currencyId: currencyRow.id,
        amount: String(existing.amount),
        allowNegative: false,
      });
    }

    await db.delete(incomeEntries).where(eq(incomeEntries.id, transactionId));
    res.json({ message: "Income transaction deleted successfully" });
  } catch (err) {
    console.error("Error deleting income transaction:", err);
    res.status(500).json({ error: "Failed to delete income transaction" });
  }
});

router.put("/transactions/:id", async (_req: Request, res: Response) => {
  return res.status(501).json({
    error: "Updating income transactions is not supported in Phase 0. Delete and recreate instead.",
  });
});

export default router;
