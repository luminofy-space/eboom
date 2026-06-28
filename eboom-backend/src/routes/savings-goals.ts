import express, { Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { savingsGoals } from "../db/schema";
import { checkCanvasPermission } from "../services/canvasAccessService";
import { getSavingsGoalProgress } from "../services/planningService";
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

    const goals = await db
      .select()
      .from(savingsGoals)
      .where(and(eq(savingsGoals.canvasId, canvasId), eq(savingsGoals.isArchived, false)));

    const enriched = await Promise.all(
      goals.map(async (goal) => ({
        goal,
        progress: await getSavingsGoalProgress(goal.id),
      }))
    );

    res.json({ goals: enriched });
  } catch (err) {
    console.error("Error listing savings goals:", err);
    res.status(500).json({ error: "Failed to list savings goals" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseCanvasId(req);
  if (Number.isNaN(canvasId)) return res.status(400).json({ error: "Invalid canvas ID" });

  const { name, currencyId, targetAmount, targetDate, alertThresholdPercent } = req.body;

  const parsedCurrencyId = parseRouteParam(String(currencyId ?? ""));

  if (!name || typeof name !== "string") return res.status(400).json({ error: "Name is required" });
  if (Number.isNaN(parsedCurrencyId)) return res.status(400).json({ error: "Invalid currency ID" });
  if (!targetAmount || parseFloat(String(targetAmount)) <= 0) {
    return res.status(400).json({ error: "Invalid target amount" });
  }

  try {
    const access = await checkCanvasPermission(canvasId, user.id, "edit");
    if (!access.allowed) return denyPermission(res, access);

    const [created] = await db
      .insert(savingsGoals)
      .values({
        canvasId,
        currencyId: parsedCurrencyId,
        name,
        targetAmount: String(targetAmount),
        targetDate: typeof targetDate === "string" ? targetDate : null,
        linkedWalletId: null,
        alertThresholdPercent:
          alertThresholdPercent != null ? parseRouteParam(String(alertThresholdPercent)) : 80,
        createdBy: user.id,
        lastModifiedBy: user.id,
      })
      .returning();

    const progress = await getSavingsGoalProgress(created.id);
    res.status(201).json({ goal: created, progress });
  } catch (err) {
    console.error("Error creating savings goal:", err);
    res.status(500).json({ error: "Failed to create savings goal" });
  }
});

router.get("/:goalId/progress", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseCanvasId(req);
  const goalId = parseRouteParam(req.params.goalId);
  if (Number.isNaN(canvasId) || Number.isNaN(goalId)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  try {
    const access = await checkCanvasPermission(canvasId, user.id, "view");
    if (!access.allowed) return denyPermission(res, access);

    const [goal] = await db
      .select()
      .from(savingsGoals)
      .where(and(eq(savingsGoals.id, goalId), eq(savingsGoals.canvasId, canvasId)));
    if (!goal) return res.status(404).json({ error: "Savings goal not found" });

    const progress = await getSavingsGoalProgress(goalId);
    res.json({ progress });
  } catch (err) {
    console.error("Error fetching savings goal progress:", err);
    res.status(500).json({ error: "Failed to fetch savings goal progress" });
  }
});

router.patch("/:goalId", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseCanvasId(req);
  const goalId = parseRouteParam(req.params.goalId);
  if (Number.isNaN(canvasId) || Number.isNaN(goalId)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  const { name, targetAmount, targetDate, alertThresholdPercent, currencyId, isArchived } = req.body;

  try {
    const access = await checkCanvasPermission(canvasId, user.id, "edit");
    if (!access.allowed) return denyPermission(res, access);

    const [existing] = await db
      .select()
      .from(savingsGoals)
      .where(and(eq(savingsGoals.id, goalId), eq(savingsGoals.canvasId, canvasId)));
    if (!existing) return res.status(404).json({ error: "Savings goal not found" });

    const parsedCurrencyId =
      currencyId != null ? parseRouteParam(String(currencyId)) : existing.currencyId;

    if (Number.isNaN(parsedCurrencyId)) {
      return res.status(400).json({ error: "Invalid currency ID" });
    }

    const [updated] = await db
      .update(savingsGoals)
      .set({
        name: typeof name === "string" ? name : existing.name,
        currencyId: parsedCurrencyId,
        targetAmount: targetAmount != null ? String(targetAmount) : existing.targetAmount,
        targetDate:
          targetDate === null
            ? null
            : typeof targetDate === "string"
              ? targetDate
              : existing.targetDate,
        alertThresholdPercent:
          alertThresholdPercent != null
            ? parseRouteParam(String(alertThresholdPercent))
            : existing.alertThresholdPercent,
        isArchived: isArchived ?? existing.isArchived,
        lastModifiedBy: user.id,
        lastModifiedAt: new Date(),
      })
      .where(eq(savingsGoals.id, goalId))
      .returning();

    const progress = await getSavingsGoalProgress(updated.id);
    res.json({ goal: updated, progress });
  } catch (err) {
    console.error("Error updating savings goal:", err);
    res.status(500).json({ error: "Failed to update savings goal" });
  }
});

router.delete("/:goalId", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseCanvasId(req);
  const goalId = parseRouteParam(req.params.goalId);
  if (Number.isNaN(canvasId) || Number.isNaN(goalId)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  try {
    const access = await checkCanvasPermission(canvasId, user.id, "edit");
    if (!access.allowed) return denyPermission(res, access);

    const [existing] = await db
      .select()
      .from(savingsGoals)
      .where(and(eq(savingsGoals.id, goalId), eq(savingsGoals.canvasId, canvasId)));
    if (!existing) return res.status(404).json({ error: "Savings goal not found" });

    await db
      .update(savingsGoals)
      .set({ isArchived: true, lastModifiedBy: user.id, lastModifiedAt: new Date() })
      .where(eq(savingsGoals.id, goalId));

    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting savings goal:", err);
    res.status(500).json({ error: "Failed to delete savings goal" });
  }
});

export default router;
