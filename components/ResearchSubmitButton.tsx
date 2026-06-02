"use client";

import { useFormStatus } from "react-dom";

export function ResearchSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
    >
      {pending ? "Starting research…" : "Start PSX research"}
    </button>
  );
}
