"use client";

import Link from "next/link";
import { ArrowRight, Award, BookOpen, Sparkles, Users } from "lucide-react";
import type { PersonalizedActionPlan } from "@/lib/learner/personalized-action-plan";
import { cn } from "@/lib/utils";

type Props = {
  plan: PersonalizedActionPlan | null;
  loading?: boolean;
  parcoursHref: string;
  className?: string;
};

const KIND_ICON = {
  formation: BookOpen,
  coaching: Users,
  badge: Award,
  micro_formation: Sparkles,
} as const;

export function PersonalizedActionPlanSection({
  plan,
  loading,
  parcoursHref,
  className,
}: Props) {
  if (loading) {
    return (
      <div className={cn("rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8", className)}>
        <div className="h-6 w-2/3 animate-pulse rounded bg-white/10" />
        <div className="mt-4 h-4 w-full animate-pulse rounded bg-white/[0.06]" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className={cn("rounded-2xl border border-violet-400/20 bg-violet-500/[0.06] p-6", className)}>
        <p className="text-sm font-semibold text-white">Plan d&apos;action personnalisé</p>
        <p className="mt-2 text-sm text-white/60">
          Passez vos tests DISC, IDMC et Soft Skills pour recevoir des parcours EDGE, accompagnements et
          badges adaptés à votre profil.
        </p>
      </div>
    );
  }

  return (
    <section className={cn("space-y-6", className)}>
      <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/15 via-indigo-500/10 to-transparent p-6 sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-200/80">
          Plan d&apos;action personnalisé
        </p>
        <h2 className="mt-3 text-xl font-bold leading-snug text-white sm:text-2xl">{plan.headline}</h2>
        <p className="mt-3 max-w-3xl text-sm text-white/70">{plan.summary}</p>
        {plan.nextStep ? (
          <div className="mt-5 rounded-xl border border-white/15 bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200/90">
              {plan.nextStep.title}
            </p>
            <p className="mt-2 text-sm text-white/75">
              Vous pourriez augmenter votre compatibilité de{" "}
              <span className="font-semibold text-emerald-300">+{plan.nextStep.impactPercent} %</span> en travaillant :
            </p>
            <ul className="mt-2 list-inside list-disc text-sm text-white/80">
              {plan.nextStep.skills.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
            <Link
              href={plan.nextStep.primaryHref}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-gray-950 hover:bg-white/90"
            >
              {plan.nextStep.primaryLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : null}
        {plan.needs.length ? (
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
        <Link
          href={parcoursHref}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-gray-950 hover:bg-white/90"
        >
          Voir mes parcours EDGE
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {plan.items.map((item) => {
          const Icon = KIND_ICON[item.kind];
          return (
            <Link
              key={item.id}
              href={item.href}
              className="group rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-white group-hover:text-violet-100">{item.title}</p>
                  <p className="mt-1 text-xs text-violet-200/70">{item.reason}</p>
                  <p className="mt-2 text-sm text-white/55">{item.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
