"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";

const jobOptions = ["Commercial", "Communication", "Marketing", "Événementiel", "Digital", "Ressources humaines"];
const softSkillsOptions = [
  "Leadership",
  "Adaptabilité",
  "Organisation",
  "Communication",
  "Esprit d'équipe",
  "Créativité",
  "Résilience",
  "Autonomie",
  "Négociation",
  "Orientation résultats",
  "Empathie",
  "Rigueur",
];

const offerModes = [
  { id: "manual", label: "Créer de zéro" },
  { id: "ai", label: "Créer avec Beyond AI" },
  { id: "pdf", label: "Déposer un PDF" },
] as const;

type OfferMode = (typeof offerModes)[number]["id"];

export default function CreerEspacePage() {
  const router = useRouter();
  const supabase = useSupabase();
  const [step, setStep] = useState(1);
  const [offerMode, setOfferMode] = useState<OfferMode | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiCulture, setAiCulture] = useState("");
  const [aiCity, setAiCity] = useState("");
  const [aiSalary, setAiSalary] = useState("");
  const [startDate, setStartDate] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactFirstName, setContactFirstName] = useState("");
  const [contactLastName, setContactLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [autonomy, setAutonomy] = useState("");
  const [acceptsAtypical, setAcceptsAtypical] = useState(false);
  const [showAiPreview, setShowAiPreview] = useState(false);
  const [aiOfferDraft, setAiOfferDraft] = useState(
    "Titre : Commercial B2B - Alternance\n\nMissions :\n- Prospection et qualification de leads\n- Prise de rendez-vous et suivi du pipe\n- Participation aux propositions commerciales\n\nProfil :\n- Excellent relationnel, rigueur, autonomie\n- Orientation résultats\n"
  );
  const [validatedOfferText, setValidatedOfferText] = useState<string | null>(null);
  const [validatedOfferTitle, setValidatedOfferTitle] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const calendarLink = "https://calendly.com/";

  const isOfferStepValid = offerMode !== null;
  const isSkillsStepValid = selectedSkills.length >= 4;
  const isStep1Valid =
    Boolean(
      startDate &&
        companyName &&
        contactFirstName &&
        contactLastName &&
        email &&
        phone &&
        role &&
        password &&
        passwordConfirm
    ) && password === passwordConfirm;

  const stepTitle = useMemo(() => {
    if (step === 1) return "Coordonnées";
    if (step === 2) return "Offre";
    if (step === 3) return "Soft skills";
    return "Confirmation";
  }, [step]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) => {
      if (prev.includes(skill)) {
        return prev.filter((item) => item !== skill);
      }
      if (prev.length >= 5) {
        return prev;
      }
      return [...prev, skill];
    });
  };

  const submitOfferRequest = async () => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      if (!supabase) {
        throw new Error("Supabase non configuré.");
      }
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role: "entreprise" } },
      });
      if (signupError) {
        throw signupError;
      } else if (signupData?.user) {
        const userId = signupData.user.id;

        const { error: profileError } = await supabase.from("profiles").insert({
          id: userId,
          email,
          first_name: contactFirstName,
          last_name: contactLastName,
          phone,
          role: "entreprise",
        });
        if (profileError) {
          console.error("Erreur Supabase profiles:", profileError.message, (profileError as any).details);
          throw profileError;
        }

        const { error: companyError } = await supabase.from("beyond_connect_companies").insert({
          id: userId,
          name: companyName,
          city: aiCity || "",
          website: "",
        });
        if (companyError) {
          console.error("Erreur Supabase companies:", companyError.message, (companyError as any).details);
          throw companyError;
        }

        const offerText = validatedOfferText || aiOfferDraft;
        const titleMatch = offerText.match(/Titre\s*:\s*(.+)/i);
        const extractedTitle = titleMatch?.[1]?.trim() || "Offre sans titre";
        const title = validatedOfferTitle || extractedTitle;
        const description = offerText.replace(/Titre\s*:\s*.+/i, "").trim();
        const salaryRange = aiSalary ? String(aiSalary) : null;
        const experienceLevel = autonomy || "";
        const offerPayload = {
          company_id: userId,
          title,
          description,
          city: aiCity || "",
          salary_range: salaryRange,
          contract_type: "Apprentissage",
          experience_level: experienceLevel,
          required_soft_skills: selectedSkills,
          status: "active",
        };
        const { error: offerError } = await supabase.from("job_offers").insert(offerPayload);
        if (offerError) {
          console.error("Erreur Supabase job_offers:", offerError.message, (offerError as any).details);
          throw offerError;
        }

        setSignupSuccess(true);
        router.push("/dashboard/entreprise");
      }

      const response = await fetch("/api/beyond-connect/job-offers/submit-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_date: startDate,
          company_name: companyName,
          contact_first_name: contactFirstName,
          contact_last_name: contactLastName,
          email,
          phone,
          role,
          autonomy,
          accepts_atypical: acceptsAtypical,
          offer_mode: offerMode,
          ai_prompt: aiPrompt,
          ai_culture: aiCulture,
          ai_city: aiCity,
          ai_salary: aiSalary,
          offer_text: offerMode === "ai" ? (validatedOfferText || aiOfferDraft) : null,
          soft_skills: selectedSkills,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Erreur lors de l'envoi.");
      }

      setStep(4);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Erreur lors de l'envoi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateAiOffer = async () => {
    setAiError(null);
    setIsGenerating(true);
    try {
      const response = await fetch("/api/beyond-connect/job-offers/generate-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          culture: aiCulture,
          city: aiCity,
          salary: aiSalary,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Erreur lors de la génération.");
      }
      setAiOfferDraft(data?.result || aiOfferDraft);
      setShowAiPreview(true);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Erreur lors de la génération.");
      setShowAiPreview(true);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="min-h-screen">
        <section className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
          <div className="hidden lg:block">
            <img
              src="https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Center/header_entreprise%20(2).png"
              alt="Beyond Connect"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col gap-6 px-10 py-12">
            <header className="space-y-4">
              <p className="text-xs uppercase tracking-[0.4em] text-black/60">Beyond Connect · Entreprises</p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Créez votre espace entreprise et déposez une offre
              </h1>
              <p className="max-w-2xl text-base text-black/70">
                Un parcours simple, inspiré de Typeform, pour créer votre espace et structurer votre offre.
              </p>
            </header>
            <div className="space-y-3">
              <div className="flex gap-3">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className={`h-1 flex-1 rounded-full ${item <= step ? "bg-black" : "bg-black/10"}`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-black/50">
                <span>Étape {step} / 4</span>
                <span>{stepTitle}</span>
              </div>
            </div>

            {step === 1 && (
              <section className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium">Date de prise de poste souhaitée</label>
                  <select
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-black"
                    name="startDate"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    required
                  >
                    <option className="bg-white text-black" value="" disabled>
                      Sélectionner une date
                    </option>
                    <option className="bg-white text-black" value="immediate">
                      Immédiat
                    </option>
                    <option className="bg-white text-black" value="one-month">
                      Sous 1 mois
                    </option>
                    <option className="bg-white text-black" value="next-term">
                      Prochaine rentrée
                    </option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nom de l&apos;entreprise</label>
                  <input
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-black placeholder:text-black/40"
                    placeholder="Nom de votre entreprise"
                    type="text"
                    name="companyName"
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Prénom du contact</label>
                  <input
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-black placeholder:text-black/40"
                    placeholder="Prénom"
                    type="text"
                    name="contactFirstName"
                    value={contactFirstName}
                    onChange={(event) => setContactFirstName(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nom du contact</label>
                  <input
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-black placeholder:text-black/40"
                    placeholder="Nom"
                    type="text"
                    name="contactLastName"
                    value={contactLastName}
                    onChange={(event) => setContactLastName(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Adresse mail</label>
                  <input
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-black placeholder:text-black/40"
                    placeholder="contact@entreprise.com"
                    type="email"
                    name="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Téléphone</label>
                  <input
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-black placeholder:text-black/40"
                    placeholder="06 00 00 00 00"
                    type="tel"
                    name="phone"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mot de passe</label>
                  <input
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-black placeholder:text-black/40"
                    placeholder="Créer un mot de passe"
                    type="password"
                    name="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirmer le mot de passe</label>
                  <input
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-black placeholder:text-black/40"
                    placeholder="Confirmer le mot de passe"
                    type="password"
                    name="passwordConfirm"
                    value={passwordConfirm}
                    onChange={(event) => setPasswordConfirm(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium">Poste recherché</label>
                  <select
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-black"
                    name="role"
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    required
                  >
                    <option className="bg-white text-black" value="" disabled>
                      Sélectionner un poste
                    </option>
                    {jobOptions.map((option) => (
                      <option key={option} className="bg-white text-black" value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </section>
            )}

            {step === 2 && (
              <section className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Profil recherché</label>
                  <select
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-black"
                    name="autonomy"
                    value={autonomy}
                    onChange={(event) => setAutonomy(event.target.value)}
                    required
                  >
                    <option className="bg-white text-black" value="" disabled>
                      Niveau d&apos;autonomie attendu
                    </option>
                    <option className="bg-white text-black" value="junior">
                      Junior accompagné
                    </option>
                    <option className="bg-white text-black" value="autonome">
                      Autonome
                    </option>
                    <option className="bg-white text-black" value="high-performance">
                      Profil High Performance
                    </option>
                  </select>
                </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {offerModes.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => {
                      setOfferMode(mode.id);
                    }}
                    className={`rounded-2xl border px-4 py-5 text-left text-sm font-semibold transition ${
                      offerMode === mode.id
                        ? "border-black/80 bg-black/5"
                        : "border-black/10 bg-white hover:border-black/40"
                    }`}
                  >
                    <span
                      className={
                        mode.id === "ai"
                          ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent"
                          : ""
                      }
                    >
                      {mode.label}
                    </span>
                  </button>
                ))}
              </div>

              {offerMode === "manual" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rédiger l&apos;offre</label>
                  <textarea
                    className="min-h-[180px] w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-black placeholder:text-black/40"
                    placeholder="Décrivez les missions, objectifs et le contexte."
                  />
                </div>
              )}

              {offerMode === "ai" && (
                <div className="space-y-3 rounded-2xl bg-gradient-to-br from-[#1d1d1d] via-[#121212] to-black p-6 text-white">
                  <label className="text-sm font-medium">Prompt Beyond AI</label>
                  <textarea
                    className="min-h-[180px] w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/70"
                    placeholder="Ex : Rédige une offre d'alternance pour un poste commercial B2B à Rouen..."
                    value={aiPrompt}
                    onChange={(event) => setAiPrompt(event.target.value)}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Ville</label>
                      <input
                        className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/70"
                        placeholder="Ex : Rouen"
                        value={aiCity}
                        onChange={(event) => setAiCity(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Salaire</label>
                      <input
                        className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/70"
                        placeholder="Ex : 1200€ / mois"
                        value={aiSalary}
                        onChange={(event) => setAiSalary(event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Décrivez l&apos;ambiance de votre équipe ou la culture de votre entreprise en quelques mots
                    </label>
                    <select
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white"
                      value={aiCulture}
                      onChange={(event) => setAiCulture(event.target.value)}
                    >
                      <option className="bg-white text-black" value="">
                        Sélectionner une ambiance
                      </option>
                      <option className="bg-white text-black" value="Exigeant et orienté performance">
                        Exigeant et orienté performance
                      </option>
                      <option className="bg-white text-black" value="Bienveillant et collaboratif">
                        Bienveillant et collaboratif
                      </option>
                      <option className="bg-white text-black" value="Start-up agile">
                        Start-up agile
                      </option>
                      <option className="bg-white text-black" value="Corporate structuré">
                        Corporate structuré
                      </option>
                      <option className="bg-white text-black" value="Créatif et innovant">
                        Créatif et innovant
                      </option>
                    </select>
                  </div>
                  <button
                      type="button"
                      onClick={generateAiOffer}
                    className="rounded-full border border-white/30 px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
                      disabled={!aiPrompt.trim() || isGenerating}
                  >
                    {isGenerating ? "Génération..." : "Voir l&apos;offre générée"}
                  </button>
                </div>
              )}

              {offerMode === "pdf" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Déposer un PDF</label>
                  <input
                    type="file"
                    accept=".pdf"
                    className="w-full rounded-xl border border-dashed border-black/20 bg-white px-4 py-6 text-sm text-black/70"
                  />
                </div>
              )}
              </section>
            )}

            {step === 3 && (
              <section className="space-y-4">
              <p className="text-sm text-black/60">Sélectionnez 4 à 5 soft skills clés.</p>
              <div className="flex flex-wrap gap-3">
                {softSkillsOptions.map((skill) => {
                  const isActive = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        isActive
                          ? "border-black/80 bg-black/10 text-black"
                          : "border-black/10 text-black/70 hover:border-black/40"
                      }`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-black/50">{selectedSkills.length} / 5 sélectionnés</p>
                <label className="flex items-start gap-3 rounded-2xl border border-black/10 p-4 text-sm text-black/70">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4"
                    name="atypical"
                    checked={acceptsAtypical}
                    onChange={(event) => setAcceptsAtypical(event.target.checked)}
                  />
                  Nous sommes ouverts aux profils atypiques et à haute créativité (DYS, TDAH, etc.).
                </label>
              </section>
            )}

    {step === 4 && (
              <section className="space-y-6 rounded-2xl border border-black/10 bg-white/60 p-6">
                <h2 className="text-2xl font-semibold">Votre offre est en cours de préparation.</h2>
                <p className="text-sm text-black/70">
                  Merci ! Un conseiller Beyond vous recontacte pour finaliser la diffusion et lancer le matching.
                </p>
                {signupSuccess && (
                  <div className="rounded-2xl border border-black/10 bg-white px-5 py-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black">
                      VOTRE ESPACE EST PRÊT.
                    </p>
                    <button
                      type="button"
                      onClick={() => router.push("/dashboard/entreprise")}
                      className="mt-3 rounded-full bg-black px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
                    >
                      ACCÉDER AU DASHBOARD
                    </button>
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard/entreprise")}
                    className="rounded-full bg-black px-8 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white"
                  >
                    Gérer mes offres
                  </button>
                  <a
                    href={calendarLink}
                    className="rounded-full border border-black/20 px-8 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-black"
                  >
                    Prendre rendez-vous avec un conseiller
                  </a>
                </div>
              </section>
            )}

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => setStep((prev) => Math.max(1, prev - 1))}
                className="rounded-full border border-black/20 px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-black/70"
                disabled={step === 1}
              >
                Retour
              </button>
              {step < 4 && (
                <button
                  type="button"
                  onClick={() => {
                    if (step === 1) {
                      setStep(2);
                      return;
                    }
                    if (step === 2) {
                      setStep(3);
                      return;
                    }
                  }}
                  className="rounded-full bg-black px-8 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white"
                  disabled={
                    (step === 1 && !isStep1Valid) ||
                    (step === 2 && (!isOfferStepValid || (offerMode === "ai" && !aiPrompt.trim()))) ||
                    (step === 3 && !isSkillsStepValid)
                  }
                >
                  Continuer
                </button>
              )}
              {step === 3 && (
                <button
                  type="button"
                  onClick={submitOfferRequest}
                  className="rounded-full bg-black px-8 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white"
                  disabled={!isSkillsStepValid || isSubmitting}
                >
                  {isSubmitting ? "Envoi..." : "Créer mon espace"}
                </button>
              )}
              {step === 3 && (
                <p className="text-xs text-black/60">
                  Un conseiller Beyond vous recontacte sous 24h pour valider la diffusion de votre offre et lancer le
                  matching.
                </p>
              )}
              {submitError && (
                <p className="text-xs text-red-600">
                  {submitError}
                </p>
              )}
              <Link href="/beyond-connect" className="text-sm text-black/70 underline underline-offset-4">
                Déjà un compte ? Aller sur Beyond Connect
              </Link>
            </div>
          </div>
        </section>
      </div>
      {showAiPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-8 text-black shadow-[0_30px_80px_-60px_rgba(0,0,0,0.4)]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Prévisualisation de l&apos;offre</h2>
              <button
                type="button"
                onClick={() => setShowAiPreview(false)}
                className="text-xs uppercase tracking-[0.3em] text-black/60"
              >
                Fermer
              </button>
            </div>
            {aiError ? (
              <p className="mt-4 text-sm text-red-600">{aiError}</p>
            ) : (
              <>
                <p className="mt-2 text-sm text-black/60">
                  Vous pouvez modifier le texte avant validation.
                </p>
                <textarea
                  className="mt-4 min-h-[260px] w-full rounded-2xl border border-black/10 bg-white p-4 text-sm text-black"
                  value={aiOfferDraft}
                  onChange={(event) => setAiOfferDraft(event.target.value)}
                />
              </>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setShowAiPreview(false)}
                className="rounded-full border border-black/20 px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-black/70"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={() => {
                  const titleMatch = aiOfferDraft.match(/Titre\s*:\s*(.+)/i);
                  const extractedTitle = titleMatch?.[1]?.trim() || "Offre sans titre";
                  setValidatedOfferTitle(extractedTitle);
                  setValidatedOfferText(aiOfferDraft);
                  setShowAiPreview(false);
                }}
                className="rounded-full bg-black px-8 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white"
                disabled={!!aiError}
              >
                Je valide l&apos;offre
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
