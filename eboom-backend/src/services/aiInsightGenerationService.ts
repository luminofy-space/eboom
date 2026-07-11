import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { aiFinancialInsights } from "../db/schema";
import type { AiFinancialInsight, AiInsightProfile } from "../db/schema/models";
import type { AiInsightItem, CompletenessResult } from "../types/aiInsight";
import {
  buildFinancialContext,
  type AiInsightFinancialContext,
} from "./aiInsightContextService";
import { serializeCompactLlmContext } from "./compactLlmContext";
import { DEFAULT_LLM_MODEL, getOpenAIClient } from "./llmClient";

const DEFAULT_MODEL = DEFAULT_LLM_MODEL;

export type InsightGenerationStatus = "running" | "failed";

export type InsightGenerationState = {
  status: InsightGenerationStatus;
  startedAt: string;
  error?: string;
};

const generationStateByCanvas = new Map<number, InsightGenerationState>();

const VALID_CATEGORIES = new Set([
  "budget",
  "cashflow",
  "goals",
  "risk",
  "esg",
  "general",
]);

const VALID_PRIORITIES = new Set(["high", "medium", "low"]);

function validateInsightItem(item: unknown, index: number): AiInsightItem {
  if (!item || typeof item !== "object") {
    throw new Error(`Invalid insight item at index ${index}`);
  }
  const record = item as Record<string, unknown>;
  const id = String(record.id ?? "");
  const category = String(record.category ?? "");
  const priority = String(record.priority ?? "");
  const title = String(record.title ?? "").trim();
  const body = String(record.body ?? "").trim();

  if (!id || !title || !body) {
    throw new Error(`Missing required fields on insight item at index ${index}`);
  }
  if (!VALID_CATEGORIES.has(category)) {
    throw new Error(`Invalid category on insight item at index ${index}`);
  }
  if (!VALID_PRIORITIES.has(priority)) {
    throw new Error(`Invalid priority on insight item at index ${index}`);
  }

  return {
    id,
    category: category as AiInsightItem["category"],
    priority: priority as AiInsightItem["priority"],
    title,
    body,
  };
}

function parseInsightsResponse(content: string): AiInsightItem[] {
  const parsed = JSON.parse(content) as { insights?: unknown };
  if (!Array.isArray(parsed.insights)) {
    throw new Error("Response missing insights array");
  }
  if (parsed.insights.length < 3 || parsed.insights.length > 6) {
    throw new Error("Insights array must contain 3 to 6 items");
  }
  return parsed.insights.map((item, index) => validateInsightItem(item, index));
}

const SYSTEM_PROMPT = `You are a personal finance assistant for a household budgeting app.
Provide practical, actionable advice based on the user's financial data and profile wizard answers.
Do NOT provide legal, tax, or investment product recommendations requiring a licensed advisor.
When data is incomplete, say so and give general guidance aligned with their stated goals and risk tolerance.
Respond ONLY with valid JSON in this shape: { "insights": [{ "id": "stable_snake_case_key", "category": "budget|cashflow|goals|risk|esg|general", "priority": "high|medium|low", "title": "short headline", "body": "2-4 sentences with specific numbers when available" }] }
Return exactly 3 to 6 insight items, ordered by priority (high first).`;

async function callOpenAI(
  context: AiInsightFinancialContext,
  completeness: CompletenessResult,
  strict = false
): Promise<AiInsightItem[]> {
  const client = getOpenAIClient();
  const userPayload = serializeCompactLlmContext(context, completeness, {
    includeBreakdown: true,
  });

  const response = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT + (strict ? " Ensure valid JSON only." : "") },
      { role: "user", content: userPayload },
    ],
    temperature: 0.4,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty LLM response");
  return parseInsightsResponse(content);
}

export async function getAiFinancialInsightByCanvas(
  canvasId: number
): Promise<AiFinancialInsight | null> {
  const [row] = await db
    .select()
    .from(aiFinancialInsights)
    .where(eq(aiFinancialInsights.canvasId, canvasId))
    .limit(1);
  return row ?? null;
}

export function getInsightGenerationState(
  canvasId: number
): InsightGenerationState | null {
  return generationStateByCanvas.get(canvasId) ?? null;
}

export function startAiFinancialInsightsGeneration(
  canvasId: number,
  userId: number,
  profile: AiInsightProfile | null
): { started: boolean; alreadyRunning: boolean } {
  const existing = generationStateByCanvas.get(canvasId);
  if (existing?.status === "running") {
    return { started: false, alreadyRunning: true };
  }

  generationStateByCanvas.set(canvasId, {
    status: "running",
    startedAt: new Date().toISOString(),
  });

  void (async () => {
    try {
      await generateAiFinancialInsights(canvasId, userId, profile);
      generationStateByCanvas.delete(canvasId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      generationStateByCanvas.set(canvasId, {
        status: "failed",
        startedAt: new Date().toISOString(),
        error: message,
      });
      console.error("Background AI insight generation failed:", err);
    }
  })();

  return { started: true, alreadyRunning: false };
}

export async function generateAiFinancialInsights(
  canvasId: number,
  userId: number,
  profile: AiInsightProfile | null
): Promise<AiFinancialInsight> {
  const { context, completeness } = await buildFinancialContext(canvasId, profile);

  let insights: AiInsightItem[];
  try {
    insights = await callOpenAI(context, completeness);
  } catch {
    insights = await callOpenAI(context, completeness, true);
  }

  const now = new Date();
  const existing = await getAiFinancialInsightByCanvas(canvasId);

  if (existing) {
    const [updated] = await db
      .update(aiFinancialInsights)
      .set({
        profileId: profile?.id ?? null,
        generatedByUserId: userId,
        insights,
        completenessScore: completeness.score,
        completenessBreakdown: completeness.breakdown,
        contextSummary: context,
        model: DEFAULT_MODEL,
        generatedAt: now,
        lastModifiedAt: now,
      })
      .where(eq(aiFinancialInsights.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(aiFinancialInsights)
    .values({
      canvasId,
      profileId: profile?.id ?? null,
      generatedByUserId: userId,
      insights,
      completenessScore: completeness.score,
      completenessBreakdown: completeness.breakdown,
      contextSummary: context,
      model: DEFAULT_MODEL,
      generatedAt: now,
    })
    .returning();

  return created;
}

export function resetInsightGenerationStateForTests(): void {
  generationStateByCanvas.clear();
}
