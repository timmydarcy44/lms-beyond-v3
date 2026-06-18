"use client";

import Link from "next/link";
import { ArrowRight, Award, BookOpen, Sparkles, Users } from "lucide-react";
import { PersonalizedActionPlanSection } from "@/components/learner/personalized-action-plan-section";
import { usePersonalizedActionPlanFromSnapshot } from "@/components/learner/learner-snapshot-provider";
import {
  SALARIE_CARD,
  SALARIE_PAGE_KICKER,
  SALARIE_PAGE_LEAD,
  SALARIE_PAGE_SHELL,
  SALARIE_PAGE_TITLE,
} from "@/lib/salarie/connect-nav";

const STEP_ICON = {
  formation: BookOpen,
  coaching: Users,
  badge: Award,
  micro_formation: Sparkles,
} as const;

export default function SalarieParcoursPage() {
  const { loading, plan, parcoursHref } = usePersonalizedActionPlanFromSnapshot("salarie");

  return (
    <div className={SALARIE_PAGE_SHELL}>
      <section className="mb-8 space-y-2">
        <p className={SALARIE_PAGE_KICKER}>Parcours personnalisé</p>
        <h1 className={SALARIE_PAGE_TITLE}>Mon parcours EDGE</h1>
        <p className={SALARIE_PAGE_LEAD}>
          Un enchaînement de formations, micro-formations, coachings et Open Badges construit à
          partir de vos tests, de votre poste et des besoins identifiés par votre entreprise.
        </p>
      </section>

      <PersonalizedActionPlanSection
        loading={loading}
        plan={plan}
        parcoursHref={parcoursHref}
        className="mb-10"
      />

      {plan?.parcoursSteps.length ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Étapes de votre parcours</h2>
          <ol className="space-y-3">
            {plan.parcoursSteps.map((step, index) => {
              const Icon = STEP_ICON[step.kind];
              return (
                <li key={step.id} className={SALARIE_CARD}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-sm font-bold text-violet-200">
                        {index + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-violet-300" />
                          <p className="font-semibold text-white">{step.title}</p>
                        </div>
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
              );
            })}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
