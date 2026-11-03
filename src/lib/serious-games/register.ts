import type { GameManifest } from "./shared";

/**
 * À appeler par l'import du bloc « Jeu interactif », juste après la publication du zip.
 * Enregistre la fiche jeu.json : titre, fins valides, seuil de réussite, nombre de badges.
 * Ces informations servent à contrôler les résultats envoyés et à remplir les tableaux de bord.
 */
export async function registerGamePackage(supabase: any, manifestText: string | null, entryUrl: string, userId: string) {
  if (!manifestText) return { ok: false as const, reason: "Pas de jeu.json : le jeu fonctionne, mais sans contrôle des résultats." };
  let m: GameManifest & Record<string, unknown>;
  try { m = JSON.parse(manifestText); } catch { return { ok: false as const, reason: "jeu.json illisible" }; }
  if (typeof m.id !== "string" || !m.id || typeof m.title !== "string") return { ok: false as const, reason: "jeu.json incomplet (id ou title manquant)" };
  const base = {
    slug: m.id.slice(0, 80),
    version: Number(m.version) || 1,
    title: m.title.slice(0, 200),
    manifest: m,
    entry_url: entryUrl,
    created_by: userId,
  };
  const extra = {
    hook: typeof m.hook === "string" ? m.hook.slice(0, 400) : null,
    duration_min: Number.isFinite(Number(m.duration_min)) ? Number(m.duration_min) : null,
    steps_count: Number.isFinite(Number(m.steps_count)) ? Number(m.steps_count) : null,
    skills: Array.isArray(m.skills) ? m.skills.map((skill) => String(skill).slice(0, 80)).slice(0, 8) : [],
    character: m.character && typeof m.character === "object" ? m.character : null,
    cover_url: typeof m.cover_url === "string" ? m.cover_url.slice(0, 500) : null,
    max_attempts: Number.isFinite(Number(m.max_attempts)) ? Number(m.max_attempts) : null,
  };
  let { error } = await supabase.from("serious_games").upsert({ ...base, ...extra }, { onConflict: "slug,version" });
  if (error && (error.code === "42703" || /column/i.test(error.message ?? ""))) {
    ({ error } = await supabase.from("serious_games").upsert(base, { onConflict: "slug,version" }));
  }
  return error ? { ok: false as const, reason: error.message } : { ok: true as const, slug: m.id, version: Number(m.version) || 1 };
}
