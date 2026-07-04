import express, { Request, Response } from "express";
import {
  clearChatHistory,
  getChatMessagesByCanvas,
  sendChatMessage,
} from "../services/aiChatService";
import { isLlmConfigured } from "../services/llmClient";
import { requireCanvasAccess } from "../middleware/canvasAccess";

const router = express.Router({ mergeParams: true });

router.get("/", requireCanvasAccess("view"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;

  try {
    const messages = await getChatMessagesByCanvas(canvasId);
    res.json({ messages });
  } catch (err) {
    console.error("Error fetching AI chat messages:", err);
    res.status(500).json({ error: "Failed to fetch chat messages" });
  }
});

router.post("/messages", requireCanvasAccess("edit"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const user = req.appUser!;

  if (!isLlmConfigured()) {
    return res.status(503).json({ error: "LLM API key not configured" });
  }

  const content = typeof req.body?.content === "string" ? req.body.content : "";

  try {
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

router.delete("/", requireCanvasAccess("edit"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;

  try {
    await clearChatHistory(canvasId);
    res.json({ messages: [] });
  } catch (err) {
    console.error("Error clearing AI chat history:", err);
    res.status(500).json({ error: "Failed to clear chat history" });
  }
});

export default router;
