"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BeyondCenterHeader } from "@/components/beyond-center/beyond-center-header";
import { BeyondCenterMarketingFooter, GlassLight } from "@/components/beyond-center/beyond-center-shared";
import { StepProgress } from "@/components/beyond-center/onboarding/step-progress";
import { getOnboardingDraft, parseEmails, setOnboardingDraft } from "@/components/beyond-center/onboarding/onboarding-store";

export default function InviteCollaboratorsPage() {
  const draft = getOnboardingDraft();
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const parsed = useMemo(() => parseEmails(raw), [raw]);

  const canProceed = Boolean(draft?.companyName) && parsed.length > 0;

  const save = () => {
    setError(null);
    if (!draft) {
      setError("Votre espace n’est pas encore créé. Revenez à l’étape précédente.");
      return;
    }
    if (parsed.length === 0) {
      setError("Ajoutez au moins un email.");
      return;
    }
    setOnboardingDraft({ ...draft, invitedEmails: parsed });
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900" style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <BeyondCenterHeader />
      <div className="mx-auto max-w-4xl px-6 py-14 md:px-8">
        <StepProgress current={3} total={6} title="Inviter vos collaborateurs" backHref="/beyond-center/onboarding/create-workspace" />

        <p className="max-w-2xl text-[15px] leading-relaxed text-slate-600">
          Invitez vos collaborateurs en 2 minutes. Collez les emails (un par ligne ou séparés par des virgules).
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-[1.4fr_0.6fr]">
          <GlassLight className="p-8" hoverLift={false}>
            <label className="text-[12px] font-semibold text-slate-800">Emails</label>
            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder={"alice@entreprise.com\nbob@entreprise.com"}
              rows={10}
              className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] outline-none focus:border-[#1D4ED8]"
            />
            {error ? <p className="mt-4 text-[12px] font-medium text-red-600">{error}</p> : null}
          </GlassLight>

          <GlassLight className="p-8" hoverLift={false}>
            <p className="text-[12px] font-semibold text-slate-800">Résumé</p>
            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
              <p className="text-[24px] font-semibold tracking-[-0.03em] text-slate-900">{parsed.length}</p>
              <p className="mt-1 text-[12px] text-slate-600">invitations prêtes</p>
            </div>
            <p className="mt-5 text-[12px] text-slate-500">
              Import CSV : simulé pour le moment (vous pourrez l’ajouter plus tard).
            </p>

            <div className="mt-8 space-y-3">
              <button
                type="button"
                onClick={save}
                className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-[14px] font-semibold text-slate-900 hover:bg-slate-50"
              >
                Enregistrer
              </button>
              <Link
                href="/beyond-center/onboarding/choose-diagnostic"
                onClick={save}
                className={`inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-[14px] font-semibold text-white ${
                  canProceed ? "bg-[#1D4ED8] hover:brightness-110" : "bg-slate-300 pointer-events-none"
                }`}
              >
                Valider les invitations ({parsed.length}) →
              </Link>
            </div>
          </GlassLight>
        </div>
      </div>

      <BeyondCenterMarketingFooter />
    </div>
  );
}

