"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import {
  EnterpriseEmployeeMissions,
  type EmployeeMission,
} from "@/components/enterprise/enterprise-employee-missions";
import {
  EnterpriseEmployeeHrPanel,
  type HrDocument,
} from "@/components/enterprise/enterprise-employee-hr-panel";
import { EnterpriseEmployeeEntretiensSection } from "@/components/enterprise/enterprise-employee-entretiens";
import { EnterpriseEmployeeInclusionCta } from "@/components/enterprise/enterprise-employee-inclusion";
import { formatSeniority } from "@/lib/entreprise/seniority";
import { gapStatusLabel, type SoftSkillGap } from "@/lib/entreprise/metier-skill-gaps";
import type { EmployeeInclusionProfile } from "@/lib/entreprise/inclusion-accommodations";
import {
  AXES_LABELS,
  IDMC_AXIS_KEYS,
  resolveIdmcAxisMasteryLevel,
  type AxisKey,
} from "@/lib/idmc/idmc-display";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  Building2,
  ChevronRight,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Trash2,
  X,
} from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

type EmployeeRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email?: string | null;
  phone?: string | null;
  hire_date?: string | null;
  job_title: string | null;
  department: string | null;
  metier?: string | null;
};

type DiagnosticResultsJson = Partial<
  Record<"stress" | "organisation" | "communication" | "decision" | "leadership", number>
>;

type DiagnosticRow = {
  id: string;
  employee_id: string;
  created_at: string;
  idmc_score: number | null;
  results: DiagnosticResultsJson | null;
};

type RecommendedActionRow = {
  id: string;
  title: string;
  dimension_key: string;
  description: string | null;
};

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

function scoreToVigilance(stressScore: number | null | undefined) {
  const v = typeof stressScore === "number" ? stressScore : null;
  if (v == null) return { label: "Attention", tone: "amber" as const };
  if (v < 30) return { label: "Critique", tone: "red" as const };
  if (v < 60) return { label: "Attention", tone: "amber" as const };
  return { label: "OK", tone: "emerald" as const };
}

function initials(first?: string | null, last?: string | null) {
  return `${(first ?? "").trim().charAt(0)}${(last ?? "").trim().charAt(0)}`.toUpperCase() || "?";
}

function SkillLevelBar({ score }: { score: number }) {
  // Soft Skills EDGE : 3–15
  const filled = score >= 12 ? 3 : score >= 9 ? 2 : 1;
  return (
    <div className="flex items-center gap-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-5 rounded-full",
            i < filled ? "bg-[#0f766e]" : "bg-gray-200",
          )}
        />
      ))}
    </div>
  );
}

function MiniBar({ label, score }: { label: string; score: number }) {
  const tone = score < 40 ? "red" : score < 60 ? "amber" : "emerald";
  const fill =
    tone === "red" ? "bg-red-500" : tone === "amber" ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold uppercase tracking-widest text-gray-500">{label}</div>
        <div className="text-sm font-black text-gray-900">{score}</div>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div className={cn("h-full rounded-full", fill)} style={{ width: `${Math.round(clamp01(score / 100) * 100)}%` }} />
      </div>
    </div>
  );
}

function ProgressRing({ value }: { value: number }) {
  const size = 84;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = clamp01(value / 100);
  const dash = c * (1 - pct);
  return (
    <div className="relative h-[84px] w-[84px]">
      <svg width={size} height={size} className="block">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#E5E7EB" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#0f766e"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={dash}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-2xl font-black tracking-tight text-gray-950">{Math.round(value)}</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">IDMC</div>
        </div>
      </div>
    </div>
  );
}

function BehavioralRadar({
  disc,
}: {
  disc: { D: number; I: number; S: number; C: number };
}) {
  const data = [
    { axis: "Décisionnel", score: Math.round(disc.D) },
    { axis: "Relationnel", score: Math.round(disc.I) },
    { axis: "Stable", score: Math.round(disc.S) },
    { axis: "Structuré", score: Math.round(disc.C) },
  ];
  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(15,23,42,0.10)" />
          <PolarAngleAxis dataKey="axis" tick={{ fill: "rgba(15,23,42,0.8)", fontSize: 12 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar dataKey="score" stroke="#0f766e" fill="rgba(15,118,110,0.22)" strokeWidth={2} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SoftSkillsRanking({ skills }: { skills: Array<{ skill: string; score: number }> }) {
  const ranked = [...skills].sort((a, b) => b.score - a.score);
  return (
    <ol className="space-y-2">
      {ranked.map((s, index) => (
        <li
          key={s.skill}
          className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-[#fafafa] px-3 py-2"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-black text-teal-800">
              {index + 1}
            </span>
            <span className="truncate text-sm font-semibold text-gray-900">{s.skill}</span>
          </div>
          <div className="flex items-center gap-3">
            <SkillLevelBar score={s.score} />
            <span className="w-12 text-right text-sm font-bold text-gray-950">
              {Math.round(s.score)}/15
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function SalarieDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const employeeId = params?.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [employee, setEmployee] = useState<EmployeeRow | null>(null);
  const [diagnostics, setDiagnostics] = useState<DiagnosticRow[]>([]);
  const [hasDiagnostics, setHasDiagnostics] = useState(false);
  const [pendingShareConsent, setPendingShareConsent] = useState(false);
  const [testResults, setTestResults] = useState<{
    disc: { D: number; I: number; S: number; C: number } | null;
    behavioral_profile?: string | null;
    idmc_score: number | null;
    idmc_axes?: Record<string, number> | null;
    soft_skills: Array<{ skill: string; score: number }>;
  } | null>(null);
  const [metierMatch, setMetierMatch] = useState<{
    id: string;
    title: string;
    soft_skill_gaps: SoftSkillGap[];
  } | null>(null);
  const [missions, setMissions] = useState<EmployeeMission[]>([]);
  const [hrDocuments, setHrDocuments] = useState<HrDocument[]>([]);
  const [inclusion, setInclusion] = useState<EmployeeInclusionProfile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [recommendedAction, setRecommendedAction] = useState<RecommendedActionRow | null>(null);
  const [shareConsent, setShareConsent] = useState(false);
  const [profileAnalysisLoading, setProfileAnalysisLoading] = useState(false);
  const [profileAnalysisError, setProfileAnalysisError] = useState<string | null>(null);
  const [profileAnalysis, setProfileAnalysis] = useState<{
    strengths: string[];
    improvements: string[];
    summary: string | null;
    updatedAt: string | null;
    cached: boolean;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!employeeId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/dashboard/entreprise/employees/${encodeURIComponent(employeeId)}`);
        const payload = (await res.json().catch(() => ({}))) as {
          employee?: EmployeeRow;
          diagnostics?: DiagnosticRow[];
          has_diagnostics?: boolean;
          pending_share_consent?: boolean;
          test_results?: {
            disc: { D: number; I: number; S: number; C: number } | null;
            behavioral_profile?: string | null;
            idmc_score: number | null;
            idmc_axes?: Record<string, number> | null;
            soft_skills: Array<{ skill: string; score: number }>;
          };
          test_status?: { share_consent?: boolean };
          missions?: EmployeeMission[];
          hr_documents?: HrDocument[];
          inclusion?: EmployeeInclusionProfile | null;
          recommended_action?: RecommendedActionRow | null;
          metier_match?: {
            id: string;
            title: string;
            soft_skill_gaps: SoftSkillGap[];
          } | null;
          error?: string;
        };

        if (!res.ok) {
          if (!cancelled) {
            setEmployee(null);
            setError(payload.error ?? "Impossible de charger la fiche collaborateur.");
          }
          return;
        }

        if (!cancelled) {
          setEmployee(payload.employee ?? null);
          setDiagnostics(payload.diagnostics ?? []);
          setHasDiagnostics(Boolean(payload.has_diagnostics));
          setPendingShareConsent(Boolean(payload.pending_share_consent));
          setShareConsent(Boolean(payload.test_status?.share_consent));
          setTestResults(payload.test_results ?? null);
          setMetierMatch(payload.metier_match ?? null);
          setProfileAnalysis(null);
          setProfileAnalysisError(null);
          setMissions(payload.missions ?? []);
          setHrDocuments(payload.hr_documents ?? []);
          setInclusion(payload.inclusion ?? null);
          setRecommendedAction(payload.recommended_action ?? null);
          setEditing(false);
        }
      } catch {
        if (!cancelled) setError("Impossible de charger la fiche collaborateur.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  useEffect(() => {
    if (!employeeId || !shareConsent || !hasDiagnostics) return;

    let cancelled = false;
    async function loadProfileAnalysis() {
      setProfileAnalysisLoading(true);
      setProfileAnalysisError(null);
      try {
        const res = await fetch(
          `/api/dashboard/entreprise/employees/${encodeURIComponent(employeeId!)}/profile-analysis`,
        );
        const payload = (await res.json().catch(() => ({}))) as {
          sections?: { strengths?: string[]; improvements?: string[]; summary?: string | null };
          updatedAt?: string | null;
          cached?: boolean;
          error?: string;
        };
        if (!res.ok) {
          if (!cancelled) {
            setProfileAnalysis(null);
            setProfileAnalysisError(payload.error ?? "Impossible de charger l'analyse croisée.");
          }
          return;
        }
        if (!cancelled) {
          setProfileAnalysis({
            strengths: payload.sections?.strengths ?? [],
            improvements: payload.sections?.improvements ?? [],
            summary: payload.sections?.summary ?? null,
            updatedAt: payload.updatedAt ?? null,
            cached: Boolean(payload.cached),
          });
        }
      } catch {
        if (!cancelled) {
          setProfileAnalysis(null);
          setProfileAnalysisError("Impossible de charger l'analyse croisée.");
        }
      } finally {
        if (!cancelled) setProfileAnalysisLoading(false);
      }
    }

    void loadProfileAnalysis();
    return () => {
      cancelled = true;
    };
  }, [employeeId, shareConsent, hasDiagnostics]);

  const displayEmployee = employee;
  const latest = diagnostics[0] ?? null;
  const idmc = latest?.idmc_score ?? testResults?.idmc_score ?? 0;
  const stressScore =
    latest?.results?.stress ??
    testResults?.soft_skills.find((s) => /gestion du stress/i.test(s.skill))?.score ??
    null;
  const vigilance = scoreToVigilance(stressScore);
  const seniority = formatSeniority(displayEmployee?.hire_date);

  const idmcAxesList = useMemo(() => {
    const axes = testResults?.idmc_axes ?? null;
    if (!axes) return [] as Array<{ key: AxisKey; label: string; score: number; mastery: string }>;
    return IDMC_AXIS_KEYS.map((key) => {
      const score = Math.round(Number(axes[key] ?? 0));
      return {
        key,
        label: AXES_LABELS[key],
        score,
        mastery: resolveIdmcAxisMasteryLevel(score),
      };
    });
  }, [testResults?.idmc_axes]);

  const radarData = useMemo(
    () => idmcAxesList.map((d) => ({ skill: d.label, score: d.score })),
    [idmcAxesList],
  );

  const aiInsight = useMemo(() => {
    if (!hasDiagnostics) return null;
    const weakIdmc = [...idmcAxesList].sort((a, b) => a.score - b.score)[0];
    const weakSoft = [...(testResults?.soft_skills ?? [])].sort((a, b) => a.score - b.score)[0];
    if (weakIdmc && weakIdmc.score < 55) {
      return `Priorité IDMC : renforcer « ${weakIdmc.label} » (${weakIdmc.score}/100 — ${weakIdmc.mastery}).`;
    }
    if (weakSoft && weakSoft.score < 60) {
      return `Priorité soft skills : travailler « ${weakSoft.skill} » (${Math.round(weakSoft.score)}/15).`;
    }
    if (stressScore != null && stressScore < 50) {
      return "Gagne en efficacité quand la charge est stabilisée et que les attentes sont explicites.";
    }
    return "Progresse plus vite avec des consignes concrètes, un suivi régulier et un plan ciblé sur 1–2 axes faibles.";
  }, [hasDiagnostics, idmcAxesList, testResults?.soft_skills, stressScore]);

  const actionBlock = useMemo(() => {
    if (!hasDiagnostics) return null;
    if (recommendedAction) return recommendedAction;
    const weakIdmc = [...idmcAxesList].sort((a, b) => a.score - b.score)[0];
    if (weakIdmc && weakIdmc.score < 55) {
      return {
        id: "fallback-idmc",
        title: `Consolider « ${weakIdmc.label} »`,
        dimension_key: weakIdmc.key,
        description: `Score IDMC ${weakIdmc.score}/100 — ${weakIdmc.mastery}. Un accompagnement ciblé est recommandé.`,
      } satisfies RecommendedActionRow;
    }
    if (stressScore != null && stressScore < 50) {
      return {
        id: "fallback-stress",
        title: "Coaching 1:1 recommandé",
        dimension_key: "stress",
        description: "Un atelier collectif est recommandé si plusieurs signaux convergent.",
      } satisfies RecommendedActionRow;
    }
    return {
      id: "fallback-orga",
      title: "Clarifier la priorisation",
      dimension_key: "organisation",
      description: "Un accompagnement individuel est recommandé.",
    } satisfies RecommendedActionRow;
  }, [idmcAxesList, recommendedAction, hasDiagnostics, stressScore]);

  const deleteEmployee = async () => {
    if (!employeeId) return;
    const name = [displayEmployee?.first_name, displayEmployee?.last_name].filter(Boolean).join(" ");
    if (!confirm(`Supprimer définitivement ${name || "ce collaborateur"} ? Cette action est irréversible.`)) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/dashboard/entreprise/employees/${encodeURIComponent(employeeId)}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      router.push("/dashboard/entreprise/salaries");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Suppression impossible");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#f7f7f5]">
        <EnterpriseSidebar />
        <main className="flex-1 px-8 py-10 lg:pl-[280px] text-sm text-gray-500">Chargement…</main>
      </div>
    );
  }

  if (!displayEmployee) {
    return (
      <div className="flex min-h-screen bg-[#f7f7f5]">
        <EnterpriseSidebar />
        <main className="flex-1 px-8 py-10 lg:pl-[280px]">
          <p className="text-sm font-semibold text-gray-900">{error ?? "Collaborateur introuvable."}</p>
          <button
            type="button"
            onClick={() => router.push("/dashboard/entreprise/salaries")}
            className="mt-4 text-sm font-semibold text-violet-600"
          >
            ← Retour à la liste
          </button>
        </main>
      </div>
    );
  }

  const fullName = `${displayEmployee.first_name ?? ""} ${displayEmployee.last_name ?? ""}`.trim() || "Collaborateur";
  const softSkills = testResults?.soft_skills ?? [];

  return (
    <div className="flex min-h-screen bg-[#f7f7f5] font-sans text-gray-900">
      <EnterpriseSidebar />
      <main className="relative z-10 flex-1 px-4 py-8 sm:px-8 lg:pl-[280px]">
        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
        ) : null}

        {editing ? (
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <span>Mode édition — seules les sections autorisées sont modifiables.</span>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="inline-flex items-center gap-1 font-semibold text-amber-900"
            >
              <X className="h-4 w-4" /> Terminer
            </button>
          </div>
        ) : null}

        {/* Header profil */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 flex-1 gap-5">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0f766e] to-[#134e4a] text-2xl font-black text-white shadow-inner sm:h-28 sm:w-28 sm:text-3xl">
                {initials(displayEmployee.first_name, displayEmployee.last_name)}
              </div>
              <div className="min-w-0">
                <h1 className="text-3xl font-black tracking-tight text-[#0f3d3a] sm:text-4xl">{fullName}</h1>
                <p className="mt-1 text-base text-gray-700 sm:text-lg">
                  {displayEmployee.job_title ?? "Poste non renseigné"}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    {displayEmployee.department ?? "Département"}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                    {metierMatch?.title ?? displayEmployee.metier ?? "Métier non lié"}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    Ancienneté {seniority ?? "—"}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {hasDiagnostics ? (
                    <>
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-bold",
                          vigilance.tone === "emerald" && "bg-emerald-50 text-emerald-700",
                          vigilance.tone === "amber" && "bg-amber-50 text-amber-800",
                          vigilance.tone === "red" && "bg-red-50 text-red-700",
                        )}
                      >
                        Vigilance {vigilance.label}
                      </span>
                      {testResults?.behavioral_profile ? (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                          Profil {testResults.behavioral_profile}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                      Diagnostic à compléter
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[220px]">
              {!editing ? (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#e8a598] px-5 py-3 text-sm font-bold text-[#5c2e26] transition hover:bg-[#e09788]"
                >
                  <Pencil className="h-4 w-4" />
                  Modifier
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0f766e] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0d9488]"
                >
                  Terminer l&apos;édition
                </button>
              )}
              <EnterpriseEmployeeInclusionCta
                employeeName={
                  [displayEmployee.first_name, displayEmployee.last_name].filter(Boolean).join(" ") ||
                  "Collaborateur"
                }
                profile={inclusion}
              />
              <button
                type="button"
                onClick={() => router.push("/dashboard/entreprise/salaries")}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                ← Retour à l&apos;équipe
              </button>
              {editing ? (
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => void deleteEmployee()}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  {deleting ? "Suppression…" : "Supprimer"}
                </button>
              ) : null}
            </div>
          </div>

          {/* Bandeau infos clés */}
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-100 bg-[#f7f7f5] px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Email</p>
              <p className="mt-1 truncate text-sm font-semibold text-gray-900">{displayEmployee.email ?? "—"}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-[#f7f7f5] px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Téléphone</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{displayEmployee.phone?.trim() || "—"}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-[#f7f7f5] px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Fiche métier</p>
              <p className="mt-1 truncate text-sm font-semibold text-gray-900">
                {metierMatch?.title ?? displayEmployee.metier ?? "—"}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-[#f7f7f5] px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Entretiens</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{hrDocuments.length} document(s)</p>
            </div>
          </div>
        </section>

        {/* Recommandations juste sous la présentation */}
        {hasDiagnostics ? (
          <section className="mt-6 rounded-2xl border border-teal-200 bg-teal-50/40 p-6 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-gray-950">Recommandations</h2>
            <p className="mt-1 text-sm text-gray-600">
              Synthèse actionnable à partir du profil comportemental, de l&apos;IDMC et des soft skills.
            </p>
            {!shareConsent ? (
              <p className="mt-4 rounded-xl border border-violet-200 bg-violet-50/70 px-4 py-3 text-sm text-violet-950">
                Consentement de partage entreprise requis pour afficher l&apos;analyse croisée.
              </p>
            ) : profileAnalysisLoading ? (
              <p className="mt-4 text-sm text-gray-500">Génération des recommandations…</p>
            ) : profileAnalysisError ? (
              <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                {profileAnalysisError}
              </p>
            ) : (
              <>
                {aiInsight ? <p className="mt-4 text-sm leading-relaxed text-gray-800">{aiInsight}</p> : null}
                {profileAnalysis?.summary ? (
                  <p className="mt-3 text-sm leading-relaxed text-gray-700">{profileAnalysis.summary}</p>
                ) : null}
                {profileAnalysis ? (
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-emerald-200 bg-white/80 p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-emerald-700">Forces</p>
                      <ul className="mt-3 space-y-2 text-sm text-emerald-900">
                        {(profileAnalysis.strengths.length > 0
                          ? profileAnalysis.strengths
                          : ["Analyse en cours."]
                        ).map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-white/80 p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-amber-800">
                        Axes d&apos;amélioration
                      </p>
                      <ul className="mt-3 space-y-2 text-sm text-amber-900">
                        {(profileAnalysis.improvements.length > 0
                          ? profileAnalysis.improvements
                          : ["Aucun axe prioritaire."]
                        ).map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}
              </>
            )}
            {actionBlock ? (
              <div className="mt-5 rounded-xl border border-teal-300 bg-white p-4">
                <p className="text-sm font-bold text-teal-950">{actionBlock.title}</p>
                <p className="mt-1 text-sm text-teal-900/80">{actionBlock.description}</p>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/entreprise/actions/demo-stress")}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-teal-900"
                >
                  Accéder aux experts <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </section>
        ) : null}

        {!hasDiagnostics && pendingShareConsent ? (
          <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 px-6 py-5 text-sm text-violet-950">
            <p className="font-semibold">En attente du consentement RGPD</p>
            <p className="mt-1 text-violet-900/80">
              Les résultats restent privés tant que le collaborateur n&apos;a pas validé le partage.
            </p>
          </div>
        ) : null}

        {!hasDiagnostics && !pendingShareConsent ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5 text-sm text-amber-950">
            <p className="font-semibold">Aucun diagnostic enregistré</p>
            <p className="mt-1 text-amber-900/80">
              Les scores IDMC, le profil comportemental et les soft skills apparaîtront après les tests apprenant.
            </p>
          </div>
        ) : null}

        {/* Corps : infos + compétences */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Localisation &amp; contact</h2>
              <ul className="mt-4 space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <Mail className="mt-0.5 h-4 w-4 text-gray-400" />
                  <span className="break-all">{displayEmployee.email ?? "—"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Phone className="mt-0.5 h-4 w-4 text-gray-400" />
                  <span>{displayEmployee.phone?.trim() || "—"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Building2 className="mt-0.5 h-4 w-4 text-gray-400" />
                  <span>{displayEmployee.department ?? "—"}</span>
                </li>
              </ul>
            </div>

            {hasDiagnostics ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">IDMC</h2>
                <div className="mt-3 flex justify-center">
                  <ProgressRing value={idmc} />
                </div>
                <p className="mt-4 text-sm leading-relaxed text-gray-600">
                  L&apos;IDMC mesure 8 axes de maturité décisionnelle : connaissance de soi, méthodes,
                  adaptation, organisation, traitement de l&apos;information, résolution de difficultés,
                  suivi de progression et auto-évaluation. Le score global est la moyenne de ces axes.
                </p>
                <p className="mt-3 text-xs text-gray-500">
                  Vigilance associée : <span className="font-semibold">{vigilance.label}</span>
                  {stressScore != null ? ` (gestion du stress ${Math.round(stressScore)})` : ""}
                </p>
              </div>
            ) : null}

            {editing ? (
              <EnterpriseEmployeeHrPanel
                employeeId={employeeId!}
                email={displayEmployee.email ?? null}
                phone={displayEmployee.phone ?? null}
                hireDate={displayEmployee.hire_date ?? null}
                documents={hrDocuments}
                editing
                showContactOnly
                onProfileChange={(patch) =>
                  setEmployee((prev) => (prev ? { ...prev, ...patch } : prev))
                }
                onDocumentsChange={setHrDocuments}
              />
            ) : null}
          </aside>

          <div className="space-y-6">
            {hasDiagnostics && softSkills.length > 0 ? (
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-black tracking-tight text-gray-950">
                  Classement soft skills ({softSkills.length}/20)
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Référentiel EDGE complet : communication, leadership, stress, créativité, etc.
                </p>
                <div className="mt-5">
                  <SoftSkillsRanking skills={softSkills} />
                </div>
              </section>
            ) : null}

            {hasDiagnostics && testResults?.disc ? (
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-black tracking-tight text-gray-950">Test comportemental</h2>
                {testResults.behavioral_profile ? (
                  <p className="mt-2 text-lg font-bold text-[#0f766e]">
                    Profil dominant : {testResults.behavioral_profile}
                  </p>
                ) : null}
                <p className="mt-1 text-sm text-gray-600">
                  Quatre dimensions : Décisionnel, Relationnel, Stable, Structuré.
                </p>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <BehavioralRadar disc={testResults.disc} />
                  <div className="space-y-3">
                    {[
                      { key: "D" as const, label: "Décisionnel", value: testResults.disc.D },
                      { key: "I" as const, label: "Relationnel", value: testResults.disc.I },
                      { key: "S" as const, label: "Stable", value: testResults.disc.S },
                      { key: "C" as const, label: "Structuré", value: testResults.disc.C },
                    ].map((dim) => (
                      <MiniBar key={dim.key} label={dim.label} score={Math.round(dim.value)} />
                    ))}
                  </div>
                </div>
              </section>
            ) : null}

            {hasDiagnostics && metierMatch && metierMatch.soft_skill_gaps.length > 0 ? (
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-black tracking-tight text-gray-950">Écarts vs fiche métier</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Cibles de « {metierMatch.title} » comparées aux soft skills du collaborateur (échelle /15).
                </p>
                <div className="mt-5 space-y-3">
                  {metierMatch.soft_skill_gaps.map((gap) => {
                    const tone =
                      gap.status === "ok"
                        ? "border-emerald-200 bg-emerald-50/50 text-emerald-900"
                        : gap.status === "attention"
                          ? "border-amber-200 bg-amber-50/50 text-amber-950"
                          : gap.status === "critical"
                            ? "border-red-200 bg-red-50/50 text-red-900"
                            : "border-gray-200 bg-gray-50 text-gray-700";
                    return (
                      <div
                        key={gap.skill}
                        className={cn(
                          "flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3",
                          tone,
                        )}
                      >
                        <div>
                          <p className="font-semibold">{gap.skill}</p>
                          <p className="text-xs opacity-80">{gapStatusLabel(gap.status)}</p>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm font-semibold">
                          <span>Cible {gap.target}/15</span>
                          <span>Collab. {gap.actual != null ? `${gap.actual}/15` : "—"}</span>
                          <span>
                            Écart {gap.gap == null ? "—" : gap.gap > 0 ? `+${gap.gap}` : String(gap.gap)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {hasDiagnostics && idmcAxesList.length > 0 ? (
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-black tracking-tight text-gray-950">
                  Profil IDMC (8 axes)
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Score global {Math.round(idmc)}/100 — détail des 8 dimensions mesurées par le test.
                </p>
                <div className="mt-4 grid gap-6 lg:grid-cols-2">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="rgba(15,23,42,0.10)" />
                        <PolarAngleAxis
                          dataKey="skill"
                          tick={{ fill: "rgba(15,23,42,0.75)", fontSize: 9 }}
                        />
                        <PolarRadiusAxis domain={[0, 100]} tick={false} />
                        <Radar
                          dataKey="score"
                          stroke="#0f766e"
                          fill="rgba(15,118,110,0.20)"
                          strokeWidth={2}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    {idmcAxesList.map((d) => (
                      <div key={d.key}>
                        <MiniBar label={d.label} score={d.score} />
                        <p className="mt-1 text-[11px] text-gray-500">{d.mastery}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ) : null}

            <EnterpriseEmployeeMissions
              employeeId={employeeId!}
              missions={missions}
              onChange={setMissions}
              editing={editing}
            />
          </div>
        </div>

        <div className="mt-6">
          <EnterpriseEmployeeEntretiensSection
            employeeId={employeeId!}
            documents={hrDocuments}
            onDocumentsChange={setHrDocuments}
          />
        </div>
      </main>
    </div>
  );
}
