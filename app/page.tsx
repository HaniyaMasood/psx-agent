import Link from "next/link";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { IntakeForm } from "@/components/IntakeForm";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10">
      <header>
        <p className="text-sm font-medium text-emerald-400">PSX Research Agent</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
          Long-term investment research
        </h1>
        <p className="mt-2 text-zinc-400">
          Screen Pakistan Stock Exchange companies using fundamentals, valuation, dividends,
          liquidity, sector outlook, news, and Shariah status — with transparent scoring and
          mandatory human review.
        </p>
      </header>
      <DisclaimerBanner />
      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Your investment profile</h2>
        <IntakeForm />
      </section>
      <p className="text-center text-xs text-zinc-600">
        Data from psxterminal.com and dps.psx.com.pk · Not affiliated with PSX
      </p>
    </main>
  );
}
