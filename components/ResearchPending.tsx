"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function ResearchPending({ runId }: { runId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("Starting research workflow…");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      while (!cancelled) {
        try {
          const res = await fetch(`/api/research/${runId}`);
          const data = await res.json();
          if (!res.ok) {
            setError(data.error ?? "Could not load research run");
            return;
          }

          if (data.status === "failed") {
            setError(
              typeof data.stateSnapshot?.error === "string"
                ? data.stateSnapshot.error
                : "Research run failed"
            );
            return;
          }

          if (data.report) {
            router.refresh();
            return;
          }

          if (data.status === "running") {
            setMessage("Screening PSX companies — this may take a few minutes…");
          }
        } catch {
          setError("Lost connection while waiting for results. Refresh to check status.");
          return;
        }

        await new Promise((r) => setTimeout(r, 2500));
      }
    }

    void poll();
    return () => {
      cancelled = true;
    };
  }, [runId, router]);

  return (
    <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-950/80 p-8 text-center">
      {error ? (
        <>
          <p className="text-sm font-medium text-red-400">{error}</p>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="mt-4 text-sm text-emerald-400 hover:underline"
          >
            Retry
          </button>
        </>
      ) : (
        <>
          <div
            className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"
            aria-hidden
          />
          <p className="text-sm text-zinc-300">{message}</p>
          <p className="mt-2 text-xs text-zinc-500">Run {runId}</p>
        </>
      )}
    </div>
  );
}
