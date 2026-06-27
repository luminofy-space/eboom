const GOLDEN_RATIO_CONJUGATE = 0.618033988749895;

function hashCurrencyCode(code: string): number {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = (hash * 31 + code.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Distinct OKLCH color per currency — hue spaced by index, lightness/chroma varied by code hash. */
export function getCurrencyBaseColor(
  currencyCode: string,
  index: number,
  total: number
): string {
  const hash = hashCurrencyCode(currencyCode);
  const hueStep = 360 / Math.max(total, 1);
  const hue = (index * hueStep + (hash % 17) * GOLDEN_RATIO_CONJUGATE * 12) % 360;
  const lightness = 0.54 + (index % 4) * 0.04 + (hash % 3) * 0.015;
  const chroma = 0.12 + ((index + hash) % 4) * 0.035;

  return `oklch(${lightness.toFixed(3)} ${chroma.toFixed(3)} ${hue.toFixed(1)})`;
}

export function getCurrencyColorMap(
  currencyCodes: string[]
): Record<string, string> {
  const total = currencyCodes.length;
  return Object.fromEntries(
    currencyCodes.map((code, index) => [
      code,
      getCurrencyBaseColor(code, index, total),
    ])
  );
}

export function getReceivedSeriesKey(currencyCode: string): string {
  return `${currencyCode}_received`;
}

export function getPaidSeriesKey(currencyCode: string): string {
  return `${currencyCode}_paid`;
}

export function isPaidSeriesKey(seriesKey: string): boolean {
  return seriesKey.endsWith("_paid");
}

export function getCurrencyFromSeriesKey(seriesKey: string): string {
  if (seriesKey.endsWith("_received")) {
    return seriesKey.slice(0, -"_received".length);
  }
  if (seriesKey.endsWith("_paid")) {
    return seriesKey.slice(0, -"_paid".length);
  }
  return seriesKey;
}

export function assignCurrencyChartColors(
  currencyCodes: string[]
): Record<string, string> {
  const colorMap: Record<string, string> = {};
  const total = currencyCodes.length;

  currencyCodes.forEach((code, index) => {
    const baseColor = getCurrencyBaseColor(code, index, total);
    colorMap[getReceivedSeriesKey(code)] = baseColor;
    colorMap[getPaidSeriesKey(code)] = baseColor;
  });

  return colorMap;
}

export function buildMultiCurrencySeriesKeys(currencyCodes: string[]): string[] {
  return currencyCodes.flatMap((code) => [
    getReceivedSeriesKey(code),
    getPaidSeriesKey(code),
  ]);
}
