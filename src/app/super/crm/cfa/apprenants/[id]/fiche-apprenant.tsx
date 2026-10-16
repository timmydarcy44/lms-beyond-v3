"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import {
  CFA_APPLICATION_STATUSES,
  CFA_CHALLENGE_QUESTIONS,
  CFA_STATUS_LABELS,
  getCfaSpecializationLabel,
  type CfaApplication,
  type CfaApplicationStatus,
} from "@/lib/cfa-applications";

const CERFA_FIELDS = [
  ["lastName", "Nom"],
  ["birthName", "Nom de naissance"],
  ["firstNames", "Prénom(s)"],
  ["sex", "Sexe"],
  ["birthDate", "Date de naissance"],
  ["birthCity", "Commune de naissance"],
  ["birthDepartment", "Département de naissance"],
  ["nationality", "Nationalité"],
  ["address", "Adresse"],
  ["phone", "Téléphone"],
  ["email", "E-mail"],
  ["socialSecurityNumber", "Numéro de sécurité sociale / carte Vitale"],
  ["priorSituation", "Situation avant le contrat"],
  ["lastClass", "Dernière classe suivie"],
  ["highestDiploma", "Diplôme le plus élevé"],
  ["rqth", "RQTH"],
  ["highLevelAthlete", "Sportif de haut niveau"],
] as const;

const PREPARED_DOCS = [
  ["identity", "Pièce d’identité"],
  ["social_security", "Carte Vitale / attestation Sécurité sociale"],
  ["diploma", "Diplôme ou relevé de notes"],
] as const;

export function FicheApprenant({ id }: { id: string }) {
  const [application, setApplication] = useState<CfaApplication | null>(null);
  const [cerfa, setCerfa] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [interviewAt, setInterviewAt] = useState("");
  const [interviewNotes, setInterviewNotes] = useState("");

  async function load() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/super-admin/crm/cfa", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Chargement impossible");
      const found = ((result.applications ?? []) as CfaApplication[]).find((item) => item.id === id) ?? null;
      setApplication(found);
      const stored = found?.cerfa_data ?? {};
      const next: Record<string, string> = {};
      for (const [key] of CERFA_FIELDS) next[key] = stored[key] ?? "";
      if (found) {
        next.lastName = next.lastName || found.last_name;
        next.firstNames = next.firstNames || found.first_name;
        next.email = next.email || found.email;
        next.phone = next.phone || found.phone || "";
      }
      setCerfa(next);
      setInterviewNotes(found?.interview_notes ?? "");
      setInterviewAt(
        found?.interview_at
          ? new Date(new Date(found.interview_at).getTime() - new Date(found.interview_at).getTimezoneOffset() * 60_000)
              .toISOString()
              .slice(0, 16)
          : "",
      );
      if (!found) setMessage("Dossier introuvable.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [id]);

  async function saveCerfa() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/super-admin/crm/cfa", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_cerfa", id, cerfa }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Enregistrement impossible");
      setMessage("Éléments d’inscription enregistrés.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Enregistrement impossible");
    } finally {
      setBusy(false);
    }
  }

  async function upload(file: File, label: string, kind?: string) {
    setBusy(true);
    setMessage("");
    try {
      const body = new FormData();
      body.set("id", id);
      body.set("label", label);
      if (kind) body.set("kind", kind);
      body.set("file", file);
      const response = await fetch("/api/super/cfa/admis", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Dépôt impossible");
      setMessage("Document ajouté au dossier.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Dépôt impossible");
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(status: CfaApplicationStatus) {
    if (!application) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/super-admin/crm/cfa", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Statut impossible");
      setMessage("Statut mis à jour.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Statut impossible");
    } finally {
      setBusy(false);
    }
  }

  async function scheduleInterview() {
    if (!interviewAt) {
      setMessage("Choisis une date et une heure.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/super-admin/crm/cfa", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: "interview",
          interviewAt: new Date(interviewAt).toISOString(),
          interviewNotes,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Entretien impossible");
      setMessage(result.emailSent ? "Entretien enregistré et e-mail envoyé." : "Entretien enregistré.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Entretien impossible");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center text-white">
        <Loader2 className="h-6 w-6 animate-spin" />
      </main>
    );
  }

  if (!application) {
    return (
      <main className="px-6 py-10 text-white">
        <Link href="/super/crm/cfa" className="text-sm text-indigo-200">Retour au CRM</Link>
        <p className="mt-4">{message || "Dossier introuvable."}</p>
      </main>
    );
  }

  const files = application.private_files ?? {};
  const urls = application.administrative_document_urls ?? {};

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 text-white sm:px-8">
      <div>
        <Link href="/super/crm/cfa" className="text-sm text-indigo-200">CRM Apprenant</Link>
        <h1 className="mt-2 text-3xl font-bold">{application.first_name} {application.last_name}</h1>
        <p className="mt-1 text-sm text-white/70">
          {getCfaSpecializationLabel(application.specialization)} · {application.email}
          {application.phone ? ` · ${application.phone}` : ""}
        </p>
      </div>

      {message ? <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">{message}</p> : null}

      <section className="grid gap-3 rounded-2xl border border-white/10 p-5 sm:grid-cols-2">
        <p><strong>Âge :</strong> {application.age ?? "—"}</p>
        <p><strong>Niveau :</strong> {application.education_level ?? "—"}</p>
        <p><strong>Statut :</strong> {CFA_STATUS_LABELS[application.status]}</p>
        <p><strong>Créé le :</strong> {new Date(application.created_at).toLocaleString("fr-FR")}</p>
        <label className="text-sm sm:col-span-2">
          Changer le statut
          <select
            className="mt-1 h-11 w-full rounded-xl border border-white/15 bg-[#10284d] px-3"
            value={application.status}
            disabled={busy}
            onChange={(event) => void changeStatus(event.target.value as CfaApplicationStatus)}
          >
            {CFA_APPLICATION_STATUSES.map((status) => (
              <option key={status} value={status}>{CFA_STATUS_LABELS[status]}</option>
            ))}
          </select>
        </label>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Dossier</h2>
        <p><strong>Parcours :</strong> {application.school_background || "—"}</p>
        <p><strong>Expériences :</strong> {application.experiences || "—"}</p>
        <p><strong>Motivation :</strong> {application.motivation_text || "—"}</p>
        <div className="flex flex-wrap gap-4 text-sm">
          {application.cv_url ? <a className="text-indigo-200" href={application.cv_url} target="_blank" rel="noreferrer">Ouvrir le CV</a> : <span>CV non déposé</span>}
          {application.motivation_media_signed_url ? <a className="text-indigo-200" href={application.motivation_media_signed_url} target="_blank" rel="noreferrer">Voir la motivation</a> : null}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Challenge</h2>
        {CFA_CHALLENGE_QUESTIONS.map((question) => (
          <div key={question.id} className="rounded-xl border border-white/10 p-4">
            <p className="text-sm text-white/60">{question.eyebrow}</p>
            <p className="mt-1 font-semibold">{question.question}</p>
            <p className="mt-2 text-white/80">{application.challenge_answers?.[question.id] || "—"}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Inscription</h2>
        <p className="text-sm text-white/70">Ces champs sont prêts, même si le candidat ne les a pas encore remplis : nom de naissance, commune de naissance, carte Vitale.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {CERFA_FIELDS.map(([key, label]) => (
            <label key={key} className="text-sm">
              {label}
              <input
                className="mt-1 h-11 w-full rounded-xl border border-white/15 bg-[#10284d] px-3"
                value={cerfa[key] ?? ""}
                onChange={(event) => setCerfa((current) => ({ ...current, [key]: event.target.value }))}
              />
            </label>
          ))}
        </div>
        <button type="button" disabled={busy} onClick={() => void saveCerfa()} className="h-11 rounded-full bg-white px-5 text-sm font-semibold text-black disabled:opacity-50">
          Enregistrer l’inscription
        </button>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Documents</h2>
        {PREPARED_DOCS.map(([kind, label]) => {
          const url = urls[kind];
          return (
            <div key={kind} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 p-4">
              <div>
                <p className="font-semibold">{label}</p>
                <p className="text-sm text-white/60">{url ? "Déposé" : "En attente"}</p>
              </div>
              <div className="flex items-center gap-3">
                {url ? <a className="text-sm text-indigo-200" href={url} target="_blank" rel="noreferrer">Ouvrir</a> : null}
                <label className="cursor-pointer rounded-full border border-white/20 px-4 py-2 text-sm">
                  Déposer
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    capture="environment"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void upload(file, label, kind);
                    }}
                  />
                </label>
              </div>
            </div>
          );
        })}
        <label className="inline-flex cursor-pointer rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold">
          Ajouter un autre document
          <input
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file, file.name);
            }}
          />
        </label>
        {Object.entries(files).length ? (
          <div className="space-y-2">
            {Object.entries(files).map(([kind, file]) => (
              <div key={kind} className="flex items-center justify-between gap-3 text-sm">
                <span>{file.original_name || kind}</span>
                {file.signed_url ? <a className="text-indigo-200" href={file.signed_url} target="_blank" rel="noreferrer">Ouvrir</a> : null}
              </div>
            ))}
          </div>
        ) : null}
        <p className="text-sm text-white/70">
          Frais d’inscription : {application.registration_fee_paid_at ? "250 € payés" : "paiement en attente, chèque accepté."}
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border border-white/10 p-5">
        <h2 className="text-xl font-semibold">Entretien</h2>
        <label className="block text-sm">
          Date et heure
          <input type="datetime-local" value={interviewAt} onChange={(event) => setInterviewAt(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-white/15 bg-[#10284d] px-3" />
        </label>
        <label className="block text-sm">
          Message au candidat
          <textarea value={interviewNotes} onChange={(event) => setInterviewNotes(event.target.value)} rows={4} className="mt-1 w-full rounded-xl border border-white/15 bg-[#10284d] p-3" />
        </label>
        <button type="button" disabled={busy} onClick={() => void scheduleInterview()} className="h-11 rounded-full bg-white px-5 text-sm font-semibold text-black disabled:opacity-50">
          Enregistrer et envoyer l’e-mail
        </button>
      </section>
    </main>
  );
}
