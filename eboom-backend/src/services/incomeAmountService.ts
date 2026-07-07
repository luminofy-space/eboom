import { and, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "../db/client";
import { incomeEntries, incomes } from "../db/schema";

type IncomeAmountTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function recalculateIncomeAmount(
  incomeId: number,
  tx?: IncomeAmountTx
): Promise<void> {
  const runner = tx ?? db;

  const [row] = await runner
    .select({
      total: sql<string>`coalesce(sum(${incomeEntries.amount}), 0)`,
    })
    .from(incomeEntries)
    .where(
      and(eq(incomeEntries.incomeId, incomeId), isNotNull(incomeEntries.receivedDate))
    );

  await runner
    .update(incomes)
    .set({
      amount: row?.total ?? "0",
      lastModifiedAt: new Date(),
    })
    .where(eq(incomes.id, incomeId));
}
