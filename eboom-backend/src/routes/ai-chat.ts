import express, { Request, Response } from "express";
import { checkCanvasPermission } from "../services/canvasAccessService";
import {
  clearChatHistory,
  getChatMessagesByCanvas,
  sendChatMessage,
} from "../services/aiChatService";
import { isLlmConfigured } from "../services/llmClient";
import { parseRouteParam } from "./routeParams";

const router = express.Router({ mergeParams: true });

function denyPermission(res: Response, access: { allowed: false; status: 403; error: string }) {
  return res.status(access.status).json({ error: access.error });
}

function parseCanvasId(req: Request): number {
  return parseRouteParam(req.params.canvasId);
}

router.get("/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseCanvasId(req);
  if (Number.isNaN(canvasId)) return res.status(400).json({ error: "Invalid canvas ID" });

  try {
    const access = await checkCanvasPermission(canvasId, user.id, "view");
    if (!access.allowed) return denyPermission(res, access);

    const messages = await getChatMessagesByCanvas(canvasId);
    res.json({ messages });
  } catch (err) {
    console.error("Error fetching AI chat messages:", err);
    res.status(500).json({ error: "Failed to fetch chat messages" });
  }
});

router.post("/messages", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseCanvasId(req);
  if (Number.isNaN(canvasId)) return res.status(400).json({ error: "Invalid canvas ID" });

  if (!isLlmConfigured()) {
    return res.status(503).json({ error: "LLM API key not configured" });
  }

  const content = typeof req.body?.content === "string" ? req.body.content : "";

  try {
    const access = await checkCanvasPermission(canvasId, user.id, "edit");
    if (!access.allowed) return denyPermission(res, access);

    const result = await sendChatMessage(canvasId, user.id, content);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "EMPTY_MESSAGE") {
      return res.status(400).json({ error: "Message cannot be empty" });
    }
    if (message === "MESSAGE_TOO_LONG") {
      return res.status(400).json({ error: "Message is too long" });
    }
    if (message === "RATE_LIMITED") {
      return res.status(429).json({ error: "Please wait before sending another message" });
    }
    if (message === "LLM_API_KEY_NOT_CONFIGURED") {
      return res.status(503).json({ error: "LLM API key not configured" });
    }
    console.error("Error sending AI chat message:", err);
    res.status(502).json({ error: "Failed to send chat message" });
  }
});

router.delete("/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseCanvasId(req);
  if (Number.isNaN(canvasId)) return res.status(400).json({ error: "Invalid canvas ID" });

  try {
    const access = await checkCanvasPermission(canvasId, user.id, "edit");
    if (!access.allowed) return denyPermission(res, access);

    await clearChatHistory(canvasId);
    res.json({ messages: [] });
  } catch (err) {
    console.error("Error clearing AI chat history:", err);
    res.status(500).json({ error: "Failed to clear chat history" });
  }
});

export default router;
