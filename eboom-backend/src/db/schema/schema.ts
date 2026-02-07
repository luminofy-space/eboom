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
  AnyPgColumn
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// ============================================================================
// CORE USER & AUTHENTICATION
// ============================================================================

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  photoUrl: text('photo_url'),
  age: integer('age').$type<number | null>(),
  phone: varchar('phone', { length: 50 }),
  emailVerified: boolean('email_verified').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references((): AnyPgColumn => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references((): AnyPgColumn => users.id),
}, (table) => [
  check("age_check1", sql`${table.age} > 0`),
]);

export const userSettings = pgTable('user_settings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique().references(() => users.id),
  timezone: varchar('timezone', { length: 100 }).default('UTC'),
  language: varchar('language', { length: 10 }).default('en'),
  dateFormat: varchar('date_format', { length: 50 }).default('YYYY-MM-DD'),
  defaultCurrencyId: integer('default_currency_id').references(() => currencies.id),
  theme: varchar('theme', { length: 20 }).default('dark'),
  notificationEnabled: boolean('notification_enabled').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// CANVAS & COLLABORATION
// ============================================================================

export const canvases = pgTable('canvases', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  photoUrl: text('photo_url'),
  canvasType: varchar('canvas_type', { length: 50 }),
  isArchived: boolean('is_archived').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
});

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  permissions: jsonb('permissions'),
  isSystemRole: boolean('is_system_role').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
});

export const canvasMembers = pgTable('canvas_members', {
  id: serial('id').primaryKey(),
  canvasId: integer('canvas_id').notNull().references(() => canvases.id),
  userId: integer('user_id').notNull().references(() => users.id),
  roleId: integer('role_id').references(() => roles.id),
  baseCurrencyId: integer('base_currency_id').notNull().references(() => currencies.id),
  isOwner: boolean('is_owner').default(false),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
}, (table) => ({
  uniqueCanvasUser: unique().on(table.canvasId, table.userId),
}));

export const canvasInvitations = pgTable('canvas_invitations', {
  id: serial('id').primaryKey(),
  canvasId: integer('canvas_id').notNull().references(() => canvases.id),
  inviterId: integer('inviter_id').notNull().references(() => users.id),
  inviteeEmail: varchar('invitee_email', { length: 255 }).notNull(),
  roleId: integer('role_id').references(() => roles.id),
  invitationToken: varchar('invitation_token', { length: 255 }).unique(),
  status: varchar('status', { length: 50 }).default('pending'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// CURRENCY & ASSET TYPES
// ============================================================================

export const currencies = pgTable('currencies', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 10 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  symbol: varchar('symbol', { length: 10 }).notNull(),
  type: varchar('type', { length: 50 }),
  decimals: integer('decimals').default(2),
  photoUrl: text('photo_url'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
});

export const currencyExchangeRates = pgTable('currency_exchange_rates', {
  id: serial('id').primaryKey(),
  fromCurrencyId: integer('from_currency_id').notNull().references(() => currencies.id),
  toCurrencyId: integer('to_currency_id').notNull().references(() => currencies.id),
  rate: numeric('rate', { precision: 20, scale: 8 }).notNull(),
  rateDate: timestamp('rate_date', { withTimezone: true }).notNull(),
  source: varchar('source', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const valueCategories = pgTable('value_categories', {
  id: serial('id').primaryKey(),
  canvasId: integer('canvas_id').references(() => canvases.id),
  name: varchar('name', { length: 255 }).notNull(),
  categoryType: varchar('category_type', { length: 100 }),
  currencyId: integer('currency_id').references(() => currencies.id),
  unit: varchar('unit', { length: 50 }),
  isFungible: boolean('is_fungible').default(true),
  isWalletCompatible: boolean('is_wallet_compatible').default(false),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
});

// ============================================================================
// ENTITIES (PEOPLE, COMPANIES, SHOPS)
// ============================================================================

export const entityTypes = pgTable('entity_types', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const entities = pgTable('entities', {
  id: serial('id').primaryKey(),
  canvasId: integer('canvas_id').notNull().references(() => canvases.id),
  entityTypeId: integer('entity_type_id').references(() => entityTypes.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: jsonb('description'),
  contactInfo: jsonb('contact_info'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
});

// ============================================================================
// WALLET MANAGEMENT
// ============================================================================

export const walletCategories = pgTable('wallet_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  photoUrl: text('photo_url'),
  isSystemCategory: boolean('is_system_category').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
});

export const wallets = pgTable('wallets', {
  id: serial('id').primaryKey(),
  canvasId: integer('canvas_id').notNull().references(() => canvases.id),
  name: varchar('name', { length: 255 }).notNull(),
  walletCategoryId: integer('wallet_category_id').notNull().references(() => walletCategories.id),
  ownerId: integer('owner_id').notNull().references(() => users.id),
  walletNumber: varchar('wallet_number', { length: 255 }),
  entityId: integer('entity_id').references(() => entities.id),
  description: jsonb('description'),
  isArchived: boolean('is_archived').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
});

export const assets = pgTable('assets', {
  id: serial('id').primaryKey(),
  canvasId: integer('canvas_id').references(() => canvases.id),
  name: varchar('name', { length: 255 }).notNull(),
  valueCategoryId: integer('value_category_id').notNull().references(() => valueCategories.id),
  walletId: integer('wallet_id').references(() => wallets.id),
  ownerId: integer('owner_id').references(() => users.id),
  quantity: numeric('quantity', { precision: 20, scale: 8 }).default('0'),
  purchasePrice: numeric('purchase_price', { precision: 20, scale: 8 }),
  purchaseCurrencyId: integer('purchase_currency_id').references(() => currencies.id),
  purchaseDate: timestamp('purchase_date', { withTimezone: true }),
  currentValue: numeric('current_value', { precision: 20, scale: 8 }),
  description: jsonb('description'),
  photoUrl: text('photo_url'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
});

// ============================================================================
// INCOME MANAGEMENT
// ============================================================================

export const incomeResourceCategories = pgTable('income_resource_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  photoUrl: text('photo_url'),
  isSystemCategory: boolean('is_system_category').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
});

export const incomeResources = pgTable('income_resources', {
  id: serial('id').primaryKey(),
  canvasId: integer('canvas_id').notNull().references(() => canvases.id),
  name: varchar('name', { length: 255 }).notNull(),
  incomeResourceCategoryId: integer('income_resource_category_id').notNull().references(() => incomeResourceCategories.id),
  ownerId: integer('owner_id').notNull().references(() => users.id),
  defaultValueCategoryId: integer('default_value_category_id').notNull().references(() => valueCategories.id),
  defaultEntityId: integer('default_entity_id').references(() => entities.id),
  defaultAssetId: integer('default_asset_id').references(() => assets.id),
  isRecurring: boolean('is_recurring').default(false),
  recurrencePattern: jsonb('recurrence_pattern'),
  photoUrl: text('photo_url'),
  description: jsonb('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
});

export const incomeTransactions = pgTable('income_transactions', {
  id: serial('id').primaryKey(),
  incomeResourceId: integer('income_resource_id').references(() => incomeResources.id),
  destinationAssetId: integer('destination_asset_id').notNull().references(() => assets.id),
  amount: numeric('amount', { precision: 20, scale: 8 }).notNull(),
  expectedDate: timestamp('expected_date', { withTimezone: true }),
  receivedDate: timestamp('received_date', { withTimezone: true }),
  status: varchar('status', { length: 50 }),
  notes: text('notes'),
  description: jsonb('description'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
}, (table) => [
  check("amount_check", sql`${table.amount} >= 0`),
]);

export const incomeForecasts = pgTable('income_forecasts', {
  id: serial('id').primaryKey(),
  incomeResourceId: integer('income_resource_id').notNull().references(() => incomeResources.id),
  periodType: varchar('period_type', { length: 50 }),
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),
  forecastedAmount: numeric('forecasted_amount', { precision: 20, scale: 8 }).notNull(),
  actualAmount: numeric('actual_amount', { precision: 20, scale: 8 }),
  currencyId: integer('currency_id').references(() => currencies.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
});

// ============================================================================
// EXPENSE MANAGEMENT
// ============================================================================

export const expenseCategories = pgTable('expense_categories', {
  id: serial('id').primaryKey(),
  canvasId: integer('canvas_id').references(() => canvases.id),
  parentCategoryId: integer('parent_category_id').references((): AnyPgColumn => expenseCategories.id),
  name: varchar('name', { length: 255 }).notNull(),
  photoUrl: text('photo_url'),
  level: integer('level').default(0),
  isSystemCategory: boolean('is_system_category').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
});

export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  canvasId: integer('canvas_id').notNull().references(() => canvases.id),
  name: varchar('name', { length: 255 }).notNull(),
  expenseCategoryId: integer('expense_category_id').notNull().references(() => expenseCategories.id),
  currencyId: integer('currency_id').notNull().references(() => currencies.id),
  entityId: integer('entity_id').references(() => entities.id),
  isRecurring: boolean('is_recurring').default(false),
  recurrencePattern: jsonb('recurrence_pattern'),
  description: jsonb('description'),
  photoUrl: text('photo_url'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
});

export const spentTransactions = pgTable('spent_transactions', {
  id: serial('id').primaryKey(),
  expenseId: integer('expense_id').notNull().references(() => expenses.id),
  originAssetId: integer('origin_asset_id').notNull().references(() => assets.id),
  convertedTransactionId: integer('converted_transaction_id').references(() => convertedTransactions.id),
  amount: numeric('amount', { precision: 20, scale: 8 }).notNull(),
  dueDate: timestamp('due_date', { withTimezone: true }),
  paidDate: timestamp('paid_date', { withTimezone: true }),
  status: varchar('status', { length: 50 }),
  notes: text('notes'),
  description: jsonb('description'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
}, (table) => [
  check("amount_check", sql`${table.amount} >= 0`),
]);

// ============================================================================
// ASSET CONVERSION & TRANSFER
// ============================================================================

export const convertedTransactions = pgTable('converted_transactions', {
  id: serial('id').primaryKey(),
  originAssetId: integer('origin_asset_id').notNull().references(() => assets.id),
  destinationAssetId: integer('destination_asset_id').notNull().references(() => assets.id),
  incomeTransactionId: integer('income_transaction_id').references(() => incomeTransactions.id),
  parentConversionId: integer('parent_conversion_id').references((): AnyPgColumn => convertedTransactions.id),
  conversionDate: timestamp('conversion_date', { withTimezone: true }).notNull(),
  originAmount: numeric('origin_amount', { precision: 20, scale: 8 }).notNull(),
  destinationAmount: numeric('destination_amount', { precision: 20, scale: 8 }).notNull(),
  exchangeRate: numeric('exchange_rate', { precision: 20, scale: 8 }).notNull(),
  transactionFee: numeric('transaction_fee', { precision: 20, scale: 8 }).default('0'),
  feeCurrencyId: integer('fee_currency_id').references(() => currencies.id),
  conversionType: varchar('conversion_type', { length: 50 }),
  notes: text('notes'),
  description: jsonb('description'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
}, (table) => [
  check("origin_amount_check", sql`${table.originAmount} >= 0`),
  check("destination_amount_check", sql`${table.destinationAmount} >= 0`),
  check("exchange_rate_check", sql`${table.exchangeRate} > 0`),
]);

// ============================================================================
// DEBT MANAGEMENT
// ============================================================================

export const debtTypes = pgTable('debt_types', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  isReceivable: boolean('is_receivable'),
});

export const debts = pgTable('debts', {
  id: serial('id').primaryKey(),
  canvasId: integer('canvas_id').notNull().references(() => canvases.id),
  debtTypeId: integer('debt_type_id').notNull().references(() => debtTypes.id),
  entityId: integer('entity_id').notNull().references(() => entities.id),
  name: varchar('name', { length: 255 }).notNull(),
  principalAmount: numeric('principal_amount', { precision: 20, scale: 8 }).notNull(),
  currencyId: integer('currency_id').notNull().references(() => currencies.id),
  interestRate: numeric('interest_rate', { precision: 5, scale: 2 }),
  startDate: date('start_date').notNull(),
  dueDate: date('due_date'),
  status: varchar('status', { length: 50 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
});

export const debtPayments = pgTable('debt_payments', {
  id: serial('id').primaryKey(),
  debtId: integer('debt_id').notNull().references(() => debts.id),
  assetId: integer('asset_id').references(() => assets.id),
  amount: numeric('amount', { precision: 20, scale: 8 }).notNull(),
  paymentType: varchar('payment_type', { length: 50 }),
  paymentDate: date('payment_date').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
});

// ============================================================================
// BUDGETING
// ============================================================================

export const budgets = pgTable('budgets', {
  id: serial('id').primaryKey(),
  canvasId: integer('canvas_id').notNull().references(() => canvases.id),
  name: varchar('name', { length: 255 }).notNull(),
  expenseCategoryId: integer('expense_category_id').references(() => expenseCategories.id),
  amount: numeric('amount', { precision: 20, scale: 8 }).notNull(),
  currencyId: integer('currency_id').notNull().references(() => currencies.id),
  periodType: varchar('period_type', { length: 50 }),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  rolloverUnused: boolean('rollover_unused').default(false),
  alertThreshold: integer('alert_threshold'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
});

export const budgetTracking = pgTable('budget_tracking', {
  id: serial('id').primaryKey(),
  budgetId: integer('budget_id').notNull().references(() => budgets.id),
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),
  spentAmount: numeric('spent_amount', { precision: 20, scale: 8 }).default('0'),
  remainingAmount: numeric('remaining_amount', { precision: 20, scale: 8 }),
  status: varchar('status', { length: 50 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// FINANCIAL PLANNING
// ============================================================================

export const financialPlans = pgTable('financial_plans', {
  id: serial('id').primaryKey(),
  canvasId: integer('canvas_id').notNull().references(() => canvases.id),
  name: varchar('name', { length: 255 }).notNull(),
  planType: varchar('plan_type', { length: 50 }),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  targetSavings: numeric('target_savings', { precision: 20, scale: 8 }),
  targetIncome: numeric('target_income', { precision: 20, scale: 8 }),
  targetExpenses: numeric('target_expenses', { precision: 20, scale: 8 }),
  currencyId: integer('currency_id').references(() => currencies.id),
  description: jsonb('description'),
  status: varchar('status', { length: 50 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
});

export const financialGoals = pgTable('financial_goals', {
  id: serial('id').primaryKey(),
  canvasId: integer('canvas_id').notNull().references(() => canvases.id),
  financialPlanId: integer('financial_plan_id').references(() => financialPlans.id),
  name: varchar('name', { length: 255 }).notNull(),
  goalType: varchar('goal_type', { length: 50 }),
  targetAmount: numeric('target_amount', { precision: 20, scale: 8 }).notNull(),
  currentAmount: numeric('current_amount', { precision: 20, scale: 8 }).default('0'),
  currencyId: integer('currency_id').notNull().references(() => currencies.id),
  targetDate: date('target_date'),
  priority: integer('priority').default(0),
  status: varchar('status', { length: 50 }),
  description: jsonb('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
});

// ============================================================================
// TO-BUY LIST
// ============================================================================

export const toBuyItems = pgTable('to_buy_items', {
  id: serial('id').primaryKey(),
  canvasId: integer('canvas_id').notNull().references(() => canvases.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  estimatedPrice: numeric('estimated_price', { precision: 20, scale: 8 }),
  currencyId: integer('currency_id').references(() => currencies.id),
  priority: integer('priority').default(0),
  category: varchar('category', { length: 100 }),
  dueDate: date('due_date'),
  targetPurchaseDate: date('target_purchase_date'),
  actualPurchaseDate: date('actual_purchase_date'),
  actualPrice: numeric('actual_price', { precision: 20, scale: 8 }),
  purchasedFromEntityId: integer('purchased_from_entity_id').references(() => entities.id),
  status: varchar('status', { length: 50 }),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
});

// ============================================================================
// NOTIFICATIONS & ACTIVITY
// ============================================================================

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  canvasId: integer('canvas_id').references(() => canvases.id),
  notificationType: varchar('notification_type', { length: 100 }),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message'),
  data: jsonb('data'),
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  canvasId: integer('canvas_id').notNull().references(() => canvases.id),
  userId: integer('user_id').notNull().references(() => users.id),
  action: varchar('action', { length: 50 }),
  entityType: varchar('entity_type', { length: 100 }),
  entityId: integer('entity_id'),
  changes: jsonb('changes'),
  ipAddress: varchar('ip_address', { length: 100 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// FILE ATTACHMENTS
// ============================================================================

export const attachments = pgTable('attachments', {
  id: serial('id').primaryKey(),
  canvasId: integer('canvas_id').notNull().references(() => canvases.id),
  attachableType: varchar('attachable_type', { length: 100 }),
  attachableId: integer('attachable_id'),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  fileSize: bigint('file_size', { mode: 'number' }),
  mimeType: varchar('mime_type', { length: 100 }),
  uploadedBy: integer('uploaded_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// AI ASSISTANT
// ============================================================================

export const aiConversations = pgTable('ai_conversations', {
  id: serial('id').primaryKey(),
  canvasId: integer('canvas_id').notNull().references(() => canvases.id),
  userId: integer('user_id').notNull().references(() => users.id),
  conversationContext: jsonb('conversation_context'),
  insightsGenerated: jsonb('insights_generated'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
});

export const aiFinancialInsights = pgTable('ai_financial_insights', {
  id: serial('id').primaryKey(),
  canvasId: integer('canvas_id').notNull().references(() => canvases.id),
  insightType: varchar('insight_type', { length: 100 }),
  title: varchar('title', { length: 255 }),
  description: text('description'),
  data: jsonb('data'),
  isActionable: boolean('is_actionable').default(false),
  isDismissed: boolean('is_dismissed').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ many, one }) => ({
  // Self-references for audit
  createdByUser: one(users, { 
    fields: [users.createdBy], 
    references: [users.id],
    relationName: 'userCreatedBy'
  }),
  lastModifiedByUser: one(users, { 
    fields: [users.lastModifiedBy], 
    references: [users.id],
    relationName: 'userLastModifiedBy'
  }),
  
  // Relations to other tables
  settings: one(userSettings, {
    fields: [users.id],
    references: [userSettings.userId],
  }),
  createdCanvases: many(canvases, { relationName: 'canvasCreatedBy' }),
  modifiedCanvases: many(canvases, { relationName: 'canvasModifiedBy' }),
  canvasMembers: many(canvasMembers, { relationName: 'canvasMemberUser' }),
  sentInvitations: many(canvasInvitations, { relationName: 'invitationSender' }),
  ownedWallets: many(wallets, { relationName: 'walletOwner' }),
  ownedAssets: many(assets, { relationName: 'assetOwner' }),
  ownedIncomeResources: many(incomeResources, { relationName: 'incomeResourceOwner' }),
  notifications: many(notifications),
  activityLogs: many(activityLogs),
  aiConversations: many(aiConversations),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
  defaultCurrency: one(currencies, {
    fields: [userSettings.defaultCurrencyId],
    references: [currencies.id],
  }),
}));

export const canvasesRelations = relations(canvases, ({ many, one }) => ({
  createdBy: one(users, { 
    fields: [canvases.createdBy], 
    references: [users.id],
    relationName: 'canvasCreatedBy'
  }),
  lastModifiedBy: one(users, { 
    fields: [canvases.lastModifiedBy], 
    references: [users.id],
    relationName: 'canvasModifiedBy'
  }),
  
  members: many(canvasMembers),
  invitations: many(canvasInvitations),
  valueCategories: many(valueCategories),
  entities: many(entities),
  wallets: many(wallets),
  assets: many(assets),
  incomeResources: many(incomeResources),
  expenseCategories: many(expenseCategories),
  expenses: many(expenses),
  debts: many(debts),
  budgets: many(budgets),
  financialPlans: many(financialPlans),
  financialGoals: many(financialGoals),
  toBuyItems: many(toBuyItems),
  notifications: many(notifications),
  activityLogs: many(activityLogs),
  attachments: many(attachments),
  aiConversations: many(aiConversations),
  aiFinancialInsights: many(aiFinancialInsights),
}));

export const rolesRelations = relations(roles, ({ many, one }) => ({
  canvasMembers: many(canvasMembers),
  canvasInvitations: many(canvasInvitations),
  createdBy: one(users, { fields: [roles.createdBy], references: [users.id] }),
  lastModifiedBy: one(users, { fields: [roles.lastModifiedBy], references: [users.id] }),
}));

export const canvasMembersRelations = relations(canvasMembers, ({ one }) => ({
  canvas: one(canvases, {
    fields: [canvasMembers.canvasId],
    references: [canvases.id],
  }),
  user: one(users, {
    fields: [canvasMembers.userId],
    references: [users.id],
    relationName: 'canvasMemberUser'
  }),
  role: one(roles, {
    fields: [canvasMembers.roleId],
    references: [roles.id],
  }),
  baseCurrency: one(currencies, {
    fields: [canvasMembers.baseCurrencyId],
    references: [currencies.id],
  }),
  createdBy: one(users, { fields: [canvasMembers.createdBy], references: [users.id] }),
  lastModifiedBy: one(users, { fields: [canvasMembers.lastModifiedBy], references: [users.id] }),
}));

export const canvasInvitationsRelations = relations(canvasInvitations, ({ one }) => ({
  canvas: one(canvases, {
    fields: [canvasInvitations.canvasId],
    references: [canvases.id],
  }),
  inviter: one(users, {
    fields: [canvasInvitations.inviterId],
    references: [users.id],
    relationName: 'invitationSender'
  }),
  role: one(roles, {
    fields: [canvasInvitations.roleId],
    references: [roles.id],
  }),
}));

export const currenciesRelations = relations(currencies, ({ many, one }) => ({
  userSettings: many(userSettings),
  canvasMembers: many(canvasMembers),
  valueCategories: many(valueCategories),
  assetPurchases: many(assets, { relationName: 'assetPurchaseCurrency' }),
  exchangeRatesFrom: many(currencyExchangeRates, { relationName: 'exchangeRateFrom' }),
  exchangeRatesTo: many(currencyExchangeRates, { relationName: 'exchangeRateTo' }),
  expenses: many(expenses),
  convertedTransactionFees: many(convertedTransactions, { relationName: 'conversionFeeCurrency' }),
  debts: many(debts),
  budgets: many(budgets),
  financialPlans: many(financialPlans),
  financialGoals: many(financialGoals),
  toBuyItems: many(toBuyItems),
  incomeForecasts: many(incomeForecasts),
  createdBy: one(users, { fields: [currencies.createdBy], references: [users.id] }),
  lastModifiedBy: one(users, { fields: [currencies.lastModifiedBy], references: [users.id] }),
}));

export const currencyExchangeRatesRelations = relations(currencyExchangeRates, ({ one }) => ({
  fromCurrency: one(currencies, {
    fields: [currencyExchangeRates.fromCurrencyId],
    references: [currencies.id],
    relationName: 'exchangeRateFrom'
  }),
  toCurrency: one(currencies, {
    fields: [currencyExchangeRates.toCurrencyId],
    references: [currencies.id],
    relationName: 'exchangeRateTo'
  }),
}));

export const valueCategoriesRelations = relations(valueCategories, ({ many, one }) => ({
  canvas: one(canvases, {
    fields: [valueCategories.canvasId],
    references: [canvases.id],
  }),
  currency: one(currencies, {
    fields: [valueCategories.currencyId],
    references: [currencies.id],
  }),
  assets: many(assets),
  incomeResources: many(incomeResources),
  createdBy: one(users, { fields: [valueCategories.createdBy], references: [users.id] }),
  lastModifiedBy: one(users, { fields: [valueCategories.lastModifiedBy], references: [users.id] }),
}));

export const entityTypesRelations = relations(entityTypes, ({ many }) => ({
  entities: many(entities),
}));

export const entitiesRelations = relations(entities, ({ many, one }) => ({
  canvas: one(canvases, {
    fields: [entities.canvasId],
    references: [canvases.id],
  }),
  entityType: one(entityTypes, {
    fields: [entities.entityTypeId],
    references: [entityTypes.id],
  }),
  wallets: many(wallets),
  incomeResources: many(incomeResources),
  expenses: many(expenses),
  debts: many(debts),
  toBuyItems: many(toBuyItems),
  createdBy: one(users, { fields: [entities.createdBy], references: [users.id] }),
  lastModifiedBy: one(users, { fields: [entities.lastModifiedBy], references: [users.id] }),
}));

export const walletCategoriesRelations = relations(walletCategories, ({ many, one }) => ({
  wallets: many(wallets),
  createdBy: one(users, { fields: [walletCategories.createdBy], references: [users.id] }),
  lastModifiedBy: one(users, { fields: [walletCategories.lastModifiedBy], references: [users.id] }),
}));

export const walletsRelations = relations(wallets, ({ many, one }) => ({
  canvas: one(canvases, {
    fields: [wallets.canvasId],
    references: [canvases.id],
  }),
  walletCategory: one(walletCategories, {
    fields: [wallets.walletCategoryId],
    references: [walletCategories.id],
  }),
  owner: one(users, {
    fields: [wallets.ownerId],
    references: [users.id],
    relationName: 'walletOwner'
  }),
  entity: one(entities, {
    fields: [wallets.entityId],
    references: [entities.id],
  }),
  assets: many(assets),
  createdBy: one(users, { fields: [wallets.createdBy], references: [users.id] }),
  lastModifiedBy: one(users, { fields: [wallets.lastModifiedBy], references: [users.id] }),
}));

export const assetsRelations = relations(assets, ({ many, one }) => ({
  canvas: one(canvases, {
    fields: [assets.canvasId],
    references: [canvases.id],
  }),
  valueCategory: one(valueCategories, {
    fields: [assets.valueCategoryId],
    references: [valueCategories.id],
  }),
  wallet: one(wallets, {
    fields: [assets.walletId],
    references: [wallets.id],
  }),
  owner: one(users, {
    fields: [assets.ownerId],
    references: [users.id],
    relationName: 'assetOwner'
  }),
  purchaseCurrency: one(currencies, {
    fields: [assets.purchaseCurrencyId],
    references: [currencies.id],
    relationName: 'assetPurchaseCurrency'
  }),
  incomeTransactions: many(incomeTransactions),
  spentTransactions: many(spentTransactions),
  convertedTransactionsOrigin: many(convertedTransactions, { relationName: 'conversionOrigin' }),
  convertedTransactionsDestination: many(convertedTransactions, { relationName: 'conversionDestination' }),
  debtPayments: many(debtPayments),
  defaultForIncomeResources: many(incomeResources),
  createdBy: one(users, { fields: [assets.createdBy], references: [users.id] }),
  lastModifiedBy: one(users, { fields: [assets.lastModifiedBy], references: [users.id] }),
}));

export const incomeResourceCategoriesRelations = relations(incomeResourceCategories, ({ many, one }) => ({
  incomeResources: many(incomeResources),
  createdBy: one(users, { fields: [incomeResourceCategories.createdBy], references: [users.id] }),
  lastModifiedBy: one(users, { fields: [incomeResourceCategories.lastModifiedBy], references: [users.id] }),
}));

export const incomeResourcesRelations = relations(incomeResources, ({ many, one }) => ({
  canvas: one(canvases, {
    fields: [incomeResources.canvasId],
    references: [canvases.id],
  }),
  incomeResourceCategory: one(incomeResourceCategories, {
    fields: [incomeResources.incomeResourceCategoryId],
    references: [incomeResourceCategories.id],
  }),
  owner: one(users, {
    fields: [incomeResources.ownerId],
    references: [users.id],
    relationName: 'incomeResourceOwner'
  }),
  defaultValueCategory: one(valueCategories, {
    fields: [incomeResources.defaultValueCategoryId],
    references: [valueCategories.id],
  }),
  defaultEntity: one(entities, {
    fields: [incomeResources.defaultEntityId],
    references: [entities.id],
  }),
  defaultAsset: one(assets, {
    fields: [incomeResources.defaultAssetId],
    references: [assets.id],
  }),
  incomeTransactions: many(incomeTransactions),
  incomeForecasts: many(incomeForecasts),
  createdBy: one(users, { fields: [incomeResources.createdBy], references: [users.id] }),
  lastModifiedBy: one(users, { fields: [incomeResources.lastModifiedBy], references: [users.id] }),
}));

export const incomeTransactionsRelations = relations(incomeTransactions, ({ many, one }) => ({
  incomeResource: one(incomeResources, {
    fields: [incomeTransactions.incomeResourceId],
    references: [incomeResources.id],
  }),
  destinationAsset: one(assets, {
    fields: [incomeTransactions.destinationAssetId],
    references: [assets.id],
  }),
  convertedTransactions: many(convertedTransactions),
  createdBy: one(users, { fields: [incomeTransactions.createdBy], references: [users.id] }),
  lastModifiedBy: one(users, { fields: [incomeTransactions.lastModifiedBy], references: [users.id] }),
}));

export const incomeForecastsRelations = relations(incomeForecasts, ({ one }) => ({
  incomeResource: one(incomeResources, {
    fields: [incomeForecasts.incomeResourceId],
    references: [incomeResources.id],
  }),
  currency: one(currencies, {
    fields: [incomeForecasts.currencyId],
    references: [currencies.id],
  }),
  createdBy: one(users, { fields: [incomeForecasts.createdBy], references: [users.id] }),
  lastModifiedBy: one(users, { fields: [incomeForecasts.lastModifiedBy], references: [users.id] }),
}));

export const expenseCategoriesRelations = relations(expenseCategories, ({ many, one }) => ({
  canvas: one(canvases, {
    fields: [expenseCategories.canvasId],
    references: [canvases.id],
  }),
  parentCategory: one(expenseCategories, {
    fields: [expenseCategories.parentCategoryId],
    references: [expenseCategories.id],
    relationName: 'expenseCategoryParent'
  }),
  subcategories: many(expenseCategories, { relationName: 'expenseCategoryParent' }),
  expenses: many(expenses),
  budgets: many(budgets),
  createdBy: one(users, { fields: [expenseCategories.createdBy], references: [users.id] }),
  lastModifiedBy: one(users, { fields: [expenseCategories.lastModifiedBy], references: [users.id] }),
}));

export const expensesRelations = relations(expenses, ({ many, one }) => ({
  canvas: one(canvases, {
    fields: [expenses.canvasId],
    references: [canvases.id],
  }),
  expenseCategory: one(expenseCategories, {
    fields: [expenses.expenseCategoryId],
    references: [expenseCategories.id],
  }),
  currency: one(currencies, {
    fields: [expenses.currencyId],
    references: [currencies.id],
  }),
  entity: one(entities, {
    fields: [expenses.entityId],
    references: [entities.id],
  }),
  spentTransactions: many(spentTransactions),
  createdBy: one(users, { fields: [expenses.createdBy], references: [users.id] }),
  lastModifiedBy: one(users, { fields: [expenses.lastModifiedBy], references: [users.id] }),
}));

export const spentTransactionsRelations = relations(spentTransactions, ({ one }) => ({
  expense: one(expenses, {
    fields: [spentTransactions.expenseId],
    references: [expenses.id],
  }),
  originAsset: one(assets, {
    fields: [spentTransactions.originAssetId],
    references: [assets.id],
  }),
  convertedTransaction: one(convertedTransactions, {
    fields: [spentTransactions.convertedTransactionId],
    references: [convertedTransactions.id],
  }),
  createdBy: one(users, { fields: [spentTransactions.createdBy], references: [users.id] }),
  lastModifiedBy: one(users, { fields: [spentTransactions.lastModifiedBy], references: [users.id] }),
}));

export const convertedTransactionsRelations = relations(convertedTransactions, ({ many, one }) => ({
  originAsset: one(assets, {
    fields: [convertedTransactions.originAssetId],
    references: [assets.id],
    relationName: 'conversionOrigin'
  }),
  destinationAsset: one(assets, {
    fields: [convertedTransactions.destinationAssetId],
    references: [assets.id],
    relationName: 'conversionDestination'
  }),
  incomeTransaction: one(incomeTransactions, {
    fields: [convertedTransactions.incomeTransactionId],
    references: [incomeTransactions.id],
  }),
  parentConversion: one(convertedTransactions, {
    fields: [convertedTransactions.parentConversionId],
    references: [convertedTransactions.id],
    relationName: 'conversionChain'
  }),
  childConversions: many(convertedTransactions, { relationName: 'conversionChain' }),
  feeCurrency: one(currencies, {
    fields: [convertedTransactions.feeCurrencyId],
    references: [currencies.id],
    relationName: 'conversionFeeCurrency'
  }),
  spentTransactions: many(spentTransactions),
  createdBy: one(users, { fields: [convertedTransactions.createdBy], references: [users.id] }),
  lastModifiedBy: one(users, { fields: [convertedTransactions.lastModifiedBy], references: [users.id] }),
}));

export const debtTypesRelations = relations(debtTypes, ({ many }) => ({
  debts: many(debts),
}));

export const debtsRelations = relations(debts, ({ many, one }) => ({
  canvas: one(canvases, {
    fields: [debts.canvasId],
    references: [canvases.id],
  }),
  debtType: one(debtTypes, {
    fields: [debts.debtTypeId],
    references: [debtTypes.id],
  }),
  entity: one(entities, {
    fields: [debts.entityId],
    references: [entities.id],
  }),
  currency: one(currencies, {
    fields: [debts.currencyId],
    references: [currencies.id],
  }),
  debtPayments: many(debtPayments),
  createdBy: one(users, { fields: [debts.createdBy], references: [users.id] }),
  lastModifiedBy: one(users, { fields: [debts.lastModifiedBy], references: [users.id] }),
}));

export const debtPaymentsRelations = relations(debtPayments, ({ one }) => ({
  debt: one(debts, {
    fields: [debtPayments.debtId],
    references: [debts.id],
  }),
  asset: one(assets, {
    fields: [debtPayments.assetId],
    references: [assets.id],
  }),
  createdBy: one(users, { fields: [debtPayments.createdBy], references: [users.id] }),
  lastModifiedBy: one(users, { fields: [debtPayments.lastModifiedBy], references: [users.id] }),
}));

export const budgetsRelations = relations(budgets, ({ many, one }) => ({
  canvas: one(canvases, {
    fields: [budgets.canvasId],
    references: [canvases.id],
  }),
  expenseCategory: one(expenseCategories, {
    fields: [budgets.expenseCategoryId],
    references: [expenseCategories.id],
  }),
  currency: one(currencies, {
    fields: [budgets.currencyId],
    references: [currencies.id],
  }),
  budgetTracking: many(budgetTracking),
  createdBy: one(users, { fields: [budgets.createdBy], references: [users.id] }),
  lastModifiedBy: one(users, { fields: [budgets.lastModifiedBy], references: [users.id] }),
}));

export const budgetTrackingRelations = relations(budgetTracking, ({ one }) => ({
  budget: one(budgets, {
    fields: [budgetTracking.budgetId],
    references: [budgets.id],
  }),
}));

export const financialPlansRelations = relations(financialPlans, ({ many, one }) => ({
  canvas: one(canvases, {
    fields: [financialPlans.canvasId],
    references: [canvases.id],
  }),
  currency: one(currencies, {
    fields: [financialPlans.currencyId],
    references: [currencies.id],
  }),
  financialGoals: many(financialGoals),
  createdBy: one(users, { fields: [financialPlans.createdBy], references: [users.id] }),
  lastModifiedBy: one(users, { fields: [financialPlans.lastModifiedBy], references: [users.id] }),
}));

export const financialGoalsRelations = relations(financialGoals, ({ one }) => ({
  canvas: one(canvases, {
    fields: [financialGoals.canvasId],
    references: [canvases.id],
  }),
  financialPlan: one(financialPlans, {
    fields: [financialGoals.financialPlanId],
    references: [financialPlans.id],
  }),
  currency: one(currencies, {
    fields: [financialGoals.currencyId],
    references: [currencies.id],
  }),
  createdBy: one(users, { fields: [financialGoals.createdBy], references: [users.id] }),
  lastModifiedBy: one(users, { fields: [financialGoals.lastModifiedBy], references: [users.id] }),
}));

export const toBuyItemsRelations = relations(toBuyItems, ({ one }) => ({
  canvas: one(canvases, {
    fields: [toBuyItems.canvasId],
    references: [canvases.id],
  }),
  currency: one(currencies, {
    fields: [toBuyItems.currencyId],
    references: [currencies.id],
  }),
  purchasedFromEntity: one(entities, {
    fields: [toBuyItems.purchasedFromEntityId],
    references: [entities.id],
  }),
  createdBy: one(users, { fields: [toBuyItems.createdBy], references: [users.id] }),
  lastModifiedBy: one(users, { fields: [toBuyItems.lastModifiedBy], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  canvas: one(canvases, {
    fields: [notifications.canvasId],
    references: [canvases.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  canvas: one(canvases, {
    fields: [activityLogs.canvasId],
    references: [canvases.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  canvas: one(canvases, {
    fields: [attachments.canvasId],
    references: [canvases.id],
  }),
  uploadedByUser: one(users, {
    fields: [attachments.uploadedBy],
    references: [users.id],
  }),
}));

export const aiConversationsRelations = relations(aiConversations, ({ one }) => ({
  canvas: one(canvases, {
    fields: [aiConversations.canvasId],
    references: [canvases.id],
  }),
  user: one(users, {
    fields: [aiConversations.userId],
    references: [users.id],
  }),
}));

export const aiFinancialInsightsRelations = relations(aiFinancialInsights, ({ one }) => ({
  canvas: one(canvases, {
    fields: [aiFinancialInsights.canvasId],
    references: [canvases.id],
  }),
}));