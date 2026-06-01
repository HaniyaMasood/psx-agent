import { resolveUniverse } from "@/lib/psx/dataService";
import type { ResearchStateType } from "@/lib/agent/state";

export async function selectUniverseNode(
  state: ResearchStateType
): Promise<Partial<ResearchStateType>> {
  if (!state.profile) throw new Error("Profile required before universe selection");
  const max = Number(process.env.MAX_CANDIDATES ?? 25);
  const candidates = await resolveUniverse({
    shariahOnly: state.profile.shariahOnly,
    sectorPreferences: state.profile.sectorPreferences,
    maxCandidates: max,
  });
  return {
    candidates,
    status: "universe_selected",
    dataGaps:
      candidates.length < 5
        ? ["Small candidate universe — broaden sector filters or check data connectivity."]
        : [],
  };
}
