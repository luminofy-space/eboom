import { asc, desc, eq } from "drizzle-orm";
import type OpenAI from "openai";
import { db } from "../db/client";
import { aiChatMessages } from "../db/schema";
import type { AiChatMessage } from "../db/schema/models";
import type {
  AiChatMessagePayload,
  AiChatSendResponse,
} from "../types/aiChat";
import {
  buildFinancialContext,
} from "./aiInsightContextService";
import { serializeCompactLlmContext } from "./compactLlmContext";
import { getAiInsightProfileByCanvas } from "./aiInsightProfileService";
import { DEFAULT_LLM_MODEL, getOpenAIClient } from "./llmClient";

const DEFAULT_MODEL = DEFAULT_LLM_MODEL;
const CHAT_COOLDOWN_MS = 5_000;
const MAX_MESSAGE_LENGTH = 2_000;
const MAX_HISTORY_MESSAGES = 8;
const MAX_STORED_MESSAGES = 100;

const lastMessageByCanvas = new Map<number, number>();

function assertRateLimit(canvasId: number): void {
  const last = lastMessageByCanvas.get(canvasId);
  if (last && Date.now() - last < CHAT_COOLDOWN_MS) {
    throw new Error("RATE_LIMITED");
  }
}

function toPayload(row: AiChatMessage): AiChatMessagePayload {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

const SYSTEM_PROMPT = `You are a personal finance assistant for a household budgeting app.
Answer questions using the user's financial data and profile wizard answers provided in context.
Be concise, practical, and friendly. Use specific numbers from their data when relevant.
Do NOT provide legal, tax, or investment product recommendations requiring a licensed advisor.
When data is incomplete, say so and give general guidance aligned with their stated goals and risk tolerance.
If asked about topics outside personal finance for this household, politely redirect to finance topics.

Financial context (compact JSON; keys: cs=completeness, p=profile, n=counts, w=wallets, a=assets, s=spend90d, r=recent, bs=budgetSummary, b=budgets, cf=cashflow, g=goals):`;

function buildSystemPrompt(contextJson: string): string {
  return `${SYSTEM_PROMPT}\n${contextJson}`;
}

export async function getChatMessagesByCanvas(
  canvasId: number
): Promise<AiChatMessagePayload[]> {
  const rows = await db
    .select()
    .from(aiChatMessages)
    .where(eq(aiChatMessages.canvasId, canvasId))
    .orderBy(asc(aiChatMessages.createdAt), asc(aiChatMessages.id));

  return rows.map(toPayload);
}

async function trimOldMessages(canvasId: number): Promise<void> {
  const rows = await db
    .select({ id: aiChatMessages.id })
    .from(aiChatMessages)
    .where(eq(aiChatMessages.canvasId, canvasId))
    .orderBy(desc(aiChatMessages.createdAt), desc(aiChatMessages.id));

  if (rows.length <= MAX_STORED_MESSAGES) return;

  const idsToDelete = rows.slice(MAX_STORED_MESSAGES).map((row) => row.id);
  for (const id of idsToDelete) {
    await db.delete(aiChatMessages).where(eq(aiChatMessages.id, id));
  }
}

export async function sendChatMessage(
  canvasId: number,
  userId: number,
  content: string
): Promise<AiChatSendResponse> {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error("EMPTY_MESSAGE");
  }
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    throw new Error("MESSAGE_TOO_LONG");
  }

  assertRateLimit(canvasId);

  const profile = await getAiInsightProfileByCanvas(canvasId);
  const { context, completeness } = await buildFinancialContext(canvasId, profile);

  const history = await db
    .select()
    .from(aiChatMessages)
    .where(eq(aiChatMessages.canvasId, canvasId))
    .orderBy(desc(aiChatMessages.createdAt), desc(aiChatMessages.id))
    .limit(MAX_HISTORY_MESSAGES);

  const chronological = [...history].reverse();

  const openAiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: buildSystemPrompt(
        serializeCompactLlmContext(context, completeness)
      ),
    },
    ...chronological.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    { role: "user", content: trimmed },
  ];

  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: openAiMessages,
    temperature: 0.5,
  });

  const assistantContent = response.choices[0]?.message?.content?.trim();
  if (!assistantContent) {
    throw new Error("Empty LLM response");
  }

  const [userMessage] = await db
    .insert(aiChatMessages)
    .values({
      canvasId,
      userId,
      role: "user",
      content: trimmed,
    })
    .returning();

  const [assistantMessage] = await db
    .insert(aiChatMessages)
    .values({
      canvasId,
      role: "assistant",
      content: assistantContent,
      model: DEFAULT_MODEL,
    })
    .returning();

  lastMessageByCanvas.set(canvasId, Date.now());
  await trimOldMessages(canvasId);

  return {
    userMessage: toPayload(userMessage),
    assistantMessage: toPayload(assistantMessage),
  };
}

export async function clearChatHistory(canvasId: number): Promise<void> {
  await db.delete(aiChatMessages).where(eq(aiChatMessages.canvasId, canvasId));
}

export function resetChatRateLimitForTests(): void {
  lastMessageByCanvas.clear();
}
