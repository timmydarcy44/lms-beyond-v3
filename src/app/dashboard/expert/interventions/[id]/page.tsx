"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";
import { cn } from "@/lib/utils";
import SidebarExpert from "@/components/SidebarExpert";
import { useExpertAccess } from "@/components/expert/expert-access-provider";
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
  const { isApproved } = useExpertAccess();

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
          .select("id,action_type,target_label,target_count,status,created_at,scheduled_at,completion_notes,expert_id,metadata")
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
  const needLabel =
    (typeof row?.metadata?.need_label === "string" && row.metadata.need_label) ||
    "Besoin identifié par l'analyse EDGE";

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
    <div className="min-h-screen bg-[#F7F7F5] text-[#050505]">
      <SidebarExpert restricted={!isApproved} />
      <main className="min-h-screen pl-[260px]">
        <div className="mx-auto max-w-5xl px-6 py-10 pb-24">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#635BFF]">Mission</p>
            <h1 className="mt-2 truncate text-3xl font-semibold tracking-tight">
              {row?.target_label ?? "Intervention"}
            </h1>
            <p className="mt-3 text-sm text-[#050505]/55">Reçue le {createdLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#635BFF]/20 bg-[#635BFF]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#635BFF]">
              <ShieldCheck className="h-4 w-4" aria-hidden />
              Réseau EDGE
            </span>
            <button
              type="button"
              onClick={() => router.push("/dashboard/expert/interventions")}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#050505]/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#050505]/70 hover:bg-[#F7F7F5]"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Retour
            </button>
          </div>
        </header>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-56 rounded-[28px] border border-[#050505]/8 bg-white" />
            <div className="h-56 rounded-[28px] border border-[#050505]/8 bg-white" />
          </div>
        ) : row ? (
          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-[28px] border border-[#050505]/8 bg-white p-8 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#050505]/40">Contexte</p>
              <div className="mt-4 rounded-2xl border border-[#050505]/8 bg-[#F7F7F5] p-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-5 w-5 text-[#635BFF]" aria-hidden />
                  <div className="text-sm text-[#050505]/70">{needLabel}</div>
                </div>
                <div className="mt-4 text-sm text-[#050505]/60">
                  Cible : <span className="font-semibold text-[#050505]">{row.target_label ?? "—"}</span>
                  {row.target_count ? (
                    <>
                      {" "}
                      • Participants : <span className="font-semibold text-[#050505]">{row.target_count}</span>
                    </>
                  ) : null}
                </div>
              </div>

              <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-[#050505]/40">Actions</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={saving || row.status === "accepted" || row.status === "scheduled"}
                  className={cn(
                    "rounded-2xl px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] transition",
                    saving || row.status === "accepted" || row.status === "scheduled"
                      ? "cursor-not-allowed bg-[#050505]/6 text-[#050505]/35"
                      : "bg-[#635BFF] text-white hover:bg-[#7B74FF]",
                  )}
                >
                  {saving ? "Traitement..." : "Accepter la mission"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSchedule((v) => !v)}
                  disabled={saving}
                  className="rounded-2xl border border-[#050505]/10 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#050505]/70 hover:bg-[#F7F7F5] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Planifier
                </button>
              </div>

              {isScheduledInPast && row.status !== "completed" ? (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setShowCompletion((v) => !v)}
                    disabled={saving}
                    className={cn(
                      "w-full rounded-2xl border border-[#635BFF]/20 bg-[#635BFF]/8 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#635BFF] transition hover:bg-[#635BFF]/12",
                      "disabled:cursor-not-allowed disabled:opacity-60",
                    )}
                  >
                    Marquer comme terminée
                  </button>

                  {showCompletion ? (
                    <div className="mt-4 rounded-2xl border border-[#635BFF]/15 bg-[#635BFF]/6 p-6">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#635BFF]">
                        Notes de fin d&apos;intervention
                      </p>
                      <textarea
                        value={completionNotes}
                        onChange={(e) => setCompletionNotes(e.target.value)}
                        rows={5}
                        placeholder="Impact observé, points de vigilance, recommandations..."
                        className="mt-4 w-full resize-none rounded-2xl border border-[#050505]/10 bg-white px-4 py-3 text-sm outline-none placeholder:text-[#050505]/35"
                      />
                      <button
                        type="button"
                        onClick={handleComplete}
                        disabled={saving}
                        className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-[#635BFF] px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white hover:bg-[#7B74FF] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving ? "Enregistrement..." : "Valider la clôture"}
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {showSchedule ? (
                <div className="mt-5 rounded-2xl border border-[#635BFF]/15 bg-[#635BFF]/6 p-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#635BFF]">Planification</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-[#050505]/55">Date</label>
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="rounded-2xl border border-[#050505]/10 bg-white px-4 py-2 text-sm outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-[#050505]/55">Heure</label>
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="rounded-2xl border border-[#050505]/10 bg-white px-4 py-2 text-sm outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSchedule}
                    disabled={saving}
                    className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#635BFF] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white hover:bg-[#7B74FF] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CalendarDays className="h-4 w-4" aria-hidden />
                    Enregistrer
                  </button>
                </div>
              ) : null}
            </section>

            <aside className="rounded-[28px] border border-[#050505]/8 bg-white p-8 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#050505]/40">Statut</p>
              <div className="mt-4 rounded-2xl border border-[#050505]/8 bg-[#F7F7F5] p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#635BFF]" aria-hidden />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#050505]">
                      {row.status === "scheduled"
                        ? "Planifié"
                        : row.status === "accepted"
                          ? "Accepté"
                          : "Nouveau"}
                    </div>
                    <div className="mt-1 text-sm text-[#050505]/55">
                      {row.status === "scheduled"
                        ? "La date a été enregistrée et transmise."
                        : row.status === "accepted"
                          ? "Vous avez accepté la mission. Vous pouvez planifier la session."
                          : "Une nouvelle mission vous attend. Acceptez puis planifiez."}
                    </div>
                    {row.scheduled_at ? (
                      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#635BFF]/20 bg-[#635BFF]/8 px-3 py-1.5 text-xs font-medium text-[#635BFF]">
                        <CalendarDays className="h-4 w-4" aria-hidden />
                        {formatLaunchDate(row.scheduled_at)}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-[#050505]/8 bg-[#F7F7F5] p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#050505]/40">Données</p>
                <div className="mt-3 text-sm text-[#050505]/60">
                  Type : <span className="font-semibold text-[#050505]">{row.action_type ?? "—"}</span>
                </div>
                <div className="mt-2 text-sm text-[#050505]/60">
                  ID : <span className="font-mono text-[#050505]/70">{row.id}</span>
                </div>
              </div>
            </aside>
          </div>
        ) : (
          <div className="rounded-[28px] border border-[#050505]/8 bg-white p-8 text-sm text-[#050505]/55">
            Intervention introuvable.
          </div>
        )}
        </div>
      </main>
    </div>
  );
}

