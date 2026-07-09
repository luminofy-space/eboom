export type VolumeInput = {
  id: number;
  quantity: string | number;
  unitPrice: string | number;
  recordedAt: Date | string;
};

export type PricePointInput = {
  id: number;
  unitPrice: string | number;
  recordedAt: Date | string;
};

export type CostBasisState = {
  quantity: number;
  costBasis: number;
};

export type ValuationPoint = {
  recordedAt: string;
  unitPrice: number;
  quantity: number;
  costBasis: number;
  holdingValue: number;
  unrealizedPnL: number;
};

export type AssetDerivedValuation = {
  currentQuantity: number;
  costBasis: number;
  currentHoldingValue: number;
  unrealizedPnL: number;
};

function toNumber(value: string | number): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toTime(value: Date | string): number {
  const t = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function toIso(value: Date | string): string {
  if (value instanceof Date) return value.toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date(0).toISOString() : d.toISOString();
}

export function sortVolumes(volumes: VolumeInput[]): VolumeInput[] {
  return [...volumes].sort((a, b) => {
    const byDate = toTime(a.recordedAt) - toTime(b.recordedAt);
    if (byDate !== 0) return byDate;
    return a.id - b.id;
  });
}

export function sortPricePoints(points: PricePointInput[]): PricePointInput[] {
  return [...points].sort((a, b) => {
    const byDate = toTime(a.recordedAt) - toTime(b.recordedAt);
    if (byDate !== 0) return byDate;
    return a.id - b.id;
  });
}

/**
 * Apply average-cost buy/sell. Throws if a sell would drive quantity below zero.
 */
export function applyVolume(
  state: CostBasisState,
  quantity: number,
  unitPrice: number
): CostBasisState {
  if (quantity === 0) {
    throw new Error("QUANTITY_ZERO");
  }
  if (unitPrice < 0) {
    throw new Error("UNIT_PRICE_NEGATIVE");
  }

  if (quantity > 0) {
    return {
      quantity: state.quantity + quantity,
      costBasis: state.costBasis + quantity * unitPrice,
    };
  }

  const sold = -quantity;
  if (sold > state.quantity + 1e-12) {
    throw new Error("INSUFFICIENT_QUANTITY");
  }
  if (state.quantity <= 0) {
    throw new Error("INSUFFICIENT_QUANTITY");
  }

  const remainingQty = state.quantity - sold;
  const remainingBasis =
    remainingQty <= 1e-12 ? 0 : state.costBasis * (remainingQty / state.quantity);

  return {
    quantity: remainingQty <= 1e-12 ? 0 : remainingQty,
    costBasis: remainingBasis,
  };
}

export function computeCostBasisAt(
  volumes: VolumeInput[],
  at?: Date | string | null
): CostBasisState {
  const cutoff = at != null ? toTime(at) : Number.POSITIVE_INFINITY;
  let state: CostBasisState = { quantity: 0, costBasis: 0 };

  for (const volume of sortVolumes(volumes)) {
    if (toTime(volume.recordedAt) > cutoff) break;
    state = applyVolume(state, toNumber(volume.quantity), toNumber(volume.unitPrice));
  }

  return state;
}

/** Validate that applying volumes in order never goes negative. */
export function validateVolumeSequence(volumes: VolumeInput[]): CostBasisState {
  return computeCostBasisAt(volumes, null);
}

export function buildValuationSeries(
  volumes: VolumeInput[],
  pricePoints: PricePointInput[]
): ValuationPoint[] {
  return sortPricePoints(pricePoints).map((point) => {
    const basis = computeCostBasisAt(volumes, point.recordedAt);
    const unitPrice = toNumber(point.unitPrice);
    const holdingValue = unitPrice * basis.quantity;
    return {
      recordedAt: toIso(point.recordedAt),
      unitPrice,
      quantity: basis.quantity,
      costBasis: basis.costBasis,
      holdingValue,
      unrealizedPnL: holdingValue - basis.costBasis,
    };
  });
}

export function deriveAssetValuation(
  volumes: VolumeInput[],
  pricePoints: PricePointInput[]
): AssetDerivedValuation {
  const basis = computeCostBasisAt(volumes, null);
  const sortedPoints = sortPricePoints(pricePoints);
  const latest = sortedPoints[sortedPoints.length - 1];
  const currentHoldingValue = latest
    ? toNumber(latest.unitPrice) * basis.quantity
    : basis.costBasis;

  return {
    currentQuantity: basis.quantity,
    costBasis: basis.costBasis,
    currentHoldingValue,
    unrealizedPnL: currentHoldingValue - basis.costBasis,
  };
}

export function formatMoneyNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return value.toFixed(8).replace(/\.?0+$/, "") || "0";
}
