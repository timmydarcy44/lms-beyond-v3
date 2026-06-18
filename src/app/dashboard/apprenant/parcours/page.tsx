"use client";

import Link from "next/link";
import { ArrowRight, Award, BookOpen, Sparkles, Users } from "lucide-react";
import { PersonalizedActionPlanSection } from "@/components/learner/personalized-action-plan-section";
import { usePersonalizedActionPlan } from "@/hooks/use-personalized-action-plan";
import {
  APPRENANT_CARD_BODY,
  APPRENANT_PAGE_KICKER,
  APPRENANT_PAGE_LEAD,
  APPRENANT_PAGE_SHELL,
  APPRENANT_PAGE_TITLE,
} from "@/lib/apprenant/connect-nav";

const STEP_ICON = {
  formation: BookOpen,
  coaching: Users,
  badge: Award,
  micro_formation: Sparkles,
} as const;

export default function ApprenantParcoursPage() {
  const { loading, plan, parcoursHref } = usePersonalizedActionPlan("apprenant");

  return (
    <div className={APPRENANT_PAGE_SHELL}>
      <section className="mb-8 space-y-2">
        <p className={APPRENANT_PAGE_KICKER}>Parcours personnalisé</p>
        <h1 className={APPRENANT_PAGE_TITLE}>Mon parcours EDGE</h1>
        <p className={APPRENANT_PAGE_LEAD}>
          Formations, micro-formations, coachings et Open Badges recommandés selon vos résultats et
          votre profil professionnel.
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
                <li key={step.id} className={APPRENANT_CARD_BODY}>
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
