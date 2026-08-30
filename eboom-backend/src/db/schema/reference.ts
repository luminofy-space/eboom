// System-seeded lookup data: currencies, roles and the category tables.
//
// Seeded by `seed/sql/001_initialize.sql` and never written by a request.
// Imports `identity` only for audit-column FKs -- see the note in `schemas.ts`.

import {
  integer,
  varchar,
  jsonb,
  numeric,
  boolean,
  unique,
} from "drizzle-orm/pg-core";
import { referenceSchema } from "./schemas";
import { pk, createdAt, lastModifiedAt, updatedAt } from "./columns";
import { users } from "./identity";

export const roles = referenceSchema.table("roles", {
  id: pk(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  permissions: jsonb("permissions"),
  isSystemRole: boolean("is_system_role").default(false),
  createdAt: createdAt(),
  createdBy: integer("created_by").references(() => users.id),
  lastModifiedAt: lastModifiedAt(),
  lastModifiedBy: integer("last_modified_by").references(() => users.id),
});

export const currencies = referenceSchema.table("currencies", {
  id: pk(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  symbol: varchar("symbol", { length: 10 }).notNull(),
  decimals: integer("decimals").default(2),
  isActive: boolean("is_active").default(true),
  createdAt: createdAt(),
  lastModifiedAt: lastModifiedAt(),
});

// 1 unit of fromCurrency = `rate` units of toCurrency.

// 1 unit of fromCurrency = `rate` units of toCurrency.
export const exchangeRates = referenceSchema.table("exchange_rates",
  {
    id: pk(),
    fromCurrencyId: integer("from_currency_id").notNull().references(() => currencies.id),
    toCurrencyId: integer("to_currency_id").notNull().references(() => currencies.id),
    rate: numeric("rate", { precision: 20, scale: 8 }).notNull(),
    updatedAt: updatedAt(),
  },
  (table) => ({
    uniqueCurrencyPair: unique().on(table.fromCurrencyId, table.toCurrencyId),
  })
);

export const walletCategories = referenceSchema.table("wallet_categories", {
  id: pk(),
  name: varchar("name", { length: 255 }).notNull(),
  // isSystemCategory: boolean("is_system_category").default(false),
  createdAt: createdAt(),
  // createdBy: integer("created_by").references(() => users.id),
  lastModifiedAt: lastModifiedAt(),
  // lastModifiedBy: integer("last_modified_by").references(() => users.id),
});

export const incomeCategories = referenceSchema.table("income_categories", {
  id: pk(),
  name: varchar("name", { length: 255 }).notNull(),
  // isSystemCategory: boolean("is_system_category").default(false),
  createdAt: createdAt(),
  // createdBy: integer("created_by").references(() => users.id),
  lastModifiedAt: lastModifiedAt(),
  // lastModifiedBy: integer("last_modified_by").references(() => users.id),
});

export const expenseCategories = referenceSchema.table("expense_categories", {
  id: pk(),
  name: varchar("name", { length: 255 }).notNull(),
  // isSystemCategory: boolean("is_system_category").default(false),
  createdAt: createdAt(),
  // createdBy: integer("created_by").references(() => users.id),
  lastModifiedAt: lastModifiedAt(),
  // lastModifiedBy: integer("last_modified_by").references(() => users.id),
});

export const assetCategories = referenceSchema.table("asset_categories", {
  id: pk(),
  name: varchar("name", { length: 255 }).notNull(),
  isSystematic: boolean("is_systematic").notNull().default(true),
  createdAt: createdAt(),
  createdBy: integer("created_by").references(() => users.id),
  lastModifiedAt: lastModifiedAt(),
  lastModifiedBy: integer("last_modified_by").references(() => users.id),
});
