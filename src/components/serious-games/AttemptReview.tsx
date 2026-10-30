// Relecture d'une partie, question par question. Utilisée par l'apprenant et par l'école.
import { fmtDate, fmtDuration, type Tone } from "@/lib/serious-games/shared";
import { Bar, CRITERIA_LABEL, CRITERIA_MAX, ToneChip } from "./ui";

export type ReviewAttempt = {
  id: string; game_id: string; status: "started" | "completed"; score: number | null; passed: boolean | null;
  ending_title: string | null; ending_text: string | null; lesson: string | null; tone: Tone | null;
  criteria: Record<string, number> | null; xp: number | null; badges: { id: string; name: string }[] | null;
  duration_sec: number | null; started_at: string; completed_at: string | null; pdf_path: string | null;
};
export type ReviewAnswer = {
  step_index: number; situation: string | null; speaker: string | null; question: string;
  options: { key: string; text: string; tone: Tone; concept: string; feedback: string }[];
  chosen_key: string; chosen_text: string; chosen_keys: string[] | null; free_text: string | null;
  tone: Tone | null; concept: string | null; feedback: string | null;
};

export function AttemptReview({ attempt, answers, learnerName }: { attempt: ReviewAttempt; answers: ReviewAnswer[]; learnerName?: string }) {
  const crit = Object.entries(attempt.criteria ?? {});
  return (
    <div className="flex flex-col gap-6">
      <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-indigo-600 via-violet-600 to-pink-500 p-6 text-white sm:p-8">
        {learnerName && <div className="text-sm font-semibold opacity-90">{learnerName}</div>}
        <div className="text-sm opacity-85">{attempt.status === "completed" ? attempt.ending_title : "Partie non terminée"}</div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-7xl font-extrabold leading-none tracking-tighter tabular-nums">{attempt.score ?? "-"}</span>
          <span className="text-xl font-bold opacity-80">/ 100</span>
        </div>
        {attempt.ending_text && <p className="mt-3 max-w-2xl opacity-90">{attempt.ending_text}</p>}
        <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
          {attempt.passed != null && <span className="rounded-full bg-white/15 px-3 py-1">{attempt.passed ? "Jeu validé" : "Non validé"}</span>}
          {attempt.xp != null && <span className="rounded-full bg-white/15 px-3 py-1">{attempt.xp} XP</span>}
          <span className="rounded-full bg-white/15 px-3 py-1">{fmtDate(attempt.started_at)}</span>
          <span className="rounded-full bg-white/15 px-3 py-1">Durée {fmtDuration(attempt.duration_sec)}</span>
          {attempt.pdf_path && <a className="rounded-full bg-white px-3 py-1 text-indigo-700" href={`/api/serious-games/deliverable/${attempt.id}`}>Télécharger le livrable PDF</a>}
        </div>
      </section>

      {crit.length > 0 && (
        <section className="grid gap-3 sm:grid-cols-2">
          {crit.map(([k, v]) => (
            <div key={k} className="rounded-3xl border border-white/10 bg-[#12141A] p-5 text-[#F4F5F7]">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold capitalize">{CRITERIA_LABEL[k] ?? k}</span>
                <span className="tabular-nums"><b className="text-2xl">{String(v).replace(".", ",")}</b>{CRITERIA_MAX[k] ? <span className="text-white/50"> / {CRITERIA_MAX[k]}</span> : null}</span>
              </div>
              <Bar value={v} max={CRITERIA_MAX[k] ?? 100} className="mt-3" />
            </div>
          ))}
        </section>
      )}

      {(attempt.badges ?? []).length > 0 && (
        <section className="flex flex-wrap gap-2">
          {attempt.badges!.map((b) => <span key={b.id} className="rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 px-3 py-1 text-sm font-semibold text-white">{b.name}</span>)}
        </section>
      )}

      {attempt.lesson && (
        <section className="rounded-3xl border border-white/10 bg-[#12141A] p-5 text-[#F4F5F7]">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/50">À retenir</div>
          <p>{attempt.lesson}</p>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">Les réponses, étape par étape</h2>
        {answers.length === 0 && <p className="text-white/50">Aucune réponse enregistrée pour cette partie.</p>}
        {answers.map((a) => {
          const chosen = new Set(a.chosen_keys?.length ? a.chosen_keys : [a.chosen_key]);
          const multi = (a.chosen_keys?.length ?? 0) > 0;
          return (
            <article key={a.step_index} className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-[#12141A] p-5 text-[#F4F5F7]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Étape {a.step_index}{a.concept ? ` · ${a.concept}` : ""}</span>
                <ToneChip tone={a.tone} />
              </div>
              {a.situation && <p className="text-sm italic text-white/55">{a.situation}</p>}
              <p className="text-lg font-semibold">{a.question}</p>
              {multi && <p className="text-sm text-white/70">{a.chosen_text}</p>}
              <ul className="flex flex-col gap-2">
                {a.options.map((o) => {
                  const on = chosen.has(o.key);
                  return (
                    <li key={o.key} className={`flex flex-col gap-1.5 rounded-2xl border p-3 ${on ? "border-indigo-400 bg-indigo-500/15" : "border-white/10 opacity-80"}`}>
                      <div className="flex flex-wrap items-start gap-3">
                        <span className="grid h-6 min-w-6 place-items-center rounded-full bg-white px-1.5 text-xs font-bold text-[#07080B]">{o.key}</span>
                        <span className="min-w-0 flex-1">{o.text}</span>
                        {on && <span className="text-xs font-semibold text-indigo-300">{multi ? "Choisi" : "Réponse donnée"}</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pl-9"><ToneChip tone={o.tone} /><span className="text-xs text-white/50">{o.concept}</span></div>
                      {o.feedback && (on
                        ? <p className="pl-9 text-sm">{o.feedback}</p>
                        : <details className="pl-9 text-sm"><summary className="cursor-pointer text-white/50">Voir le retour</summary><p className="pt-1">{o.feedback}</p></details>)}
                    </li>
                  );
                })}
              </ul>
              {a.free_text && (
                <div className="rounded-2xl bg-white/[0.06] p-4">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/50">Texte rédigé</div>
                  <p className="whitespace-pre-wrap leading-relaxed">{a.free_text}</p>
                </div>
              )}
              {a.feedback && <p className="text-sm text-white/55">{a.feedback}</p>}
            </article>
          );
        })}
      </section>
    </div>
  );
}
