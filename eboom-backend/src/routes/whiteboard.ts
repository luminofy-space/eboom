import express, { Request, Response } from "express";
import {
  getWhiteboardData,
  upsertWhiteboardNodePositions,
  upsertWhiteboardViewport,
  unregisterWhiteboardNode,
  type WhiteboardEntityType,
  type WhiteboardNodePositionInput,
} from "../services/whiteboardService";
import { parseRouteParam } from "./routeParams";
import { requireCanvasAccess } from "../middleware/canvasAccess";

const router = express.Router({ mergeParams: true });

const VALID_ENTITY_TYPES = new Set<WhiteboardEntityType>(["wallet", "income", "expense"]);

function parseEntityType(value: string | string[] | undefined): WhiteboardEntityType | null {
  const entityType = Array.isArray(value) ? value[0] : value;
  if (!entityType) return null;
  if (VALID_ENTITY_TYPES.has(entityType as WhiteboardEntityType)) {
    return entityType as WhiteboardEntityType;
  }
  return null;
}

router.get("/", requireCanvasAccess("view"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;

  try {
    const data = await getWhiteboardData(canvasId);
    res.json(data);
  } catch (err) {
    console.error("Error fetching whiteboard:", err);
    res.status(500).json({ error: "Failed to fetch whiteboard" });
  }
});

router.put("/viewport", requireCanvasAccess("edit"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;

  const { x, y, zoom } = req.body ?? {};
  if ([x, y, zoom].some((v) => typeof v !== "number" || Number.isNaN(v))) {
    return res.status(400).json({ error: "Viewport x, y, and zoom must be numbers" });
  }

  try {
    const viewport = await upsertWhiteboardViewport(canvasId, { x, y, zoom });
    res.json({ viewport });
  } catch (err) {
    console.error("Error saving whiteboard viewport:", err);
    res.status(500).json({ error: "Failed to save whiteboard viewport" });
  }
});

router.put("/nodes", requireCanvasAccess("edit"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;

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
    const saved = await upsertWhiteboardNodePositions(canvasId, nodes);
    res.json({ nodePositions: saved });
  } catch (err) {
    console.error("Error saving whiteboard node positions:", err);
    res.status(500).json({ error: "Failed to save whiteboard node positions" });
  }
});

router.delete("/nodes/:entityType/:entityId", requireCanvasAccess("edit"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;

  const entityType = parseEntityType(req.params.entityType);
  if (!entityType) return res.status(400).json({ error: "Invalid entity type" });

  const entityId = parseRouteParam(req.params.entityId);
  if (Number.isNaN(entityId)) return res.status(400).json({ error: "Invalid entity ID" });

  try {
    await unregisterWhiteboardNode(canvasId, entityType, entityId);
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting whiteboard node position:", err);
    res.status(500).json({ error: "Failed to delete whiteboard node position" });
  }
});

export default router;
