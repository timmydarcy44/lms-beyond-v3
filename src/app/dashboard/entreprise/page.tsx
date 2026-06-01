"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  Hourglass,
  Search,
  User,
  Users,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { useSupabase } from "@/components/providers/supabase-provider";
import { ActionCards, ActionCardsSkeleton, type RecommendedAction } from "@/components/enterprise/ActionCards";
import { RadarEquipeSummaryCard } from "@/components/radar-equipe/radar-equipe-summary-card";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import type { ActionRequest } from "@/types/database";

type ActionRequestRow = ActionRequest & {
  target_count: number | null;
  expert:
    | {
        first_name: string | null;
        last_name: string | null;
        certification_status: string | null;
      }
    | null;
};

function formatRelativeDate(dateIso: string | null) {
  if (!dateIso) return "date inconnue";
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return "date inconnue";
  return formatDistanceToNow(date, { addSuffix: true, locale: fr });
}

function expertName(expert: ActionRequestRow["expert"]) {
  const full = `${expert?.first_name ?? ""} ${expert?.last_name ?? ""}`.trim();
  return full || "Expert Beyond";
}

function expertCertified(expert: ActionRequestRow["expert"]) {
  return expert?.certification_status === "certified";
}

function getCompletionNotes(row: Pick<ActionRequestRow, "completion_notes">) {
  const v = row?.completion_notes;
  return typeof v === "string" ? v : "";
}

function scoreLabel(score: number | null, fallback: number) {
  const v = typeof score === "number" && Number.isFinite(score) ? score : fallback;
  const clamped = Math.max(0, Math.min(100, Math.round(v)));
  return clamped;
}

function impactCategoryLabel(row: Pick<ActionRequestRow, "metadata" | "action_type" | "target_label">) {
  const v = row?.metadata?.impact_category ?? row?.metadata?.topic ?? row?.metadata?.dimension_key;
  if (typeof v === "string" && v.trim()) return v.trim().toLowerCase();
  if (row.action_type === "group_workshop") return "cohésion";
  return "impact";
}

function interpretation(delta: number, category: string) {
  if (delta > 10) return `Amélioration significative de la ${category}`;
  if (delta > 5) return "Progression modérée";
  return "Stabilisation nécessaire";
}

function InterventionsList({
  items,
  loading,
  onSeeAll,
}: {
  items: ActionRequestRow[];
  loading: boolean;
  onSeeAll: () => void;
}) {
  return (
    <section className="mb-16">
      <div className="mb-6 flex items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-950">Interventions en cours</h2>
          <p className="mt-2 text-sm text-gray-500">Suivi temps réel des activations validées.</p>
        </div>
        <button
          type="button"
          onClick={onSeeAll}
          className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
        >
          Voir tout l'historique
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b0d14] shadow-[0_22px_80px_rgba(0,0,0,0.14)]">
        <div className="border-b border-white/10 bg-white/5 px-6 py-5 backdrop-blur-xl">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-white/55">Pipeline d'actions</div>
          <div className="mt-1 text-sm font-semibold text-white/80">
            Interventions actives — statut, expert, et horodatage.
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="space-y-4">
              {[0, 1, 2].map((k) => (
                <div key={k} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="h-10 w-10 rounded-2xl bg-white/10" />
                  <div className="min-w-0 flex-1">
                    <div className="h-4 w-40 rounded bg-white/10" />
                    <div className="mt-2 h-3 w-64 rounded bg-white/10" />
                  </div>
                  <div className="h-7 w-28 rounded-full bg-white/10" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm text-white/75">
                Aucune intervention lancée. Vos prédictions IA apparaîtront ici après validation.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((it) => {
                const isGroup = it.action_type === "group_workshop";
                const status = it.status ?? "unknown";
                const isNotified = status === "expert_notified";
                const isScheduled = status === "scheduled";
                return (
                  <div
                    key={it.id}
                    className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/80">
                      <span className="text-lg" aria-hidden>
                        {isGroup ? "👥" : "👤"}
                      </span>
                      <span className="sr-only">{isGroup ? "Groupe" : "Individuel"}</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-extrabold tracking-tight text-white">
                        {it.target_label ?? "Cible"}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/60">
                        <span className="truncate">
                          Expert : {expertName(it.expert)} • {formatRelativeDate(it.created_at)}
                        </span>
                        {expertCertified(it.expert) ? (
                          <>
                            <span className="inline-flex items-center rounded-full border border-violet-400/25 bg-violet-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-violet-100">
                              Certifié Beyond
                            </span>
                            <span
                              className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/70"
                              title="Méthode Beyond validée (Analyse | Posture | Impact)"
                            >
                              Méthode Beyond validée (A|P|I)
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <div className="ml-auto">
                      {isNotified ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/80">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-sky-400" aria-hidden />
                          Expert notifié
                        </span>
                      ) : isScheduled ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-100/90">
                          <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
                          Planifié
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70">
                          <span className="h-2 w-2 rounded-full bg-white/30" aria-hidden />
                          {status}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ResultsWidget({
  items,
  loading,
  supabase,
}: {
  items: ActionRequestRow[];
  loading: boolean;
  supabase: any;
}) {
  const isDev = process.env.NODE_ENV !== "production";

  const handleRerun = async (supabase: any, it: ActionRequestRow) => {
    try {
      const target = it.target_label ?? "équipe";
      const payloads: Record<string, unknown>[] = [
        { action_request_id: it.id, target_label: target, status: "sent" },
        { action_request_id: it.id, target_label: target },
        { action_id: it.id, target_label: target, status: "sent" },
        { action_id: it.id, target_label: target },
      ];

      let inserted = false;
      let lastErr: any = null;
      for (const p of payloads) {
        const { error } = await supabase.from("diagnostic_reruns").insert(p);
        if (!error) {
          inserted = true;
          lastErr = null;
          break;
        }
        lastErr = error;
      }
      if (!inserted && lastErr) throw lastErr;

      const { error: updErr } = await supabase.from("action_requests").update({ status: "awaiting_rerun" }).eq("id", it.id);
      if (updErr) throw updErr;

      toast.success(`Protocole de mesure d'impact activé pour l'équipe ${target}.`);
    } catch {
      toast.error("Impossible de relancer le diagnostic pour le moment.");
    }
  };

  const handleSimulate = async (supabase: any, it: ActionRequestRow, score: number) => {
    try {
      const target = it.target_label ?? "équipe";
      const updates: Array<{ where: { col: string; val: string }; data: Record<string, unknown> }> = [
        { where: { col: "action_request_id", val: it.id }, data: { final_score: score, status: "received" } },
        { where: { col: "action_request_id", val: it.id }, data: { score } },
        { where: { col: "action_id", val: it.id }, data: { final_score: score, status: "received" } },
        { where: { col: "action_id", val: it.id }, data: { score } },
      ];
      for (const u of updates) {
        // Best-effort: ignore errors until one works
        // eslint-disable-next-line no-await-in-loop
        await supabase.from("diagnostic_reruns").update(u.data).eq(u.where.col, u.where.val);
      }

      const { error } = await supabase
        .from("action_requests")
        .update({ final_score: score, status: "completed" })
        .eq("id", it.id);
      if (error) throw error;

      toast.success(`Réponse reçue. Nouveau score : ${score}% (${target}).`);
    } catch {
      toast.error("Simulation impossible.");
    }
  };

  return (
    <section className="mb-16">
      <div className="mb-6 flex items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-950">Résultats des interventions</h2>
          <p className="mt-2 text-sm text-gray-500">Impact, feedback expert et suivi (avant / après).</p>
        </div>
        <div className="text-sm text-gray-500">Boucle ROI · Avant / Après · Feedback expert</div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b0d14] shadow-[0_22px_80px_rgba(0,0,0,0.14)]">
        <div className="border-b border-white/10 bg-white/5 px-6 py-5 backdrop-blur-xl">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-white/55">Impact & résultats</div>
          <div className="mt-1 text-sm font-semibold text-white/80">
            Interventions terminées — scores et retour terrain.
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="space-y-4">
              {[0, 1].map((k) => (
                <div key={k} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="h-4 w-48 rounded bg-white/10" />
                  <div className="mt-4 h-2.5 w-full rounded-full bg-white/10" />
                  <div className="mt-4 h-16 w-full rounded bg-white/10" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm text-white/75">Aucun résultat pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((it) => {
                const before = scoreLabel(it.initial_score, 62);
                const after = typeof it.final_score === "number" && Number.isFinite(it.final_score) ? Math.round(it.final_score) : null;
                const delta = after === null ? null : after - before;
                const category = impactCategoryLabel(it);
                const notes = getCompletionNotes(it);
                const notesExcerpt =
                  notes.length > 220 ? `${notes.slice(0, 220).trim()}…` : notes;
                const awaiting = it.status === "awaiting_rerun";

                return (
                  <div key={it.id} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-extrabold tracking-tight text-white">
                          {it.target_label ?? "Cible"}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/60">
                          <span>Expert : {expertName(it.expert)}</span>
                          {expertCertified(it.expert) ? (
                            <span className="rounded-full border border-violet-400/25 bg-violet-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-violet-100">
                              Certifié Beyond
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {after !== null && delta !== null ? (
                          <span className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-100/90 shadow-[0_0_24px_rgba(16,185,129,0.25)]">
                            Progression : {delta >= 0 ? "+" : ""}
                            {delta}%
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70">
                            Après : mesure en attente
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-[1fr_1fr]">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-8 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="mt-auto h-full w-full rounded-full bg-gradient-to-t from-amber-500/80 to-orange-400/60"
                            style={{ height: `${before}%` }}
                            aria-hidden
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-white/55">
                            Score Initial ({before}%)
                          </div>
                          <div className="mt-1 text-xs text-white/60">Référence avant intervention.</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="h-14 w-8 overflow-hidden rounded-full bg-white/10">
                          <div
                            className={cn(
                              "mt-auto w-full rounded-full",
                              after === null
                                ? "h-[12%] bg-white/20"
                                : "bg-gradient-to-t from-emerald-500/80 to-emerald-300/60",
                            )}
                            style={after === null ? undefined : ({ height: `${Math.max(0, Math.min(100, after))}%` } as any)}
                            aria-hidden
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-white/55">
                            Score Actuel ({after === null ? "—" : `${after}%`})
                          </div>
                          <div className="mt-1 text-xs text-white/60">
                            {after === null ? "Mesure en attente." : interpretation(delta ?? 0, category)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {notesExcerpt ? (
                      <blockquote className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/75">
                        <span className="text-white/50">“</span>
                        {notesExcerpt}
                        <span className="text-white/50">”</span>
                      </blockquote>
                    ) : null}

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs text-white/50">
                        {it.action_type === "group_workshop" ? "Atelier collectif" : "Intervention"} • {formatRelativeDate(it.created_at)}
                      </div>
                      {after === null ? (
                        awaiting ? (
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1.5 text-xs font-bold text-sky-100/90">
                              <span className="h-2 w-2 animate-pulse rounded-full bg-sky-400" aria-hidden />
                              Mesure en cours...
                            </span>
                            <span className="text-xs font-semibold text-white/60">Résultats attendus sous 48h</span>
                            {isDev ? (
                              <button
                                type="button"
                                onClick={() => handleSimulate(supabase, it, 78)}
                                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-white/70 hover:bg-white/10"
                                title="Démo dev uniquement"
                              >
                                Simuler Réponse
                              </button>
                            ) : null}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRerun(supabase, it)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-sky-100/90 shadow-[0_0_20px_rgba(56,189,248,0.18)] hover:bg-sky-500/15"
                          >
                            <span className="h-2 w-2 animate-pulse rounded-full bg-sky-400" aria-hidden />
                            Relancer Diagnostic
                          </button>
                        )
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const url = `/dashboard/entreprise/actions/${encodeURIComponent(it.id)}/report`;
                            window.open(url, "_blank", "noopener,noreferrer");
                          }}
                          className="inline-flex items-center rounded-2xl bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-black hover:bg-white/90"
                        >
                          Télécharger le rapport d'impact (PDF)
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

type CollaboratorRow = {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  age: number;
  tenure: string;
  status: "done" | "pending";
  stress: "low" | "high" | "none";
  idmcScore: number | null;
};

type ExpertSkillRow = { label: string };
type ExpertRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
  tagline: string | null;
  specialty: string | null;
  approach: string | null;
  intervention_cases: string | null;
  formats: string[] | null;
  skills: ExpertSkillRow[] | null;
};

export default function DashboardRHLightFinal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useSupabase();

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [profileRole, setProfileRole] = useState<string | null>(null);

  const [diagLoading, setDiagLoading] = useState(true);
  const [diagTotal, setDiagTotal] = useState(0);
  const [diagCompleted, setDiagCompleted] = useState(0);
  const [diagAverages, setDiagAverages] = useState<{ focus: number; stress: number; engagement: number; cohesion: number } | null>(
    null,
  );

  const [actionsLoading, setActionsLoading] = useState(true);
  const [actionsError, setActionsError] = useState<string | null>(null);
  const [recommendedActions, setRecommendedActions] = useState<RecommendedAction[]>([]);

  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [selectedActionMeta, setSelectedActionMeta] = useState<RecommendedAction | null>(null);

  const [expertsLoading, setExpertsLoading] = useState(false);
  const [expertsError, setExpertsError] = useState<string | null>(null);
  const [experts, setExperts] = useState<ExpertRow[]>([]);
  const [selectedExpertId, setSelectedExpertId] = useState<string | null>(null);
  const [validatedExpertId, setValidatedExpertId] = useState<string | null>(null);

  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [actionRequests, setActionRequests] = useState<ActionRequestRow[]>([]);

  const [resultsLoading, setResultsLoading] = useState(true);
  const [completedRequests, setCompletedRequests] = useState<ActionRequestRow[]>([]);

  const stats = [
    { label: "Total Collaborateurs", value: 50, icon: <Users size={20} aria-hidden /> },
    { label: "Diagnostics Complétés", value: "12 / 50", icon: <ClipboardCheck size={20} aria-hidden /> },
    { label: "Alertes Care Actives", value: 2, icon: <AlertTriangle size={20} aria-hidden />, danger: true },
  ];

  const demoRecommendedActions = useMemo(
    () => [
      {
        id: "demo-stress-charlie",
        title: "Optimisation du potentiel individuel - Charlie Morel",
        description:
          "Axe d'amélioration identifié : efficacité sous pression. Objectif : transformer la friction en agilité opérationnelle.",
        priority: "Haute" as const,
        badge: "Performance",
        href: "/dashboard/entreprise/actions/demo-stress",
      },
      {
        id: "demo-engagement-tech",
        title: "Baisse d'engagement - Équipe Tech",
        description:
          "Signaux faibles détectés sur l'équilibre vie pro/vie perso. Organiser un point d'équipe.",
        priority: "Moyenne" as const,
        badge: "Management",
        collectiveDelta: "+3 collaborateurs concernés",
        href: null as string | null,
      },
    ],
    [],
  );

  const fallbackPhotos = useMemo(
    () => [
      // portraits naturels, pro, non “corporate stock” trop lisse
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=900&q=80",
    ],
    [],
  );

  const getExpertPhoto = (expert: ExpertRow, index: number) => {
    if (expert.photo_url && expert.photo_url.startsWith("http")) return expert.photo_url;
    return fallbackPhotos[index % fallbackPhotos.length];
  };

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        const user = userData.user;
        if (!user) throw new Error("not_authenticated");
        const { data, error } = await supabase
          .from("profiles")
          .select("company_id, role")
          .eq("id", user.id)
          .maybeSingle();
        if (error) throw error;
        if (!cancelled) {
          setCompanyId(((data as any)?.company_id as string | null) ?? null);
          setProfileRole(((data as any)?.role as string | null) ?? null);
        }
      } catch {
        if (!cancelled) {
          setCompanyId(null);
          setProfileRole(null);
        }
      }
    }
    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;
    async function loadDiagnosticCounts() {
      setDiagLoading(true);
      try {
        if (!companyId) {
          if (!cancelled) {
            setDiagTotal(0);
            setDiagCompleted(0);
          }
          return;
        }
        const { data, error } = await supabase
          .from("diagnostic_sessions")
          .select("status,score_snapshot")
          .eq("company_id", companyId)
          .limit(5000);
        if (error) throw error;
        const rows = (data ?? []) as Array<{ status: string | null; score_snapshot?: any }>;
        const total = rows.length;
        const completedRows = rows.filter((r) => String(r.status ?? "").toLowerCase() === "completed");
        const completed = completedRows.length;

        const avg = (key: "focus" | "stress" | "engagement" | "cohesion") => {
          const vals = completedRows
            .map((r) => Number(r.score_snapshot?.[key]))
            .filter((v) => Number.isFinite(v)) as number[];
          if (vals.length === 0) return 0;
          return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
        };
        if (!cancelled) {
          setDiagTotal(total);
          setDiagCompleted(completed);
          setDiagAverages(
            completed > 0
              ? {
                  focus: avg("focus"),
                  stress: avg("stress"),
                  engagement: avg("engagement"),
                  cohesion: avg("cohesion"),
                }
              : null,
          );
        }
      } catch {
        if (!cancelled) {
          setDiagTotal(0);
          setDiagCompleted(0);
          setDiagAverages(null);
        }
      } finally {
        if (!cancelled) setDiagLoading(false);
      }
    }
    loadDiagnosticCounts();
    return () => {
      cancelled = true;
    };
  }, [companyId, supabase]);

  useEffect(() => {
    if (diagLoading) return;
    const firstLaunch = searchParams.get("first_launch") === "true";
    const isAdminHr = String(profileRole ?? "").toLowerCase() === "admin_hr";
    if (isAdminHr && !firstLaunch && companyId && diagTotal === 0) {
      router.replace("/onboarding/launch-diagnostic");
    }
  }, [companyId, diagLoading, diagTotal, profileRole, router, searchParams]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setActionsLoading(true);
      setActionsError(null);
      try {
        if (!companyId) {
          if (!cancelled) {
            setRecommendedActions([]);
            setActionsError("Entreprise non configurée (company_id manquant dans profiles).");
          }
          return;
        }
        const { data, error } = await supabase
          .from("view_dashboard_recommended_actions")
          .select("id,title,description,dimension_key,target_count")
          .eq("company_id", companyId);

        if (error) throw error;
        if (!cancelled) setRecommendedActions((data ?? []) as RecommendedAction[]);
      } catch (e) {
        if (!cancelled) setActionsError("Impossible de charger les recommandations.");
      } finally {
        if (!cancelled) setActionsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [companyId, supabase]);

  useEffect(() => {
    let cancelled = false;
    async function loadResults() {
      setResultsLoading(true);
      try {
        const { data, error } = await supabase
          .from("action_requests")
          .select(
            "id,action_type,target_label,target_count,status,created_at,scheduled_at,initial_score,final_score,completion_notes,expert:experts(first_name,last_name,certification_status)",
          )
          .in("status", ["completed", "awaiting_rerun"])
          .order("created_at", { ascending: false })
          .limit(6);
        if (error) throw error;
        if (!cancelled) setCompletedRequests((data ?? []) as ActionRequestRow[]);
      } catch {
        if (!cancelled) setCompletedRequests([]);
      } finally {
        if (!cancelled) setResultsLoading(false);
      }
    }
    loadResults();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;
    async function loadPipeline() {
      setRequestsLoading(true);
      setRequestsError(null);
      try {
        const { data, error } = await supabase
          .from("action_requests")
          .select(
            "id,action_type,target_label,target_count,status,created_at,scheduled_at,expert:experts(first_name,last_name,certification_status)",
          )
          .order("created_at", { ascending: false })
          .limit(3);
        if (error) throw error;
        if (!cancelled) setActionRequests((data ?? []) as ActionRequestRow[]);
      } catch {
        if (!cancelled) {
          setRequestsError("Impossible de charger le pipeline d'actions.");
          setActionRequests([]);
        }
      } finally {
        if (!cancelled) setRequestsLoading(false);
      }
    }
    loadPipeline();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    const id = searchParams.get("recommendedActionId");
    if (!id) return;
    // Sécurité UX : ne déclenche que si on a bien l’action côté dashboard
    const exists = recommendedActions.some((a) => a.id === id);
    if (exists) setSelectedActionId(id);
  }, [recommendedActions, searchParams]);

  useEffect(() => {
    if (!selectedActionId) return;
    const meta = recommendedActions.find((a) => a.id === selectedActionId) ?? null;
    setSelectedActionMeta(meta);
  }, [recommendedActions, selectedActionId]);

  useEffect(() => {
    let cancelled = false;
    async function loadExperts() {
      if (!selectedActionId) return;
      setExpertsLoading(true);
      setExpertsError(null);
      setExperts([]);
      setSelectedExpertId(null);
      setValidatedExpertId(null);

      try {
        const { data: rows, error } = await supabase
          .from("recommended_action_experts")
          .select(
            "expert:experts(id,first_name,last_name,photo_url,tagline,specialty,approach,intervention_cases,formats,skills:expert_skills(label))",
          )
          .eq("action_id", selectedActionId)
          .limit(3);

        if (error) throw error;
        const mapped = (rows ?? [])
          .map((r: any) => r.expert)
          .filter(Boolean) as ExpertRow[];

        if (!cancelled) setExperts(mapped);
      } catch (e) {
        if (!cancelled) setExpertsError("Impossible de charger les experts recommandés.");
      } finally {
        if (!cancelled) setExpertsLoading(false);
      }
    }
    loadExperts();
    return () => {
      cancelled = true;
    };
  }, [selectedActionId, supabase]);

  const collaborators: CollaboratorRow[] = [
    {
      id: "e-01",
      firstName: "Camille",
      lastName: "Morel",
      role: "Chef de projet digital",
      age: 34,
      tenure: "2 ans et 3 mois",
      status: "done",
      stress: "low",
      idmcScore: 75,
    },
    {
      id: "e-02",
      firstName: "Mathieu",
      lastName: "Lemaire",
      role: "Analyste RH",
      age: 29,
      tenure: "1 an et 1 mois",
      status: "pending",
      stress: "high",
      idmcScore: 47,
    },
    {
      id: "e-03",
      firstName: "Sara",
      lastName: "Benali",
      role: "Responsable ventes",
      age: 41,
      tenure: "6 mois",
      status: "done",
      stress: "none",
      idmcScore: 70,
    },
  ];

  const selectedExpert = useMemo(
    () => experts.find((e) => e.id === selectedExpertId) ?? null,
    [experts, selectedExpertId],
  );

  const showExperts = Boolean(selectedActionId);

  if (showExperts) {
    return (
      <div className="flex min-h-screen bg-white font-sans text-gray-900 selection:bg-indigo-100 selection:text-indigo-900">
        <EnterpriseSidebar />

        <main className="relative z-10 flex-1 px-8 py-10 pl-[280px]">
          <header className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <div className="min-w-0">
              <p className="text-sm text-gray-500">Tunnel de recommandation</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-950">Experts recommandés</h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-500">
                Sélectionnés selon le besoin détecté. Accessible uniquement depuis les Actions recommandées.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedActionId(null)}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              ← Retour au dashboard
            </button>
          </header>

          {expertsError && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {expertsError}
            </div>
          )}

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {(expertsLoading ? [0, 1, 2] : experts).map((e: any, idx: number) => {
              if (expertsLoading) {
                return (
                  <div key={idx} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="h-44 w-full rounded-2xl bg-gray-100" />
                    <div className="mt-5 h-5 w-40 rounded bg-gray-100" />
                    <div className="mt-3 h-4 w-32 rounded bg-gray-100" />
                    <div className="mt-5 h-4 w-full rounded bg-gray-100" />
                    <div className="mt-2 h-4 w-5/6 rounded bg-gray-100" />
                    <div className="mt-6 h-10 w-full rounded-2xl bg-gray-100" />
                  </div>
                );
              }

              const expert = e as ExpertRow;
              const fullName = `${expert.first_name ?? ""} ${expert.last_name ?? ""}`.trim() || "Expert Beyond";
              const skills = (expert.skills ?? []).slice(0, 3).map((s) => s.label);

              return (
                <div key={expert.id} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="relative overflow-hidden rounded-2xl bg-gray-100">
                    <img
                      src={getExpertPhoto(expert, idx)}
                      alt={fullName}
                      className="h-44 w-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent" aria-hidden />
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <h2 className="truncate text-lg font-extrabold tracking-tight text-gray-950">{fullName}</h2>
                    <span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                      Certifié Beyond
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-gray-600">
                    {expert.tagline ??
                      expert.specialty ??
                      "Spécialisé(e) dans l’accompagnement humain, guidé par la donnée."}
                  </p>

                  {skills.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {skills.map((s) => (
                        <span
                          key={s}
                          className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedExpertId(expert.id)}
                    className="mt-6 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-950 transition hover:bg-gray-50"
                  >
                    Voir le profil
                  </button>
                </div>
              );
            })}
          </section>

          {selectedExpert && (
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-6"
              role="dialog"
              aria-modal="true"
              aria-label="Profil expert"
              onMouseDown={(e) => {
                if (e.currentTarget === e.target) setSelectedExpertId(null);
              }}
            >
              <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                <div className="grid grid-cols-1 gap-0 md:grid-cols-[240px_1fr]">
                  <div className="relative bg-gray-100">
                    <img
                      src={getExpertPhoto(selectedExpert, 0)}
                      alt={`${selectedExpert.first_name ?? ""} ${selectedExpert.last_name ?? ""}`.trim()}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="p-6 md:p-8">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="text-2xl font-extrabold tracking-tight text-gray-950">
                          {`${selectedExpert.first_name ?? ""} ${selectedExpert.last_name ?? ""}`.trim() || "Expert Beyond"}
                        </h3>
                        <div className="mt-2 inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                          Certifié Beyond
                        </div>
                        <p className="mt-4 text-sm text-gray-600">
                          {selectedExpert.tagline ??
                            selectedExpert.specialty ??
                            "Approche humaine, structurée, orientée résultats."}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedExpertId(null)}
                        className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                      >
                        Fermer
                      </button>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {(selectedExpert.skills ?? []).slice(0, 3).map((s) => (
                        <span
                          key={s.label}
                          className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700"
                        >
                          {s.label}
                        </span>
                      ))}
                    </div>

                    <div className="mt-8 grid grid-cols-1 gap-6">
                      <div>
                        <h4 className="text-sm font-extrabold uppercase tracking-widest text-gray-800">Approche</h4>
                        <p className="mt-2 text-sm text-gray-600">
                          {selectedExpert.approach ??
                            "Diagnostic, clarification, puis activation. On vise un changement observable, pas une promesse."}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold uppercase tracking-widest text-gray-800">Spécialités</h4>
                        <p className="mt-2 text-sm text-gray-600">
                          {selectedExpert.specialty ?? "Stress, organisation, communication, rituels managériaux."}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold uppercase tracking-widest text-gray-800">Cas d’intervention</h4>
                        <p className="mt-2 text-sm text-gray-600">
                          {selectedExpert.intervention_cases ??
                            "Tensions d’équipe, surcharge, perte d’engagement, manque de priorisation, frictions inter-équipes."}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold uppercase tracking-widest text-gray-800">Formats proposés</h4>
                        <p className="mt-2 text-sm text-gray-600">
                          {(selectedExpert.formats && selectedExpert.formats.length > 0
                            ? selectedExpert.formats.join(" · ")
                            : "1:1 · atelier · restitution") ?? ""}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
                        <h4 className="text-xs font-black uppercase tracking-widest text-indigo-900">Recommandé par Beyond</h4>
                        <p className="mt-2 text-sm text-indigo-900/90">
                          Recommandé pour votre besoin :{" "}
                          <span className="font-extrabold">{selectedActionMeta?.title ?? "—"}</span>
                          {selectedActionMeta ? ` (${selectedActionMeta.target_count} collaborateurs concernés)` : ""}.
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                      {validatedExpertId === selectedExpert.id ? (
                        <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
                          Expert validé
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setValidatedExpertId(selectedExpert.id)}
                          className="rounded-2xl bg-gray-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-900"
                        >
                          Valider cet expert
                        </button>
                      )}

                      <p className="text-xs text-gray-500">
                        L’étape RDV arrive après validation (pas de marketplace).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white font-sans text-gray-900 selection:bg-indigo-100 selection:text-indigo-900">
      <EnterpriseSidebar />

      <main className="relative z-10 flex-1 px-8 py-10 pl-[280px]">
        <header className="mb-16 flex items-center justify-between gap-8">
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-sm text-gray-500">Espace Entreprise</p>
            <h1 className="bg-gradient-to-r from-[#1E3A8A] to-[#6D28D9] bg-clip-text text-5xl font-extrabold tracking-tight text-transparent">
              Bonjour demo@entreprise.fr
            </h1>
          </div>
          <div className="relative shrink-0">
            <Search className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400" aria-hidden />
            <input
              type="search"
              placeholder="Rechercher..."
              className="w-72 rounded-full border border-gray-100 bg-gray-50 py-3 pl-12 pr-6 text-sm outline-none focus:border-indigo-200"
              aria-label="Rechercher un collaborateur"
            />
          </div>
        </header>

        <section className="relative mb-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="flex items-start gap-5 rounded-3xl bg-gradient-to-br from-[#1E3A8A] to-[#4F46E5] p-8 text-white shadow-xl shadow-indigo-950/20"
            >
              <div
                className={`rounded-2xl p-3.5 ${stat.danger ? "bg-white/10 text-red-300" : "bg-white/10 text-indigo-200"}`}
              >
                {stat.icon}
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/70">{stat.label}</p>
                <p className={`text-4xl font-black ${stat.danger ? "text-red-200" : "text-white"}`}>{stat.value}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="relative mb-10">
          <RadarEquipeSummaryCard />
        </section>

        {searchParams.get("action") === "success" ? (
          <div className="mb-10 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-semibold text-emerald-900">
            Intervention enregistrée. L’expert a été notifié.
          </div>
        ) : null}

        {!diagLoading &&
        (searchParams.get("first_launch") === "true" ||
          (diagTotal > 0 && diagCompleted < diagTotal)) ? (
          <div className="mb-10 overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-indigo-500">
                  Diagnostic initial en cours
                </div>
                <div className="mt-2 text-lg font-extrabold tracking-tight text-gray-950">
                  {diagCompleted}/{diagTotal} réponses reçues.
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  Les résultats se mettront à jour au fil des réponses.
                  {diagAverages ? (
                    <span className="ml-2 font-semibold text-gray-700">
                      Moyennes (complétés) — Focus {diagAverages.focus}/10 · Stress {diagAverages.stress}/10 · Engagement{" "}
                      {diagAverages.engagement}/10 · Cohésion {diagAverages.cohesion}/10
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="min-w-[220px]">
                <div className="h-2 w-full rounded-full bg-indigo-100">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 transition-all"
                    style={{ width: `${diagTotal ? Math.round((diagCompleted / diagTotal) * 100) : 0}%` }}
                    aria-hidden
                  />
                </div>
                <div className="mt-2 text-right text-[11px] font-semibold text-gray-500">
                  {diagTotal ? Math.round((diagCompleted / diagTotal) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {requestsError ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {requestsError}
          </div>
        ) : null}

        <InterventionsList
          items={actionRequests}
          loading={requestsLoading}
          onSeeAll={() => router.push("/dashboard/entreprise/actions")}
        />

        <ResultsWidget items={completedRequests} loading={resultsLoading} supabase={supabase} />

        <section className="mb-16">
          <div className="mb-6 flex items-end justify-between gap-6">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-gray-950">Actions recommandées</h2>
              <p className="mt-2 text-sm text-gray-500">Priorisez ce qui a le plus d’impact cette semaine.</p>
            </div>
          </div>

          {actionsError && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {actionsError}
            </div>
          )}

          {actionsLoading ? (
            <ActionCardsSkeleton />
          ) : (
            <>
              {recommendedActions.length === 0 ? (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {demoRecommendedActions.map((a) => {
                    const high = a.priority === "Haute";
                    return (
                      <div
                        key={a.id}
                        className={`rounded-3xl border bg-white p-6 shadow-sm ${
                          high ? "border-rose-300" : "border-amber-300"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-6">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`h-2.5 w-2.5 rounded-full ${
                                  high ? "bg-rose-500" : "bg-amber-500"
                                }`}
                                aria-hidden
                              />
                              <h3 className="text-sm font-black uppercase tracking-widest text-gray-700">
                                {a.badge}
                              </h3>
                              <span
                                className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                                  high ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800"
                                }`}
                              >
                                Priorité {a.priority}
                              </span>
                              {!high && a.collectiveDelta ? (
                                <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-700">
                                  {a.collectiveDelta}
                                </span>
                              ) : null}
                            </div>

                            <p className="mt-4 text-lg font-extrabold tracking-tight text-gray-950">
                              {a.title}
                            </p>
                            <p className="mt-3 text-sm text-gray-600">{a.description}</p>
                          </div>
                        </div>

                        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                          {a.href ? (
                            <button
                              type="button"
                              onClick={() => router.push(a.href)}
                              className={`rounded-2xl px-4 py-2.5 text-sm font-bold text-white transition ${
                                high
                                  ? "bg-rose-600 hover:bg-rose-500 shadow-[0_0_22px_rgba(244,63,94,0.22)]"
                                  : "bg-amber-600 hover:bg-amber-500"
                              }`}
                            >
                              Viser la performance
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedActionId(demoRecommendedActions[0]?.id ?? null)}
                              className="rounded-2xl bg-gray-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-gray-900"
                            >
                              Planifier l'action
                            </button>
                          )}
                          <p className="text-xs text-gray-500">Démo Beyond IA</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <ActionCards
                  actions={recommendedActions}
                  onSelect={(actionId) => {
                    setSelectedActionId(actionId);
                  }}
                />
              )}
            </>
          )}
        </section>

        <section>
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-gray-950">Liste des collaborateurs</h2>
            <button
              type="button"
              className="flex items-center gap-1.5 text-sm font-semibold text-indigo-700 hover:text-indigo-800"
            >
              Voir tous <ChevronRight size={16} aria-hidden />
            </button>
          </div>

          <div className="mb-4 hidden min-w-0 grid-cols-[minmax(200px,1.2fr)_minmax(80px,0.6fr)_minmax(120px,1fr)_minmax(72px,0.7fr)_minmax(120px,0.9fr)_40px] gap-4 border-b border-gray-100 px-4 py-4 text-xs font-bold uppercase tracking-widest text-gray-500 lg:grid">
            <div>Collaborateur</div>
            <div>Âge</div>
            <div>Ancienneté</div>
            <div className="text-center">Score IDMC</div>
            <div>Statut</div>
            <div />
          </div>

          <div className="space-y-4">
            {collaborators.map((collab) => (
              <button
                key={collab.id}
                type="button"
                onClick={() => router.push("/dashboard/entreprise/salaries/demo-insight")}
                className="group grid w-full min-w-0 grid-cols-1 items-center gap-4 rounded-2xl border border-gray-100 bg-white p-6 text-left transition-all hover:border-gray-200 hover:bg-gray-50 lg:grid-cols-[minmax(200px,1.2fr)_minmax(80px,0.6fr)_minmax(120px,1fr)_minmax(72px,0.7fr)_minmax(120px,0.9fr)_40px] lg:gap-4"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">
                    {collab.firstName[0]}
                    {collab.lastName[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">
                      {collab.firstName} {collab.lastName}
                    </p>
                    <p className="truncate text-xs text-gray-500">{collab.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CalendarDays size={16} className="shrink-0 text-gray-400" aria-hidden />
                  {collab.age} ans
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Hourglass size={16} className="shrink-0 text-gray-400" aria-hidden />
                  {collab.tenure}
                </div>

                <div className="text-center lg:text-center">
                  {collab.idmcScore != null ? (
                    <span
                      className={`text-lg font-bold ${
                        collab.idmcScore > 75 ? "text-emerald-600" : collab.idmcScore > 60 ? "text-amber-600" : "text-red-600"
                      }`}
                    >
                      {collab.idmcScore}%
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </div>

                <div className="flex items-center justify-end gap-4 lg:justify-end">
                  <span
                    className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest ${
                      collab.status === "done" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {collab.status === "done" ? "Tests Fait" : "En attente"}
                  </span>
                  {collab.stress === "high" && (
                    <div
                      className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-red-500"
                      title="Alerte Care ACTIVE"
                    />
                  )}
                </div>

                <div className="flex justify-end">
                  <ChevronRight
                    size={18}
                    className="text-gray-300 transition-colors group-hover:text-indigo-500"
                    aria-hidden
                  />
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
