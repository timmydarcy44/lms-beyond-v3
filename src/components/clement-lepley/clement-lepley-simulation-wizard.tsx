"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useRef, useState } from "react";

import {
  BUDGET_OPTIONS,
  COPPER,
  PROJECT_PROMPT_PLACEHOLDER,
  SF_PRO,
  type BudgetId,
} from "@/lib/clement-lepley/constants";

type WizardStep = "upload" | "budget" | "description" | "contact" | "result";

type SimulationResult = {
  simulationText: string;
  simulationImageUrl?: string | null;
  emailSent?: boolean;
};

export function ClementLepleySimulationWizard() {
  const [step, setStep] = useState<WizardStep>("upload");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [budget, setBudget] = useState<BudgetId | null>(null);
  const [description, setDescription] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Veuillez sélectionner une image (JPG, PNG…).");
      return;
    }
    setError(null);
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
      setStep("budget");
    };
    reader.readAsDataURL(file);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handlePhotoSelect(file);
  };

  const submitSimulation = async () => {
    if (!photoFile || !budget || !description.trim()) return;
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !city.trim()) {
      setError("Merci de renseigner tous les champs de contact.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("photo", photoFile);
      formData.append("budget", budget);
      formData.append("description", description.trim());
      formData.append("firstName", firstName.trim());
      formData.append("lastName", lastName.trim());
      formData.append("email", email.trim());
      formData.append("phone", phone.trim());
      formData.append("city", city.trim());

      const res = await fetch("/api/clement-lepley/simulation", {
        method: "POST",
        body: formData,
      });

      const data = (await res.json()) as SimulationResult & { error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? "Impossible de générer la simulation.");
      }

      setResult(data);
      setStep("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const resetWizard = () => {
    setStep("upload");
    setPhotoFile(null);
    setPhotoPreview(null);
    setBudget(null);
    setDescription("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setCity("");
    setResult(null);
    setError(null);
  };

  const stepVariants = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 },
  };

  return (
    <section id="simulation" className="bg-[#111111] px-6 py-24 lg:px-16">
      <div className="mx-auto max-w-3xl" style={{ fontFamily: SF_PRO }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: COPPER }}>
          Simulation
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
          Donnez vie à vos idées
        </h2>
        <p className="mt-4 text-base leading-relaxed text-white/65">
          Uploadez une photo de votre extérieur et décrivez votre projet. Nous vous proposons une
          première simulation personnalisée.
        </p>

        <div className="mt-12 min-h-[420px]">
          <AnimatePresence mode="wait">
            {step === "upload" ? (
              <motion.div
                key="upload"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.35 }}
              >
                <button
                  type="button"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="group flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/20 bg-white/[0.03] px-8 py-20 transition hover:border-white/40 hover:bg-white/[0.06]"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M12 16V8M12 8L9 11M12 8L15 11"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M4 16V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V16"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <p className="mt-6 text-lg font-medium text-white">
                    Cliquez ou déposez votre photo ici
                  </p>
                  <p className="mt-2 text-sm text-white/50">JPG, PNG — extérieur, jardin, terrasse…</p>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoSelect(file);
                  }}
                />
              </motion.div>
            ) : null}

            {step === "budget" ? (
              <motion.div
                key="budget"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.35 }}
              >
                {photoPreview ? (
                  <div className="mb-8 overflow-hidden rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoPreview} alt="Votre extérieur" className="h-48 w-full object-cover" />
                  </div>
                ) : null}
                <p className="text-xl font-semibold text-white">Quel est votre budget ?</p>
                <div className="mt-6 space-y-3">
                  {BUDGET_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setBudget(opt.id);
                        setStep("description");
                      }}
                      className={`block w-full rounded-sm border px-5 py-4 text-left text-sm transition ${
                        budget === opt.id
                          ? "border-white bg-white text-black"
                          : "border-white/20 text-white hover:border-white/50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : null}

            {step === "description" ? (
              <motion.div
                key="description"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.35 }}
              >
                <p className="text-xl font-semibold text-white">Décrivez votre projet</p>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={PROJECT_PROMPT_PLACEHOLDER}
                  rows={6}
                  className="mt-6 w-full resize-none rounded-sm border border-white/20 bg-white/5 px-4 py-4 text-sm text-white placeholder:text-white/35 focus:border-white/50 focus:outline-none"
                />
                <button
                  type="button"
                  disabled={description.trim().length < 10}
                  onClick={() => setStep("contact")}
                  className="mt-6 rounded-sm bg-white px-7 py-3.5 text-sm font-semibold text-black transition enabled:hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Voir ma simulation
                </button>
              </motion.div>
            ) : null}

            {step === "contact" ? (
              <motion.div
                key="contact"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.35 }}
              >
                <p className="text-xl font-semibold text-white">
                  Dernière étape — recevez votre simulation
                </p>
                <p className="mt-2 text-sm text-white/60">
                  Renseignez vos coordonnées pour voir le résultat et le recevoir par e-mail.
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Prénom"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="rounded-sm border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-white/50 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Nom"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="rounded-sm border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-white/50 focus:outline-none"
                  />
                  <input
                    type="email"
                    placeholder="Adresse e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-sm border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-white/50 focus:outline-none sm:col-span-2"
                  />
                  <input
                    type="tel"
                    placeholder="Téléphone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="rounded-sm border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-white/50 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Ville"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="rounded-sm border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-white/50 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  disabled={loading}
                  onClick={submitSimulation}
                  className="mt-8 flex items-center gap-2 rounded-sm bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                      Génération en cours…
                    </>
                  ) : (
                    "Voir ma simulation"
                  )}
                </button>
              </motion.div>
            ) : null}

            {step === "result" && result ? (
              <motion.div
                key="result"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.35 }}
              >
                <p className="text-xl font-semibold text-white">Votre simulation</p>
                {result.simulationImageUrl ? (
                  <div className="mt-6 overflow-hidden rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={result.simulationImageUrl}
                      alt="Simulation de votre extérieur"
                      className="h-auto w-full object-cover"
                    />
                  </div>
                ) : null}
                <div className="mt-6 whitespace-pre-wrap rounded-lg bg-white/5 p-6 text-sm leading-relaxed text-white/85">
                  {result.simulationText}
                </div>
                {result.emailSent ? (
                  <p className="mt-4 text-sm text-white/55">
                    Un récapitulatif vous a été envoyé par e-mail.
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={resetWizard}
                  className="mt-8 text-sm font-medium underline underline-offset-4 text-white/70 hover:text-white"
                >
                  Nouvelle simulation
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
        </div>
      </div>
    </section>
  );
}

export function scrollToSimulation() {
  document.getElementById("simulation")?.scrollIntoView({ behavior: "smooth" });
}
