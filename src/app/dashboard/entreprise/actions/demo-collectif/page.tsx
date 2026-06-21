"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { useSupabase } from "@/components/providers/supabase-provider";
import { cn } from "@/lib/utils";
import { Check, CheckCircle2, User, X } from "lucide-react";
import { toast } from "sonner";

const SOPHIE_PHOTO =
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&h=200&fit=crop";

type ExpertRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  headline: string | null;
  bio: string | null;
  certification_status: string | null;
  photo_url: string | null;
  specialties: string[] | null;
  is_active: boolean | null;
};

export default function DemoCollectifActionPage() {
  const router = useRouter();
  const supabase = useSupabase();
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const [expert, setExpert] = useState<ExpertRow | null>(null);
  const [expertLoading, setExpertLoading] = useState(true);

  const [expandedSearch, setExpandedSearch] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setExpertLoading(true);
      setExpandedSearch(false);
      try {
        const base = supabase
          .from("experts")
          .select("id,first_name,last_name,headline,bio,certification_status,photo_url,specialties,is_active")
          .eq("is_active", true);

        const { data: strict, error: strictError } = await base
          .contains("specialties", ["collectif", "engineering"])
          .limit(25);
        if (strictError) throw strictError;

        const rank = (s: string | null) => (s === "certified" ? 3 : s === "training" ? 2 : 1);
        const preferSophie = (e: ExpertRow) => ((e.last_name ?? "").toLowerCase() === "vallet" ? 1 : 0);
        const sortedStrict = ((strict ?? []) as ExpertRow[]).sort((a, b) => {
          const byStatus = rank(b.certification_status) - rank(a.certification_status);
          if (byStatus !== 0) return byStatus;
          const bySophie = preferSophie(b) - preferSophie(a);
          if (bySophie !== 0) return bySophie;
          return (a.last_name ?? "").localeCompare(b.last_name ?? "");
        });

        if (sortedStrict.length > 0) {
          if (!cancelled) setExpert(sortedStrict[0] ?? null);
          return;
        }

        // Fallback: collectif only (admin warning)
        const { data: broad, error: broadError } = await base.contains("specialties", ["collectif"]).limit(25);
        if (broadError) throw broadError;
        const sortedBroad = ((broad ?? []) as ExpertRow[]).sort((a, b) => {
          const byStatus = rank(b.certification_status) - rank(a.certification_status);
          if (byStatus !== 0) return byStatus;
          const bySophie = preferSophie(b) - preferSophie(a);
          if (bySophie !== 0) return bySophie;
          return (a.last_name ?? "").localeCompare(b.last_name ?? "");
        });
        if (!cancelled) {
          setExpandedSearch(true);
          setExpert(sortedBroad[0] ?? null);
        }
      } catch {
        if (!cancelled) setExpert(null);
      } finally {
        if (!cancelled) setExpertLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const expertName = useMemo(() => {
    const first = expert?.first_name?.trim() ?? "Sophie";
    const last = expert?.last_name?.trim() ?? "Vallet";
    return `${first} ${last}`.trim();
  }, [expert]);

  const expertLastName = useMemo(() => expert?.last_name?.trim() ?? "Vallet", [expert]);
  const expertHeadline = useMemo(
    () => expert?.headline?.trim() ?? "Facilitatrice de sessions complexes & Performance Collective",
    [expert],
  );
  const expertBio = useMemo(
    () =>
      expert?.bio?.trim() ??
      "Experte en régulation des dynamiques de groupe et leadership partagé.",
    [expert],
  );
  const expertIsCertified = expert?.certification_status === "certified";
  const expertPhoto = (expert?.photo_url && expert.photo_url.startsWith("http") ? expert.photo_url : null) ?? SOPHIE_PHOTO;

  const handleValidate = async () => {
    if (processing || confirmed) return;
    setProcessing(true);
    try {
      const payload = {
        expert_id: expert?.id ?? "68f42af8-61a4-472a-89e3-3fca38b29c64",
        action_type: "group_workshop",
        target_label: "Équipe Engineering",
        target_count: 7,
        status: "expert_notified",
        metadata: { topic: "Cohésion & Alignement" },
      };
      const { error } = await supabase.from("action_requests").insert(payload);
      if (error) throw error;
      setOpen(true);
    } catch {
      toast.error("Erreur lors de l'activation. Veuillez réessayer.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05060a] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#05060a]" />
        <div className="absolute -bottom-64 -left-64 h-[760px] w-[760px] rounded-full bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.34),rgba(99,102,241,0.14),rgba(2,6,23,0)_60%)] blur-3xl" />
        <div className="absolute -top-64 -right-64 h-[680px] w-[680px] rounded-full bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.16),rgba(2,6,23,0)_62%)] blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),rgba(255,255,255,0))]" />
      </div>

      <EnterpriseSidebar />
      <main className="relative min-h-screen px-8 py-10 pb-24 lg:pl-[280px]">
        {/* Header */}
        <section className="rounded-3xl border border-white/10 bg-white/5 p-7 shadow-[0_18px_70px_rgba(0,0,0,0.40)] backdrop-blur-2xl">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                Diagnostic : Baisse d'efficience opérationnelle (Équipe Engineering)
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-white/70">
                Pattern identifié de saturation cognitive et perte d'alignement
              </p>
            </div>
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/80">
              👥 7 collaborateurs détectés
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Recommendation / Workshop */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-2xl">
            <div className="mb-4 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-white/70">
              Atelier de transformation collective
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">
              Atelier : Cohésion & Accélération de la Roadmap
            </h2>
            <div className="mt-6 space-y-4 text-sm text-white/75">
              <p>
                <span className="font-extrabold text-white">Objectif :</span> Transformer les zones de friction en leviers
                d'agilité pour le Q3.
              </p>
              <p>
                <span className="font-extrabold text-white">Format :</span> Session intensive de 2h (Présentiel recommandé).
              </p>
              <p>
                <span className="font-extrabold text-white">ROI :</span> Alignement stratégique immédiat et sécurisation des
                livrables.
              </p>
            </div>

            <div className="mt-7 rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="text-xs font-black uppercase tracking-[0.22em] text-white/55">Synthèse</div>
              <p className="mt-3 text-sm text-white/70">
                Une session ciblée pour réaligner priorités, clarifier les arbitrages et sécuriser la vélocité d'exécution.
              </p>
            </div>
          </div>

          {/* Expert */}
          <aside className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-2xl">
            <div className="text-xs font-black uppercase tracking-[0.22em] text-white/55">Expert</div>
            {expandedSearch ? (
              <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-xs font-semibold text-amber-100/90">
                Recherche élargie : aucun expert exact “collectif + engineering” n’a été trouvé. Sélection basée sur
                “collectif”.
              </div>
            ) : null}
            <div className="mt-5 flex items-start gap-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                {imageFailed ? (
                  <div className="flex h-full w-full items-center justify-center bg-white/5 text-white/70">
                    <User className="h-7 w-7" aria-hidden />
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={expertPhoto}
                    alt={expertName}
                    className="h-full w-full object-cover"
                    onError={() => setImageFailed(true)}
                  />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-lg font-extrabold tracking-tight text-white">{expertName}</div>
                  {expertIsCertified ? (
                    <span
                      className="inline-flex items-center rounded-full border border-violet-400/30 bg-violet-500/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-violet-100 shadow-[0_0_24px_rgba(168,85,247,0.35)]"
                      title="Cet expert a validé le cursus Beyond sur la performance cognitive."
                    >
                      Certifié Beyond
                    </span>
                  ) : null}
                </div>
                {expertIsCertified ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/55">
                      Compétences validées
                    </span>
                    <span
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-white/80"
                      title="Badge obtenu via le parcours de formation Analyse Cognitive. Preuve de compétence vérifiée par Beyond."
                    >
                      <span aria-hidden>🧠</span> Analyse Cognitive
                    </span>
                    <span
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-white/80"
                      title="Badge obtenu via le parcours de formation Facilitation Collective. Preuve de compétence vérifiée par Beyond."
                    >
                      <span aria-hidden>👥</span> Facilitation Collective
                    </span>
                    <span
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-white/80"
                      title="Badge obtenu via le parcours de formation Méthodologie Beyond. Preuve de compétence vérifiée par Beyond."
                    >
                      <span aria-hidden>📈</span> Méthodologie Beyond
                    </span>
                  </div>
                ) : null}
                {expertIsCertified ? (
                  <div
                    className="mt-2 inline-flex flex-wrap items-center gap-2 text-xs font-bold text-violet-100/90"
                    title="Certification obtenue après validation du parcours pédagogique Beyond (Diagnostic, Posture & Méthodologie)."
                  >
                    <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1">
                      <Check className="h-3.5 w-3.5 text-violet-200" aria-hidden />
                      Analyse
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1">
                      <Check className="h-3.5 w-3.5 text-violet-200" aria-hidden />
                      Posture
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1">
                      <Check className="h-3.5 w-3.5 text-violet-200" aria-hidden />
                      Impact
                    </span>
                  </div>
                ) : null}
                <div className="mt-1 text-sm font-semibold text-white/70">{expertHeadline}</div>
                {expertLoading ? (
                  <div className="mt-2 h-3 w-44 rounded bg-white/10" />
                ) : null}
              </div>
            </div>
            {expertIsCertified ? (
              <div className="mt-5 rounded-3xl border border-violet-400/20 bg-violet-500/10 p-5 text-sm text-white/75">
                <span className="font-extrabold text-white">Recommandation Prioritaire :</span> Cet expert maîtrise la
                méthodologie Beyond dédiée aux équipes Engineering.
              </div>
            ) : null}
            <p className="mt-5 text-sm text-white/70">
              <span className="font-extrabold text-white">Bio :</span> {expertBio}
            </p>

            <button
              type="button"
              onClick={() => router.push("/dashboard/entreprise")}
              className="mt-7 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white/80 hover:bg-white/10"
            >
              Retour au Dashboard
            </button>
          </aside>
        </section>

        {/* CTA */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-2xl">
          <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
            <div className="min-w-0">
              <div className="text-xs font-black uppercase tracking-[0.22em] text-white/55">Validation</div>
              <div className="mt-2 text-lg font-extrabold tracking-tight text-white">
                {confirmed ? "Atelier validé" : "Prêt à déclencher l'atelier"}
              </div>
              <p className="mt-2 text-sm text-white/70">
                {confirmed
                  ? "Confirmation envoyée. Sophie Vallet prend contact avec vous sous 24h pour l'organisation logistique."
                  : "Validation instantanée pour lancer la prise de contact et planifier."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleValidate}
              disabled={confirmed}
              className={cn(
                "w-full md:w-auto rounded-2xl px-7 py-4 text-xs font-black uppercase tracking-[0.18em] transition",
                confirmed ? "cursor-not-allowed bg-white/10 text-white/40" : "bg-white text-black hover:bg-white/90",
              )}
            >
              {processing ? "Enregistrement de l'intervention..." : "VALIDER L'ATELIER ET PLANIFIER"}
            </button>
          </div>
        </section>

        {/* Modal */}
        {open ? (
          <div className="fixed inset-0 z-50">
            <button
              type="button"
              className="absolute inset-0 bg-black/65 backdrop-blur-sm"
              aria-label="Fermer"
              onClick={() => setOpen(false)}
            />
            <div className="relative mx-auto flex min-h-full max-w-2xl items-end p-6 sm:items-center">
              <div className="w-full rounded-3xl border border-white/10 bg-[#0b0d14]/90 p-7 shadow-[0_22px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-white/55">Planification</div>
                    <h4 className="mt-2 text-xl font-extrabold tracking-tight text-white">
                      Valider l'atelier et planifier
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-2xl border border-white/10 bg-white/5 p-2 text-white/75 hover:bg-white/10"
                    aria-label="Fermer la modale"
                  >
                    <X className="h-5 w-5" aria-hidden />
                  </button>
                </div>

                <div className="mt-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-300" aria-hidden />
                    <p className="text-sm text-emerald-100/90">
                      Atelier lancé. Sophie Vallet a été notifiée pour l'équipe Engineering.
                    </p>
                  </div>
                </div>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white/80 hover:bg-white/10"
                  >
                    Fermer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmed(true);
                      setOpen(false);
                      router.push("/dashboard/entreprise?action=success");
                    }}
                    className="rounded-2xl bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-black hover:bg-white/90"
                  >
                    Retour au pilotage
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

