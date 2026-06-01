import { fetchCompanyBundle } from "@/lib/psx/dataService";
import type { ResearchStateType } from "@/lib/agent/state";

const CONCURRENCY = 4;

async function mapPool<T, R>(items: T[], fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, worker));
  return results;
}

export async function gatherDataNode(
  state: ResearchStateType
): Promise<Partial<ResearchStateType>> {
  const symbols = state.candidates;
  const bundles = await mapPool(symbols, async (symbol) => {
    try {
      return await fetchCompanyBundle(symbol);
    } catch {
      return null;
    }
  });
  const valid = bundles.filter((b): b is NonNullable<typeof b> => b != null);
  const gaps =
    valid.length < symbols.length
      ? [`Failed to load ${symbols.length - valid.length} symbols.`]
      : [];
  return {
    bundles: valid,
    dataGaps: gaps,
    status: "data_gathered",
  };
}
