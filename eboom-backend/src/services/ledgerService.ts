import { and, eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import { walletBalances } from "../db/schema";

type BalanceTx = any;

async function getOrCreateBalanceRow(
  tx: BalanceTx,
  walletId: number,
  currencyId: number
) {
  const [existing] = await tx
    .select()
    .from(walletBalances)
    .where(and(eq(walletBalances.walletId, walletId), eq(walletBalances.currencyId, currencyId)));

  if (existing) return existing;

  const [created] = await tx
    .insert(walletBalances)
    .values({
      walletId,
      currencyId,
      amount: "0",
    })
    .returning();

  return created;
}

export async function creditWalletBalance(input: {
  walletId: number;
  currencyId: number;
  amount: string;
}) {
  return db.transaction(async (tx) => {
    const row = await getOrCreateBalanceRow(tx, input.walletId, input.currencyId);

    const [updated] = await tx
      .update(walletBalances)
      .set({
        amount: sql`${walletBalances.amount} + ${input.amount}`,
        lastModifiedAt: new Date(),
      })
      .where(eq(walletBalances.id, row.id))
      .returning();

    return updated;
  });
}

export async function debitWalletBalance(input: {
  walletId: number;
  currencyId: number;
  amount: string;
  allowNegative?: boolean;
}) {
  return db.transaction(async (tx) => {
    const row = await getOrCreateBalanceRow(tx, input.walletId, input.currencyId);
    const current = Number(row.amount);
    const debit = Number(input.amount);

    if (!input.allowNegative && current < debit) {
      throw new Error("Insufficient wallet balance");
    }

    const [updated] = await tx
      .update(walletBalances)
      .set({
        amount: sql`${walletBalances.amount} - ${input.amount}`,
        lastModifiedAt: new Date(),
      })
      .where(eq(walletBalances.id, row.id))
      .returning();

    return updated;
  });
}
