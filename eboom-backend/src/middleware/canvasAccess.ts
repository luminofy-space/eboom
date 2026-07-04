import { Request, Response, NextFunction } from "express";
import {
  CanvasPermission,
  getCanvasMembership,
  membershipHasPermission,
} from "../services/canvasAccessService";
import { parseRouteParam } from "../routes/routeParams";

export function requireCanvasAccess(permission: CanvasPermission) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.appUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const canvasId = parseRouteParam(req.params.canvasId);
    if (Number.isNaN(canvasId)) {
      return res.status(400).json({ error: "Invalid canvas ID" });
    }

    const membership = await getCanvasMembership(canvasId, req.appUser.id);
    if (!membership) {
      return res.status(403).json({ error: "Access denied to this canvas" });
    }
    if (!membershipHasPermission(membership, permission)) {
      return res.status(403).json({ error: "Insufficient permissions for this action" });
    }

    req.canvasId = canvasId;
    req.canvasMembership = membership;
    next();
  };
}
