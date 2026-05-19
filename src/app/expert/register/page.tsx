"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { BadgeCheck, BarChart3, ChevronLeft, ChevronRight, Loader2, Share2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

type StepKey = 1 | 2 | 3;

const SPECIALTIES = ["Management", "Stress", "Tech", "Leadership", "Cohésion d'équipe", "Communication"] as const;

const FORMATS_SUPPORTED = ["Visio", "Présentiel", "Individuel", "Collectif"] as const;

function StepPill({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em]",
        done
          ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100/90"
          : active
            ? "border-violet-400/30 bg-violet-500/15 text-violet-100"
            : "border-white/10 bg-white/5 text-white/60",
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", done ? "bg-emerald-400" : active ? "bg-violet-400" : "bg-white/25")} />
      {label}
    </div>
  );
}

export default function ExpertRegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState<StepKey>(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Step 1 (Identité)
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [headline, setHeadline] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  // Step 2 (Expertises)
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [formatsSupported, setFormatsSupported] = useState<string[]>([]);

  // Step 3 (Engagement)
  const [wantsBeyondCertified, setWantsBeyondCertified] = useState(false);

  const previewName = useMemo(() => {
    const full = `${firstName} ${lastName}`.trim();
    return full || "Votre profil";
  }, [firstName, lastName]);

  const canNext = useMemo(() => {
    if (step === 1) return email.trim().length > 0 && firstName.trim().length > 0 && lastName.trim().length > 0;
    if (step === 2) return specialties.length > 0 && formatsSupported.length > 0;
    return true;
  }, [formatsSupported.length, specialties.length, email, firstName, lastName, step]);

  const goNext = () => setStep((s) => (s === 3 ? 3 : ((s + 1) as StepKey)));
  const goBack = () => setStep((s) => (s === 1 ? 1 : ((s - 1) as StepKey)));

  const toggle = (arr: string[], value: string) => (arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value]);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitError(null);
    if (!email.trim() || !email.includes("@") || !firstName.trim() || !lastName.trim()) {
      toast.error("Veuillez compléter votre profil.");
      setStep(1);
      return;
    }
    if (specialties.length === 0 || formatsSupported.length === 0) {
      toast.error("Veuillez sélectionner vos expertises et formats supportés.");
      setStep(2);
      return;
    }

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
          specialties,
          formats_supported: formatsSupported,
          wants_certification: wantsBeyondCertified,
        }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = out?.error || "Erreur serveur lors de l’envoi de votre candidature.";
        setSubmitError(String(msg));
        throw new Error(String(msg));
      }
      setSubmitted(true);
    } catch (e: any) {
      toast.error(e?.message || "Impossible de soumettre votre profil. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#05060a] text-white">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[#05060a]" />
          <div className="absolute -bottom-64 -left-64 h-[760px] w-[760px] rounded-full bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.34),rgba(99,102,241,0.14),rgba(2,6,23,0)_60%)] blur-3xl" />
          <div className="absolute -top-64 -right-64 h-[680px] w-[680px] rounded-full bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.16),rgba(2,6,23,0)_62%)] blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),rgba(255,255,255,0))]" />
        </div>

        <main className="relative mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-16">
          <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-2xl">
            <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200/90">Candidature reçue</div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white">Candidature reçue !</h1>
            <p className="mx-auto mt-4 max-w-xl text-sm text-white/70">
              Vérifiez vos emails. Votre profil est en cours de validation par nos équipes.
            </p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-8 inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-extrabold text-black hover:bg-white/90"
            >
              Retour à l’accueil
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05060a] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#05060a]" />
        <div className="absolute -bottom-64 -left-64 h-[760px] w-[760px] rounded-full bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.34),rgba(99,102,241,0.14),rgba(2,6,23,0)_60%)] blur-3xl" />
        <div className="absolute -top-64 -right-64 h-[680px] w-[680px] rounded-full bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.16),rgba(2,6,23,0)_62%)] blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),rgba(255,255,255,0))]" />
      </div>

      <header className="relative mx-auto flex max-w-5xl items-center justify-between px-6 py-8">
        <Link href="/" className="text-sm font-black uppercase tracking-[0.22em] text-white/80 hover:text-white">
          Beyond
        </Link>
        <div className="text-xs font-semibold text-white/60">Join the Network</div>
      </header>

      <main className="relative mx-auto w-full max-w-5xl px-6 pb-20">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (step !== 3) {
                goNext();
                return;
              }
              handleSubmit();
            }}
            className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_18px_70px_rgba(0,0,0,0.40)] backdrop-blur-2xl"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.22em] text-white/55">Inscription expert</div>
                <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">Rejoignez le réseau Beyond</h1>
                <p className="mt-3 max-w-xl text-sm text-white/70">
                  Un onboarding en 3 étapes, conçu pour la qualité et la performance.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StepPill active={step === 1} done={step > 1} label="Identité" />
                <StepPill active={step === 2} done={step > 2} label="Expertises" />
                <StepPill active={step === 3} done={false} label="Engagement" />
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
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-violet-400/30"
                    autoComplete="email"
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Prénom"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-violet-400/30"
                      autoComplete="given-name"
                    />
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Nom"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-violet-400/30"
                      autoComplete="family-name"
                    />
                  </div>
                  <input
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="Titre (Headline)"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-violet-400/30"
                  />
                  <input
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="LinkedIn (URL)"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-violet-400/30"
                  />
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-black uppercase tracking-[0.22em] text-white/55">Photo</div>
                        <div className="mt-2 text-sm text-white/70">URL d’image (pour la démo) + aperçu.</div>
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70">
                        <UploadCloud className="h-4 w-4" aria-hidden />
                        Photo
                      </div>
                    </div>
                    <input
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      placeholder="https://..."
                      className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-violet-400/30"
                    />
                    <div className="mt-4 flex items-center gap-4">
                      <div className="h-14 w-14 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {photoUrl.trim() ? <img src={photoUrl.trim()} alt="" className="h-full w-full object-cover" /> : null}
                      </div>
                      <div className="text-sm font-semibold text-white/80">{previewName}</div>
                    </div>
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-8">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-white/55">Spécialités</div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {SPECIALTIES.map((s) => {
                        const checked = specialties.includes(s);
                        return (
                          <label
                            key={s}
                            className={cn(
                              "flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 text-sm",
                              checked ? "border-violet-400/30 bg-violet-500/10" : "border-white/10 bg-white/5 hover:bg-white/10",
                            )}
                          >
                            <span className="font-semibold text-white/85">{s}</span>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => setSpecialties((a) => toggle(a, s))}
                              className="h-4 w-4 accent-violet-400"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-white/55">Formats supportés</div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {FORMATS_SUPPORTED.map((f) => {
                        const checked = formatsSupported.includes(f);
                        return (
                          <label
                            key={f}
                            className={cn(
                              "flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 text-sm",
                              checked ? "border-violet-400/30 bg-violet-500/10" : "border-white/10 bg-white/5 hover:bg-white/10",
                            )}
                          >
                            <span className="font-semibold text-white/85">{f}</span>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => setFormatsSupported((a) => toggle(a, f))}
                              className="h-4 w-4 accent-violet-400"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-4">
                  <div className="mt-6 rounded-3xl border border-violet-400/20 bg-violet-500/10 p-6">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border border-violet-400/25 bg-violet-500/10">
                        <BadgeCheck className="h-5 w-5 text-violet-200" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-extrabold tracking-tight text-white">
                          Pourquoi devenir Beyond Certified ?
                        </div>
                        <div className="mt-4 space-y-3 text-sm text-white/75">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                              <BadgeCheck className="h-4 w-4 text-violet-200" aria-hidden />
                            </div>
                            <div className="min-w-0">
                              <div className="font-extrabold text-white">Visibilité Boostée</div>
                              <div className="text-white/65">Apparaissez en priorité lors du matching RH.</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                              <BarChart3 className="h-4 w-4 text-cyan-200" aria-hidden />
                            </div>
                            <div className="min-w-0">
                              <div className="font-extrabold text-white">Outils Avancés</div>
                              <div className="text-white/65">
                                Utilisez nos KPIs propriétaires dans vos propres rapports de formation.
                              </div>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                              <Share2 className="h-4 w-4 text-indigo-200" aria-hidden />
                            </div>
                            <div className="min-w-0">
                              <div className="font-extrabold text-white">Open Badge</div>
                              <div className="text-white/65">
                                Un certificat numérique certifié pour votre LinkedIn.
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/55">
                            Contenu de la formation
                          </div>
                          <ul className="mt-3 space-y-2 text-sm text-white/70">
                            <li>
                              <span className="font-extrabold text-white">Module 1 :</span> Maîtrise des signaux faibles
                              Beyond.
                            </li>
                            <li>
                              <span className="font-extrabold text-white">Module 2 :</span> Posture de l'expert en
                              environnement complexe.
                            </li>
                            <li>
                              <span className="font-extrabold text-white">Module 3 :</span> Mesure d'impact et ROI
                              pédagogique.
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <label className="mt-2 flex cursor-pointer items-start gap-3 rounded-3xl border border-white/10 bg-white/5 p-5 hover:bg-white/10">
                    <input
                      type="checkbox"
                      checked={wantsBeyondCertified}
                      onChange={(e) => setWantsBeyondCertified(e.target.checked)}
                      className="mt-1 h-4 w-4 accent-violet-400"
                    />
                    <div>
                      <div className="text-sm font-extrabold tracking-tight text-white">
                        Je souhaite suivre le parcours Beyond Certified pour maximiser ma visibilité.
                      </div>
                      <div className="mt-1 text-sm text-white/70">
                        Inscription → Formation Beyond → Certification (badge).
                      </div>
                      {wantsBeyondCertified ? (
                        <div className="mt-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-100/90">
                          Excellent choix ! Vous recevrez les accès au module de formation dès la validation de votre profil.
                        </div>
                      ) : null}
                    </div>
                  </label>
                </div>
              ) : null}
            </div>

            <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={goBack}
                disabled={step === 1 || submitting}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white/80 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Retour
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canNext || submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-black hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Continuer
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-white shadow-[0_0_30px_rgba(99,102,241,0.30)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Soumission...
                    </>
                  ) : (
                    "Soumettre"
                  )}
                </button>
              )}
            </div>
          </form>

          <aside className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-2xl">
            <div className="text-xs font-black uppercase tracking-[0.22em] text-white/55">Aperçu</div>
            <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="text-lg font-extrabold tracking-tight text-white">{previewName}</div>
              <div className="mt-2 text-sm font-semibold text-white/70">
                {headline.trim() || specialties[0] || "Headline / expertise"}
              </div>
              <div className="mt-4 text-sm text-white/60">
                {wantsBeyondCertified
                  ? "Parcours Beyond Certified demandé (visibilité maximisée après certification)."
                  : "Parcours Beyond Certified optionnel (recommandé pour la visibilité)."}
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {(specialties.length ? specialties : ["Spécialité"]).slice(0, 3).map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white/70"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="text-xs font-black uppercase tracking-[0.22em] text-white/55">Qualité</div>
              <p className="mt-3 text-sm text-white/70">
                Tous les profils passent en validation. Le badge “Beyond Certified” est attribué après formation.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

