export type CarePrestation = {
  id: string;
  label: string;
  cents: number | null;
  builtin: boolean;
};

export const DEFAULT_CARE_PRESTATIONS: CarePrestation[] = [
  { id: "accompagnement", label: "Séance d'accompagnement", cents: null, builtin: true },
  { id: "mai", label: "MAI", cents: 7500, builtin: true },
  { id: "stress-academique", label: "Stress académique", cents: 7500, builtin: true },
  { id: "soft-skills", label: "Soft skills", cents: 25000, builtin: true },
];

export const CARE_INVOICE_EXTRAS = DEFAULT_CARE_PRESTATIONS.filter(
  (item): item is CarePrestation & { cents: number } => item.cents != null,
).map((item) => ({ slug: item.id, label: item.label, cents: item.cents }));

function slugify(label: string) {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function newPrestationId(label: string, existing: CarePrestation[]) {
  const base = slugify(label) || "prestation";
  let id = base;
  let n = 2;
  const used = new Set(existing.map((item) => item.id));
  while (used.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  return id;
}

export function parseStoredPrestations(raw: unknown): Array<{ id: string; label: string; cents: number | null }> {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const id = typeof row.id === "string" ? row.id.trim() : "";
      const label = typeof row.label === "string" ? row.label.trim() : "";
      if (!id || !label) return null;
      const cents =
        row.cents == null
          ? null
          : typeof row.cents === "number" && Number.isFinite(row.cents)
            ? Math.max(0, Math.round(row.cents))
            : null;
      return { id, label, cents };
    })
    .filter((item): item is { id: string; label: string; cents: number | null } => Boolean(item));
}

export function resolveCarePrestations(stored: unknown): CarePrestation[] {
  const extras = parseStoredPrestations(stored);
  const byId = new Map(extras.map((item) => [item.id, item]));
  const builtins = DEFAULT_CARE_PRESTATIONS.map((item) => {
    const override = byId.get(item.id);
    if (!override) return item;
    return {
      ...item,
      label: override.label || item.label,
      cents: override.cents,
    };
  });
  const custom = extras
    .filter((item) => !DEFAULT_CARE_PRESTATIONS.some((builtin) => builtin.id === item.id))
    .map((item) => ({ ...item, builtin: false }));
  return [...builtins, ...custom];
}

export function serializeCarePrestations(list: CarePrestation[]) {
  return list.map((item) => ({ id: item.id, label: item.label, cents: item.cents }));
}

export function prestationPriceLabel(cents: number | null) {
  if (cents == null) return "Prix libre";
  return `${(cents / 100).toLocaleString("fr-FR")} €`;
}
