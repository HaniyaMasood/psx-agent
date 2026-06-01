import { NextResponse } from "next/server";
import { runResearchWorkflow } from "@/lib/agent/graph";
import {
  createResearchRun,
  updateResearchRun,
} from "@/lib/db/repositories/researchRuns";
import { InvestmentProfileSchema, RawIntakeSchema } from "@/lib/schemas/profile";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const intake = RawIntakeSchema.parse(body);
    const threadId = crypto.randomUUID();
    const sectors = (intake.sectorPreferences ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const profile = InvestmentProfileSchema.parse({
      goal: intake.goal,
      horizonYears: intake.horizonYears,
      riskTolerance: intake.riskTolerance.toLowerCase(),
      shariahOnly: intake.shariahOnly ?? false,
      sectorPreferences: sectors,
      capitalPkr: intake.capitalPkr,
      notes: intake.notes,
    });
    const runId = await createResearchRun(profile, threadId);

    const result = await runResearchWorkflow(intake as unknown as Record<string, unknown>, {
      threadId,
      runId,
    });

    await updateResearchRun(runId, {
      status: result.status ?? "awaiting_human_review",
      report: result.report ?? null,
      state_snapshot: {
        candidates: result.candidates,
        freshnessIssues: result.freshnessIssues,
        dataGaps: result.dataGaps,
      },
    });

    return NextResponse.json({
      runId,
      threadId,
      status: result.status,
      report: result.report,
      interrupted: result.status === "awaiting_human_review",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Research run failed" },
      { status: 500 }
    );
  }
}
