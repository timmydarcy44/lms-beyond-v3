"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { useSupabase } from "@/components/providers/supabase-provider";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { Check, Mail, Phone, User, Zap } from "lucide-react";
import type { ActionRequest } from "@/types/database";

type ActionRequestRow = ActionRequest & {
  target_count: number | null;
  expert:
    | {
        id: string;
        first_name: string | null;
        last_name: string | null;
        headline: string | null;
        photo_url: string | null;
        certification_status: string | null;
      }
    | null;
};

function formatLaunchDate(dateIso: string | null) {
  if (!dateIso) return "date inconnue";
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return "date inconnue";
  return format(d, "d MMMM yyyy 'à' HH'h'mm", { locale: fr });
}

function statusLabel(status: string | null) {
  if (status === "expert_notified") return "Expert notifié";
  if (status === "scheduled") return "Planifié";
  if (status === "cancelled") return "Annulé";
  if (status === "completed") return "Terminé";
  return status ?? "Inconnu";
}

function StatusBadge({ status }: { status: string | null }) {
  const s = status ?? "unknown";
  if (s === "expert_notified") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1.5 text-xs font-bold text-sky-100/90">
        <span className="h-2 w-2 animate-pulse rounded-full bg-sky-400" aria-hidden />
        Expert notifié
      </span>
    );
  }
  if (s === "scheduled") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-100/90">
        <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
        Planifié
      </span>
    );
  }
  if (s === "completed") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-100/90">
        <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
        Terminé
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70">
      <span className="h-2 w-2 rounded-full bg-white/30" aria-hidden />
      {statusLabel(status)}
    </span>
  );
}

function TimelineStep({
  state,
  title,
  description,
}: {
  state: "done" | "active" | "todo";
  title: string;
  description: string;
}) {
  return (
    <div className="relative flex gap-4">
      <div className="relative flex flex-col items-center">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-2xl border",
            state === "done"
              ? "border-emerald-400/25 bg-emerald-400/10"
              : state === "active"
                ? "border-sky-400/25 bg-sky-500/10"
                : "border-white/10 bg-white/5",
          )}
        >
          {state === "done" ? (
            <Check className="h-5 w-5 text-emerald-300" aria-hidden />
          ) : (
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                state === "active" ? "animate-pulse bg-sky-400" : "bg-white/25",
              )}
              aria-hidden
            />
          )}
        </div>
        <div className="mt-2 h-full w-px bg-white/10" aria-hidden />
      </div>
      <div className="min-w-0 pb-8">
        <div className="text-sm font-extrabold tracking-tight text-white">{title}</div>
        <div className="mt-1 text-sm text-white/65">{description}</div>
      </div>
    </div>
  );
}

export default function ActionRequestDetailPage() {
  const router = useRouter();
  const supabase = useSupabase();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [row, setRow] = useState<ActionRequestRow | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("action_requests")
          .select(
            "id,action_type,target_label,target_count,status,created_at,scheduled_at,completion_notes,expert:experts(id,first_name,last_name,headline,photo_url,certification_status)",
          )
          .eq("id", id)
          .maybeSingle();
        if (error) throw error;
        if (!cancelled) setRow((data ?? null) as ActionRequestRow | null);
      } catch {
        if (!cancelled) {
          setRow(null);
          setError("Impossible de charger l'intervention.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id, supabase]);

  const expertName = useMemo(() => {
    const full = `${row?.expert?.first_name ?? ""} ${row?.expert?.last_name ?? ""}`.trim();
    return full || "Expert Beyond";
  }, [row]);

  const certified = row?.expert?.certification_status === "certified";
  const createdLabel = formatLaunchDate(row?.created_at ?? null);
  const completionNotes = row?.completion_notes ?? "";

  const timeline = useMemo(() => {
    const status = row?.status ?? "unknown";
    if (status === "scheduled") {
      return [
        { state: "done" as const, title: "Demande envoyée", description: "Intervention enregistrée et notifiée." },
        { state: "done" as const, title: "Validation expert", description: "L'expert a confirmé la prise en charge." },
        { state: "active" as const, title: "Planification de la session", description: "Créneau et logistique en cours." },
      ];
    }
    // Default: expert_notified (or unknown)
    return [
      { state: "done" as const, title: "Demande envoyée", description: "Intervention enregistrée et notifiée." },
      { state: "active" as const, title: "En attente de validation", description: "Confirmation attendue côté expert." },
      { state: "todo" as const, title: "Planification de la session", description: "La planification démarre après validation." },
    ];
  }, [row]);

  return (
    <div className="min-h-screen bg-[#05060a] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#05060a]" />
        <div className="absolute -bottom-64 -left-64 h-[760px] w-[760px] rounded-full bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.30),rgba(99,102,241,0.12),rgba(2,6,23,0)_60%)] blur-3xl" />
        <div className="absolute -top-64 -right-64 h-[680px] w-[680px] rounded-full bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.14),rgba(2,6,23,0)_62%)] blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),rgba(255,255,255,0))]" />
      </div>

      <EnterpriseSidebar />
      <main className="relative min-h-screen px-8 py-10 pb-24 lg:pl-[280px]">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <div className="text-xs font-black uppercase tracking-[0.22em] text-white/55">Détail intervention</div>
            <h1 className="mt-2 truncate text-3xl font-extrabold tracking-tight text-white">
              Atelier : {row?.target_label ?? "—"}
            </h1>
            <p className="mt-3 text-sm text-white/70">Lancée le {createdLabel}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={row?.status ?? null} />
            <button
              type="button"
              onClick={() => router.push("/dashboard/entreprise/actions")}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/80 hover:bg-white/10"
            >
              ← Historique
            </button>
          </div>
        </header>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100/90">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
            <div className="h-64 rounded-3xl border border-white/10 bg-white/5" />
            <div className="h-64 rounded-3xl border border-white/10 bg-white/5" />
          </div>
        ) : row ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
            {/* Timeline */}
            <section className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-2xl">
              {row.status === "completed" ? (
                <div className="mb-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-sm font-semibold text-emerald-100/90">
                  Intervention terminée avec succès.
                </div>
              ) : null}
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.22em] text-white/55">Timeline opérationnelle</div>
                  <div className="mt-2 text-sm font-semibold text-white/80">
                    Suivi des étapes jusqu’à la session.
                  </div>
                </div>
              </div>

              <div className="mt-2">
                {timeline.map((s, idx) => (
                  <TimelineStep key={idx} state={s.state} title={s.title} description={s.description} />
                ))}
              </div>

              {row.status === "completed" && completionNotes ? (
                <div className="mt-6 rounded-3xl border border-violet-400/20 bg-violet-500/10 p-6">
                  <div className="text-xs font-black uppercase tracking-[0.22em] text-white/60">
                    Retour de l'Expert Certifié
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-white/75">{completionNotes}</p>
                </div>
              ) : null}

              {row.status === "completed" ? (
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/dashboard/entreprise?diagnostic=rerun&target=${encodeURIComponent(row.target_label ?? "Équipe")}`,
                    )
                  }
                  className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-black hover:bg-white/90"
                >
                  Relancer un diagnostic d'équipe
                </button>
              ) : null}
            </section>

            {/* Expert card */}
            <aside className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-2xl">
              <div className="text-xs font-black uppercase tracking-[0.22em] text-white/55">Cartouche expert</div>

              <div className="mt-5 flex items-start gap-4">
                <div className="relative h-16 w-16 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                  {imageFailed || !row.expert?.photo_url ? (
                    <div className="flex h-full w-full items-center justify-center text-white/70">
                      <User className="h-7 w-7" aria-hidden />
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={row.expert.photo_url}
                      alt={expertName}
                      className="h-full w-full object-cover"
                      onError={() => setImageFailed(true)}
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-lg font-extrabold tracking-tight text-white">{expertName}</div>
                    {certified ? (
                      <span
                        className="inline-flex items-center rounded-full border border-violet-400/30 bg-violet-500/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-violet-100 shadow-[0_0_24px_rgba(168,85,247,0.35)]"
                        title="Cet expert a validé le cursus Beyond sur la performance cognitive."
                      >
                        Certifié Beyond
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white/70">
                    {row.expert?.headline ?? "Expert Beyond"}
                  </div>

                  {certified ? (
                    <div
                      className="mt-3 inline-flex flex-wrap items-center gap-2 text-xs font-bold text-violet-100/90"
                      title="Certification obtenue après validation du parcours pédagogique Beyond (Diagnostic, Posture & Méthodologie)."
                    >
                      <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1">
                        A
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1">
                        P
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1">
                        I
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-7 rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="text-xs font-black uppercase tracking-[0.22em] text-white/55">Contexte</div>
                <div className="mt-3 text-sm text-white/75">
                  Cible : <span className="font-bold text-white">{row.target_label ?? "—"}</span>
                  {row.target_count ? (
                    <>
                      {" "}
                      • Participants : <span className="font-bold text-white">{row.target_count}</span>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => toast.info("Contact expert (simulation).")}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-black hover:bg-white/90"
                >
                  <Mail className="h-4 w-4" aria-hidden />
                  Contacter l'expert
                </button>
                <button
                  type="button"
                  onClick={() => toast.info("Urgence modifiée (simulation).")}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white/80 hover:bg-white/10"
                >
                  <Zap className="h-4 w-4" aria-hidden />
                  Modifier l'urgence
                </button>
              </div>

              <div className="mt-4 text-xs text-white/45">
                ID intervention : {row.id}
              </div>
            </aside>
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-sm text-white/70">
            Intervention introuvable.
          </div>
        )}
      </main>
    </div>
  );
}

