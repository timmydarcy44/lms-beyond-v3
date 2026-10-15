import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabase/server";
import { fmtDate } from "@/lib/serious-games/shared";
import { Bar, Sparkline, Stat } from "@/components/serious-games/ui";

type Row = {
  id: string; game_id: string; status: "started" | "completed"; score: number | null; passed: boolean | null;
  ending_title: string | null; xp: number | null; badges: { id: string; name: string }[] | null;
  started_at: string; completed_at: string | null; pdf_path: string | null; course_id: string | null;
};

// Tableau de bord de l'apprenant : ses scores, sa progression, ses badges, ses livrables.
export default async function MyGamesDashboard() {
  const supabase = await getServerClient();
  if (!supabase) redirect("/login");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: attempts }, { data: games }, { data: cols }] = await Promise.all([
    supabase.from("serious_game_attempts")
      .select("id, game_id, status, score, passed, ending_title, xp, badges, started_at, completed_at, pdf_path, course_id")
      .eq("user_id", user.id).order("started_at", { ascending: true }),
    supabase.from("serious_games").select("slug, title, manifest"),
    supabase.from("serious_game_collections").select("game_id, collection").eq("user_id", user.id),
  ]);
  const rows: Row[] = (attempts ?? []) as Row[];
  const done = rows.filter((r) => r.status === "completed");
  const title = (slug: string) => (games ?? []).find((g: any) => g.slug === slug)?.title ?? slug;
  const totalBadges = (manifestSlug: string) => (games ?? []).find((g: any) => g.slug === manifestSlug)?.manifest?.gamification?.badges?.length ?? null;

  // XP : meilleure partie de chaque jeu (rejouer améliore son total, sans le gonfler artificiellement)
  const byGame = new Map<string, Row[]>();
  rows.forEach((r) => byGame.set(r.game_id, [...(byGame.get(r.game_id) ?? []), r]));
  const totalXp = [...byGame.values()].reduce((s, list) => s + Math.max(0, ...list.map((r) => r.xp ?? 0)), 0);
  const badgeSet = new Set<string>();
  (cols ?? []).forEach((c: any) => (c.collection?.badges ?? []).forEach((b: string) => badgeSet.add(c.game_id + ":" + b)));
  done.forEach((r) => (r.badges ?? []).forEach((b) => badgeSet.add(r.game_id + ":" + b.id)));
  const validated = [...byGame.values()].filter((list) => list.some((r) => r.passed)).length;

  // Série : jours consécutifs avec au moins une partie terminée
  const days = new Set(done.map((r) => (r.completed_at ?? r.started_at).slice(0, 10)));
  let streak = 0; const d = new Date();
  if (!days.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
  while (days.has(d.toISOString().slice(0, 10))) { streak++; d.setDate(d.getDate() - 1); }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight">Mes jeux</h1>
        <p className="text-muted-foreground">Vos scores, votre progression et vos badges, jeu par jeu.</p>
      </header>

      <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-indigo-600 via-violet-600 to-pink-500 p-6 text-white sm:p-8">
        <div className="text-sm font-semibold opacity-85">Votre total</div>
        <div className="mt-1 flex items-baseline gap-2"><span className="text-6xl font-extrabold tracking-tighter tabular-nums">{totalXp.toLocaleString("fr-FR")}</span><span className="text-xl font-bold opacity-80">XP</span></div>
        <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
          <span className="rounded-full bg-white/15 px-3 py-1">{streak > 0 ? `Série de ${streak} jour${streak > 1 ? "s" : ""}` : "Jouez aujourd'hui pour lancer une série"}</span>
          <span className="rounded-full bg-white/15 px-3 py-1">{badgeSet.size} badge{badgeSet.size > 1 ? "s" : ""}</span>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Parties terminées" value={done.length} />
        <Stat label="Jeux validés" value={`${validated}/${byGame.size}`} />
        <Stat label="Score moyen" value={done.length ? Math.round(done.reduce((s, r) => s + (r.score ?? 0), 0) / done.length) : "-"} hint="sur 100" />
        <Stat label="Meilleur score" value={done.length ? Math.max(...done.map((r) => r.score ?? 0)) : "-"} hint="sur 100" />
      </section>

      {byGame.size === 0 && (
        <section className="rounded-3xl border bg-card p-8 text-center">
          <p className="text-lg font-semibold">Aucun jeu commencé pour l'instant</p>
          <p className="text-muted-foreground">Les jeux interactifs de vos formations apparaîtront ici dès votre première partie.</p>
        </section>
      )}

      <section className="flex flex-col gap-4">
        {[...byGame.entries()].map(([slug, list]) => {
          const fin = list.filter((r) => r.status === "completed");
          const best = fin.length ? Math.max(...fin.map((r) => r.score ?? 0)) : null;
          const last = list[list.length - 1];
          const got = new Set([...(cols ?? []).filter((c: any) => c.game_id === slug).flatMap((c: any) => c.collection?.badges ?? []), ...fin.flatMap((r) => (r.badges ?? []).map((b) => b.id))]);
          const tb = totalBadges(slug);
          return (
            <article key={slug} className="flex flex-col gap-5 rounded-[28px] border border-slate-200 bg-white p-5 text-slate-900 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-slate-900">{title(slug)}</h2>
                  <p className="text-sm text-slate-500">{fin.length} partie{fin.length > 1 ? "s" : ""} terminée{fin.length > 1 ? "s" : ""} · dernière le {fmtDate(last.completed_at ?? last.started_at, false)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-indigo-600 dark:text-indigo-300"><Sparkline values={fin.map((r) => r.score ?? 0)} /></div>
                  <div className="text-right"><div className="text-4xl font-extrabold text-slate-900 tabular-nums">{best ?? "-"}</div><div className="text-xs text-slate-500">meilleur score</div></div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm"><span className="font-semibold text-slate-900">Badges</span><span className="text-slate-500">{got.size}{tb ? ` / ${tb}` : ""}</span></div>
                <Bar value={got.size} max={tb ?? Math.max(1, got.size)} />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="text-left text-xs text-slate-500"><tr><th className="py-2 pr-3 font-medium">Date</th><th className="py-2 pr-3 font-medium">Résultat</th><th className="py-2 pr-3 text-right font-medium">Score</th><th className="py-2" /></tr></thead>
                  <tbody>
                    {[...list].reverse().map((r) => (
                      <tr key={r.id} className="border-t border-slate-200">
                        <td className="py-2.5 pr-3 text-slate-700 tabular-nums">{fmtDate(r.started_at)}</td>
                        <td className="py-2.5 pr-3 text-slate-800">{r.status === "completed" ? <>{r.ending_title}{r.passed && <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-700">Validé</span>}</> : <span className="text-slate-500">En cours</span>}</td>
                        <td className="py-2.5 pr-3 text-right font-bold text-slate-900 tabular-nums">{r.score ?? "-"}</td>
                        <td className="py-2.5 text-right whitespace-nowrap">
                          <Link className="font-semibold text-slate-900 underline" href={`/dashboard/apprenant/jeux/${r.id}`}>Revoir</Link>
                          {r.pdf_path && <a className="ml-3 font-semibold text-slate-900 underline" href={`/api/serious-games/deliverable/${r.id}`}>PDF</a>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
