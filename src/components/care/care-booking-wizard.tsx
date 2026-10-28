"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CareLink, useCarePublicHost } from "@/components/care/care-host";
import { toCareHref } from "@/lib/care/host";
import { useRouter } from "next/navigation";
import { careBookingInputSchema, CARE_FOR_WHOM_LABELS } from "@/lib/care/booking-schema";
import { carePaymentsEnabled } from "@/lib/care/care-payments";
import { formatCarePrice } from "@/lib/care/care.config";
import { CARE_DOMAINS } from "@/lib/care/domains";
import { createCareBooking } from "@/lib/care/booking-actions";
import { careDomainLabel, formatCareDuration } from "@/lib/care/profile-format";
import type { CareDomain } from "@/lib/care/domains";
import type { CareProfile, CareService } from "@/lib/care/types";
import { formatCareDateLong } from "@/lib/care/working-days";

const STEPS = ["Votre séance", "Vos coordonnées", "Paiement"] as const;
type ForWhom = "self" | "child" | "relative";

export function CareBookingWizard({
  profile,
  service,
  start,
}: {
  profile: CareProfile;
  service: CareService;
  start: string;
}) {
  const router = useRouter();
  const publicHost = useCarePublicHost();
  const payments = carePaymentsEnabled();
  const [step, setStep] = useState(1);
  const [forWhom, setForWhom] = useState<ForWhom>("self");
  const [domain, setDomain] = useState<string>(service.domain);
  const [format, setFormat] = useState<"cabinet" | "visio">(service.formats[0] ?? "visio");
  const [message, setMessage] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [childFirstName, setChildFirstName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [consent, setConsent] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"on_site" | "card" | "wallet">("on_site");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const payload = useMemo(
    () => ({
      slug: profile.slug,
      serviceId: service.id,
      start,
      format,
      forWhom,
      domain,
      message,
      firstName,
      lastName,
      email,
      phone,
      childFirstName,
      childAge: childAge === "" ? undefined : Number(childAge),
      consent,
      paymentMethod,
    }),
    [profile.slug, service.id, start, format, forWhom, domain, message, firstName, lastName, email, phone, childFirstName, childAge, consent, paymentMethod],
  );

  function validateStep() {
    const parsed = careBookingInputSchema.safeParse(payload);
    const nextFields = parsed.success ? {} : Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0] ?? "form"), issue.message]));
    const needed =
      step === 1
        ? ["format", "forWhom", "domain", "start"]
        : step === 2
          ? ["firstName", "lastName", "email", "phone", "childFirstName", "childAge", "consent"]
          : ["paymentMethod"];
    const shown: Record<string, string> = {};
    for (const key of needed) if (nextFields[key]) shown[key] = nextFields[key];
    setFields(shown);
    if (Object.keys(shown).length) {
      setFormError("Vérifiez les champs indiqués.");
      return false;
    }
    setFormError(null);
    return true;
  }

  async function onConfirm() {
    if (!validateStep()) return;
    setPending(true);
    const result = await createCareBooking(payload);
    setPending(false);
    if (!result.ok) {
      setFormError(result.message);
      setFields(result.fields ?? {});
      return;
    }
    router.push(toCareHref(`/care/reservation/${result.id}?token=${result.token}`, publicHost));
  }

  const domainOptions = (profile.domains.length ? profile.domains : CARE_DOMAINS.map((item) => item.id)) as CareDomain[];

  return (
    <div className="care-reserve">
      <header className="care-reserve-head">
        <div className="care-wrap care-reserve-head-inner">
          <p className="care-kicker">Étape {step} sur 3</p>
          <div className="care-reserve-title-row">
            <h1>{STEPS[step - 1]}</h1>
            <CareLink href={`/care/praticiens/${profile.slug}`} className="care-reserve-cancel">
              Annuler
            </CareLink>
          </div>
          <div className="care-reserve-progress" aria-hidden="true">
            {[1, 2, 3].map((item) => (
              <span key={item} className={item <= step ? "is-on" : ""} />
            ))}
          </div>
        </div>
      </header>
      <div className="care-wrap care-reserve-grid">
        <div className="care-reserve-main">
          {formError ? (
            <p className="care-alert" role="alert">
              {formError}
            </p>
          ) : null}
          {step === 1 ? (
            <section>
              <h2>Pour qui</h2>
              <div className="care-who">
                {(Object.keys(CARE_FOR_WHOM_LABELS) as ForWhom[]).map((key) => (
                  <button key={key} type="button" className={forWhom === key ? "is-on" : ""} onClick={() => setForWhom(key)}>
                    <strong>{CARE_FOR_WHOM_LABELS[key].title}</strong>
                    <span>{CARE_FOR_WHOM_LABELS[key].text}</span>
                  </button>
                ))}
              </div>
              <h2>Sujet principal</h2>
              <div className="care-pills-row">
                {domainOptions.map((id) => (
                  <button key={id} type="button" className={`care-chip-btn ${domain === id ? "is-on" : ""}`} onClick={() => setDomain(id)}>
                    {careDomainLabel(id)}
                  </button>
                ))}
                <button type="button" className={`care-chip-btn ${domain === "unknown" ? "is-on" : ""}`} onClick={() => setDomain("unknown")}>
                  Je ne sais pas encore
                </button>
              </div>
              <h2>Format</h2>
              <div className="care-who care-who--2">
                {service.formats.includes("cabinet") ? (
                  <button type="button" className={format === "cabinet" ? "is-on" : ""} onClick={() => setFormat("cabinet")}>
                    <strong>Cabinet</strong>
                    <span>{profile.city || "Sur place"}</span>
                  </button>
                ) : null}
                {service.formats.includes("visio") ? (
                  <button type="button" className={format === "visio" ? "is-on" : ""} onClick={() => setFormat("visio")}>
                    <strong>Visio</strong>
                    <span>Depuis chez vous</span>
                  </button>
                ) : null}
              </div>
              <label className="care-field">
                Message (facultatif)
                <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={2000} rows={4} placeholder="Visible uniquement par votre praticienne" />
              </label>
            </section>
          ) : null}
          {step === 2 ? (
            <section className="care-fields">
              <label className="care-field">
                Prénom
                <input autoComplete="given-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} />
                {fields.firstName ? <span role="alert">{fields.firstName}</span> : null}
              </label>
              <label className="care-field">
                Nom
                <input autoComplete="family-name" value={lastName} onChange={(event) => setLastName(event.target.value)} />
                {fields.lastName ? <span role="alert">{fields.lastName}</span> : null}
              </label>
              <label className="care-field">
                E-mail
                <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
                {fields.email ? <span role="alert">{fields.email}</span> : null}
              </label>
              <label className="care-field">
                Téléphone
                <input type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
                {fields.phone ? <span role="alert">{fields.phone}</span> : null}
              </label>
              {forWhom === "child" ? (
                <>
                  <label className="care-field">
                    Prénom de l’enfant
                    <input autoComplete="off" value={childFirstName} onChange={(event) => setChildFirstName(event.target.value)} />
                    {fields.childFirstName ? <span role="alert">{fields.childFirstName}</span> : null}
                  </label>
                  <label className="care-field">
                    Âge de l’enfant
                    <input inputMode="numeric" autoComplete="off" value={childAge} onChange={(event) => setChildAge(event.target.value)} />
                    {fields.childAge ? <span role="alert">{fields.childAge}</span> : null}
                  </label>
                </>
              ) : null}
              <label className="care-consent">
                <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
                <span>
                  J’accepte la{" "}
                  <Link href="/privacy" target="_blank">
                    politique de confidentialité
                  </Link>
                  .
                </span>
              </label>
              {fields.consent ? <p role="alert">{fields.consent}</p> : null}
            </section>
          ) : null}
          {step === 3 ? (
            <section>
              <div className="care-pay" data-care-payments={payments ? "1" : "0"}>
                <button type="button" className={paymentMethod === "on_site" ? "is-on" : ""} onClick={() => setPaymentMethod("on_site")}>
                  <strong>Régler sur place</strong>
                  <span>Espèces, carte ou chèque selon le praticien</span>
                </button>
                <button type="button" disabled className="is-soon" aria-disabled="true">
                  <strong>Carte bancaire</strong>
                  <span>Bientôt</span>
                </button>
                <button type="button" disabled className="is-soon" aria-disabled="true">
                  <strong>Apple Pay / Google Pay</strong>
                  <span>Bientôt</span>
                </button>
              </div>
            </section>
          ) : null}
          <div className="care-reserve-nav">
            {step > 1 ? (
              <button type="button" className="care-pill care-pill--ink" onClick={() => setStep(step - 1)}>
                Retour
              </button>
            ) : (
              <span />
            )}
            {step < 3 ? (
              <button type="button" className="care-pill care-pill--accent" onClick={() => validateStep() && setStep(step + 1)}>
                Continuer
              </button>
            ) : (
              <button type="button" className="care-pill care-pill--accent" disabled={pending} onClick={() => void onConfirm()}>
                {pending ? "Confirmation…" : "Confirmer le rendez-vous"}
              </button>
            )}
          </div>
        </div>
        <aside className="care-reserve-side">
          <h2>Récapitulatif</h2>
          <p>
            <strong>{profile.display_name}</strong>
            <span>{profile.title}</span>
          </p>
          <p>
            <strong>
              {service.name} · {formatCareDuration(service.duration_min)}
            </strong>
            <span>{formatCarePrice(service.price_cents)}</span>
          </p>
          <p>
            <strong>{formatCareDateLong(start)}</strong>
            <CareLink href={`/care/praticiens/${profile.slug}`}>Changer de créneau</CareLink>
          </p>
          <p>
            <strong>{format === "visio" ? "Visio" : "Cabinet"}</strong>
            <span>Pour {CARE_FOR_WHOM_LABELS[forWhom].title.toLowerCase()}</span>
          </p>
          <p className="care-reserve-total">
            Total <strong>{formatCarePrice(service.price_cents)}</strong>
          </p>
        </aside>
      </div>
    </div>
  );
}
