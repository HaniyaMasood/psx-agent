import { runResearchWorkflow } from "@/lib/agent/graph";
import { updateResearchRun } from "@/lib/db/repositories/researchRuns";

export async function executeResearchRun(
  runId: string,
  threadId: string,
  intake: Record<string, unknown>
): Promise<void> {
  try {
    const result = await runResearchWorkflow(intake, { threadId, runId });

    await updateResearchRun(runId, {
      status: result.status ?? "awaiting_human_review",
      report: result.report ?? null,
      state_snapshot: {
        candidates: result.candidates,
        freshnessIssues: result.freshnessIssues,
        dataGaps: result.dataGaps,
      },
    });
  } catch (err) {
    console.error(`Research run ${runId} failed:`, err);
    await updateResearchRun(runId, {
      status: "failed",
      state_snapshot: {
        error: err instanceof Error ? err.message : "Research run failed",
      },
    });
  }
}
