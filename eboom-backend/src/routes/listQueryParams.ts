import type { Request } from "express";

export function hasPaginationParams(req: Request): boolean {
  return req.query.page !== undefined || req.query.limit !== undefined;
}

export function parsePaginationParams(req: Request) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const search = (req.query.search as string) || "";
  const offset = (page - 1) * limit;
  return { page, limit, search, offset };
}

function parseOptionalInt(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = parseInt(String(value), 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parseOptionalBoolean(value: unknown): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export function parseListFilterParams(req: Request) {
  return {
    categoryId: parseOptionalInt(req.query.categoryId),
    currencyId: parseOptionalInt(req.query.currencyId),
    isRecurring: parseOptionalBoolean(req.query.isRecurring),
  };
}

export function parseListQueryParams(req: Request) {
  return {
    ...parsePaginationParams(req),
    ...parseListFilterParams(req),
  };
}
