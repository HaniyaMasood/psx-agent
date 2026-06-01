import { DISCLAIMER_TEXT } from "@/lib/schemas/report";

export function DisclaimerBanner() {
  return (
    <p
      role="note"
      className="rounded-lg border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-sm leading-relaxed text-zinc-200"
    >
      {DISCLAIMER_TEXT}
    </p>
  );
}
