import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { ErrorKeys } from "../errors/errorKeys";
import { sendAppError, sendError } from "../errors/sendError";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (res.headersSent) {
    return;
  }

  if (err instanceof AppError) {
    sendAppError(res, err);
    return;
  }

  console.error("Unhandled error:", err);
  sendError(res, ErrorKeys.common.internal, 500);
}
