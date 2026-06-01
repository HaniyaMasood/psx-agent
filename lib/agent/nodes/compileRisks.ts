import { DISCLAIMER_TEXT } from "@/lib/schemas/report";
import { enforceReportGuardrails } from "@/lib/agent/guardrails";
import type { ResearchStateType } from "@/lib/agent/state";

export async function compileRisksNode(
  state: ResearchStateType
): Promise<Partial<ResearchStateType>> {
  const profile = state.profile!;
  const globalDataGaps = [
    ...new Set([
      ...state.dataGaps,
      ...state.freshnessIssues,
      ...state.bundles.flatMap((b) => b.dataGaps),
    ]),
  ];

  const report = enforceReportGuardrails({
    profileSummary: `Goal: ${profile.goal}. Horizon: ${profile.horizonYears}y. Risk: ${profile.riskTolerance}. Shariah-only: ${profile.shariahOnly}.`,
    generatedAt: new Date().toISOString(),
    disclaimer: DISCLAIMER_TEXT,
    humanReviewRequired: true,
    globalAssumptions: [
      "Screening uses publicly available PSX and third-party data; not a substitute for audited financial statements.",
      "Long-term horizon assumes buy-and-hold intent, not short-term trading.",
      profile.capitalPkr
        ? `Capital context: PKR ${profile.capitalPkr.toLocaleString()} (liquidity needs not modeled per symbol).`
        : "Capital amount not specified.",
    ],
    globalRisks: [
      "Pakistan macroeconomic, currency, regulatory, and geopolitical risks.",
      "Single-market concentration risk (PSX only).",
      "Data delays (PSX data may be 5+ minutes delayed on some feeds).",
      "Shariah screening based on index flags — confirm with qualified Shariah adviser if required.",
    ],
    globalDataGaps,
    freshnessSummary:
      state.freshnessIssues.length > 0
        ? `${state.freshnessIssues.length} freshness issue(s) detected.`
        : "All loaded bundles passed freshness checks or were freshly fetched.",
    companies: state.scoredCompanies,
  });

  return { report, status: "awaiting_human_review" };
}
