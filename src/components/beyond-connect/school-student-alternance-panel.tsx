"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Building2, Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";

export type CompanyOption = {
  id: string;
  company_name: string | null;
  name: string | null;
  city?: string | null;
  address?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  opco_name?: string | null;
  siret?: string | null;
  contact_firstname?: string | null;
  contact_lastname?: string | null;
};

type Props = {
  schoolId: string | null;
  learnerId: string;
  companies: CompanyOption[];
  initialHostCompanyProspectId: string | null;
  initialTutorName: string | null;
  initialTutorEmail: string | null;
  appearance?: "light" | "dark";
  /** Fiche entreprise simplifiée (dashboard école apprenant) */
  variant?: "wizard" | "compact";
};

function tutorFromCrm(co: CompanyOption | undefined): { name: string; email: string } {
  if (!co) return { name: "", email: "" };
  const fn = (co.contact_firstname ?? "").trim();
  const ln = (co.contact_lastname ?? "").trim();
  const name = [fn, ln].filter(Boolean).join(" ").trim();
  const email = (co.contact_email ?? "").trim();
  return { name, email };
}

export function SchoolStudentAlternancePanel({
  schoolId,
  learnerId,
  companies,
  initialHostCompanyProspectId,
  initialTutorName,
  initialTutorEmail,
  appearance = "light",
  variant = "wizard",
}: Props) {
  const router = useRouter();
  const [hostId, setHostId] = useState<string>(initialHostCompanyProspectId || "");
  const [tutorName, setTutorName] = useState(initialTutorName || "");
  const [tutorEmail, setTutorEmail] = useState(initialTutorEmail || "");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newSiret, setNewSiret] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setHostId(initialHostCompanyProspectId || "");
    setTutorName(initialTutorName || "");
    setTutorEmail(initialTutorEmail || "");
  }, [initialHostCompanyProspectId, initialTutorName, initialTutorEmail]);

  const persistAlternance = useCallback(
    async (payload: {
      hostId: string;
      tutorName: string;
      tutorEmail: string;
      createCompany?: { company_name: string; siret: string | null };
    }) => {
      if (!schoolId) {
        toast.error("École non identifiée.");
        return;
      }
      setSaving(true);
      try {
        const body: Record<string, unknown> = {
          learnerId,
          host_company_prospect_id: payload.hostId.trim() ? payload.hostId.trim() : null,
          enterprise_tutor_name: payload.tutorName.trim() || null,
          enterprise_tutor_email: payload.tutorEmail.trim() || null,
        };
        if (payload.createCompany?.company_name?.trim()) {
          body.new_company = {
            company_name: payload.createCompany.company_name.trim(),
            siret: payload.createCompany.siret?.trim() || null,
          };
        }
        const res = await fetch("/api/dashboard/ecole/apprenants/alternance", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = (await res.json().catch(() => null)) as { success?: boolean; error?: string; host_company_prospect_id?: string } | null;
        if (!res.ok || !data?.success) {
          const msg = data?.error || `Erreur ${res.status}`;
          throw new Error(msg);
        }
        if (data.host_company_prospect_id) {
          setHostId(String(data.host_company_prospect_id));
        }
        setNewCompanyName("");
        setNewSiret("");
        toast.success("Entreprise et tuteur enregistrés.");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erreur");
      } finally {
        setSaving(false);
      }
    },
    [learnerId, router, schoolId],
  );

  const save = async (opts?: { createCompany?: boolean }) => {
    if (opts?.createCompany && newCompanyName.trim()) {
      await persistAlternance({
        hostId,
        tutorName,
        tutorEmail,
        createCompany: { company_name: newCompanyName.trim(), siret: newSiret.trim() || null },
      });
      return;
    }
    await persistAlternance({ hostId, tutorName, tutorEmail });
  };

  const hasCompanies = companies.length > 0;
  const dark = appearance === "dark";
  const compact = variant === "compact";

  const selected = companies.find((c) => c.id === hostId);
  const displayName = (selected?.company_name || selected?.name || "").trim();

  const c = dark
    ? {
        section: "rounded-2xl border border-white/10 bg-zinc-900/75 p-6 shadow-none backdrop-blur-sm",
        h2: "text-lg font-semibold text-white",
        intro: "mt-2 text-sm text-zinc-400",
        li: "rounded-2xl border border-white/10 bg-zinc-950/50 p-4",
        step: "text-xs font-semibold uppercase tracking-wide text-violet-300/90",
        hint: "mt-1 text-[13px] text-zinc-200",
        amber: "mt-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100",
        amberStrong: "font-semibold text-amber-50",
        label: "text-xs font-semibold text-zinc-500",
        select: "w-full rounded-xl border border-white/15 bg-zinc-950 px-3 py-2.5 text-zinc-100",
        dashed: "space-y-2 rounded-xl border border-dashed border-violet-500/30 bg-zinc-950/60 p-3",
        input: "w-full rounded-lg border border-white/15 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600",
        btnOutline: "w-full rounded-full border border-violet-400/40 bg-violet-600/15 px-3 py-2 text-xs font-semibold text-violet-100 disabled:opacity-40",
        tutorInput: "w-full rounded-xl border border-white/15 bg-zinc-950 px-3 py-2 text-zinc-100 placeholder:text-zinc-600",
        footer: "mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4",
        footerTxt: "text-xs text-zinc-500",
        btnPrimary: "rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50",
        preview: "mt-4 space-y-2 rounded-2xl border border-white/10 bg-zinc-950/50 p-4 text-xs text-zinc-400",
        previewStrong: "text-sm font-semibold text-white",
        summary: "cursor-pointer text-xs font-medium text-violet-300/90 hover:text-violet-200",
      }
    : {
        section: "rounded-2xl border border-[#E5E5EA] bg-white p-6 shadow-sm",
        h2: "text-lg font-semibold text-[#1D1D1F]",
        intro: "mt-2 text-sm text-[#86868B]",
        li: "rounded-2xl border border-[#E5E5EA] bg-[#FAFAFA] p-4",
        step: "text-xs font-semibold uppercase tracking-wide text-[#86868B]",
        hint: "mt-1 text-[13px] text-[#1D1D1F]",
        amber: "mt-2 rounded-xl border border-dashed border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950",
        amberStrong: "font-semibold text-amber-950",
        label: "text-xs font-semibold text-[#86868B]",
        select: "w-full rounded-xl border border-[#E5E5EA] bg-white px-3 py-2.5",
        dashed: "space-y-2 rounded-xl border border-dashed border-[#C7C7CC] bg-white p-3",
        input: "w-full rounded-lg border border-[#E5E5EA] px-2 py-1.5 text-sm",
        btnOutline: "w-full rounded-full border border-[#1D1D1F] bg-white px-3 py-2 text-xs font-semibold text-[#1D1D1F] disabled:opacity-40",
        tutorInput: "w-full rounded-xl border border-[#E5E5EA] bg-white px-3 py-2",
        footer: "mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E5EA] pt-4",
        footerTxt: "text-xs text-[#86868B]",
        btnPrimary: "rounded-full bg-[#1D1D1F] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50",
        preview: "mt-4 space-y-2 rounded-2xl border border-[#E5E5EA] bg-[#FAFAFA] p-4 text-xs text-[#86868B]",
        previewStrong: "text-sm font-semibold text-[#1D1D1F]",
        summary: "cursor-pointer text-xs font-medium text-violet-700 hover:text-violet-900",
      };

  if (compact) {
    return (
      <div className="space-y-4">
        <label className="space-y-1.5">
          <span className={c.label}>Entreprise cliente (CRM)</span>
          <select
            value={hostId}
            disabled={saving}
            onChange={(e) => {
              const nextHost = e.target.value;
              const co = companies.find((x) => x.id === nextHost);
              const { name: tn, email: te } = tutorFromCrm(co);
              setHostId(nextHost);
              setTutorName(tn);
              setTutorEmail(te);
              void persistAlternance({
                hostId: nextHost,
                tutorName: tn,
                tutorEmail: te,
              });
            }}
            className={c.select}
          >
            <option value="">— Aucune entreprise liée —</option>
            {companies.map((co) => (
              <option key={co.id} value={co.id}>
                {(co.company_name || co.name || "Sans nom").trim()}
              </option>
            ))}
          </select>
        </label>

        {!hasCompanies ? (
          <p className={c.amber}>
            Aucune fiche entreprise pour votre établissement. Ajoutez-en via le menu{" "}
            <span className={c.amberStrong}>Entreprises</span>.
          </p>
        ) : null}

        {hostId && selected ? (
          <div className={c.preview}>
            <p className={`flex items-start gap-2 ${c.previewStrong}`}>
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-400" aria-hidden />
              {displayName || "Entreprise"}
            </p>
            {selected.siret ? <p className="text-zinc-500">SIRET {selected.siret}</p> : null}
            {(selected.address || selected.city) ? (
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                {[selected.address, selected.city].filter(Boolean).join(" · ")}
              </p>
            ) : null}
            {selected.contact_phone ? (
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                {selected.contact_phone}
              </p>
            ) : null}
            {selected.contact_email ? (
              <p className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                {selected.contact_email}
              </p>
            ) : null}
            {selected.opco_name ? (
              <span className="inline-flex w-fit rounded-full bg-violet-600/25 px-2 py-0.5 text-[11px] font-semibold text-violet-100">
                OPCO {selected.opco_name}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className={c.label}>Tuteur en entreprise</span>
            <input
              value={tutorName}
              disabled={saving}
              onChange={(e) => setTutorName(e.target.value)}
              className={c.tutorInput}
              placeholder="Prénom Nom"
            />
          </label>
          <label className="space-y-1">
            <span className={c.label}>E-mail du tuteur</span>
            <input
              type="email"
              value={tutorEmail}
              disabled={saving}
              onChange={(e) => setTutorEmail(e.target.value)}
              className={c.tutorInput}
              placeholder="tuteur@entreprise.fr"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className={c.footerTxt}>Les modifications du tuteur sont enregistrées sur la fiche apprenant.</p>
          <button type="button" disabled={saving} onClick={() => void save()} className={c.btnPrimary}>
            {saving ? "Enregistrement…" : "Enregistrer le tuteur"}
          </button>
        </div>

        <details
          className={
            dark
              ? "rounded-xl border border-dashed border-white/15 bg-zinc-950/30 p-3"
              : "rounded-xl border border-dashed border-[#C7C7CC] bg-[#FAFAFA] p-3"
          }
        >
          <summary className={c.summary}>Créer une nouvelle fiche entreprise</summary>
          <div className={`${c.dashed} mt-3 border-0 bg-transparent p-0`}>
            <input
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              placeholder="Raison sociale"
              className={c.input}
            />
            <input
              value={newSiret}
              onChange={(e) => setNewSiret(e.target.value)}
              placeholder="SIRET (optionnel)"
              className={c.input}
            />
            <button
              type="button"
              disabled={saving || !newCompanyName.trim()}
              onClick={() => void save({ createCompany: true })}
              className={c.btnOutline}
            >
              Créer la fiche et lier l&apos;apprenant
            </button>
          </div>
        </details>
      </div>
    );
  }

  return (
    <section className={c.section}>
      <h2 className={c.h2}>Entreprise d&apos;accueil & alternance</h2>
      <p className={c.intro}>
        Fiche CRM de l&apos;établissement et tuteur en entreprise (optionnel hors alternance).
      </p>

      <ol className="mt-6 space-y-6 text-sm">
        <li className={c.li}>
          <p className={c.step}>Étape 1 — Entreprise</p>
          <p className={c.hint}>
            Choisissez une fiche existante, ou créez-en une nouvelle si l&apos;entreprise n&apos;est pas encore dans le
            CRM.
          </p>
          {!hasCompanies ? (
            <p className={c.amber}>
              Aucune fiche entreprise pour votre établissement pour l&apos;instant. Utilisez le bloc à droite ou le
              menu <span className={c.amberStrong}>Entreprises</span>.
            </p>
          ) : null}
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className={c.label}>Entreprise d&apos;accueil (CRM)</span>
              <select value={hostId} onChange={(e) => setHostId(e.target.value)} className={c.select}>
                <option value="">— Aucune entreprise liée —</option>
                {companies.map((co) => (
                  <option key={co.id} value={co.id}>
                    {(co.company_name || co.name || "Sans nom").trim()}
                  </option>
                ))}
              </select>
            </label>
            <div className={c.dashed}>
              <p className={c.label}>Nouvelle fiche (si absente du CRM)</p>
              <input
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="Raison sociale"
                className={c.input}
              />
              <input
                value={newSiret}
                onChange={(e) => setNewSiret(e.target.value)}
                placeholder="SIRET (optionnel)"
                className={c.input}
              />
              <button
                type="button"
                disabled={saving || !newCompanyName.trim()}
                onClick={() => void save({ createCompany: true })}
                className={c.btnOutline}
              >
                Créer la fiche et lier l&apos;apprenant
              </button>
            </div>
          </div>
        </li>

        <li className={c.li}>
          <p className={c.step}>Étape 2 — Tuteur en entreprise</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className={c.label}>Nom du tuteur</span>
              <input
                value={tutorName}
                onChange={(e) => setTutorName(e.target.value)}
                className={c.tutorInput}
                placeholder="Prénom Nom"
              />
            </label>
            <label className="space-y-1">
              <span className={c.label}>E-mail du tuteur</span>
              <input
                type="email"
                value={tutorEmail}
                onChange={(e) => setTutorEmail(e.target.value)}
                className={c.tutorInput}
                placeholder="tuteur@entreprise.fr"
              />
            </label>
          </div>
        </li>
      </ol>

      <div className={c.footer}>
        <p className={c.footerTxt}>Enregistrement sur le profil apprenant.</p>
        <button type="button" disabled={saving} onClick={() => void save()} className={c.btnPrimary}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </section>
  );
}
