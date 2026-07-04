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
    return res.status(400).json({ error: "Invalid wallet ID" });
  }

  try {
    const transfersList = await listTransfersForCanvas(canvasId, walletId);
    res.json({ transfers: transfersList, total: transfersList.length });
  } catch (err) {
    console.error("Error fetching canvas transfers:", err);
    res.status(500).json({ error: "Failed to fetch transfers" });
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
    res.status(status).json({ error: message });
  }
});

router.get("/:transferId", requireCanvasAccess("view"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const transferId = parseRouteParam(req.params.transferId);
  if (Number.isNaN(transferId)) {
    return res.status(400).json({ error: "Invalid transfer ID" });
  }

  try {
    const transferCanvasId = await getTransferCanvasId(transferId);
    if (!transferCanvasId || transferCanvasId !== canvasId) {
      return res.status(404).json({ error: "Transfer not found" });
    }

    const transfer = await fetchEnrichedTransferById(transferId);
    if (!transfer) return res.status(404).json({ error: "Transfer not found" });

    res.json({ transfer });
  } catch (err) {
    console.error("Error fetching transfer:", err);
    res.status(500).json({ error: "Failed to fetch transfer" });
  }
});

router.put("/:transferId", requireCanvasAccess("edit"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const user = req.appUser!;
  const transferId = parseRouteParam(req.params.transferId);
  if (Number.isNaN(transferId)) {
    return res.status(400).json({ error: "Invalid transfer ID" });
  }

  try {
    const transferCanvasId = await getTransferCanvasId(transferId);
    if (!transferCanvasId || transferCanvasId !== canvasId) {
      return res.status(404).json({ error: "Transfer not found" });
    }

    const input = validateTransferInput({ ...req.body, canvasId });
    const transfer = await updateTransfer(transferId, input, user.id);
    res.json({ transfer });
  } catch (err) {
    console.error("Error updating transfer:", err);
    const { status, message } = mapTransferError(err, "Failed to update transfer");
    res.status(status).json({ error: message });
  }
});

router.delete("/:transferId", requireCanvasAccess("edit"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const transferId = parseRouteParam(req.params.transferId);
  if (Number.isNaN(transferId)) {
    return res.status(400).json({ error: "Invalid transfer ID" });
  }

  try {
    const transferCanvasId = await getTransferCanvasId(transferId);
    if (!transferCanvasId || transferCanvasId !== canvasId) {
      return res.status(404).json({ error: "Transfer not found" });
    }

    await deleteTransfer(transferId);
    res.json({ message: "Transfer deleted successfully" });
  } catch (err) {
    console.error("Error deleting transfer:", err);
    const { status, message } = mapTransferError(err, "Failed to delete transfer");
    res.status(status).json({ error: message });
  }
});

export default router;
