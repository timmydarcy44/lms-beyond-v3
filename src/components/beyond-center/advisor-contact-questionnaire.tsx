"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const blue = "#006CFF";
const TOTAL_STEPS = 5;

const cursusOptions = ["Titre Professionnel RPMC", "Titre Professionnel NTC", "Certification Beyond Care", "Certification Beyond Play", "Certification Beyond Note"];

const optionExtras = [
  "Accompagnement individuel",
  "Open badges & traçabilité",
  "Immersions en entreprise",
  "Suivi soft skills",
];

const financingOptions = [
  { id: "autofinancement", label: "Autofinancement" },
  { id: "alternance", label: "Alternance" },
  { id: "beyond_invest", label: "Beyond Invest", sub: "financement personnalisé by Beyond" },
];

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cursus: string[];
  options: string[];
  financing: string;
};

const initialState: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  cursus: [],
  options: [],
  financing: "",
};

export function AdvisorContactQuestionnaire() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const progress = useMemo(() => (currentStep / TOTAL_STEPS) * 100, [currentStep]);

  const toggleValue = (field: "cursus" | "options", value: string) => {
    setFormData((prev) => {
      const current = prev[field];
      return {
        ...prev,
        [field]: current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
      };
    });
  };

  const canProceed = () => {
    if (submitted) return false;
    switch (currentStep) {
      case 1:
        return formData.firstName.trim() !== "" && formData.lastName.trim() !== "";
      case 2:
        return formData.email.trim() !== "" && formData.phone.trim() !== "";
      case 3:
        return formData.cursus.length > 0;
      case 4:
        return formData.options.length > 0;
      case 5:
        return formData.financing.trim() !== "";
      default:
        return false;
    }
  };

  const handleContinue = () => {
    if (!canProceed()) return;
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((step) => step + 1);
    } else {
      void handleSubmit();
    }
  };

  const handleBack = () => {
    if (isSubmitting || submitted) return;
    if (currentStep <= 1) return;
    setCurrentStep((step) => Math.max(step - 1, 1));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // TODO: route backend (Supabase / email). For now, logging for team usage.
      console.log("[advisor-contact] submission", formData);
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderNavigation = () => (
    <div className="mt-10 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
      <Button
        type="button"
        variant="ghost"
        disabled={submitted || currentStep === 1}
        onClick={handleBack}
        className="justify-center sm:justify-start text-white/70 hover:text-white hover:bg-white/10"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Retour
      </Button>
      <Button
        type="button"
        className="rounded-full px-8 py-6 text-base font-light transition-all duration-300 hover:scale-[1.02]"
        style={{ backgroundColor: submitted ? "#1F2937" : blue, color: "#FFFFFF" }}
        onClick={handleContinue}
        disabled={!canProceed() || isSubmitting}
      >
        {currentStep < TOTAL_STEPS ? "Continuer" : "Envoyer ma demande"}
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl sm:text-4xl font-light text-white">
                Commençons par faire connaissance.
              </h2>
              <p className="mt-2 text-white/70">
                Indique ton prénom et ton nom comme tu souhaites qu’on s’adresse à toi.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                placeholder="Prénom"
                value={formData.firstName}
                onChange={(event) => setFormData((prev) => ({ ...prev, firstName: event.target.value }))}
                className="border-white/20 bg-white/10 text-white placeholder:text-white/50"
              />
              <Input
                placeholder="Nom"
                value={formData.lastName}
                onChange={(event) => setFormData((prev) => ({ ...prev, lastName: event.target.value }))}
                className="border-white/20 bg-white/10 text-white placeholder:text-white/50"
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl sm:text-4xl font-light text-white">Comment te recontacter ?</h2>
              <p className="mt-2 text-white/70">
                Nous te renverrons une synthèse et te proposerons un créneau avec un conseiller.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                type="email"
                placeholder="Adresse e-mail"
                value={formData.email}
                onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                className="border-white/20 bg-white/10 text-white placeholder:text-white/50"
              />
              <Input
                type="tel"
                placeholder="Téléphone"
                value={formData.phone}
                onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))}
                className="border-white/20 bg-white/10 text-white placeholder:text-white/50"
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl sm:text-4xl font-light text-white">
                Quel parcours t’intéresse ?
              </h2>
              <p className="mt-2 text-white/70">
                Sélectionne le ou les titres / certifications qui te correspondent.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {cursusOptions.map((cursus) => {
                const isActive = formData.cursus.includes(cursus);
                return (
                  <motion.button
                    key={cursus}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleValue("cursus", cursus)}
                    className={`rounded-2xl border-2 px-4 py-5 text-left transition-all ${
                      isActive
                        ? "border-white bg-white text-black"
                        : "border-white/20 bg-white/5 text-white hover:border-white/40"
                    }`}
                  >
                    <span className="font-light">{cursus}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl sm:text-4xl font-light text-white">
                Quelles options souhaites-tu activer ?
              </h2>
              <p className="mt-2 text-white/70">
                Choisis les services complémentaires utiles à ton parcours.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {optionExtras.map((option) => {
                const isActive = formData.options.includes(option);
                return (
                  <motion.button
                    key={option}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleValue("options", option)}
                    className={`rounded-2xl border-2 px-4 py-5 text-left transition-all ${
                      isActive
                        ? "border-white bg-white text-black"
                        : "border-white/20 bg-white/5 text-white hover:border-white/40"
                    }`}
                  >
                    <span className="font-light">{option}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl sm:text-4xl font-light text-white">
                Comment envisages-tu le financement ?
              </h2>
              <p className="mt-2 text-white/70">
                Cette information nous aide à mobiliser le bon conseiller et les bonnes démarches.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {financingOptions.map((option) => {
                const isActive = formData.financing === option.id;
                return (
                  <motion.button
                    key={option.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setFormData((prev) => ({ ...prev, financing: option.id }))}
                    className={`rounded-2xl border-2 px-4 py-5 text-left transition-all ${
                      isActive
                        ? "border-white bg-white text-black"
                        : "border-white/20 bg-white/5 text-white hover:border-white/40"
                    }`}
                  >
                    <span className="font-light">{option.label}</span>
                    {option.sub ? (
                      <span className="mt-1 block text-xs font-light text-white/60">
                        {option.sub}
                      </span>
                    ) : null}
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative">
        <Image
          src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=2000&q=80"
          alt="Beyond Center Advisor"
          fill
          className="absolute inset-0 -z-10 object-cover opacity-30"
        />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(0,108,255,0.35),transparent_55%)]" />
      </div>

      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">
              Questionnaire Beyond Advisor
            </p>
            <h1 className="mt-4 text-4xl font-light sm:text-5xl">
              Parler à un conseiller, c’est ici.
            </h1>
            <p className="mt-3 max-w-xl text-sm font-light text-white/70 sm:text-base">
              Réponds à ces quelques questions : nous te dirigerons vers le bon expert Beyond Center et préparerons ton échange.
            </p>
          </div>
          <Sparkles className="hidden h-10 w-10 text-white/50 sm:block" />
        </div>

        <div className="mb-12">
          <div className="flex w-full items-center gap-2">
            {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
              <div
                key={index}
                className="h-1 flex-1 rounded-full transition-all"
                style={{
                  backgroundColor: index < currentStep ? blue : "rgba(255,255,255,0.15)",
                }}
              />
            ))}
          </div>
          <p className="mt-2 text-xs uppercase tracking-[0.3em] text-white/60">
            Étape {currentStep} sur {TOTAL_STEPS}
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-10">
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="submitted"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-6 text-center"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-white">
                  <Sparkles className="h-8 w-8" />
                </div>
                <h2 className="text-3xl font-light text-white">
                  Merci ! Ton conseiller te recontacte très vite.
                </h2>
                <p className="text-sm font-light text-white/70 sm:text-base">
                  Nous avons reçu tes informations. Tu vas recevoir un email de confirmation puis une proposition de créneau sous 24h ouvrées.
                </p>
                <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link href="/beyond-center">
                    <Button variant="outline" className="rounded-full border-white/40 px-6 py-3 text-white hover:bg-white/10">
                      Retour au site
                    </Button>
                  </Link>
                  <Link href="mailto:admissions@beyondcenter.fr">
                    <Button className="rounded-full bg-white px-6 py-3 text-black hover:bg-white/90">
                      Écrire directement
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                {renderStep()}
                {renderNavigation()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}


