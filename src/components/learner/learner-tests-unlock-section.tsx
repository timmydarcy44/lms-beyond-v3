"use client";

import Link from "next/link";
import { Brain, Sparkles, Target } from "lucide-react";
import { SALARIE_CARD } from "@/lib/salarie/connect-nav";

const TESTS = [
  {
    id: "disc",
    label: "DISC",
    title: "Test comportemental",
    description: "Comprenez votre style relationnel et vos leviers de communication.",
    href: "/dashboard/salarie/test-disc",
    icon: Target,
    accent: "text-amber-300",
  },
  {
    id: "idmc",
    label: "IDMC",
    title: "Motivation & engagement",
    description: "Identifiez ce qui vous anime et ce qui freine votre progression.",
    href: "/dashboard/salarie/test-idmc",
    icon: Brain,
    accent: "text-blue-300",
  },
  {
    id: "soft",
    label: "Soft Skills",
    title: "Compétences comportementales",
    description: "Mesurez vos forces relationnelles et vos axes de développement.",
    href: "/dashboard/salarie/test-soft-skills",
    icon: Sparkles,
    accent: "text-violet-300",
  },
] as const;

type Props = {
  title?: string;
  lead?: string;
};

/** État vide incitatif — 3 cartes test avec CTA direct. */
export function LearnerTestsUnlockSection({
  title = "Complétez vos tests pour débloquer votre parcours personnalisé",
  lead = "EDGE diagnostique avant de former. Passez au moins un test pour recevoir des recommandations de coaching, formations et badges adaptés à votre profil.",
}: Props) {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-violet-400/20 bg-violet-500/[0.06] p-6">
        <p className="text-base font-semibold text-white">{title}</p>
        <p className="mt-2 text-sm text-white/60">{lead}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {TESTS.map((test) => {
          const Icon = test.icon;
          return (
            <article key={test.id} className={SALARIE_CARD}>
              <div className="flex items-center gap-2">
                <Icon className={`h-5 w-5 ${test.accent}`} />
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
                  {test.label}
                </p>
              </div>
              <h3 className="mt-3 text-lg font-bold text-white">{test.title}</h3>
              <p className="mt-2 text-sm text-white/55">{test.description}</p>
              <Link
                href={test.href}
                className="mt-5 inline-flex rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
              >
                Passer le test →
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function hasLearnerTestData(snapshot: {
  discScores?: unknown | null;
  idmcAxes?: unknown | null;
  softSkillsRadar?: unknown[];
} | null): boolean {
  if (!snapshot) return false;
  return Boolean(
    snapshot.discScores ||
      snapshot.idmcAxes ||
      (snapshot.softSkillsRadar && snapshot.softSkillsRadar.length > 0),
  );
}
