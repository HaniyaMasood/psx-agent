import {
  InvestmentProfileSchema,
  RawIntakeSchema,
  type InvestmentProfile,
} from "@/lib/schemas/profile";

export type ParsedIntake = {
  intake: Record<string, unknown>;
  profile: InvestmentProfile;
};

function sectorsFromPreferences(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseIntakeFromFormData(formData: FormData): ParsedIntake {
  const capitalRaw = formData.get("capitalPkr");
  const capitalPkr =
    capitalRaw != null && String(capitalRaw).trim() !== ""
      ? Number(capitalRaw)
      : undefined;

  const intake = RawIntakeSchema.parse({
    goal: formData.get("goal"),
    horizonYears: formData.get("horizonYears"),
    riskTolerance: formData.get("riskTolerance"),
    shariahOnly: formData.get("shariahOnly") === "on",
    sectorPreferences: formData.get("sectorPreferences") ?? "",
    capitalPkr,
    notes: formData.get("notes") || undefined,
  });

  return toParsed(intake);
}

export function parseIntakeFromJson(body: unknown): ParsedIntake {
  const intake = RawIntakeSchema.parse(body);
  return toParsed(intake);
}

function toParsed(intake: ReturnType<typeof RawIntakeSchema.parse>): ParsedIntake {
  const profile = InvestmentProfileSchema.parse({
    goal: intake.goal,
    horizonYears: intake.horizonYears,
    riskTolerance: intake.riskTolerance.toLowerCase(),
    shariahOnly: intake.shariahOnly ?? false,
    sectorPreferences: sectorsFromPreferences(intake.sectorPreferences),
    capitalPkr: intake.capitalPkr,
    notes: intake.notes,
  });

  return {
    intake: intake as unknown as Record<string, unknown>,
    profile,
  };
}
