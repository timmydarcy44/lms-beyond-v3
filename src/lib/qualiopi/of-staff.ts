/** Utilisateurs OF pouvant être responsables d’une action PAQ / veille. */

export const OF_STAFF_OWNERS = [
  { id: "timmy", label: "Timmy Darcy", email: "timmydarcy44@gmail.com" },
  { id: "jessica", label: "Jessica Contentin", email: "contentin.cabinet@gmail.com" },
  { id: "jerome", label: "Jérôme Picot", email: "jerome.picot@byound.fr" },
] as const;

export type OfStaffOwnerLabel = (typeof OF_STAFF_OWNERS)[number]["label"];

export function isOfStaffOwnerLabel(value: string | null | undefined): value is OfStaffOwnerLabel {
  const v = String(value ?? "").trim();
  if (!v || v.toLowerCase() === "null") return false;
  return OF_STAFF_OWNERS.some((o) => o.label === v);
}

export function normalizeOwnerLabel(value: string | null | undefined): string | null {
  const v = String(value ?? "").trim();
  if (!v || v.toLowerCase() === "null") return null;
  const exact = OF_STAFF_OWNERS.find((o) => o.label === v);
  if (exact) return exact.label;
  const lower = v.toLowerCase();
  const fuzzy = OF_STAFF_OWNERS.find(
    (o) =>
      o.label.toLowerCase() === lower ||
      o.label.toLowerCase().startsWith(lower) ||
      lower.startsWith(o.label.toLowerCase().split(" ")[0] ?? ""),
  );
  return fuzzy?.label ?? null;
}
