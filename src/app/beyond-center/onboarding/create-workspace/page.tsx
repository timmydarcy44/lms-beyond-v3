"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { BeyondCenterHeader } from "@/components/beyond-center/beyond-center-header";
import { BeyondCenterMarketingFooter, GlassLight } from "@/components/beyond-center/beyond-center-shared";
import { StepProgress } from "@/components/beyond-center/onboarding/step-progress";
import { getOnboardingDraft, setOnboardingDraft, type OnboardingPlan } from "@/components/beyond-center/onboarding/onboarding-store";

export default function CreateWorkspacePage() {
  const params = useSearchParams();
  const preselectedPlan = (params.get("plan") as OnboardingPlan | null) ?? "essentiel";

  const existing = getOnboardingDraft();
  const [companyName, setCompanyName] = useState(existing?.companyName ?? "");
  const [managerName, setManagerName] = useState(existing?.managerName ?? "");
  const [logoUrl, setLogoUrl] = useState(existing?.companyLogoUrl ?? "");
  const [collaborators, setCollaborators] = useState<number>(existing?.collaboratorCount ?? 25);
  const [plan, setPlan] = useState<OnboardingPlan>(existing?.plan ?? preselectedPlan);
  const [error, setError] = useState<string | null>(null);

  const isValid = useMemo(() => companyName.trim().length > 1 && managerName.trim().length > 1, [companyName, managerName]);

  const save = () => {
    setError(null);
    if (!isValid) {
      setError("Merci de renseigner le nom de l’entreprise et le manager principal.");
      return;
    }
    setOnboardingDraft({
      companyName: companyName.trim(),
      managerName: managerName.trim(),
      companyLogoUrl: logoUrl.trim() ? logoUrl.trim() : undefined,
      collaboratorCount: Math.max(1, collaborators || 1),
      plan,
      invitedEmails: existing?.invitedEmails ?? [],
      goal: existing?.goal,
    });
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900" style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <BeyondCenterHeader />
      <div className="relative overflow-hidden border-t border-slate-200/80">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white" />
        <div className="relative mx-auto max-w-4xl px-6 py-14 md:px-8">
          <StepProgress current={2} total={6} title="Créer votre espace entreprise" backHref="/pricing" />

          <div className="grid gap-6 md:grid-cols-2">
            <GlassLight className="p-8" hoverLift={false}>
              <label className="text-[12px] font-semibold text-slate-800">Nom de l’entreprise</label>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex : Beyond Center"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] outline-none focus:border-[#1D4ED8]"
              />

              <label className="mt-6 block text-[12px] font-semibold text-slate-800">Logo (URL — optionnel)</label>
              <input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://…"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] outline-none focus:border-[#1D4ED8]"
              />

              <label className="mt-6 block text-[12px] font-semibold text-slate-800">Manager principal</label>
              <input
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                placeholder="Nom et prénom"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] outline-none focus:border-[#1D4ED8]"
              />

              {error ? <p className="mt-4 text-[12px] font-medium text-red-600">{error}</p> : null}
            </GlassLight>

            <GlassLight className="p-8" hoverLift={false}>
              <p className="text-[12px] font-semibold text-slate-800">Plan</p>
              <div className="mt-3 grid gap-2">
                {[
                  { key: "essentiel" as const, name: "Essentiel — Piloter" },
                  { key: "avance" as const, name: "Avancé — Transformer" },
                  { key: "sur-mesure" as const, name: "Sur mesure — Partenariat" },
                ].map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPlan(p.key)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-[14px] font-semibold transition-colors ${
                      plan === p.key ? "border-[#1D4ED8] bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <span>{p.name}</span>
                    <span className="text-[12px] font-medium text-slate-500">Sélectionner</span>
                  </button>
                ))}
              </div>

              <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                <p className="text-[12px] font-semibold text-slate-800">Collaborateurs</p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    className="h-10 w-10 rounded-xl border border-slate-200 bg-white text-[16px] font-semibold hover:bg-slate-50"
                    onClick={() => setCollaborators((v) => Math.max(1, v - 1))}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={collaborators}
                    min={1}
                    onChange={(e) => setCollaborators(Math.max(1, Number(e.target.value || 1)))}
                    className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-3 text-right text-[14px] font-semibold outline-none focus:border-[#1D4ED8]"
                  />
                  <button
                    type="button"
                    className="h-10 w-10 rounded-xl border border-slate-200 bg-white text-[16px] font-semibold hover:bg-slate-50"
                    onClick={() => setCollaborators((v) => v + 1)}
                  >
                    +
                  </button>
                </div>
                <p className="mt-3 text-[12px] text-slate-500">Vous pourrez ajuster ensuite.</p>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={save}
                  className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-[14px] font-semibold text-slate-900 hover:bg-slate-50"
                >
                  Enregistrer
                </button>
                <Link
                  href="/beyond-center/onboarding/invite-collaborators"
                  onClick={save}
                  className={`inline-flex flex-1 items-center justify-center rounded-full px-5 py-3 text-[14px] font-semibold text-white ${
                    isValid ? "bg-[#1D4ED8] hover:brightness-110" : "bg-slate-300 pointer-events-none"
                  }`}
                >
                  Suivant →
                </Link>
              </div>
            </GlassLight>
          </div>
        </div>
      </div>

      <BeyondCenterMarketingFooter />
    </div>
  );
}

