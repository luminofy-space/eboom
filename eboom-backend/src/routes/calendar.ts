import express, { Request, Response } from "express";
import { checkCanvasPermission } from "../services/canvasAccessService";
import { getCalendarEvents } from "../services/calendarService";
import { parseRouteParam } from "./routeParams";

const router = express.Router();

function denyPermission(res: Response, access: { allowed: false; status: 403; error: string }) {
  return res.status(access.status).json({ error: access.error });
}

router.get("/:canvasId", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseRouteParam(req.params.canvasId);
  if (Number.isNaN(canvasId)) {
    return res.status(400).json({ error: "Invalid canvas ID" });
  }

  const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

  try {
    const access = await checkCanvasPermission(canvasId, user.id, "view");
    if (!access.allowed) return denyPermission(res, access);

    const events = await getCalendarEvents(canvasId, startDate, endDate);
    res.json({ events });
  } catch (err) {
    console.error("Error fetching calendar events:", err);
    res.status(500).json({ error: "Failed to fetch calendar events" });
  }
});

export default router;
