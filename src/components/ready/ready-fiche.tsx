"use client";

import { useCallback, useState } from "react";
import { CopyField } from "@/components/ready/copy-field";
import { readyAuthHeaders } from "@/lib/ready/client-session";
import {
  copyAmountCents,
  copyDurationHours,
  copyIban,
  copySiret,
  displayAmountCents,
  displaySiret,
  maskIban,
} from "@/lib/ready/copy-format";
import { fieldLabel, type ReadyOpcoProfile } from "@/lib/ready/opco-profiles";
import type { ReadyCompanyFields, ReadyFichePayload, ReadyLearnerFields } from "@/lib/ready/types";

type Props = {
  token: string;
  initial: ReadyFichePayload;
};

function BlockTitle({
  n,
  title,
  prepared,
}: {
  n: number;
  title: string;
  prepared: boolean;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span
        className="flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-extrabold text-white"
        style={
          prepared
            ? { background: "var(--ready-gradient)" }
            : { background: "#fff", color: "#000" }
        }
      >
        {n}
      </span>
      <h2 className="text-[18px] font-extrabold tracking-[-0.045em] text-white">{title}</h2>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <section
      className="p-5 md:p-6"
      style={{ background: "var(--ready-card)", borderRadius: 36 }}
    >
      {children}
    </section>
  );
}

export function ReadyFiche({ token, initial }: Props) {
  const [fiche, setFiche] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const profile: ReadyOpcoProfile = {
    id: fiche.opco_profile.id,
    label: fiche.opco_profile.label,
    portalName: fiche.opco_profile.portal_name,
    portalUrl: fiche.opco_profile.portal_url,
    portalCtaLabel: fiche.opco_profile.portal_cta_label,
    labels: {},
    fieldOrder: [],
    optionalLearnerFields: fiche.opco_profile.optional_learner_fields as Array<
      "learner_entry_date" | "learner_diploma"
    >,
  };

  const label = (key: Parameters<typeof fieldLabel>[1], fallback: string) =>
    fieldLabel(profile, key, fallback);

  const reload = useCallback(async () => {
    const res = await fetch(`/api/ready/${encodeURIComponent(token)}/fiche`, {
      headers: readyAuthHeaders(token),
      credentials: "include",
    });
    if (!res.ok) return;
    const json = (await res.json()) as ReadyFichePayload;
    setFiche(json);
  }, [token]);

  const patch = async (body: Record<string, unknown>) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/ready/${encodeURIComponent(token)}/patch`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...readyAuthHeaders(token),
        },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Enregistrement impossible");
      await reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const setCompany = (key: keyof ReadyCompanyFields, value: string) => {
    setFiche((prev) => ({
      ...prev,
      company: { ...prev.company, [key]: value },
    }));
  };

  const setLearnerField = (
    id: string,
    key: keyof ReadyLearnerFields,
    value: string | boolean | null,
  ) => {
    setFiche((prev) => ({
      ...prev,
      learners: prev.learners.map((l) =>
        l.id === id ? { ...l, fields: { ...l.fields, [key]: value } } : l,
      ),
    }));
  };

  const saveCompany = () => void patch({ company: fiche.company });
  const saveLearner = (id: string, fields: ReadyLearnerFields) =>
    void patch({ learner: { id, fields } });

  const deposit = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/ready/${encodeURIComponent(token)}/deposited`, {
        method: "POST",
        headers: readyAuthHeaders(token),
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Impossible d'enregistrer");
      setMsg("Demande enregistrée — merci.");
      await reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const expiryDays = fiche.link.days_until_expiry;
  const depositDays = fiche.days_until_deposit;
  const progressPct =
    fiche.link.progress_total > 0
      ? Math.min(100, Math.round((fiche.link.progress_ready / fiche.link.progress_total) * 100))
      : 0;

  const depositLabel = new Date(fiche.deposit_deadline).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
  });
  const showEntry = !profile.optionalLearnerFields.includes("learner_entry_date");
  const showDiploma = !profile.optionalLearnerFields.includes("learner_diploma");
  // optional fields still shown but marked optional
  const entryOptional = profile.optionalLearnerFields.includes("learner_entry_date");
  const diplomaOptional = profile.optionalLearnerFields.includes("learner_diploma");

  return (
    <main className="mx-auto max-w-[1180px] px-4 pb-16 pt-6 md:px-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <img src="/brand/logo-byound-blanc.png" alt="Byound" className="h-7 w-auto" />
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-3 py-1.5 text-[12px] font-semibold"
            style={{ background: "var(--ready-tile)", color: "#FF6B8A" }}
          >
            🔒 Lien sécurisé
            {expiryDays != null ? ` · expire dans ${expiryDays} jour${expiryDays > 1 ? "s" : ""}` : ""}
          </span>
          <span
            className="rounded-full px-3 py-1.5 text-[12px] font-medium"
            style={{ background: "var(--ready-tile)", color: "var(--ready-muted)" }}
          >
            {fiche.link.recipient_name || fiche.link.recipient_email}
            {fiche.organization.name ? ` · RH, ${fiche.organization.name}` : ""}
          </span>
        </div>
      </header>

      <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 space-y-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[13px] font-semibold" style={{ color: "var(--ready-muted)" }}>
                Byound Ready · Dossier OPCO
              </p>
              <h1 className="mt-1 text-[28px] font-extrabold tracking-[-0.045em] text-white md:text-[34px]">
                {fiche.course.title}
              </h1>
              <p className="mt-2 text-[14px]" style={{ color: "var(--ready-muted)" }}>
                {fiche.course.dates_label} · {fiche.course.duration_hours} heures ·{" "}
                {fiche.course.formula.replace("-entreprise", "")} · {fiche.course.learners_count}{" "}
                stagiaire{fiche.course.learners_count > 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex w-full max-w-md flex-col gap-3 md:w-auto">
              <div className="flex gap-3">
                <div
                  className="flex-1 px-4 py-3"
                  style={{ background: "var(--ready-card)", borderRadius: 22 }}
                >
                  <p className="text-[11px]" style={{ color: "var(--ready-muted)" }}>
                    Votre OPCO
                  </p>
                  <p className="mt-1 text-[16px] font-extrabold tracking-[-0.03em]">
                    {fiche.organization.opco_name || fiche.opco_profile.label}
                  </p>
                  <p className="text-[12px]" style={{ color: "var(--ready-muted)" }}>
                    Portail {fiche.opco_profile.portal_name}
                  </p>
                </div>
                <div
                  className="flex-1 px-4 py-3 text-white"
                  style={{ background: "var(--ready-gradient)", borderRadius: 22 }}
                >
                  <p className="text-[11px] opacity-90">À déposer avant le {depositLabel}</p>
                  <p className="mt-1 text-[16px] font-extrabold tracking-[-0.03em]">
                    {depositDays != null && depositDays >= 0
                      ? `Il vous reste ${depositDays} jour${depositDays > 1 ? "s" : ""}.`
                      : depositDays != null && depositDays < 0
                        ? "Délai dépassé"
                        : "Calendrier à confirmer"}
                  </p>
                </div>
              </div>
              {fiche.opco_profile.portal_url ? (
                <a
                  href={fiche.opco_profile.portal_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full px-4 py-3 text-center text-[14px] font-extrabold text-white"
                  style={{ background: "var(--ready-gradient)" }}
                >
                  {fiche.opco_profile.portal_cta_label} →
                </a>
              ) : (
                <p className="text-[12px]" style={{ color: "var(--ready-muted)" }}>
                  Déposez ensuite votre demande sur le portail de votre OPCO.
                </p>
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-[12px]">
              <span style={{ color: "var(--ready-muted)" }}>
                {fiche.link.progress_ready} champs prêts sur {fiche.link.progress_total}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full" style={{ background: "var(--ready-tile)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progressPct}%`, background: "var(--ready-gradient)" }}
              />
            </div>
            <div className="mt-2 flex gap-4 text-[11px]" style={{ color: "var(--ready-muted)" }}>
              <span>
                <span
                  className="mr-1 inline-block h-2 w-2 rounded-full align-middle"
                  style={{ background: "var(--ready-gradient)" }}
                />
                Préparé par Byound
              </span>
              <span>
                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-white align-middle" />À
                compléter par vous
              </span>
            </div>
          </div>

          <Panel>
            <BlockTitle n={1} title="L'organisme de formation" prepared />
            <div className="space-y-2">
              <CopyField
                label={label("of_legal_name", "Raison sociale")}
                displayValue={fiche.of.legal_name}
                copyValue={fiche.of.legal_name}
              />
              <CopyField
                label={label("of_siret", "SIRET")}
                displayValue={displaySiret(fiche.of.siret)}
                copyValue={copySiret(fiche.of.siret)}
              />
              <CopyField
                label={label("of_nda", "N° déclaration d'activité")}
                displayValue={fiche.of.nda}
                copyValue={fiche.of.nda}
              />
              <CopyField
                label={label("of_qualiopi", "Certification Qualiopi")}
                displayValue={fiche.of.qualiopi}
                copyValue={fiche.of.qualiopi}
              />
              <CopyField
                label={label("of_address", "Adresse")}
                displayValue={fiche.of.address}
                copyValue={fiche.of.address}
              />
              <CopyField
                label={label("of_contact", "Contact")}
                displayValue={fiche.of.contact}
                copyValue={fiche.of.contact}
              />
              {fiche.link.payment_mode === "subrogation" && fiche.of.iban ? (
                <CopyField
                  label={label("of_iban", "RIB (IBAN)")}
                  displayValue={maskIban(fiche.of.iban)}
                  copyValue={copyIban(fiche.of.iban)}
                />
              ) : null}
            </div>
          </Panel>

          <Panel>
            <BlockTitle n={2} title="L'action de formation" prepared />
            <div className="space-y-2">
              <CopyField
                label={label("action_title", "Intitulé")}
                displayValue={fiche.course.title}
                copyValue={fiche.course.title}
              />
              {fiche.course.objective ? (
                <CopyField
                  label={label("action_objective", "Objectif")}
                  displayValue={fiche.course.objective}
                  copyValue={fiche.course.objective}
                />
              ) : null}
              <CopyField
                label={label("action_dates", "Dates")}
                displayValue={fiche.course.dates_label}
                copyValue={fiche.course.dates_label}
              />
              <CopyField
                label={label("action_duration", "Durée (heures)")}
                displayValue={String(fiche.course.duration_hours)}
                copyValue={copyDurationHours(fiche.course.duration_hours)}
              />
              <CopyField
                label={label("action_modality", "Modalité")}
                displayValue={fiche.course.modality}
                copyValue={fiche.course.modality}
              />
              <CopyField
                label={label("action_location", "Lieu")}
                displayValue={fiche.course.location}
                copyValue={fiche.course.location}
              />
              <CopyField
                label={label("action_formula", "Formule")}
                displayValue={fiche.course.formula}
                copyValue={fiche.course.formula}
              />
              <CopyField
                label={label("action_certifying", "Certifiante")}
                displayValue={
                  fiche.course.certifying
                    ? `Oui${fiche.course.rncp_or_rs ? ` · ${fiche.course.rncp_or_rs}` : ""}`
                    : "Non"
                }
                copyValue={fiche.course.certifying ? "Oui" : "Non"}
              />
              <CopyField
                label={label("action_ht", "Coût pédagogique HT")}
                displayValue={displayAmountCents(fiche.amounts.ht_cents)}
                copyValue={copyAmountCents(fiche.amounts.ht_cents)}
              />
              <CopyField
                label={label("action_tva", "TVA")}
                displayValue={displayAmountCents(fiche.amounts.tva_cents)}
                copyValue={copyAmountCents(fiche.amounts.tva_cents)}
              />
              <CopyField
                label={label("action_ttc", "Coût TTC")}
                displayValue={displayAmountCents(fiche.amounts.ttc_cents)}
                copyValue={copyAmountCents(fiche.amounts.ttc_cents)}
              />
              <CopyField
                label={label("action_learners_count", "Nombre de stagiaires")}
                displayValue={String(fiche.course.learners_count)}
                copyValue={String(fiche.course.learners_count)}
              />
            </div>
          </Panel>

          <Panel>
            <BlockTitle n={3} title="Votre entreprise" prepared={false} />
            <div className="space-y-3">
              {(
                [
                  ["siret", label("company_siret", "SIRET")],
                  ["idcc", label("company_idcc", "Convention collective (IDCC)")],
                  ["headcount", label("company_headcount", "Effectif")],
                  ["opco_name", label("company_opco", "OPCO de rattachement")],
                  ["member_number", label("company_member_number", "N° d'adhérent OPCO")],
                ] as Array<[keyof ReadyCompanyFields, string]>
              ).map(([key, lab]) => {
                const filled = Boolean(fiche.company[key]?.trim());
                return (
                  <div
                    key={key}
                    className="flex items-end gap-2 px-4 py-3"
                    style={{ background: "var(--ready-tile)", borderRadius: 22 }}
                  >
                    <label className="min-w-0 flex-1">
                      <span
                        className="mb-1 flex items-center gap-2 text-[12px]"
                        style={{ color: "var(--ready-muted)" }}
                      >
                        <span className="inline-block h-2 w-2 rounded-full bg-white" />
                        {lab}
                      </span>
                      <input
                        value={fiche.company[key]}
                        onChange={(e) => setCompany(key, e.target.value)}
                        onBlur={saveCompany}
                        className="w-full border-0 bg-transparent p-0 text-[15px] font-semibold text-white outline-none"
                      />
                    </label>
                    <button
                      type="button"
                      disabled={!filled}
                      aria-label={`Copier ${lab}`}
                      onClick={async () => {
                        const v =
                          key === "siret"
                            ? copySiret(fiche.company[key])
                            : fiche.company[key];
                        try {
                          await navigator.clipboard.writeText(v);
                        } catch {
                          /* ignore */
                        }
                      }}
                      className="shrink-0 rounded-full px-3 py-1.5 text-[12px] font-bold disabled:opacity-40"
                      style={{ background: "rgba(255,255,255,0.08)", color: "#fff" }}
                    >
                      Copier
                    </button>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel>
            <BlockTitle n={4} title="Vos stagiaires" prepared={false} />
            <div className="-mx-1 overflow-x-auto">
              <table className="min-w-[720px] w-full border-separate border-spacing-y-2 text-left text-[13px]">
                <thead>
                  <tr style={{ color: "var(--ready-muted)" }}>
                    <th className="px-2 font-medium">Nom</th>
                    <th className="px-2 font-medium">Prénom</th>
                    <th className="px-2 font-medium">Sexe</th>
                    <th className="px-2 font-medium">Né(e) le</th>
                    <th className="px-2 font-medium">Contrat</th>
                    <th className="px-2 font-medium">Catégorie</th>
                    {(showEntry || entryOptional) && (
                      <th className="px-2 font-medium">
                        Entrée{entryOptional ? " (opt.)" : ""}
                      </th>
                    )}
                    {(showDiploma || diplomaOptional) && (
                      <th className="px-2 font-medium">
                        Diplôme{diplomaOptional ? " (opt.)" : ""}
                      </th>
                    )}
                    <th className="px-2 font-medium">Heures</th>
                    <th className="px-2 font-medium">Temps travail</th>
                  </tr>
                </thead>
                <tbody>
                  {fiche.learners.map((l) => (
                    <tr key={l.id}>
                      <td className="px-2 py-1 font-semibold">{l.last_name}</td>
                      <td className="px-2 py-1 font-semibold">{l.first_name}</td>
                      {(
                        [
                          ["sex", "M/F"],
                          ["date_of_birth", "jj/mm/aaaa"],
                          ["contract_type", "CDI…"],
                          ["csp", "Cadre…"],
                        ] as Array<[keyof ReadyLearnerFields, string]>
                      ).map(([key, ph]) => (
                        <td key={key} className="px-2 py-1">
                          <input
                            placeholder={ph}
                            value={String(l.fields[key] ?? "")}
                            disabled={busy}
                            onChange={(e) => setLearnerField(l.id, key, e.target.value)}
                            onBlur={() => saveLearner(l.id, l.fields)}
                            className="w-[100px] rounded-[12px] px-2 py-1.5 text-white outline-none"
                            style={{ background: "var(--ready-tile)" }}
                          />
                        </td>
                      ))}
                      {(showEntry || entryOptional) && (
                        <td className="px-2 py-1">
                          <input
                            placeholder="jj/mm/aaaa"
                            value={l.fields.entry_date}
                            disabled={busy}
                            onChange={(e) => setLearnerField(l.id, "entry_date", e.target.value)}
                            onBlur={() => saveLearner(l.id, l.fields)}
                            className="w-[100px] rounded-[12px] px-2 py-1.5 text-white outline-none"
                            style={{ background: "var(--ready-tile)" }}
                          />
                        </td>
                      )}
                      {(showDiploma || diplomaOptional) && (
                        <td className="px-2 py-1">
                          <input
                            placeholder="Niveau"
                            value={l.fields.diploma_level}
                            disabled={busy}
                            onChange={(e) =>
                              setLearnerField(l.id, "diploma_level", e.target.value)
                            }
                            onBlur={() => saveLearner(l.id, l.fields)}
                            className="w-[90px] rounded-[12px] px-2 py-1.5 text-white outline-none"
                            style={{ background: "var(--ready-tile)" }}
                          />
                        </td>
                      )}
                      <td className="px-2 py-1">
                        <input
                          placeholder="h"
                          value={l.fields.hours}
                          disabled={busy}
                          onChange={(e) => setLearnerField(l.id, "hours", e.target.value)}
                          onBlur={() => saveLearner(l.id, l.fields)}
                          className="w-[64px] rounded-[12px] px-2 py-1.5 text-white outline-none"
                          style={{ background: "var(--ready-tile)" }}
                        />
                      </td>
                      <td className="px-2 py-1">
                        <select
                          value={
                            l.fields.on_work_time === true
                              ? "yes"
                              : l.fields.on_work_time === false
                                ? "no"
                                : ""
                          }
                          disabled={busy}
                          onChange={(e) => {
                            const v =
                              e.target.value === "yes"
                                ? true
                                : e.target.value === "no"
                                  ? false
                                  : null;
                            setLearnerField(l.id, "on_work_time", v);
                            void patch({
                              learner: {
                                id: l.id,
                                fields: { ...l.fields, on_work_time: v },
                              },
                            });
                          }}
                          className="rounded-[12px] px-2 py-1.5 text-white outline-none"
                          style={{ background: "var(--ready-tile)" }}
                        >
                          <option value="">—</option>
                          <option value="yes">Oui</option>
                          <option value="no">Non</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!fiche.learners.length ? (
                <p className="px-2 text-[13px]" style={{ color: "var(--ready-muted)" }}>
                  Aucun stagiaire sur le dossier pour l’instant.
                </p>
              ) : null}
            </div>
          </Panel>
        </div>

        <aside className="w-full shrink-0 space-y-4 lg:sticky lg:top-6 lg:w-[320px]">
          {fiche.opco_profile.portal_url ? (
            <Panel>
              <h3 className="text-[15px] font-extrabold tracking-[-0.03em]">
                Portail {fiche.opco_profile.portal_name}
              </h3>
              <p className="mt-2 text-[13px]" style={{ color: "var(--ready-muted)" }}>
                Une fois les champs copiés, déposez votre demande directement sur le portail de
                votre OPCO.
              </p>
              <a
                href={fiche.opco_profile.portal_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex w-full items-center justify-center rounded-full py-3.5 text-[14px] font-extrabold text-white"
                style={{ background: "var(--ready-gradient)" }}
              >
                {fiche.opco_profile.portal_cta_label} →
              </a>
            </Panel>
          ) : null}

          <Panel>
            <h3 className="text-[15px] font-extrabold tracking-[-0.03em]">Coûts calculés</h3>
            <div className="mt-3 space-y-2 text-[13px]">
              <div className="flex justify-between gap-2">
                <span style={{ color: "var(--ready-muted)" }}>Par stagiaire</span>
                <span className="font-semibold">
                  {displayAmountCents(fiche.amounts.per_learner_ht_cents)} HT
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span style={{ color: "var(--ready-muted)" }}>Par heure / stagiaire</span>
                <span className="font-semibold">
                  {displayAmountCents(fiche.amounts.per_hour_per_learner_cents)} HT
                </span>
              </div>
            </div>
          </Panel>

          <Panel>
            <h3 className="text-[15px] font-extrabold tracking-[-0.03em]">Pièces à joindre</h3>
            <ul className="mt-3 space-y-2">
              {fiche.attachments.map((a) => (
                <li key={a.key}>
                  {a.available ? (
                    <a
                      href={`/api/ready/${encodeURIComponent(token)}/attachments/${a.key}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-[16px] px-3 py-2.5 text-[13px] font-semibold text-white"
                      style={{ background: "var(--ready-tile)" }}
                    >
                      {a.label}
                      <span aria-hidden>↓</span>
                    </a>
                  ) : (
                    <span
                      className="flex items-center justify-between rounded-[16px] px-3 py-2.5 text-[13px] opacity-40"
                      style={{ background: "var(--ready-tile)" }}
                    >
                      {a.label}
                      <span>Bientôt</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel>
            <h3 className="text-[15px] font-extrabold tracking-[-0.03em]">Mode de paiement</h3>
            <div className="mt-3 space-y-2">
              {(
                [
                  ["subrogation", "Subrogation", "Votre OPCO paie Byound directement."],
                  [
                    "remboursement",
                    "Remboursement",
                    "Vous réglez la facture, puis votre OPCO vous rembourse.",
                  ],
                ] as const
              ).map(([mode, title, hint]) => {
                const selected = fiche.link.payment_mode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setFiche((p) => ({
                        ...p,
                        link: { ...p.link, payment_mode: mode },
                      }));
                      void patch({ payment_mode: mode });
                    }}
                    className="w-full rounded-[18px] px-3 py-3 text-left"
                    style={
                      selected
                        ? { background: "var(--ready-gradient)" }
                        : { background: "var(--ready-tile)" }
                    }
                  >
                    <p className="text-[14px] font-extrabold">{title}</p>
                    <p
                      className="mt-0.5 text-[12px]"
                      style={{ color: selected ? "rgba(255,255,255,.9)" : "var(--ready-muted)" }}
                    >
                      {hint}
                    </p>
                  </button>
                );
              })}
            </div>
          </Panel>

          <div className="space-y-2">
            {fiche.tutorial_url ? (
              <a
                href={fiche.tutorial_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 text-[14px] font-extrabold text-black"
              >
                ▶ Revoir le tutoriel
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="w-full rounded-full bg-white/80 py-3.5 text-[14px] font-extrabold text-black opacity-50"
              >
                ▶ Revoir le tutoriel
              </button>
            )}
            <a
              href={`/api/ready/${encodeURIComponent(token)}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center rounded-full py-3.5 text-[14px] font-extrabold text-white"
              style={{ background: "var(--ready-tile)" }}
            >
              Télécharger la fiche en PDF
            </a>
            <button
              type="button"
              disabled={busy || Boolean(fiche.link.submitted_at)}
              onClick={() => void deposit()}
              className="w-full rounded-full py-3.5 text-[14px] font-extrabold text-white disabled:opacity-50"
              style={{ background: "var(--ready-gradient)" }}
            >
              {fiche.link.submitted_at ? "Demande déposée ✓" : "J'ai déposé ma demande"}
            </button>
          </div>

          {msg ? (
            <p className="text-center text-[13px]" style={{ color: "#FF6B8A" }} role="status">
              {msg}
            </p>
          ) : null}
        </aside>
      </div>

      <footer
        className="mt-12 text-center text-[11px] leading-relaxed"
        style={{ color: "var(--ready-muted)" }}
      >
        Lien personnel, réservé à {fiche.link.recipient_name || fiche.link.recipient_email}. Expire
        le{" "}
        {new Date(fiche.link.expires_at).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
        . Les données de vos stagiaires sont alors supprimées. Byound Business · SIRET{" "}
        {displaySiret(fiche.of.siret)}.
      </footer>
    </main>
  );
}
