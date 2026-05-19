"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import SidebarExpert from "@/components/SidebarExpert";
import { useSupabase } from "@/components/providers/supabase-provider";
import { cn } from "@/lib/utils";
import { Check, Sparkles } from "lucide-react";

type ExpertRow = {
  id: string;
  is_certified_beyond: boolean | null;
  certification_status: string | null;
};

function Pillar({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-2xl border px-5 py-4",
        active ? "border-emerald-400/25 bg-emerald-400/10" : "border-white/10 bg-white/5",
      )}
    >
      <div className="text-sm font-extrabold text-white">{label}</div>
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-2xl border",
          active ? "border-emerald-400/25 bg-emerald-400/10" : "border-white/10 bg-white/5",
        )}
      >
        <Check className={cn("h-5 w-5", active ? "text-emerald-300" : "text-white/30")} aria-hidden />
      </div>
    </div>
  );
}

export default function ExpertCertificationPage() {
  const supabase = useSupabase();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [expert, setExpert] = useState<ExpertRow | null>(null);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;
        if (!user) throw new Error("not_authenticated");

        const payment = String(searchParams.get("payment") ?? "").toLowerCase();
        if (payment === "success") {
          setShowPaymentSuccess(true);
          await supabase.from("experts").update({ certification_status: "training" }).eq("id", user.id);
        }

        const { data } = await supabase
          .from("experts")
          .select("id,is_certified_beyond,certification_status")
          .eq("id", user.id)
          .maybeSingle();
        if (!cancelled) setExpert((data ?? null) as ExpertRow | null);
      } catch {
        if (!cancelled) setExpert(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [searchParams, supabase]);

  const certified = useMemo(() => {
    if (!expert) return false;
    if (expert.is_certified_beyond === true) return true;
    return expert.certification_status === "certified";
  }, [expert]);

  const inTraining = useMemo(() => String(expert?.certification_status ?? "").toLowerCase() === "training", [expert]);

  return (
    <div className="min-h-screen bg-[#05060a] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#05060a]" />
        <div className="absolute -bottom-64 -left-64 h-[760px] w-[760px] rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.20),rgba(99,102,241,0.10),rgba(2,6,23,0)_60%)] blur-3xl" />
        <div className="absolute -top-64 -right-64 h-[680px] w-[680px] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.14),rgba(2,6,23,0)_62%)] blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),rgba(255,255,255,0))]" />
      </div>

      <SidebarExpert />
      <main className="relative mx-auto max-w-5xl px-6 py-10 pb-24 pl-[280px]">
        <header className="mb-10">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-white/55">Ma certification</div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">Beyond Certified</h1>
          <p className="mt-3 text-sm text-white/70">Les 3 piliers : Analyse, Posture, Impact.</p>
        </header>

        {showPaymentSuccess ? (
          <div className="mb-8 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-6">
            <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-100/80">
              Paiement confirmé
            </div>
            <div className="mt-2 text-xl font-extrabold tracking-tight text-white">
              Certification activée ! Bienvenue dans le parcours Premium.
            </div>
          </div>
        ) : null}

        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-2xl">
          {loading ? (
            <div className="space-y-3">
              <div className="h-14 rounded-2xl bg-white/10" />
              <div className="h-14 rounded-2xl bg-white/10" />
              <div className="h-14 rounded-2xl bg-white/10" />
            </div>
          ) : certified ? (
            <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10">
                  <Sparkles className="h-6 w-6 text-emerald-200" aria-hidden />
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-100/80">
                    Certification
                  </div>
                  <div className="mt-2 text-2xl font-extrabold tracking-tight text-white">
                    Expert Certifié
                  </div>
                  <div className="mt-3 text-sm text-emerald-100/90">
                    Badge actif — visibilité premium sur les recommandations RH.
                  </div>
                </div>
              </div>
            </div>
          ) : inTraining ? (
            <div className="rounded-3xl border border-indigo-400/20 bg-indigo-500/10 p-6 text-sm text-white/80">
              Parcours Premium actif. Suivez les modules pour valider : Analyse → Posture → Impact.
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
              Votre parcours de certification est géré par votre administrateur Beyond.
            </div>
          )}

          <div className="mt-6 grid gap-3">
            <Pillar label="Analyse" active={certified || inTraining} />
            <Pillar label="Posture" active={certified} />
            <Pillar label="Impact" active={certified} />
          </div>
        </section>
      </main>
    </div>
  );
}

