import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { aiInsightProfiles } from "../db/schema";
import type { AiInsightProfile } from "../db/schema/models";
import type { AiInsightProfilePayload } from "../types/aiInsight";
import { scoreFinancialKnowledge } from "../types/aiInsight";

function clampStep(step: number): number {
  return Math.min(5, Math.max(1, Math.floor(step)));
}

function mergeFinancialKnowledge(
  payload: AiInsightProfilePayload["financialKnowledge"]
): AiInsightProfilePayload["financialKnowledge"] {
  if (!payload?.answers) return payload ?? null;
  const { score, level } = scoreFinancialKnowledge(payload.answers);
  return { ...payload, score, level };
}

export async function getAiInsightProfileByCanvas(
  canvasId: number
): Promise<AiInsightProfile | null> {
  const [profile] = await db
    .select()
    .from(aiInsightProfiles)
    .where(eq(aiInsightProfiles.canvasId, canvasId))
    .limit(1);
  return profile ?? null;
}

export async function upsertAiInsightProfile(
  canvasId: number,
  userId: number,
  payload: AiInsightProfilePayload
): Promise<AiInsightProfile> {
  const existing = await getAiInsightProfileByCanvas(canvasId);
  const now = new Date();

  const financialKnowledge = payload.financialKnowledge
    ? mergeFinancialKnowledge(payload.financialKnowledge)
    : undefined;

  const status = payload.status ?? existing?.status ?? "draft";
  const currentStep = payload.currentStep
    ? clampStep(payload.currentStep)
    : existing?.currentStep ?? 1;

  const completedAt =
    status === "completed" ? existing?.completedAt ?? now : null;

  if (existing) {
    const [updated] = await db
      .update(aiInsightProfiles)
      .set({
        status,
        currentStep,
        riskProfile:
          payload.riskProfile !== undefined
            ? payload.riskProfile
            : existing.riskProfile,
        investmentGoals:
          payload.investmentGoals !== undefined
            ? payload.investmentGoals
            : existing.investmentGoals,
        esgPreferences:
          payload.esgPreferences !== undefined
            ? payload.esgPreferences
            : existing.esgPreferences,
        financialKnowledge:
          financialKnowledge !== undefined
            ? financialKnowledge
            : existing.financialKnowledge,
        financialPicture:
          payload.financialPicture !== undefined
            ? payload.financialPicture
            : existing.financialPicture,
        completedAt,
        updatedByUserId: userId,
        lastModifiedAt: now,
      })
      .where(eq(aiInsightProfiles.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(aiInsightProfiles)
    .values({
      canvasId,
      status,
      currentStep,
      riskProfile: payload.riskProfile ?? null,
      investmentGoals: payload.investmentGoals ?? null,
      esgPreferences: payload.esgPreferences ?? null,
      financialKnowledge: financialKnowledge ?? null,
      financialPicture: payload.financialPicture ?? null,
      completedAt,
      updatedByUserId: userId,
    })
    .returning();

  return created;
}
