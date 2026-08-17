export interface RatePair {
  fromCurrencyId: number;
  toCurrencyId: number;
  rate: string | number;
}

// Adjacency map: fromCurrencyId -> toCurrencyId -> rate (1 fromCurrency = rate toCurrency).
// Each stored pair is indexed both ways (inverse = 1 / rate) so a rate defined
// in either direction can be used to convert.
export type RateGraph = Map<number, Map<number, number>>;

export function buildRateGraph(pairs: RatePair[]): RateGraph {
  const graph: RateGraph = new Map();

  const addEdge = (from: number, to: number, rate: number) => {
    if (!graph.has(from)) graph.set(from, new Map());
    graph.get(from)!.set(to, rate);
  };

  for (const pair of pairs) {
    const rate = Number(pair.rate);
    if (!Number.isFinite(rate) || rate <= 0) continue;
    addEdge(pair.fromCurrencyId, pair.toCurrencyId, rate);
    addEdge(pair.toCurrencyId, pair.fromCurrencyId, 1 / rate);
  }

  return graph;
}

// Converts an amount between currencies using a direct rate if available,
// otherwise a single intermediate hop (e.g. A->USD->B). Returns null if no
// conversion path exists.
export function convertAmount(
  graph: RateGraph,
  amount: number,
  fromCurrencyId: number,
  toCurrencyId: number
): number | null {
  if (fromCurrencyId === toCurrencyId) return amount;

  const direct = graph.get(fromCurrencyId)?.get(toCurrencyId);
  if (direct !== undefined) return amount * direct;

  const fromEdges = graph.get(fromCurrencyId);
  if (!fromEdges) return null;

  for (const [intermediateId, rateToIntermediate] of fromEdges) {
    const rateIntermediateToTarget = graph.get(intermediateId)?.get(toCurrencyId);
    if (rateIntermediateToTarget !== undefined) {
      return amount * rateToIntermediate * rateIntermediateToTarget;
    }
  }

  return null;
}
