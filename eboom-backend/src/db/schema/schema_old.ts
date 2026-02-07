import { 
  pgTable, 
  serial, 
  integer, 
  varchar, 
  text, 
  jsonb, 
  timestamp, 
  numeric, 
  boolean 
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  firstName: varchar('first_name'),
  lastName: varchar('last_name'),
  email: varchar('email').notNull().unique(),
  age: integer('age').$type<number | null>().check(sql`age >= 0`),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
});

// Currencies table
export const currencies = pgTable('currencies', {
  id: serial('id').primaryKey(),
  nameEn: varchar('name_en').notNull(),
  nameFa: varchar('name_fa').notNull(),
  symbol: varchar('symbol').notNull(),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
});

// Roles table
export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  nameEn: varchar('name_en').notNull(),
  nameFa: varchar('name_fa').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
});

// Canvases table
export const canvases = pgTable('canvases', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
});

// Canvas members table
export const canvasMembers = pgTable('canvas_members', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id').notNull().references(() => users.id),
  canvasId: integer('canvas_id').notNull().references(() => canvases.id),
  roleId: integer('role_id').references(() => roles.id),
  baseCurrencyId: integer('base_currency_id').notNull().references(() => currencies.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
});

// Value categories table
export const valueCategories = pgTable('value_categories', {
  id: serial('id').primaryKey(),
  canvasId: integer('canvas_id').references(() => canvases.id),
  nameEn: varchar('name_en').notNull(),
  nameFa: varchar('name_fa').notNull(),
  currencyId: integer('currency_id').references(() => currencies.id),
  wallet: boolean('wallet').default(false),
  fungible: boolean('fungible').default(true),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
});

// Wallet categories table
export const walletCategories = pgTable('wallet_categories', {
  id: serial('id').primaryKey(),
  nameEn: varchar('name_en').notNull(),
  nameFa: varchar('name_fa').notNull(),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
});

// Wallets table
export const wallets = pgTable('wallets', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  canvasId: integer('canvas_id').notNull().references(() => canvases.id),
  ownerId: integer('owner_id').notNull().references(() => users.id),
  walletNumber: varchar('wallet_number'),
  description: jsonb('description'),
  walletCategoryId: integer('wallet_category_id').notNull().references(() => walletCategories.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
});

// Assets table
export const assets = pgTable('assets', {
  id: serial('id').primaryKey(),
  canvasId: integer('canvas_id').references(() => canvases.id),
  name: varchar('name').notNull(),
  valueCategoryId: integer('value_category_id').notNull().references(() => valueCategories.id),
  walletId: integer('wallet_id').references(() => wallets.id),
  ownerId: integer('owner_id').references(() => users.id),
  photoUrl: text('photo_url'),
  description: jsonb('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
});

// Entities table
export const entities = pgTable('entities', {
  id: serial('id').primaryKey(),
  canvasId: integer('canvas_id').notNull().references(() => canvases.id),
  name: varchar('name').notNull(),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
});

// Income resource categories table
export const incomeResourceCategories = pgTable('income_resource_categories', {
  id: serial('id').primaryKey(),
  nameEn: varchar('name_en').notNull(),
  nameFa: varchar('name_fa').notNull(),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
});

// Income resources table
export const incomeResources = pgTable('income_resources', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  canvasId: integer('canvas_id').notNull().references(() => canvases.id),
  defaultValueCategoryId: integer('default_value_category_id').notNull().references(() => valueCategories.id),
  defaultEntityId: integer('default_entity_id').references(() => entities.id),
  defaultAssetId: integer('default_asset_id').references(() => assets.id),
  ownerId: integer('owner_id').notNull().references(() => users.id),
  incomeResourceCategoryId: integer('income_resource_category_id').notNull().references(() => incomeResourceCategories.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
});

// Income transactions table
export const incomeTransactions = pgTable('income_transactions', {
  id: serial('id').primaryKey(),
  originId: integer('origin_id').references(() => incomeResources.id),
  destinationId: integer('destination_id').notNull().references(() => assets.id),
  amount: numeric('amount').notNull().check(sql`amount >= 0`),
  toBePaidDate: timestamp('to_be_paid_date', { withTimezone: true }),
  paidDate: timestamp('paid_date', { withTimezone: true }),
  photoUrl: text('photo_url'),
  description: jsonb('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
});

// Expense categories table
export const expenseCategories = pgTable('expense_categories', {
  id: serial('id').primaryKey(),
  nameEn: varchar('name_en').notNull(),
  nameFa: varchar('name_fa').notNull(),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
});

// Expenses table
export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  canvasId: integer('canvas_id').notNull().references(() => canvases.id),
  currencyId: integer('currency_id').notNull().references(() => currencies.id),
  expenseCategoryId: integer('expense_category_id').notNull().references(() => expenseCategories.id),
  entityId: integer('entity_id').references(() => entities.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
});

// Converted transactions table
export const convertedTransactions = pgTable('converted_transactions', {
  id: serial('id').primaryKey(),
  originId: integer('origin_id').notNull().references(() => assets.id),
  destinationId: integer('destination_id').notNull().references(() => assets.id),
  incomeAssociatedId: integer('income_associated_id').references(() => incomeTransactions.id),
  convertAssociatedId: integer('convert_associated_id').references(() => convertedTransactions.id),
  conversionDate: timestamp('conversion_date', { withTimezone: true }),
  originAmount: numeric('origin_amount').notNull().check(sql`origin_amount >= 0`),
  destinationAmount: numeric('destination_amount').notNull().check(sql`destination_amount >= 0`),
  exchangeRate: numeric('exchange_rate').notNull().check(sql`exchange_rate > 0`),
  transactionFee: numeric('transaction_fee'),
  transactionFeeCurrencyId: integer('transaction_fee_currency_id').references(() => currencies.id),
  description: jsonb('description'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
});

// Spent transactions table
export const spentTransactions = pgTable('spent_transactions', {
  id: serial('id').primaryKey(),
  originId: integer('origin_id').notNull().references(() => assets.id),
  destinationId: integer('destination_id').notNull().references(() => expenses.id),
  convertedAssociatedId: integer('converted_associated_id').references(() => convertedTransactions.id),
  amount: numeric('amount').notNull().check(sql`amount >= 0`),
  toBePaidDate: timestamp('to_be_paid_date', { withTimezone: true }),
  paidDate: timestamp('paid_date', { withTimezone: true }),
  description: jsonb('description'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).defaultNow(),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  createdCanvases: many(canvases, { relationName: 'createdBy' }),
  lastModifiedCanvases: many(canvases, { relationName: 'lastModifiedBy' }),
  canvasMembers: many(canvasMembers, { relationName: 'accountId' }),
  ownedWallets: many(wallets, { relationName: 'ownerId' }),
  ownedAssets: many(assets, { relationName: 'ownerId' }),
  ownedIncomeResources: many(incomeResources, { relationName: 'ownerId' }),
  createdBy: one(users, { fields: [users.createdBy], references: [users.id], relationName: 'createdBy' }),
  lastModifiedBy: one(users, { fields: [users.lastModifiedBy], references: [users.id], relationName: 'lastModifiedBy' }),
}));

export const currenciesRelations = relations(currencies, ({ many, one }) => ({
  valueCategories: many(valueCategories),
  expenses: many(expenses),
  transactionFees: many(convertedTransactions, { relationName: 'transactionFeeCurrency' }),
  canvasMembers: many(canvasMembers, { relationName: 'baseCurrency' }),
  createdBy: one(users, { fields: [currencies.createdBy], references: [users.id] }),
  lastModifiedBy: one(users, { fields: [currencies.lastModifiedBy], references: [users.id] }),
}));

export const rolesRelations = relations(roles, ({ many, one }) => ({
  canvasMembers: many(canvasMembers),
  createdBy: one(users, { fields: [roles.createdBy], references: [users.id] }),
  lastModifiedBy: one(users, { fields: [roles.lastModifiedBy], references: [users.id] }),
}));

export const canvasesRelations = relations(canvases, ({ many, one }) => ({
  members: many(canvasMembers),
  assets: many(assets),
  entities: many(entities),
  valueCategories: many(valueCategories),
  wallets: many(wallets),
  incomeResources: many(incomeResources),
  expenses: many(expenses),
  createdBy: one(users, { fields: [canvases.createdBy], references: [users.id] }),
  lastModifiedBy: one(users, { fields: [canvases.lastModifiedBy], references: [users.id] }),
}));

export const canvasMembersRelations = relations(canvasMembers, ({ one }) => ({
  account: one(users, { fields: [canvasMembers.accountId], references: [users.id] }),
  canvas: one(canvases, { fields: [canvasMembers.canvasId], references: [canvases.id] }),
  role: one(roles, { fields: [canvasMembers.roleId], references: [roles.id] }),
  baseCurrency: one(currencies, { fields: [canvasMembers.baseCurrencyId], references: [currencies.id] }),
  createdBy: one(users, { fields: [canvasMembers.createdBy], references: [users.id] }),
  lastModifiedBy: one(users, { fields: [canvasMembers.lastModifiedBy], references: [users.id] }),
}));

export const valueCategoriesRelations = relations(valueCategories, ({ many, one }) => ({
  assets: many(assets),
  incomeResources: many(incomeResources, { relationName: 'defaultValueCategory' }),
  canvas: one(canvases, { fields: [valueCategories.canvasId], references: [canvases.id] }),
  currency: one(currencies, { fields: [valueCategories.currencyId], references: [currencies.id] }),
  createdBy: one(users, { fields: [valueCategories.createdBy], references: [users.id] }),
  lastModifiedBy: one(users, { fields: [valueCategories.lastModifiedBy], references: [users.id] }),
}));

export const walletCategoriesRelations = relations(walletCategories, ({ many, one }) => ({
  wallets: many(wallets),
  createdBy: one(users, { fields: [walletCategories.createdBy], references: [users.id] }),
  lastModifiedBy: one(users, { fields: [walletCategories.lastModifiedBy], references: [users.id] }),
}));

export const walletsRelations = relations(wallets, ({ many, one }) => ({
  assets: many(assets),
  canvas: one(canvases, { fields: [wallets.canvasId], references: [canvases.id] }),
  owner: one(users, { fields: [wallets.ownerId], references: [users.id] }),
  walletCategory: one(walletCategories, { fields: [wallets.walletCategoryId], references: [walletCategories.id] }),
  createdBy: one(users, { fields: [wallets.createdBy], references: [users.id] }),
  lastModifiedBy: one(users, { fields: [wallets.lastModifiedBy], references: [users.id] }),
}));

export const assetsRelations = relations(assets, ({ many, one }) => ({
  originConvertedTransactions: many(convertedTransactions, { relationName: 'origin' }),
  destinationConvertedTransactions: many(convertedTransactions, { relationName: 'destination' }),
  incomeTransactions: many(incomeTransactions, { relationName: 'destination' }),
  spentTransactions: many(spentTransactions, { relationName: 'origin' }),
  incomeResources: many(incomeResources, { relationName: 'defaultAsset' }),
  canvas: one(canvases, { fields: [assets.canvasId], references: [canvases.id] }),
  valueCategory: one(valueCategories, { fields: [assets.valueCategoryId], references: [valueCategories.id] }),
  wallet: one(wallets, { fields: [assets.walletId], references: [wallets.id] }),
  owner: one(users, { fields: [assets.ownerId], references: [users.id] }),
  createdBy: one(users, { fields: [assets.createdBy], references: [users.id] }),
  lastModifiedBy: one(users, { fields: [assets.lastModifiedBy], references: [users.id] }),
}));

export const entitiesRelations = relations(entities, ({ many, one }) => ({
  incomeResources: many(incomeResources, { relationName: 'defaultEntity' }),
  expenses: many(expenses),
  canvas: one(canvases, { fields: [entities.canvasId], references: [canvases.id] }),
  createdBy: one(users, { fields: [entities.createdBy], references: [users.id] }),
  lastModifiedBy: one(users, { fields: [entities.lastModifiedBy], references: [users.id] }),
}));

export const incomeResourceCategoriesRelations = relations(incomeResourceCategories, ({ many, one }) => ({
  incomeResources: many(incomeResources),
  createdBy: one(users, { fields: [incomeResourceCategories.createdBy], references: [users.id] }),
  lastModifiedBy: one(users, { fields: [incomeResourceCategories.lastModifiedBy], references: [users.id] }),
}));

export const incomeResourcesRelations = relations(incomeResources, ({ many, one }) => ({
  incomeTransactions: many(incomeTransactions, { relationName: 'origin' }),
  canvas: one(canvases, { fields: [incomeResources.canvasId], references: [canvases.id] }),
  defaultValueCategory: one(valueCategories, { fields: [incomeResources.defaultValueCategoryId], references: [valueCategories.id] }),
  defaultEntity: one(entities, { fields: [incomeResources.defaultEntityId], references: [entities.id] }),
  defaultAsset: one(assets, { fields: [incomeResources.defaultAssetId], references: [assets.id] }),
  owner: one(users, { fields: [incomeResources.ownerId], references: [users.id] }),
  incomeResourceCategory: one(incomeResourceCategories, { fields: [incomeResources.incomeResourceCategoryId], references: [incomeResourceCategories.id] }),
  createdBy: one(users, { fields: [incomeResources.createdBy], references: [users.id] }),
  lastModifiedBy: one(users, { fields: [incomeResources.lastModifiedBy], references: [users.id] }),
}));

export const incomeTransactionsRelations = relations(incomeTransactions, ({ many, one }) => ({
  convertedTransactions: many(convertedTransactions, { relationName: 'incomeAssociated' }),
  origin: one(incomeResources, { fields: [incomeTransactions.originId], references: [incomeResources.id] }),
  destination: one(assets, { fields: [incomeTransactions.destinationId], references: [assets.id] }),
  createdBy: one(users, { fields: [incomeTransactions.createdBy], references: [users.id] }),
  lastModifiedBy: one(users, { fields: [incomeTransactions.lastModifiedBy], references: [users.id] }),
}));

export const expenseCategoriesRelations = relations(expenseCategories, ({ many, one }) => ({
  expenses: many(expenses),
  createdBy: one(users, { fields: [expenseCategories.createdBy], references: [users.id] }),
  lastModifiedBy: one(users, { fields: [expenseCategories.lastModifiedBy], references: [users.id] }),
}));

export const expensesRelations = relations(expenses, ({ many, one }) => ({
  spentTransactions: many(spentTransactions, { relationName: 'destination' }),
  canvas: one(canvases, { fields: [expenses.canvasId], references: [canvases.id] }),
  currency: one(currencies, { fields: [expenses.currencyId], references: [currencies.id] }),
  expenseCategory: one(expenseCategories, { fields: [expenses.expenseCategoryId], references: [expenseCategories.id] }),
  entity: one(entities, { fields: [expenses.entityId], references: [entities.id] }),
  createdBy: one(users, { fields: [expenses.createdBy], references: [users.id] }),
  lastModifiedBy: one(users, { fields: [expenses.lastModifiedBy], references: [users.id] }),
}));

export const convertedTransactionsRelations = relations(convertedTransactions, ({ many, one }) => ({
  spentTransactions: many(spentTransactions, { relationName: 'convertedAssociated' }),
  childConvertedTransactions: many(convertedTransactions, { relationName: 'convertAssociated' }),
  origin: one(assets, { fields: [convertedTransactions.originId], references: [assets.id] }),
  destination: one(assets, { fields: [convertedTransactions.destinationId], references: [assets.id] }),
  incomeAssociated: one(incomeTransactions, { fields: [convertedTransactions.incomeAssociatedId], references: [incomeTransactions.id] }),
  convertAssociated: one(convertedTransactions, { fields: [convertedTransactions.convertAssociatedId], references: [convertedTransactions.id] }),
  transactionFeeCurrency: one(currencies, { fields: [convertedTransactions.transactionFeeCurrencyId], references: [currencies.id] }),
  createdBy: one(users, { fields: [convertedTransactions.createdBy], references: [users.id] }),
  lastModifiedBy: one(users, { fields: [convertedTransactions.lastModifiedBy], references: [users.id] }),
}));

export const spentTransactionsRelations = relations(spentTransactions, ({ one }) => ({
  origin: one(assets, { fields: [spentTransactions.originId], references: [assets.id] }),
  destination: one(expenses, { fields: [spentTransactions.destinationId], references: [expenses.id] }),
  convertedAssociated: one(convertedTransactions, { fields: [spentTransactions.convertedAssociatedId], references: [convertedTransactions.id] }),
  createdBy: one(users, { fields: [spentTransactions.createdBy], references: [users.id] }),
  lastModifiedBy: one(users, { fields: [spentTransactions.lastModifiedBy], references: [users.id] }),
}));