"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Manrope } from "next/font/google";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
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
import { EmployeeHeader, ProfileTabs, parseEmployeeTab, type EmployeeTabId } from "@/components/salarie/employee-fiche-chrome";
import { OverviewSkeleton } from "@/components/salarie/employee-fiche-blocks";
import { EmployeeOverview } from "@/components/salarie/employee-overview";
import { EmployeeSkills } from "@/components/salarie/employee-skills";
import { EmployeeTests } from "@/components/salarie/employee-tests";
import { EmployeeFollow } from "@/components/salarie/employee-follow";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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
const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

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
  profile_id?: string | null;
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
  if (v == null) {
    return {
      label: "Non mesurée",
      tone: "amber" as const,
      hint: "Le score de gestion du stress n'est pas encore disponible. La vigilance se calcule à partir de cet axe IDMC.",
    };
  }
  if (v < 30) {
    return {
      label: "Critique",
      tone: "red" as const,
      hint: `Gestion du stress à ${Math.round(v)}/100. Le niveau est bas : un échange sur la charge est recommandé. Ce n'est pas un diagnostic médical.`,
    };
  }
  if (v < 60) {
    return {
      label: "Attention",
      tone: "amber" as const,
      hint: `Gestion du stress à ${Math.round(v)}/100. Le niveau est fragile : la charge et le suivi méritent d'être allégés. Ce n'est pas un diagnostic médical.`,
    };
  }
  return {
    label: "OK",
    tone: "emerald" as const,
    hint: `Gestion du stress à ${Math.round(v)}/100. Le niveau mesuré est stable.`,
  };
}

function initials(first?: string | null, last?: string | null) {
  return `${(first ?? "").trim().charAt(0)}${(last ?? "").trim().charAt(0)}`.toUpperCase() || "?";
}

function SkillLevelBar({ score }: { score: number }) {
  // Soft Skills Byound : 3–15
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = parseEmployeeTab(searchParams.get("tab"));

  const employeeId = params?.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saveRequest, setSaveRequest] = useState(0);
  const [resendingInvite, setResendingInvite] = useState(false);
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
    disc_at?: string | null;
    idmc_at?: string | null;
    soft_skills_at?: string | null;
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
  const [formationsInProgress, setFormationsInProgress] = useState(0);
  const [assignedFormations, setAssignedFormations] = useState<Array<{ id: string; title: string; progress: number }>>([]);
  const [interviewSignal, setInterviewSignal] = useState(0);
  const [declaredSkills, setDeclaredSkills] = useState(0);
  const [badgesEarned, setBadgesEarned] = useState(0);
  const [activity, setActivity] = useState<Array<{ id: string; label: string; at: string }>>([]);
  const [byoundSkills, setByoundSkills] = useState<Array<{ name: string; status: "declared" | "proof" | "badge" }>>([]);
  const [inclusionSignal, setInclusionSignal] = useState(0);
  const [shareConsent, setShareConsent] = useState(false);
  const [shareConsentAt, setShareConsentAt] = useState<string | null>(null);
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
            disc_at?: string | null;
            idmc_at?: string | null;
            soft_skills_at?: string | null;
          };
          test_status?: { share_consent?: boolean; share_consent_at?: string | null };
          missions?: EmployeeMission[];
          hr_documents?: HrDocument[];
          inclusion?: EmployeeInclusionProfile | null;
          recommended_action?: RecommendedActionRow | null;
          metier_match?: {
            id: string;
            title: string;
            soft_skill_gaps: SoftSkillGap[];
          } | null;
          formations_in_progress?: number;
          assigned_formations?: Array<{ id: string; title: string; progress: number }>;
          declared_skills?: number;
          badges_earned?: number;
          activity?: Array<{ id: string; label: string; at: string }>;
          byound_skills?: Array<{ name: string; status: "declared" | "proof" | "badge" }>;
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
          setShareConsentAt(
            payload.test_status?.share_consent ? payload.test_status.share_consent_at ?? null : null,
          );
          setTestResults(payload.test_results ?? null);
          setMetierMatch(payload.metier_match ?? null);
          setProfileAnalysis(null);
          setProfileAnalysisError(null);
          setMissions(payload.missions ?? []);
          setHrDocuments(payload.hr_documents ?? []);
          setInclusion(payload.inclusion ?? null);
          setRecommendedAction(payload.recommended_action ?? null);
          setFormationsInProgress(Number(payload.formations_in_progress ?? 0));
          setAssignedFormations(payload.assigned_formations ?? []);
          setDeclaredSkills(Number(payload.declared_skills ?? 0));
          setBadgesEarned(Number(payload.badges_earned ?? 0));
          setActivity(payload.activity ?? []);
          setByoundSkills(payload.byound_skills ?? []);
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

  useEffect(() => {
    if (tab !== "tests" || !employeeId) return;
    void fetch(`/api/dashboard/entreprise/employees/${encodeURIComponent(employeeId)}/test-views`, {
      method: "POST",
    });
  }, [tab, employeeId]);

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

  const aiInsight = useMemo(() => {
    if (!hasDiagnostics) return null;
    const weakIdmc = [...idmcAxesList].sort((a, b) => a.score - b.score)[0];
    const weakSoft = [...(testResults?.soft_skills ?? [])].sort((a, b) => a.score - b.score)[0];
    const subject = employee?.first_name?.trim() || "Ce collaborateur";
    if (weakIdmc && weakIdmc.score < 55) {
      return `Priorité IDMC pour ${subject} : renforcer « ${weakIdmc.label} » (${weakIdmc.score}/100 — ${weakIdmc.mastery}).`;
    }
    if (weakSoft && weakSoft.score < 60) {
      return `Priorité soft skills pour ${subject} : travailler « ${weakSoft.skill} » (${Math.round(weakSoft.score)}/15).`;
    }
    if (stressScore != null && stressScore < 50) {
      return `${subject} gagne en efficacité quand la charge est stabilisée et que les attentes sont explicites.`;
    }
    return `${subject} progresse plus vite avec des consignes concrètes, un suivi régulier et un plan ciblé sur 1 ou 2 axes faibles.`;
  }, [hasDiagnostics, idmcAxesList, testResults?.soft_skills, stressScore, employee?.first_name]);

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
        <main className={`${manrope.className} flex-1 bg-[#F4F4F1] px-8 py-10 lg:pl-[280px]`}>
          <OverviewSkeleton />
        </main>
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextInterview = hrDocuments
    .map((doc) => doc.document_date)
    .filter((value): value is string => Boolean(value))
    .filter((value) => {
      const date = new Date(value);
      return !Number.isNaN(date.getTime()) && date.getTime() >= today.getTime();
    })
    .sort()[0];
  const formatPillDate = (value: string | null | undefined) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };
  const pills = [
    hasDiagnostics && latest?.created_at
      ? `Diagnostic complété le ${formatPillDate(latest.created_at)}`
      : "Diagnostic en attente",
    formationsInProgress > 0
      ? `${formationsInProgress} formation${formationsInProgress > 1 ? "s" : ""} en cours`
      : "Aucune formation en cours",
    nextInterview ? `Entretien prévu le ${formatPillDate(nextInterview)}` : "Aucun entretien prévu",
  ];
  const goTab = (next: EmployeeTabId) => {
    const query = new URLSearchParams(searchParams.toString());
    if (next === "overview") query.delete("tab");
    else query.set("tab", next);
    const suffix = query.toString();
    router.replace(suffix ? `${pathname}?${suffix}` : pathname);
  };

  return (
    <div className={`${manrope.className} flex min-h-screen bg-[#F4F4F1] text-[#07080B]`}>
      <EnterpriseSidebar />
      <main className="relative z-10 flex-1 px-4 py-8 sm:px-8 lg:pl-[280px]">
        {editing ? (
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <span>Mode édition — seules les sections autorisées sont modifiables.</span>
            <button
              type="button"
              onClick={() => setSaveRequest((n) => n + 1)}
              className="inline-flex items-center gap-1 font-semibold text-amber-900"
            >
              <X className="h-4 w-4" /> Terminer
            </button>
          </div>
        ) : null}

        {error ? (
          <div className="mb-6 rounded-2xl border border-[#E3E0D8] bg-white p-4 text-sm">{error}</div>
        ) : null}

        <a href="/dashboard/entreprise/salaries" className="inline-flex h-11 items-center rounded-full bg-white px-4 text-sm font-semibold">
          ‹ Mes équipes
        </a>
        <div className="mt-4">
          <EmployeeHeader
            name={fullName}
            initials={initials(displayEmployee.first_name, displayEmployee.last_name)}
            subtitle={[displayEmployee.job_title, displayEmployee.department, displayEmployee.metier ?? metierMatch?.title].filter(Boolean).join(" · ") || "Poste non renseigné"}
            pills={pills}
            email={displayEmployee.email?.trim() || "Non renseigné"}
            phone={displayEmployee.phone?.trim() || "Non renseigné"}
            seniority={seniority || "Non renseigné"}
            inclusion={inclusion?.summary?.trim() || (inclusion && inclusion.status !== "none" ? "Besoin déclaré" : "Aucun besoin déclaré")}
            showInvite={!displayEmployee.profile_id}
            inviteBusy={resendingInvite}
            onAssignFormation={() => router.push("/dashboard/entreprise/formations/gerer")}
            onPlanInterview={() => {
              goTab("overview");
              window.setTimeout(() => document.getElementById("employee-entretiens")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
            }}
            onResendInvite={() => {
              if (!employeeId) return;
              setResendingInvite(true);
              void fetch(`/api/dashboard/entreprise/employees/${encodeURIComponent(employeeId)}/resend-invite`, { method: "POST" })
                .then(async (res) => {
                  const json = (await res.json()) as { error?: string };
                  if (!res.ok) throw new Error(json.error ?? "Envoi impossible");
                  toast.success("Invitation renvoyée");
                })
                .catch((e: unknown) => toast.error(e instanceof Error ? e.message : "Envoi impossible"))
                .finally(() => setResendingInvite(false));
            }}
            onEdit={() => setEditing(true)}
            onInclusion={() => setInclusionSignal((value) => value + 1)}
          />
        </div>
        <EnterpriseEmployeeInclusionCta
          employeeName={fullName}
          profile={inclusion}
          hideButton
          openSignal={inclusionSignal}
        />
        <ProfileTabs current={tab} onChange={goTab} />

        {/* Header profil */}
        <section className="hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
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
                    {displayEmployee.metier ?? metierMatch?.title ?? "Métier non lié"}
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
                      <p className="basis-full text-sm leading-relaxed text-gray-600">{vigilance.hint}</p>
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
                  onClick={() => setSaveRequest((n) => n + 1)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0f766e] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0d9488]"
                >
                  Enregistrer
                </button>
              )}
              <button
                type="button"
                disabled={resendingInvite || !displayEmployee.email}
                onClick={() => {
                  if (!employeeId) return;
                  setResendingInvite(true);
                  void fetch(`/api/dashboard/entreprise/employees/${encodeURIComponent(employeeId)}/resend-invite`, {
                    method: "POST",
                  })
                    .then(async (res) => {
                      const json = (await res.json()) as { error?: string };
                      if (!res.ok) throw new Error(json.error ?? "Envoi impossible");
                      toast.success("Invitation renvoyée");
                    })
                    .catch((e: unknown) => {
                      toast.error(e instanceof Error ? e.message : "Envoi impossible");
                    })
                    .finally(() => setResendingInvite(false));
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-900 transition hover:bg-gray-50 disabled:opacity-60"
              >
                <Mail className="h-4 w-4" />
                {resendingInvite ? "Envoi…" : "Renvoyer l'invitation"}
              </button>
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
                {displayEmployee.metier ?? metierMatch?.title ?? "—"}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-[#f7f7f5] px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Entretiens</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{hrDocuments.length} document(s)</p>
            </div>
          </div>
        </section>

        <div role="tabpanel" id={`employee-panel-${tab}`} aria-labelledby={`employee-tab-${tab}`}>
        {tab === "overview" ? (
        <>
        <EmployeeOverview
          shareConsent={shareConsent}
          hasDiagnostics={hasDiagnostics}
          analysisLoading={profileAnalysisLoading}
          analysisError={profileAnalysisError}
          analysis={profileAnalysis}
          diagnosticAt={latest?.created_at ?? null}
          gaps={metierMatch?.soft_skill_gaps ?? []}
          formationsInProgress={formationsInProgress}
          declaredSkills={declaredSkills}
          badgesEarned={badgesEarned}
          documents={hrDocuments}
          activity={activity}
          onOpenSkills={() => goTab("skills")}
          onOpenTests={() => goTab("tests")}
          onOpenFollow={() => goTab("follow")}
          onAssignFormation={() => router.push("/dashboard/entreprise/formations/gerer")}
          onPrepareInterview={() => {
            window.setTimeout(() => document.getElementById("employee-entretiens")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
          }}
          onEdit={() => setEditing(true)}
        />
        {editing ? (
          <div className="mt-6">
            <EnterpriseEmployeeHrPanel
              employeeId={employeeId!}
              email={displayEmployee.email ?? null}
              phone={displayEmployee.phone ?? null}
              hireDate={displayEmployee.hire_date ?? null}
              jobTitle={displayEmployee.job_title ?? null}
              metier={displayEmployee.metier ?? null}
              documents={hrDocuments}
              editing
              showContactOnly
              onProfileChange={(patch) => setEmployee((prev) => (prev ? { ...prev, ...patch } : prev))}
              onDocumentsChange={setHrDocuments}
              saveRequest={saveRequest}
              onSaved={() => setEditing(false)}
            />
          </div>
        ) : null}
        <div className="mt-6">
          <EnterpriseEmployeeMissions
            employeeId={employeeId!}
            missions={missions}
            onChange={setMissions}
            editing={editing}
          />
        </div>
        </>
        ) : tab === "skills" ? (
          <EmployeeSkills
            employeeId={employeeId!}
            firstName={displayEmployee.first_name?.trim() || "ce collaborateur"}
            metierTitle={displayEmployee.metier ?? metierMatch?.title ?? null}
            shareConsent={shareConsent}
            gaps={metierMatch?.soft_skill_gaps ?? []}
            softSkills={softSkills}
            byoundSkills={byoundSkills}
            onAssignFormation={() => router.push("/dashboard/entreprise/formations/gerer")}
            onEdit={() => setEditing(true)}
          />
        ) : tab === "tests" ? (
          <EmployeeTests
            employeeId={employeeId!}
            firstName={displayEmployee.first_name?.trim() || "Ce collaborateur"}
            shareConsent={shareConsent}
            shareConsentAt={shareConsentAt}
            disc={testResults?.disc ?? null}
            idmcScore={testResults?.idmc_score ?? null}
            idmcAxes={testResults?.idmc_axes ?? null}
            softSkills={softSkills}
            discAt={testResults?.disc_at ?? null}
            idmcAt={testResults?.idmc_at ?? null}
            softSkillsAt={testResults?.soft_skills_at ?? null}
          />
        ) : (
          <EmployeeFollow
            employeeId={employeeId!}
            firstName={displayEmployee.first_name?.trim() || "Ce collaborateur"}
            fullName={fullName}
            hireDate={displayEmployee.hire_date ?? null}
            documents={hrDocuments}
            missions={missions}
            onMissionsChange={setMissions}
            gaps={metierMatch?.soft_skill_gaps ?? []}
            shareConsent={shareConsent}
            disc={testResults?.disc ?? null}
            idmcAxes={testResults?.idmc_axes ?? null}
            formations={assignedFormations}
            byoundSkills={byoundSkills}
            onPlanInterview={() => setInterviewSignal((value) => value + 1)}
            onAssignFormation={() => router.push("/dashboard/entreprise/formations/gerer")}
          />
        )}
        <div id="employee-entretiens" className={tab === "overview" ? "mt-6" : undefined}>
          <EnterpriseEmployeeEntretiensSection
            employeeId={employeeId!}
            employeeName={fullName}
            employeeFirstName={displayEmployee.first_name}
            documents={hrDocuments}
            onDocumentsChange={setHrDocuments}
            openSignal={interviewSignal}
            hideSection={tab !== "overview"}
          />
        </div>
        </div>
      </main>
    </div>
  );
}
