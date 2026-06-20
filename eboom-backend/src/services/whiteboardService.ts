import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db/client";
import {
  currencies,
  expenseCategories,
  expensePayments,
  expenses,
  incomeCategories,
  incomeEntries,
  incomes,
  subWallets,
  walletCategories,
  wallets,
  whiteboardNodePositions,
  whiteboardViewports,
  type WhiteboardEntityType,
} from "../db/schema";

export { type WhiteboardEntityType } from "../db/schema";

export interface WhiteboardNodePositionInput {
  entityType: WhiteboardEntityType;
  entityId: number;
  x: number;
  y: number;
}

export interface WhiteboardViewportInput {
  x: number;
  y: number;
  zoom: number;
}

const COLUMN_X: Record<WhiteboardEntityType, number> = {
  income: 0,
  wallet: 320,
  expense: 640,
};

const ROW_HEIGHT = 120;
const ROW_START_Y = 40;

function parseNumeric(value: string | number | null | undefined): number {
  if (value == null) return 0;
  return typeof value === "number" ? value : parseFloat(value);
}

function entityKey(entityType: WhiteboardEntityType, entityId: number): string {
  return `${entityType}:${entityId}`;
}

function defaultPosition(entityType: WhiteboardEntityType, rowIndex: number) {
  return {
    x: COLUMN_X[entityType],
    y: ROW_START_Y + rowIndex * ROW_HEIGHT,
  };
}

async function fetchActiveCanvasEntityIds(canvasId: number) {
  const [walletRows, incomeRows, expenseRows] = await Promise.all([
    db
      .select({ id: wallets.id })
      .from(wallets)
      .where(and(eq(wallets.canvasId, canvasId), eq(wallets.isArchived, false)))
      .orderBy(asc(wallets.id)),
    db
      .select({ id: incomes.id })
      .from(incomes)
      .where(and(eq(incomes.canvasId, canvasId), eq(incomes.isArchived, false)))
      .orderBy(asc(incomes.id)),
    db
      .select({ id: expenses.id })
      .from(expenses)
      .where(and(eq(expenses.canvasId, canvasId), eq(expenses.isArchived, false)))
      .orderBy(asc(expenses.id)),
  ]);

  return {
    walletIds: walletRows.map((row) => row.id),
    incomeIds: incomeRows.map((row) => row.id),
    expenseIds: expenseRows.map((row) => row.id),
  };
}

async function fetchNodePositions(canvasId: number) {
  return db
    .select()
    .from(whiteboardNodePositions)
    .where(eq(whiteboardNodePositions.canvasId, canvasId));
}

function buildMissingPositions(
  entityType: WhiteboardEntityType,
  entityIds: number[],
  existingKeys: Set<string>
): WhiteboardNodePositionInput[] {
  return entityIds
    .map((entityId, rowIndex) => ({ entityId, rowIndex }))
    .filter(({ entityId }) => !existingKeys.has(entityKey(entityType, entityId)))
    .map(({ entityId, rowIndex }) => ({
      entityType,
      entityId,
      ...defaultPosition(entityType, rowIndex),
    }));
}

async function insertWhiteboardNodePositionsIfMissing(
  canvasId: number,
  nodes: WhiteboardNodePositionInput[]
) {
  if (nodes.length === 0) return [];

  const inserted: WhiteboardNodePositionInput[] = [];
  for (const node of nodes) {
    const result = await db
      .insert(whiteboardNodePositions)
      .values({
        canvasId,
        entityType: node.entityType,
        entityId: node.entityId,
        x: String(node.x),
        y: String(node.y),
        updatedAt: new Date(),
      })
      .onConflictDoNothing({
        target: [
          whiteboardNodePositions.canvasId,
          whiteboardNodePositions.entityType,
          whiteboardNodePositions.entityId,
        ],
      })
      .returning();

    if (result.length > 0) {
      inserted.push(node);
    }
  }

  return inserted;
}

export async function syncWhiteboardNodePositions(canvasId: number) {
  const [{ walletIds, incomeIds, expenseIds }, existingRows] = await Promise.all([
    fetchActiveCanvasEntityIds(canvasId),
    fetchNodePositions(canvasId),
  ]);

  const existingKeys = new Set(
    existingRows.map((row) => entityKey(row.entityType, row.entityId))
  );

  const activeKeys = new Set<string>([
    ...incomeIds.map((id) => entityKey("income", id)),
    ...walletIds.map((id) => entityKey("wallet", id)),
    ...expenseIds.map((id) => entityKey("expense", id)),
  ]);

  const staleRows = existingRows.filter(
    (row) => !activeKeys.has(entityKey(row.entityType, row.entityId))
  );

  if (staleRows.length > 0) {
    await db.delete(whiteboardNodePositions).where(
      inArray(
        whiteboardNodePositions.id,
        staleRows.map((row) => row.id)
      )
    );
  }

  const missingNodes = [
    ...buildMissingPositions("income", incomeIds, existingKeys),
    ...buildMissingPositions("wallet", walletIds, existingKeys),
    ...buildMissingPositions("expense", expenseIds, existingKeys),
  ];

  await insertWhiteboardNodePositionsIfMissing(canvasId, missingNodes);
}

export async function registerWhiteboardNode(
  canvasId: number,
  entityType: WhiteboardEntityType,
  entityId: number,
  position?: { x: number; y: number }
) {
  const existingRows = await fetchNodePositions(canvasId);
  const alreadyRegistered = existingRows.some(
    (row) => row.entityType === entityType && row.entityId === entityId
  );
  if (alreadyRegistered) return;

  let nextPosition = position;
  if (!nextPosition) {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(whiteboardNodePositions)
      .where(
        and(
          eq(whiteboardNodePositions.canvasId, canvasId),
          eq(whiteboardNodePositions.entityType, entityType)
        )
      );
    nextPosition = defaultPosition(entityType, count ?? 0);
  }

  await insertWhiteboardNodePositionsIfMissing(canvasId, [
    {
      entityType,
      entityId,
      x: nextPosition.x,
      y: nextPosition.y,
    },
  ]);
}

export async function unregisterWhiteboardNode(
  canvasId: number,
  entityType: WhiteboardEntityType,
  entityId: number
) {
  await deleteWhiteboardNodePosition(canvasId, entityType, entityId);
}

export async function getWhiteboardData(canvasId: number) {
  await syncWhiteboardNodePositions(canvasId);

  const [viewportRow, nodePositions] = await Promise.all([
    db.select().from(whiteboardViewports).where(eq(whiteboardViewports.canvasId, canvasId)),
    fetchNodePositions(canvasId),
  ]);

  const incomeFlowRows = await db
    .select({
      incomeId: incomeEntries.incomeId,
      walletId: incomeEntries.destinationWalletId,
      entryCount: sql<number>`count(${incomeEntries.id})::int`,
      totalAmount: sql<string>`coalesce(sum(${incomeEntries.amount}), 0)`,
      currencyId: incomes.currencyId,
      currencyCode: currencies.code,
      currencySymbol: currencies.symbol,
    })
    .from(incomeEntries)
    .innerJoin(incomes, eq(incomeEntries.incomeId, incomes.id))
    .innerJoin(currencies, eq(incomes.currencyId, currencies.id))
    .where(and(eq(incomes.canvasId, canvasId), eq(incomes.isArchived, false)))
    .groupBy(
      incomeEntries.incomeId,
      incomeEntries.destinationWalletId,
      incomes.currencyId,
      currencies.code,
      currencies.symbol
    );

  const expenseFlowRows = await db
    .select({
      expenseId: expensePayments.expenseId,
      walletId: expensePayments.sourceWalletId,
      paymentCount: sql<number>`count(${expensePayments.id})::int`,
      totalAmount: sql<string>`coalesce(sum(${expensePayments.amount}), 0)`,
      currencyId: expenses.currencyId,
      currencyCode: currencies.code,
      currencySymbol: currencies.symbol,
    })
    .from(expensePayments)
    .innerJoin(expenses, eq(expensePayments.expenseId, expenses.id))
    .innerJoin(currencies, eq(expenses.currencyId, currencies.id))
    .where(and(eq(expenses.canvasId, canvasId), eq(expenses.isArchived, false)))
    .groupBy(
      expensePayments.expenseId,
      expensePayments.sourceWalletId,
      expenses.currencyId,
      currencies.code,
      currencies.symbol
    );

  const walletRows = await db
    .select({
      wallet: wallets,
      category: walletCategories,
    })
    .from(wallets)
    .leftJoin(walletCategories, eq(wallets.walletCategoryId, walletCategories.id))
    .where(and(eq(wallets.canvasId, canvasId), eq(wallets.isArchived, false)));

  const walletIds = walletRows.map((row) => row.wallet.id);
  const subWalletRows =
    walletIds.length > 0
      ? await db
          .select({ subWallet: subWallets, currency: currencies })
          .from(subWallets)
          .leftJoin(currencies, eq(subWallets.currencyId, currencies.id))
          .where(inArray(subWallets.walletId, walletIds))
      : [];

  const subWalletsByWalletId = subWalletRows.reduce<
    Record<
      number,
      Array<{
        subWallet: typeof subWallets.$inferSelect;
        currency: typeof currencies.$inferSelect | null;
      }>
    >
  >((acc, row) => {
    const walletId = row.subWallet.walletId;
    if (!acc[walletId]) acc[walletId] = [];
    acc[walletId].push(row);
    return acc;
  }, {});

  const incomeRows = await db
    .select({
      income: incomes,
      category: incomeCategories,
      currency: currencies,
    })
    .from(incomes)
    .leftJoin(incomeCategories, eq(incomes.incomeCategoryId, incomeCategories.id))
    .leftJoin(currencies, eq(incomes.currencyId, currencies.id))
    .where(and(eq(incomes.canvasId, canvasId), eq(incomes.isArchived, false)));

  const expenseRows = await db
    .select({
      expense: expenses,
      category: expenseCategories,
      currency: currencies,
    })
    .from(expenses)
    .leftJoin(expenseCategories, eq(expenses.expenseCategoryId, expenseCategories.id))
    .leftJoin(currencies, eq(expenses.currencyId, currencies.id))
    .where(and(eq(expenses.canvasId, canvasId), eq(expenses.isArchived, false)));

  const [viewport] = viewportRow;

  return {
    viewport: viewport
      ? {
          x: parseNumeric(viewport.x),
          y: parseNumeric(viewport.y),
          zoom: parseNumeric(viewport.zoom),
        }
      : { x: 0, y: 0, zoom: 1 },
    nodePositions: nodePositions.map((row) => ({
      entityType: row.entityType,
      entityId: row.entityId,
      x: parseNumeric(row.x),
      y: parseNumeric(row.y),
    })),
    incomeFlows: incomeFlowRows.map((row) => ({
      incomeId: row.incomeId,
      walletId: row.walletId,
      entryCount: row.entryCount,
      totalAmount: row.totalAmount,
      currencyId: row.currencyId,
      currencyCode: row.currencyCode,
      currencySymbol: row.currencySymbol,
    })),
    expenseFlows: expenseFlowRows.map((row) => ({
      expenseId: row.expenseId,
      walletId: row.walletId,
      paymentCount: row.paymentCount,
      totalAmount: row.totalAmount,
      currencyId: row.currencyId,
      currencyCode: row.currencyCode,
      currencySymbol: row.currencySymbol,
    })),
    wallets: walletRows.map((row) => ({
      ...row.wallet,
      category: row.category,
      subWallets: (subWalletsByWalletId[row.wallet.id] ?? []).map((sw) => ({
        ...sw.subWallet,
        currency: sw.currency,
      })),
    })),
    incomes: incomeRows.map((row) => ({
      ...row.income,
      category: row.category,
      currency: row.currency,
    })),
    expenses: expenseRows.map((row) => ({
      ...row.expense,
      category: row.category,
      currency: row.currency,
    })),
  };
}

export async function upsertWhiteboardViewport(
  canvasId: number,
  viewport: WhiteboardViewportInput
) {
  const [row] = await db
    .insert(whiteboardViewports)
    .values({
      canvasId,
      x: String(viewport.x),
      y: String(viewport.y),
      zoom: String(viewport.zoom),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: whiteboardViewports.canvasId,
      set: {
        x: String(viewport.x),
        y: String(viewport.y),
        zoom: String(viewport.zoom),
        updatedAt: new Date(),
      },
    })
    .returning();

  return {
    x: parseNumeric(row.x),
    y: parseNumeric(row.y),
    zoom: parseNumeric(row.zoom),
  };
}

export async function upsertWhiteboardNodePositions(
  canvasId: number,
  nodes: WhiteboardNodePositionInput[]
) {
  if (nodes.length === 0) return [];

  const results = [];
  for (const node of nodes) {
    const [row] = await db
      .insert(whiteboardNodePositions)
      .values({
        canvasId,
        entityType: node.entityType,
        entityId: node.entityId,
        x: String(node.x),
        y: String(node.y),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [
          whiteboardNodePositions.canvasId,
          whiteboardNodePositions.entityType,
          whiteboardNodePositions.entityId,
        ],
        set: {
          x: String(node.x),
          y: String(node.y),
          updatedAt: new Date(),
        },
      })
      .returning();

    results.push({
      entityType: row.entityType,
      entityId: row.entityId,
      x: parseNumeric(row.x),
      y: parseNumeric(row.y),
    });
  }

  return results;
}

export async function deleteWhiteboardNodePosition(
  canvasId: number,
  entityType: WhiteboardEntityType,
  entityId: number
) {
  await db
    .delete(whiteboardNodePositions)
    .where(
      and(
        eq(whiteboardNodePositions.canvasId, canvasId),
        eq(whiteboardNodePositions.entityType, entityType),
        eq(whiteboardNodePositions.entityId, entityId)
      )
    );
}
