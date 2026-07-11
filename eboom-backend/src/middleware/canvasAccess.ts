import { Request, Response, NextFunction } from "express";
import {
  CanvasPermission,
  getCanvasMembership,
  membershipHasPermission,
} from "../services/canvasAccessService";
import { parseRouteParam } from "../routes/routeParams";
import { ErrorKeys } from "../errors/errorKeys";
import { sendError } from "../errors/sendError";

export function requireCanvasAccess(permission: CanvasPermission) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.appUser) {
      return sendError(res, ErrorKeys.common.unauthorized, 401);
    }

    const canvasId = parseRouteParam(req.params.canvasId);
    if (Number.isNaN(canvasId)) {
      return sendError(res, ErrorKeys.common.invalidId, 400);
    }

    const membership = await getCanvasMembership(canvasId, req.appUser.id);
    if (!membership) {
      return sendError(res, ErrorKeys.canvas.accessDenied, 403);
    }
    if (!membershipHasPermission(membership, permission)) {
      return sendError(res, ErrorKeys.member.insufficientPermissions, 403);
    }

    req.canvasId = canvasId;
    req.canvasMembership = membership;
    next();
  };
}
