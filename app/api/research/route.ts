import { NextResponse } from "next/server";
import { after } from "next/server";
import { createResearchRun } from "@/lib/db/repositories/researchRuns";
import { executeResearchRun } from "@/lib/research/executeRun";
import { parseIntakeFromJson } from "@/lib/research/parseIntake";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { intake, profile } = parseIntakeFromJson(body);
    const threadId = crypto.randomUUID();
    const runId = await createResearchRun(profile, threadId);

    after(async () => {
      await executeResearchRun(runId, threadId, intake);
    });

    return NextResponse.json({
      runId,
      threadId,
      status: "running",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Research run failed" },
      { status: 500 }
    );
  }
}
