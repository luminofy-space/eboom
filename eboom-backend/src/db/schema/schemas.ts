// Postgres schema objects shared by every table file.
//
// No table lives in `public`. Dependencies point one way --
// reference <- identity <- {finance, workspace, ai} -- with one exception:
// `reference` carries created_by/last_modified_by audit FKs back to
// `identity.users`, so those two files import each other. That cycle is safe
// because every `.references()` is a lazy `() => table.column` thunk, which is
// not evaluated while the modules are still loading.

import { pgSchema } from "drizzle-orm/pg-core";

export const referenceSchema = pgSchema("reference");

export const identitySchema = pgSchema("identity");

export const financeSchema = pgSchema("finance");

export const workspaceSchema = pgSchema("workspace");

export const aiSchema = pgSchema("ai");
