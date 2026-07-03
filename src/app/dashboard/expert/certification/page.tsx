"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Award, Check, Sparkles } from "lucide-react";
import SidebarExpert from "@/components/SidebarExpert";
import { useExpertAccess } from "@/components/expert/expert-access-provider";
import { useSupabase } from "@/components/providers/supabase-provider";
import {
  edgeCertificationLabel,
  isEdgeCertificationInProgress,
  isEdgeCertified,
} from "@/lib/expert/expert-certification";
import { cn } from "@/lib/utils";

const BENEFITS = [
  "Référencement prioritaire",
  "Badge EDGE Certified",
  "Accès aux missions qualifiées",
  "Méthode pédagogique EDGE",
  "Outils de suivi et d'impact",
  "Standard qualité commun",
];

function Pillar({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-2xl border px-5 py-4",
        active ? "border-[#635BFF]/20 bg-[#635BFF]/8" : "border-[#050505]/8 bg-[#F7F7F5]",
      )}
    >
      <span className="text-sm font-medium">{label}</span>
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-xl",
          active ? "bg-[#635BFF] text-white" : "bg-[#050505]/5 text-[#050505]/30",
        )}
      >
        <Check className="h-4 w-4" aria-hidden />
      </span>
    </div>
  );
}

export default function ExpertCertificationPage() {
  const { expert, isApproved } = useExpertAccess();
  const supabase = useSupabase();
  const searchParams = useSearchParams();
  const [certStatus, setCertStatus] = useState(expert.certification_status);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function sync() {
      const payment = String(searchParams.get("payment") ?? "").toLowerCase();
      if (payment === "success") {
        setShowPaymentSuccess(true);
        await supabase.from("experts").update({ certification_status: "training" }).eq("id", expert.id);
        if (!cancelled) setCertStatus("training");
      }
    }
    sync();
    return () => {
      cancelled = true;
    };
  }, [expert.id, searchParams, supabase]);

  const certified = isEdgeCertified({ ...expert, certification_status: certStatus });
  const inTraining = isEdgeCertificationInProgress({ certification_status: certStatus });
  const label = edgeCertificationLabel({ ...expert, certification_status: certStatus });

  const pillarsActive = useMemo(
    () => ({
      analyse: certified || inTraining,
      posture: certified,
      impact: certified,
    }),
    [certified, inTraining],
  );

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#050505]">
      <SidebarExpert restricted={!isApproved} />
      <main className="min-h-screen pl-[260px]">
        <div className="mx-auto max-w-4xl px-6 py-10 pb-24">
          <header className="mb-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#635BFF]">Certification</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Devenir EDGE Certified</h1>
            <p className="mt-3 max-w-2xl text-sm text-[#050505]/60">
              Un parcours qualité pour aligner vos interventions avec la méthode EDGE, renforcer votre visibilité et
              accéder aux missions prioritaires.
            </p>
          </header>

          {showPaymentSuccess ? (
            <div className="mb-8 rounded-[28px] border border-[#635BFF]/20 bg-[#635BFF]/8 p-6">
              <p className="text-sm font-semibold text-[#635BFF]">Paiement confirmé</p>
              <p className="mt-2 text-lg font-semibold">Bienvenue dans le parcours EDGE Certified.</p>
            </div>
          ) : null}

          <section className="rounded-[28px] border border-[#050505]/8 bg-white p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#635BFF]/20 bg-[#635BFF]/8">
                <Award className="h-6 w-6 text-[#635BFF]" aria-hidden />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#050505]/40">Votre statut</p>
                <p className="mt-1 text-xl font-semibold">{label}</p>
                {expert.wants_certification && !certified && !inTraining ? (
                  <p className="mt-2 text-sm text-[#050505]/55">
                    Votre demande EDGE Certified est bien enregistrée. Statut : en attente de validation.
                  </p>
                ) : null}
                {!expert.wants_certification && !certified && !inTraining ? (
                  <p className="mt-2 text-sm text-[#050505]/55">
                    Vous pourrez rejoindre le parcours EDGE Certified après validation de votre profil.
                  </p>
                ) : null}
                {certified ? (
                  <p className="mt-2 text-sm text-[#050505]/55">
                    Badge actif — visibilité renforcée dans le réseau EDGE.
                  </p>
                ) : null}
                {inTraining ? (
                  <p className="mt-2 text-sm text-[#050505]/55">
                    Parcours en cours. Validez les modules : Analyse → Posture → Impact.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {BENEFITS.map((benefit) => (
                <div
                  key={benefit}
                  className="flex items-center gap-2 rounded-xl border border-[#050505]/8 bg-[#F7F7F5] px-4 py-3 text-sm"
                >
                  <Sparkles className="h-4 w-4 shrink-0 text-[#635BFF]" aria-hidden />
                  {benefit}
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-3">
              <Pillar label="Analyse" active={pillarsActive.analyse} />
              <Pillar label="Posture" active={pillarsActive.posture} />
              <Pillar label="Impact" active={pillarsActive.impact} />
            </div>

            {!certified && isApproved ? (
              <Link
                href="/dashboard/expert/certification?payment=success"
                className="mt-8 inline-flex items-center justify-center rounded-2xl bg-[#635BFF] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#7B74FF]"
              >
                Découvrir le parcours EDGE Certified
              </Link>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}
