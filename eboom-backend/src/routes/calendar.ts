import express, { Request, Response } from "express";
import { getCalendarEvents } from "../services/calendarService";
import { requireCanvasAccess } from "../middleware/canvasAccess";

const router = express.Router();

router.get("/:canvasId", requireCanvasAccess("view"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

  try {
    const events = await getCalendarEvents(canvasId, startDate, endDate);
    res.json({ events });
  } catch (err) {
    console.error("Error fetching calendar events:", err);
    res.status(500).json({ error: "Failed to fetch calendar events" });
  }
});

export default router;
