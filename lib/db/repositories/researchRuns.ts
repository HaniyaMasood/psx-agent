import { getDb, isDbAvailable } from "@/lib/db/knex";
import type { InvestmentProfile } from "@/lib/schemas/profile";
import type { ResearchReport } from "@/lib/schemas/report";

export interface ResearchRunRow {
  id: string;
  input_profile: InvestmentProfile;
  status: string;
  state_snapshot: unknown;
  report: ResearchReport | null;
  thread_id: string | null;
  created_at: Date;
  updated_at: Date;
}

const memoryRuns = new Map<string, ResearchRunRow>();

export async function createResearchRun(
  profile: InvestmentProfile,
  threadId: string
): Promise<string> {
  const id = crypto.randomUUID();
  const row: ResearchRunRow = {
    id,
    input_profile: profile,
    status: "running",
    state_snapshot: null,
    report: null,
    thread_id: threadId,
    created_at: new Date(),
    updated_at: new Date(),
  };

  if (await isDbAvailable()) {
    const db = await getDb();
    await db("research_runs").insert({
      id,
      input_profile: profile,
      status: "running",
      thread_id: threadId,
    });
  } else {
    memoryRuns.set(id, row);
  }
  return id;
}

export async function updateResearchRun(
  id: string,
  patch: Partial<Pick<ResearchRunRow, "status" | "state_snapshot" | "report">>
): Promise<void> {
  if (await isDbAvailable()) {
    const db = await getDb();
    await db("research_runs")
      .where({ id })
      .update({ ...patch, updated_at: new Date() });
    return;
  }
  const row = memoryRuns.get(id);
  if (row) memoryRuns.set(id, { ...row, ...patch, updated_at: new Date() });
}

export async function getResearchRun(id: string): Promise<ResearchRunRow | null> {
  if (await isDbAvailable()) {
    const db = await getDb();
    const row = await db("research_runs").where({ id }).first();
    return row ?? null;
  }
  return memoryRuns.get(id) ?? null;
}

export async function createRunReview(
  runId: string,
  acknowledged: boolean,
  note?: string
): Promise<void> {
  if (await isDbAvailable()) {
    const db = await getDb();
    await db("run_reviews").insert({
      run_id: runId,
      acknowledged,
      reviewer_note: note ?? null,
      reviewed_at: new Date(),
    });
    await db("research_runs").where({ id: runId }).update({
      status: acknowledged ? "reviewed" : "pending_review",
      updated_at: new Date(),
    });
    return;
  }
  const row = memoryRuns.get(runId);
  if (row) {
    memoryRuns.set(runId, {
      ...row,
      status: acknowledged ? "reviewed" : "pending_review",
      updated_at: new Date(),
    });
  }
}
