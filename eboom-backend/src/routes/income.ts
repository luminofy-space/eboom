import express, { Request, Response } from "express";
import { and, count, desc, eq, ilike } from "drizzle-orm";
import { db } from "../db/client";
import {
  currencies,
  incomeCategories,
  incomeEntries,
  incomes,
  walletCategories,
  wallets,
} from "../db/schema";
import { creditWalletBalance, debitWalletBalance } from "../services/ledgerService";
import { registerWhiteboardNode, unregisterWhiteboardNode } from "../services/whiteboardService";
import { parseRouteParam } from "./routeParams";
import { requireCanvasAccess } from "../middleware/canvasAccess";
import { ErrorKeys } from "../errors/errorKeys";
import { sendError } from "../errors/sendError";

const router = express.Router({ mergeParams: true });

function parsePaginationParams(req: Request) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const search = (req.query.search as string) || "";
  const offset = (page - 1) * limit;
  return { page, limit, search, offset };
}

function parseOptionalDate(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

router.put("/entries/:entryId", requireCanvasAccess("edit"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const user = req.appUser!;
  const entryId = parseRouteParam(req.params.entryId);
  if (Number.isNaN(entryId)) {
    return sendError(res, ErrorKeys.income.invalidEntryId, 400);
  }

  const { destinationWalletId, amount, expectedDate, receivedDate, notes } = req.body;

  const parsedWalletId = Number(destinationWalletId);
  const parsedAmount = Number(amount);

  if (!parsedWalletId || Number.isNaN(parsedWalletId)) {
    return sendError(res, ErrorKeys.validation.walletRequired, 400);
  }

  if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
    return sendError(res, ErrorKeys.validation.amountPositive, 400);
  }

  try {
    const [existing] = await db.select().from(incomeEntries).where(eq(incomeEntries.id, entryId));
    if (!existing) return sendError(res, ErrorKeys.income.entryNotFound, 404);

    const [income] = await db.select().from(incomes).where(eq(incomes.id, existing.incomeId));
    if (!income || income.canvasId !== canvasId) {
      return sendError(res, ErrorKeys.income.entryNotFound, 404);
    }

    const [wallet] = await db.select().from(wallets).where(eq(wallets.id, parsedWalletId));
    if (!wallet || wallet.canvasId !== canvasId) {
      return sendError(res, ErrorKeys.income.destinationWalletInvalid, 400);
    }

    const amountStr = String(parsedAmount);
    const parsedExpectedDate = parseOptionalDate(expectedDate);
    const parsedReceivedDate = parseOptionalDate(receivedDate);

    const updated = await db.transaction(async (tx) => {
      await debitWalletBalance(
        {
          walletId: existing.destinationWalletId,
          currencyId: income.currencyId,
          amount: String(existing.amount),
          allowNegative: false,
        },
        tx
      );

      const [entry] = await tx
        .update(incomeEntries)
        .set({
          destinationWalletId: parsedWalletId,
          amount: amountStr,
          expectedDate: parsedExpectedDate,
          receivedDate: parsedReceivedDate,
          notes: notes || null,
          lastModifiedBy: user.id,
          lastModifiedAt: new Date(),
        })
        .where(eq(incomeEntries.id, entryId))
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

    res.json({ entry: updated });
  } catch (err) {
    console.error("Error updating income entry:", err);
    const message = err instanceof Error && err.message === "Insufficient wallet balance"
      ? "Insufficient wallet balance"
      : "Failed to update income entry";
    sendError(res, ErrorKeys.common.internal, 500);
  }
});

router.delete("/entries/:entryId", requireCanvasAccess("edit"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const entryId = parseRouteParam(req.params.entryId);
  if (Number.isNaN(entryId)) {
    return sendError(res, ErrorKeys.income.invalidEntryId, 400);
  }

  try {
    const [existing] = await db.select().from(incomeEntries).where(eq(incomeEntries.id, entryId));
    if (!existing) return sendError(res, ErrorKeys.income.entryNotFound, 404);

    const [income] = await db.select().from(incomes).where(eq(incomes.id, existing.incomeId));
    if (!income || income.canvasId !== canvasId) {
      return sendError(res, ErrorKeys.income.entryNotFound, 404);
    }

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
    sendError(res, ErrorKeys.income.entryDeleteFailed, 500);
  }
});

router.get("/:incomeId/entries", requireCanvasAccess("view"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const incomeId = parseRouteParam(req.params.incomeId);
  if (Number.isNaN(incomeId)) {
    return sendError(res, ErrorKeys.income.invalidId, 400);
  }

  try {
    const [income] = await db.select().from(incomes).where(eq(incomes.id, incomeId));
    if (!income || income.canvasId !== canvasId) {
      return sendError(res, ErrorKeys.income.notFound, 404);
    }

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
    sendError(res, ErrorKeys.income.entryFetchFailed, 500);
  }
});

router.post("/:incomeId/entries", requireCanvasAccess("edit"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const user = req.appUser!;
  const incomeId = parseRouteParam(req.params.incomeId);
  if (Number.isNaN(incomeId)) {
    return sendError(res, ErrorKeys.income.invalidId, 400);
  }

  const { destinationWalletId, amount, expectedDate, receivedDate, notes } = req.body;

  const parsedWalletId = Number(destinationWalletId);
  const parsedAmount = Number(amount);

  if (!parsedWalletId || Number.isNaN(parsedWalletId)) {
    return sendError(res, ErrorKeys.validation.walletRequired, 400);
  }

  if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
    return sendError(res, ErrorKeys.validation.amountPositive, 400);
  }

  try {
    const [income] = await db.select().from(incomes).where(eq(incomes.id, incomeId));
    if (!income || income.canvasId !== canvasId) {
      return sendError(res, ErrorKeys.income.notFound, 404);
    }

    const [wallet] = await db.select().from(wallets).where(eq(wallets.id, parsedWalletId));
    if (!wallet || wallet.canvasId !== canvasId) {
      return sendError(res, ErrorKeys.income.destinationWalletInvalid, 400);
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
      // Creates sub_wallet row on first entry for this wallet+currency via getOrCreateSubWalletRow

      return entry;
    });

    res.status(201).json({ entry: created });
  } catch (err) {
    console.error("Error creating income entry:", err);
    sendError(res, ErrorKeys.income.entryCreateFailed, 500);
  }
});

router.get("/", requireCanvasAccess("view"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;

  try {
    const { page, limit, search, offset } = parsePaginationParams(req);

    const whereCondition = search
      ? and(
          eq(incomes.canvasId, canvasId),
          eq(incomes.isArchived, false),
          ilike(incomes.name, `%${search}%`)
        )
      : and(eq(incomes.canvasId, canvasId), eq(incomes.isArchived, false));

    const [{ total }] = await db
      .select({ total: count() })
      .from(incomes)
      .where(whereCondition);

    const incomeList = await db
      .select({
        income: incomes,
        category: incomeCategories,
        currency: currencies,
        defaultWallet: wallets,
      })
      .from(incomes)
      .leftJoin(incomeCategories, eq(incomes.incomeCategoryId, incomeCategories.id))
      .leftJoin(currencies, eq(incomes.currencyId, currencies.id))
      .leftJoin(wallets, eq(incomes.defaultWalletId, wallets.id))
      .where(whereCondition)
      .orderBy(desc(incomes.lastModifiedAt))
      .limit(limit)
      .offset(offset);

    const formattedIncomes = incomeList.map((r) => ({
      ...r.income,
      category: r.category,
      currency: r.currency,
      defaultWallet: r.defaultWallet,
    }));

    res.json({ incomes: formattedIncomes, items: formattedIncomes, total, page, limit });
  } catch (err) {
    console.error("Error fetching incomes:", err);
    sendError(res, ErrorKeys.income.fetchFailed, 500);
  }
});

router.post("/", requireCanvasAccess("edit"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const user = req.appUser!;

  const {
    name,
    incomeCategoryId,
    currencyId,
    defaultWalletId,
    amount,
    isRecurring,
    recurrencePattern,
    photoUrl,
    description,
    status,
  } = req.body;

  if (!name || !incomeCategoryId || !currencyId) {
    return sendError(res, ErrorKeys.validation.failed, 400);
  }

  const parsedIncomeCategoryId = Number(incomeCategoryId);
  const parsedCurrencyId = Number(currencyId);
  const hasDefaultWallet =
    defaultWalletId !== undefined && defaultWalletId !== null && defaultWalletId !== "";
  const parsedDefaultWalletId = hasDefaultWallet ? Number(defaultWalletId) : undefined;

  if (Number.isNaN(parsedIncomeCategoryId) || Number.isNaN(parsedCurrencyId)) {
    return sendError(res, ErrorKeys.validation.invalidCategoryOrCurrency, 400);
  }

  if (parsedDefaultWalletId !== undefined && Number.isNaN(parsedDefaultWalletId)) {
    return sendError(res, ErrorKeys.validation.invalidWallet, 400);
  }

  try {
    if (parsedDefaultWalletId !== undefined) {
      const [wallet] = await db
        .select()
        .from(wallets)
        .where(eq(wallets.id, parsedDefaultWalletId));
      if (!wallet || wallet.canvasId !== canvasId) {
        return sendError(res, ErrorKeys.validation.defaultWalletInvalid, 400);
      }
    }

    const [newIncome] = await db
      .insert(incomes)
      .values({
        canvasId,
        name,
        incomeCategoryId: parsedIncomeCategoryId,
        currencyId: parsedCurrencyId,
        ...(parsedDefaultWalletId !== undefined && { defaultWalletId: parsedDefaultWalletId }),
        amount: Number(amount) || 0,
        isRecurring: isRecurring || false,
        recurrencePattern: recurrencePattern || null,
        photoUrl: photoUrl || null,
        description: description || null,
        status: status || "pending",
        createdBy: user.id,
        lastModifiedBy: user.id,
      })
      .returning();

    await registerWhiteboardNode(canvasId, "income", newIncome.id);

    res.status(201).json({ income: newIncome });
  } catch (err) {
    console.error("Error creating income:", err);
    sendError(res, ErrorKeys.income.createFailed, 500);
  }
});

router.get("/:incomeId", requireCanvasAccess("view"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const incomeId = parseRouteParam(req.params.incomeId);
  if (Number.isNaN(incomeId)) {
    return sendError(res, ErrorKeys.income.invalidId, 400);
  }

  try {
    const [record] = await db
      .select({ income: incomes, category: incomeCategories, defaultWallet: wallets })
      .from(incomes)
      .leftJoin(incomeCategories, eq(incomes.incomeCategoryId, incomeCategories.id))
      .leftJoin(wallets, eq(incomes.defaultWalletId, wallets.id))
      .where(eq(incomes.id, incomeId));

    if (!record || record.income.canvasId !== canvasId) {
      return sendError(res, ErrorKeys.income.notFound, 404);
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
    sendError(res, ErrorKeys.income.fetchFailed, 500);
  }
});

router.put("/:incomeId", requireCanvasAccess("edit"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const user = req.appUser!;
  const incomeId = parseRouteParam(req.params.incomeId);
  if (Number.isNaN(incomeId)) {
    return sendError(res, ErrorKeys.income.invalidId, 400);
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
    if (!existing || existing.canvasId !== canvasId) {
      return sendError(res, ErrorKeys.income.notFound, 404);
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
      return sendError(res, ErrorKeys.validation.invalidCategoryOrCurrency, 400);
    }

    if (typeof parsedDefaultWalletId === "number") {
      const [wallet] = await db
        .select()
        .from(wallets)
        .where(eq(wallets.id, parsedDefaultWalletId));
      if (!wallet || wallet.canvasId !== canvasId) {
        return sendError(res, ErrorKeys.validation.defaultWalletInvalid, 400);
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
    sendError(res, ErrorKeys.income.updateFailed, 500);
  }
});

router.delete("/:incomeId", requireCanvasAccess("edit"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const user = req.appUser!;
  const incomeId = parseRouteParam(req.params.incomeId);
  if (Number.isNaN(incomeId)) {
    return sendError(res, ErrorKeys.income.invalidId, 400);
  }

  try {
    const [existing] = await db.select().from(incomes).where(eq(incomes.id, incomeId));
    if (!existing || existing.canvasId !== canvasId) {
      return sendError(res, ErrorKeys.income.notFound, 404);
    }

    await db
      .update(incomes)
      .set({
        isArchived: true,
        lastModifiedBy: user.id,
        lastModifiedAt: new Date(),
      })
      .where(eq(incomes.id, incomeId));

    await unregisterWhiteboardNode(canvasId, "income", incomeId);

    res.json({ message: "Income archived successfully" });
  } catch (err) {
    console.error("Error deleting income:", err);
    sendError(res, ErrorKeys.income.deleteFailed, 500);
  }
});

export default router;
