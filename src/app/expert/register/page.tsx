"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Check,
  Loader2,
  Mail,
  Share2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ExpertProfilePreview } from "@/components/expert/register/expert-profile-preview";
import { DomainCard, RevolutField, SelectChip } from "@/components/expert/register/expert-register-ui";
import {
  buildSpecialtiesPayload,
  EMPTY_SPECIALTIES_PROFILE,
  EXPERT_AUDIENCES,
  EXPERT_AVAILABILITY_OPTIONS,
  EXPERT_DOMAINS,
  EXPERT_EXPERIENCE_OPTIONS,
  EXPERT_GEOGRAPHIC_ZONES,
  EXPERT_INTERVENTION_FORMATS,
  EXPERT_LANGUAGE_OPTIONS,
  getAggregatedSpecialtyGroups,
  getDomainsByIds,
  isSpecialtiesStepComplete,
  pruneSpecialtyKeys,
  toggleDomainId,
  type ExpertSpecialtiesProfile,
} from "@/lib/expert/specialties-referential";
import { EXPERT_REGISTER_GENERIC_ERROR } from "@/lib/expert/register-errors";

const STEPS = [
  "email",
  "identity",
  "headline",
  "domains",
  "specialties",
  "formats",
  "details",
  "certification",
  "review",
] as const;

type StepId = (typeof STEPS)[number];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toggleItem(arr: string[], item: string): string[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

function StepHeading({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div>
      {eyebrow ? <p className="text-sm font-medium text-[#A9AEFF]">{eyebrow}</p> : null}
      <h1 className="mt-2 text-[clamp(1.75rem,3.4vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-white">
        {title}
      </h1>
      {subtitle ? <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-white/55">{subtitle}</p> : null}
    </div>
  );
}

function ChipGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-[13px] font-medium text-white/50">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[#070b1f]" />
      <div className="absolute -right-48 -top-48 h-[720px] w-[720px] rounded-full bg-[radial-gradient(circle_at_center,rgba(124,131,255,0.28),transparent_62%)] blur-3xl" />
      <div className="absolute -bottom-72 -left-40 h-[720px] w-[720px] rounded-full bg-[radial-gradient(circle_at_center,rgba(56,120,255,0.16),transparent_62%)] blur-3xl" />
    </div>
  );
}

export default function ExpertRegisterPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [headline, setHeadline] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [profile, setProfile] = useState<ExpertSpecialtiesProfile>(EMPTY_SPECIALTIES_PROFILE);
  const [wantsCertification, setWantsCertification] = useState(false);

  const firstInputRef = useRef<HTMLInputElement>(null);
  const step: StepId = STEPS[stepIndex];
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  useEffect(() => {
    firstInputRef.current?.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [stepIndex]);

  const setProfilePatch = (patch: Partial<ExpertSpecialtiesProfile>) => setProfile((p) => ({ ...p, ...patch }));

  const toggleDomain = (domainId: string) => {
    setProfile((p) => {
      const domainIds = toggleDomainId(p.domainIds, domainId);
      return { ...p, domainIds, specialtyKeys: pruneSpecialtyKeys(p.specialtyKeys, domainIds) };
    });
  };

  const selectedDomains = getDomainsByIds(profile.domainIds);
  const specialtyGroups = getAggregatedSpecialtyGroups(profile.domainIds);

  const canContinue = useMemo(() => {
    switch (step) {
      case "email":
        return EMAIL_RE.test(email.trim());
      case "identity":
        return firstName.trim().length > 0 && lastName.trim().length > 0;
      case "domains":
        return profile.domainIds.length > 0;
      case "specialties":
        return profile.specialtyKeys.length > 0;
      case "formats":
        return profile.formats.length > 0 && profile.audiences.length > 0;
      default:
        return true;
    }
  }, [step, email, firstName, lastName, profile]);

  const goNext = () => {
    if (!canContinue) return;
    setSubmitError(null);
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };
  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));
  const goTo = (id: StepId) => setStepIndex(STEPS.indexOf(id));

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitError(null);
    if (!EMAIL_RE.test(email.trim()) || !firstName.trim() || !lastName.trim()) {
      toast.error("Veuillez compléter votre identité.");
      goTo(!EMAIL_RE.test(email.trim()) ? "email" : "identity");
      return;
    }
    if (!isSpecialtiesStepComplete(profile)) {
      toast.error("Veuillez compléter vos spécialités.");
      goTo(profile.domainIds.length === 0 ? "domains" : profile.specialtyKeys.length === 0 ? "specialties" : "formats");
      return;
    }

    const payload = buildSpecialtiesPayload(profile);

    setSubmitting(true);
    try {
      const res = await fetch("/api/experts/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          headline: headline.trim() || null,
          photo_url: photoUrl.trim() || null,
          linkedin_url: linkedinUrl.trim() || null,
          specialties: payload.specialties,
          formats_supported: payload.formats_supported,
          primary_domain: payload.primary_domain,
          secondary_domains: payload.secondary_domains,
          domains: payload.domains,
          audiences: payload.audiences,
          years_experience: payload.years_experience,
          geographic_zones: payload.geographic_zones,
          languages: payload.languages,
          availabilities: payload.availabilities,
          regions: payload.geographic_zones.length > 0 ? payload.geographic_zones : null,
          wants_certification: wantsCertification,
        }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof out?.error === "string" && out.error.length > 0 ? out.error : EXPERT_REGISTER_GENERIC_ERROR;
        setSubmitError(msg);
        throw new Error(msg);
      }
      if (out?.warning && typeof out?.message === "string") {
        toast.warning(out.message);
      }
      setSubmitted(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : EXPERT_REGISTER_GENERIC_ERROR;
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return <RegisterSuccess email={email.trim()} firstName={firstName.trim()} />;
  }

  const isLast = step === "review";
  const isOptional = step === "headline" || step === "details";
  const showPreview = stepIndex >= 2;

  return (
    <div className="min-h-screen text-white">
      <Backdrop />

      <div className="fixed inset-x-0 top-0 z-30 h-1 bg-white/[0.06]">
        <div
          className="h-full rounded-r-full bg-gradient-to-r from-[#7C83FF] to-[#9BD0FF] transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={stepIndex === 0 || submitting}
            aria-label="Étape précédente"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-white transition hover:bg-white/[0.12] disabled:pointer-events-none disabled:opacity-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <Link href="/" className="text-lg font-semibold tracking-tight text-white">
            Byound
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-xs font-medium tabular-nums text-white/40 sm:inline">
            Étape {stepIndex + 1} sur {STEPS.length}
          </span>
          <Link
            href="/formateurs-experts"
            aria-label="Quitter l'inscription"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-white/70 transition hover:bg-white/[0.12] hover:text-white"
          >
            <X className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-6xl gap-12 px-5 pb-40 pt-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:pt-12">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (isLast) handleSubmit();
            else goNext();
          }}
          className="mx-auto w-full max-w-xl lg:mx-0"
        >
          <div key={step} className="animate-in fade-in slide-in-from-right-4 duration-300">
            {step === "email" ? (
              <div className="space-y-8">
                <StepHeading
                  eyebrow="Devenir expert Byound"
                  title="Commençons par votre e-mail"
                  subtitle="C'est là que nous vous enverrons le lien pour créer votre mot de passe et suivre votre candidature."
                />
                <RevolutField
                  ref={firstInputRef}
                  label="Adresse e-mail"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="text-sm text-white/45">
                  Déjà inscrit ?{" "}
                  <Link href="/login?next=/dashboard/expert" className="font-medium text-white hover:underline">
                    Se connecter
                  </Link>
                </p>
              </div>
            ) : null}

            {step === "identity" ? (
              <div className="space-y-8">
                <StepHeading
                  title="Comment vous appelez-vous ?"
                  subtitle="Votre nom apparaîtra sur votre fiche expert, telle que la voient les entreprises."
                />
                <div className="space-y-3">
                  <RevolutField
                    ref={firstInputRef}
                    label="Prénom"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                  <RevolutField
                    label="Nom"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
            ) : null}

            {step === "headline" ? (
              <div className="space-y-8">
                <StepHeading
                  title={`Présentez-vous${firstName.trim() ? `, ${firstName.trim()}` : ""}`}
                  subtitle="Une ligne suffit. Vous pourrez enrichir votre profil plus tard depuis votre espace."
                />
                <div className="space-y-3">
                  <RevolutField
                    ref={firstInputRef}
                    label="Titre professionnel"
                    hint="Ex. Formateur en management et leadership"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                  />
                  <RevolutField
                    label="Profil LinkedIn (URL)"
                    type="url"
                    inputMode="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                  />
                  <RevolutField
                    label="Photo professionnelle (URL)"
                    type="url"
                    inputMode="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                  />
                </div>
              </div>
            ) : null}

            {step === "domains" ? (
              <div className="space-y-8">
                <StepHeading
                  title="Quels sont vos domaines d'expertise ?"
                  subtitle="Sélectionnez-en un ou plusieurs. Le premier choisi devient votre domaine principal."
                />
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {EXPERT_DOMAINS.map((d) => {
                    const index = profile.domainIds.indexOf(d.id);
                    return (
                      <DomainCard
                        key={d.id}
                        label={d.label}
                        selected={index !== -1}
                        isPrimary={index === 0}
                        onSelect={() => toggleDomain(d.id)}
                      />
                    );
                  })}
                </div>
              </div>
            ) : null}

            {step === "specialties" ? (
              <div className="space-y-8">
                <StepHeading
                  title="Affinez vos spécialités"
                  subtitle="Elles servent à vous proposer les missions qui vous correspondent vraiment."
                />
                <div className="space-y-7">
                  {selectedDomains.map((domain) => (
                    <ChipGroup key={domain.id} label={domain.label}>
                      {specialtyGroups
                        .filter((g) => g.domain.id === domain.id)
                        .map(({ key, label }) => (
                          <SelectChip
                            key={key}
                            label={label}
                            selected={profile.specialtyKeys.includes(key)}
                            onToggle={() => setProfilePatch({ specialtyKeys: toggleItem(profile.specialtyKeys, key) })}
                          />
                        ))}
                    </ChipGroup>
                  ))}
                </div>
              </div>
            ) : null}

            {step === "formats" ? (
              <div className="space-y-8">
                <StepHeading
                  title="Comment et pour qui intervenez-vous ?"
                  subtitle="Choisissez au moins un format et un public."
                />
                <div className="space-y-7">
                  <ChipGroup label="Formats d'intervention">
                    {EXPERT_INTERVENTION_FORMATS.map((f) => (
                      <SelectChip
                        key={f}
                        label={f}
                        selected={profile.formats.includes(f)}
                        onToggle={() => setProfilePatch({ formats: toggleItem(profile.formats, f) })}
                      />
                    ))}
                  </ChipGroup>
                  <ChipGroup label="Public accompagné">
                    {EXPERT_AUDIENCES.map((a) => (
                      <SelectChip
                        key={a}
                        label={a}
                        selected={profile.audiences.includes(a)}
                        onToggle={() => setProfilePatch({ audiences: toggleItem(profile.audiences, a) })}
                      />
                    ))}
                  </ChipGroup>
                </div>
              </div>
            ) : null}

            {step === "details" ? (
              <div className="space-y-8">
                <StepHeading
                  title="Quelques détails pour le matching"
                  subtitle="Facultatif, mais les profils complets reçoivent des propositions plus pertinentes."
                />
                <div className="space-y-7">
                  <ChipGroup label="Années d'expérience">
                    {EXPERT_EXPERIENCE_OPTIONS.map((opt) => (
                      <SelectChip
                        key={opt}
                        label={opt}
                        selected={profile.yearsExperience === opt}
                        onToggle={() =>
                          setProfilePatch({ yearsExperience: profile.yearsExperience === opt ? "" : opt })
                        }
                      />
                    ))}
                  </ChipGroup>
                  <ChipGroup label="Zones géographiques">
                    {EXPERT_GEOGRAPHIC_ZONES.map((z) => (
                      <SelectChip
                        key={z}
                        label={z}
                        selected={profile.geographicZones.includes(z)}
                        onToggle={() => setProfilePatch({ geographicZones: toggleItem(profile.geographicZones, z) })}
                      />
                    ))}
                  </ChipGroup>
                  <ChipGroup label="Langues parlées">
                    {EXPERT_LANGUAGE_OPTIONS.map((lang) => (
                      <SelectChip
                        key={lang}
                        label={lang}
                        selected={profile.languages.includes(lang)}
                        onToggle={() => setProfilePatch({ languages: toggleItem(profile.languages, lang) })}
                      />
                    ))}
                  </ChipGroup>
                  <ChipGroup label="Disponibilités">
                    {EXPERT_AVAILABILITY_OPTIONS.map((opt) => (
                      <SelectChip
                        key={opt}
                        label={opt}
                        selected={profile.availabilities.includes(opt)}
                        onToggle={() => setProfilePatch({ availabilities: toggleItem(profile.availabilities, opt) })}
                      />
                    ))}
                  </ChipGroup>
                </div>
              </div>
            ) : null}

            {step === "certification" ? (
              <div className="space-y-8">
                <StepHeading
                  title="Boostez votre visibilité avec Byound Certified"
                  subtitle="Un parcours optionnel pour faire reconnaître votre posture de formateur."
                />
                <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#7C83FF]/25 via-[#1a1f4d]/60 to-[#0f1533]/60 p-6">
                  <div className="space-y-5">
                    {[
                      { icon: BadgeCheck, title: "Priorité dans le matching", body: "Apparaissez en tête des recherches entreprises." },
                      { icon: BarChart3, title: "Outils de pilotage", body: "Suivez l'impact de vos interventions." },
                      { icon: Share2, title: "Open Badge certifiant", body: "Valorisez votre expertise sur LinkedIn." },
                    ].map(({ icon: Icon, title, body }) => (
                      <div key={title} className="flex items-start gap-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                          <Icon className="h-[18px] w-[18px] text-white" />
                        </span>
                        <div>
                          <p className="text-[15px] font-semibold text-white">{title}</p>
                          <p className="mt-0.5 text-sm text-white/55">{body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={wantsCertification}
                  onClick={() => setWantsCertification((v) => !v)}
                  className="flex w-full items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.05] px-5 py-4 text-left transition hover:bg-white/[0.08]"
                >
                  <span>
                    <span className="block text-[15px] font-medium text-white">Je veux suivre le parcours</span>
                    <span className="mt-0.5 block text-sm text-white/45">Vous pourrez le démarrer après validation.</span>
                  </span>
                  <span
                    className={cn(
                      "relative h-7 w-12 shrink-0 rounded-full transition-colors",
                      wantsCertification ? "bg-[#7C83FF]" : "bg-white/15",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all",
                        wantsCertification ? "left-6" : "left-1",
                      )}
                    />
                  </span>
                </button>
              </div>
            ) : null}

            {step === "review" ? (
              <div className="space-y-8">
                <StepHeading
                  title="Tout est prêt ?"
                  subtitle="Vérifiez vos informations avant d'envoyer votre candidature."
                />
                <div className="divide-y divide-white/[0.06] overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.04]">
                  {[
                    { id: "email" as const, label: "E-mail", value: email.trim() },
                    { id: "identity" as const, label: "Nom", value: `${firstName} ${lastName}`.trim() },
                    { id: "headline" as const, label: "Titre", value: headline.trim() || "Non renseigné" },
                    {
                      id: "domains" as const,
                      label: "Domaines",
                      value: selectedDomains.map((d) => d.label).join(", "),
                    },
                    {
                      id: "specialties" as const,
                      label: "Spécialités",
                      value: `${profile.specialtyKeys.length} sélectionnée${profile.specialtyKeys.length > 1 ? "s" : ""}`,
                    },
                    {
                      id: "formats" as const,
                      label: "Formats & public",
                      value: [...profile.formats, ...profile.audiences].join(", "),
                    },
                    {
                      id: "certification" as const,
                      label: "Byound Certified",
                      value: wantsCertification ? "Oui, je suis intéressé" : "Pas pour l'instant",
                    },
                  ].map((row) => (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => goTo(row.id)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-white/[0.04]"
                    >
                      <span className="min-w-0">
                        <span className="block text-xs text-white/40">{row.label}</span>
                        <span className="mt-0.5 block truncate text-[15px] font-medium text-white">{row.value}</span>
                      </span>
                      <span className="shrink-0 text-xs font-medium text-[#A9AEFF]">Modifier</span>
                    </button>
                  ))}
                </div>

                {submitError ? (
                  <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-100">
                    {submitError}
                  </div>
                ) : null}

                <p className="text-xs leading-relaxed text-white/40">
                  En envoyant votre candidature, vous acceptez que votre profil soit revu par l&apos;équipe Byound
                  avant publication.
                </p>
              </div>
            ) : null}
          </div>

          <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/[0.06] bg-[#070b1f]/85 backdrop-blur-xl lg:static lg:mt-12 lg:border-0 lg:bg-transparent lg:backdrop-blur-none">
            <div className="mx-auto flex max-w-xl flex-col gap-2 px-5 py-4 sm:px-8 lg:mx-0 lg:px-0 lg:py-0">
              <button
                type="submit"
                disabled={!canContinue || submitting}
                className={cn(
                  "inline-flex h-14 w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed",
                  isLast
                    ? "bg-[#7C83FF] text-white hover:bg-[#8D93FF] disabled:bg-[#7C83FF]/40"
                    : "bg-white text-[#070b1f] hover:bg-white/90 disabled:bg-white/15 disabled:text-white/40",
                )}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Envoi en cours…
                  </>
                ) : isLast ? (
                  "Envoyer ma candidature"
                ) : (
                  <>
                    Continuer
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </>
                )}
              </button>
              {isOptional ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="h-11 w-full rounded-full text-sm font-medium text-white/55 transition hover:text-white"
                >
                  Passer cette étape
                </button>
              ) : null}
            </div>
          </div>
        </form>

        <aside className="hidden lg:block">
          {showPreview ? (
            <ExpertProfilePreview
              identity={{ firstName, lastName, headline, photoUrl }}
              profile={profile}
              wantsCertification={wantsCertification}
              className="animate-in fade-in duration-500"
            />
          ) : (
            <div className="sticky top-8 space-y-3">
              {[
                { title: "Inscription en quelques minutes", body: "Un écran, une question. Vous pouvez revenir en arrière à tout moment." },
                { title: "Validation par l'équipe Byound", body: "Chaque dossier est revu avant publication dans le réseau." },
                { title: "Un espace expert dès aujourd'hui", body: "Accédez à votre cockpit pendant la validation." },
              ].map((item, i) => (
                <div key={item.title} className="flex gap-4 rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-[#070b1f]">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-white/50">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}

function RegisterSuccess({ email, firstName }: { email: string; firstName: string }) {
  const steps = [
    { label: "Candidature envoyée", done: true },
    { label: "Création de votre mot de passe", done: false, current: true },
    { label: "Vérification de votre dossier", done: false },
    { label: "Validation pédagogique", done: false },
    { label: "Publication dans le réseau Byound", done: false },
  ];

  return (
    <div className="min-h-screen text-white">
      <Backdrop />
      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-5 py-16">
        <div className="animate-in fade-in zoom-in-95 duration-500 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-[#070b1f] shadow-[0_0_80px_rgba(124,131,255,0.55)]">
            <Check className="h-9 w-9" strokeWidth={3} />
          </div>
          <h1 className="mt-8 text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.02em]">
            {firstName ? `Merci ${firstName}, c'est envoyé !` : "Candidature envoyée !"}
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-white/55">
            Nous venons d&apos;envoyer un lien à <span className="font-medium text-white">{email}</span> pour créer
            votre mot de passe.
          </p>
        </div>

        <ol className="mt-10 overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.04]">
          {steps.map((s, i) => (
            <li key={s.label} className="relative flex items-center gap-4 px-5 py-4">
              {i < steps.length - 1 ? (
                <span className="absolute left-[33px] top-[44px] h-[calc(100%-28px)] w-px bg-white/10" aria-hidden />
              ) : null}
              <span
                className={cn(
                  "relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                  s.done
                    ? "bg-white text-[#070b1f]"
                    : s.current
                      ? "border-2 border-[#7C83FF] bg-[#7C83FF]/20"
                      : "border border-white/15 bg-[#070b1f]",
                )}
              >
                {s.done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
              </span>
              <span className={cn("text-[15px]", s.done || s.current ? "font-medium text-white" : "text-white/45")}>
                {s.label}
              </span>
              {s.current ? (
                <span className="ml-auto rounded-full bg-[#7C83FF]/20 px-2.5 py-1 text-[11px] font-medium text-[#C9CCFF]">
                  À faire
                </span>
              ) : null}
            </li>
          ))}
        </ol>

        <div className="mt-8 flex items-start gap-3 rounded-2xl bg-white/[0.04] px-5 py-4 text-sm text-white/55">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-white/40" />
          <p>Rien reçu d&apos;ici quelques minutes ? Pensez à vérifier vos spams.</p>
        </div>

        <Link
          href="/"
          className="mt-6 inline-flex h-14 w-full items-center justify-center rounded-full bg-white text-[15px] font-semibold text-[#070b1f] transition hover:bg-white/90"
        >
          Retour à l&apos;accueil
        </Link>
      </main>
    </div>
  );
}
