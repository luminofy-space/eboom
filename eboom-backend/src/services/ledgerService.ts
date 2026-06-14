import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { subWallets } from "../db/schema";

type BalanceTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function addAmounts(current: string, delta: string): string {
  return (Number(current) + Number(delta)).toString();
}

function subtractAmounts(current: string, delta: string): string {
  return (Number(current) - Number(delta)).toString();
}

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

export async function creditWalletBalance(
  input: {
    walletId: number;
    currencyId: number;
    amount: string;
  },
  tx?: BalanceTx
) {
  const run = async (transaction: BalanceTx) => {
    const row = await getOrCreateSubWalletRow(transaction, input.walletId, input.currencyId);

    const [updated] = await transaction
      .update(subWallets)
      .set({
        amount: addAmounts(String(row.amount), input.amount),
        lastModifiedAt: new Date(),
      })
      .where(eq(subWallets.id, row.id))
      .returning();

    return updated;
  };

  return tx ? run(tx) : db.transaction(run);
}

export async function debitWalletBalance(
  input: {
    walletId: number;
    currencyId: number;
    amount: string;
    allowNegative?: boolean;
  },
  tx?: BalanceTx
) {
  const run = async (transaction: BalanceTx) => {
    const row = await getOrCreateSubWalletRow(transaction, input.walletId, input.currencyId);
    const current = Number(row.amount);
    const debit = Number(input.amount);

    if (!input.allowNegative && current < debit) {
      throw new Error("Insufficient wallet balance");
    }

    const [updated] = await transaction
      .update(subWallets)
      .set({
        amount: subtractAmounts(String(row.amount), input.amount),
        lastModifiedAt: new Date(),
      })
      .where(eq(subWallets.id, row.id))
      .returning();

    return updated;
  };

  return tx ? run(tx) : db.transaction(run);
}
