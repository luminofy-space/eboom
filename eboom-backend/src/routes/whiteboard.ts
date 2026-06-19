import express, { Request, Response } from "express";
import {
  checkCanvasPermission,
  type CanvasPermission,
} from "../services/canvasAccessService";
import {
  getWhiteboardData,
  upsertWhiteboardNodePositions,
  upsertWhiteboardViewport,
  unregisterWhiteboardNode,
  type WhiteboardEntityType,
  type WhiteboardNodePositionInput,
} from "../services/whiteboardService";

const router = express.Router({ mergeParams: true });

const VALID_ENTITY_TYPES = new Set<WhiteboardEntityType>(["wallet", "income", "expense"]);

function denyPermission(res: Response, access: { allowed: false; status: 403; error: string }) {
  return res.status(access.status).json({ error: access.error });
}

function parseCanvasId(req: Request): number | null {
  const canvasId = parseInt(req.params.canvasId, 10);
  return Number.isNaN(canvasId) ? null : canvasId;
}

function parseEntityType(value: string): WhiteboardEntityType | null {
  if (VALID_ENTITY_TYPES.has(value as WhiteboardEntityType)) {
    return value as WhiteboardEntityType;
  }
  return null;
}

async function requireCanvasAccess(
  canvasId: number,
  userId: number,
  permission: CanvasPermission
) {
  return checkCanvasPermission(canvasId, userId, permission);
}

router.get("/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseCanvasId(req);
  if (canvasId == null) return res.status(400).json({ error: "Invalid canvas ID" });

  try {
    const access = await requireCanvasAccess(canvasId, user.id, "view");
    if (!access.allowed) return denyPermission(res, access);

    const data = await getWhiteboardData(canvasId);
    res.json(data);
  } catch (err) {
    console.error("Error fetching whiteboard:", err);
    res.status(500).json({ error: "Failed to fetch whiteboard" });
  }
});

router.put("/viewport", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseCanvasId(req);
  if (canvasId == null) return res.status(400).json({ error: "Invalid canvas ID" });

  const { x, y, zoom } = req.body ?? {};
  if ([x, y, zoom].some((v) => typeof v !== "number" || Number.isNaN(v))) {
    return res.status(400).json({ error: "Viewport x, y, and zoom must be numbers" });
  }

  try {
    const access = await requireCanvasAccess(canvasId, user.id, "edit");
    if (!access.allowed) return denyPermission(res, access);

    const viewport = await upsertWhiteboardViewport(canvasId, { x, y, zoom });
    res.json({ viewport });
  } catch (err) {
    console.error("Error saving whiteboard viewport:", err);
    res.status(500).json({ error: "Failed to save whiteboard viewport" });
  }
});

router.put("/nodes", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseCanvasId(req);
  if (canvasId == null) return res.status(400).json({ error: "Invalid canvas ID" });

  const nodes = req.body?.nodes as WhiteboardNodePositionInput[] | undefined;
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return res.status(400).json({ error: "nodes array is required" });
  }

  for (const node of nodes) {
    if (!node || !VALID_ENTITY_TYPES.has(node.entityType)) {
      return res.status(400).json({ error: "Invalid entity type in nodes" });
    }
    if (
      typeof node.entityId !== "number" ||
      Number.isNaN(node.entityId) ||
      typeof node.x !== "number" ||
      Number.isNaN(node.x) ||
      typeof node.y !== "number" ||
      Number.isNaN(node.y)
    ) {
      return res.status(400).json({ error: "Invalid node position payload" });
    }
  }

  try {
    const access = await requireCanvasAccess(canvasId, user.id, "edit");
    if (!access.allowed) return denyPermission(res, access);

    const saved = await upsertWhiteboardNodePositions(canvasId, nodes);
    res.json({ nodePositions: saved });
  } catch (err) {
    console.error("Error saving whiteboard node positions:", err);
    res.status(500).json({ error: "Failed to save whiteboard node positions" });
  }
});

router.delete("/nodes/:entityType/:entityId", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseCanvasId(req);
  if (canvasId == null) return res.status(400).json({ error: "Invalid canvas ID" });

  const entityType = parseEntityType(req.params.entityType);
  if (!entityType) return res.status(400).json({ error: "Invalid entity type" });

  const entityId = parseInt(req.params.entityId, 10);
  if (Number.isNaN(entityId)) return res.status(400).json({ error: "Invalid entity ID" });

  try {
    const access = await requireCanvasAccess(canvasId, user.id, "edit");
    if (!access.allowed) return denyPermission(res, access);

    await unregisterWhiteboardNode(canvasId, entityType, entityId);
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting whiteboard node position:", err);
    res.status(500).json({ error: "Failed to delete whiteboard node position" });
  }
});

export default router;
