import { CARE_DOMAINS, isCareDomain, type CareDomain } from "@/lib/care/domains";
import type { CareDirectoryRow } from "@/lib/care/types";

export type CareDirectoryFormat = "cabinet" | "visio";
export type CareDirectoryWhen = "aujourdhui" | "semaine" | "mois";

export type CareDirectoryQuery = {
  q: string;
  besoin: string;
  ou: string;
  quand: CareDirectoryWhen | null;
  domaine: CareDomain | null;
  format: CareDirectoryFormat | null;
  affiche: number;
};

export const CARE_QUICK_SEARCHES = [
  "Parentalité",
  "Petite enfance",
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
  besoin?: string | string[];
  ou?: string | string[];
  quand?: string | string[];
  domaine?: string | string[];
  format?: string | string[];
  affiche?: string | string[];
}): CareDirectoryQuery {
  const one = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
  const domaineRaw = one(input.domaine);
  const formatRaw = one(input.format);
  const quandRaw = one(input.quand);
  const affiche = Number(one(input.affiche));
  return {
    q: one(input.q),
    besoin: one(input.besoin),
    ou: one(input.ou),
    quand: quandRaw === "aujourdhui" || quandRaw === "semaine" || quandRaw === "mois" ? quandRaw : null,
    domaine: isCareDomain(domaineRaw) ? domaineRaw : null,
    format: formatRaw === "cabinet" || formatRaw === "visio" ? formatRaw : null,
    affiche: Number.isFinite(affiche) && affiche > 9 ? Math.min(affiche, 90) : 9,
  };
}

export function careDirectoryHref(query: Partial<CareDirectoryQuery>) {
  const params = new URLSearchParams();
  if (query.q?.trim()) params.set("q", query.q.trim());
  if (query.besoin?.trim()) params.set("besoin", query.besoin.trim());
  if (query.ou?.trim()) params.set("ou", query.ou.trim());
  if (query.quand) params.set("quand", query.quand);
  if (query.domaine) params.set("domaine", query.domaine);
  if (query.format) params.set("format", query.format);
  if (query.affiche && query.affiche > 9) params.set("affiche", String(query.affiche));
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
      ...(row.service_names ?? []),
      ...domainText,
    ].join(" "),
  );
}

const QUERY_ALIASES: Record<string, string[]> = {
  parentalite: ["famille", "parents", "family"],
  "petite enfance": ["0-3", "0–3", "0-6", "famille", "family"],
  orientation: ["carriere", "shift", "orientation"],
  "preparation mentale": ["performance", "peak"],
};

export function matchesCareDirectory(row: CareDirectoryRow, query: CareDirectoryQuery) {
  if (query.domaine && !(row.domains ?? []).includes(query.domaine)) return false;
  if (query.format === "cabinet" && !row.offers_cabinet) return false;
  if (query.format === "visio" && !row.offers_visio) return false;
  const where = foldCareText(query.ou);
  if (where === "visio" && !row.offers_visio) return false;
  if (where && where !== "visio" && !foldCareText(row.city ?? "").includes(where)) return false;
  const besoin = foldCareText(query.besoin);
  const q = foldCareText(query.q);
  const needle = [besoin, q].filter(Boolean).join(" ");
  if (!needle) return true;
  const hay = haystack(row);
  if (besoin && isCareDomain(query.besoin) && (row.domains ?? []).includes(query.besoin)) return !q || hay.includes(q);
  if (hay.includes(needle) || (besoin && hay.includes(besoin) && (!q || hay.includes(q)))) return true;
  const aliases = QUERY_ALIASES[besoin] ?? QUERY_ALIASES[q] ?? [];
  return aliases.some((alias) => hay.includes(foldCareText(alias)));
}

export function careSlotInWhen(iso: string, quand: CareDirectoryQuery["quand"], now = new Date()) {
  if (!quand) return true;
  const start = new Date(iso).getTime();
  if (Number.isNaN(start) || start < now.getTime() - 60_000) return false;
  if (quand === "aujourdhui") {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso))
      === new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  }
  const span = quand === "semaine" ? 7 : 31;
  return start - now.getTime() <= span * 24 * 60 * 60 * 1000;
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
