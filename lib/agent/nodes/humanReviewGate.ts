import { interrupt } from "@langchain/langgraph";
import type { ResearchStateType } from "@/lib/agent/state";

export async function humanReviewGateNode(
  state: ResearchStateType
): Promise<Partial<ResearchStateType>> {
  const payload = interrupt({
    type: "human_review",
    message:
      "Review the research report, acknowledge the disclaimer, and confirm human approval before treating results as actionable.",
    disclaimer: state.report?.disclaimer,
    runId: state.runId,
    topCompanies: state.report?.companies.slice(0, 5).map((c) => ({
      symbol: c.symbol,
      score: c.overallScore,
      fits: c.fitsCriteria,
    })),
  });

  const approved =
    typeof payload === "object" &&
    payload !== null &&
    "approved" in payload &&
    Boolean((payload as { approved: boolean }).approved);

  return {
    reviewApproved: approved,
    status: approved ? "human_reviewed" : "review_rejected",
  };
}
