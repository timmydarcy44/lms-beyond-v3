"use client";

import { useEffect, useMemo, useState } from "react";

import { getCfaSpecializationLabel, type CfaApplication } from "@/lib/cfa-applications";

type Company = {
  id: string;
  company_name: string;
  siret: string | null;
  contact_name: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  contact_role: string | null;
  email: string | null;
  phone: string | null;
  company_address: string | null;
};

type Curriculum = { id: string; name: string; code: string | null };

const CERFA_FIELDS = [
  ["lastName", "Nom"],
  ["firstName", "Prénom"],
  ["birthDate", "Date de naissance"],
  ["birthPlace", "Lieu de naissance"],
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

const DOCUMENT_LABELS: Record<string, string> = {
  cv: "CV",
  motivation: "Motivation audio / vidéo",
  identity: "Pièce d’identité",
  social_security: "Attestation Sécurité sociale",
  diploma: "Diplôme / relevé de notes",
};

function staffValue(student: CfaApplication, key: string): string {
  return String(student.cerfa_data?.[key] ?? "");
}

export function AdmisBoard() {
  const [students, setStudents] = useState<CfaApplication[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [companyOpen, setCompanyOpen] = useState<Company | null>(null);
  const [label, setLabel] = useState("Document scanné");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/super/cfa/admis", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Chargement impossible");
      setStudents(payload.students ?? []);
      setCompanies(payload.companies ?? []);
      setCurricula(payload.curricula ?? []);
      setSelectedId((current) => current ?? payload.students?.[0]?.id ?? null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const selected = students.find((student) => student.id === selectedId) ?? null;
  const hostId = selected ? staffValue(selected, "_staff_host_company_id") : "";
  const host = companies.find((company) => company.id === hostId) ?? null;
  const cursusId = selected ? staffValue(selected, "_staff_curriculum_id") : "";
  const alternance = selected?.financing_path === "alternance" || selected?.alternance_status === "company_found";
  const documents = useMemo(() => {
    if (!selected) return [];
    const urls = selected.administrative_document_urls ?? {};
    const files = selected.private_files ?? {};
    return Object.keys({ ...urls, ...files }).map((key) => ({
      key,
      label: files[key]?.original_name || DOCUMENT_LABELS[key] || key,
      url: files[key]?.signed_url || urls[key] || "",
    }));
  }, [selected]);

  async function saveStaff(patch: { curriculumId?: string; companyId?: string }) {
    if (!selected) return;
    setMessage("");
    const response = await fetch("/api/super/cfa/admis", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id, ...patch }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(payload.error || "Enregistrement impossible");
      return;
    }
    if (patch.curriculumId) {
      const assigned = await fetch("/api/super/cfa/cursus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assign_learner", email: selected.email, curriculumId: patch.curriculumId }),
      });
      const assignedPayload = await assigned.json().catch(() => ({}));
      if (!assigned.ok) setMessage(assignedPayload.error || "Cursus enregistré sur le dossier. Le compte apprenant n'est pas encore relié.");
    }
    await load();
  }

  async function upload(file: File) {
    if (!selected) return;
    const body = new FormData();
    body.set("id", selected.id);
    body.set("label", label);
    body.set("file", file);
    const response = await fetch("/api/super/cfa/admis", { method: "POST", body });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(payload.error || "Scan impossible");
      return;
    }
    setMessage("Document ajouté au dossier.");
    await load();
  }

  return (
    <div className="super-lms-light min-h-[calc(100vh-5rem)] bg-[#F5F5F7] text-slate-900">
      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">CRM CFA</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Étudiants admis</h1>
          <div className="mt-4 space-y-2">
            {loading ? <p className="text-sm text-slate-400">Chargement…</p> : null}
            {!loading && students.length === 0 ? <p className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-slate-400">Aucun étudiant admis.</p> : null}
            {students.map((student) => (
              <button
                key={student.id}
                type="button"
                onClick={() => {
                  setSelectedId(student.id);
                  setCompanyOpen(null);
                }}
                className={`w-full rounded-2xl px-4 py-3 text-left ${student.id === selectedId ? "bg-slate-900 text-white" : "bg-white"}`}
              >
                <p className="font-semibold">{student.first_name} {student.last_name}</p>
                <p className={`text-sm ${student.id === selectedId ? "text-white/70" : "text-slate-500"}`}>{getCfaSpecializationLabel(student.specialization)}</p>
              </button>
            ))}
          </div>
        </section>

        {selected ? (
          <section className="space-y-4">
            <div className="rounded-2xl bg-white p-5">
              <h2 className="text-xl font-bold">{selected.first_name} {selected.last_name}</h2>
              <p className="mt-1 text-sm text-slate-500">{selected.email}{selected.phone ? ` · ${selected.phone}` : ""}</p>
              <p className="mt-2 text-sm">{selected.financing_path === "alternance" ? "Alternance" : selected.financing_path === "byound_start" ? "Byound Start" : "Financement non précisé"}</p>
            </div>

            <div className="rounded-2xl bg-white p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Cursus</h3>
              <select
                value={cursusId}
                onChange={(event) => void saveStaff({ curriculumId: event.target.value })}
                className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">Choisir un cursus</option>
                {curricula.map((curriculum) => (
                  <option key={curriculum.id} value={curriculum.id}>
                    {curriculum.name}
                  </option>
                ))}
              </select>
            </div>

            {alternance ? (
              <div className="rounded-2xl bg-white p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Alternance d’accueil</h3>
                <select
                  value={hostId}
                  onChange={(event) => void saveStaff({ companyId: event.target.value })}
                  className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Choisir l’entreprise</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>{company.company_name}</option>
                  ))}
                </select>
                {host ? (
                  <button type="button" onClick={() => setCompanyOpen(host)} className="mt-3 text-sm font-semibold text-slate-900 underline">
                    {host.company_name}
                  </button>
                ) : null}
              </div>
            ) : null}

            <div className="rounded-2xl bg-white p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Éléments administratifs</h3>
              <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                {CERFA_FIELDS.map(([key, name]) => (
                  <div key={key}>
                    <dt className="text-xs text-slate-400">{name}</dt>
                    <dd className="text-sm">{selected.cerfa_data?.[key] || "—"}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="rounded-2xl bg-white p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Documents</h3>
              <ul className="mt-3 space-y-2">
                {documents.length === 0 ? <li className="text-sm text-slate-400">Aucun document.</li> : null}
                {documents.map((document) => (
                  <li key={document.key}>
                    {document.url ? (
                      <a href={document.url} target="_blank" rel="noreferrer" className="text-sm font-semibold underline">{document.label}</a>
                    ) : (
                      <span className="text-sm">{document.label}</span>
                    )}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <input value={label} onChange={(event) => setLabel(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Nom du document" />
                <label className="cursor-pointer rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                  Scanner un document
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    capture="environment"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void upload(file);
                      event.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
            {message ? <p className="text-sm text-slate-600">{message}</p> : null}
          </section>
        ) : null}
      </div>

      {companyOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => setCompanyOpen(null)}>
          <div className="w-full max-w-md rounded-3xl bg-white p-6" onClick={(event) => event.stopPropagation()}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Entreprise d’accueil</p>
            <h2 className="mt-1 text-2xl font-bold">{companyOpen.company_name}</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div><dt className="text-slate-400">SIRET</dt><dd>{companyOpen.siret || "—"}</dd></div>
              <div><dt className="text-slate-400">Adresse</dt><dd>{companyOpen.company_address || "—"}</dd></div>
              <div><dt className="text-slate-400">Contact</dt><dd>{[companyOpen.contact_first_name, companyOpen.contact_last_name].filter(Boolean).join(" ") || companyOpen.contact_name || "—"}{companyOpen.contact_role ? ` · ${companyOpen.contact_role}` : ""}</dd></div>
              <div><dt className="text-slate-400">E-mail</dt><dd>{companyOpen.email || "—"}</dd></div>
              <div><dt className="text-slate-400">Téléphone</dt><dd>{companyOpen.phone || "—"}</dd></div>
            </dl>
            <button type="button" onClick={() => setCompanyOpen(null)} className="mt-5 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Fermer</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
