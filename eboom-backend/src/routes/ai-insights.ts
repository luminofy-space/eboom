import express, { Request, Response } from "express";
import { checkCanvasPermission } from "../services/canvasAccessService";
import { buildFinancialContext } from "../services/aiInsightContextService";
import {
  generateAiFinancialInsights,
  getAiFinancialInsightByCanvas,
} from "../services/aiInsightGenerationService";
import { getAiInsightProfileByCanvas } from "../services/aiInsightProfileService";
import { isLlmConfigured } from "../services/llmClient";
import { parseRouteParam } from "./routeParams";

const router = express.Router({ mergeParams: true });

function denyPermission(res: Response, access: { allowed: false; status: 403; error: string }) {
  return res.status(access.status).json({ error: access.error });
}

function parseCanvasId(req: Request): number {
  return parseRouteParam(req.params.canvasId);
}

async function buildInsightsResponse(canvasId: number) {
  const [profile, insight] = await Promise.all([
    getAiInsightProfileByCanvas(canvasId),
    getAiFinancialInsightByCanvas(canvasId),
  ]);
  const { completeness } = await buildFinancialContext(canvasId, profile);
  return { insight: insight ?? null, profile: profile ?? null, completeness };
}

router.get("/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseCanvasId(req);
  if (Number.isNaN(canvasId)) return res.status(400).json({ error: "Invalid canvas ID" });

  try {
    const access = await checkCanvasPermission(canvasId, user.id, "view");
    if (!access.allowed) return denyPermission(res, access);

    const payload = await buildInsightsResponse(canvasId);
    res.json(payload);
  } catch (err) {
    console.error("Error fetching AI insights:", err);
    res.status(500).json({ error: "Failed to fetch AI insights" });
  }
});

router.post("/generate", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseCanvasId(req);
  if (Number.isNaN(canvasId)) return res.status(400).json({ error: "Invalid canvas ID" });

  if (!isLlmConfigured()) {
    return res.status(503).json({ error: "LLM API key not configured" });
  }

  try {
    const access = await checkCanvasPermission(canvasId, user.id, "edit");
    if (!access.allowed) return denyPermission(res, access);

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
