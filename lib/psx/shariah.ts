import type { Fundamentals } from "./schemas";

export const KMI_SCREENING_RULES = [
  "Core business must be halal (no alcohol, gambling, conventional banking, pork, weapons, etc.)",
  "Interest-bearing debt must be less than 37% of total assets",
  "Illiquid assets must be at least 25% of total assets",
  "Non-compliant investments must be less than 33% of total assets",
  "Non-compliant income must be less than 5% of total revenue",
  "Market price per share must exceed net liquid assets per share",
] as const;

export function isShariahCompliant(f: Fundamentals): boolean {
  if (f.isNonCompliant === true) return false;
  const indices = (f.listedIn ?? "").toUpperCase();
  if (indices.includes("KMI30") || indices.includes("KMIALLSHR")) return true;
  return f.isNonCompliant === false;
}

export function shariahExplanation(f: Fundamentals): string[] {
  const lines: string[] = [];
  if (f.isNonCompliant) {
    lines.push("Flagged as non-compliant (isNonCompliant=true) on PSX data feed.");
  } else if ((f.listedIn ?? "").includes("KMI")) {
    lines.push(`Listed in Shariah index basket: ${f.listedIn}.`);
  } else {
    lines.push("No KMI index membership found; Shariah status uncertain — verify against Al Meezan screening PDF.");
  }
  lines.push(`Screening reference: ${KMI_SCREENING_RULES.join("; ")}`);
  return lines;
}
