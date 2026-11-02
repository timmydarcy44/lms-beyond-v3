"use client";

import { useState } from "react";
import Link from "next/link";
import {
  EFFECTIF_OPTIONS,
  opcoLeadSchema,
  type FormationOption,
} from "@/lib/financement-opco";
import { H2, focusRing } from "@/components/site/ui";

type Field = "siret" | "effectif" | "formationId" | "email";

export function OpcoVerifierForm({
  formations,
  privacyHref,
}: {
  formations: FormationOption[];
  privacyHref: string;
}) {
  const [siret, setSiret] = useState("");
  const [effectif, setEffectif] = useState("");
  const [formationId, setFormationId] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const parsed = opcoLeadSchema.safeParse({ siret, effectif, formationId, email, company_website: website });
    if (!parsed.success) {
      const next: Partial<Record<Field, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "siret" || key === "effectif" || key === "formationId" || key === "email") {
          next[key] ??= issue.message;
        }
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setPending(true);
    try {
      const response = await fetch("/api/contact/opco", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const payload = (await response.json().catch(() => null)) as { ok?: boolean; message?: string; field?: Field } | null;
      if (!response.ok || !payload?.ok) {
        if (payload?.field) setErrors({ [payload.field]: payload.message ?? "Vérifiez ce champ." });
        else setFormError(payload?.message ?? "L'envoi n'a pas abouti. Réessayez dans un instant.");
        return;
      }
      setDone(true);
    } catch {
      setFormError("L'envoi n'a pas abouti. Réessayez dans un instant.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section id="verifier" className="scroll-mt-24 bg-[#F4F4F1] px-6 pb-16 md:pb-[104px]">
      <div className="mx-auto grid max-w-[1240px] items-center gap-10 rounded-[40px] bg-[#070C1C] px-6 py-12 text-white md:px-14 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <H2 light>Vérifiez votre prise en charge.</H2>
          <p className="mt-4 max-w-xl text-[18px] leading-relaxed text-white/75">
            Indiquez votre SIRET et votre effectif. On vous dit quel OPCO peut financer votre formation, et dans quelles conditions.
          </p>
        </div>
        <div className="rounded-[32px] bg-white p-6 text-[#0B0D14] sm:p-8">
          {done ? (
            <div role="status">
              <p className="text-[28px] font-extrabold tracking-[-1px]">Demande envoyée.</p>
              <p className="mt-3 text-[16px] leading-relaxed text-[#4A4F5C]">
                Un conseiller identifie votre OPCO et vous écrit. Gratuit et sans engagement.
              </p>
            </div>
          ) : (
            <form className="relative space-y-4" onSubmit={onSubmit} noValidate aria-busy={pending}>
              <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden>
                <label htmlFor="company_website">Site web</label>
                <input
                  id="company_website"
                  name="company_website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                />
              </div>
              <Field label="SIRET" id="opco-siret" error={errors.siret}>
                <input
                  id="opco-siret"
                  name="siret"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={14}
                  value={siret}
                  aria-invalid={Boolean(errors.siret)}
                  aria-describedby={errors.siret ? "opco-siret-error" : undefined}
                  className={inputClass}
                  onChange={(event) => setSiret(event.target.value.replace(/\D/g, "").slice(0, 14))}
                />
              </Field>
              <Field label="Effectif" id="opco-effectif" error={errors.effectif}>
                <select
                  id="opco-effectif"
                  name="effectif"
                  value={effectif}
                  aria-invalid={Boolean(errors.effectif)}
                  aria-describedby={errors.effectif ? "opco-effectif-error" : undefined}
                  className={inputClass}
                  onChange={(event) => setEffectif(event.target.value)}
                >
                  <option value="">Choisir</option>
                  {EFFECTIF_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Formation envisagée" id="opco-formation" error={errors.formationId}>
                <select
                  id="opco-formation"
                  name="formationId"
                  value={formationId}
                  aria-invalid={Boolean(errors.formationId)}
                  aria-describedby={errors.formationId ? "opco-formation-error" : undefined}
                  className={inputClass}
                  onChange={(event) => setFormationId(event.target.value)}
                >
                  <option value="">Choisir</option>
                  {formations.map((formation) => (
                    <option key={formation.id} value={formation.id}>{formation.title}</option>
                  ))}
                </select>
              </Field>
              <Field label="E-mail professionnel" id="opco-email" error={errors.email}>
                <input
                  id="opco-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "opco-email-error" : undefined}
                  className={inputClass}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </Field>
              <div aria-live="polite">
                {formError ? <p className="text-[14px] font-semibold text-[#0B0D14]">{formError}</p> : null}
              </div>
              <button
                type="submit"
                disabled={pending}
                className={`inline-flex h-14 w-full items-center justify-center rounded-full bg-[#0B0D14] px-6 text-[15px] font-extrabold text-white disabled:opacity-60 ${focusRing}`}
              >
                {pending ? "Envoi…" : "Recevoir mon analyse"}
              </button>
              <p className="text-center text-[13px] text-[#4A4F5C]">Gratuit et sans engagement.</p>
              <p className="text-[13px] leading-relaxed text-[#4A4F5C]">
                Ces informations servent uniquement à préparer votre analyse.{" "}
                <Link href={privacyHref} className={`font-extrabold text-[#0B0D14] underline ${focusRing}`}>
                  Confidentialité
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

const inputClass = `h-14 w-full rounded-2xl border border-[#E6E4DE] bg-[#F4F4F1] px-4 text-[16px] text-[#0B0D14] ${focusRing}`;

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[14px] font-extrabold">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} aria-live="polite" className="mt-2 text-[14px] font-semibold text-[#0B0D14]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
