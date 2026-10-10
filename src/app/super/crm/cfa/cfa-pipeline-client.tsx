"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, GraduationCap, Loader2, Mail, Printer, RefreshCw } from "lucide-react";

import {
  CFA_CHALLENGE_QUESTIONS,
  CFA_APPLICATION_STATUSES,
  CFA_STATUS_LABELS,
  getCfaSpecializationLabel,
  type CfaApplication,
  type CfaApplicationStatus,
  type CfaProgramDownload,
} from "@/lib/cfa-applications";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const downloadColumn = {
  id: "brochure",
  label: "Téléchargement fiche cursus",
  accent: "bg-cyan-400",
} as const;

const columns: {
  id: "application" | "interview" | "review" | "administrative" | "admitted" | "rejected";
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
  {
    id: "administrative",
    label: "Éléments administratifs",
    statuses: ["administrative"],
    accent: "bg-violet-500",
  },
  { id: "admitted", label: "Admitted", statuses: ["admitted"], accent: "bg-emerald-500" },
  { id: "rejected", label: "Non retenu", statuses: ["rejected"], accent: "bg-rose-400" },
];

const CERFA_LABELS = [
  ["lastName", "Nom"],
  ["firstNames", "Prénom(s)"],
  ["sex", "Sexe"],
  ["birthDate", "Date de naissance"],
  ["birthCity", "Commune de naissance"],
  ["birthDepartment", "Département de naissance"],
  ["nationality", "Nationalité"],
  ["address", "Adresse"],
  ["phone", "Téléphone"],
  ["email", "E-mail"],
  ["socialSecurityNumber", "N° de sécurité sociale"],
  ["priorSituation", "Situation avant contrat"],
  ["lastClass", "Dernière classe"],
  ["highestDiploma", "Diplôme le plus élevé"],
  ["rqth", "RQTH"],
  ["highLevelAthlete", "Sportif de haut niveau"],
] as const;

const ADMIN_DOCUMENT_LABELS: Record<string, string> = {
  cv: "CV",
  motivation: "Motivation audio / vidéo",
  identity: "Pièce d’identité",
  social_security: "Attestation Sécurité sociale",
  diploma: "Diplôme / relevé de notes",
};

export function CfaPipelineClient() {
  const [applications, setApplications] = useState<CfaApplication[]>([]);
  const [downloads, setDownloads] = useState<CfaProgramDownload[]>([]);
  const [selectedDownload, setSelectedDownload] = useState<CfaProgramDownload | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [migrationRequired, setMigrationRequired] = useState(false);
  const [downloadsMigrationRequired, setDownloadsMigrationRequired] = useState(false);
  const [selected, setSelected] = useState<CfaApplication | null>(null);
  const [interviewAt, setInterviewAt] = useState("");
  const [interviewNotes, setInterviewNotes] = useState("");
  const [appointmentMessage, setAppointmentMessage] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/super-admin/crm/cfa", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Chargement impossible");
      setApplications(result.applications ?? []);
      setDownloads(result.downloads ?? []);
      setMigrationRequired(Boolean(result.migrationRequired));
      setDownloadsMigrationRequired(Boolean(result.downloadsMigrationRequired));
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
      if (status === "administrative" && result.emailSent === false) {
        setError("Le statut est enregistré, mais l’email au candidat n’a pas pu être envoyé.");
      }
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Mise à jour impossible");
    } finally {
      setUpdating(null);
    }
  }

  function openApplication(application: CfaApplication) {
    setSelected(application);
    setInterviewAt(
      application.interview_at
        ? new Date(
            new Date(application.interview_at).getTime() -
              new Date(application.interview_at).getTimezoneOffset() * 60_000,
          )
            .toISOString()
            .slice(0, 16)
        : "",
    );
    setInterviewNotes(application.interview_notes ?? "");
    setAppointmentMessage("");
  }

  async function scheduleInterview() {
    if (!selected || !interviewAt) {
      setAppointmentMessage("Choisis une date et une heure.");
      return;
    }
    setUpdating(selected.id);
    setAppointmentMessage("");
    try {
      const response = await fetch("/api/super-admin/crm/cfa", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected.id,
          status: "interview",
          interviewAt: new Date(interviewAt).toISOString(),
          interviewNotes,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Enregistrement impossible");
      const updatedApplication = { ...selected, ...result.application };
      setApplications((current) =>
        current.map((item) => (item.id === selected.id ? updatedApplication : item)),
      );
      setSelected(updatedApplication);
      setAppointmentMessage(
        result.emailSent
          ? "Rendez-vous enregistré et email envoyé au candidat."
          : "Rendez-vous enregistré, mais l’email n’a pas pu être envoyé.",
      );
    } catch (scheduleError) {
      setAppointmentMessage(
        scheduleError instanceof Error ? scheduleError.message : "Enregistrement impossible",
      );
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="space-y-6 px-3 py-6 text-white sm:px-6 sm:py-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">
            CRM Apprenant · CFA
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
          <div key={label} className="super-glass-panel rounded-2xl border border-white/10 p-4 shadow-sm">
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
      {downloadsMigrationRequired ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Applique la migration 20261010180000_cfa_program_downloads.sql pour afficher les téléchargements de fiches.
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
        <div className="-mx-3 min-w-0 max-w-full overflow-x-auto overflow-y-hidden pb-2 sm:-mx-6">
          <div className="flex w-max min-w-full flex-nowrap gap-4 px-3 pb-5 sm:px-6">
          <section className="super-glass-panel flex h-[min(72vh,760px)] w-[280px] min-w-[280px] max-w-[280px] shrink-0 flex-col rounded-2xl border border-white/10 p-3">
            <header className="flex shrink-0 items-center justify-between px-1 py-2">
              <div className="flex items-center gap-2">
                <span className={cn("h-2 w-2 rounded-full", downloadColumn.accent)} />
                <h2 className="text-sm font-semibold text-gray-800">{downloadColumn.label}</h2>
              </div>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-gray-500">
                {downloads.length}
              </span>
            </header>
            <div className="mt-2 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {downloads.map((download) => (
                <article
                  key={download.id}
                  onClick={() => setSelectedDownload(download)}
                  className="cursor-pointer rounded-xl border border-white/10 bg-[#10284d]/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300/50 hover:bg-[#153461] hover:shadow-xl"
                >
                  <h3 className="truncate text-sm font-semibold text-gray-950">
                    {download.first_name} {download.last_name}
                  </h3>
                  <p className="mt-1 truncate text-xs text-gray-500">
                    {getCfaSpecializationLabel(download.specialization)}
                  </p>
                  <div className="mt-4 space-y-2 text-xs text-gray-500">
                    <p className="flex items-center gap-2 truncate">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      {download.email}
                    </p>
                    <p className="truncate">{download.phone}</p>
                    <p className="flex items-center gap-2">
                      <Clock3 className="h-3.5 w-3.5 shrink-0" />
                      {new Date(download.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </article>
              ))}
              {downloads.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 px-3 py-8 text-center text-xs text-gray-400">
                  Aucun téléchargement
                </div>
              ) : null}
            </div>
          </section>
          {columns.map((column) => {
            const items = applications.filter((application) =>
              column.statuses.includes(application.status),
            );
            return (
              <section
                key={column.id}
                className="super-glass-panel flex h-[min(72vh,760px)] w-[280px] min-w-[280px] max-w-[280px] shrink-0 flex-col rounded-2xl border border-white/10 p-3"
              >
                <header className="flex shrink-0 items-center justify-between px-1 py-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", column.accent)} />
                    <h2 className="text-sm font-semibold text-gray-800">{column.label}</h2>
                  </div>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-gray-500">
                    {items.length}
                  </span>
                </header>
                <div className="mt-2 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                  {items.map((application) => (
                    <article
                      key={application.id}
                      onClick={() => openApplication(application)}
                      className="cursor-pointer rounded-xl border border-white/10 bg-[#10284d]/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-400/50 hover:bg-[#153461] hover:shadow-xl"
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
                          onClick={(event) => event.stopPropagation()}
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
                      <p className="mt-4 border-t border-gray-100 pt-3 text-xs font-semibold text-indigo-600">
                        Ouvrir la fiche complète
                      </p>
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
                          onClick={(event) => event.stopPropagation()}
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
        </div>
      )}
      <Dialog open={Boolean(selectedDownload)} onOpenChange={(open) => !open && setSelectedDownload(null)}>
        <DialogContent className="cfa-revolut-sheet border-0 sm:max-w-md">
          {selectedDownload ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selectedDownload.first_name} {selectedDownload.last_name}
                </DialogTitle>
                <DialogDescription>Téléchargement fiche cursus</DialogDescription>
              </DialogHeader>
              <div className="space-y-2 text-sm text-gray-200">
                <p><strong>Nom :</strong> {selectedDownload.last_name}</p>
                <p><strong>Prénom :</strong> {selectedDownload.first_name}</p>
                <p><strong>Adresse mail :</strong> {selectedDownload.email}</p>
                <p><strong>Téléphone :</strong> {selectedDownload.phone}</p>
                <p><strong>Cursus :</strong> {getCfaSpecializationLabel(selectedDownload.specialization)}</p>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="cfa-revolut-sheet cfa-print-sheet max-h-[92vh] overflow-y-auto border-0 p-0 sm:max-w-3xl">
          {selected ? (
            <div>
              <DialogHeader className="border-b border-gray-100 p-6 pr-14">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="cfa-no-print absolute right-12 top-3.5 inline-flex h-9 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 text-xs font-semibold text-white hover:bg-white/15"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Imprimer
                </button>
                <DialogTitle className="text-2xl">
                  {selected.first_name} {selected.last_name}
                </DialogTitle>
                <DialogDescription>
                  {getCfaSpecializationLabel(selected.specialization)} · {selected.email}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 p-6 text-sm text-gray-700">
                <section className="grid gap-3 rounded-2xl bg-gray-50 p-4 sm:grid-cols-2">
                  <p><strong>Âge :</strong> {selected.age ?? "—"}</p>
                  <p><strong>Niveau :</strong> {selected.education_level ?? "—"}</p>
                  <p><strong>Téléphone :</strong> {selected.phone ?? "—"}</p>
                  <p><strong>Alternance :</strong> {selected.alternance_status === "company_found" ? "Entreprise trouvée" : selected.alternance_status === "searching" ? "En recherche" : "Non renseignée"}</p>
                </section>
                <section className="space-y-3">
                  <h3 className="font-semibold text-gray-950">Dossier candidat</h3>
                  <p><strong>Parcours :</strong><br />{selected.school_background ?? "—"}</p>
                  <p><strong>Expériences :</strong><br />{selected.experiences ?? "—"}</p>
                  <p><strong>Pourquoi Byound :</strong><br />{selected.motivation_text ?? "Motivation enregistrée en audio ou vidéo."}</p>
                  <div className="flex flex-wrap gap-3">
                    {selected.cv_url ? <a href={selected.cv_url} target="_blank" rel="noreferrer" className="font-semibold text-indigo-600">Ouvrir le CV</a> : null}
                    {selected.motivation_media_signed_url ? <a href={selected.motivation_media_signed_url} target="_blank" rel="noreferrer" className="font-semibold text-indigo-600">Écouter / voir la motivation</a> : null}
                  </div>
                </section>
                <section className="space-y-3">
                  <h3 className="font-semibold text-gray-950">Byound Challenge</h3>
                  {CFA_CHALLENGE_QUESTIONS.map((question) => (
                    <div key={question.id} className="rounded-xl border border-gray-100 p-4">
                      <p className="font-semibold text-gray-900">{question.eyebrow}</p>
                      <p className="mt-1 text-xs text-gray-500">{question.question}</p>
                      <p className="mt-3">{selected.challenge_answers?.[question.id] ?? "—"}</p>
                    </div>
                  ))}
                </section>
                {selected.status === "administrative" ||
                selected.administrative_documents_submitted_at ? (
                  <section className="space-y-3 rounded-2xl border border-violet-100 bg-violet-50/50 p-5">
                    <h3 className="font-semibold text-violet-950">Éléments administratifs</h3>
                    {selected.cerfa_data && Object.keys(selected.cerfa_data).length ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {CERFA_LABELS.map(([key, label]) => (
                          <p key={key} className="text-xs">
                            <strong>{label} :</strong><br />
                            {selected.cerfa_data?.[key] || "—"}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">Informations CERFA en attente.</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs font-semibold text-indigo-600">
                      {Object.entries(selected.administrative_document_urls ?? {}).map(([kind, url]) =>
                        url ? <a key={kind} href={url} target="_blank" rel="noreferrer">{ADMIN_DOCUMENT_LABELS[kind] ?? kind}</a> : null,
                      )}
                    </div>
                    {Object.keys(selected.private_files ?? {}).length ? (
                      <div className="space-y-2 border-t border-white/10 pt-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Registre des pièces déposées
                        </p>
                        {Object.entries(selected.private_files ?? {}).map(([kind, file]) => (
                          <div key={kind} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2 text-xs">
                            <div className="min-w-0">
                              <p className="font-semibold">{ADMIN_DOCUMENT_LABELS[kind] ?? kind}</p>
                              <p className="truncate text-gray-500">
                                {file.original_name ?? file.path}
                                {file.size_bytes ? ` · ${(file.size_bytes / 1024 / 1024).toFixed(2)} Mo` : ""}
                                {file.uploaded_at ? ` · ${new Date(file.uploaded_at).toLocaleDateString("fr-FR")}` : ""}
                              </p>
                            </div>
                            {file.signed_url ? (
                              <a className="cfa-no-print shrink-0 font-semibold text-indigo-400" href={file.signed_url} target="_blank" rel="noreferrer">
                                Ouvrir
                              </a>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <p className={cn("text-xs font-semibold", selected.registration_fee_paid_at ? "text-emerald-700" : "text-amber-700")}>
                      Frais d’inscription : {selected.registration_fee_paid_at ? "250 € payés" : "paiement en attente"}
                    </p>
                  </section>
                ) : null}
                <section className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
                  <div className="flex items-center gap-2 font-semibold text-indigo-950">
                    <CalendarDays className="h-4 w-4" />
                    Planifier l’entretien
                  </div>
                  <div className="mt-4 grid gap-4">
                    <label className="text-xs font-semibold text-gray-600">
                      Date et heure
                      <input type="datetime-local" value={interviewAt} onChange={(event) => setInterviewAt(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-indigo-100 bg-white px-3 text-sm outline-none focus:border-indigo-400" />
                    </label>
                    <label className="text-xs font-semibold text-gray-600">
                      Mot à transmettre au candidat (optionnel)
                      <textarea value={interviewNotes} onChange={(event) => setInterviewNotes(event.target.value)} rows={4} className="mt-1 w-full rounded-xl border border-indigo-100 bg-white p-3 text-sm outline-none focus:border-indigo-400" placeholder="Lien visio, adresse, consignes…" />
                    </label>
                    <button type="button" disabled={updating === selected.id} onClick={() => void scheduleInterview()} className="inline-flex h-11 items-center justify-center rounded-full bg-gray-950 px-5 text-sm font-semibold text-white disabled:opacity-50">
                      {updating === selected.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Enregistrer et envoyer l’email
                    </button>
                    {appointmentMessage ? <p className={cn("text-xs", appointmentMessage.includes("envoyé au candidat") ? "text-emerald-700" : "text-rose-600")}>{appointmentMessage}</p> : null}
                  </div>
                </section>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
