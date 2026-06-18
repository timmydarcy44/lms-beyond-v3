"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, Award, BookOpen, Users } from "lucide-react";
import {
  hasLearnerTestData,
  LearnerTestsUnlockSection,
} from "@/components/learner/learner-tests-unlock-section";
import { usePersonalizedActionPlanFromSnapshot } from "@/components/learner/learner-snapshot-provider";
import { buildEdgeParcoursBlocksFromPlan } from "@/lib/learner/edge-catalog-preview";
import {
  SALARIE_CARD,
  SALARIE_PAGE_KICKER,
  SALARIE_PAGE_LEAD,
  SALARIE_PAGE_SHELL,
  SALARIE_PAGE_TITLE,
} from "@/lib/salarie/connect-nav";

export default function SalarieParcoursPage() {
  const { loading, plan, snapshot } = usePersonalizedActionPlanFromSnapshot("salarie");
  const hasTests = hasLearnerTestData(snapshot);
  const blocks = useMemo(() => buildEdgeParcoursBlocksFromPlan(plan), [plan]);

  return (
    <div className={SALARIE_PAGE_SHELL}>
      <section className="mb-8 space-y-2">
        <p className={SALARIE_PAGE_KICKER}>Parcours personnalisé</p>
        <h1 className={SALARIE_PAGE_TITLE}>Mon parcours EDGE</h1>
        <p className={SALARIE_PAGE_LEAD}>
          On diagnostique avant de former — votre parcours est construit à partir de vos résultats
          DISC, IDMC et Soft Skills, croisés avec votre poste.
        </p>
      </section>

      {loading ? (
        <p className="text-sm text-white/50">Analyse de votre profil…</p>
      ) : !hasTests || !blocks ? (
        <LearnerTestsUnlockSection />
      ) : (
        <>
          <div className="mb-8 rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/15 via-indigo-500/10 to-transparent p-6 sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-200/80">
              Votre parcours sur mesure
            </p>
            <h2 className="mt-3 text-xl font-bold text-white sm:text-2xl">{plan?.headline}</h2>
            <p className="mt-3 max-w-3xl text-sm text-white/70">{plan?.summary}</p>
            {plan?.needs.length ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {plan.needs.map((need) => (
                  <li
                    key={need}
                    className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs font-medium text-white/80"
                  >
                    {need}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Coaching */}
            <section className={SALARIE_CARD}>
              <div className="flex items-center gap-2 text-violet-300">
                <Users className="h-5 w-5" />
                <h2 className="text-sm font-semibold uppercase tracking-wider">Coaching recommandé</h2>
              </div>
              {blocks.coaching ? (
                <>
                  <p className="mt-4 text-lg font-bold text-white">{blocks.coaching.name}</p>
                  <p className="text-sm text-white/55">{blocks.coaching.title}</p>
                  <p className="mt-2 text-xs text-violet-200/70">{blocks.coaching.reason}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {blocks.coaching.specialites.slice(0, 4).map((s) => (
                      <span
                        key={s}
                        className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-white/60"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <Link
                    href={`/dashboard/salarie/coachings?focus=${encodeURIComponent(blocks.coaching.specialites[0] ?? "")}`}
                    className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-violet-300 hover:text-violet-200"
                  >
                    Voir le praticien
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </>
              ) : (
                <p className="mt-4 text-sm text-white/50">
                  Passez vos tests pour obtenir une recommandation de coaching.
                </p>
              )}
            </section>

            {/* Micro-formations */}
            <section className={`${SALARIE_CARD} lg:col-span-1`}>
              <div className="flex items-center gap-2 text-violet-300">
                <BookOpen className="h-5 w-5" />
                <h2 className="text-sm font-semibold uppercase tracking-wider">
                  Micro-formations recommandées
                </h2>
              </div>
              {blocks.microFormations.length > 0 ? (
                <ul className="mt-4 space-y-4">
                  {blocks.microFormations.map((f) => (
                    <li key={f.slug}>
                      <Link href={f.href} className="group block">
                        <p className="font-semibold text-white group-hover:text-violet-100">
                          {f.title}
                        </p>
                        <p className="mt-1 text-xs text-white/45">
                          {f.famille} · {f.duree}
                        </p>
                        <p className="mt-1 text-sm text-white/55">{f.description}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-white/50">Aucune formation identifiée pour le moment.</p>
              )}
            </section>

            {/* Badge */}
            <section className={SALARIE_CARD}>
              <div className="flex items-center gap-2 text-violet-300">
                <Award className="h-5 w-5" />
                <h2 className="text-sm font-semibold uppercase tracking-wider">Open Badge suggéré</h2>
              </div>
              {blocks.badge ? (
                <>
                  <p className="mt-4 text-lg font-bold text-white">{blocks.badge.title}</p>
                  <p className="mt-2 text-sm text-white/55">{blocks.badge.description}</p>
                  <p className="mt-2 text-xs text-violet-200/70">{blocks.badge.reason}</p>
                  <Link
                    href={blocks.badge.href}
                    className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-violet-300 hover:text-violet-200"
                  >
                    Voir mon wallet
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </>
              ) : (
                <p className="mt-4 text-sm text-white/50">Complétez vos tests pour débloquer un badge.</p>
              )}
            </section>
          </div>

          {plan?.parcoursSteps.length ? (
            <section className="mt-10 space-y-4">
              <h2 className="text-lg font-semibold text-white">Étapes complémentaires</h2>
              <ol className="space-y-3">
                {plan.parcoursSteps.map((step, index) => (
                  <li key={step.id} className={SALARIE_CARD}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex gap-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-sm font-bold text-violet-200">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-white">{step.title}</p>
                          <p className="mt-1 text-sm text-white/55">{step.description}</p>
                        </div>
                      </div>
                      <Link
                        href={step.href}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-violet-300 hover:text-violet-200"
                      >
                        Accéder
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
