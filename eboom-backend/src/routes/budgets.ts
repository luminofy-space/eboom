import express, { Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { budgets, budgetLines, savingsGoals, wallets } from "../db/schema";
import { checkCanvasPermission } from "../services/canvasAccessService";
import {
  getBudgetProgress,
  getBudgetSuggestions,
  getBudgetSummaryForCanvas,
  getBudgetWithLines,
  getCanvasCurrencyUsage,
  getCashFlowForecast,
  getSavingsGoalProgress,
  upsertBudgetWithLines,
} from "../services/planningService";
import type { BudgetLineInput, BudgetPeriodType } from "../types/planning";
import { parseRouteParam } from "./routeParams";

const router = express.Router({ mergeParams: true });

function denyPermission(res: Response, access: { allowed: false; status: 403; error: string }) {
  return res.status(access.status).json({ error: access.error });
}

function parseCanvasId(req: Request): number {
  return parseRouteParam(req.params.canvasId);
}

function parseBudgetPeriodType(value: unknown): BudgetPeriodType | null {
  if (value === "weekly" || value === "monthly" || value === "yearly") return value;
  return null;
}

router.get("/currency-usage", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseCanvasId(req);
  if (Number.isNaN(canvasId)) return res.status(400).json({ error: "Invalid canvas ID" });

  try {
    const access = await checkCanvasPermission(canvasId, user.id, "view");
    if (!access.allowed) return denyPermission(res, access);

    const usage = await getCanvasCurrencyUsage(canvasId);
    res.json({ currencies: usage });
  } catch (err) {
    console.error("Error fetching currency usage:", err);
    res.status(500).json({ error: "Failed to fetch currency usage" });
  }
});

router.get("/suggestions", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseCanvasId(req);
  if (Number.isNaN(canvasId)) return res.status(400).json({ error: "Invalid canvas ID" });

  const currencyId = parseRouteParam(String(req.query.currencyId ?? ""));
  const periodType = parseBudgetPeriodType(req.query.periodType);

  if (Number.isNaN(currencyId)) return res.status(400).json({ error: "Invalid currency ID" });
  if (!periodType) return res.status(400).json({ error: "Invalid period type" });

  try {
    const access = await checkCanvasPermission(canvasId, user.id, "view");
    if (!access.allowed) return denyPermission(res, access);

    const suggestions = await getBudgetSuggestions(canvasId, currencyId, periodType);
    if (!suggestions) return res.status(404).json({ error: "Currency not found" });

    res.json({ suggestions });
  } catch (err) {
    console.error("Error fetching budget suggestions:", err);
    res.status(500).json({ error: "Failed to fetch budget suggestions" });
  }
});

router.get("/summary", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseCanvasId(req);
  if (Number.isNaN(canvasId)) return res.status(400).json({ error: "Invalid canvas ID" });

  try {
    const access = await checkCanvasPermission(canvasId, user.id, "view");
    if (!access.allowed) return denyPermission(res, access);

    const summary = await getBudgetSummaryForCanvas(canvasId);
    res.json(summary);
  } catch (err) {
    console.error("Error fetching budget summary:", err);
    res.status(500).json({ error: "Failed to fetch budget summary" });
  }
});

router.get("/forecast", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseCanvasId(req);
  if (Number.isNaN(canvasId)) return res.status(400).json({ error: "Invalid canvas ID" });

  const currencyId = parseRouteParam(String(req.query.currencyId ?? ""));
  const startDate = typeof req.query.startDate === "string" ? req.query.startDate : undefined;
  const endDate = typeof req.query.endDate === "string" ? req.query.endDate : undefined;

  if (Number.isNaN(currencyId)) return res.status(400).json({ error: "Invalid currency ID" });
  if (!startDate || !endDate) {
    return res.status(400).json({ error: "startDate and endDate are required" });
  }

  try {
    const access = await checkCanvasPermission(canvasId, user.id, "view");
    if (!access.allowed) return denyPermission(res, access);

    const forecast = await getCashFlowForecast(canvasId, currencyId, startDate, endDate);
    if (!forecast) return res.status(404).json({ error: "Currency not found" });

    res.json({ forecast });
  } catch (err) {
    console.error("Error fetching forecast:", err);
    res.status(500).json({ error: "Failed to fetch forecast" });
  }
});

router.get("/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseCanvasId(req);
  if (Number.isNaN(canvasId)) return res.status(400).json({ error: "Invalid canvas ID" });

  try {
    const access = await checkCanvasPermission(canvasId, user.id, "view");
    if (!access.allowed) return denyPermission(res, access);

    const rows = await db.select().from(budgets).where(eq(budgets.canvasId, canvasId));
    const enriched = await Promise.all(
      rows.map(async (budget) => {
        const detail = await getBudgetWithLines(budget.id);
        const progress = await getBudgetProgress(budget.id);
        return { ...detail, progress };
      })
    );

    res.json({ budgets: enriched.filter(Boolean) });
  } catch (err) {
    console.error("Error listing budgets:", err);
    res.status(500).json({ error: "Failed to list budgets" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseCanvasId(req);
  if (Number.isNaN(canvasId)) return res.status(400).json({ error: "Invalid canvas ID" });

  const {
    currencyId,
    periodType: rawPeriodType,
    totalLimit,
    alertThresholdPercent,
    alertsEnabled,
    name,
    lines,
  } = req.body;

  const periodType = parseBudgetPeriodType(rawPeriodType);
  const parsedCurrencyId = parseRouteParam(String(currencyId ?? ""));

  if (!periodType) return res.status(400).json({ error: "Invalid period type" });
  if (Number.isNaN(parsedCurrencyId)) return res.status(400).json({ error: "Invalid currency ID" });
  if (!totalLimit || parseFloat(String(totalLimit)) < 0) {
    return res.status(400).json({ error: "Invalid total limit" });
  }

  const parsedLines: BudgetLineInput[] = Array.isArray(lines)
    ? lines
        .filter((line: unknown) => line && typeof line === "object")
        .map((line: Record<string, unknown>) => ({
          expenseCategoryId: parseRouteParam(String(line.expenseCategoryId ?? "")),
          amountLimit: String(line.amountLimit ?? "0"),
          alertThresholdPercent:
            line.alertThresholdPercent != null
              ? parseRouteParam(String(line.alertThresholdPercent))
              : null,
        }))
        .filter((line) => !Number.isNaN(line.expenseCategoryId))
    : [];

  try {
    const access = await checkCanvasPermission(canvasId, user.id, "edit");
    if (!access.allowed) return denyPermission(res, access);

    const result = await upsertBudgetWithLines(canvasId, user.id, {
      currencyId: parsedCurrencyId,
      periodType,
      totalLimit: String(totalLimit),
      alertThresholdPercent:
        alertThresholdPercent != null ? parseRouteParam(String(alertThresholdPercent)) : undefined,
      alertsEnabled: alertsEnabled !== false,
      name: typeof name === "string" ? name : null,
      lines: parsedLines,
    });

    const progress = await getBudgetProgress(result.budget.id);
    res.status(201).json({ budget: result.budget, lines: result.lines, progress });
  } catch (err) {
    console.error("Error creating budget:", err);
    res.status(500).json({ error: "Failed to create budget" });
  }
});

router.get("/:budgetId", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseCanvasId(req);
  const budgetId = parseRouteParam(req.params.budgetId);
  if (Number.isNaN(canvasId) || Number.isNaN(budgetId)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  try {
    const access = await checkCanvasPermission(canvasId, user.id, "view");
    if (!access.allowed) return denyPermission(res, access);

    const detail = await getBudgetWithLines(budgetId);
    if (!detail || detail.budget.canvasId !== canvasId) {
      return res.status(404).json({ error: "Budget not found" });
    }

    const progress = await getBudgetProgress(budgetId);
    res.json({ ...detail, progress });
  } catch (err) {
    console.error("Error fetching budget:", err);
    res.status(500).json({ error: "Failed to fetch budget" });
  }
});

router.get("/:budgetId/progress", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseCanvasId(req);
  const budgetId = parseRouteParam(req.params.budgetId);
  if (Number.isNaN(canvasId) || Number.isNaN(budgetId)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  try {
    const access = await checkCanvasPermission(canvasId, user.id, "view");
    if (!access.allowed) return denyPermission(res, access);

    const [budget] = await db.select().from(budgets).where(eq(budgets.id, budgetId));
    if (!budget || budget.canvasId !== canvasId) {
      return res.status(404).json({ error: "Budget not found" });
    }

    const progress = await getBudgetProgress(budgetId);
    res.json({ progress });
  } catch (err) {
    console.error("Error fetching budget progress:", err);
    res.status(500).json({ error: "Failed to fetch budget progress" });
  }
});

router.patch("/:budgetId", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseCanvasId(req);
  const budgetId = parseRouteParam(req.params.budgetId);
  if (Number.isNaN(canvasId) || Number.isNaN(budgetId)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  const [existing] = await db.select().from(budgets).where(eq(budgets.id, budgetId));
  if (!existing || existing.canvasId !== canvasId) {
    return res.status(404).json({ error: "Budget not found" });
  }

  const { totalLimit, alertThresholdPercent, alertsEnabled, name, lines } = req.body;

  const parsedLines: BudgetLineInput[] | undefined = Array.isArray(lines)
    ? lines
        .filter((line: unknown) => line && typeof line === "object")
        .map((line: Record<string, unknown>) => ({
          expenseCategoryId: parseRouteParam(String(line.expenseCategoryId ?? "")),
          amountLimit: String(line.amountLimit ?? "0"),
          alertThresholdPercent:
            line.alertThresholdPercent != null
              ? parseRouteParam(String(line.alertThresholdPercent))
              : null,
        }))
        .filter((line) => !Number.isNaN(line.expenseCategoryId))
    : undefined;

  try {
    const access = await checkCanvasPermission(canvasId, user.id, "edit");
    if (!access.allowed) return denyPermission(res, access);

    const [updatedBudget] = await db
      .update(budgets)
      .set({
        totalLimit: totalLimit != null ? String(totalLimit) : existing.totalLimit,
        alertThresholdPercent:
          alertThresholdPercent != null
            ? parseRouteParam(String(alertThresholdPercent))
            : existing.alertThresholdPercent,
        alertsEnabled: alertsEnabled ?? existing.alertsEnabled,
        name: typeof name === "string" ? name : existing.name,
        lastModifiedBy: user.id,
        lastModifiedAt: new Date(),
      })
      .where(eq(budgets.id, budgetId))
      .returning();

    let updatedLines = await db.select().from(budgetLines).where(eq(budgetLines.budgetId, budgetId));

    if (parsedLines) {
      await db.delete(budgetLines).where(eq(budgetLines.budgetId, budgetId));
      updatedLines =
        parsedLines.length > 0
          ? await db
              .insert(budgetLines)
              .values(
                parsedLines.map((line) => ({
                  budgetId,
                  expenseCategoryId: line.expenseCategoryId,
                  amountLimit: line.amountLimit,
                  alertThresholdPercent: line.alertThresholdPercent ?? null,
                }))
              )
              .returning()
          : [];
    }

    const progress = await getBudgetProgress(budgetId);
    res.json({ budget: updatedBudget, lines: updatedLines, progress });
  } catch (err) {
    console.error("Error updating budget:", err);
    res.status(500).json({ error: "Failed to update budget" });
  }
});

router.delete("/:budgetId", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseCanvasId(req);
  const budgetId = parseRouteParam(req.params.budgetId);
  if (Number.isNaN(canvasId) || Number.isNaN(budgetId)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  try {
    const access = await checkCanvasPermission(canvasId, user.id, "edit");
    if (!access.allowed) return denyPermission(res, access);

    const [existing] = await db.select().from(budgets).where(eq(budgets.id, budgetId));
    if (!existing || existing.canvasId !== canvasId) {
      return res.status(404).json({ error: "Budget not found" });
    }

    await db.delete(budgets).where(eq(budgets.id, budgetId));
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting budget:", err);
    res.status(500).json({ error: "Failed to delete budget" });
  }
});

export default router;
