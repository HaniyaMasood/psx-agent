import type { ResearchStateType } from "@/lib/agent/state";

export async function validateFreshnessNode(
  state: ResearchStateType
): Promise<Partial<ResearchStateType>> {
  const issues: string[] = [];
  for (const b of state.bundles) {
    for (const [key, label] of Object.entries(b.freshness)) {
      if (label.includes("stale")) {
        issues.push(`${b.symbol}: ${key} data is stale (${label})`);
      }
    }
    if (!b.fundamentals.timestamp) {
      issues.push(`${b.symbol}: fundamentals timestamp missing`);
    }
  }
  return {
    freshnessIssues: issues,
    status: "freshness_validated",
  };
}
