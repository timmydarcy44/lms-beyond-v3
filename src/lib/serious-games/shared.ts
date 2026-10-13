// Types et utilitaires communs au suivi des jeux interactifs.

export type Tone = "good" | "mid" | "bad";

export type GameManifest = {
  id: string;
  version: number;
  title: string;
  endings?: { id: string; title: string; tone: Tone }[];
  scoring?: { max?: number; passingScore?: number; weights?: Record<string, number> };
  deliverable?: { name: string; format: string };
};

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TONES = new Set<Tone>(["good", "mid", "bad"]);

export const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
export const num = (v: unknown, min: number, max: number): number | null => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : null;
};
export const tone = (v: unknown): Tone | null => (TONES.has(v as Tone) ? (v as Tone) : null);
export const gauges = (v: any) =>
  v && typeof v === "object"
    ? Object.fromEntries(Object.entries(v).slice(0, 8).map(([k, x]) => [str(k, 40), num(x, -10000, 10000) ?? 0]))
    : null;

/** Taille maximale acceptée pour un objet JSON envoyé par un jeu (état, rapport). */
export const MAX_JSON_BYTES = 200_000;
export const jsonOk = (v: unknown) => {
  try { return JSON.stringify(v ?? null).length <= MAX_JSON_BYTES; } catch { return false; }
};

export const TONE_LABEL: Record<Tone, string> = { good: "Bon réflexe", mid: "À nuancer", bad: "À revoir" };

export const fmtDate = (d: string | null | undefined, withTime = true) =>
  d ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", ...(withTime ? { timeStyle: "short" } : {}), timeZone: "Europe/Paris" }).format(new Date(d)) : "-";

export const fmtDuration = (sec: number | null | undefined) => {
  if (!sec && sec !== 0) return "-";
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m} min ${String(s).padStart(2, "0")}`;
};

/** Règles du jeu lues dans le manifeste importé (jeu.json). */
export async function getGameRules(supabase: any, gameId: string, version: number) {
  const { data } = await supabase
    .from("serious_games")
    .select("title, manifest")
    .eq("slug", gameId)
    .order("version", { ascending: false })
    .limit(5);
  const rows: { title: string; manifest: GameManifest }[] = data ?? [];
  const row = rows.find((r) => r.manifest?.version === version) ?? rows[0];
  const m = row?.manifest;
  return {
    known: !!m,
    title: m?.title ?? row?.title ?? gameId,
    endings: m?.endings?.map((e) => e.id) ?? null,
    passingScore: m?.scoring?.passingScore ?? 60,
  };
}
