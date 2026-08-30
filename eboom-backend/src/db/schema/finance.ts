// The money core. Balance mutations belong in `services/ledgerService.ts`;
// route handlers must never write `sub_wallets` directly.

import {
  integer,
  varchar,
  text,
  jsonb,
  timestamp,
  numeric,
  boolean,
  date,
  bigint,
  unique,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { financeSchema } from "./schemas";
import { pk, createdAt, lastModifiedAt } from "./columns";
import { canvases, users } from "./identity";
import { assetCategories, currencies, expenseCategories, incomeCategories, walletCategories } from "./reference";

export const transactionStatusEnum = financeSchema.enum("transaction_status", [
  "pending",
  "completed",
  "failed",
  "cancelled",
]);

export const recurrenceFrequencyEnum = financeSchema.enum("recurrence_frequency", [
  "daily",
  "weekly",
  "monthly",
  "yearly",
]);

export const budgetPeriodTypeEnum = financeSchema.enum("budget_period_type", [
  "weekly",
  "monthly",
  "yearly",
]);

export const savingsGoalStatusEnum = financeSchema.enum("savings_goal_status", [
  "active",
  "achieved",
  "dropped",
]);

export const wallets = financeSchema.table("wallets", {
  id: pk(),
  canvasId: integer("canvas_id").notNull().references(() => canvases.id),
  name: varchar("name", { length: 255 }).notNull(),
  walletCategoryId: integer("wallet_category_id").notNull().references(() => walletCategories.id),
  photoUrl: text("photo_url"),
  description: jsonb("description"),
  isArchived: boolean("is_archived").default(false),
  createdAt: createdAt(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  lastModifiedAt: lastModifiedAt(),
  lastModifiedBy: integer("last_modified_by").references(() => users.id),
});

export const subWallets = financeSchema.table("sub_wallets",
  {
    id: pk(),
    walletId: integer("wallet_id").notNull().references(() => wallets.id),
    currencyId: integer("currency_id").notNull().references(() => currencies.id),
    amount: numeric("amount", { precision: 20, scale: 8 }).notNull().default("0"),
    address: varchar("address", { length: 255 }),
    createdAt: createdAt(),
    lastModifiedAt: lastModifiedAt(),
  },
  (table) => ({
    uniqueWalletCurrency: unique().on(table.walletId, table.currencyId),
  })
);

export const incomes = financeSchema.table("incomes", {
  id: pk(),
  canvasId: integer("canvas_id").notNull().references(() => canvases.id),
  name: varchar("name", { length: 255 }).notNull(),
  currencyId: integer("currency_id").notNull().references(() => currencies.id),
  defaultWalletId: integer("wallet_id").references(() => wallets.id),
  amount: integer("amount").notNull(),
  incomeCategoryId: integer("income_category_id")
    .notNull()
    .references(() => incomeCategories.id),
  isRecurring: boolean("is_recurring").default(false),
  recurrencePattern: jsonb("recurrence_pattern"),
  status: transactionStatusEnum("status").default("pending"),
  photoUrl: text("photo_url"),
  description: jsonb("description"),
  isArchived: boolean("is_archived").default(false),
  createdAt: createdAt(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  lastModifiedAt: lastModifiedAt(),
  lastModifiedBy: integer("last_modified_by").references(() => users.id),
});

export const incomeEntries = financeSchema.table("income_entries",
  {
    id: pk(),
    incomeId: integer("income_id").notNull().references(() => incomes.id),
    destinationWalletId: integer("destination_wallet_id").notNull().references(() => wallets.id),
    amount: numeric("amount", { precision: 20, scale: 8 }).notNull(),
    expectedDate: timestamp("expected_date", { withTimezone: true }),
    receivedDate: timestamp("received_date", { withTimezone: true }),
    notes: text("notes"),
    createdAt: createdAt(),
    createdBy: integer("created_by").references(() => users.id),
    lastModifiedAt: lastModifiedAt(),
    lastModifiedBy: integer("last_modified_by").references(() => users.id),
  },
  (table) => [check("income_entry_amount_check", sql`${table.amount} >= 0`)]
);

export const expenses = financeSchema.table("expenses", {
  id: pk(),
  canvasId: integer("canvas_id").notNull().references(() => canvases.id),
  name: varchar("name", { length: 255 }).notNull(),
  expenseCategoryId: integer("expense_category_id").notNull().references(() => expenseCategories.id),
  currencyId: integer("currency_id").notNull().references(() => currencies.id),
  defaultWalletId: integer("wallet_id").references(() => wallets.id),
  isRecurring: boolean("is_recurring").default(false),
  recurrencePattern: jsonb("recurrence_pattern"),
  status: transactionStatusEnum("status").default("pending"),
  description: jsonb("description"),
  photoUrl: text("photo_url"),
  isArchived: boolean("is_archived").default(false),
  createdAt: createdAt(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  lastModifiedAt: lastModifiedAt(),
  lastModifiedBy: integer("last_modified_by").references(() => users.id),
});

export const assets = financeSchema.table("assets", {
  id: pk(),
  canvasId: integer("canvas_id").notNull().references(() => canvases.id),
  name: varchar("name", { length: 255 }).notNull(),
  assetCategoryId: integer("asset_category_id")
    .notNull()
    .references(() => assetCategories.id),
  currencyId: integer("currency_id").notNull().references(() => currencies.id),
  photoUrl: text("photo_url"),
  description: jsonb("description"),
  isArchived: boolean("is_archived").default(false),
  createdAt: createdAt(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  lastModifiedAt: lastModifiedAt(),
  lastModifiedBy: integer("last_modified_by").references(() => users.id),
});

export const assetVolumes = financeSchema.table("asset_volumes",
  {
    id: pk(),
    assetId: integer("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    quantity: numeric("quantity", { precision: 20, scale: 8 }).notNull(),
    unitPrice: numeric("unit_price", { precision: 20, scale: 8 }).notNull(),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull(),
    notes: text("notes"),
    createdAt: createdAt(),
    createdBy: integer("created_by").notNull().references(() => users.id),
  },
  (table) => [
    check("asset_volume_quantity_nonzero_check", sql`${table.quantity} <> 0`),
    check("asset_volume_unit_price_check", sql`${table.unitPrice} >= 0`),
  ]
);

export const pricePoints = financeSchema.table("price_points",
  {
    id: pk(),
    assetId: integer("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    unitPrice: numeric("unit_price", { precision: 20, scale: 8 }).notNull(),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull(),
    notes: text("notes"),
    createdAt: createdAt(),
    createdBy: integer("created_by").notNull().references(() => users.id),
  },
  (table) => [check("price_point_unit_price_check", sql`${table.unitPrice} >= 0`)]
);

export const expensePayments = financeSchema.table("expense_payments",
  {
    id: pk(),
    expenseId: integer("expense_id").notNull().references(() => expenses.id),
    sourceWalletId: integer("source_wallet_id").notNull().references(() => wallets.id),
    amount: numeric("amount", { precision: 20, scale: 8 }).notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }),
    paidDate: timestamp("paid_date", { withTimezone: true }),
    notes: text("notes"),
    createdAt: createdAt(),
    createdBy: integer("created_by").references(() => users.id),
    lastModifiedAt: lastModifiedAt(),
    lastModifiedBy: integer("last_modified_by").references(() => users.id),
  },
  (table) => [check("expense_payment_amount_check", sql`${table.amount} >= 0`)]
);

export const transfers = financeSchema.table("transfers",
  {
    id: pk(),
    sourceWalletId: integer("source_wallet_id").notNull().references(() => subWallets.id),
    destinationWalletId: integer("destination_wallet_id").notNull().references(() => subWallets.id),
    sourceAmount: numeric("source_amount", { precision: 20, scale: 8 }).notNull(),
    destinationAmount: numeric("destination_amount", { precision: 20, scale: 8 }).notNull(),
    exchangeRate: numeric("exchange_rate", { precision: 20, scale: 8 }),
    transactionFee: numeric("transaction_fee", { precision: 20, scale: 8 }).default("0"),
    transferDate: timestamp("transfer_date", { withTimezone: true }).notNull(),
    notes: text("notes"),
    createdAt: createdAt(),
    createdBy: integer("created_by").references(() => users.id),
    lastModifiedAt: lastModifiedAt(),
    lastModifiedBy: integer("last_modified_by").references(() => users.id),
  },
  (table) => [
    check("transfer_source_amount_check", sql`${table.sourceAmount} >= 0`),
    check("transfer_destination_amount_check", sql`${table.destinationAmount} >= 0`),
  ]
);

export const wishlists = financeSchema.table("wishlists", {
  id: pk(),
  name: varchar("name", { length: 255 }).notNull(),
  path: text("path").notNull().unique(),
  description: text("description"),
  photoUrl: text("photo_url"),
  isPublic: boolean("is_public").default(true),
  isArchived: boolean("is_archived").default(false),
  createdAt: createdAt(),
  createdBy: integer("created_by").references(() => users.id),
  lastModifiedAt: lastModifiedAt(),
  lastModifiedBy: integer("last_modified_by").references(() => users.id),
});

export const toBuyItems = financeSchema.table("to_buy_items", {
  id: pk(),
  wishlistId: integer("wishlist_id").notNull().references(() => wishlists.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  estimatedPrice: numeric("estimated_price", { precision: 20, scale: 8 }),
  currencyId: integer("currency_id").references(() => currencies.id),
  priority: integer("priority").default(0),
  // category: varchar("category", { length: 100 }),
  dueDate: date("due_date"),
  targetPurchaseDate: date("target_purchase_date"),
  purchaseDate: date("actual_purchase_date"),
  price: numeric("actual_price", { precision: 20, scale: 8 }),
  purchasedFromWalletId: integer("purchased_from_wallet_id").references(() => wallets.id),
  status: varchar("status", { length: 50 }),
  links: jsonb("links"),
  photoUrl: text("photo_url"),
  isArchived: boolean("is_archived").default(false),
  createdAt: createdAt(),
  createdBy: integer("created_by").references(() => users.id),
  lastModifiedAt: lastModifiedAt(),
  lastModifiedBy: integer("last_modified_by").references(() => users.id),
});

export const attachments = financeSchema.table("attachments", {
  id: pk(),
  attachableType: varchar("attachable_type", { length: 100 }),
  attachableId: integer("attachable_id"),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  fileSize: bigint("file_size", { mode: "number" }),
  mimeType: varchar("mime_type", { length: 100 }),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  createdAt: createdAt(),
});

export const recurrencePatterns = financeSchema.table("recurrence_patterns", {
  id: pk(),
  frequency: recurrenceFrequencyEnum("frequency").notNull(),
  interval: integer("interval").default(1),
  startDate: date("start_date"),
  endDate: date("end_date"),
  createdAt: createdAt(),
});

export const budgets = financeSchema.table("budgets",
  {
    id: pk(),
    canvasId: integer("canvas_id").notNull().references(() => canvases.id),
    currencyId: integer("currency_id").notNull().references(() => currencies.id),
    periodType: budgetPeriodTypeEnum("period_type").notNull(),
    periodStart: date("period_start").notNull(),
    totalLimit: numeric("total_limit", { precision: 20, scale: 8 }).notNull(),
    alertThresholdPercent: integer("alert_threshold_percent").notNull().default(80),
    alertsEnabled: boolean("alerts_enabled").notNull().default(true),
    name: varchar("name", { length: 255 }),
    createdAt: createdAt(),
    createdBy: integer("created_by").notNull().references(() => users.id),
    lastModifiedAt: lastModifiedAt(),
    lastModifiedBy: integer("last_modified_by").references(() => users.id),
  },
  (table) => [
    unique("budgets_canvas_currency_period_unique").on(
      table.canvasId,
      table.currencyId,
      table.periodType
    ),
    check("budget_total_limit_check", sql`${table.totalLimit} >= 0`),
    check(
      "budget_alert_threshold_check",
      sql`${table.alertThresholdPercent} >= 1 AND ${table.alertThresholdPercent} <= 100`
    ),
  ]
);

export const budgetLines = financeSchema.table("budget_lines",
  {
    id: pk(),
    budgetId: integer("budget_id")
      .notNull()
      .references(() => budgets.id, { onDelete: "cascade" }),
    expenseCategoryId: integer("expense_category_id")
      .notNull()
      .references(() => expenseCategories.id),
    amountLimit: numeric("amount_limit", { precision: 20, scale: 8 }).notNull(),
    alertThresholdPercent: integer("alert_threshold_percent"),
    createdAt: createdAt(),
    lastModifiedAt: lastModifiedAt(),
  },
  (table) => [
    unique("budget_lines_budget_category_unique").on(table.budgetId, table.expenseCategoryId),
    check("budget_line_amount_check", sql`${table.amountLimit} >= 0`),
    check(
      "budget_line_alert_threshold_check",
      sql`${table.alertThresholdPercent} IS NULL OR (${table.alertThresholdPercent} >= 1 AND ${table.alertThresholdPercent} <= 100)`
    ),
  ]
);

export const savingsGoals = financeSchema.table("savings_goals",
  {
    id: pk(),
    canvasId: integer("canvas_id").notNull().references(() => canvases.id),
    currencyId: integer("currency_id").notNull().references(() => currencies.id),
    name: varchar("name", { length: 255 }).notNull(),
    targetAmount: numeric("target_amount", { precision: 20, scale: 8 }).notNull(),
    targetDate: date("target_date"),
    photoUrl: text("photo_url"),
    linkedWalletId: integer("linked_wallet_id").references(() => wallets.id),
    alertThresholdPercent: integer("alert_threshold_percent").notNull().default(80),
    status: savingsGoalStatusEnum("status").notNull().default("active"),
    isArchived: boolean("is_archived").default(false),
    createdAt: createdAt(),
    createdBy: integer("created_by").notNull().references(() => users.id),
    lastModifiedAt: lastModifiedAt(),
    lastModifiedBy: integer("last_modified_by").references(() => users.id),
  },
  (table) => [
    check("savings_goal_target_check", sql`${table.targetAmount} > 0`),
    check(
      "savings_goal_alert_threshold_check",
      sql`${table.alertThresholdPercent} >= 1 AND ${table.alertThresholdPercent} <= 100`
    ),
  ]
);
