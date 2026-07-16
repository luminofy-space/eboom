import express, { Request, Response } from "express";
import { db } from "../db/client";
import {
  canvases,
  canvasMembers,
  currencies,
  userSettings,
  roles,
} from "../db/schema";
import { eq, and } from "drizzle-orm";
import {
  computePermissions,
  formatMembershipForResponse,
} from "../services/canvasAccessService";
import { getCanvasSummary, getCanvasTransactions, getPaginatedCanvasTransactions, type CanvasTransactionType } from "../services/dashboardService";
import { requireCanvasAccess } from "../middleware/canvasAccess";
import { ErrorKeys } from "../errors/errorKeys";
import { sendError } from "../errors/sendError";
import { hasPaginationParams, parsePaginationParams } from "./listQueryParams";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return sendError(res, ErrorKeys.common.unauthorized, 401);

  try {
    const memberships = await db
      .select({
        canvas: canvases,
        member: canvasMembers,
        role: roles,
      })
      .from(canvasMembers)
      .innerJoin(canvases, eq(canvasMembers.canvasId, canvases.id))
      .leftJoin(roles, eq(canvasMembers.roleId, roles.id))
      .where(and(eq(canvasMembers.userId, user.id), eq(canvases.isArchived, false)));

    const userCanvases = memberships.map((m) => {
      const rolePermissions =
        m.role?.permissions && typeof m.role.permissions === "object"
          ? (m.role.permissions as Record<string, boolean>)
          : {};
      const permissions = computePermissions(m.member.isOwner ?? false, rolePermissions);
      return {
        ...m.canvas,
        isOwner: m.member.isOwner,
        roleId: m.member.roleId,
        roleName: m.role?.name ?? null,
        permissions,
      };
    });

    res.json({ canvases: userCanvases });
  } catch (err) {
    console.error("Error fetching canvases:", err);
    sendError(res, ErrorKeys.canvas.fetchFailed, 500);
  }
});

router.post("/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return sendError(res, ErrorKeys.common.unauthorized, 401);

  const { name, description, canvasType, photoUrl, baseCurrencyId } = req.body;

  if (!name) {
    return sendError(res, ErrorKeys.validation.nameRequired, 400);
  }

  try {
    if (baseCurrencyId) {
      const [selectedCurrency] = await db
        .select({ id: currencies.id })
        .from(currencies)
        .where(eq(currencies.id, Number(baseCurrencyId)));

      if (!selectedCurrency) {
        return sendError(res, ErrorKeys.validation.currencyRequired, 400);
      }

      const [existingSettings] = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, user.id));

      if (existingSettings) {
        await db
          .update(userSettings)
          .set({ defaultCurrencyId: selectedCurrency.id, lastModifiedAt: new Date() })
          .where(eq(userSettings.userId, user.id));
      } else {
        await db.insert(userSettings).values({
          userId: user.id,
          defaultCurrencyId: selectedCurrency.id,
        });
      }
    }

    const [newCanvas] = await db
      .insert(canvases)
      .values({
        name,
        description: description || null,
        canvasType: canvasType || null,
        photoUrl: photoUrl || null,
        createdBy: user.id,
        lastModifiedBy: user.id,
      })
      .returning();

    await db.insert(canvasMembers).values({
      canvasId: newCanvas.id,
      userId: user.id,
      isOwner: true,
    });

    res.status(201).json({ canvas: newCanvas });
  } catch (err) {
    console.error("Error creating canvas:", err);
    sendError(res, ErrorKeys.canvas.createFailed, 500);
  }
});

router.get("/:canvasId/summary", requireCanvasAccess("view"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;

  try {
    const summary = await getCanvasSummary(canvasId);
    res.json(summary);
  } catch (err) {
    console.error("Error fetching canvas summary:", err);
    sendError(res, ErrorKeys.canvas.fetchFailed, 500);
  }
});

router.get("/:canvasId/transactions", requireCanvasAccess("view"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;

  try {
    if (hasPaginationParams(req)) {
      const type = req.query.type as CanvasTransactionType | undefined;
      if (!type || !["incomeEntries", "expensePayments", "transfers"].includes(type)) {
        return sendError(res, ErrorKeys.validation.failed, 400);
      }
      const { page, limit } = parsePaginationParams(req);
      const result = await getPaginatedCanvasTransactions(canvasId, type, page, limit);
      return res.json(result);
    }

    const transactions = await getCanvasTransactions(canvasId);
    res.json(transactions);
  } catch (err) {
    console.error("Error fetching canvas transactions:", err);
    sendError(res, ErrorKeys.canvas.fetchFailed, 500);
  }
});

router.get("/:canvasId", requireCanvasAccess("view"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const membership = req.canvasMembership!;

  try {
    const [canvas] = await db
      .select()
      .from(canvases)
      .where(eq(canvases.id, canvasId));

    if (!canvas) {
      return sendError(res, ErrorKeys.canvas.notFound, 404);
    }

    res.json({
      canvas: {
        ...canvas,
        ...formatMembershipForResponse(membership),
      },
    });
  } catch (err) {
    console.error("Error fetching canvas:", err);
    sendError(res, ErrorKeys.canvas.fetchFailed, 500);
  }
});

router.put("/:canvasId", requireCanvasAccess("manage_canvas"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const user = req.appUser!;

  const { name, description, canvasType, photoUrl, isArchived } = req.body;

  try {
    const [updatedCanvas] = await db
      .update(canvases)
      .set({
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(canvasType !== undefined && { canvasType }),
        ...(photoUrl !== undefined && { photoUrl }),
        ...(isArchived !== undefined && { isArchived }),
        lastModifiedBy: user.id,
        lastModifiedAt: new Date(),
      })
      .where(eq(canvases.id, canvasId))
      .returning();

    if (!updatedCanvas) {
      return sendError(res, ErrorKeys.canvas.notFound, 404);
    }

    res.json({ canvas: updatedCanvas });
  } catch (err) {
    console.error("Error updating canvas:", err);
    sendError(res, ErrorKeys.canvas.updateFailed, 500);
  }
});

router.delete("/:canvasId", requireCanvasAccess("manage_canvas"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const user = req.appUser!;

  try {
    await db
      .update(canvases)
      .set({
        isArchived: true,
        lastModifiedBy: user.id,
        lastModifiedAt: new Date(),
      })
      .where(eq(canvases.id, canvasId));

    res.json({ message: "Canvas archived successfully" });
  } catch (err) {
    console.error("Error deleting canvas:", err);
    sendError(res, ErrorKeys.canvas.deleteFailed, 500);
  }
});

export default router;
