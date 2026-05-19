"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BeyondCenterHeader } from "@/components/beyond-center/beyond-center-header";
import { BeyondCenterMarketingFooter, GlassLight } from "@/components/beyond-center/beyond-center-shared";
import { StepProgress } from "@/components/beyond-center/onboarding/step-progress";
import { getOnboardingDraft, setOnboardingDraft, type DiagnosticGoal } from "@/components/beyond-center/onboarding/onboarding-store";
import { MessageSquare, Sparkles, Users } from "lucide-react";

export default function ChooseDiagnosticPage() {
  const draft = getOnboardingDraft();
  const [goal, setGoal] = useState<DiagnosticGoal | null>(draft?.goal ?? null);
  const canProceed = Boolean(draft?.companyName) && Boolean(goal);

  const next = useMemo(() => {
    if (!draft || !goal) return null;
    return { ...draft, goal };
  }, [draft, goal]);

  const save = () => {
    if (!next) return;
    setOnboardingDraft(next);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900" style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <BeyondCenterHeader />
      <div className="mx-auto max-w-4xl px-6 py-14 md:px-8">
        <StepProgress current={4} total={6} title="Choisir votre objectif de diagnostic" backHref="/beyond-center/onboarding/invite-collaborators" />
        <p className="max-w-2xl text-[15px] leading-relaxed text-slate-600">
          Ne multiplions pas les options. Choisissez un parcours simple, puis ajustez ensuite.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              key: "harmonie" as const,
              icon: Users,
              title: "Harmonie d’équipe",
              desc: "Comprendre et améliorer le fonctionnement collectif.",
            },
            {
              key: "communication" as const,
              icon: MessageSquare,
              title: "Communication & silos",
              desc: "Briser les silos et fluidifier les échanges.",
            },
            {
              key: "performance" as const,
              icon: Sparkles,
              title: "Performance individuelle",
              desc: "Développer l’efficacité de chaque collaborateur.",
            },
          ].map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setGoal(c.key)}
              className={`text-left rounded-2xl border p-7 transition-colors ${
                goal === c.key ? "border-[#1D4ED8] bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900">
                <c.icon className="h-5 w-5" strokeWidth={1.6} aria-hidden />
              </div>
              <h3 className="mt-5 text-[17px] font-semibold tracking-[-0.02em] text-slate-900">{c.title}</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-slate-600">{c.desc}</p>
            </button>
          ))}
        </div>

        <GlassLight className="mt-10 p-7" hoverLift={false}>
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <p className="text-[14px] font-medium text-slate-700">
              Vous pourrez changer l’objectif après le diagnostic initial.
            </p>
            <Link
              href="/beyond-center/onboarding/launch-pilot"
              onClick={save}
              className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-[14px] font-semibold text-white ${
                canProceed ? "bg-[#1D4ED8] hover:brightness-110" : "bg-slate-300 pointer-events-none"
              }`}
            >
              Suivant →
            </Link>
          </div>
        </GlassLight>
      </div>
      <BeyondCenterMarketingFooter />
    </div>
  );
}

