import {
  pgTable,
  serial,
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
  AnyPgColumn,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",
  "completed",
  "failed",
  "cancelled",
]);

export const recurrenceFrequencyEnum = pgEnum("recurrence_frequency", [
  "daily",
  "weekly",
  "monthly",
  "yearly",
]);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    firstName: varchar("first_name", { length: 100 }),
    lastName: varchar("last_name", { length: 100 }),
    photoUrl: text("photo_url"),
    age: integer("age").$type<number | null>(),
    phone: varchar("phone", { length: 50 }),
    emailVerified: boolean("email_verified").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    createdBy: integer("created_by").references((): AnyPgColumn => users.id),
    lastModifiedAt: timestamp("last_modified_at", { withTimezone: true }).defaultNow(),
    lastModifiedBy: integer("last_modified_by").references((): AnyPgColumn => users.id),
  },
  (table) => [check("age_check", sql`${table.age} > 0`)]
);

export const canvases = pgTable("canvases", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  photoUrl: text("photo_url"),
  canvasType: varchar("canvas_type", { length: 50 }),
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  lastModifiedAt: timestamp("last_modified_at", { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer("last_modified_by").references(() => users.id),
});

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  permissions: jsonb("permissions"),
  isSystemRole: boolean("is_system_role").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  lastModifiedAt: timestamp("last_modified_at", { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer("last_modified_by").references(() => users.id),
});

export const currencies = pgTable("currencies", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  symbol: varchar("symbol", { length: 10 }).notNull(),
  decimals: integer("decimals").default(2),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  lastModifiedAt: timestamp("last_modified_at", { withTimezone: true }).defaultNow(),
});

export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id),
  timezone: varchar("timezone", { length: 100 }).default("UTC"),
  language: varchar("language", { length: 10 }).default("en"),
  dateFormat: varchar("date_format", { length: 50 }).default("YYYY-MM-DD"),
  defaultCurrencyId: integer("default_currency_id").references(() => currencies.id),
  // theme: varchar("theme", { length: 20 }).default("dark"),
  notificationEnabled: boolean("notification_enabled").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  lastModifiedAt: timestamp("last_modified_at", { withTimezone: true }).defaultNow(),
});

export const canvasMembers = pgTable(
  "canvas_members",
  {
    id: serial("id").primaryKey(),
    canvasId: integer("canvas_id").notNull().references(() => canvases.id),
    userId: integer("user_id").notNull().references(() => users.id),
    roleId: integer("role_id").references(() => roles.id),
    isOwner: boolean("is_owner").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    lastModifiedAt: timestamp("last_modified_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    uniqueCanvasUser: unique().on(table.canvasId, table.userId),
  })
);

export const walletCategories = pgTable("wallet_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  // isSystemCategory: boolean("is_system_category").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  // createdBy: integer("created_by").references(() => users.id),
  lastModifiedAt: timestamp("last_modified_at", { withTimezone: true }).defaultNow(),
  // lastModifiedBy: integer("last_modified_by").references(() => users.id),
});

export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  canvasId: integer("canvas_id").notNull().references(() => canvases.id),
  name: varchar("name", { length: 255 }).notNull(),
  walletCategoryId: integer("wallet_category_id").notNull().references(() => walletCategories.id),
  photoUrl: text("photo_url"),
  description: jsonb("description"),
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  lastModifiedAt: timestamp("last_modified_at", { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer("last_modified_by").references(() => users.id),
});

export const subWallets = pgTable(
  "sub_wallets",
  {
    id: serial("id").primaryKey(),
    walletId: integer("wallet_id").notNull().references(() => wallets.id),
    currencyId: integer("currency_id").notNull().references(() => currencies.id),
    amount: numeric("amount", { precision: 20, scale: 8 }).notNull().default("0"),
    address: varchar("address", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    lastModifiedAt: timestamp("last_modified_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    uniqueWalletCurrency: unique().on(table.walletId, table.currencyId),
  })
);

export const incomeCategories = pgTable("income_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  // isSystemCategory: boolean("is_system_category").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  // createdBy: integer("created_by").references(() => users.id),
  lastModifiedAt: timestamp("last_modified_at", { withTimezone: true }).defaultNow(),
  // lastModifiedBy: integer("last_modified_by").references(() => users.id),
});

export const incomes = pgTable("incomes", {
  id: serial("id").primaryKey(),
  canvasId: integer("canvas_id").notNull().references(() => canvases.id),
  name: varchar("name", { length: 255 }).notNull(),
  currencyId: integer("currency_id").notNull().references(() => currencies.id),
  defaultWalletId: integer("wallet_id").notNull().references(() => wallets.id),
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
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  lastModifiedAt: timestamp("last_modified_at", { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer("last_modified_by").references(() => users.id),
});

export const incomeEntries = pgTable(
  "income_entries",
  {
    id: serial("id").primaryKey(),
    incomeId: integer("income_id").notNull().references(() => incomes.id),
    destinationWalletId: integer("destination_wallet_id").notNull().references(() => wallets.id),
    amount: numeric("amount", { precision: 20, scale: 8 }).notNull(),
    expectedDate: timestamp("expected_date", { withTimezone: true }),
    receivedDate: timestamp("received_date", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    createdBy: integer("created_by").references(() => users.id),
    lastModifiedAt: timestamp("last_modified_at", { withTimezone: true }).defaultNow(),
    lastModifiedBy: integer("last_modified_by").references(() => users.id),
  },
  (table) => [check("income_entry_amount_check", sql`${table.amount} >= 0`)]
);

export const expenseCategories = pgTable("expense_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  // isSystemCategory: boolean("is_system_category").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  // createdBy: integer("created_by").references(() => users.id),
  lastModifiedAt: timestamp("last_modified_at", { withTimezone: true }).defaultNow(),
  // lastModifiedBy: integer("last_modified_by").references(() => users.id),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  canvasId: integer("canvas_id").notNull().references(() => canvases.id),
  name: varchar("name", { length: 255 }).notNull(),
  expenseCategoryId: integer("expense_category_id").notNull().references(() => expenseCategories.id),
  currencyId: integer("currency_id").notNull().references(() => currencies.id),
  defaultWalletId: integer("wallet_id").notNull().references(() => wallets.id),
  isRecurring: boolean("is_recurring").default(false),
  recurrencePattern: jsonb("recurrence_pattern"),
  status: transactionStatusEnum("status").default("pending"),
  description: jsonb("description"),
  photoUrl: text("photo_url"),
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  lastModifiedAt: timestamp("last_modified_at", { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer("last_modified_by").references(() => users.id),
});

export const expensePayments = pgTable(
  "expense_payments",
  {
    id: serial("id").primaryKey(),
    expenseId: integer("expense_id").notNull().references(() => expenses.id),
    sourceWalletId: integer("source_wallet_id").notNull().references(() => wallets.id),
    amount: numeric("amount", { precision: 20, scale: 8 }).notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }),
    paidDate: timestamp("paid_date", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    createdBy: integer("created_by").references(() => users.id),
    lastModifiedAt: timestamp("last_modified_at", { withTimezone: true }).defaultNow(),
    lastModifiedBy: integer("last_modified_by").references(() => users.id),
  },
  (table) => [check("expense_payment_amount_check", sql`${table.amount} >= 0`)]
);

export const transfers = pgTable(
  "transfers",
  {
    id: serial("id").primaryKey(),
    sourceWalletId: integer("source_wallet_id").notNull().references(() => subWallets.id),
    destinationWalletId: integer("destination_wallet_id").notNull().references(() => subWallets.id),
    sourceAmount: numeric("source_amount", { precision: 20, scale: 8 }).notNull(),
    destinationAmount: numeric("destination_amount", { precision: 20, scale: 8 }).notNull(),
    exchangeRate: numeric("exchange_rate", { precision: 20, scale: 8 }),
    transactionFee: numeric("transaction_fee", { precision: 20, scale: 8 }).default("0"),
    transferDate: timestamp("transfer_date", { withTimezone: true }).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    createdBy: integer("created_by").references(() => users.id),
    lastModifiedAt: timestamp("last_modified_at", { withTimezone: true }).defaultNow(),
    lastModifiedBy: integer("last_modified_by").references(() => users.id),
  },
  (table) => [
    check("transfer_source_amount_check", sql`${table.sourceAmount} >= 0`),
    check("transfer_destination_amount_check", sql`${table.destinationAmount} >= 0`),
  ]
);

export const wishlists = pgTable("wishlists", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  path: text("path").notNull().unique(),
  description: text("description"),
  photoUrl: text("photo_url"),
  isPublic: boolean("is_public").default(true),
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  lastModifiedAt: timestamp("last_modified_at", { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer("last_modified_by").references(() => users.id),
});

export const toBuyItems = pgTable("to_buy_items", {
  id: serial("id").primaryKey(),
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
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  lastModifiedAt: timestamp("last_modified_at", { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer("last_modified_by").references(() => users.id),
});

export const attachments = pgTable("attachments", {
  id: serial("id").primaryKey(),
  attachableType: varchar("attachable_type", { length: 100 }),
  attachableId: integer("attachable_id"),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  fileSize: bigint("file_size", { mode: "number" }),
  mimeType: varchar("mime_type", { length: 100 }),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const recurrencePatterns = pgTable("recurrence_patterns", {
  id: serial("id").primaryKey(),
  frequency: recurrenceFrequencyEnum("frequency").notNull(),
  interval: integer("interval").default(1),
  startDate: date("start_date"),
  endDate: date("end_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
