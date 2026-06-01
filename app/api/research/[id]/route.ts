import { NextResponse } from "next/server";
import { getResearchRun } from "@/lib/db/repositories/researchRuns";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const run = await getResearchRun(id);
  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }
  return NextResponse.json({
    id: run.id,
    status: run.status,
    inputProfile: run.input_profile,
    report: run.report,
    threadId: run.thread_id,
    createdAt: run.created_at,
    updatedAt: run.updated_at,
  });
}
