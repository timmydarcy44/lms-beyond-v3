export const BADGE_DOMAINS = [
  "Intelligence artificielle",
  "Management",
  "Commercial",
  "Sport",
  "Care",
  "Communication",
  "Industrie",
] as const;

export const ACHIEVEMENT_TYPES = [
  {
    id: "Competency",
    label: "Compétence",
    hint: "Une compétence démontrée par une épreuve.",
  },
  {
    id: "Certification",
    label: "Certification",
    hint: "Un parcours complet validé par un expert.",
  },
  {
    id: "Achievement",
    label: "Participation",
    hint: "Présence à une formation ou un événement.",
  },
] as const;

export type AchievementTypeId = (typeof ACHIEVEMENT_TYPES)[number]["id"];
export type ValidityMode = "permanent" | "12" | "24" | "custom";

export type BadgeBuilderState = {
  version: number;
  parentBadgeId: string | null;
  domain: string | null;
  achievementType: AchievementTypeId;
  validityMode: ValidityMode;
  validityMonths: number | null;
  associatedCourseId: string | null;
  skills: string[];
};

export const emptyBuilderState = (): BadgeBuilderState => ({
  version: 1,
  parentBadgeId: null,
  domain: null,
  achievementType: "Competency",
  validityMode: "permanent",
  validityMonths: null,
  associatedCourseId: null,
  skills: [],
});

export function isAchievementTypeId(value: string): value is AchievementTypeId {
  return ACHIEVEMENT_TYPES.some((item) => item.id === value);
}

export function achievementLabel(id: string | null | undefined): string {
  return ACHIEVEMENT_TYPES.find((item) => item.id === id)?.label ?? "Compétence";
}

export function expiresAfterDays(mode: ValidityMode, customMonths: number | null): number | null {
  if (mode === "12") return 365;
  if (mode === "24") return 730;
  if (mode === "custom" && customMonths && customMonths > 0) {
    return Math.round(customMonths * 30.4375);
  }
  return null;
}

export function validityFromDays(days: unknown): { mode: ValidityMode; months: number | null } {
  const value = typeof days === "number" ? days : null;
  if (value == null) return { mode: "permanent", months: null };
  if (value === 365) return { mode: "12", months: 12 };
  if (value === 730) return { mode: "24", months: 24 };
  return { mode: "custom", months: Math.max(1, Math.round(value / 30.4375)) };
}

export function validityLabel(mode: ValidityMode, months: number | null): string {
  if (mode === "12") return "12 mois";
  if (mode === "24") return "24 mois";
  if (mode === "custom" && months) return `${months} mois`;
  return "Permanent";
}

export function readBuilderState(raw: unknown, expiresDays?: unknown): BadgeBuilderState {
  const base = emptyBuilderState();
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const achievement = String(source.achievementType ?? "");
  const mode = String(source.validityMode ?? "");
  const fromDays = validityFromDays(expiresDays);
  return {
    version: typeof source.version === "number" && source.version > 0 ? source.version : 1,
    parentBadgeId: typeof source.parentBadgeId === "string" ? source.parentBadgeId : null,
    domain: typeof source.domain === "string" && source.domain.trim() ? source.domain : null,
    achievementType: isAchievementTypeId(achievement) ? achievement : "Competency",
    validityMode: mode === "12" || mode === "24" || mode === "custom" || mode === "permanent" ? mode : fromDays.mode,
    validityMonths:
      typeof source.validityMonths === "number"
        ? source.validityMonths
        : fromDays.months,
    associatedCourseId:
      typeof source.associatedCourseId === "string" && source.associatedCourseId.trim()
        ? source.associatedCourseId
        : null,
    skills: Array.isArray(source.skills) ? source.skills.map((item) => String(item)).filter(Boolean) : [],
  };
}

export async function cropSquareBadgeImage(file: File): Promise<File> {
  if (file.type === "image/svg+xml") return file;
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  if (side < 600) {
    bitmap.close();
    throw new Error("Image trop petite. Il faut au moins 600 px de côté.");
  }
  const canvas = document.createElement("canvas");
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Recadrage impossible.");
  }
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, side, side);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Recadrage impossible.");
  return new File([blob], "badge.png", { type: "image/png" });
}
