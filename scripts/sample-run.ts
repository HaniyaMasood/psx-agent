/**
 * Offline-friendly sample: runs scoring pipeline without LLM narratives.
 * Usage: npx tsx scripts/sample-run.ts
 */
import "dotenv/config";
import { resolveUniverse, fetchCompanyBundle, getSectorStats } from "../lib/psx/dataService";
import { computeSectorMedianPe, rankScores, scoreCompany } from "../lib/agent/scoring";
import { enforceReportGuardrails } from "../lib/agent/guardrails";
import type { InvestmentProfile } from "../lib/schemas/profile";

const profile: InvestmentProfile = {
  goal: "Long-term retirement wealth",
  horizonYears: 12,
  riskTolerance: "moderate",
  shariahOnly: true,
  sectorPreferences: ["FERTILIZER"],
  capitalPkr: 5_000_000,
};

async function main() {
  console.log("Resolving universe…");
  const symbols = await resolveUniverse({
    shariahOnly: profile.shariahOnly,
    sectorPreferences: profile.sectorPreferences,
    maxCandidates: 8,
  });
  console.log("Candidates:", symbols);

  const bundles = [];
  for (const sym of symbols.slice(0, 5)) {
    try {
      bundles.push(await fetchCompanyBundle(sym));
    } catch (e) {
      console.warn("Skip", sym, e);
    }
  }

  let sectorStats = null;
  try {
    sectorStats = await getSectorStats();
  } catch {
    /* optional */
  }

  const medianPe = computeSectorMedianPe(bundles);
  const scored = bundles.map((b) =>
    scoreCompany(b, profile, sectorStats, medianPe)
  );
  const ranked = rankScores(
    scored.map((s, i) => ({ ...s, rank: i + 1 }))
  );

  const report = enforceReportGuardrails({
    profileSummary: `Sample run: ${profile.goal}`,
    generatedAt: new Date().toISOString(),
    disclaimer: "",
    humanReviewRequired: true,
    globalAssumptions: ["Sample script — no LLM narratives."],
    globalRisks: ["Not for trading decisions."],
    globalDataGaps: [],
    freshnessSummary: "See per-symbol freshness in bundles.",
    companies: ranked,
  });

  console.log("\nTop 3:\n");
  for (const c of report.companies.slice(0, 3)) {
    console.log(
      `#${c.rank} ${c.symbol} score=${c.overallScore} fit=${c.fitsCriteria}`
    );
    console.log("  factors:", c.factorScores);
  }
}

main().catch(console.error);
