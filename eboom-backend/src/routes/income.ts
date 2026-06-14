import express, { Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import {
  canvasMembers,
  incomeCategories,
  incomeEntries,
  incomes,
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

function parseOptionalDate(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

router.delete("/entries/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const entryId = parseInt(req.params.id, 10);
  if (isNaN(entryId)) {
    return res.status(400).json({ error: "Invalid income entry ID" });
  }

  try {
    const [existing] = await db.select().from(incomeEntries).where(eq(incomeEntries.id, entryId));
    if (!existing) return res.status(404).json({ error: "Income entry not found" });

    const [income] = await db.select().from(incomes).where(eq(incomes.id, existing.incomeId));
    if (!income) return res.status(404).json({ error: "Income not found" });

    const hasAccess = await checkCanvasAccess(income.canvasId, user.id);
    if (!hasAccess) return res.status(403).json({ error: "Access denied" });

    await debitWalletBalance({
      walletId: existing.destinationWalletId,
      currencyId: income.currencyId,
      amount: String(existing.amount),
      allowNegative: false,
    });

    await db.delete(incomeEntries).where(eq(incomeEntries.id, entryId));
    res.json({ message: "Income entry deleted successfully" });
  } catch (err) {
    console.error("Error deleting income entry:", err);
    res.status(500).json({ error: "Failed to delete income entry" });
  }
});

router.get("/:incomeId/entries", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const incomeId = parseInt(req.params.incomeId, 10);
  if (isNaN(incomeId)) {
    return res.status(400).json({ error: "Invalid income ID" });
  }

  try {
    const [income] = await db.select().from(incomes).where(eq(incomes.id, incomeId));
    if (!income) return res.status(404).json({ error: "Income not found" });

    const hasAccess = await checkCanvasAccess(income.canvasId, user.id);
    if (!hasAccess) return res.status(403).json({ error: "Access denied" });

    const entries = await db
      .select({ entry: incomeEntries, wallet: wallets, walletCategory: walletCategories })
      .from(incomeEntries)
      .leftJoin(wallets, eq(incomeEntries.destinationWalletId, wallets.id))
      .leftJoin(walletCategories, eq(wallets.walletCategoryId, walletCategories.id))
      .where(eq(incomeEntries.incomeId, incomeId));

    res.json({
      entries: entries.map((e) => ({
        ...e.entry,
        destinationWallet: e.wallet ? { ...e.wallet, category: e.walletCategory } : null,
      })),
    });
  } catch (err) {
    console.error("Error fetching income entries:", err);
    res.status(500).json({ error: "Failed to fetch income entries" });
  }
});

router.post("/:incomeId/entries", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const incomeId = parseInt(req.params.incomeId, 10);
  if (isNaN(incomeId)) {
    return res.status(400).json({ error: "Invalid income ID" });
  }

  const { destinationWalletId, amount, expectedDate, receivedDate, notes } = req.body;

  const parsedWalletId = Number(destinationWalletId);
  const parsedAmount = Number(amount);

  if (!parsedWalletId || Number.isNaN(parsedWalletId)) {
    return res.status(400).json({ error: "Destination wallet is required" });
  }

  if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: "A valid amount greater than zero is required" });
  }

  try {
    const [income] = await db.select().from(incomes).where(eq(incomes.id, incomeId));
    if (!income) return res.status(404).json({ error: "Income not found" });

    const hasAccess = await checkCanvasAccess(income.canvasId, user.id);
    if (!hasAccess) return res.status(403).json({ error: "Access denied" });

    const [wallet] = await db.select().from(wallets).where(eq(wallets.id, parsedWalletId));
    if (!wallet || wallet.canvasId !== income.canvasId) {
      return res.status(400).json({ error: "Destination wallet is invalid for this canvas" });
    }

    const amountStr = String(parsedAmount);
    const parsedExpectedDate = parseOptionalDate(expectedDate);
    const parsedReceivedDate = parseOptionalDate(receivedDate);

    const created = await db.transaction(async (tx) => {
      const [entry] = await tx
        .insert(incomeEntries)
        .values({
          incomeId,
          destinationWalletId: parsedWalletId,
          amount: amountStr,
          expectedDate: parsedExpectedDate,
          receivedDate: parsedReceivedDate,
          notes: notes || null,
          createdBy: user.id,
          lastModifiedBy: user.id,
        })
        .returning();

      await creditWalletBalance(
        {
          walletId: parsedWalletId,
          currencyId: income.currencyId,
          amount: amountStr,
        },
        tx
      );

      return entry;
    });

    res.status(201).json({ entry: created });
  } catch (err) {
    console.error("Error creating income entry:", err);
    res.status(500).json({ error: "Failed to create income entry" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const incomeId = parseInt(req.params.id, 10);
  if (isNaN(incomeId)) {
    return res.status(400).json({ error: "Invalid income ID" });
  }

  try {
    const [record] = await db
      .select({ income: incomes, category: incomeCategories, defaultWallet: wallets })
      .from(incomes)
      .leftJoin(incomeCategories, eq(incomes.incomeCategoryId, incomeCategories.id))
      .leftJoin(wallets, eq(incomes.defaultWalletId, wallets.id))
      .where(eq(incomes.id, incomeId));

    if (!record) {
      return res.status(404).json({ error: "Income not found" });
    }

    const hasAccess = await checkCanvasAccess(record.income.canvasId, user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({
      income: {
        ...record.income,
        category: record.category,
        defaultWallet: record.defaultWallet,
      },
    });
  } catch (err) {
    console.error("Error fetching income:", err);
    res.status(500).json({ error: "Failed to fetch income" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const incomeId = parseInt(req.params.id, 10);
  if (isNaN(incomeId)) {
    return res.status(400).json({ error: "Invalid income ID" });
  }

  const {
    name,
    incomeCategoryId,
    currencyId,
    defaultWalletId,
    amount,
    isRecurring,
    recurrencePattern,
    description,
    photoUrl,
    status,
    isArchived,
  } = req.body;

  try {
    const [existing] = await db.select().from(incomes).where(eq(incomes.id, incomeId));

    if (!existing) {
      return res.status(404).json({ error: "Income not found" });
    }

    const hasAccess = await checkCanvasAccess(existing.canvasId, user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    const parsedCategoryId =
      incomeCategoryId !== undefined ? Number(incomeCategoryId) : undefined;
    const parsedCurrencyId = currencyId !== undefined ? Number(currencyId) : undefined;
    const parsedDefaultWalletId =
      defaultWalletId === undefined
        ? undefined
        : defaultWalletId === null || defaultWalletId === ""
          ? null
          : Number(defaultWalletId);
    if (
      (parsedCategoryId !== undefined && Number.isNaN(parsedCategoryId)) ||
      (parsedCurrencyId !== undefined && Number.isNaN(parsedCurrencyId)) ||
      (typeof parsedDefaultWalletId === "number" && Number.isNaN(parsedDefaultWalletId))
    ) {
      return res.status(400).json({ error: "Invalid category, currency, or wallet ID" });
    }

    if (typeof parsedDefaultWalletId === "number") {
      const [wallet] = await db
        .select()
        .from(wallets)
        .where(eq(wallets.id, parsedDefaultWalletId));
      if (!wallet || wallet.canvasId !== existing.canvasId) {
        return res.status(400).json({ error: "Default wallet is invalid for this canvas" });
      }
    }

    const [updated] = await db
      .update(incomes)
      .set({
        ...(name !== undefined && { name }),
        ...(parsedCategoryId !== undefined && { incomeCategoryId: parsedCategoryId }),
        ...(parsedCurrencyId !== undefined && { currencyId: parsedCurrencyId }),
        ...(parsedDefaultWalletId !== undefined && { defaultWalletId: parsedDefaultWalletId }),
        ...(amount !== undefined && { amount: parseInt(amount, 10) || 0 }),
        ...(isRecurring !== undefined && { isRecurring }),
        ...(recurrencePattern !== undefined && { recurrencePattern }),
        ...(description !== undefined && { description }),
        ...(photoUrl !== undefined && { photoUrl }),
        ...(status !== undefined && { status }),
        ...(isArchived !== undefined && { isArchived }),
        lastModifiedBy: user.id,
        lastModifiedAt: new Date(),
      })
      .where(eq(incomes.id, incomeId))
      .returning();

    res.json({ income: updated });
  } catch (err) {
    console.error("Error updating income:", err);
    res.status(500).json({ error: "Failed to update income" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const incomeId = parseInt(req.params.id, 10);
  if (isNaN(incomeId)) {
    return res.status(400).json({ error: "Invalid income ID" });
  }

  try {
    const [existing] = await db.select().from(incomes).where(eq(incomes.id, incomeId));
    if (!existing) {
      return res.status(404).json({ error: "Income not found" });
    }

    const hasAccess = await checkCanvasAccess(existing.canvasId, user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    await db
      .update(incomes)
      .set({
        isArchived: true,
        lastModifiedBy: user.id,
        lastModifiedAt: new Date(),
      })
      .where(eq(incomes.id, incomeId));

    res.json({ message: "Income archived successfully" });
  } catch (err) {
    console.error("Error deleting income:", err);
    res.status(500).json({ error: "Failed to delete income" });
  }
});

export default router;
