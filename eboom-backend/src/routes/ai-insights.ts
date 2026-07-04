import express, { Request, Response } from "express";
import { buildFinancialContext } from "../services/aiInsightContextService";
import {
  generateAiFinancialInsights,
  getAiFinancialInsightByCanvas,
} from "../services/aiInsightGenerationService";
import { getAiInsightProfileByCanvas } from "../services/aiInsightProfileService";
import { isLlmConfigured } from "../services/llmClient";
import { requireCanvasAccess } from "../middleware/canvasAccess";

const router = express.Router({ mergeParams: true });

async function buildInsightsResponse(canvasId: number) {
  const [profile, insight] = await Promise.all([
    getAiInsightProfileByCanvas(canvasId),
    getAiFinancialInsightByCanvas(canvasId),
  ]);
  const { completeness } = await buildFinancialContext(canvasId, profile);
  return { insight: insight ?? null, profile: profile ?? null, completeness };
}

router.get("/", requireCanvasAccess("view"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;

  try {
    const payload = await buildInsightsResponse(canvasId);
    res.json(payload);
  } catch (err) {
    console.error("Error fetching AI insights:", err);
    res.status(500).json({ error: "Failed to fetch AI insights" });
  }
});

router.post("/generate", requireCanvasAccess("edit"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const user = req.appUser!;

  if (!isLlmConfigured()) {
    return res.status(503).json({ error: "LLM API key not configured" });
  }

  try {
    const profile = await getAiInsightProfileByCanvas(canvasId);
    await generateAiFinancialInsights(canvasId, user.id, profile);
    const payload = await buildInsightsResponse(canvasId);
    res.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "RATE_LIMITED") {
      return res.status(429).json({ error: "Please wait before refreshing insights again" });
    }
    if (message === "LLM_API_KEY_NOT_CONFIGURED") {
      return res.status(503).json({ error: "LLM API key not configured" });
    }
    console.error("Error generating AI insights:", err);
    res.status(502).json({ error: "Failed to generate AI insights" });
  }
});

export default router;
