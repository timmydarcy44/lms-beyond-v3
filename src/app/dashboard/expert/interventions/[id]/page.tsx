"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";
import { cn } from "@/lib/utils";
import SidebarExpert from "@/components/SidebarExpert";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { CalendarDays, CheckCircle2, ChevronLeft, ShieldCheck, Sparkles } from "lucide-react";
import type { ActionRequest } from "@/types/database";

type ActionRequestRow = ActionRequest & {
  target_count: number | null;
  expert_id: string | null;
};

function formatLaunchDate(dateIso: string | null) {
  if (!dateIso) return "date inconnue";
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return "date inconnue";
  return format(d, "d MMMM yyyy 'à' HH'h'mm", { locale: fr });
}

export default function ExpertInterventionDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const supabase = useSupabase();

  const [expertId, setExpertId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [row, setRow] = useState<ActionRequestRow | null>(null);

  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("10:00");
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        const user = userData.user;
        const currentExpertId = user?.id ?? null;
        if (!currentExpertId) throw new Error("not_authenticated");
        if (!cancelled) setExpertId(currentExpertId);

        const { data, error } = await supabase
          .from("action_requests")
          .select("id,action_type,target_label,target_count,status,created_at,scheduled_at,completion_notes,expert_id")
          .eq("id", id)
          .maybeSingle();
        if (error) throw error;
        const r = (data ?? null) as ActionRequestRow | null;
        if (!cancelled) {
          if (r && r.expert_id && r.expert_id !== currentExpertId) {
            setError("Cette intervention n'est pas assignée à votre compte expert.");
            setRow(null);
          } else {
            setRow(r);
          }
        }
      } catch {
        if (!cancelled) {
          setRow(null);
          setError("Impossible de charger l'intervention (connexion requise).");
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

  const createdLabel = useMemo(() => formatLaunchDate(row?.created_at ?? null), [row]);
  const needLabel = "Besoin détecté par l'IA Beyond : Cohésion d'équipe";

  const scheduledDate = useMemo(() => {
    if (!row?.scheduled_at) return null;
    const d = new Date(row.scheduled_at);
    if (Number.isNaN(d.getTime())) return null;
    return d;
  }, [row?.scheduled_at]);
  const isScheduledInPast = row?.status === "scheduled" && !!scheduledDate && scheduledDate.getTime() < Date.now();

  const handleAccept = async () => {
    if (!row || saving) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("action_requests").update({ status: "accepted" }).eq("id", row.id);
      if (error) throw error;
      setRow((prev) => (prev ? { ...prev, status: "accepted" } : prev));
      toast.success("Mission acceptée.");
    } catch {
      toast.error("Impossible d'accepter la mission.");
    } finally {
      setSaving(false);
    }
  };

  const handleSchedule = async () => {
    if (!row || saving) return;
    if (!scheduleDate) {
      toast.error("Veuillez choisir une date.");
      return;
    }
    setSaving(true);
    try {
      const iso = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      const { error } = await supabase
        .from("action_requests")
        .update({ status: "scheduled", scheduled_at: iso, updated_at: new Date().toISOString() })
        .eq("id", row.id);
      if (error) throw error;
      setRow((prev) => (prev ? { ...prev, status: "scheduled", scheduled_at: iso } : prev));
      setShowSchedule(false);
      toast.success("Planification enregistrée.");
    } catch {
      toast.error("Impossible d'enregistrer la planification.");
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!row || saving) return;
    if (completionNotes.trim().length < 3) {
      toast.error("Veuillez ajouter quelques notes de fin d'intervention.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("action_requests")
        .update({
          status: "completed",
          completion_notes: completionNotes.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      if (error) throw error;
      setRow((prev) => (prev ? { ...prev, status: "completed", completion_notes: completionNotes.trim() } : prev));
      setShowCompletion(false);
      toast.success("Intervention marquée comme terminée.");
    } catch {
      toast.error("Impossible de clôturer l'intervention.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05060a] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#05060a]" />
        <div className="absolute -bottom-64 -left-64 h-[760px] w-[760px] rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.22),rgba(99,102,241,0.10),rgba(2,6,23,0)_60%)] blur-3xl" />
        <div className="absolute -top-64 -right-64 h-[680px] w-[680px] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.16),rgba(2,6,23,0)_62%)] blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),rgba(255,255,255,0))]" />
      </div>

      <SidebarExpert />
      <main className="relative mx-auto max-w-5xl px-6 py-10 pb-24 pl-[280px]">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <div className="text-xs font-black uppercase tracking-[0.22em] text-white/55">Espace Expert</div>
            <h1 className="mt-2 truncate text-3xl font-extrabold tracking-tight text-white">
              Intervention : {row?.target_label ?? "—"}
            </h1>
            <p className="mt-3 text-sm text-white/70">Reçue le {createdLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-100/90">
              <ShieldCheck className="h-4 w-4" aria-hidden />
              Mission ops
            </span>
            <button
              type="button"
              onClick={() => router.push("/dashboard/expert/interventions")}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/80 hover:bg-white/10"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Retour
            </button>
          </div>
        </header>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100/90">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-56 rounded-3xl border border-white/10 bg-white/5" />
            <div className="h-56 rounded-3xl border border-white/10 bg-white/5" />
          </div>
        ) : row ? (
          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-2xl">
              <div className="text-xs font-black uppercase tracking-[0.22em] text-white/55">Contexte</div>
              <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-5 w-5 text-emerald-200" aria-hidden />
                  <div className="text-sm text-white/80">{needLabel}</div>
                </div>
                <div className="mt-4 text-sm text-white/70">
                  Cible : <span className="font-bold text-white">{row.target_label ?? "—"}</span>
                  {row.target_count ? (
                    <>
                      {" "}
                      • Participants : <span className="font-bold text-white">{row.target_count}</span>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-white/55">Actions</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={saving || row.status === "accepted" || row.status === "scheduled"}
                  className={cn(
                    "rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-[0.18em] transition",
                    saving || row.status === "accepted" || row.status === "scheduled"
                      ? "cursor-not-allowed bg-white/10 text-white/40"
                      : "bg-white text-black hover:bg-white/90",
                  )}
                >
                  {saving ? "Traitement..." : "ACCEPTER LA MISSION"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSchedule((v) => !v)}
                  disabled={saving}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white/80 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  PLANIFIER
                </button>
              </div>

              {isScheduledInPast && row.status !== "completed" ? (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setShowCompletion((v) => !v)}
                    disabled={saving}
                    className={cn(
                      "w-full rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-[0.18em] transition",
                      "bg-emerald-400/10 text-emerald-100/90 hover:bg-emerald-400/15 border border-emerald-400/20",
                      "disabled:cursor-not-allowed disabled:opacity-60",
                    )}
                  >
                    MARQUER COMME TERMINÉE
                  </button>

                  {showCompletion ? (
                    <div className="mt-4 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-6">
                      <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-100/80">
                        Notes de fin d'intervention
                      </div>
                      <textarea
                        value={completionNotes}
                        onChange={(e) => setCompletionNotes(e.target.value)}
                        rows={5}
                        placeholder="Impact observé, points de vigilance, recommandations..."
                        className="mt-4 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40"
                      />
                      <button
                        type="button"
                        onClick={handleComplete}
                        disabled={saving}
                        className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-black hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving ? "Enregistrement..." : "Valider la clôture"}
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {showSchedule ? (
                <div className="mt-5 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-6">
                  <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-100/80">
                    Planification
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-emerald-100/80">Date</label>
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-emerald-100/80">Heure</label>
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSchedule}
                    disabled={saving}
                    className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-black hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CalendarDays className="h-4 w-4" aria-hidden />
                    Enregistrer
                  </button>
                </div>
              ) : null}
            </section>

            <aside className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-2xl">
              <div className="text-xs font-black uppercase tracking-[0.22em] text-white/55">Statut</div>
              <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-300" aria-hidden />
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-white">
                      {row.status === "scheduled"
                        ? "Planifié"
                        : row.status === "accepted"
                          ? "Accepté"
                          : "Nouveau"}
                    </div>
                    <div className="mt-1 text-sm text-white/65">
                      {row.status === "scheduled"
                        ? "La date a été enregistrée et transmise côté RH."
                        : row.status === "accepted"
                          ? "Vous avez accepté la mission. Vous pouvez planifier la session."
                          : "Une nouvelle mission vous attend. Acceptez puis planifiez."}
                    </div>
                    {row.scheduled_at ? (
                      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-100/90">
                        <CalendarDays className="h-4 w-4" aria-hidden />
                        {formatLaunchDate(row.scheduled_at)}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="text-xs font-black uppercase tracking-[0.22em] text-white/55">Données</div>
                <div className="mt-3 text-sm text-white/70">
                  Type : <span className="font-bold text-white">{row.action_type ?? "—"}</span>
                </div>
                <div className="mt-2 text-sm text-white/70">
                  ID : <span className="font-mono text-white/80">{row.id}</span>
                </div>
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

