import type { ErrorKey } from "./errorKeys";

export class AppError extends Error {
  readonly status: number;
  readonly errorKey: ErrorKey;
  readonly params?: Record<string, string | number>;
  readonly fieldErrors?: Record<string, ErrorKey>;

  constructor(
    errorKey: ErrorKey,
    status = 400,
    options?: {
      params?: Record<string, string | number>;
      fieldErrors?: Record<string, ErrorKey>;
      cause?: unknown;
    }
  ) {
    super(errorKey);
    this.name = "AppError";
    this.status = status;
    this.errorKey = errorKey;
    this.params = options?.params;
    this.fieldErrors = options?.fieldErrors;
    if (options?.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = options.cause;
    }
  }
}
