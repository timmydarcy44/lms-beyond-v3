"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BeyondCenterHeader } from "@/components/beyond-center/beyond-center-header";
import { BeyondCenterMarketingFooter, GlassLight } from "@/components/beyond-center/beyond-center-shared";
import { StepProgress } from "@/components/beyond-center/onboarding/step-progress";
import { clearOnboardingDraft, getOnboardingDraft } from "@/components/beyond-center/onboarding/onboarding-store";

export default function LaunchPilotPage() {
  const draft = getOnboardingDraft();
  const [launching, setLaunching] = useState(false);

  const summary = useMemo(() => {
    if (!draft) return null;
    const planLabel =
      draft.plan === "essentiel"
        ? "Essentiel — Piloter"
        : draft.plan === "avance"
          ? "Avancé — Transformer"
          : "Sur mesure — Partenariat";
    const goalLabel =
      draft.goal === "harmonie"
        ? "Harmonie d’équipe"
        : draft.goal === "communication"
          ? "Communication & silos"
          : draft.goal === "performance"
            ? "Performance individuelle"
            : "—";
    return {
      planLabel,
      goalLabel,
      collaborators: draft.collaboratorCount,
      invitations: draft.invitedEmails.length,
      company: draft.companyName,
      manager: draft.managerName,
    };
  }, [draft]);

  const canLaunch = Boolean(summary);

  const launch = async () => {
    if (!canLaunch) return;
    setLaunching(true);
    // Simulation : on “envoie” les emails et on initialise l’activité
    await new Promise((r) => setTimeout(r, 700));
    clearOnboardingDraft();
    window.location.href = "/dashboard/entreprise";
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900" style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <BeyondCenterHeader />
      <div className="mx-auto max-w-4xl px-6 py-14 md:px-8">
        <StepProgress current={5} total={6} title="Lancer le pilote" backHref="/beyond-center/onboarding/choose-diagnostic" />

        {!summary ? (
          <GlassLight className="p-8" hoverLift={false}>
            <p className="text-[15px] leading-relaxed text-slate-700">
              Votre onboarding n’est pas complet. Reprenez à l’étape 2.
            </p>
            <Link
              href="/beyond-center/onboarding/create-workspace"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-[#1D4ED8] px-6 py-3 text-[14px] font-semibold text-white hover:brightness-110"
            >
              Reprendre l’onboarding →
            </Link>
          </GlassLight>
        ) : (
          <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
            <GlassLight className="p-8" hoverLift={false}>
              <p className="text-[12px] font-semibold uppercase tracking-[0.28em] text-slate-400">Résumé</p>
              <h2 className="mt-3 text-[20px] font-semibold tracking-[-0.02em] text-slate-900">
                {summary.company}
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-slate-600">
                Manager principal : <span className="font-semibold text-slate-800">{summary.manager}</span>
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {[
                  { k: "Plan", v: summary.planLabel },
                  { k: "Objectif", v: summary.goalLabel },
                  { k: "Collaborateurs", v: String(summary.collaborators) },
                  { k: "Invitations", v: String(summary.invitations) },
                ].map((item) => (
                  <div key={item.k} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{item.k}</p>
                    <p className="mt-2 text-[14px] font-semibold text-slate-900">{item.v}</p>
                  </div>
                ))}
              </div>
            </GlassLight>

            <div className="space-y-6">
              <GlassLight className="p-8" hoverLift={false}>
                <h3 className="text-[16px] font-semibold text-slate-900">Prêt à activer</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-slate-600">
                  En un clic, vous lancez le diagnostic initial. Les invitations sont préparées (simulation pour le moment).
                </p>
                <button
                  type="button"
                  onClick={launch}
                  disabled={launching}
                  className={`mt-6 inline-flex w-full items-center justify-center rounded-2xl px-6 py-4 text-[15px] font-semibold text-white ${
                    launching ? "bg-emerald-400" : "bg-[#10B981] hover:brightness-110"
                  }`}
                >
                  {launching ? "Activation..." : "🚀 Lancer le diagnostic initial"}
                </button>
              </GlassLight>

              <Link
                href="/pricing"
                className="block text-center text-[13px] font-semibold text-slate-600 underline-offset-4 hover:underline"
              >
                Revoir les tarifs
              </Link>
            </div>
          </div>
        )}
      </div>

      <BeyondCenterMarketingFooter />
    </div>
  );
}

