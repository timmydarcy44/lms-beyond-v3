"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSupabase } from "@/components/providers/supabase-provider";
import SidebarSalarie from "@/components/SidebarSalarie";
import { ConnectCockpitBackdrop } from "@/components/apprenant/connect-cockpit-backdrop";
import {
  ApprenantAssessmentResults,
  type DiscScores,
} from "@/components/apprenant/apprenant-assessment-results";
import { MicroCheckinWidget } from "@/components/radar-equipe/micro-checkin-widget";
import { ProfilPartageConsent } from "@/components/radar-equipe/profil-partage-consent";
import { resolveIdmcAxes, type AxisKey } from "@/components/idmc/IdmcRadarChart";
import { APPRENANT_PAGE_KICKER, APPRENANT_PAGE_TITLE } from "@/lib/apprenant/connect-nav";
import { resolveLearnerDisplayFirstName } from "@/lib/apprenant/display-first-name";
import { parseStoredDiscScores } from "@/lib/disc/disc-scoring";
import {
  fetchLatestSoftSkillsResult,
  parseSoftSkillsScoreEntries,
} from "@/lib/soft-skills/resolve-soft-skills-result";
import { cn } from "@/lib/utils";

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
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("Vous");
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [managerId, setManagerId] = useState<string | null>(null);
  const [discScores, setDiscScores] = useState<DiscScores | null>(null);
  const [idmcAxes, setIdmcAxes] = useState<Record<AxisKey, number> | null>(null);
  const [softSkillsRadar, setSoftSkillsRadar] = useState<Array<{ skill: string; score: number }>>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requests, setRequests] = useState<ActionRequestRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const { data: userData, error } = await supabase.auth.getUser();
        if (error) throw error;
        const user = userData.user;
        if (!user) throw new Error("not_authenticated");
        if (!cancelled) setEmployeeId(user.id);

        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name, email, display_name")
          .eq("id", user.id)
          .maybeSingle();

        if (!cancelled) {
          const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
          setFirstName(
            resolveLearnerDisplayFirstName({
              profileFirstName: profile?.first_name,
              metadataFirstName: typeof meta.first_name === "string" ? meta.first_name : null,
              metadataPrenom: typeof meta.prenom === "string" ? meta.prenom : null,
              metadataGivenName: typeof meta.given_name === "string" ? meta.given_name : null,
              email: profile?.email ?? user.email,
            }),
          );
        }

        const [{ data: discRow }, { data: idmcRow }, softRow] = await Promise.all([
          supabase.from("disc_resultats").select("scores").eq("profile_id", user.id).maybeSingle(),
          supabase
            .from("idmc_resultats")
            .select("scores, responses, global_score, level")
            .eq("profile_id", user.id)
            .maybeSingle(),
          fetchLatestSoftSkillsResult(supabase, user.id, "scores"),
        ]);

        if (!cancelled) {
          const parsedDisc = parseStoredDiscScores(
            (discRow?.scores as Record<string, unknown> | null) ?? null,
          );
          setDiscScores(parsedDisc);

          const axes = resolveIdmcAxes(idmcRow?.scores ?? idmcRow?.responses);
          setIdmcAxes(axes);

          setSoftSkillsRadar(parseSoftSkillsScoreEntries(softRow?.scores));
        }
      } catch {
        if (!cancelled) {
          setEmployeeId(null);
          setFirstName("Vous");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

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
    let cancelled = false;
    async function loadRequests() {
      if (!employeeId) return;
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
          (r) => r.metadata?.requester_type === "employee" && r.metadata?.requester_id === employeeId,
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
  }, [employeeId, supabase]);

  const tagline = useMemo(() => {
    const hasTests = Boolean(discScores || idmcAxes || softSkillsRadar.length > 0);
    if (!hasTests) {
      return "Passez vos tests DISC, IDMC et soft skills pour alimenter votre suivi bien-être et votre profil.";
    }
    return "Votre espace de suivi continu : tests, micro check-in et demandes d'accompagnement.";
  }, [discScores, idmcAxes, softSkillsRadar.length]);

  return (
    <div className="relative min-h-screen text-slate-100">
      <ConnectCockpitBackdrop />
      <SidebarSalarie />
      <main className="relative flex-1 overflow-y-auto lg:pl-[280px]">
        <div className="mx-auto w-full max-w-[1400px] px-5 py-10 sm:px-8 lg:px-10">
          <header className="mb-10">
            <p className={APPRENANT_PAGE_KICKER}>Espace salarié</p>
            <h1 className={cn("mt-2", APPRENANT_PAGE_TITLE)}>Bonjour {firstName}</h1>
            <p className="mt-3 max-w-3xl text-sm text-white/55">{tagline}</p>
          </header>

          <section className="mb-10 space-y-4">
            <MicroCheckinWidget />
            {managerId ? <ProfilPartageConsent managerId={managerId} /> : null}
          </section>

          {loading ? (
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
      </main>
    </div>
  );
}
