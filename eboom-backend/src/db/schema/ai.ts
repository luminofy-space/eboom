// AI insight profiles, generated insights and chat history. Derived data.

import {
  integer,
  varchar,
  text,
  jsonb,
  timestamp,
  unique,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { aiSchema } from "./schemas";
import { pk, createdAt, lastModifiedAt } from "./columns";
import { canvases, users } from "./identity";

export const aiInsightProfileStatusEnum = aiSchema.enum("ai_insight_profile_status", [
  "draft",
  "completed",
]);

export const aiInsightProfiles = aiSchema.table("ai_insight_profiles",
  {
    id: pk(),
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
    createdAt: createdAt(),
    lastModifiedAt: lastModifiedAt(),
  },
  (table) => [
    check(
      "ai_insight_profile_current_step_check",
      sql`${table.currentStep} >= 1 AND ${table.currentStep} <= 5`
    ),
  ]
);

export const aiFinancialInsights = aiSchema.table("ai_financial_insights",
  {
    id: pk(),
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
    createdAt: createdAt(),
    lastModifiedAt: lastModifiedAt(),
  },
  (table) => [
    check(
      "ai_financial_insights_completeness_check",
      sql`${table.completenessScore} >= 0 AND ${table.completenessScore} <= 100`
    ),
  ]
);

export const aiChatMessageRoleEnum = aiSchema.enum("ai_chat_message_role", ["user", "assistant"]);

export const aiChatMessages = aiSchema.table("ai_chat_messages", {
  id: pk(),
  canvasId: integer("canvas_id")
    .notNull()
    .references(() => canvases.id),
  userId: integer("user_id").references(() => users.id),
  role: aiChatMessageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  model: varchar("model", { length: 100 }),
  createdAt: createdAt(),
});
