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
import { cn } from "@/lib/utils";
import { AlertTriangle, ChevronRight, Trash2 } from "lucide-react";
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

type DimensionKey = "stress" | "organisation" | "communication" | "decision" | "leadership";
type DimScore = { key: DimensionKey; label: string; score: number };

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

function scoreToVigilance(stressScore: number | null | undefined) {
  const v = typeof stressScore === "number" ? stressScore : null;
  if (v == null) return { label: "Attention", tone: "amber" as const, emoji: "🟡" };
  // Exigence produit: rouge si stress < 30, même si IDMC est bon
  if (v < 30) return { label: "Critique", tone: "red" as const, emoji: "🔴" };
  if (v < 60) return { label: "Attention", tone: "amber" as const, emoji: "🟡" };
  return { label: "OK", tone: "emerald" as const, emoji: "🟢" };
}

function MiniBar({ label, score }: { label: string; score: number }) {
  const tone = score < 40 ? "red" : score < 60 ? "amber" : "emerald";
  const fill =
    tone === "red" ? "bg-red-500" : tone === "amber" ? "bg-amber-500" : "bg-emerald-500";
  const qualifier = score < 50 ? "Sous le seuil recommandé" : score > 70 ? "Optimal" : "";
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-500">{label}</div>
          {qualifier ? <div className="text-xs font-semibold text-gray-500">{qualifier}</div> : null}
        </div>
        <div className="text-sm font-black text-gray-900">{score}</div>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={cn("h-full rounded-full", fill)}
          style={{ width: `${Math.round(clamp01(score / 100) * 100)}%` }}
        />
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
          stroke="url(#idmc)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={dash}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <defs>
          <linearGradient id="idmc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1E3A8A" />
            <stop offset="1" stopColor="#6D28D9" />
          </linearGradient>
        </defs>
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

function SoftSkillsRadar({ data }: { data: Array<{ skill: string; score: number }> }) {
  return (
    <div className="h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(15,23,42,0.10)" />
          <PolarAngleAxis dataKey="skill" tick={{ fill: "rgba(15,23,42,0.75)", fontSize: 10 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} />
          {/* Zone de rupture (scores < 40) */}
          {/* Recharts ne fournit pas un "reference area" polar, on dessine un disque central. */}
          {/* eslint-disable-next-line react/no-unknown-property */}
          <circle cx="50%" cy="50%" r="22%" fill="rgba(244,63,94,0.12)" />
          {/* eslint-disable-next-line react/no-unknown-property */}
          <text x="50%" y="52%" textAnchor="middle" fill="rgba(244,63,94,0.65)" fontSize="10" fontWeight="700">
            Zone de Rupture
          </text>
          <Radar dataKey="score" stroke="#4F46E5" fill="rgba(79,70,229,0.22)" strokeWidth={2} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function SalarieDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const employeeId = params?.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employee, setEmployee] = useState<EmployeeRow | null>(null);
  const [diagnostics, setDiagnostics] = useState<DiagnosticRow[]>([]);
  const [hasDiagnostics, setHasDiagnostics] = useState(false);
  const [pendingShareConsent, setPendingShareConsent] = useState(false);
  const [testResults, setTestResults] = useState<{
    disc: { D: number; I: number; S: number; C: number } | null;
    idmc_score: number | null;
    soft_skills: Array<{ skill: string; score: number }>;
  } | null>(null);
  const [missions, setMissions] = useState<EmployeeMission[]>([]);
  const [hrDocuments, setHrDocuments] = useState<HrDocument[]>([]);
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
            idmc_score: number | null;
            soft_skills: Array<{ skill: string; score: number }>;
          };
          test_status?: { share_consent?: boolean };
          missions?: EmployeeMission[];
          hr_documents?: HrDocument[];
          recommended_action?: RecommendedActionRow | null;
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
          setProfileAnalysis(null);
          setProfileAnalysisError(null);
          setMissions(payload.missions ?? []);
          setHrDocuments(payload.hr_documents ?? []);
          setRecommendedAction(payload.recommended_action ?? null);
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
          updatedAt?: string;
          cached?: boolean;
          error?: string;
          code?: string;
        };

        if (!res.ok) {
          if (!cancelled) {
            setProfileAnalysis(null);
            setProfileAnalysisError(
              payload.code === "consent_required"
                ? "Le collaborateur n'a pas autorisé le partage de ses résultats."
                : payload.error ?? "Analyse indisponible.",
            );
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
  const stressScore = latest?.results?.stress ?? null;
  const vigilance = scoreToVigilance(stressScore);

  const dims: DimScore[] = useMemo(() => {
    const r = latest?.results ?? {};
    return [
      { key: "stress", label: "Stress", score: r.stress ?? 0 },
      { key: "organisation", label: "Organisation", score: r.organisation ?? 0 },
      { key: "communication", label: "Communication", score: r.communication ?? 0 },
      { key: "decision", label: "Décision", score: r.decision ?? 0 },
      { key: "leadership", label: "Leadership", score: r.leadership ?? 0 },
    ];
  }, [latest]);

  const radarData = useMemo(
    () => dims.map((d) => ({ skill: d.label, score: Math.round(d.score) })),
    [dims],
  );

  const aiInsight = useMemo(() => {
    if (!hasDiagnostics) return null;
    const org = dims.find((d) => d.key === "organisation")?.score ?? 0;
    const stress = dims.find((d) => d.key === "stress")?.score ?? 0;
    if (org >= 70 && stress >= 60) {
      return "Perform(e) mieux dans un cadre clair : objectifs simples, priorités visibles, rituels courts.";
    }
    if (stress < 50) {
      return "Gagne en efficacité quand la charge est stabilisée et que les attentes sont explicites.";
    }
    return "Progresse plus vite quand les consignes sont concrètes et les retours réguliers.";
  }, [dims, hasDiagnostics]);

  const actionBlock = useMemo(() => {
    if (!hasDiagnostics) return null;
    if (recommendedAction) return recommendedAction;
    const stress = dims.find((d) => d.key === "stress")?.score ?? 0;
    if (stress < 50) {
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
  }, [dims, recommendedAction, hasDiagnostics]);

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
      <div className="flex min-h-screen bg-white">
        <EnterpriseSidebar />
        <main className="flex-1 px-8 py-10 pl-[280px] text-sm text-gray-500">Chargement…</main>
      </div>
    );
  }

  if (!displayEmployee) {
    return (
      <div className="flex min-h-screen bg-white">
        <EnterpriseSidebar />
        <main className="flex-1 px-8 py-10 pl-[280px]">
          <p className="text-sm font-semibold text-gray-900">
            {error ?? "Collaborateur introuvable."}
          </p>
          {error ? (
            <p className="mt-2 text-xs text-gray-500">
              Identifiant demandé : <span className="font-mono">{employeeId}</span>
            </p>
          ) : null}
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

  return (
    <div className="flex min-h-screen bg-white font-sans text-gray-900 selection:bg-indigo-100 selection:text-indigo-900">
      <EnterpriseSidebar />
      <main className="relative z-10 flex-1 px-8 py-10 pl-[280px]">
        {error && (
          <div className="mb-8 rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
            {error}
          </div>
        )}

        <header className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Vue 3s</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-gray-950">
              {displayEmployee.first_name ?? "—"} {displayEmployee.last_name ?? ""}
            </h1>
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-gray-600">
              <span className="rounded-full border border-gray-200 bg-white px-3 py-1">
                {displayEmployee.job_title ?? "Poste non renseigné"}
              </span>
              <span className="rounded-full border border-gray-200 bg-white px-3 py-1">
                {displayEmployee.department ?? "Département"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={deleting}
              onClick={() => void deleteEmployee()}
              className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "Suppression…" : "Supprimer"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard/entreprise/salaries")}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              ← Retour
            </button>
          </div>
        </header>

        <EnterpriseEmployeeHrPanel
          employeeId={employeeId!}
          email={displayEmployee.email ?? null}
          phone={displayEmployee.phone ?? null}
          hireDate={displayEmployee.hire_date ?? null}
          documents={hrDocuments}
          onProfileChange={(patch) =>
            setEmployee((prev) => (prev ? { ...prev, ...patch } : prev))
          }
          onDocumentsChange={setHrDocuments}
        />

        {!hasDiagnostics && pendingShareConsent ? (
          <div className="mb-8 rounded-3xl border border-violet-200 bg-violet-50 px-6 py-5 text-sm text-violet-950">
            <p className="font-semibold">En attente du consentement RGPD</p>
            <p className="mt-1 text-violet-900/80">
              Le collaborateur a passé des tests mais n&apos;a pas encore autorisé le partage avec
              l&apos;entreprise. Les résultats restent privés tant qu&apos;il n&apos;a pas validé
              l&apos;overlay de partage après chaque test.
            </p>
          </div>
        ) : null}

        {!hasDiagnostics && !pendingShareConsent ? (
          <div className="mb-8 rounded-3xl border border-amber-200 bg-amber-50 px-6 py-5 text-sm text-amber-950">
            <p className="font-semibold">Aucun diagnostic enregistré</p>
            <p className="mt-1 text-amber-900/80">
              Les scores IDMC, le profil synthétique et les recommandations apparaîtront lorsque le
              collaborateur aura passé les tests (DISC, IDMC, soft skills) depuis son dashboard apprenant.
            </p>
          </div>
        ) : null}

        <EnterpriseEmployeeMissions
          employeeId={employeeId!}
          missions={missions}
          onChange={setMissions}
        />

        {hasDiagnostics && testResults ? (
          <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {testResults.disc ? (
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">DISC</p>
                <p className="mt-2 text-lg font-black text-gray-950">
                  D {Math.round(testResults.disc.D)}% · I {Math.round(testResults.disc.I)}% · S{" "}
                  {Math.round(testResults.disc.S)}% · C {Math.round(testResults.disc.C)}%
                </p>
              </div>
            ) : null}
            {testResults.idmc_score ? (
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">IDMC</p>
                <p className="mt-2 text-3xl font-black text-gray-950">{testResults.idmc_score}</p>
              </div>
            ) : null}
            {testResults.soft_skills.length > 0 ? (
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Soft skills</p>
                <ul className="mt-2 space-y-1 text-sm text-gray-700">
                  {testResults.soft_skills.slice(0, 3).map((s) => (
                    <li key={s.skill}>{s.skill}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

        {hasDiagnostics ? (
        <>
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-gray-500">Score global</div>
                <div className="mt-2 text-2xl font-black tracking-tight text-gray-950">IDMC</div>
                <p className="mt-2 text-sm text-gray-600">
                  Synthèse de fonctionnement, compréhension, décision et activation.
                </p>
              </div>
              <ProgressRing value={idmc} />
            </div>
            <div className="mt-6 flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-widest text-gray-500">Vigilance</div>
              <div
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-black",
                  vigilance.tone === "emerald" && "bg-emerald-50 text-emerald-700",
                  vigilance.tone === "amber" && "bg-amber-50 text-amber-800",
                  vigilance.tone === "red" && "bg-red-50 text-red-700",
                )}
              >
                {vigilance.emoji} {vigilance.label}
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-500">
              Un IDMC élevé peut coexister avec une vigilance critique si une dimension (ex: stress) chute.
            </p>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm lg:col-span-2">
            <h2 className="text-xl font-black tracking-tight text-gray-950">Profil synthétique</h2>
            <p className="mt-2 text-sm text-gray-600">
              Analyse croisée DISC · IDMC · Soft Skills — même moteur que le dashboard salarié.
            </p>

            {!shareConsent ? (
              <p className="mt-6 rounded-2xl border border-violet-200 bg-violet-50/60 px-4 py-3 text-sm text-violet-950">
                Le collaborateur n&apos;a pas encore autorisé le partage entreprise. Cette synthèse
                apparaîtra après validation du consentement RGPD.
              </p>
            ) : profileAnalysisLoading ? (
              <div className="mt-6 space-y-4">
                <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />
                <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />
                <p className="text-sm text-gray-500">Génération de l&apos;analyse croisée…</p>
              </div>
            ) : profileAnalysisError ? (
              <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                {profileAnalysisError}
              </p>
            ) : profileAnalysis ? (
              <>
                {profileAnalysis.summary ? (
                  <p className="mt-4 text-sm leading-relaxed text-gray-700">{profileAnalysis.summary}</p>
                ) : null}
                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50/40 p-6">
                    <div className="text-xs font-black uppercase tracking-widest text-emerald-700">
                      Forces majeures
                    </div>
                    <ul className="mt-4 space-y-3 text-sm text-emerald-900">
                      {(profileAnalysis.strengths.length > 0
                        ? profileAnalysis.strengths
                        : ["Analyse en cours de structuration."]
                      ).map((s) => (
                        <li key={s} className="flex items-start gap-3">
                          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-3xl border border-amber-200 bg-amber-50/40 p-6">
                    <div className="text-xs font-black uppercase tracking-widest text-amber-800">
                      Axes d&apos;amélioration
                    </div>
                    <ul className="mt-4 space-y-3 text-sm text-amber-900">
                      {(profileAnalysis.improvements.length > 0
                        ? profileAnalysis.improvements
                        : ["Aucun axe prioritaire identifié pour le moment."]
                      ).map((s) => (
                        <li key={s} className="flex items-start gap-3">
                          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                {profileAnalysis.updatedAt ? (
                  <p className="mt-4 text-xs text-gray-400">
                    {profileAnalysis.cached ? "Analyse réutilisée depuis le profil salarié" : "Analyse générée"} ·{" "}
                    {new Date(profileAnalysis.updatedAt).toLocaleDateString("fr-FR")}
                  </p>
                ) : null}
              </>
            ) : null}
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm lg:col-span-2">
            <h2 className="text-xl font-black tracking-tight text-gray-950">Dimensions clés</h2>
            <p className="mt-2 text-sm text-gray-600">Radar + repères lisibles pour décider vite.</p>
            <div className="mt-6">
              {loading ? <div className="h-[260px] rounded-3xl bg-gray-100" /> : <SoftSkillsRadar data={radarData} />}
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {dims.map((d) => (
                <MiniBar key={d.key} label={d.label} score={Math.round(d.score)} />
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-gray-950">Insights & recommandations</h2>
            <div className="mt-5 rounded-3xl border border-gray-200 bg-gray-50/60 p-6">
              <div className="text-xs font-black uppercase tracking-widest text-gray-500">Insight IA</div>
              <p className="mt-3 text-sm text-gray-700">{aiInsight}</p>
            </div>

            {actionBlock ? (
              <div className="mt-5 rounded-3xl border border-indigo-200 bg-indigo-50 p-6">
                <div className="text-xs font-black uppercase tracking-widest text-indigo-900">Action recommandée</div>
                <p className="mt-3 text-sm font-bold text-indigo-950">{actionBlock.title}</p>
                <p className="mt-2 text-sm text-indigo-900/80">
                  {actionBlock.description ?? "Action concrète proposée par Beyond."}
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/entreprise/actions/demo-stress")}
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gray-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-gray-900"
                >
                  Accéder aux Experts Qualifiés <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
                  <div className="text-xs font-black uppercase tracking-widest text-emerald-800">Impact Business estimé</div>
                  <p className="mt-2 text-sm font-semibold text-emerald-950">
                    Réduction du risque d&apos;absentéisme et gain de productivité estimé : +15% sur le trimestre.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <h3 className="text-lg font-black tracking-tight text-gray-950">Autonome</h3>
            <p className="mt-2 text-sm text-gray-600">Micro-parcours et exercices ciblés (5 min).</p>
            <div className="mt-5 space-y-3">
              {["Respiration & pause", "Priorisation (1 chose)", "Feedback simple"].map((t) => (
                <div
                  key={t}
                  className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800"
                >
                  {t}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <h3 className="text-lg font-black tracking-tight text-gray-950">Accompagné</h3>
            <p className="mt-2 text-sm text-gray-600">Accès aux experts recommandés après prescription.</p>
            {actionBlock ? (
              <button
                type="button"
                onClick={() =>
                  router.push(`/dashboard/entreprise?recommendedActionId=${encodeURIComponent(actionBlock.id)}`)
                }
                className="mt-5 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-950 transition hover:bg-gray-50"
              >
                Accéder aux experts recommandés
              </button>
            ) : null}
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50/60 p-4 text-sm text-gray-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-gray-500" aria-hidden />
              <span>Pas de marketplace : l'accès experts reste réservé au tunnel de recommandation Beyond.</span>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <h3 className="text-lg font-black tracking-tight text-gray-950">Historique</h3>
            <p className="mt-2 text-sm text-gray-600">Diagnostics passés & actions engagées.</p>
            <div className="mt-5 space-y-4">
              {loading ? (
                <div className="text-sm text-gray-500">Chargement…</div>
              ) : diagnostics.length === 0 ? (
                <div className="text-sm text-gray-500">Aucun diagnostic enregistré.</div>
              ) : (
                diagnostics.slice(0, 6).map((d) => (
                  <div key={d.id} className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-bold text-gray-900">
                        {new Date(d.created_at).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        IDMC {d.idmc_score ?? "—"} · Stress {d.results?.stress ?? "—"}
                      </div>
                    </div>
                    <div className="h-2.5 w-2.5 rounded-full bg-gray-300" aria-hidden />
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
        </>
        ) : null}
      </main>
    </div>
  );
}

