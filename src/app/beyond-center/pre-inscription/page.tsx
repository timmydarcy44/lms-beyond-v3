"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronRight, ChevronLeft } from "lucide-react";
import Image from "next/image";
import { env } from "@/lib/env";

// Fonction pour construire l'URL Supabase Storage
function getSupabaseStorageUrl(bucket: string, path: string): string {
  const supabaseUrl = 
    env.supabaseUrl || 
    (typeof window !== 'undefined' ? (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_SUPABASE_URL : undefined) ||
    (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL : undefined);
  
  if (!supabaseUrl) {
    return "";
  }
  
  const encodedBucket = encodeURIComponent(bucket);
  const pathParts = path.split('/');
  const encodedPath = pathParts.map(part => encodeURIComponent(part)).join('/');
  
  return `${supabaseUrl}/storage/v1/object/public/${encodedBucket}/${encodedPath}`;
}

const TOTAL_STEPS = 4;

// Étape 1 : Objectifs professionnels
const PROFESSIONAL_GOALS = [
  { id: "certification", label: "Obtenir une certification reconnue" },
  { id: "competences", label: "Développer mes compétences" },
  { id: "reconversion", label: "Me reconvertir professionnellement" },
  { id: "evolution", label: "Évoluer dans mon poste actuel" },
  { id: "insertion", label: "Faciliter mon insertion professionnelle" },
  { id: "open-badge", label: "Obtenir des Open Badge" },
];

// Étape 2 : Domaine d'intérêt
const INTEREST_AREAS = [
  { id: "commercial", label: "Commercial et vente" },
  { id: "management", label: "Management et leadership" },
  { id: "technique", label: "Technique et spécialisé" },
  { id: "digital", label: "Digital et numérique" },
  { id: "soft-skills", label: "Soft skills et développement personnel" },
  { id: "autre", label: "Autre domaine" },
];

// Étape 3 : Niveau actuel
const CURRENT_LEVELS = [
  {
    id: "debutant",
    label: "Débutant",
    description: "Je commence dans ce domaine et je souhaite acquérir les bases.",
  },
  {
    id: "intermediaire",
    label: "Intermédiaire",
    description: "J'ai déjà des compétences et je souhaite les approfondir.",
  },
  {
    id: "avance",
    label: "Avancé",
    description: "Je maîtrise déjà le domaine et je cherche à me certifier.",
  },
];

// Images pour chaque étape depuis Supabase Storage
const STEP_IMAGES = [
  getSupabaseStorageUrl("center", "Video center.mp4") || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2084&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop",
];

const blue = "#006CFF";
const white = "#FFFFFF";
const black = "#000000";

export default function PreInscriptionPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedGoals.length > 0;
      case 2:
        return selectedArea !== "";
      case 3:
        return selectedLevel !== "";
      case 4:
        return formData.firstName && formData.lastName && formData.email && formData.phone;
      default:
        return false;
    }
  };

  const handleSubmit = () => {
    // TODO: Envoyer les données au backend
    console.log("Pre-inscription submitted:", {
      goals: selectedGoals,
      area: selectedArea,
      level: selectedLevel,
      formData,
    });
    // Rediriger vers une page de remerciement
    window.location.href = "/beyond-center/pre-inscription/merci";
  };

  const toggleGoal = (id: string) => {
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((goal) => goal !== id) : [...prev, id]
    );
  };

  const renderStep1 = () => (
    <div className="space-y-8">
      <div>
        <h2 
          className="text-4xl md:text-5xl font-light mb-4 text-black" 
          style={{ 
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
            letterSpacing: '-0.02em'
          }}
        >
          Quels sont vos objectifs professionnels ?
        </h2>
        <p className="text-lg text-gray-600 font-light">
          Sélectionnez un ou plusieurs objectifs qui vous correspondent
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PROFESSIONAL_GOALS.map((goal) => (
          <motion.button
            key={goal.id}
            onClick={() => toggleGoal(goal.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`p-6 rounded-xl border-2 text-left transition-all duration-300 ${
              selectedGoals.includes(goal.id)
                ? "border-[#006CFF] bg-[#006CFF] text-white"
                : "border-gray-200 bg-white text-black hover:border-[#006CFF]/50 hover:bg-gray-50"
            }`}
          >
            <span className="font-light">{goal.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8">
      <div>
        <h2 
          className="text-4xl md:text-5xl font-light mb-4 text-black" 
          style={{ 
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
            letterSpacing: '-0.02em'
          }}
        >
          Dans quel domaine souhaitez-vous vous former ?
        </h2>
        <p className="text-lg text-gray-600 font-light">
          Choisissez le domaine qui vous intéresse le plus
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {INTEREST_AREAS.map((area) => (
          <motion.button
            key={area.id}
            onClick={() => setSelectedArea(area.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`p-6 rounded-xl border-2 text-left transition-all duration-300 ${
              selectedArea === area.id
                ? "border-[#006CFF] bg-[#006CFF] text-white"
                : "border-gray-200 bg-white text-black hover:border-[#006CFF]/50 hover:bg-gray-50"
            }`}
          >
            <span className="font-light">{area.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8">
      <div>
        <h2 
          className="text-4xl md:text-5xl font-light mb-4 text-black" 
          style={{ 
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
            letterSpacing: '-0.02em'
          }}
        >
          Quel est votre niveau actuel ?
        </h2>
        <p className="text-lg text-gray-600 font-light">
          Cela nous aidera à vous proposer le parcours le plus adapté
        </p>
      </div>
      <div className="space-y-4">
        {CURRENT_LEVELS.map((level) => (
          <motion.button
            key={level.id}
            onClick={() => setSelectedLevel(level.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full p-6 rounded-xl border-2 text-left transition-all duration-300 ${
              selectedLevel === level.id
                ? "border-[#006CFF] bg-[#006CFF] text-white"
                : "border-gray-200 bg-white text-black hover:border-[#006CFF]/50 hover:bg-gray-50"
            }`}
          >
            <div className="font-light text-lg mb-2">{level.label}</div>
            <div className="text-sm opacity-80 font-light">{level.description}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-8">
      <div>
        <h2 
          className="text-4xl md:text-5xl font-light mb-4 text-black" 
          style={{ 
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
            letterSpacing: '-0.02em'
          }}
        >
          Vos coordonnées
        </h2>
        <p className="text-lg text-gray-600 font-light">
          Nous vous contacterons pour finaliser votre inscription
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-black font-light">
            Prénom *
          </Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className="bg-white border-gray-200 text-black placeholder:text-gray-400 focus:border-[#006CFF]"
            placeholder="Votre prénom"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-black font-light">
            Nom *
          </Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className="bg-white border-gray-200 text-black placeholder:text-gray-400 focus:border-[#006CFF]"
            placeholder="Votre nom"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-black font-light">
            Email *
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="bg-white border-gray-200 text-black placeholder:text-gray-400 focus:border-[#006CFF]"
            placeholder="votre@email.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-black font-light">
            Téléphone *
          </Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="bg-white border-gray-200 text-black placeholder:text-gray-400 focus:border-[#006CFF]"
            placeholder="06 12 34 56 78"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex">
      {/* Colonne gauche : Questions */}
      <div className="flex-1 flex flex-col p-8 md:p-12 lg:p-16">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-8">
            <span 
              className="text-2xl tracking-tight text-black"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                fontWeight: 700
              }}
            >
              BEYOND <span style={{ fontWeight: 300 }}>Center</span>
            </span>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  index + 1 <= currentStep ? "bg-[#006CFF]" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Contenu de l'étape */}
        <div className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1"
            >
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderStep4()}
            </motion.div>
          </AnimatePresence>

          {/* Boutons de navigation */}
          <div className="flex justify-between mt-12">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="rounded-full px-8 py-6 border-2 border-gray-200 text-black hover:bg-gray-50 font-light"
              >
                <ChevronLeft className="mr-2 h-5 w-5" />
                Précédent
              </Button>
            )}
            <div className="flex-1" />
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="rounded-full px-8 py-6 bg-[#006CFF] text-white hover:bg-[#0052CC] disabled:opacity-50 disabled:cursor-not-allowed font-light"
            >
              {currentStep === TOTAL_STEPS ? "Envoyer" : "Étape suivante"}
              {currentStep < TOTAL_STEPS && <ChevronRight className="ml-2 h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Colonne droite : Image */}
      <div className="hidden lg:block relative w-1/2 overflow-hidden bg-gray-100">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <Image
              src={STEP_IMAGES[currentStep - 1]}
              alt={`Étape ${currentStep}`}
              fill
              className="object-cover"
              priority={currentStep === 1}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent" />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
