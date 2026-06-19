"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSupabase } from "@/components/providers/supabase-provider";
import {
  ApprenantAssessmentResults,
} from "@/components/apprenant/apprenant-assessment-results";
import { useLearnerSnapshot } from "@/components/learner/learner-snapshot-provider";
import { MicroCheckinWidget } from "@/components/radar-equipe/micro-checkin-widget";
import { ProfilPartageConsent } from "@/components/radar-equipe/profil-partage-consent";
import { buildPersonalizedActionPlan } from "@/lib/learner/personalized-action-plan";
import { APPRENANT_PAGE_KICKER, APPRENANT_PAGE_TITLE } from "@/lib/apprenant/connect-nav";
import { SALARIE_PAGE_SHELL } from "@/lib/salarie/connect-nav";
import { cn } from "@/lib/utils";

const PersonalizedActionPlanSection = dynamic(
  () =>
    import("@/components/learner/personalized-action-plan-section").then((m) => ({
      default: m.PersonalizedActionPlanSection,
    })),
  { ssr: false },
);

type ActionRequestRow = {
  id: string;
  action_type: string | null;
  target_label: string | null;
  status: string | null;
  created_at: string | null;
  scheduled_at: string | null;
  metadata: Record<string, unknown> | null;
};

function statusLabel(status: string | null) {
  if (status === "pending_hr_validation") return "En attente de validation RH";
  if (status === "expert_notified") return "Expert en cours de sélection";
  if (status === "scheduled") return "Session prévue";
  return status ?? "En cours";
}

export function SalarieDashboardClient() {
  const supabase = useSupabase();
  const { loading: snapshotLoading, snapshot, refresh } = useLearnerSnapshot();
  const [managerId, setManagerId] = useState<string | null>(null);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requests, setRequests] = useState<ActionRequestRow[]>([]);
  const [showPlan, setShowPlan] = useState(false);

  const firstName = snapshot?.firstName?.trim() || "Apprenant";
  const discScores = snapshot?.discScores ?? null;
  const idmcAxes = snapshot?.idmcAxes ?? null;
  const softSkillsRadar = snapshot?.softSkillsRadar ?? [];

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowPlan(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/radar-equipe/partage");
        const json = (await res.json()) as { managerId?: string | null };
        if (json.managerId) setManagerId(json.managerId);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  useEffect(() => {
    if (!snapshot?.userId) return;
    let cancelled = false;
    async function loadRequests() {
      setRequestsLoading(true);
      try {
        const { data, error } = await supabase
          .from("action_requests")
          .select("id,action_type,target_label,status,created_at,scheduled_at,metadata")
          .order("created_at", { ascending: false })
          .limit(20);
        if (error) throw error;
        const all = (data ?? []) as ActionRequestRow[];
        const mine = all.filter(
          (r) =>
            r.metadata?.requester_type === "employee" &&
            r.metadata?.requester_id === snapshot.userId,
        );
        if (!cancelled) setRequests(mine);
      } catch {
        if (!cancelled) setRequests([]);
      } finally {
        if (!cancelled) setRequestsLoading(false);
      }
    }
    void loadRequests();
    return () => {
      cancelled = true;
    };
  }, [snapshot?.userId, supabase]);

  const tagline = useMemo(() => {
    const hasTests = Boolean(discScores || idmcAxes || softSkillsRadar.length > 0);
    if (!hasTests) {
      return "Passez vos tests DISC, IDMC et soft skills pour alimenter votre suivi bien-être et votre profil.";
    }
    return "Votre espace de suivi continu : tests, micro check-in et demandes d'accompagnement.";
  }, [discScores, idmcAxes, softSkillsRadar.length]);

  const plan = useMemo(
    () =>
      snapshot
        ? buildPersonalizedActionPlan({
            firstName: snapshot.firstName,
            jobTitle: snapshot.jobTitle,
            discScores: snapshot.discScores,
            idmcAxes: snapshot.idmcAxes,
            softSkills: snapshot.softSkillsRadar,
            surface: "salarie",
          })
        : null,
    [snapshot],
  );

  return (
    <div className={SALARIE_PAGE_SHELL}>
      <header className="mb-10">
        <p className={APPRENANT_PAGE_KICKER}>Espace salarié</p>
        <h1 className={cn("mt-2", APPRENANT_PAGE_TITLE)}>Bonjour {firstName}</h1>
        <p className="mt-3 max-w-3xl text-sm text-white/55">{tagline}</p>
      </header>

      <section className="mb-10 space-y-4">
        <MicroCheckinWidget />
        {managerId ? <ProfilPartageConsent managerId={managerId} /> : null}
      </section>

      {showPlan ? (
        <section className="mb-10">
          <PersonalizedActionPlanSection
            loading={snapshotLoading}
            plan={plan}
            parcoursHref="/dashboard/salarie/parcours"
          />
        </section>
      ) : null}

      {snapshotLoading ? (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 text-center text-sm text-white/50">
          Chargement de vos résultats…
        </div>
      ) : (
        <ApprenantAssessmentResults
          variant="full"
          testSurface="salarie"
          firstName={firstName}
          discScores={discScores}
          idmcAxes={idmcAxes}
          softSkillsRadar={softSkillsRadar}
        />
      )}

      <section className="mt-12">
        <div className="mb-5">
          <h2 className="text-lg font-medium text-white">Mes prochaines étapes</h2>
          <p className="mt-1 text-sm text-white/55">
            Suivi de vos demandes d&apos;accompagnement envoyées à votre RH.
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
          {requestsLoading ? (
            <div className="space-y-3">
              {[0, 1].map((k) => (
                <div key={k} className="h-14 animate-pulse rounded-2xl bg-white/[0.06]" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <p className="text-sm text-white/50">Aucune demande envoyée pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => (
                <div key={r.id} className="rounded-2xl border border-white/[0.08] bg-black/20 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">
                        {String(r.metadata?.title ?? r.action_type ?? "Demande")}
                      </div>
                      <div className="mt-1 text-xs text-white/45">{statusLabel(r.status)}</div>
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                      {statusLabel(r.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <p className="mt-10 text-xs text-white/35">
        Besoin de gérer le partage de vos tests avec votre entreprise ?{" "}
        <Link href="/dashboard/salarie/partage-entreprise" className="underline hover:text-white/60">
          Paramètres de confidentialité
        </Link>
      </p>
    </div>
  );
}
