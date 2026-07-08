import express, { Request, Response } from "express";
import { db } from "../db/client";
import {
  createTransfer,
  deleteTransfer,
  fetchEnrichedTransferById,
  getTransferCanvasId,
  listTransfersForCanvas,
  updateTransfer,
  validateTransferInput,
} from "../services/transferService";
import { parseRouteParam } from "./routeParams";
import { requireCanvasAccess } from "../middleware/canvasAccess";
import { ErrorKeys } from "../errors/errorKeys";
import { sendError } from "../errors/sendError";

const router = express.Router({ mergeParams: true });

function mapTransferError(err: unknown, fallback: string): { status: number; message: string } {
  if (!(err instanceof Error)) return { status: 500, message: fallback };
  const msg = err.message;
  if (msg === "Insufficient wallet balance") {
    return { status: 400, message: msg };
  }
  if (
    msg.includes("required") ||
    msg.includes("must") ||
    msg.includes("Invalid") ||
    msg.includes("not found") ||
    msg.includes("differ") ||
    msg.includes("match")
  ) {
    return { status: 400, message: msg };
  }
  return { status: 500, message: fallback };
}

router.get("/", requireCanvasAccess("view"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;

  const walletIdParam = req.query.walletId;
  const walletId =
    walletIdParam != null && walletIdParam !== ""
      ? parseRouteParam(String(walletIdParam))
      : undefined;

  if (walletId != null && Number.isNaN(walletId)) {
    return sendError(res, ErrorKeys.validation.invalidWallet, 400);
  }

  try {
    const transfersList = await listTransfersForCanvas(canvasId, walletId);
    res.json({ transfers: transfersList, total: transfersList.length });
  } catch (err) {
    console.error("Error fetching canvas transfers:", err);
    sendError(res, ErrorKeys.transfer.fetchFailed, 500);
  }
});

router.post("/", requireCanvasAccess("edit"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const user = req.appUser!;

  try {
    const input = validateTransferInput({ ...req.body, canvasId });
    const transfer = await createTransfer(input, user.id);
    res.status(201).json({ transfer });
  } catch (err) {
    console.error("Error creating transfer:", err);
    const { status, message } = mapTransferError(err, "Failed to create transfer");
    sendError(res, ErrorKeys.common.internal, status || 500);
  }
});

router.get("/:transferId", requireCanvasAccess("view"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const transferId = parseRouteParam(req.params.transferId);
  if (Number.isNaN(transferId)) {
    return sendError(res, ErrorKeys.transfer.invalidId, 400);
  }

  try {
    const transferCanvasId = await getTransferCanvasId(transferId);
    if (!transferCanvasId || transferCanvasId !== canvasId) {
      return sendError(res, ErrorKeys.transfer.notFound, 404);
    }

    const transfer = await fetchEnrichedTransferById(transferId);
    if (!transfer) return sendError(res, ErrorKeys.transfer.notFound, 404);

    res.json({ transfer });
  } catch (err) {
    console.error("Error fetching transfer:", err);
    sendError(res, ErrorKeys.transfer.fetchFailed, 500);
  }
});

router.put("/:transferId", requireCanvasAccess("edit"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const user = req.appUser!;
  const transferId = parseRouteParam(req.params.transferId);
  if (Number.isNaN(transferId)) {
    return sendError(res, ErrorKeys.transfer.invalidId, 400);
  }

  try {
    const transferCanvasId = await getTransferCanvasId(transferId);
    if (!transferCanvasId || transferCanvasId !== canvasId) {
      return sendError(res, ErrorKeys.transfer.notFound, 404);
    }

    const input = validateTransferInput({ ...req.body, canvasId });
    const transfer = await updateTransfer(transferId, input, user.id);
    res.json({ transfer });
  } catch (err) {
    console.error("Error updating transfer:", err);
    const { status, message } = mapTransferError(err, "Failed to update transfer");
    sendError(res, ErrorKeys.common.internal, status || 500);
  }
});

router.delete("/:transferId", requireCanvasAccess("edit"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const transferId = parseRouteParam(req.params.transferId);
  if (Number.isNaN(transferId)) {
    return sendError(res, ErrorKeys.transfer.invalidId, 400);
  }

  try {
    const transferCanvasId = await getTransferCanvasId(transferId);
    if (!transferCanvasId || transferCanvasId !== canvasId) {
      return sendError(res, ErrorKeys.transfer.notFound, 404);
    }

    await deleteTransfer(transferId);
    res.json({ message: "Transfer deleted successfully" });
  } catch (err) {
    console.error("Error deleting transfer:", err);
    const { status, message } = mapTransferError(err, "Failed to delete transfer");
    sendError(res, ErrorKeys.common.internal, status || 500);
  }
});

export default router;
