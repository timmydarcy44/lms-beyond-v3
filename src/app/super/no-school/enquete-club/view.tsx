"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SurveyRow = {
  id: string;
  created_at: string;
  club: string;
  first_name: string;
  last_name: string;
  role: string | null;
  email: string | null;
  preferred_validation: string;
  beyond_connect_optin: boolean;
};

type SurveyDetail = SurveyRow & {
  hard_skills:
    | Record<string, string>
    | {
        priorities?: Record<string, string>;
        skill_proof_mapping?: Array<{
          skillId: string;
          skillLabel: string;
          priority: string;
          proofId: string;
          proofLabel: string;
          rationale?: string;
        }>;
        validation_signals?: {
          topSignals?: string[];
          note?: string | null;
        };
        qualitative?: {
          hardestToAssess?: string | null;
          marketGap?: string | null;
        };
      };
  soft_skills: string[];
  market_gap: string | null;
  phone: string | null;
  preferred_contact_channel: string | null;
};

type SurveyFullRow = SurveyDetail & {
  beyond_connect_optin: boolean;
  email: string | null;
};

const validationLabels: Record<string, string> = {
  audit_pdf: "Audit PDF",
  video: "Vidéo",
  case_timed: "Étude de cas",
  crm_analysis: "Analyse CRM",
  qcm: "QCM ciblé",
};

const hardSkillLabels: Record<string, string> = {
  negocier_grands_comptes: "Négocier un deal grands comptes",
  sales_deck: "Construire un Sales Deck convaincant",
  solution_complexe: "Vendre une solution complexe (hospitalités/naming/digital)",
  prospecter_comptes: "Prospecter et ouvrir des comptes stratégiques",
  crm_pipeline: "Piloter un CRM et sécuriser le pipeline",
};

export default function ClubSurveyAdminView() {
  const [rows, setRows] = useState<SurveyRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [q, setQ] = useState("");
  const [optin, setOptin] = useState("");
  const [validation, setValidation] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selected, setSelected] = useState<SurveyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "synthese" | "reponses" | "detail" | "libres"
  >("synthese");
  const [analysisRows, setAnalysisRows] = useState<SurveyFullRow[]>([]);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisSort, setAnalysisSort] = useState<"count" | "alpha">("count");
  const [freeSort, setFreeSort] = useState<"date" | "club">("date");

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  const stats = useMemo(() => {
    const base = analysisRows.length ? analysisRows : rows;
    const optinCount = base.filter((row) => row.beyond_connect_optin).length;
    const optinPct = base.length ? Math.round((optinCount / base.length) * 100) : 0;
    const validationCounts = base.reduce<Record<string, number>>((acc, row) => {
      acc[row.preferred_validation] = (acc[row.preferred_validation] ?? 0) + 1;
      return acc;
    }, {});
    const topValidation = Object.entries(validationCounts).sort((a, b) => b[1] - a[1])[0];
    const softSkillCounts = analysisRows.reduce<Record<string, number>>((acc, row) => {
      row.soft_skills?.forEach((skill) => {
        acc[skill] = (acc[skill] ?? 0) + 1;
      });
      return acc;
    }, {});
    const topSoftSkill = Object.entries(softSkillCounts).sort((a, b) => b[1] - a[1])[0];
    return {
      total: base.length,
      optinPct,
      topValidation: topValidation ? validationLabels[topValidation[0]] : "—",
      topSoftSkill: topSoftSkill?.[0] ?? "—",
    };
  }, [analysisRows, rows]);

  const fetchRows = async () => {
    setIsLoading(true);
    setFetchError(null);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (optin) params.set("optin", optin);
    if (validation) params.set("validation", validation);
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));

    try {
      const response = await fetch(`/api/bns/admin/survey/club?${params.toString()}`);
      const result = await response.json();
      if (process.env.NODE_ENV !== "production") {
        console.log("[club-survey] status", response.status, "count", result.total ?? 0);
      }
      if (response.ok && result.ok) {
        setRows(result.data ?? []);
        setTotal(result.total ?? 0);
      } else {
        setRows([]);
        setTotal(0);
        setFetchError(
          response.status === 403
            ? "Accès super admin requis"
            : result?.errorId
              ? `Erreur API: ${result.errorId}`
              : "Erreur lors du chargement",
        );
      }
    } catch (err) {
      setRows([]);
      setTotal(0);
      setFetchError("Erreur réseau");
    }
    setIsLoading(false);
  };

  const fetchAnalysisRows = async () => {
    setAnalysisLoading(true);
    setAnalysisError(null);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (optin) params.set("optin", optin);
    if (validation) params.set("validation", validation);
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    params.set("page", "1");
    params.set("pageSize", "5000");
    params.set("include", "full");

    try {
      const response = await fetch(`/api/bns/admin/survey/club?${params.toString()}`);
      const result = await response.json();
      if (response.ok && result.ok) {
        const nextRows = result.data ?? [];
        setAnalysisRows(nextRows);
        setAnalysisLoading(false);
        return nextRows as SurveyFullRow[];
      } else {
        setAnalysisRows([]);
        setAnalysisError(
          response.status === 403
            ? "Accès super admin requis"
            : result?.errorId
              ? `Erreur API: ${result.errorId}`
              : "Erreur lors du chargement",
        );
      }
    } catch (err) {
      setAnalysisRows([]);
      setAnalysisError("Erreur réseau");
    }
    setAnalysisLoading(false);
    return [] as SurveyFullRow[];
  };

  useEffect(() => {
    fetchRows();
  }, [q, optin, validation, fromDate, toDate, page, pageSize]);

  useEffect(() => {
    if (activeTab === "synthese" || activeTab === "libres") {
      fetchAnalysisRows();
    }
  }, [activeTab, q, optin, validation, fromDate, toDate]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    const response = await fetch(`/api/bns/admin/survey/club/${id}`);
    const result = await response.json();
    if (result.ok) {
      setSelected(result.data);
      setActiveTab("detail");
    }
    setDetailLoading(false);
  };

  const normalizeValidation = (value: string) =>
    validationLabels[value] ? validationLabels[value] : value;

  const handleExportCsv = async () => {
    const exportRows =
      analysisRows.length > 0 ? analysisRows : await fetchAnalysisRows();

    const headers = [
      "respondent_id",
      "date",
      "club",
      "fonction",
      "optin",
      "validation_preferee",
      "prenom",
      "nom",
      "email",
      "telephone",
      "hard_skill_negocier_grands_comptes",
      "hard_skill_sales_deck",
      "hard_skill_solution_complexe",
      "hard_skill_prospecter_comptes",
      "hard_skill_crm_pipeline",
      "proof_negocier_grands_comptes",
      "proof_sales_deck",
      "proof_solution_complexe",
      "proof_prospecter_comptes",
      "proof_crm_pipeline",
      "validation_signals",
      "validation_note",
      "hardest_to_assess",
      "competence_difficile",
      "preferred_contact_channel",
      "soft_skills",
    ];

    const rowsCsv = exportRows.map((row) => {
      const priorities = getHardSkillPriorities(row);
      const mapping = getSkillProofMapping(row);
      const mappingBySkill = mapping.reduce<Record<string, string>>((acc, item) => {
        acc[item.skillId] = item.proofLabel || item.proofId;
        return acc;
      }, {});
      const validationSignals = getValidationSignals(row);
      const qualitative = getQualitative(row);
      return [
        row.id,
        row.created_at,
        row.club,
        row.role ?? "",
        row.beyond_connect_optin ? "oui" : "non",
        normalizeValidation(row.preferred_validation),
        row.first_name,
        row.last_name,
        row.email ?? "",
        row.phone ?? "",
        priorities.negocier_grands_comptes ?? "",
        priorities.sales_deck ?? "",
        priorities.solution_complexe ?? "",
        priorities.prospecter_comptes ?? "",
        priorities.crm_pipeline ?? "",
        mappingBySkill.negocier_grands_comptes ?? "",
        mappingBySkill.sales_deck ?? "",
        mappingBySkill.solution_complexe ?? "",
        mappingBySkill.prospecter_comptes ?? "",
        mappingBySkill.crm_pipeline ?? "",
        validationSignals.topSignals.join(" | "),
        validationSignals.note ?? "",
        qualitative.hardestToAssess ?? "",
        qualitative.marketGap ?? "",
        row.preferred_contact_channel ?? "",
        row.soft_skills?.join(", ") ?? "",
      ];
    });

    const csv = [headers, ...rowsCsv].map((line) => line.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bns_enquete_club.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const buildCounts = (items: string[]) =>
    items.reduce<Record<string, number>>((acc, value) => {
      acc[value] = (acc[value] ?? 0) + 1;
      return acc;
    }, {});

  const getHardSkillPriorities = (row: SurveyDetail | SurveyFullRow): Record<string, string> => {
    if (row.hard_skills && typeof row.hard_skills === "object") {
      const priorities = (row.hard_skills as { priorities?: unknown }).priorities;
      if (priorities && typeof priorities === "object") {
        return priorities as Record<string, string>;
      }
      return row.hard_skills as Record<string, string>;
    }
    return {};
  };

  const getSkillProofMapping = (row: SurveyDetail | SurveyFullRow) => {
    if (!row.hard_skills || typeof row.hard_skills !== "object") return [];
    const mapping = (row.hard_skills as { skill_proof_mapping?: unknown }).skill_proof_mapping;
    return Array.isArray(mapping) ? mapping : [];
  };

  const getValidationSignals = (row: SurveyDetail | SurveyFullRow) => {
    if (!row.hard_skills || typeof row.hard_skills !== "object") {
      return { topSignals: [], note: "" };
    }
    const signals = (row.hard_skills as { validation_signals?: unknown }).validation_signals;
    if (signals && typeof signals === "object") {
      return {
        topSignals: Array.isArray((signals as { topSignals?: unknown }).topSignals)
          ? ((signals as { topSignals?: string[] }).topSignals ?? [])
          : [],
        note: (signals as { note?: string | null }).note ?? "",
      };
    }
    return { topSignals: [], note: "" };
  };

  const getQualitative = (row: SurveyDetail | SurveyFullRow) => {
    if (!row.hard_skills || typeof row.hard_skills !== "object") {
      return { hardestToAssess: "", marketGap: "" };
    }
    const qualitative = (row.hard_skills as { qualitative?: unknown }).qualitative;
    if (qualitative && typeof qualitative === "object") {
      return {
        hardestToAssess: (qualitative as { hardestToAssess?: string | null }).hardestToAssess ?? "",
        marketGap: (qualitative as { marketGap?: string | null }).marketGap ?? "",
      };
    }
    return { hardestToAssess: "", marketGap: "" };
  };

  const freeResponses = useMemo(() => {
    const items = analysisRows.flatMap((row) => {
      const validationSignals = getValidationSignals(row);
      const qualitative = getQualitative(row);
      const entries: Array<{
        question: string;
        answer: string;
        club: string;
        role: string | null;
        createdAt: string;
        respondentId: string;
      }> = [];

      if (validationSignals.note) {
        entries.push({
          question: "Un détail qui compte vraiment pour vous (optionnel)",
          answer: validationSignals.note,
          club: row.club,
          role: row.role,
          createdAt: row.created_at,
          respondentId: row.id,
        });
      }
      if (qualitative.hardestToAssess) {
        entries.push({
          question:
            "Sur quelles compétences avez-vous le plus de mal à évaluer un candidat ?",
          answer: qualitative.hardestToAssess,
          club: row.club,
          role: row.role,
          createdAt: row.created_at,
          respondentId: row.id,
        });
      }
      if (qualitative.marketGap) {
        entries.push({
          question:
            "Qu’est-ce qui manque aujourd’hui sur le marché (dans votre contexte club) ?",
          answer: qualitative.marketGap,
          club: row.club,
          role: row.role,
          createdAt: row.created_at,
          respondentId: row.id,
        });
      }
      return entries;
    });

    return items.sort((a, b) => {
      if (freeSort === "club") {
        return a.club.localeCompare(b.club);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [analysisRows, freeSort]);

  const analysisBase = analysisRows;
  const totalAnalysis = analysisBase.length;

  const hardSkillAnalysis = Object.keys(hardSkillLabels).map((key) => {
    const values = analysisBase
      .map((row) => getHardSkillPriorities(row)[key])
      .filter(Boolean) as string[];
    const counts = buildCounts(values);
    const total = values.length;
    return {
      question: hardSkillLabels[key] ?? key,
      counts,
      total,
    };
  });

  const softSkillCounts = buildCounts(
    analysisBase.flatMap((row) => row.soft_skills ?? []).filter(Boolean),
  );

  const validationCounts = buildCounts(
    analysisBase.map((row) => normalizeValidation(row.preferred_validation)),
  );

  const optinCounts = buildCounts(
    analysisBase.map((row) => (row.beyond_connect_optin ? "Opt-in oui" : "Opt-in non")),
  );

  const renderBar = (value: number, total: number) => {
    const pct = total ? Math.round((value / total) * 100) : 0;
    return (
      <div className="flex items-center gap-2">
        <div className="h-2 w-full rounded-full bg-gray-100">
          <div className="h-2 rounded-full bg-gray-900" style={{ width: `${pct}%` }} />
        </div>
        <span className="w-10 text-right text-sm text-gray-800">{pct}%</span>
      </div>
    );
  };

  const sortCounts = (counts: Record<string, number>) =>
    Object.entries(counts).sort((a, b) => {
      if (analysisSort === "alpha") {
        return a[0].localeCompare(b[0]);
      }
      return b[1] - a[1];
    });

  const analysisTables = [
    {
      title: "Opt-in Beyond Connect",
      question: "Opt-in Beyond Connect",
      counts: optinCounts,
      total: totalAnalysis,
    },
    {
      title: "Validation préférée",
      question: "Validation préférée",
      counts: validationCounts,
      total: totalAnalysis,
    },
    {
      title: "Actions terrain prioritaires",
      question: "Actions terrain prioritaires",
      counts: softSkillCounts,
      total: totalAnalysis,
    },
    ...hardSkillAnalysis.map((item) => ({
      title: item.question,
      question: item.question,
      counts: item.counts,
      total: item.total,
    })),
  ];

  return (
    <div className="space-y-6 bg-white text-[14px] text-[#111]">
      <div className="flex flex-wrap gap-2">
        {[
          { id: "synthese", label: "Synthèse" },
          { id: "reponses", label: "Réponses" },
          { id: "detail", label: "Détail" },
          { id: "libres", label: "Réponses libres" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() =>
              setActiveTab(tab.id as "synthese" | "reponses" | "detail" | "libres")
            }
            className={`rounded-full border px-4 py-2 text-sm ${
              activeTab === tab.id
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 bg-white text-gray-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "synthese" && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-sm uppercase tracking-[0.3em] text-gray-800">Total réponses</p>
              <p className="mt-3 text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-sm uppercase tracking-[0.3em] text-gray-800">Opt-in Beyond Connect</p>
              <p className="mt-3 text-2xl font-semibold text-gray-900">{stats.optinPct}%</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-sm uppercase tracking-[0.3em] text-gray-800">Validation préférée</p>
              <p className="mt-3 text-lg font-semibold text-gray-900">{stats.topValidation}</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm uppercase tracking-[0.3em] text-gray-800">Tendance principale</p>
            <p className="mt-2 text-sm text-gray-900">{stats.topSoftSkill}</p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Analyse des réponses</h3>
              <Button variant="outline" onClick={handleExportCsv}>
                Exporter CSV
              </Button>
            </div>

            {analysisLoading ? (
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-gray-800">
                Chargement…
              </div>
            ) : analysisError ? (
              <div className="rounded-xl border border-red-200 bg-white p-4 text-red-700">
                {analysisError}
              </div>
            ) : totalAnalysis === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-gray-800">
                0 réponse pour l’instant.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Opt-in Beyond Connect
                  </h4>
                  <div className="mt-3 grid gap-3">
                    {sortCounts(optinCounts).map(([label, count]) => (
                      <div key={label} className="grid grid-cols-[1.2fr_0.6fr_0.6fr] gap-4">
                        <span>{label}</span>
                        <span>{count}</span>
                        {renderBar(count, totalAnalysis)}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Type de validation préférée
                  </h4>
                  <div className="mt-3 grid gap-3">
                    {sortCounts(validationCounts).map(([label, count]) => (
                      <div key={label} className="grid grid-cols-[1.2fr_0.6fr_0.6fr] gap-4">
                        <span>{label}</span>
                        <span>{count}</span>
                        {renderBar(count, totalAnalysis)}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Actions terrain prioritaires
                  </h4>
                  <div className="mt-3 grid gap-3">
                    {sortCounts(softSkillCounts).map(([label, count]) => (
                      <div key={label} className="grid grid-cols-[1.2fr_0.6fr_0.6fr] gap-4">
                        <span>{label}</span>
                        <span>{count}</span>
                        {renderBar(count, totalAnalysis)}
                      </div>
                    ))}
                  </div>
                </div>

                {hardSkillAnalysis.map((item) => (
                  <div key={item.question} className="rounded-xl border border-gray-200 bg-white p-4">
                    <h4 className="text-sm font-semibold text-gray-900">{item.question}</h4>
                    <div className="mt-3 space-y-2">
                      {sortCounts(item.counts).map(([label, count]) => (
                        <div key={label} className="grid grid-cols-[1.2fr_0.6fr_0.6fr] gap-4">
                          <span>{label}</span>
                          <span>{count}</span>
                          {renderBar(count, item.total)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <h4 className="text-sm font-semibold text-gray-900">Tableaux détaillés</h4>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-sm text-gray-900">Trier par</span>
                    <button
                      type="button"
                      onClick={() => setAnalysisSort("count")}
                      className={`rounded-full border px-3 py-1 text-sm ${
                        analysisSort === "count"
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-200 text-gray-900"
                      }`}
                    >
                      Nombre
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnalysisSort("alpha")}
                      className={`rounded-full border px-3 py-1 text-sm ${
                        analysisSort === "alpha"
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-200 text-gray-900"
                      }`}
                    >
                      A → Z
                    </button>
                  </div>
                  <div className="mt-4 space-y-6 text-sm">
                    {analysisTables.map((item) => (
                      <div key={item.question}>
                        <p className="font-medium text-gray-900">{item.question}</p>
                        <table className="mt-2 w-full text-left text-sm">
                          <thead className="text-sm uppercase tracking-[0.2em] text-gray-800">
                            <tr>
                              <th className="py-2">Question</th>
                              <th className="py-2">Réponse</th>
                              <th className="py-2">Nombre</th>
                              <th className="py-2">Pourcentage</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortCounts(item.counts).map(([label, count]) => (
                              <tr key={label} className="border-b border-gray-100">
                                <td className="py-2">{item.question}</td>
                                <td className="py-2">{label}</td>
                                <td className="py-2">{count}</td>
                                <td className="py-2">
                                  {item.total
                                    ? Math.round((count / item.total) * 100)
                                    : 0}
                                  %
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-gray-900">
                      Synthèse des réponses libres
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900">Trier par</span>
                      <button
                        type="button"
                        onClick={() => setFreeSort("date")}
                        className={`rounded-full border px-3 py-1 text-sm ${
                          freeSort === "date"
                            ? "border-gray-900 bg-gray-900 text-white"
                            : "border-gray-200 text-gray-900"
                        }`}
                      >
                        Date
                      </button>
                      <button
                        type="button"
                        onClick={() => setFreeSort("club")}
                        className={`rounded-full border px-3 py-1 text-sm ${
                          freeSort === "club"
                            ? "border-gray-900 bg-gray-900 text-white"
                            : "border-gray-200 text-gray-900"
                        }`}
                      >
                        Club
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 max-h-[420px] space-y-4 overflow-auto">
                    {analysisLoading ? (
                      <p className="text-sm text-gray-900">Chargement…</p>
                    ) : analysisError ? (
                      <p className="text-sm text-red-700">{analysisError}</p>
                    ) : freeResponses.length === 0 ? (
                      <p className="text-sm text-gray-900">0 réponse libre pour l’instant.</p>
                    ) : (
                      freeResponses.map((item, index) => (
                        <div
                          key={`${item.respondentId}-${index}`}
                          className="rounded-lg border border-gray-200 p-3"
                        >
                          <p className="text-sm font-semibold text-gray-900">{item.question}</p>
                          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-900">
                            {item.answer}
                          </p>
                          <div className="mt-3 text-xs text-gray-900">
                            {item.club} · {item.role ?? "—"} ·{" "}
                            {new Date(item.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "reponses" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="grid gap-3 md:grid-cols-4">
              <Input
                placeholder="Recherche club/nom/email"
                value={q}
                onChange={(event) => setQ(event.target.value)}
              />
              <select
                className="h-10 rounded-md border border-gray-200 px-3 text-sm"
                value={optin}
                onChange={(event) => setOptin(event.target.value)}
              >
                <option value="">Opt-in (tous)</option>
                <option value="true">Opt-in oui</option>
                <option value="false">Opt-in non</option>
              </select>
              <select
                className="h-10 rounded-md border border-gray-200 px-3 text-sm"
                value={validation}
                onChange={(event) => setValidation(event.target.value)}
              >
                <option value="">Validation (toutes)</option>
                <option value="audit_pdf">Audit PDF</option>
                <option value="video">Vidéo</option>
                <option value="case_timed">Étude de cas</option>
                <option value="crm_analysis">Analyse CRM</option>
                <option value="qcm">QCM ciblé</option>
              </select>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                />
                <Input
                  type="date"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={handleExportCsv}>
                Exporter CSV
              </Button>
              <div className="ml-auto flex items-center gap-2">
                <select
                  className="h-9 rounded-md border border-gray-200 px-2 text-sm"
                  value={pageSize}
                  onChange={(event) => setPageSize(Number(event.target.value))}
                >
                  {[10, 20, 50].map((value) => (
                    <option key={value} value={value}>
                      {value}/page
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                >
                  Précédent
                </Button>
                <span className="text-sm text-gray-900">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
                >
                  Suivant
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="grid grid-cols-[1.1fr_1.2fr_1fr_1fr_1fr_0.8fr] gap-4 border-b border-gray-200 px-4 py-3 text-sm uppercase tracking-[0.3em] text-gray-800">
              <span>Date</span>
              <span>Nom du club</span>
              <span>Fonction</span>
              <span>Opt-in</span>
              <span>Validation</span>
              <span></span>
            </div>
            {isLoading ? (
              <div className="px-4 py-6 text-sm text-gray-900">Chargement…</div>
            ) : fetchError ? (
              <div className="px-4 py-6 text-sm text-red-700">{fetchError}</div>
            ) : rows.length === 0 ? (
              <div className="px-4 py-6 text-sm text-gray-900">0 réponse pour l’instant.</div>
            ) : (
              rows.map((row, index) => (
                <div
                  key={row.id}
                  className={`grid w-full grid-cols-[1.1fr_1.2fr_1fr_1fr_1fr_0.8fr] gap-4 border-b border-gray-100 px-4 py-3 text-left text-sm ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <span>{new Date(row.created_at).toLocaleDateString()}</span>
                  <span className="font-medium text-gray-900">{row.club}</span>
                  <span>{row.role ?? "—"}</span>
                  <span>{row.beyond_connect_optin ? "Oui" : "Non"}</span>
                  <span>{normalizeValidation(row.preferred_validation)}</span>
                  <Button variant="outline" onClick={() => openDetail(row.id)}>
                    Voir la réponse
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "detail" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          {detailLoading ? (
            <p className="text-sm text-gray-900">Chargement…</p>
          ) : !selected ? (
            <p className="text-sm text-gray-900">
              Sélectionne une réponse dans l’onglet “Réponses”.
            </p>
          ) : (
            <div className="space-y-6 text-sm">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selected.club}</h3>
                <p className="text-gray-900">{selected.role ?? "—"}</p>
                <p className="text-gray-900">
                  {new Date(selected.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-gray-800">Club</p>
                  <p className="mt-1 text-gray-900">{selected.club}</p>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-gray-800">Prénom</p>
                  <p className="mt-1 text-gray-900">{selected.first_name}</p>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-gray-800">Nom</p>
                  <p className="mt-1 text-gray-900">{selected.last_name}</p>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-gray-800">Fonction</p>
                  <p className="mt-1 text-gray-900">{selected.role ?? "—"}</p>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-gray-800">Email</p>
                  <p className="mt-1 text-gray-900">{selected.email ?? "—"}</p>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-gray-800">Téléphone</p>
                  <p className="mt-1 text-gray-900">{selected.phone ?? "—"}</p>
                </div>
              </div>

              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-gray-800">
                  Quelle importance pour vos équipes (commercial/marketing) ?
                </p>
                <div className="mt-3 space-y-2">
                  {Object.keys(hardSkillLabels).map((key) => (
                    <div key={key} className="flex items-center justify-between">
                      <span>{hardSkillLabels[key]}</span>
                      <span className="font-medium text-gray-900">
                        {getHardSkillPriorities(selected)[key] ?? "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-gray-800">
                  Actions terrain prioritaires (max 3)
                </p>
                <p className="mt-2 text-gray-900">
                  {selected.soft_skills?.length ? selected.soft_skills.join(", ") : "—"}
                </p>
              </div>

              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-gray-800">
                  Validation préférée
                </p>
                <p className="mt-2 text-gray-900">
                  {normalizeValidation(selected.preferred_validation)}
                </p>
              </div>

              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-gray-800">
                  Compétence → preuve associée
                </p>
                <div className="mt-3 space-y-3">
                  {getSkillProofMapping(selected).length === 0 ? (
                    <p className="text-gray-900">—</p>
                  ) : (
                    getSkillProofMapping(selected).map((item) => (
                      <div key={item.skillId} className="rounded-md border border-gray-200 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium text-gray-900">{item.skillLabel}</p>
                          <span className="rounded-full border border-gray-200 px-2 py-0.5 text-xs uppercase tracking-[0.2em] text-gray-900">
                            {item.priority}
                          </span>
                        </div>
                        <p className="mt-1 text-gray-900">{item.proofLabel || item.proofId}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-gray-800">
                  Signaux d’une preuve solide
                </p>
                <p className="mt-2 text-gray-900">
                  {getValidationSignals(selected).topSignals.length
                    ? getValidationSignals(selected).topSignals.join(" · ")
                    : "—"}
                </p>
                {getValidationSignals(selected).note ? (
                  <p className="mt-2 text-gray-900">{getValidationSignals(selected).note}</p>
                ) : null}
              </div>

              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-gray-800">
                  Difficulté à évaluer / marché
                </p>
                <p className="mt-2 text-gray-900">
                  {getQualitative(selected).hardestToAssess || "—"}
                </p>
                <p className="mt-2 text-gray-900">
                  {getQualitative(selected).marketGap || "—"}
                </p>
              </div>

              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-gray-800">
                  Compétence la plus difficile à recruter
                </p>
                <p className="mt-2 text-gray-900">{selected.market_gap ?? "—"}</p>
              </div>

              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-gray-800">
                  Opt-in Beyond Connect
                </p>
                <p className="mt-2 text-gray-900">
                  {selected.beyond_connect_optin ? "Oui" : "Non"}
                </p>
              </div>

              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-gray-800">
                  Canal préféré
                </p>
                <p className="mt-2 text-gray-900">{selected.preferred_contact_channel ?? "—"}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "libres" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-gray-900">Réponses libres</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-900">Trier par</span>
              <button
                type="button"
                onClick={() => setFreeSort("date")}
                className={`rounded-full border px-3 py-1 text-sm ${
                  freeSort === "date"
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 text-gray-900"
                }`}
              >
                Date
              </button>
              <button
                type="button"
                onClick={() => setFreeSort("club")}
                className={`rounded-full border px-3 py-1 text-sm ${
                  freeSort === "club"
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 text-gray-900"
                }`}
              >
                Club
              </button>
            </div>
          </div>
          <div className="mt-4 max-h-[640px] space-y-4 overflow-auto">
            {analysisLoading ? (
              <p className="text-sm text-gray-900">Chargement…</p>
            ) : analysisError ? (
              <p className="text-sm text-red-700">{analysisError}</p>
            ) : freeResponses.length === 0 ? (
              <p className="text-sm text-gray-900">0 réponse libre pour l’instant.</p>
            ) : (
              freeResponses.map((item, index) => (
                <div key={`${item.respondentId}-${index}`} className="rounded-lg border border-gray-200 p-4">
                  <p className="text-sm font-semibold text-gray-900">{item.question}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-900">{item.answer}</p>
                  <div className="mt-3 text-xs text-gray-900">
                    {item.club} · {item.role ?? "—"} ·{" "}
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

