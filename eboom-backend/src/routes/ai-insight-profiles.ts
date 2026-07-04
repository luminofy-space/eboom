import express, { Request, Response } from "express";
import {
  getAiInsightProfileByCanvas,
  upsertAiInsightProfile,
} from "../services/aiInsightProfileService";
import type { AiInsightProfilePayload } from "../types/aiInsight";
import { parseRouteParam } from "./routeParams";
import { requireCanvasAccess } from "../middleware/canvasAccess";

const router = express.Router({ mergeParams: true });

function parseStatus(value: unknown): "draft" | "completed" | null {
  if (value === "draft" || value === "completed") return value;
  return null;
}

router.get("/", requireCanvasAccess("view"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;

  try {
    const profile = await getAiInsightProfileByCanvas(canvasId);
    res.json({ profile: profile ?? null });
  } catch (err) {
    console.error("Error fetching AI insight profile:", err);
    res.status(500).json({ error: "Failed to fetch AI insight profile" });
  }
});

router.put("/", requireCanvasAccess("edit"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const user = req.appUser!;

  const body = req.body as AiInsightProfilePayload;

  if (body.currentStep !== undefined) {
    const step = parseRouteParam(String(body.currentStep));
    if (Number.isNaN(step) || step < 1 || step > 5) {
      return res.status(400).json({ error: "Invalid current step" });
    }
  }

  if (body.status !== undefined && !parseStatus(body.status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const profile = await upsertAiInsightProfile(canvasId, user.id, body);
    res.json({ profile });
  } catch (err) {
    console.error("Error saving AI insight profile:", err);
    res.status(500).json({ error: "Failed to save AI insight profile" });
  }
});

export default router;
