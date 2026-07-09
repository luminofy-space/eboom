import express, { Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { savingsGoals } from "../db/schema";
import { getSavingsGoalProgress } from "../services/planningService";
import type { SavingsGoalStatus } from "../types/planning";
import { parseRouteParam } from "./routeParams";
import { requireCanvasAccess } from "../middleware/canvasAccess";

const router = express.Router({ mergeParams: true });

function parseSavingsGoalStatus(value: unknown): SavingsGoalStatus | null {
  if (value === "active" || value === "achieved" || value === "dropped") return value;
  return null;
}

function isArchivedForStatus(status: SavingsGoalStatus): boolean {
  return status !== "active";
}

router.get("/", requireCanvasAccess("view"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;

  try {
    const goals = await db
      .select()
      .from(savingsGoals)
      .where(eq(savingsGoals.canvasId, canvasId));

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

router.post("/", requireCanvasAccess("edit"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const user = req.appUser!;

  const { name, currencyId, targetAmount, targetDate, alertThresholdPercent, photoUrl } = req.body;

  const parsedCurrencyId = parseRouteParam(String(currencyId ?? ""));

  if (!name || typeof name !== "string") return res.status(400).json({ error: "Name is required" });
  if (Number.isNaN(parsedCurrencyId)) return res.status(400).json({ error: "Invalid currency ID" });
  if (!targetAmount || parseFloat(String(targetAmount)) <= 0) {
    return res.status(400).json({ error: "Invalid target amount" });
  }

  try {
    const [created] = await db
      .insert(savingsGoals)
      .values({
        canvasId,
        currencyId: parsedCurrencyId,
        name,
        targetAmount: String(targetAmount),
        targetDate: typeof targetDate === "string" ? targetDate : null,
        photoUrl: typeof photoUrl === "string" ? photoUrl : null,
        linkedWalletId: null,
        status: "active",
        isArchived: false,
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

router.get("/:goalId/progress", requireCanvasAccess("view"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const goalId = parseRouteParam(req.params.goalId);
  if (Number.isNaN(goalId)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  try {
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

router.patch("/:goalId", requireCanvasAccess("edit"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const user = req.appUser!;
  const goalId = parseRouteParam(req.params.goalId);
  if (Number.isNaN(goalId)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  const { name, targetAmount, targetDate, alertThresholdPercent, currencyId, status, photoUrl } =
    req.body;

  try {
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

    const parsedStatus = status != null ? parseSavingsGoalStatus(status) : existing.status;
    if (!parsedStatus) {
      return res.status(400).json({ error: "Invalid status" });
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
        ...(photoUrl !== undefined && {
          photoUrl: typeof photoUrl === "string" ? photoUrl : null,
        }),
        alertThresholdPercent:
          alertThresholdPercent != null
            ? parseRouteParam(String(alertThresholdPercent))
            : existing.alertThresholdPercent,
        status: parsedStatus,
        isArchived: isArchivedForStatus(parsedStatus),
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

router.delete("/:goalId", requireCanvasAccess("edit"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const user = req.appUser!;
  const goalId = parseRouteParam(req.params.goalId);
  if (Number.isNaN(goalId)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  try {
    const [existing] = await db
      .select()
      .from(savingsGoals)
      .where(and(eq(savingsGoals.id, goalId), eq(savingsGoals.canvasId, canvasId)));
    if (!existing) return res.status(404).json({ error: "Savings goal not found" });

    await db
      .update(savingsGoals)
      .set({
        status: "dropped",
        isArchived: true,
        lastModifiedBy: user.id,
        lastModifiedAt: new Date(),
      })
      .where(eq(savingsGoals.id, goalId));

    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting savings goal:", err);
    res.status(500).json({ error: "Failed to delete savings goal" });
  }
});

export default router;
