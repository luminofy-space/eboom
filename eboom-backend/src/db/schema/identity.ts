// Accounts and tenancy: who exists, and who may see which canvas.

import {
  integer,
  varchar,
  text,
  timestamp,
  boolean,
  unique,
  check,
  AnyPgColumn,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { identitySchema } from "./schemas";
import { pk, createdAt, lastModifiedAt } from "./columns";
import { currencies, roles } from "./reference";

export const canvasInvitationStatusEnum = identitySchema.enum("canvas_invitation_status", [
  "pending",
  "accepted",
  "declined",
  "cancelled",
  "expired",
]);

export const users = identitySchema.table("users",
  {
    id: pk(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    firstName: varchar("first_name", { length: 100 }),
    lastName: varchar("last_name", { length: 100 }),
    photoUrl: text("photo_url"),
    age: integer("age").$type<number | null>(),
    phone: varchar("phone", { length: 50 }),
    emailVerified: boolean("email_verified").default(false),
    passwordHash: varchar("password_hash", { length: 255 }),
    createdAt: createdAt(),
    createdBy: integer("created_by").references((): AnyPgColumn => users.id),
    lastModifiedAt: lastModifiedAt(),
    lastModifiedBy: integer("last_modified_by").references((): AnyPgColumn => users.id),
  },
  (table) => [check("age_check", sql`${table.age} > 0`)]
);

export const canvases = identitySchema.table("canvases", {
  id: pk(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  photoUrl: text("photo_url"),
  canvasType: varchar("canvas_type", { length: 50 }),
  baseCurrencyId: integer("base_currency_id").references((): AnyPgColumn => currencies.id),
  isArchived: boolean("is_archived").default(false),
  createdAt: createdAt(),
  createdBy: integer("created_by").references(() => users.id),
  lastModifiedAt: lastModifiedAt(),
  lastModifiedBy: integer("last_modified_by").references(() => users.id),
});

export const userSettings = identitySchema.table("user_settings", {
  id: pk(),
  userId: integer("user_id").notNull().unique().references(() => users.id),
  timezone: varchar("timezone", { length: 100 }).default("UTC"),
  language: varchar("language", { length: 10 }).default("en"),
  dateFormat: varchar("date_format", { length: 50 }).default("YYYY-MM-DD"),
  defaultCurrencyId: integer("default_currency_id").references(() => currencies.id),
  // theme: varchar("theme", { length: 20 }).default("dark"),
  notificationEnabled: boolean("notification_enabled").default(true),
  createdAt: createdAt(),
  lastModifiedAt: lastModifiedAt(),
});

export const canvasMembers = identitySchema.table("canvas_members",
  {
    id: pk(),
    canvasId: integer("canvas_id").notNull().references(() => canvases.id),
    userId: integer("user_id").notNull().references(() => users.id),
    roleId: integer("role_id").references(() => roles.id),
    isOwner: boolean("is_owner").default(false),
    createdAt: createdAt(),
    lastModifiedAt: lastModifiedAt(),
  },
  (table) => ({
    uniqueCanvasUser: unique().on(table.canvasId, table.userId),
  })
);

export const canvasInvitations = identitySchema.table("canvas_invitations",
  {
    id: pk(),
    canvasId: integer("canvas_id").notNull().references(() => canvases.id),
    inviteeUserId: integer("invitee_user_id").notNull().references(() => users.id),
    inviteeEmail: varchar("invitee_email", { length: 255 }).notNull(),
    roleId: integer("role_id").notNull().references(() => roles.id),
    invitedBy: integer("invited_by").notNull().references(() => users.id),
    status: canvasInvitationStatusEnum("status").default("pending").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    createdAt: createdAt(),
    lastModifiedAt: lastModifiedAt(),
  },
  (table) => ({
    uniqueCanvasInvitee: unique("canvas_invitations_canvas_invitee_unique").on(
      table.canvasId,
      table.inviteeUserId
    ),
  })
);

export const notifications = identitySchema.table("notifications", {
  id: pk(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  isRead: boolean("is_read").default(false),
  createdAt: createdAt(),
});
