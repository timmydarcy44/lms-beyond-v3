import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabase/server";
import { fmtDate } from "@/lib/serious-games/shared";
import { Bar, CRITERIA_LABEL, CRITERIA_MAX, Stat } from "@/components/serious-games/ui";

type Row = {
  id: string; user_id: string; game_id: string; status: "started" | "completed"; score: number | null; passed: boolean | null;
  ending_title: string | null; criteria: Record<string, number> | null; started_at: string; completed_at: string | null; pdf_path: string | null;
};

// Tableau de bord de l'école : résultats des apprenants, jeu par jeu.
export default async function SchoolGamesDashboard({ searchParams }: { searchParams: Promise<{ game?: string; sort?: string }> }) {
  const { game: gameParam, sort = "score" } = await searchParams;
  const supabase = await getServerClient();
  if (!supabase) redirect("/login");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: staff } = await supabase.rpc("sg_is_staff");
  if (!staff) redirect("/dashboard/apprenant/jeux");

  const { data: games } = await supabase.from("serious_games").select("slug, title, manifest").order("created_at", { ascending: false });
  const catalog = [...new Map((games ?? []).map((g: any) => [g.slug, g])).values()] as any[];
  const game = gameParam && catalog.some((g) => g.slug === gameParam) ? gameParam : catalog[0]?.slug;
  const meta = catalog.find((g) => g.slug === game);
  const passing = meta?.manifest?.scoring?.passingScore ?? 60;

  // RLS : seules les parties des apprenants de l'école remontent
  const [{ data: attempts }, { data: qstats }] = await Promise.all([
    game ? supabase.from("serious_game_attempts")
      .select("id, user_id, game_id, status, score, passed, ending_title, criteria, started_at, completed_at, pdf_path")
      .eq("game_id", game).neq("user_id", user.id).order("started_at", { ascending: false }).limit(3000) : Promise.resolve({ data: [] }),
    game ? supabase.from("sg_question_stats").select("*").eq("game_id", game) : Promise.resolve({ data: [] }),
  ]);
  const rows: Row[] = (attempts ?? []) as Row[];
  const done = rows.filter((r) => r.status === "completed");

  // Une ligne par apprenant : meilleure partie, nombre de parties, dernière activité
  const learners = new Map<string, { best: Row | null; count: number; last: string; inProgress: boolean }>();
  rows.forEach((r) => {
    const l = learners.get(r.user_id) ?? { best: null, count: 0, last: r.started_at, inProgress: false };
    if (r.status === "completed") { l.count++; if (!l.best || (r.score ?? 0) > (l.best.score ?? 0)) l.best = r; }
    else l.inProgress = true;
    if (r.started_at > l.last) l.last = r.started_at;
    learners.set(r.user_id, l);
  });
  const names: Record<string, string> = {};
  await Promise.all([...learners.keys()].map(async (id) => { const { data } = await supabase.rpc("sg_learner_label", { learner: id }); names[id] = data ?? "Apprenant"; }));
  const list = [...learners.entries()].sort((a, b) =>
    sort === "nom" ? (names[a[0]] ?? "").localeCompare(names[b[0]] ?? "", "fr")
    : sort === "date" ? b[1].last.localeCompare(a[1].last)
    : (b[1].best?.score ?? -1) - (a[1].best?.score ?? -1));

  const bests = list.map(([, l]) => l.best).filter(Boolean) as Row[];
  const avg = bests.length ? Math.round(bests.reduce((s, r) => s + (r.score ?? 0), 0) / bests.length) : null;
  const passRate = bests.length ? Math.round(bests.filter((r) => (r.score ?? 0) >= passing).length / bests.length * 100) : null;
  const critKeys = [...new Set(bests.flatMap((r) => Object.keys(r.criteria ?? {})))];
  const critAvg = critKeys.map((k) => [k, bests.reduce((s, r) => s + (r.criteria?.[k] ?? 0), 0) / (bests.length || 1)] as const);
  const buckets = [0, 0, 0, 0, 0]; bests.forEach((r) => buckets[Math.min(4, Math.floor((r.score ?? 0) / 20))]++);
  const hardest = ((qstats ?? []) as any[]).map((q) => ({ ...q, fail: q.answers ? (q.bad + q.mid * .5) / q.answers : 0 })).sort((a, b) => b.fail - a.fail).slice(0, 5);
  const q = (s: string) => `/dashboard/ecole/jeux?game=${encodeURIComponent(game ?? "")}&sort=${s}`;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Résultats des jeux</h1>
          <p className="text-muted-foreground">Suivez la progression de vos apprenants et repérez les notions à retravailler.</p>
        </div>
        {game && <a className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background" href={`/api/serious-games/export?game=${encodeURIComponent(game)}`}>Exporter en CSV</a>}
      </header>

      <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Choisir un jeu">
        {catalog.map((g) => (
          <Link key={g.slug} href={`/dashboard/ecole/jeux?game=${encodeURIComponent(g.slug)}`}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${g.slug === game ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}>{g.title}</Link>
        ))}
      </nav>

      {!game ? <p className="text-muted-foreground">Aucun jeu importé pour l'instant.</p> : (<>
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Apprenants" value={learners.size} hint={`${list.filter(([, l]) => l.inProgress && !l.best).length} en cours, sans résultat`} />
          <Stat label="Parties terminées" value={done.length} />
          <Stat label="Score moyen" value={avg ?? "-"} hint="meilleure partie de chacun" />
          <Stat label="Taux de réussite" value={passRate != null ? `${passRate} %` : "-"} hint={`seuil ${passing}/100`} />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[28px] border bg-card p-6">
            <h2 className="mb-4 text-lg font-bold">Répartition des scores</h2>
            <div className="flex h-40 items-end gap-3">
              {buckets.map((n, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="text-xs font-semibold tabular-nums">{n}</span>
                  <div className="w-full rounded-t-xl bg-gradient-to-t from-indigo-500 to-violet-400" style={{ height: `${(n / Math.max(1, ...buckets)) * 100}%`, minHeight: n ? 6 : 2 }} />
                  <span className="text-xs text-muted-foreground tabular-nums">{i * 20}–{i === 4 ? 100 : i * 20 + 19}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[28px] border bg-card p-6">
            <h2 className="mb-4 text-lg font-bold">Moyenne par critère</h2>
            <div className="flex flex-col gap-4">
              {critAvg.length === 0 && <p className="text-sm text-muted-foreground">Ce jeu ne transmet pas de sous-notes.</p>}
              {critAvg.map(([k, v]) => (
                <div key={k} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-sm"><span className="font-semibold">{CRITERIA_LABEL[k] ?? k}</span><span className="tabular-nums">{v.toFixed(1).replace(".", ",")}{CRITERIA_MAX[k] ? ` / ${CRITERIA_MAX[k]}` : ""}</span></div>
                  <Bar value={v} max={CRITERIA_MAX[k] ?? 100} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {hardest.length > 0 && (
          <section className="rounded-[28px] border bg-card p-6">
            <h2 className="text-lg font-bold">Là où vos apprenants bloquent</h2>
            <p className="mb-4 text-sm text-muted-foreground">Étapes classées par part de réponses à revoir. Idéal pour préparer un débrief collectif.</p>
            <div className="flex flex-col gap-4">
              {hardest.map((h) => (
                <div key={h.node_id} className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap justify-between gap-2 text-sm"><span className="font-semibold">{h.question}</span><span className="tabular-nums text-muted-foreground">{h.answers} réponses</span></div>
                  <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="bg-emerald-500" style={{ width: `${h.good / h.answers * 100}%` }} />
                    <div className="bg-amber-400" style={{ width: `${h.mid / h.answers * 100}%` }} />
                    <div className="bg-red-500" style={{ width: `${h.bad / h.answers * 100}%` }} />
                  </div>
                </div>
              ))}
              <div className="flex gap-4 text-xs text-muted-foreground"><span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />Bon réflexe</span><span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-400" />À nuancer</span><span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-red-500" />À revoir</span></div>
            </div>
          </section>
        )}

        <section className="rounded-[28px] border bg-card p-2 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 pb-2 pt-2">
            <h2 className="text-lg font-bold">Apprenants</h2>
            <div className="flex gap-1 text-sm">
              {[["score", "Score"], ["nom", "Nom"], ["date", "Activité"]].map(([k, l]) => (
                <Link key={k} href={q(k)} className={`rounded-full px-3 py-1 ${sort === k ? "bg-foreground text-background" : "text-muted-foreground"}`}>{l}</Link>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr><th className="px-3 py-2 font-medium">Apprenant</th><th className="px-3 py-2 text-right font-medium">Meilleur score</th>
                  {critKeys.map((k) => <th key={k} className="px-3 py-2 text-right font-medium">{CRITERIA_LABEL[k] ?? k}</th>)}
                  <th className="px-3 py-2 text-right font-medium">Parties</th><th className="px-3 py-2 font-medium">Dernière activité</th><th className="px-3 py-2" /></tr>
              </thead>
              <tbody>
                {list.map(([id, l]) => (
                  <tr key={id} className="border-t">
                    <td className="px-3 py-3 font-semibold">{names[id]}</td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {l.best ? <span className={`rounded-full px-2.5 py-1 font-bold ${(l.best.score ?? 0) >= passing ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/15 text-amber-700 dark:text-amber-300"}`}>{l.best.score}</span> : <span className="text-muted-foreground">En cours</span>}
                    </td>
                    {critKeys.map((k) => <td key={k} className="px-3 py-3 text-right tabular-nums text-muted-foreground">{l.best?.criteria?.[k] != null ? String(l.best.criteria[k]).replace(".", ",") : "-"}</td>)}
                    <td className="px-3 py-3 text-right tabular-nums">{l.count}</td>
                    <td className="px-3 py-3 tabular-nums text-muted-foreground">{fmtDate(l.last)}</td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      {l.best && <Link className="underline" href={`/dashboard/ecole/jeux/${l.best.id}`}>Détail</Link>}
                      {l.best?.pdf_path && <a className="ml-3 underline" href={`/api/serious-games/deliverable/${l.best.id}`}>PDF</a>}
                    </td>
                  </tr>
                ))}
                {list.length === 0 && <tr><td colSpan={5 + critKeys.length} className="px-3 py-8 text-center text-muted-foreground">Aucun apprenant n'a encore joué à ce jeu.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </>)}
    </main>
  );
}
