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
  const { error } = await supabase.from("serious_games").upsert(
    { slug: m.id.slice(0, 80), version: Number(m.version) || 1, title: m.title.slice(0, 200), manifest: m, entry_url: entryUrl, created_by: userId },
    { onConflict: "slug,version" });
  return error ? { ok: false as const, reason: error.message } : { ok: true as const, slug: m.id, version: Number(m.version) || 1 };
}
