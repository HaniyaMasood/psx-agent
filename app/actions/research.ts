"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { createResearchRun } from "@/lib/db/repositories/researchRuns";
import { executeResearchRun } from "@/lib/research/executeRun";
import { parseIntakeFromFormData } from "@/lib/research/parseIntake";

export async function startResearch(formData: FormData) {
  try {
    const { intake, profile } = parseIntakeFromFormData(formData);
    const threadId = crypto.randomUUID();
    const runId = await createResearchRun(profile, threadId);

    after(async () => {
      await executeResearchRun(runId, threadId, intake);
    });

    redirect(`/research/${runId}`);
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    const message =
      err instanceof Error ? err.message : "Failed to start research";
    redirect(`/?error=${encodeURIComponent(message)}`);
  }
}

function isNextRedirect(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    String((err as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
  );
}
