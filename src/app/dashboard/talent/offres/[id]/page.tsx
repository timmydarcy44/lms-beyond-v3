"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Target, Zap } from "lucide-react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { TalentDashboardShell } from "@/components/beyond-connect/talent-dashboard-shell";
import { toast } from "sonner";

type JobOffer = {
  id: string;
  title?: string | null;
  city?: string | null;
  contract_type?: string | null;
  salary_range?: string | null;
  description?: string | null;
  requirements?: string | null;
};

export default function TalentOfferDetailPage() {
  const params = useParams<{ id: string }>();
  const supabase = useSupabase();
  const [offer, setOffer] = useState<JobOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    const loadOffer = async () => {
      if (!supabase) return;
      setLoading(true);
      const { data } = await supabase
        .from("job_offers")
        .select("id, title, city, contract_type, salary_range, description, requirements")
        .eq("id", params.id)
        .maybeSingle();
      setOffer(data || null);
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.id) {
        const { data: existing } = await supabase
          .from("applications")
          .select("id")
          .eq("job_id", params.id)
          .eq("talent_id", userData.user.id)
          .maybeSingle();
        setApplied(!!existing);
      }
      setLoading(false);
    };
    loadOffer();
  }, [supabase, params.id]);

  const handleApply = async () => {
    if (!supabase || applying || applied || !offer) return;
    setApplying(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) {
        setApplying(false);
        return;
      }
      const { error } = await supabase.from("applications").insert({
        job_id: offer.id,
        talent_id: userId,
      });
      if (error) {
        toast.error("Erreur de connexion à la base de données.");
      } else {
        setApplied(true);
        toast.success("Candidature envoyée ✅");
      }
    } catch (error) {
      toast.error("Erreur de connexion à la base de données.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <TalentDashboardShell>
      <div className="space-y-6 bg-slate-50 px-6 py-10">
        <Link
          href="/dashboard/talent/offres"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-black"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux offres
        </Link>

        {loading ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-gray-500 shadow-sm">
            Chargement...
          </div>
        ) : offer ? (
          <div className="grid gap-6 lg:grid-cols-[2.3fr_1fr]">
            <div className="rounded-3xl border border-white/40 bg-white/70 p-8 shadow-xl backdrop-blur-xl">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-semibold text-black">{offer.title || "Offre"}</h1>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                  {offer.contract_type || "Contrat"}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-500">{offer.city || "Ville non precisee"}</p>

              <div className="mt-8 space-y-6 text-sm text-black/70">
                <section>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-black/50">
                    <Target className="h-4 w-4 text-black/40" />
                    Missions
                  </div>
                  <p className="mt-3 whitespace-pre-line text-sm text-black/70">
                    {offer.description || "Descriptif non disponible."}
                  </p>
                </section>
                {offer.requirements ? (
                  <section>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-black/50">
                      <Zap className="h-4 w-4 text-black/40" />
                      Environnement & Profil
                    </div>
                    <p className="mt-3 whitespace-pre-line text-sm text-black/70">{offer.requirements}</p>
                  </section>
                ) : null}
              </div>
            </div>
            <div className="h-fit rounded-3xl border border-white/50 bg-white/80 p-6 shadow-lg backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Informations cles</p>
              <div className="mt-4 space-y-3 text-sm text-black/70">
                <div>
                  <p className="text-xs text-black/40">Ville</p>
                  <p className="font-semibold text-black">{offer.city || "Ville non precisee"}</p>
                </div>
                <div>
                  <p className="text-xs text-black/40">Salaire</p>
                  <p className="font-semibold text-black">{offer.salary_range || "Non precise"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleApply}
                disabled={applied || applying}
                className={`mt-6 inline-flex w-full items-center justify-center rounded-2xl py-4 text-base font-semibold shadow-xl transition ${
                  applied
                    ? "cursor-not-allowed bg-gray-200 text-gray-500"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-[1.01]"
                }`}
              >
                {applied ? "Candidature envoyée ✅" : applying ? "Envoi en cours..." : "Postuler a cette offre"}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-gray-500 shadow-sm">
            Offre introuvable.
          </div>
        )}
      </div>
    </TalentDashboardShell>
  );
}
