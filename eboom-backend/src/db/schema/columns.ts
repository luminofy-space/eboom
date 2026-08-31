// Column builders repeated verbatim across every domain file.
//
// These are functions, not shared constants: a Drizzle column builder is a
// mutable object that `.notNull()` / `.default()` mutate in place, so handing
// the same instance to two tables would alias one column across both. Each
// call returns a fresh builder.
//
// This file deliberately imports nothing but `drizzle-orm/pg-core` -- keeping
// it dependency-free means every schema file can import it without touching
// the one-way `reference <- identity <- {finance, workspace, ai}` order. Audit
// FKs (`created_by` / `last_modified_by`) stay in the domain files for that
// reason: they reference `identity.users`.

import { serial, timestamp } from "drizzle-orm/pg-core";

/** `id serial PRIMARY KEY` -- the surrogate key on every table that has one. */
export const pk = () => serial("id").primaryKey();

/** `created_at timestamptz DEFAULT now()` -- set once on insert. */
export const createdAt = () => timestamp("created_at", { withTimezone: true }).defaultNow();

/** `last_modified_at timestamptz DEFAULT now()` -- paired with `last_modified_by`. */
export const lastModifiedAt = () =>
  timestamp("last_modified_at", { withTimezone: true }).defaultNow();

/**
 * `updated_at timestamptz DEFAULT now()` -- used by the tables that track a
 * single mutation time with no audit trail (whiteboard state, exchange rates).
 */
export const updatedAt = () => timestamp("updated_at", { withTimezone: true }).defaultNow();
