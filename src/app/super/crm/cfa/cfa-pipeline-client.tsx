"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, GraduationCap, Loader2, Mail, RefreshCw } from "lucide-react";

import {
  CFA_CHALLENGE_QUESTIONS,
  CFA_APPLICATION_STATUSES,
  CFA_STATUS_LABELS,
  getCfaSpecializationLabel,
  type CfaApplication,
  type CfaApplicationStatus,
} from "@/lib/cfa-applications";
import { cn } from "@/lib/utils";

const columns: {
  id: "application" | "interview" | "review" | "admitted" | "rejected";
  label: string;
  statuses: CfaApplicationStatus[];
  accent: string;
}[] = [
  {
    id: "application",
    label: "Application",
    statuses: ["profile", "challenge", "dossier"],
    accent: "bg-slate-400",
  },
  { id: "interview", label: "Interview", statuses: ["interview"], accent: "bg-sky-500" },
  { id: "review", label: "Review", statuses: ["review"], accent: "bg-amber-500" },
  { id: "admitted", label: "Admitted", statuses: ["admitted"], accent: "bg-emerald-500" },
  { id: "rejected", label: "Non retenu", statuses: ["rejected"], accent: "bg-rose-400" },
];

export function CfaPipelineClient() {
  const [applications, setApplications] = useState<CfaApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [migrationRequired, setMigrationRequired] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/super-admin/crm/cfa", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Chargement impossible");
      setApplications(result.applications ?? []);
      setMigrationRequired(Boolean(result.migrationRequired));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const counts = useMemo(
    () => ({
      total: applications.length,
      new: applications.filter((item) => ["profile", "challenge", "dossier"].includes(item.status))
        .length,
      review: applications.filter((item) => item.status === "review").length,
      admitted: applications.filter((item) => item.status === "admitted").length,
    }),
    [applications],
  );

  async function changeStatus(application: CfaApplication, status: CfaApplicationStatus) {
    setUpdating(application.id);
    setError("");
    try {
      const response = await fetch("/api/super-admin/crm/cfa", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: application.id, status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Mise à jour impossible");
      setApplications((current) =>
        current.map((item) => (item.id === application.id ? result.application : item)),
      );
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Mise à jour impossible");
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="space-y-6 px-3 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">
            CRM · CFA
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-950">
            Admissions Byound School
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Du premier profil à l’admission, sans conditionner l’accès à une entreprise.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Actualiser
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["Candidatures CFA", counts.total],
          ["À compléter", counts.new],
          ["En review", counts.review],
          ["Admis", counts.admitted],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-gray-950">{value}</p>
          </div>
        ))}
      </div>

      {migrationRequired ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Applique la migration CFA pour activer le pipeline des candidatures.
        </div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex min-h-72 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="grid min-w-0 gap-4 xl:grid-cols-5">
          {columns.map((column) => {
            const items = applications.filter((application) =>
              column.statuses.includes(application.status),
            );
            return (
              <section
                key={column.id}
                className="min-w-0 rounded-2xl border border-gray-200 bg-gray-50/80 p-3"
              >
                <header className="flex items-center justify-between px-1 py-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", column.accent)} />
                    <h2 className="text-sm font-semibold text-gray-800">{column.label}</h2>
                  </div>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-gray-500">
                    {items.length}
                  </span>
                </header>
                <div className="mt-2 space-y-3">
                  {items.map((application) => (
                    <article
                      key={application.id}
                      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-gray-950">
                            {application.first_name} {application.last_name}
                          </h3>
                          <p className="mt-1 truncate text-xs text-gray-500">
                            {getCfaSpecializationLabel(application.specialization)}
                          </p>
                        </div>
                        <GraduationCap className="h-4 w-4 shrink-0 text-indigo-500" />
                      </div>
                      <div className="mt-4 space-y-2 text-xs text-gray-500">
                        <a
                          href={`mailto:${application.email}`}
                          className="flex items-center gap-2 truncate hover:text-indigo-600"
                        >
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          {application.email}
                        </a>
                        <p className="flex items-center gap-2">
                          <Clock3 className="h-3.5 w-3.5 shrink-0" />
                          {new Date(application.created_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <details className="mt-4 border-t border-gray-100 pt-3">
                        <summary className="cursor-pointer text-xs font-semibold text-indigo-600">
                          Voir le dossier
                        </summary>
                        <div className="mt-3 space-y-3 text-xs leading-relaxed text-gray-600">
                          <p>
                            <strong>Âge :</strong> {application.age ?? "—"}
                            <br />
                            <strong>Niveau :</strong> {application.education_level ?? "—"}
                            <br />
                            <strong>Alternance :</strong>{" "}
                            {application.alternance_status === "company_found"
                              ? "Entreprise trouvée"
                              : application.alternance_status === "searching"
                                ? "En recherche"
                                : "Non demandé à ce stade"}
                          </p>
                          {application.school_background ? (
                            <p>
                              <strong>Parcours :</strong> {application.school_background}
                            </p>
                          ) : null}
                          {application.experiences ? (
                            <p>
                              <strong>Expériences :</strong> {application.experiences}
                            </p>
                          ) : null}
                          {application.motivation_text ? (
                            <p>
                              <strong>Pourquoi Byound :</strong> {application.motivation_text}
                            </p>
                          ) : null}
                          {application.motivation_media_signed_url ? (
                            <a
                              href={application.motivation_media_signed_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex font-semibold text-indigo-600 hover:underline"
                            >
                              Écouter / voir la motivation
                            </a>
                          ) : null}
                          {CFA_CHALLENGE_QUESTIONS.map((question) => {
                            const answer = application.challenge_answers?.[question.id];
                            return answer ? (
                              <div key={question.id} className="rounded-lg bg-gray-50 p-2.5">
                                <p className="font-semibold text-gray-800">{question.eyebrow}</p>
                                <p className="mt-1">{answer}</p>
                              </div>
                            ) : null;
                          })}
                          {application.cv_url ? (
                            <a
                              href={application.cv_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex font-semibold text-indigo-600 hover:underline"
                            >
                              Ouvrir le CV
                            </a>
                          ) : null}
                        </div>
                      </details>
                      <div className="mt-4 border-t border-gray-100 pt-3">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                          Statut
                        </label>
                        <select
                          value={application.status}
                          disabled={updating === application.id}
                          onChange={(event) =>
                            void changeStatus(
                              application,
                              event.target.value as CfaApplicationStatus,
                            )
                          }
                          className="mt-1 h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs font-medium text-gray-700 outline-none focus:border-indigo-400"
                        >
                          {CFA_APPLICATION_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {CFA_STATUS_LABELS[status]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </article>
                  ))}
                  {items.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 px-3 py-8 text-center text-xs text-gray-400">
                      Aucun candidat
                    </div>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
