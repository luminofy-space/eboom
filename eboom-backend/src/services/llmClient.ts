import OpenAI from "openai";

const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

const DEFAULT_OPENROUTER_FREE_MODEL = "google/gemini-2.0-flash-exp:free";

function isOpenRouterApiKey(apiKey: string): boolean {
  return apiKey.startsWith("sk-or-");
}

/** OpenAI default; override with OPENAI_MODEL / LLM_MODEL (e.g. OpenRouter `provider/model:free`). */
export function getDefaultLlmModel(apiKey?: string): string {
  const explicit =
    process.env.LLM_MODEL || process.env.OPENAI_MODEL || process.env.OPENROUTER_MODEL;
  if (explicit) return explicit;

  const key = apiKey ?? getLlmApiKey();
  if (key && isOpenRouterApiKey(key)) {
    return DEFAULT_OPENROUTER_FREE_MODEL;
  }

  return "gpt-4o-mini";
}

export const DEFAULT_LLM_MODEL = getDefaultLlmModel();

export function getLlmApiKey(): string | undefined {
  return (
    process.env.LLM_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.OPENROUTER_API_KEY
  );
}

export function getLlmBaseUrl(apiKey?: string): string {
  const explicit =
    process.env.LLM_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    process.env.OPENROUTER_BASE_URL;
  if (explicit) return explicit;

  const key = apiKey ?? getLlmApiKey();
  if (
    process.env.OPENROUTER_API_KEY ||
    (key && isOpenRouterApiKey(key))
  ) {
    return DEFAULT_OPENROUTER_BASE_URL;
  }

  return DEFAULT_OPENAI_BASE_URL;
}

export function isLlmConfigured(): boolean {
  return Boolean(getLlmApiKey());
}

export function getOpenAIClient(): OpenAI {
  const apiKey = getLlmApiKey();
  if (!apiKey) {
    throw new Error("LLM_API_KEY_NOT_CONFIGURED");
  }

  const baseURL = getLlmBaseUrl(apiKey);
  const isOpenRouter = baseURL.includes("openrouter.ai");

  return new OpenAI({
    apiKey,
    baseURL,
    ...(isOpenRouter
      ? {
          defaultHeaders: {
            "HTTP-Referer": process.env.APP_URL || "http://127.0.0.1:3000",
            "X-Title": "Eboom",
          },
        }
      : {}),
  });
}
