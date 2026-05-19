"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { useSupabase } from "@/components/providers/supabase-provider";
import { cn } from "@/lib/utils";
import { Award, CheckCircle2, Target, Timer, TrendingUp, X } from "lucide-react";

type ExpertCard = {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  angle: string;
  photoUrl?: string;
  cardStyle: "primary" | "alt";
};

const MOCK_EXPERTS: ExpertCard[] = [
  {
    id: "sophie-vallet",
    firstName: "Sophie",
    lastName: "Vallet",
    title: "Neurosciences & Performance",
    angle: "Pourquoi Sophie ? Recommandée pour son expertise en régulation émotionnelle sous pression.",
    photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&h=200&fit=crop",
    cardStyle: "primary",
  },
  {
    id: "thomas-riva",
    firstName: "Thomas",
    lastName: "Riva",
    title: "Transformation Agile",
    angle: "Alternative : structurer les rituels et accélérer la coordination.",
    cardStyle: "alt",
  },
];

type ExpertRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  specialty: string | null;
};

function initials(first: string | null, last: string | null) {
  const a = (first?.trim()[0] ?? "").toUpperCase();
  const b = (last?.trim()[0] ?? "").toUpperCase();
  return (a + b || "BC").slice(0, 2);
}

function Avatar({
  first,
  last,
  photoUrl,
}: {
  first: string | null;
  last: string | null;
  photoUrl?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl",
        "border border-white/10 bg-white/5 backdrop-blur-xl",
      )}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-95" />
      ) : (
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/20 via-indigo-500/10 to-transparent"
          aria-hidden
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-black/20" aria-hidden />
      <div className="relative text-sm font-extrabold tracking-tight text-white/90">{initials(first, last)}</div>
    </div>
  );
}

export default function DemoStressActionPage() {
  const router = useRouter();
  const supabase = useSupabase();

  const [selectedExpertId, setSelectedExpertId] = useState<string>("sophie-vallet");
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [expertsLive, setExpertsLive] = useState<ExpertRow[] | null>(null);
  const [expertsLiveLoading, setExpertsLiveLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadExperts() {
      setExpertsLiveLoading(true);
      try {
        const { data, error } = await supabase.from("experts").select("id,first_name,last_name,specialty").limit(2);
        if (error) throw error;
        if (!cancelled) setExpertsLive((data ?? []) as ExpertRow[]);
      } catch {
        if (!cancelled) setExpertsLive(null);
      } finally {
        if (!cancelled) setExpertsLiveLoading(false);
      }
    }
    loadExperts();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const expertsToRender: ExpertCard[] = useMemo(() => {
    if (!expertsLive || expertsLive.length === 0) return MOCK_EXPERTS;
    const mapped = expertsLive.map((e, idx) => ({
      id: e.id,
      firstName: e.first_name ?? (idx === 0 ? "Sophie" : "Thomas"),
      lastName: e.last_name ?? (idx === 0 ? "Vallet" : "Riva"),
      title: e.specialty ?? (idx === 0 ? "Neurosciences & Performance" : "Transformation Agile"),
      angle:
        idx === 0
          ? "Pourquoi Sophie ? Recommandée pour son expertise en régulation émotionnelle sous pression."
          : "Alternative : structurer les rituels et accélérer la coordination.",
      photoUrl: idx === 0 ? MOCK_EXPERTS[0]!.photoUrl : undefined,
      cardStyle: idx === 0 ? "primary" : "alt",
    }));
    if (!mapped.some((m) => m.id === selectedExpertId)) setSelectedExpertId("sophie-vallet");
    return mapped;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expertsLive]);

  const selected = expertsToRender.find((e) => e.id === selectedExpertId) ?? expertsToRender[0] ?? MOCK_EXPERTS[0]!;

  const handleValidate = async () => {
    setConfirming(true);
    setConfirmed(false);
    try {
      // Best-effort demo: do not fail UI if DB isn't writable.
      await supabase.from("recommended_actions").update({ status: "confirmed" }).eq("id", "demo-stress");
    } catch {
      // ignore for demo
    } finally {
      setConfirming(false);
      setConfirmed(true);
    }
  };

  const handleCtaClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmIntervention = async () => {
    setShowConfirmModal(false);
    await handleValidate();
  };

  if (confirmed) {
    return (
      <div className="min-h-screen bg-[#05060a] text-white">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[#05060a]" />
          <div className="absolute -bottom-64 -left-64 h-[760px] w-[760px] rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.24),rgba(99,102,241,0.10),rgba(2,6,23,0)_60%)] blur-3xl" />
          <div className="absolute -top-64 -right-64 h-[680px] w-[680px] rounded-full bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.16),rgba(2,6,23,0)_62%)] blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),rgba(255,255,255,0))]" />
        </div>

        <EnterpriseSidebar />
        <main className="relative min-h-screen px-8 py-10 pb-20 pl-[280px]">
          <div className="mx-auto mt-12 max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-10 text-center shadow-[0_18px_70px_rgba(0,0,0,0.40)] backdrop-blur-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-emerald-400/20 bg-emerald-400/10">
              <CheckCircle2 className="h-9 w-9 text-emerald-300" aria-hidden />
            </div>
            <div className="mt-6 text-4xl font-extrabold tracking-tight text-white">✅</div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white">Intervention confirmée</h1>
            <p className="mt-4 text-sm text-white/70">
              La session pour <span className="font-bold text-white">Charlie Morel</span> avec{" "}
              <span className="font-bold text-white">Sophie Vallet</span> est activée.
              <br />
              Un e-mail de mise en relation confidentiel sera envoyé sous 15 minutes.
            </p>
            <button
              type="button"
              onClick={() => router.push("/dashboard/entreprise")}
              className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-white px-7 py-4 text-sm font-black uppercase tracking-[0.18em] text-black hover:bg-white/90"
            >
              Retour au Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05060a] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#05060a]" />
        <div className="absolute -bottom-64 -left-64 h-[760px] w-[760px] rounded-full bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.38),rgba(99,102,241,0.16),rgba(2,6,23,0)_60%)] blur-3xl" />
        <div className="absolute -top-64 -right-64 h-[680px] w-[680px] rounded-full bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.18),rgba(2,6,23,0)_62%)] blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),rgba(255,255,255,0))]" />
      </div>

      <EnterpriseSidebar />
      <main className="relative min-h-screen px-8 py-10 pb-32 pl-[280px]">
        {/* 1) CONTEXTE */}
        <section className="rounded-3xl border border-white/10 bg-white/5 p-7 shadow-[0_18px_70px_rgba(0,0,0,0.40)] backdrop-blur-2xl">
          <div className="flex flex-col gap-5">
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                Diagnostic : Baisse de stabilité opérationnelle (Charlie Morel)
              </h1>
            </div>

            <div className="max-w-xl">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-[0.22em] text-white/55">Niveau de risque</span>
                <span className="text-xs font-extrabold text-white/70">22%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full w-[22%] rounded-full bg-gradient-to-r from-rose-600 to-red-500"
                  aria-hidden
                />
              </div>
            </div>
          </div>
        </section>

        {/* 2) RECOMMANDATION */}
        <section className="mt-8">
          <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-2xl">
            <div className="mb-4 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-white/70">
              PRECRIPTION BEYOND
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">Coaching Individuel Haute Performance</h2>

            <ul className="mt-6 space-y-4">
              <li className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <Timer className="h-4 w-4 text-white/85" aria-hidden />
                </div>
                <div className="text-sm text-white/75">
                  <span className="font-extrabold text-white">Format :</span> Session Flash (60 min) en visio.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <Target className="h-4 w-4 text-white/85" aria-hidden />
                </div>
                <div className="text-sm text-white/75">
                  <span className="font-extrabold text-white">Cible :</span> Charlie Morel (1 collaborateur).
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <TrendingUp className="h-4 w-4 text-white/85" aria-hidden />
                </div>
                <div className="text-sm text-white/75">
                  <span className="font-extrabold text-white">Livrable :</span> Compte-rendu d'objectifs + Plan d'action
                  14 jours.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <TrendingUp className="h-4 w-4 text-white/85" aria-hidden />
                </div>
                <div className="text-sm text-white/75">
                  <span className="font-extrabold text-white">Investissement :</span> 1 Crédit Expert (ou 75 € HT).
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* 3) EXPERTS */}
        <section className="mt-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-xl font-extrabold tracking-tight text-white">Le choix expert</h3>
                <p className="mt-2 text-sm text-white/60">
                  {expertsLiveLoading ? "Connexion experts..." : "Sélection prête (fallback garanti)."}
                </p>
              </div>
              {confirmed ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-bold text-emerald-100/90">
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  Accompagnement lancé
                </div>
              ) : null}
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
              {/* Sophie highlight */}
              {expertsToRender
                .filter((e) => e.firstName === "Sophie" || e.id === "sophie-vallet")
                .slice(0, 1)
                .map((e) => {
                  const active = e.id === selectedExpertId;
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => setSelectedExpertId(e.id)}
                      className={cn(
                        "relative overflow-hidden text-left rounded-3xl border bg-white/5 p-7 backdrop-blur-2xl transition",
                        active ? "border-white/25 ring-1 ring-white/25" : "border-white/10 hover:border-white/20",
                      )}
                    >
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.22),rgba(2,6,23,0)_55%)]" />
                      <div className="relative flex items-start gap-5">
                        <div className="relative h-16 w-16 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={MOCK_EXPERTS[0]!.photoUrl} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-xl font-extrabold tracking-tight text-white">
                              {e.firstName} {e.lastName}
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/30 bg-violet-500/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-violet-100">
                              <Award className="h-4 w-4" aria-hidden />
                              Certifiée Beyond
                            </span>
                          </div>
                          <div className="mt-1 text-sm font-semibold text-white/70">{e.title}</div>
                          <p className="mt-4 text-sm text-white/70">{e.angle}</p>
                          <div className="mt-5 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-white/70">
                            {active ? "Sélectionnée" : "Choisir Sophie"}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}

              {/* Thomas alternative */}
              {expertsToRender
                .filter((e) => !(e.firstName === "Sophie" || e.id === "sophie-vallet"))
                .slice(0, 1)
                .map((e) => {
                  const active = e.id === selectedExpertId;
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => setSelectedExpertId(e.id)}
                      className={cn(
                        "text-left rounded-3xl border bg-white/5 p-6 backdrop-blur-2xl transition",
                        active ? "border-white/25 ring-1 ring-white/25" : "border-white/10 hover:border-white/20",
                      )}
                    >
                      <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/55">Alternative</div>
                      <div className="mt-3 flex items-start gap-4">
                        <Avatar first={e.firstName} last={e.lastName} photoUrl={e.photoUrl} />
                        <div className="min-w-0">
                          <div className="text-lg font-extrabold tracking-tight text-white">
                            {e.firstName} {e.lastName}
                          </div>
                          <div className="mt-1 text-sm font-semibold text-white/70">{e.title}</div>
                          <p className="mt-3 text-sm text-white/65">{e.angle}</p>
                          <div className="mt-4 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-white/70">
                            {active ? "Sélectionné" : "Choisir"}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </section>

        {/* 4) CTA FINAL sticky */}
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="relative mx-auto max-w-[1200px] pl-[280px] pr-8">
            <div className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-2xl">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-white/75">
                  <span className="font-extrabold text-white">Expert :</span> Sophie Vallet{" "}
                  <span className="text-white/40">|</span> <span className="font-extrabold text-white">Format :</span>{" "}
                  Session Flash
                </div>
                <button
                  type="button"
                  onClick={handleCtaClick}
                  disabled={confirming}
                  className={cn(
                    "w-full md:w-auto rounded-2xl px-7 py-4 text-sm font-black uppercase tracking-[0.18em]",
                    "bg-white text-black hover:bg-white/90",
                    "disabled:cursor-not-allowed disabled:opacity-70",
                  )}
                >
                  {confirming ? "Lancement..." : "Lancer l'accompagnement maintenant"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {showConfirmModal ? (
          <div className="fixed inset-0 z-50">
            <button
              type="button"
              className="absolute inset-0 bg-black/65 backdrop-blur-sm"
              aria-label="Fermer"
              onClick={() => setShowConfirmModal(false)}
            />
            <div className="relative mx-auto flex min-h-full max-w-2xl items-end p-6 sm:items-center">
              <div className="w-full rounded-3xl border border-white/10 bg-[#0b0d14]/90 p-7 shadow-[0_22px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-white/55">Confirmation</div>
                    <h4 className="mt-2 text-xl font-extrabold tracking-tight text-white">
                      Confirmation de l'intervention
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(false)}
                    className="rounded-2xl border border-white/10 bg-white/5 p-2 text-white/75 hover:bg-white/10"
                    aria-label="Fermer la modale"
                  >
                    <X className="h-5 w-5" aria-hidden />
                  </button>
                </div>

                <div className="mt-6 space-y-3 text-sm text-white/75">
                  <p>
                    Vous allez activer une session pour <span className="font-bold text-white">Charlie Morel</span> avec{" "}
                    <span className="font-bold text-white">Sophie Vallet</span>.
                  </p>
                  <p>Un e-mail de mise en relation confidentiel sera envoyé sous 15 minutes.</p>
                </div>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(false)}
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white/80 hover:bg-white/10"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmIntervention}
                    disabled={confirming}
                    className={cn(
                      "rounded-2xl bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-black hover:bg-white/90",
                      "disabled:cursor-not-allowed disabled:opacity-70",
                    )}
                  >
                    {confirming ? "Notification..." : "Confirmer & Notifier l'expert"}
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

