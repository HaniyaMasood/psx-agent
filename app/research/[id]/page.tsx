import Link from "next/link";
import { notFound } from "next/navigation";
import { ResearchPending } from "@/components/ResearchPending";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import { getResearchRun } from "@/lib/db/repositories/researchRuns";
import type { ResearchReport } from "@/lib/schemas/report";

export default async function ResearchResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const run = await getResearchRun(id);
  if (!run) {
    notFound();
  }

  const isRunning = run.status === "running" || !run.report;

  return (
    <main className="mx-auto max-w-4xl flex-1 px-4 py-10">
      <Link href="/" className="text-sm text-emerald-400 hover:underline">
        ← New research
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-white">
        {isRunning ? "Research in progress" : "Research results"}
      </h1>
      <p className="text-sm text-zinc-500">Run {id}</p>
      {isRunning ? (
        <ResearchPending runId={id} />
      ) : (
        <div className="mt-8">
          <ResultsDashboard
            runId={id}
            report={run.report as ResearchReport}
            status={run.status}
            threadId={run.thread_id}
          />
        </div>
      )}
    </main>
  );
}
