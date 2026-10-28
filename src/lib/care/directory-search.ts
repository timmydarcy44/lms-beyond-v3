import { CARE_DOMAINS, isCareDomain, type CareDomain } from "@/lib/care/domains";
import type { CareDirectoryRow } from "@/lib/care/types";

export type CareDirectoryFormat = "cabinet" | "visio";

export type CareDirectoryQuery = {
  q: string;
  domaine: CareDomain | null;
  format: CareDirectoryFormat | null;
};

export const CARE_QUICK_SEARCHES = [
  "Parentalité",
  "Petite enfance",
  "Couple",
  "Orientation",
  "Préparation mentale",
] as const;

export function foldCareText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/’/g, "'")
    .replace(/[–—]/g, "-")
    .trim();
}

export function parseCareDirectoryQuery(input: {
  q?: string | string[];
  domaine?: string | string[];
  format?: string | string[];
}): CareDirectoryQuery {
  const one = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
  const domaineRaw = one(input.domaine);
  const formatRaw = one(input.format);
  return {
    q: one(input.q),
    domaine: isCareDomain(domaineRaw) ? domaineRaw : null,
    format: formatRaw === "cabinet" || formatRaw === "visio" ? formatRaw : null,
  };
}

export function careDirectoryHref(query: Partial<CareDirectoryQuery>) {
  const params = new URLSearchParams();
  if (query.q?.trim()) params.set("q", query.q.trim());
  if (query.domaine) params.set("domaine", query.domaine);
  if (query.format) params.set("format", query.format);
  const suffix = params.toString();
  return suffix ? `/care/praticiens?${suffix}` : "/care/praticiens";
}

function haystack(row: CareDirectoryRow) {
  const domainText = (row.domains ?? []).flatMap((id) => {
    const item = CARE_DOMAINS.find((domain) => domain.id === id);
    return item ? [item.label, item.program, item.id] : [id];
  });
  return foldCareText(
    [
      row.display_name,
      row.title,
      row.tagline,
      row.headline,
      row.city ?? "",
      ...(row.publics ?? []),
      ...domainText,
    ].join(" "),
  );
}

const QUERY_ALIASES: Record<string, string[]> = {
  parentalite: ["famille", "parents", "family"],
  "petite enfance": ["0-3", "0–3", "0-6", "famille", "family"],
  couple: ["couple", "duo"],
  orientation: ["carriere", "shift", "orientation"],
  "preparation mentale": ["performance", "peak"],
};

export function matchesCareDirectory(row: CareDirectoryRow, query: CareDirectoryQuery) {
  if (query.domaine && !(row.domains ?? []).includes(query.domaine)) return false;
  if (query.format === "cabinet" && !row.offers_cabinet) return false;
  if (query.format === "visio" && !row.offers_visio) return false;
  const q = foldCareText(query.q);
  if (!q) return true;
  const hay = haystack(row);
  if (hay.includes(q)) return true;
  const aliases = QUERY_ALIASES[q] ?? [];
  return aliases.some((alias) => hay.includes(foldCareText(alias)));
}

export function compareCareDirectory(
  a: CareDirectoryRow,
  b: CareDirectoryRow,
  nextSlot: Record<string, string | null>,
) {
  const badge = (b.badge_count ?? 0) - (a.badge_count ?? 0);
  if (badge) return badge;
  const slotA = nextSlot[a.expert_id];
  const slotB = nextSlot[b.expert_id];
  if (slotA && slotB) return slotA.localeCompare(slotB);
  if (slotA) return -1;
  if (slotB) return 1;
  return a.display_name.localeCompare(b.display_name, "fr");
}

export function careWhereLabel(row: CareDirectoryRow) {
  if (row.offers_cabinet && row.offers_visio) {
    return row.city ? `${row.city} · visio` : "Cabinet · visio";
  }
  if (row.offers_visio && !row.offers_cabinet) return "Visio uniquement";
  return row.city?.trim() || "Cabinet";
}

export function formatCareSlotLabel(iso: string | null) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const label = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return label.replace(" à ", " · ");
}

export function carePractitionersCountLabel(count: number) {
  if (count <= 1) return `${count} praticien disponible`;
  return `${count} praticiens disponibles`;
}

export function careAvatarTone(id: string) {
  const tones = ["#0B1533", "#CE0058", "#3B4FB8", "#8A003B"];
  let hash = 0;
  for (const char of id) hash = (hash + char.charCodeAt(0)) % tones.length;
  return tones[hash] ?? tones[0];
}
