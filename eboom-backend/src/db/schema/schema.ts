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

export const canvasInvitationStatusEnum = pgEnum("canvas_invitation_status", [
  "pending",
  "accepted",
  "declined",
  "cancelled",
  "expired",
]);

export const whiteboardEntityTypeEnum = pgEnum("whiteboard_entity_type", [
  "wallet",
  "income",
  "expense",
]);

export const budgetPeriodTypeEnum = pgEnum("budget_period_type", [
  "weekly",
  "monthly",
  "yearly",
]);

export const savingsGoalStatusEnum = pgEnum("savings_goal_status", [
  "active",
  "achieved",
  "dropped",
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
    passwordHash: varchar("password_hash", { length: 255 }),
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

export const canvasInvitations = pgTable(
  "canvas_invitations",
  {
    id: serial("id").primaryKey(),
    canvasId: integer("canvas_id").notNull().references(() => canvases.id),
    inviteeUserId: integer("invitee_user_id").notNull().references(() => users.id),
    inviteeEmail: varchar("invitee_email", { length: 255 }).notNull(),
    roleId: integer("role_id").notNull().references(() => roles.id),
    invitedBy: integer("invited_by").notNull().references(() => users.id),
    status: canvasInvitationStatusEnum("status").default("pending").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    lastModifiedAt: timestamp("last_modified_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    uniqueCanvasInvitee: unique("canvas_invitations_canvas_invitee_unique").on(
      table.canvasId,
      table.inviteeUserId
    ),
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

export const assetCategories = pgTable("asset_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  isSystematic: boolean("is_systematic").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  lastModifiedAt: timestamp("last_modified_at", { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer("last_modified_by").references(() => users.id),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
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
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  lastModifiedAt: timestamp("last_modified_at", { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer("last_modified_by").references(() => users.id),
});

export const assets = pgTable(
  "assets",
  {
    id: serial("id").primaryKey(),
    canvasId: integer("canvas_id").notNull().references(() => canvases.id),
    name: varchar("name", { length: 255 }).notNull(),
    assetCategoryId: integer("asset_category_id")
      .notNull()
      .references(() => assetCategories.id),
    currencyId: integer("currency_id").notNull().references(() => currencies.id),
    estimatedValue: numeric("estimated_value", { precision: 20, scale: 8 }).notNull(),
    photoUrl: text("photo_url"),
    description: jsonb("description"),
    isArchived: boolean("is_archived").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    createdBy: integer("created_by").notNull().references(() => users.id),
    lastModifiedAt: timestamp("last_modified_at", { withTimezone: true }).defaultNow(),
    lastModifiedBy: integer("last_modified_by").references(() => users.id),
  },
  (table) => [check("asset_estimated_value_check", sql`${table.estimatedValue} >= 0`)]
);

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

export const whiteboardViewports = pgTable("whiteboard_viewports", {
  canvasId: integer("canvas_id")
    .primaryKey()
    .references(() => canvases.id),
  x: numeric("x", { precision: 12, scale: 4 }).notNull().default("0"),
  y: numeric("y", { precision: 12, scale: 4 }).notNull().default("0"),
  zoom: numeric("zoom", { precision: 8, scale: 4 }).notNull().default("1"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const whiteboardNodePositions = pgTable(
  "whiteboard_node_positions",
  {
    id: serial("id").primaryKey(),
    canvasId: integer("canvas_id")
      .notNull()
      .references(() => canvases.id),
    entityType: whiteboardEntityTypeEnum("entity_type").notNull(),
    entityId: integer("entity_id").notNull(),
    x: numeric("x", { precision: 12, scale: 4 }).notNull(),
    y: numeric("y", { precision: 12, scale: 4 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    uniqueCanvasEntity: unique().on(table.canvasId, table.entityType, table.entityId),
  })
);

export const budgets = pgTable(
  "budgets",
  {
    id: serial("id").primaryKey(),
    canvasId: integer("canvas_id").notNull().references(() => canvases.id),
    currencyId: integer("currency_id").notNull().references(() => currencies.id),
    periodType: budgetPeriodTypeEnum("period_type").notNull(),
    periodStart: date("period_start").notNull(),
    totalLimit: numeric("total_limit", { precision: 20, scale: 8 }).notNull(),
    alertThresholdPercent: integer("alert_threshold_percent").notNull().default(80),
    alertsEnabled: boolean("alerts_enabled").notNull().default(true),
    name: varchar("name", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    createdBy: integer("created_by").notNull().references(() => users.id),
    lastModifiedAt: timestamp("last_modified_at", { withTimezone: true }).defaultNow(),
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

export const budgetLines = pgTable(
  "budget_lines",
  {
    id: serial("id").primaryKey(),
    budgetId: integer("budget_id")
      .notNull()
      .references(() => budgets.id, { onDelete: "cascade" }),
    expenseCategoryId: integer("expense_category_id")
      .notNull()
      .references(() => expenseCategories.id),
    amountLimit: numeric("amount_limit", { precision: 20, scale: 8 }).notNull(),
    alertThresholdPercent: integer("alert_threshold_percent"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    lastModifiedAt: timestamp("last_modified_at", { withTimezone: true }).defaultNow(),
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

export const aiInsightProfileStatusEnum = pgEnum("ai_insight_profile_status", [
  "draft",
  "completed",
]);

export const aiInsightProfiles = pgTable(
  "ai_insight_profiles",
  {
    id: serial("id").primaryKey(),
    canvasId: integer("canvas_id")
      .notNull()
      .unique()
      .references(() => canvases.id),
    status: aiInsightProfileStatusEnum("status").notNull().default("draft"),
    currentStep: integer("current_step").notNull().default(1),
    riskProfile: jsonb("risk_profile"),
    investmentGoals: jsonb("investment_goals"),
    esgPreferences: jsonb("esg_preferences"),
    financialKnowledge: jsonb("financial_knowledge"),
    financialPicture: jsonb("financial_picture"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    updatedByUserId: integer("updated_by_user_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    lastModifiedAt: timestamp("last_modified_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    check(
      "ai_insight_profile_current_step_check",
      sql`${table.currentStep} >= 1 AND ${table.currentStep} <= 5`
    ),
  ]
);

export const aiFinancialInsights = pgTable(
  "ai_financial_insights",
  {
    id: serial("id").primaryKey(),
    canvasId: integer("canvas_id")
      .notNull()
      .unique()
      .references(() => canvases.id),
    profileId: integer("profile_id").references(() => aiInsightProfiles.id),
    generatedByUserId: integer("generated_by_user_id")
      .notNull()
      .references(() => users.id),
    insights: jsonb("insights").notNull(),
    completenessScore: integer("completeness_score").notNull().default(0),
    completenessBreakdown: jsonb("completeness_breakdown"),
    contextSummary: jsonb("context_summary"),
    model: varchar("model", { length: 100 }).notNull(),
    generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    lastModifiedAt: timestamp("last_modified_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    check(
      "ai_financial_insights_completeness_check",
      sql`${table.completenessScore} >= 0 AND ${table.completenessScore} <= 100`
    ),
  ]
);

export const aiChatMessageRoleEnum = pgEnum("ai_chat_message_role", ["user", "assistant"]);

export const aiChatMessages = pgTable("ai_chat_messages", {
  id: serial("id").primaryKey(),
  canvasId: integer("canvas_id")
    .notNull()
    .references(() => canvases.id),
  userId: integer("user_id").references(() => users.id),
  role: aiChatMessageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  model: varchar("model", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const savingsGoals = pgTable(
  "savings_goals",
  {
    id: serial("id").primaryKey(),
    canvasId: integer("canvas_id").notNull().references(() => canvases.id),
    currencyId: integer("currency_id").notNull().references(() => currencies.id),
    name: varchar("name", { length: 255 }).notNull(),
    targetAmount: numeric("target_amount", { precision: 20, scale: 8 }).notNull(),
    targetDate: date("target_date"),
    linkedWalletId: integer("linked_wallet_id").references(() => wallets.id),
    alertThresholdPercent: integer("alert_threshold_percent").notNull().default(80),
    status: savingsGoalStatusEnum("status").notNull().default("active"),
    isArchived: boolean("is_archived").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    createdBy: integer("created_by").notNull().references(() => users.id),
    lastModifiedAt: timestamp("last_modified_at", { withTimezone: true }).defaultNow(),
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
