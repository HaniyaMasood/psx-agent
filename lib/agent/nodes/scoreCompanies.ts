import { getSectorStats } from "@/lib/psx/dataService";
import {
  computeSectorMedianPe,
  rankScores,
  scoreCompany,
} from "@/lib/agent/scoring";
import type { ResearchStateType } from "@/lib/agent/state";

export async function scoreCompaniesNode(
  state: ResearchStateType
): Promise<Partial<ResearchStateType>> {
  if (!state.profile) throw new Error("Profile required for scoring");
  let sectorStats: Record<string, { avgChangePercent?: number; gainers?: number; losers?: number }> | null =
    null;
  try {
    sectorStats = await getSectorStats();
  } catch {
    // optional
  }
  const medianPe = computeSectorMedianPe(state.bundles);
  const scored = state.bundles.map((b) =>
    scoreCompany(b, state.profile!, sectorStats, medianPe)
  );
  const ranked = rankScores(
    scored.map((s, i) => ({
      ...s,
      rank: i + 1,
      narrative: undefined,
    }))
  );
  return { scoredCompanies: ranked, status: "scored" };
}
