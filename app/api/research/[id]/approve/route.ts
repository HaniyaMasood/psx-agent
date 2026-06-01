import { NextResponse } from "next/server";
import { resumeResearchWorkflow } from "@/lib/agent/graph";
import {
  createRunReview,
  getResearchRun,
  updateResearchRun,
} from "@/lib/db/repositories/researchRuns";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const run = await getResearchRun(id);
    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }
    if (!run.thread_id) {
      return NextResponse.json({ error: "Missing thread_id for resume" }, { status: 400 });
    }

    const body = await request.json();
    const approved = Boolean(body.approved);
    const note = body.note as string | undefined;

    const result = await resumeResearchWorkflow(run.thread_id, {
      approved,
      note,
    });

    await createRunReview(id, approved, note);
    await updateResearchRun(id, {
      status: result.status ?? (approved ? "reviewed" : "review_rejected"),
      report: result.report ?? run.report,
    });

    return NextResponse.json({
      runId: id,
      status: result.status,
      reviewApproved: result.reviewApproved,
      report: result.report,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Approval failed" },
      { status: 500 }
    );
  }
}
