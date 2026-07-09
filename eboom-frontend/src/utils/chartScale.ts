/**
 * Log-like chart scaling so small and large multi-currency amounts stay visible
 * while preserving continuous lines (including zeros).
 *
 * Uses log10(value + 1) so zero plots as 0 and magnitudes compress hard.
 */

export type ChartScaleMode = "linear" | "loglike";

export function toLogLikeValue(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.log10(value + 1);
}

export function fromLogLikeValue(transformed: number): number {
  if (!Number.isFinite(transformed) || transformed <= 0) return 0;
  return Math.pow(10, transformed) - 1;
}

export function transformSeriesForScaleMode<T extends Record<string, string | number>>(
  data: T[],
  seriesKeys: string[],
  mode: ChartScaleMode
): T[] {
  if (mode === "linear") return data;

  return data.map((point) => {
    const next = { ...point };
    for (const key of seriesKeys) {
      const raw = Number(point[key]) || 0;
      (next as Record<string, unknown>)[key] = toLogLikeValue(raw);
    }
    return next;
  });
}

export function formatChartScaleTick(
  tickValue: number,
  mode: ChartScaleMode
): string {
  const raw = mode === "loglike" ? fromLogLikeValue(tickValue) : tickValue;
  if (!Number.isFinite(raw) || raw <= 0) return "0";

  if (raw >= 1_000_000) {
    const millions = raw / 1_000_000;
    return millions >= 10 ? `${Math.round(millions)}M` : `${millions.toFixed(1)}M`;
  }

  if (raw >= 1_000) {
    const thousands = raw / 1_000;
    return thousands >= 10 ? `${Math.round(thousands)}k` : `${thousands.toFixed(1)}k`;
  }

  if (raw >= 1) {
    return raw >= 100 ? String(Math.round(raw)) : raw.toFixed(raw >= 10 ? 0 : 1);
  }

  return raw.toFixed(2);
}

export function getRawSeriesValue(
  point: Record<string, string | number> | undefined,
  key: string
): number {
  if (!point) return 0;
  return Number(point[key]) || 0;
}
