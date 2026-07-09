import type { Response } from "express";
import { AppError } from "./AppError";
import { ErrorKeys, type ErrorKey } from "./errorKeys";

export interface ApiErrorBody {
  errorKey: ErrorKey;
  params?: Record<string, string | number>;
  errors?: Record<string, ErrorKey>;
}

export function sendError(
  res: Response,
  errorKey: ErrorKey,
  status: number,
  params?: Record<string, string | number>
): Response {
  const body: ApiErrorBody = { errorKey };
  if (params && Object.keys(params).length > 0) {
    body.params = params;
  }
  return res.status(status).json(body);
}

export function sendFieldErrors(
  res: Response,
  fieldErrors: Record<string, ErrorKey>,
  status = 400,
  errorKey: ErrorKey = ErrorKeys.validation.failed
): Response {
  return res.status(status).json({
    errorKey,
    errors: fieldErrors,
  } satisfies ApiErrorBody);
}

export function sendAppError(res: Response, err: AppError): Response {
  const body: ApiErrorBody = { errorKey: err.errorKey };
  if (err.params) body.params = err.params;
  if (err.fieldErrors) body.errors = err.fieldErrors;
  return res.status(err.status).json(body);
}
