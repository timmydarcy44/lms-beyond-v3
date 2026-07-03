"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BadgeCheck, BarChart3, ChevronLeft, ChevronRight, Loader2, Share2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { ExpertSpecialtiesStep } from "@/components/expert/register/expert-specialties-step";
import { ExpertProfilePreview } from "@/components/expert/register/expert-profile-preview";
import {
  buildSpecialtiesPayload,
  EMPTY_SPECIALTIES_PROFILE,
  isSpecialtiesStepComplete,
  type ExpertSpecialtiesProfile,
} from "@/lib/expert/specialties-referential";
import { EXPERT_REGISTER_GENERIC_ERROR } from "@/lib/expert/register-errors";

type StepKey = 1 | 2 | 3;

function StepPill({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium uppercase tracking-[0.14em]",
        done
          ? "border-[#635BFF]/30 bg-[#635BFF]/12 text-white"
          : active
            ? "border-[#635BFF]/35 bg-[#635BFF]/12 text-white"
            : "border-white/10 bg-white/5 text-white/50",
      )}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          done ? "bg-[#635BFF]" : active ? "bg-[#635BFF]" : "bg-white/25",
        )}
      />
      {label}
    </div>
  );
}

export default function ExpertRegisterPage() {
  const [step, setStep] = useState<StepKey>(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [headline, setHeadline] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  const [specialtiesProfile, setSpecialtiesProfile] =
    useState<ExpertSpecialtiesProfile>(EMPTY_SPECIALTIES_PROFILE);

  const [wantsCertification, setWantsCertification] = useState(false);

  const canNext = useMemo(() => {
    if (step === 1) return email.trim().length > 0 && firstName.trim().length > 0 && lastName.trim().length > 0;
    if (step === 2) return isSpecialtiesStepComplete(specialtiesProfile);
    return true;
  }, [email, firstName, lastName, specialtiesProfile, step]);

  const goNext = () => setStep((s) => (s === 3 ? 3 : ((s + 1) as StepKey)));
  const goBack = () => setStep((s) => (s === 1 ? 1 : ((s - 1) as StepKey)));

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitError(null);
    if (!email.trim() || !email.includes("@") || !firstName.trim() || !lastName.trim()) {
      toast.error("Veuillez compléter votre profil.");
      setStep(1);
      return;
    }
    if (!isSpecialtiesStepComplete(specialtiesProfile)) {
      toast.error("Veuillez compléter votre étape Spécialités.");
      setStep(2);
      return;
    }

    const payload = buildSpecialtiesPayload(specialtiesProfile);

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
          typeof out?.error === "string" && out.error.length > 0
            ? out.error
            : EXPERT_REGISTER_GENERIC_ERROR;
        setSubmitError(msg);
        throw new Error(msg);
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
    const workflowSteps = [
      { label: "Profil créé", done: true },
      { label: "Création du mot de passe", done: false },
      { label: "Vérification de votre dossier", done: false },
      { label: "Validation pédagogique", done: false },
      { label: "Publication dans le réseau EDGE", done: false },
    ];

    return (
      <div className="min-h-screen bg-[#050505] text-white">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[#050505]" />
          <div className="absolute -bottom-64 -left-64 h-[760px] w-[760px] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,91,255,0.2),transparent_60%)] blur-3xl" />
        </div>
        <main className="relative mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-16">
          <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-10 backdrop-blur-2xl">
            <div className="text-center">
              <div className="text-xs font-medium uppercase tracking-[0.2em] text-[#a8a3ff]">
                En attente de validation
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
                Bienvenue dans le réseau EDGE
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-sm text-white/60">
                Votre profil a bien été enregistré. Consultez votre boîte mail pour créer votre mot de passe et
                accéder à votre espace formateur restreint.
              </p>
            </div>

            <div className="mt-10 space-y-3">
              {workflowSteps.map((step, i) => (
                <div
                  key={step.label}
                  className={cn(
                    "flex items-center gap-4 rounded-2xl border px-5 py-4",
                    step.done
                      ? "border-[#635BFF]/25 bg-[#635BFF]/8"
                      : "border-white/8 bg-white/[0.02]",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      step.done ? "bg-[#635BFF] text-white" : "bg-white/5 text-white/35",
                    )}
                  >
                    {step.done ? "✓" : "○"}
                  </span>
                  <span
                    className={cn(
                      "text-sm",
                      step.done ? "font-medium text-white" : "text-white/50",
                    )}
                  >
                    {step.label}
                  </span>
                  {i === 0 ? (
                    <span className="ml-auto rounded-lg border border-[#635BFF]/25 bg-[#635BFF]/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#a8a3ff]">
                      Terminé
                    </span>
                  ) : null}
                </div>
              ))}
            </div>

            <p className="mt-8 text-center text-xs text-white/40">
              Vérifiez vos emails (et vos spams). Notre équipe examine ensuite votre dossier avant publication.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#050505]" />
        <div className="absolute -bottom-64 -left-64 h-[760px] w-[760px] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,91,255,0.18),transparent_60%)] blur-3xl" />
        <div className="absolute -top-64 -right-64 h-[680px] w-[680px] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,91,255,0.08),transparent_62%)] blur-3xl" />
      </div>

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
        <Link href="/" className="text-sm font-semibold tracking-[0.18em] text-white/80 hover:text-white">
          EDGE
        </Link>
        <div className="text-xs text-white/45">Réseau formateurs & experts</div>
      </header>

      <main className="relative mx-auto w-full max-w-6xl px-6 pb-20">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (step !== 3) {
                goNext();
                return;
              }
              handleSubmit();
            }}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-[0_18px_70px_rgba(0,0,0,0.4)] backdrop-blur-2xl"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/45">
                  Inscription expert
                </div>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                  Rejoignez le réseau EDGE
                </h1>
                <p className="mt-3 max-w-xl text-sm text-white/55">
                  Trois étapes pour construire un profil professionnel à la hauteur de votre expertise.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StepPill active={step === 1} done={step > 1} label="Identité" />
                <StepPill active={step === 2} done={step > 2} label="Spécialités" />
                <StepPill active={step === 3} done={false} label="Validation" />
              </div>
            </div>

            {submitError ? (
              <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100/90">
                {submitError}
              </div>
            ) : null}

            <div className="mt-8">
              {step === 1 ? (
                <div className="space-y-4">
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    type="email"
                    inputMode="email"
                    required
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#635BFF]/40"
                    autoComplete="email"
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Prénom"
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#635BFF]/40"
                      autoComplete="given-name"
                    />
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Nom"
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#635BFF]/40"
                      autoComplete="family-name"
                    />
                  </div>
                  <input
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="Titre professionnel (headline)"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#635BFF]/40"
                  />
                  <input
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="LinkedIn (URL)"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#635BFF]/40"
                  />
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/40">
                          Photo
                        </div>
                        <div className="mt-2 text-sm text-white/50">URL de votre photo professionnelle</div>
                      </div>
                      <UploadCloud className="h-5 w-5 text-white/30" aria-hidden />
                    </div>
                    <input
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      placeholder="https://..."
                      className="mt-4 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#635BFF]/40"
                    />
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <ExpertSpecialtiesStep value={specialtiesProfile} onChange={setSpecialtiesProfile} />
              ) : null}

              {step === 3 ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-[#635BFF]/20 bg-[#635BFF]/8 p-6">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border border-[#635BFF]/25 bg-[#635BFF]/10">
                        <BadgeCheck className="h-5 w-5 text-[#a8a3ff]" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white">
                          Certification EDGE — visibilité renforcée
                        </div>
                        <div className="mt-4 space-y-3 text-sm text-white/65">
                          <div className="flex items-start gap-3">
                            <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#635BFF]" />
                            <div>
                              <div className="font-medium text-white">Priorité dans le matching</div>
                              <div className="text-white/50">Apparaissez en tête des recherches entreprises.</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-[#635BFF]" />
                            <div>
                              <div className="font-medium text-white">Outils de pilotage</div>
                              <div className="text-white/50">Suivez l&apos;impact de vos interventions.</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Share2 className="mt-0.5 h-4 w-4 shrink-0 text-[#635BFF]" />
                            <div>
                              <div className="font-medium text-white">Open Badge certifiant</div>
                              <div className="text-white/50">Valorisez votre expertise sur LinkedIn.</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.05]">
                    <input
                      type="checkbox"
                      checked={wantsCertification}
                      onChange={(e) => setWantsCertification(e.target.checked)}
                      className="mt-1 h-4 w-4 accent-[#635BFF]"
                    />
                    <div>
                      <div className="text-sm font-medium text-white">
                        Je souhaite suivre le parcours de certification EDGE
                      </div>
                      <div className="mt-1 text-sm text-white/50">
                        Optionnel — recommandé pour maximiser votre visibilité dans le réseau.
                      </div>
                    </div>
                  </label>

                  <p className="text-xs text-white/35">
                    En soumettant, vous acceptez que votre profil soit revu par l&apos;équipe EDGE avant
                    publication.
                  </p>
                </div>
              ) : null}
            </div>

            <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={goBack}
                disabled={step === 1 || submitting}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-xs font-medium uppercase tracking-[0.12em] text-white/70 hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Retour
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canNext || submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-black hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Continuer
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#635BFF] px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-[#7B74FF] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Soumission...
                    </>
                  ) : (
                    "Soumettre ma candidature"
                  )}
                </button>
              )}
            </div>
          </form>

          <ExpertProfilePreview
            identity={{ firstName, lastName, headline, photoUrl }}
            profile={specialtiesProfile}
            wantsCertification={wantsCertification}
            className="hidden lg:block"
          />
        </div>

        <div className="mt-8 lg:hidden">
          <ExpertProfilePreview
            identity={{ firstName, lastName, headline, photoUrl }}
            profile={specialtiesProfile}
            wantsCertification={wantsCertification}
          />
        </div>
      </main>
    </div>
  );
}
