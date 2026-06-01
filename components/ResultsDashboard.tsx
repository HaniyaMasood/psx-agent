"use client";

import { useState } from "react";
import type { ResearchReport, CompanyScore } from "@/lib/schemas/report";
import { DisclaimerBanner } from "./DisclaimerBanner";

const FACTOR_LABELS: Record<string, string> = {
  fundamentals: "Fundamentals",
  progression: "Multi-year progression",
  valuation: "Valuation",
  dividends: "Dividends",
  liquidity: "Liquidity",
  sectorOutlook: "Sector outlook",
  news: "News / announcements",
  shariah: "Shariah",
};

function CompanyCard({ company }: { company: CompanyScore }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-white">
            #{company.rank} {company.symbol}
          </h3>
          <p className="text-sm text-zinc-400">
            Overall score:{" "}
            <span className="font-mono text-emerald-400">{company.overallScore}</span>
            {" · "}
            {company.fitsCriteria ? (
              <span className="text-emerald-400">Potential fit</span>
            ) : (
              <span className="text-amber-400">Gaps vs criteria</span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-xs text-zinc-400 underline"
        >
          {open ? "Hide" : "Details"}
        </button>
      </div>
      {company.narrative && (
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">{company.narrative}</p>
      )}
      {open && (
        <div className="mt-4 space-y-3 text-sm">
          <div>
            <p className="font-medium text-zinc-200">Factor scores</p>
            <ul className="mt-1 grid gap-1 sm:grid-cols-2">
              {Object.entries(company.factorScores).map(([k, v]) => (
                <li key={k} className="flex justify-between text-zinc-400">
                  <span>{FACTOR_LABELS[k] ?? k}</span>
                  <span className="font-mono text-zinc-200">{v}</span>
                </li>
              ))}
            </ul>
          </div>
          {company.fitReasons.length > 0 && (
            <div>
              <p className="font-medium text-emerald-300">Why it may fit</p>
              <ul className="list-disc pl-5 text-zinc-400">
                {company.fitReasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}
          {company.noFitReasons.length > 0 && (
            <div>
              <p className="font-medium text-amber-300">Why it may not fit</p>
              <ul className="list-disc pl-5 text-zinc-400">
                {company.noFitReasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}
          {company.dataGaps.length > 0 && (
            <div>
              <p className="font-medium text-zinc-300">Data gaps</p>
              <ul className="list-disc pl-5 text-zinc-500">
                {company.dataGaps.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export function ResultsDashboard({
  runId,
  report,
  status,
  threadId,
}: {
  runId: string;
  report: ResearchReport;
  status: string;
  threadId?: string | null;
}) {
  const [approving, setApproving] = useState(false);
  const [reviewStatus, setReviewStatus] = useState(status);
  const [note, setNote] = useState("");

  async function submitReview(approved: boolean) {
    setApproving(true);
    try {
      const res = await fetch(`/api/research/${runId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Review failed");
      setReviewStatus(data.status);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Review failed");
    } finally {
      setApproving(false);
    }
  }

  return (
    <div className="space-y-6">
      <DisclaimerBanner />
      <section className="rounded-xl border border-zinc-200 bg-white p-4 text-black">
        <h2 className="text-lg font-semibold text-black">Research summary</h2>
        <p className="mt-2 text-sm text-black">{report.profileSummary}</p>
        <p className="mt-2 text-xs text-zinc-600">
          Generated {new Date(report.generatedAt).toLocaleString()} · {report.freshnessSummary}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase text-zinc-600">Assumptions</p>
            <ul className="mt-1 list-disc pl-4 text-sm text-black">
              {report.globalAssumptions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-zinc-600">Risks</p>
            <ul className="mt-1 list-disc pl-4 text-sm text-black">
              {report.globalRisks.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-zinc-600">Data gaps</p>
            <ul className="mt-1 list-disc pl-4 text-sm text-black">
              {report.globalDataGaps.length
                ? report.globalDataGaps.map((g) => <li key={g}>{g}</li>)
                : <li>None flagged</li>}
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Ranked companies</h2>
        {report.companies.map((c) => (
          <CompanyCard key={c.symbol} company={c} />
        ))}
      </section>

      {reviewStatus !== "reviewed" && (
        <section className="rounded-xl border border-zinc-700 bg-zinc-900 p-4">
          <h2 className="font-semibold text-white">Human review required</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Acknowledge the disclaimer and confirm that a qualified person has reviewed this
            research before using it in any investment decision.
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reviewer notes (optional)"
            className="mt-3 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            rows={2}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={approving}
              onClick={() => submitReview(true)}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              I acknowledge — human reviewed
            </button>
            <button
              type="button"
              disabled={approving}
              onClick={() => submitReview(false)}
              className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
            >
              Reject / needs more work
            </button>
          </div>
          {threadId && (
            <p className="mt-2 text-xs text-zinc-600">Thread: {threadId}</p>
          )}
        </section>
      )}
      {reviewStatus === "reviewed" && (
        <p className="rounded-lg bg-emerald-900/30 px-4 py-3 text-sm text-emerald-300">
          Human review recorded. This remains research output, not investment advice.
        </p>
      )}
    </div>
  );
}
