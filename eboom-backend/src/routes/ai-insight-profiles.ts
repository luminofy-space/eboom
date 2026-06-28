import express, { Request, Response } from "express";
import { checkCanvasPermission } from "../services/canvasAccessService";
import {
  getAiInsightProfileByCanvas,
  upsertAiInsightProfile,
} from "../services/aiInsightProfileService";
import type { AiInsightProfilePayload } from "../types/aiInsight";
import { parseRouteParam } from "./routeParams";

const router = express.Router({ mergeParams: true });

function denyPermission(res: Response, access: { allowed: false; status: 403; error: string }) {
  return res.status(access.status).json({ error: access.error });
}

function parseCanvasId(req: Request): number {
  return parseRouteParam(req.params.canvasId);
}

function parseStatus(value: unknown): "draft" | "completed" | null {
  if (value === "draft" || value === "completed") return value;
  return null;
}

router.get("/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseCanvasId(req);
  if (Number.isNaN(canvasId)) return res.status(400).json({ error: "Invalid canvas ID" });

  try {
    const access = await checkCanvasPermission(canvasId, user.id, "view");
    if (!access.allowed) return denyPermission(res, access);

    const profile = await getAiInsightProfileByCanvas(canvasId);
    res.json({ profile: profile ?? null });
  } catch (err) {
    console.error("Error fetching AI insight profile:", err);
    res.status(500).json({ error: "Failed to fetch AI insight profile" });
  }
});

router.put("/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseCanvasId(req);
  if (Number.isNaN(canvasId)) return res.status(400).json({ error: "Invalid canvas ID" });

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
    const access = await checkCanvasPermission(canvasId, user.id, "edit");
    if (!access.allowed) return denyPermission(res, access);

    const profile = await upsertAiInsightProfile(canvasId, user.id, body);
    res.json({ profile });
  } catch (err) {
    console.error("Error saving AI insight profile:", err);
    res.status(500).json({ error: "Failed to save AI insight profile" });
  }
});

export default router;
