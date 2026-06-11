import { and, eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import { subWallets } from "../db/schema";

type BalanceTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function getOrCreateSubWalletRow(
  tx: BalanceTx,
  walletId: number,
  currencyId: number
) {
  const [existing] = await tx
    .select()
    .from(subWallets)
    .where(and(eq(subWallets.walletId, walletId), eq(subWallets.currencyId, currencyId)));

  if (existing) return existing;

  const [created] = await tx
    .insert(subWallets)
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
    const row = await getOrCreateSubWalletRow(tx, input.walletId, input.currencyId);

    const [updated] = await tx
      .update(subWallets)
      .set({
        amount: sql`${subWallets.amount} + ${input.amount}`,
        lastModifiedAt: new Date(),
      })
      .where(eq(subWallets.id, row.id))
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
    const row = await getOrCreateSubWalletRow(tx, input.walletId, input.currencyId);
    const current = Number(row.amount);
    const debit = Number(input.amount);

    if (!input.allowNegative && current < debit) {
      throw new Error("Insufficient wallet balance");
    }

    const [updated] = await tx
      .update(subWallets)
      .set({
        amount: sql`${subWallets.amount} - ${input.amount}`,
        lastModifiedAt: new Date(),
      })
      .where(eq(subWallets.id, row.id))
      .returning();

    return updated;
  });
}
