import { getServerClient } from "@/lib/supabase/server";

// Export CSV des résultats pour l'école (Excel en français : séparateur « ; », BOM UTF-8).
export async function GET(req: Request) {
  const supabase = await getServerClient();
  if (!supabase) return new Response("Non connecté", { status: 401 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Non connecté", { status: 401 });
  const { data: staff } = await supabase.rpc("sg_is_staff");
  if (!staff) return new Response("Accès réservé à l'équipe pédagogique", { status: 403 });

  const game = (new URL(req.url).searchParams.get("game") ?? "").slice(0, 80);
  let q = supabase.from("serious_game_attempts")
    .select("id, user_id, game_id, status, score, passed, ending_title, criteria, xp, badges, duration_sec, started_at, completed_at")
    .neq("user_id", user.id).order("started_at", { ascending: false }).limit(5000);
  if (game) q = q.eq("game_id", game);
  const { data: rows } = await q;
  const list: any[] = rows ?? [];

  const ids = [...new Set(list.map((r) => r.user_id))];
  const names: Record<string, string> = {};
  await Promise.all(ids.map(async (id) => { const { data } = await supabase.rpc("sg_learner_label", { learner: id }); names[id] = data ?? id; }));

  const critKeys = [...new Set(list.flatMap((r) => Object.keys(r.criteria ?? {})))];
  const cell = (v: unknown) => { const s = v === null || v === undefined ? "" : String(v); return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const head = ["Apprenant", "Jeu", "Statut", "Score", "Réussi", "Résultat", ...critKeys, "XP", "Badges", "Durée (min)", "Commencé le", "Terminé le"];
  const lines = list.map((r) => [
    names[r.user_id], r.game_id, r.status === "completed" ? "Terminé" : "En cours", r.score ?? "", r.passed ? "Oui" : r.passed === false ? "Non" : "",
    r.ending_title ?? "", ...critKeys.map((k) => String(r.criteria?.[k] ?? "").replace(".", ",")), r.xp ?? "",
    (r.badges ?? []).map((b: any) => b.name).join(", "), r.duration_sec ? Math.round(r.duration_sec / 60) : "",
    r.started_at?.slice(0, 16).replace("T", " ") ?? "", r.completed_at?.slice(0, 16).replace("T", " ") ?? "",
  ].map(cell).join(";"));

  return new Response("﻿" + [head.map(cell).join(";"), ...lines].join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="resultats-${game || "jeux"}.csv"` },
  });
}
