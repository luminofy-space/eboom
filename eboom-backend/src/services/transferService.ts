import { alias } from "drizzle-orm/pg-core";
import { and, desc, eq, or } from "drizzle-orm";
import { db } from "../db/client";
import {
  currencies,
  subWallets,
  transfers,
  wallets,
} from "../db/schema";
import {
  getOrCreateSubWalletRow,
  reverseTransferBalance,
  transferWalletBalance,
} from "./ledgerService";

type TransferTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface TransferInput {
  sourceWalletId: number;
  sourceCurrencyId: number;
  destinationWalletId: number;
  destinationCurrencyId: number;
  sourceAmount: string;
  destinationAmount: string;
  exchangeRate?: string | null;
  transactionFee?: string | null;
  transferDate: Date;
  notes?: string | null;
}

export interface EnrichedTransfer {
  id: number;
  sourceSubWalletId: number;
  destinationSubWalletId: number;
  sourceWalletId: number;
  sourceWalletName: string;
  sourceCurrencyId: number;
  sourceCurrencyCode: string;
  sourceCurrencySymbol: string;
  destinationWalletId: number;
  destinationWalletName: string;
  destinationCurrencyId: number;
  destinationCurrencyCode: string;
  destinationCurrencySymbol: string;
  sourceAmount: string;
  destinationAmount: string;
  exchangeRate: string | null;
  transactionFee: string;
  transferDate: string;
  notes: string | null;
  createdAt: string;
  createdBy: number | null;
  lastModifiedAt: string;
  lastModifiedBy: number | null;
}

function parseAmount(value: unknown, fieldName: string): string {
  const num = Number(value);
  if (!value || Number.isNaN(num) || num <= 0) {
    throw new Error(`A valid ${fieldName} greater than zero is required`);
  }
  return String(num);
}

function parseOptionalAmount(value: unknown): string {
  if (value == null || value === "") return "0";
  const num = Number(value);
  if (Number.isNaN(num) || num < 0) {
    throw new Error("Transaction fee must be zero or greater");
  }
  return String(num);
}

export function validateTransferInput(body: Record<string, unknown>): TransferInput {
  const sourceWalletId = Number(body.sourceWalletId);
  const sourceCurrencyId = Number(body.sourceCurrencyId);
  const destinationWalletId = Number(body.destinationWalletId);
  const destinationCurrencyId = Number(body.destinationCurrencyId);

  if (!sourceWalletId || Number.isNaN(sourceWalletId)) {
    throw new Error("Source wallet is required");
  }
  if (!sourceCurrencyId || Number.isNaN(sourceCurrencyId)) {
    throw new Error("Source currency is required");
  }
  if (!destinationWalletId || Number.isNaN(destinationWalletId)) {
    throw new Error("Destination wallet is required");
  }
  if (!destinationCurrencyId || Number.isNaN(destinationCurrencyId)) {
    throw new Error("Destination currency is required");
  }

  const sourceAmount = parseAmount(body.sourceAmount, "source amount");
  const destinationAmount = parseAmount(body.destinationAmount, "destination amount");
  const transactionFee = parseOptionalAmount(body.transactionFee);

  const transferDateRaw = body.transferDate;
  if (!transferDateRaw) {
    throw new Error("Transfer date is required");
  }
  const transferDate = new Date(String(transferDateRaw));
  if (Number.isNaN(transferDate.getTime())) {
    throw new Error("Invalid transfer date");
  }

  const sameCurrency = sourceCurrencyId === destinationCurrencyId;
  let exchangeRate: string | null = body.exchangeRate != null ? String(body.exchangeRate) : null;

  const feeNum = Number(transactionFee);
  const sourceNum = Number(sourceAmount);
  if (feeNum >= sourceNum) {
    throw new Error("Transaction fee must be less than the source amount");
  }

  if (sameCurrency) {
    if (sourceWalletId === destinationWalletId) {
      throw new Error("Source and destination must differ");
    }
    const expectedDest = sourceNum - feeNum;
    const actualDest = Number(destinationAmount);
    const tolerance = Math.max(0.01, expectedDest * 0.001);
    if (Math.abs(expectedDest - actualDest) > tolerance) {
      throw new Error("Destination amount must equal source amount minus fee");
    }
    exchangeRate = exchangeRate ?? "1";
  } else {
    if (!exchangeRate || Number.isNaN(Number(exchangeRate)) || Number(exchangeRate) <= 0) {
      throw new Error("Exchange rate is required for cross-currency transfers");
    }
    const expectedDest = (sourceNum - feeNum) * Number(exchangeRate);
    const actualDest = Number(destinationAmount);
    const tolerance = Math.max(0.01, expectedDest * 0.001);
    if (Math.abs(expectedDest - actualDest) > tolerance) {
      throw new Error("Destination amount does not match the exchange rate after fee");
    }
  }

  return {
    sourceWalletId,
    sourceCurrencyId,
    destinationWalletId,
    destinationCurrencyId,
    sourceAmount,
    destinationAmount,
    exchangeRate,
    transactionFee,
    transferDate,
    notes: body.notes != null ? String(body.notes) : null,
  };
}

async function validateWalletsSameCanvas(tx: TransferTx, input: TransferInput) {
  const [sourceWallet] = await tx
    .select()
    .from(wallets)
    .where(eq(wallets.id, input.sourceWalletId));
  const [destWallet] = await tx
    .select()
    .from(wallets)
    .where(eq(wallets.id, input.destinationWalletId));

  if (!sourceWallet) throw new Error("Source wallet not found");
  if (!destWallet) throw new Error("Destination wallet not found");
  if (sourceWallet.canvasId !== destWallet.canvasId) {
    throw new Error("Wallets must belong to the same canvas");
  }

  return { sourceWallet, destWallet };
}

async function resolveSubWalletIds(tx: TransferTx, input: TransferInput) {
  await validateWalletsSameCanvas(tx, input);

  const sourceSub = await getOrCreateSubWalletRow(tx, input.sourceWalletId, input.sourceCurrencyId);
  const destSub = await getOrCreateSubWalletRow(
    tx,
    input.destinationWalletId,
    input.destinationCurrencyId
  );

  if (sourceSub.id === destSub.id) {
    throw new Error("Source and destination must differ");
  }

  return {
    sourceSubWalletId: sourceSub.id,
    destinationSubWalletId: destSub.id,
  };
}

function toIsoString(value: Date | string | null | undefined): string {
  if (value == null) return new Date().toISOString();
  return value instanceof Date ? value.toISOString() : String(value);
}

const sourceSubWallet = alias(subWallets, "source_sub_wallet");
const destSubWallet = alias(subWallets, "dest_sub_wallet");
const sourceWallet = alias(wallets, "source_wallet");
const destWallet = alias(wallets, "dest_wallet");
const sourceCurrency = alias(currencies, "source_currency");
const destCurrency = alias(currencies, "dest_currency");

export async function enrichTransferById(transferId: number): Promise<EnrichedTransfer | null> {
  const [row] = await db
    .select({
      id: transfers.id,
      sourceSubWalletId: sourceSubWallet.id,
      destinationSubWalletId: destSubWallet.id,
      sourceWalletId: sourceWallet.id,
      sourceWalletName: sourceWallet.name,
      sourceCurrencyId: sourceCurrency.id,
      sourceCurrencyCode: sourceCurrency.code,
      sourceCurrencySymbol: sourceCurrency.symbol,
      destinationWalletId: destWallet.id,
      destinationWalletName: destWallet.name,
      destinationCurrencyId: destCurrency.id,
      destinationCurrencyCode: destCurrency.code,
      destinationCurrencySymbol: destCurrency.symbol,
      sourceAmount: transfers.sourceAmount,
      destinationAmount: transfers.destinationAmount,
      exchangeRate: transfers.exchangeRate,
      transactionFee: transfers.transactionFee,
      transferDate: transfers.transferDate,
      notes: transfers.notes,
      createdAt: transfers.createdAt,
      createdBy: transfers.createdBy,
      lastModifiedAt: transfers.lastModifiedAt,
      lastModifiedBy: transfers.lastModifiedBy,
    })
    .from(transfers)
    .innerJoin(sourceSubWallet, eq(transfers.sourceWalletId, sourceSubWallet.id))
    .innerJoin(sourceWallet, eq(sourceSubWallet.walletId, sourceWallet.id))
    .innerJoin(sourceCurrency, eq(sourceSubWallet.currencyId, sourceCurrency.id))
    .innerJoin(destSubWallet, eq(transfers.destinationWalletId, destSubWallet.id))
    .innerJoin(destWallet, eq(destSubWallet.walletId, destWallet.id))
    .innerJoin(destCurrency, eq(destSubWallet.currencyId, destCurrency.id))
    .where(eq(transfers.id, transferId));

  if (!row) return null;

  return {
    id: row.id,
    sourceSubWalletId: row.sourceSubWalletId,
    destinationSubWalletId: row.destinationSubWalletId,
    sourceWalletId: row.sourceWalletId,
    sourceWalletName: row.sourceWalletName,
    sourceCurrencyId: row.sourceCurrencyId,
    sourceCurrencyCode: row.sourceCurrencyCode,
    sourceCurrencySymbol: row.sourceCurrencySymbol,
    destinationWalletId: row.destinationWalletId,
    destinationWalletName: row.destinationWalletName,
    destinationCurrencyId: row.destinationCurrencyId,
    destinationCurrencyCode: row.destinationCurrencyCode,
    destinationCurrencySymbol: row.destinationCurrencySymbol,
    sourceAmount: String(row.sourceAmount),
    destinationAmount: String(row.destinationAmount),
    exchangeRate: row.exchangeRate != null ? String(row.exchangeRate) : null,
    transactionFee: String(row.transactionFee ?? "0"),
    transferDate: toIsoString(row.transferDate),
    notes: row.notes,
    createdAt: toIsoString(row.createdAt),
    createdBy: row.createdBy,
    lastModifiedAt: toIsoString(row.lastModifiedAt),
    lastModifiedBy: row.lastModifiedBy,
  };
}

export async function fetchEnrichedTransferById(transferId: number): Promise<EnrichedTransfer | null> {
  return enrichTransferById(transferId);
}

async function getSubWalletContext(subWalletId: number, tx: TransferTx) {
  const [row] = await tx
    .select({
      subWallet: subWallets,
      wallet: wallets,
    })
    .from(subWallets)
    .innerJoin(wallets, eq(subWallets.walletId, wallets.id))
    .where(eq(subWallets.id, subWalletId));

  if (!row) throw new Error("Transfer sub-wallets not found");
  return row;
}

export async function createTransfer(input: TransferInput, userId: number): Promise<EnrichedTransfer> {
  const created = await db.transaction(async (tx) => {
    const { sourceSubWalletId, destinationSubWalletId } = await resolveSubWalletIds(tx, input);

    await transferWalletBalance(
      {
        sourceWalletId: input.sourceWalletId,
        sourceCurrencyId: input.sourceCurrencyId,
        destinationWalletId: input.destinationWalletId,
        destinationCurrencyId: input.destinationCurrencyId,
        sourceAmount: input.sourceAmount,
        destinationAmount: input.destinationAmount,
        transactionFee: input.transactionFee ?? "0",
      },
      tx
    );

    const [transfer] = await tx
      .insert(transfers)
      .values({
        sourceWalletId: sourceSubWalletId,
        destinationWalletId: destinationSubWalletId,
        sourceAmount: input.sourceAmount,
        destinationAmount: input.destinationAmount,
        exchangeRate: input.exchangeRate,
        transactionFee: input.transactionFee ?? "0",
        transferDate: input.transferDate,
        notes: input.notes,
        createdBy: userId,
        lastModifiedBy: userId,
      })
      .returning();

    return transfer;
  });

  const enriched = await enrichTransferById(created.id);
  if (!enriched) throw new Error("Failed to load created transfer");
  return enriched;
}

export async function updateTransfer(
  transferId: number,
  input: TransferInput,
  userId: number
): Promise<EnrichedTransfer> {
  const updated = await db.transaction(async (tx) => {
    const [existing] = await tx.select().from(transfers).where(eq(transfers.id, transferId));
    if (!existing) throw new Error("Transfer not found");

    const oldSource = await getSubWalletContext(existing.sourceWalletId, tx);
    const oldDest = await getSubWalletContext(existing.destinationWalletId, tx);

    await reverseTransferBalance(
      {
        sourceWalletId: oldSource.wallet.id,
        sourceCurrencyId: oldSource.subWallet.currencyId,
        destinationWalletId: oldDest.wallet.id,
        destinationCurrencyId: oldDest.subWallet.currencyId,
        sourceAmount: String(existing.sourceAmount),
        destinationAmount: String(existing.destinationAmount),
        transactionFee: String(existing.transactionFee ?? "0"),
      },
      tx
    );

    const { sourceSubWalletId, destinationSubWalletId } = await resolveSubWalletIds(tx, input);

    await transferWalletBalance(
      {
        sourceWalletId: input.sourceWalletId,
        sourceCurrencyId: input.sourceCurrencyId,
        destinationWalletId: input.destinationWalletId,
        destinationCurrencyId: input.destinationCurrencyId,
        sourceAmount: input.sourceAmount,
        destinationAmount: input.destinationAmount,
        transactionFee: input.transactionFee ?? "0",
      },
      tx
    );

    const [transfer] = await tx
      .update(transfers)
      .set({
        sourceWalletId: sourceSubWalletId,
        destinationWalletId: destinationSubWalletId,
        sourceAmount: input.sourceAmount,
        destinationAmount: input.destinationAmount,
        exchangeRate: input.exchangeRate,
        transactionFee: input.transactionFee ?? "0",
        transferDate: input.transferDate,
        notes: input.notes,
        lastModifiedBy: userId,
        lastModifiedAt: new Date(),
      })
      .where(eq(transfers.id, transferId))
      .returning();

    return transfer;
  });

  const enriched = await enrichTransferById(updated.id);
  if (!enriched) throw new Error("Failed to load updated transfer");
  return enriched;
}

export async function deleteTransfer(transferId: number): Promise<void> {
  await db.transaction(async (tx) => {
    const [existing] = await tx.select().from(transfers).where(eq(transfers.id, transferId));
    if (!existing) throw new Error("Transfer not found");

    const oldSource = await getSubWalletContext(existing.sourceWalletId, tx);
    const oldDest = await getSubWalletContext(existing.destinationWalletId, tx);

    await reverseTransferBalance(
      {
        sourceWalletId: oldSource.wallet.id,
        sourceCurrencyId: oldSource.subWallet.currencyId,
        destinationWalletId: oldDest.wallet.id,
        destinationCurrencyId: oldDest.subWallet.currencyId,
        sourceAmount: String(existing.sourceAmount),
        destinationAmount: String(existing.destinationAmount),
        transactionFee: String(existing.transactionFee ?? "0"),
      },
      tx
    );

    await tx.delete(transfers).where(eq(transfers.id, transferId));
  });
}

export async function getTransferCanvasId(transferId: number): Promise<number | null> {
  const [row] = await db
    .select({ canvasId: sourceWallet.canvasId })
    .from(transfers)
    .innerJoin(sourceSubWallet, eq(transfers.sourceWalletId, sourceSubWallet.id))
    .innerJoin(sourceWallet, eq(sourceSubWallet.walletId, sourceWallet.id))
    .where(eq(transfers.id, transferId));

  return row?.canvasId ?? null;
}

export async function listTransfersForCanvas(
  canvasId: number,
  walletId?: number
): Promise<EnrichedTransfer[]> {
  const transferIds = await db
    .select({ id: transfers.id })
    .from(transfers)
    .innerJoin(sourceSubWallet, eq(transfers.sourceWalletId, sourceSubWallet.id))
    .innerJoin(sourceWallet, eq(sourceSubWallet.walletId, sourceWallet.id))
    .innerJoin(destSubWallet, eq(transfers.destinationWalletId, destSubWallet.id))
    .innerJoin(destWallet, eq(destSubWallet.walletId, destWallet.id))
    .where(
      and(
        eq(sourceWallet.canvasId, canvasId),
        eq(destWallet.canvasId, canvasId),
        walletId
          ? or(eq(sourceWallet.id, walletId), eq(destWallet.id, walletId))
          : undefined
      )
    )
    .orderBy(desc(transfers.transferDate));

  const enriched: EnrichedTransfer[] = [];
  for (const row of transferIds) {
    const item = await enrichTransferById(row.id);
    if (item) enriched.push(item);
  }
  return enriched;
}

export async function listTransfersForCanvasPaginated(
  canvasId: number,
  page: number,
  limit: number,
  options?: { walletId?: number; currencyCode?: string }
): Promise<{
  items: EnrichedTransfer[];
  total: number;
  page: number;
  limit: number;
  totalIn?: string;
  totalOut?: string;
}> {
  let all = await listTransfersForCanvas(canvasId, options?.walletId);

  if (options?.currencyCode) {
    const code = options.currencyCode;
    all = all.filter(
      (tr) =>
        tr.sourceCurrencyCode === code || tr.destinationCurrencyCode === code
    );
  }

  const total = all.length;
  const offset = (page - 1) * limit;
  const items = all.slice(offset, offset + limit);

  let totalIn: string | undefined;
  let totalOut: string | undefined;

  if (options?.walletId) {
    const walletId = options.walletId;
    const code = options.currencyCode;
    totalOut = String(
      all
        .filter(
          (tr) =>
            tr.sourceWalletId === walletId &&
            (!code || tr.sourceCurrencyCode === code)
        )
        .reduce((sum, tr) => sum + parseFloat(tr.sourceAmount), 0)
    );
    totalIn = String(
      all
        .filter(
          (tr) =>
            tr.destinationWalletId === walletId &&
            (!code || tr.destinationCurrencyCode === code)
        )
        .reduce((sum, tr) => sum + parseFloat(tr.destinationAmount), 0)
    );
  }

  return { items, total, page, limit, totalIn, totalOut };
}

export async function listTransfersForWallet(walletId: number): Promise<EnrichedTransfer[]> {
  const [wallet] = await db.select().from(wallets).where(eq(wallets.id, walletId));
  if (!wallet) return [];
  return listTransfersForCanvas(wallet.canvasId, walletId);
}
