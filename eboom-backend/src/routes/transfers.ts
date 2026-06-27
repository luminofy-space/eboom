import express, { Request, Response } from "express";
import { checkCanvasPermission } from "../services/canvasAccessService";
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

const router = express.Router();

function denyPermission(res: Response, access: { allowed: false; status: 403; error: string }) {
  return res.status(access.status).json({ error: access.error });
}

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

router.post("/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = Number(req.body.canvasId);
  if (!canvasId || Number.isNaN(canvasId)) {
    return res.status(400).json({ error: "Canvas ID is required" });
  }

  try {
    const access = await checkCanvasPermission(canvasId, user.id, "edit");
    if (!access.allowed) return denyPermission(res, access);

    const input = validateTransferInput(req.body);
    const transfer = await createTransfer(input, user.id);
    res.status(201).json({ transfer });
  } catch (err) {
    console.error("Error creating transfer:", err);
    const { status, message } = mapTransferError(err, "Failed to create transfer");
    res.status(status).json({ error: message });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const transferId = parseRouteParam(req.params.id);
  if (isNaN(transferId)) {
    return res.status(400).json({ error: "Invalid transfer ID" });
  }

  try {
    const canvasId = await getTransferCanvasId(transferId);
    if (!canvasId) return res.status(404).json({ error: "Transfer not found" });

    const access = await checkCanvasPermission(canvasId, user.id, "view");
    if (!access.allowed) return denyPermission(res, access);

    const transfer = await fetchEnrichedTransferById(transferId);
    if (!transfer) return res.status(404).json({ error: "Transfer not found" });

    res.json({ transfer });
  } catch (err) {
    console.error("Error fetching transfer:", err);
    res.status(500).json({ error: "Failed to fetch transfer" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const transferId = parseRouteParam(req.params.id);
  if (isNaN(transferId)) {
    return res.status(400).json({ error: "Invalid transfer ID" });
  }

  try {
    const canvasId = await getTransferCanvasId(transferId);
    if (!canvasId) return res.status(404).json({ error: "Transfer not found" });

    const access = await checkCanvasPermission(canvasId, user.id, "edit");
    if (!access.allowed) return denyPermission(res, access);

    const input = validateTransferInput(req.body);
    const transfer = await updateTransfer(transferId, input, user.id);
    res.json({ transfer });
  } catch (err) {
    console.error("Error updating transfer:", err);
    const { status, message } = mapTransferError(err, "Failed to update transfer");
    res.status(status).json({ error: message });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const transferId = parseRouteParam(req.params.id);
  if (isNaN(transferId)) {
    return res.status(400).json({ error: "Invalid transfer ID" });
  }

  try {
    const canvasId = await getTransferCanvasId(transferId);
    if (!canvasId) return res.status(404).json({ error: "Transfer not found" });

    const access = await checkCanvasPermission(canvasId, user.id, "edit");
    if (!access.allowed) return denyPermission(res, access);

    await deleteTransfer(transferId);
    res.json({ message: "Transfer deleted successfully" });
  } catch (err) {
    console.error("Error deleting transfer:", err);
    const { status, message } = mapTransferError(err, "Failed to delete transfer");
    res.status(status).json({ error: message });
  }
});

export default router;

export async function listCanvasTransfersHandler(req: Request, res: Response) {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseRouteParam(req.params.canvasId);
  if (isNaN(canvasId)) {
    return res.status(400).json({ error: "Invalid canvas ID" });
  }

  const walletIdParam = req.query.walletId;
  const walletId =
    walletIdParam != null && walletIdParam !== ""
      ? parseRouteParam(String(walletIdParam))
      : undefined;

  if (walletId != null && isNaN(walletId)) {
    return res.status(400).json({ error: "Invalid wallet ID" });
  }

  try {
    const access = await checkCanvasPermission(canvasId, user.id, "view");
    if (!access.allowed) return denyPermission(res, access);

    const transfersList = await listTransfersForCanvas(canvasId, walletId);
    res.json({ transfers: transfersList, total: transfersList.length });
  } catch (err) {
    console.error("Error fetching canvas transfers:", err);
    res.status(500).json({ error: "Failed to fetch transfers" });
  }
}
