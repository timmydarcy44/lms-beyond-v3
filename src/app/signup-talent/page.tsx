"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";

type ExperienceItem = { role: string; company: string };
type DiplomaItem = { title: string; school: string };

const contractOptions = ["CDI", "CDD", "Freelance", "Alternance", "Stage"];

const softSkillOptions = [
  "Rigueur",
  "Communication",
  "Esprit d'équipe",
  "Leadership",
  "Adaptabilite",
  "Organisation",
  "Creativite",
  "Empathie",
  "Resilience",
  "Autonomie",
];

const discQuestions = [
  { id: 1, label: "Je prefere agir vite", a: "Je decide rapidement", b: "J'observe avant d'agir", aColor: "red", bColor: "blue" },
  { id: 2, label: "En equipe, je suis plutot", a: "Moteur", b: "Federateur", aColor: "red", bColor: "yellow" },
  { id: 3, label: "Face au stress, je suis", a: "Stable", b: "Reactif", aColor: "green", bColor: "red" },
  { id: 4, label: "Je prefere", a: "Les details", b: "La vision globale", aColor: "blue", bColor: "yellow" },
  { id: 5, label: "Mon rythme est", a: "Rapide", b: "Regulier", aColor: "red", bColor: "green" },
  { id: 6, label: "Je recherche", a: "La securite", b: "L'innovation", aColor: "green", bColor: "yellow" },
  { id: 7, label: "Je communique", a: "Avec des faits", b: "Avec des emotions", aColor: "blue", bColor: "yellow" },
  { id: 8, label: "Je prefere", a: "Diriger", b: "Collaborer", aColor: "red", bColor: "green" },
  { id: 9, label: "Mon rapport au temps", a: "Planifie", b: "Flexible", aColor: "blue", bColor: "yellow" },
  { id: 10, label: "Je suis", a: "Determine", b: "Patient", aColor: "red", bColor: "green" },
  { id: 11, label: "Je prefere", a: "Structure", b: "Libertes", aColor: "blue", bColor: "yellow" },
  { id: 12, label: "Je gere mieux", a: "Conflits", b: "Consensus", aColor: "red", bColor: "green" },
];

export default function SignupTalentPage() {
  const router = useRouter();
  const supabase = useSupabase();
  const [currentStep, setCurrentStep] = useState(1);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  const [contractType, setContractType] = useState("Alternance");
  const [desiredTitle, setDesiredTitle] = useState("");
  const [city, setCity] = useState("");
  const [mobilityRadius, setMobilityRadius] = useState(30);

  const [experiences, setExperiences] = useState<ExperienceItem[]>([{ role: "", company: "" }]);
  const [diplomas, setDiplomas] = useState<DiplomaItem[]>([{ title: "", school: "" }]);
  const [openBadges, setOpenBadges] = useState<string[]>([""]);

  const [tjmMin, setTjmMin] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [gratificationMin, setGratificationMin] = useState("");
  const [availabilityDate, setAvailabilityDate] = useState("");
  const [alternanceRhythm, setAlternanceRhythm] = useState("");
  const [remotePreference, setRemotePreference] = useState("");

  const [discPhase, setDiscPhase] = useState<"intro" | "questions" | "results">("intro");
  const [discIndex, setDiscIndex] = useState(0);
  const [discAnswers, setDiscAnswers] = useState<Record<number, "A" | "B">>({});
  const [selectedSoftSkills, setSelectedSoftSkills] = useState<string[]>([]);
  const [animateBars, setAnimateBars] = useState(false);

  const progressPercent = Math.min(100, Math.round((currentStep / 6) * 100));
  const profileStrength = Math.min(100, currentStep * 15);

  const discScores = useMemo(() => {
    const scores = { red: 0, yellow: 0, green: 0, blue: 0 };
    discQuestions.forEach((q) => {
      const answer = discAnswers[q.id];
      if (!answer) return;
      const color = answer === "A" ? q.aColor : q.bColor;
      scores[color as keyof typeof scores] += 1;
    });
    return scores;
  }, [discAnswers]);

  const handleNext = () => {
    if (currentStep === 5 && discPhase !== "results") return;
    setCurrentStep((prev) => Math.min(6, prev + 1));
  };
  const handleBack = () => setCurrentStep((prev) => Math.max(1, prev - 1));

  const [completing, setCompleting] = useState(false);

  const handleCompleteOnboarding = async () => {
    if (!supabase) return;
    if (completing) return;
    setCompleting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) {
        alert("Erreur : Utilisateur non connecté");
        setCompleting(false);
        return;
      }

      const payload = {
        id: userData.user.id,
        first_name: "Test",
        last_name: "User",
      };

      console.log("Payload envoyé à Supabase:", payload);
      const { data, error } = await supabase.from("talent_profiles").upsert(payload, { onConflict: "id" });
      console.log("Réponse Supabase:", { data, error });
      if (error) {
        alert(`Erreur Supabase : ${error.message || "inconnue"}`);
        setCompleting(false);
        return;
      }
      window.location.assign("/dashboard/talent");
    } catch (error: any) {
      console.error("Erreur fatale :", error);
      alert(`Erreur : ${error?.message || "inconnue"}`);
    } finally {
      setCompleting(false);
    }
  };

  const compensationLabel =
    contractType === "Stage"
      ? "Gratification mensuelle souhaitee"
      : contractType === "Alternance"
        ? "Salaire mensuel souhaite"
        : contractType === "CDI" || contractType === "CDD"
          ? "Remuneration annuelle brute souhaitee"
          : "TJM souhaite";

  useEffect(() => {
    if (discPhase === "results") {
      setAnimateBars(false);
      const timeout = setTimeout(() => setAnimateBars(true), 50);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [discPhase]);

  const getAiAnalysisText = () => {
    const entries = [
      { key: "Rouge", value: discScores.red },
      { key: "Jaune", value: discScores.yellow },
      { key: "Vert", value: discScores.green },
      { key: "Bleu", value: discScores.blue },
    ];
    const dominant = entries.sort((a, b) => b.value - a.value)[0]?.key || "Equilibre";
    const map: Record<string, string> = {
      Rouge: "Vous privilegiez l'action, la vitesse de decision et l'impact direct sur les resultats.",
      Jaune: "Vous aimez convaincre, federer et insuffler de l'energie positive dans vos projets.",
      Vert: "Vous recherchez la stabilite, la fiabilite et un cadre clair pour performer durablement.",
      Bleu: "Vous excellez dans l'analyse, la structure et la rigueur dans l'execution.",
      Equilibre: "Votre profil est equilibre et adaptable a plusieurs environnements.",
    };
    return map[dominant] || map.Equilibre;
  };

  return (
    <main className="min-h-screen bg-white text-black">
      <section className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
        <div className="hidden lg:block">
          <img
            src="https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Center/header_entreprise%20(2).png"
            alt="Beyond Connect"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex flex-col gap-6 px-10 pb-12 pt-14">
          <header className="space-y-3">
            <p className="text-xs uppercase tracking-[0.4em] text-black/60">Beyond Connect · Talents</p>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Construisez votre profil talent</h1>
            <p className="text-sm text-black/70">
              Un parcours en 6 etapes pour consolider votre profil et optimiser vos opportunites.
            </p>
          </header>

          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_30px_80px_-60px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-black/50">
              <span>Etape {currentStep} / 6</span>
              <span>Force du profil {profileStrength}%</span>
            </div>
            <div className="mt-4 h-2 w-full rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-black transition-all" style={{ width: `${progressPercent}%` }} />
            </div>

            {currentStep === 1 && (
              <section className="mt-8 grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="text-black/70">Prenom</span>
                  <input className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-black/70">Nom</span>
                  <input className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-black/70">Email</span>
                  <input className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-black/70">Telephone</span>
                  <input className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </label>
                <label className="space-y-2 text-sm md:col-span-2">
                  <span className="text-black/70">LinkedIn</span>
                  <input className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} />
                </label>
              </section>
            )}

            {currentStep === 2 && (
              <section className="mt-8 grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="text-black/70">Type de contrat</span>
                  <select
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value)}
                  >
                    {contractOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-black/70">Titre souhaite</span>
                  <input className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" value={desiredTitle} onChange={(e) => setDesiredTitle(e.target.value)} />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-black/70">Ville</span>
                  <input className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" value={city} onChange={(e) => setCity(e.target.value)} />
                </label>
                <label className="space-y-2 text-sm md:col-span-2">
                  <span className="text-black/70">Rayon de mobilite: {mobilityRadius} km</span>
                  <input type="range" min={0} max={100} value={mobilityRadius} onChange={(e) => setMobilityRadius(Number(e.target.value))} className="w-full" />
                </label>
              </section>
            )}

            {currentStep === 3 && (
              <section className="mt-8 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Experiences</h3>
                    <button type="button" className="text-xs underline" onClick={() => setExperiences((prev) => [...prev, { role: "", company: "" }])}>Ajouter</button>
                  </div>
                  {experiences.map((item, index) => (
                    <div key={`exp-${index}`} className="grid gap-3 md:grid-cols-2">
                      <input className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholder="Poste" value={item.role} onChange={(e) => setExperiences((prev) => prev.map((entry, i) => (i === index ? { ...entry, role: e.target.value } : entry)))} />
                      <input className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholder="Entreprise" value={item.company} onChange={(e) => setExperiences((prev) => prev.map((entry, i) => (i === index ? { ...entry, company: e.target.value } : entry)))} />
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Diplomes</h3>
                    <button type="button" className="text-xs underline" onClick={() => setDiplomas((prev) => [...prev, { title: "", school: "" }])}>Ajouter</button>
                  </div>
                  {diplomas.map((item, index) => (
                    <div key={`dip-${index}`} className="grid gap-3 md:grid-cols-2">
                      <input className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholder="Diplome" value={item.title} onChange={(e) => setDiplomas((prev) => prev.map((entry, i) => (i === index ? { ...entry, title: e.target.value } : entry)))} />
                      <input className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholder="Etablissement" value={item.school} onChange={(e) => setDiplomas((prev) => prev.map((entry, i) => (i === index ? { ...entry, school: e.target.value } : entry)))} />
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Mes Open Badges</h3>
                    <button type="button" className="text-xs underline" onClick={() => setOpenBadges((prev) => [...prev, ""])}>Ajouter</button>
                  </div>
                  {openBadges.map((item, index) => (
                    <input key={`badge-${index}`} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholder="URL badge" value={item} onChange={(e) => setOpenBadges((prev) => prev.map((entry, i) => (i === index ? e.target.value : entry)))} />
                  ))}
                </div>
              </section>
            )}

            {currentStep === 4 && (
              <section className="mt-8 grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="text-black/70">{compensationLabel}</span>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                    value={
                      contractType === "Freelance"
                        ? tjmMin
                        : contractType === "CDI" || contractType === "CDD"
                          ? salaryMin
                          : gratificationMin
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      if (contractType === "Freelance") setTjmMin(value);
                      else if (contractType === "CDI" || contractType === "CDD") setSalaryMin(value);
                      else setGratificationMin(value);
                    }}
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-black/70">Date de disponibilite</span>
                  <input type="date" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" value={availabilityDate} onChange={(e) => setAvailabilityDate(e.target.value)} />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-black/70">Rythme d'alternance</span>
                  <input className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" value={alternanceRhythm} onChange={(e) => setAlternanceRhythm(e.target.value)} />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-black/70">Preference teletravail</span>
                  <input className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" value={remotePreference} onChange={(e) => setRemotePreference(e.target.value)} />
                </label>
              </section>
            )}

            {currentStep === 5 && (
              <section className="mt-8 space-y-6">
                {discPhase === "intro" && (
                  <div className="rounded-3xl border border-slate-200 p-6 text-center">
                    <h2 className="text-xl font-semibold">Pret a decouvrir votre ADN professionnel ?</h2>
                    <p className="mt-3 text-sm text-black/70">
                      Ce test de 2 minutes nous aide a vous proposer des missions ou vous excellerez. Soyez spontanee.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setDiscPhase("questions");
                        setDiscIndex(0);
                      }}
                      className="mt-6 rounded-full bg-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white"
                    >
                      Commencer le test
                    </button>
                  </div>
                )}

                {discPhase === "questions" && (
                  <div className="rounded-3xl border border-slate-200 p-6 transition-all duration-300">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-black/50">
                      <span>
                        Question {discIndex + 1} / {discQuestions.length}
                      </span>
                      <span>{Math.round(((discIndex + 1) / discQuestions.length) * 100)}%</span>
                    </div>
                    <div className="mt-4 h-1.5 w-full rounded-full bg-slate-100">
                      <div
                        className="h-1.5 rounded-full bg-black transition-all"
                        style={{ width: `${((discIndex + 1) / discQuestions.length) * 100}%` }}
                      />
                    </div>
                    <div className="mt-6 space-y-4">
                      <p className="text-sm font-semibold">{discQuestions[discIndex].label}</p>
                      <button
                        type="button"
                        onClick={() => {
                          const question = discQuestions[discIndex];
                          setDiscAnswers((prev) => ({ ...prev, [question.id]: "A" }));
                          if (discIndex + 1 >= discQuestions.length) {
                            setDiscPhase("results");
                          } else {
                            setDiscIndex((prev) => prev + 1);
                          }
                        }}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                      >
                        {discQuestions[discIndex].a}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const question = discQuestions[discIndex];
                          setDiscAnswers((prev) => ({ ...prev, [question.id]: "B" }));
                          if (discIndex + 1 >= discQuestions.length) {
                            setDiscPhase("results");
                          } else {
                            setDiscIndex((prev) => prev + 1);
                          }
                        }}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                      >
                        {discQuestions[discIndex].b}
                      </button>
                    </div>
                  </div>
                )}

                {discPhase === "results" && (
                  <div className="rounded-3xl border border-slate-200 p-6">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-black/60">
                      Resultats DISC
                    </h3>
                    <div className="mt-6 rounded-3xl bg-slate-50 p-4">
                      <div className="grid gap-4 md:grid-cols-4">
                        {([
                          { label: "Rouge", value: discScores.red, color: "bg-red-500" },
                          { label: "Jaune", value: discScores.yellow, color: "bg-yellow-400" },
                          { label: "Vert", value: discScores.green, color: "bg-green-500" },
                          { label: "Bleu", value: discScores.blue, color: "bg-blue-600" },
                        ] as const).map((item) => {
                          const percent = Math.round((item.value / discQuestions.length) * 100);
                          return (
                            <div key={item.label} className="flex flex-col items-center gap-2">
                              <div className="flex h-36 w-10 items-end rounded-full bg-slate-100">
                                <div
                                  className={`w-full rounded-t-full ${item.color} transition-all duration-700 ease-out`}
                                  style={{
                                    height: animateBars ? `${Math.max(10, (percent / 100) * 140)}px` : "4px",
                                  }}
                                />
                              </div>
                              <p className="text-[11px] font-semibold text-black/70">{item.label}</p>
                              <p className="text-[11px] text-black/50">{percent}%</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-black/70">
                      Votre couleur dominante met en avant votre style de travail principal. Nous l'utiliserons pour vous
                      proposer des missions ou vous excellerez.
                    </p>
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">
                        Votre ADN Professionnel selon Beyond AI
                      </p>
                      <p className="mt-2 text-sm text-black/70">{getAiAnalysisText()}</p>
                    </div>
                    <div className="mt-6 rounded-3xl border border-black/10 bg-white p-5 shadow-[0_20px_40px_-30px_rgba(0,0,0,0.3)]">
                      <h3 className="text-lg font-semibold">Certifiez vos Soft Skills avec Beyond AI (50€)</h3>
                      <p className="mt-2 text-sm text-black/70">
                        Cette certification augmente votre matching de 300% et rassure les recruteurs.
                      </p>
                      <button type="button" className="mt-4 rounded-full bg-black px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                        Passer la certification
                      </button>
                    </div>
                    <div className="mt-6 flex justify-center">
                      <button
                        type="button"
                        onClick={handleCompleteOnboarding}
                        disabled={Object.keys(discAnswers).length < discQuestions.length || completing}
                        className={`rounded-full bg-black px-8 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white ${
                          Object.keys(discAnswers).length < discQuestions.length || completing
                            ? "cursor-not-allowed opacity-40"
                            : ""
                        }`}
                      >
                        {completing ? "Enregistrement..." : "Acceder au dashboard"}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}

            <div className="mt-8 flex items-center justify-between">
              <button type="button" onClick={handleBack} className="text-xs font-semibold uppercase tracking-[0.2em] text-black/60">
                Retour
              </button>
              {currentStep < 6 ? (
                <button type="button" onClick={handleNext} className="rounded-full bg-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                  Continuer
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCompleteOnboarding}
                  disabled={completing}
                  className={`rounded-full bg-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white ${
                    completing ? "cursor-not-allowed opacity-40" : ""
                  }`}
                >
                  {completing ? "Enregistrement..." : "Terminer"}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
