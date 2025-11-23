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

const BUCKET_NAME = "Jessica CONTENTIN";

// Médias pour la colonne de droite - une image par étape
const QUIZ_MEDIA_BY_STEP: Record<number, { type: "image" | "video"; path: string; name: string }> = {
  1: { type: "image", path: "couche soleil.png", name: "couche soleil" },
  2: { type: "image", path: "Couple.png", name: "Couple" },
  3: { type: "image", path: "Calin.png", name: "Calin" },
  4: { type: "video", path: "IMG_3660.mov", name: "IMG_3660" },
};

const TOTAL_STEPS = 4;

// Étape 1 : Domaines de focus
const FOCUS_AREAS = [
  { id: "confiance", label: "Confiance en soi" },
  { id: "stress", label: "Gestion du stress" },
  { id: "orientation", label: "Orientation scolaire" },
  { id: "guidance", label: "Guidance parentale" },
  { id: "apprentissage", label: "Stratégies d'apprentissage" },
  { id: "tdah", label: "TDAH" },
  { id: "dys", label: "Troubles DYS" },
  { id: "emotions", label: "Gestion des émotions" },
];

// Étape 2 : Tranches d'âge
const AGE_RANGES = [
  { id: "14-25", label: "14-25 ans" },
  { id: "26-39", label: "26-39 ans" },
  { id: "40-55", label: "40-55 ans" },
  { id: "56-71", label: "56-71 ans" },
  { id: "72+", label: "72 ans et plus" },
];

// Étape 3 : Niveau d'expérience
const EXPERIENCE_LEVELS = [
  {
    id: "debutant",
    label: "Je commence",
    description: "Je découvre l'accompagnement psychopédagogique et je souhaite en savoir plus.",
  },
  {
    id: "intermediaire",
    label: "J'ai déjà consulté",
    description: "J'ai déjà consulté un psychopédagogue ou un professionnel similaire et je souhaite continuer mon parcours.",
  },
  {
    id: "avance",
    label: "J'ai suivi des formations",
    description: "J'ai déjà suivi des formations ou des accompagnements et je cherche à approfondir mes compétences.",
  },
];

export default function QuizPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>([]);
  const [selectedAgeRange, setSelectedAgeRange] = useState<string>("");
  const [selectedExperience, setSelectedExperience] = useState<string>("");
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
        return selectedFocusAreas.length > 0;
      case 2:
        return selectedAgeRange !== "";
      case 3:
        return selectedExperience !== "";
      case 4:
        return formData.firstName && formData.lastName && formData.email && formData.phone;
      default:
        return false;
    }
  };

  const handleSubmit = () => {
    // TODO: Envoyer les données au backend
    console.log("Quiz submitted:", {
      focusAreas: selectedFocusAreas,
      ageRange: selectedAgeRange,
      experience: selectedExperience,
      formData,
    });
    // Rediriger vers une page de remerciement ou de recommandations
    window.location.href = "/quiz/merci";
  };

  const toggleFocusArea = (id: string) => {
    setSelectedFocusAreas((prev) =>
      prev.includes(id) ? prev.filter((area) => area !== id) : [...prev, id]
    );
  };

  const renderStep1 = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl md:text-5xl font-bold text-[#2F2A25] mb-4">
          Sur quels domaines souhaitez-vous vous concentrer ?
        </h2>
        <p className="text-lg text-[#2F2A25]/70">
          Sélectionnez un ou plusieurs domaines qui vous intéressent
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FOCUS_AREAS.map((area) => (
          <button
            key={area.id}
            onClick={() => toggleFocusArea(area.id)}
            className={`p-6 rounded-2xl border-2 text-left transition-all ${
              selectedFocusAreas.includes(area.id)
                ? "border-[#C6A664] bg-[#C6A664]/10"
                : "border-[#E6D9C6] bg-white hover:border-[#C6A664]/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium text-[#2F2A25]">{area.label}</span>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedFocusAreas.includes(area.id)
                    ? "border-[#C6A664] bg-[#C6A664]"
                    : "border-[#E6D9C6]"
                }`}
              >
                {selectedFocusAreas.includes(area.id) && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl md:text-5xl font-bold text-[#2F2A25] mb-4">
          Sélectionnez votre tranche d'âge
        </h2>
        <p className="text-lg text-[#2F2A25]/70">
          Cette information nous aide à mieux vous orienter
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {AGE_RANGES.map((range) => (
          <button
            key={range.id}
            onClick={() => setSelectedAgeRange(range.id)}
            className={`p-6 rounded-2xl border-2 text-left transition-all ${
              selectedAgeRange === range.id
                ? "border-[#C6A664] bg-[#C6A664]/10"
                : "border-[#E6D9C6] bg-white hover:border-[#C6A664]/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium text-[#2F2A25]">{range.label}</span>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedAgeRange === range.id
                    ? "border-[#C6A664] bg-[#C6A664]"
                    : "border-[#E6D9C6]"
                }`}
              >
                {selectedAgeRange === range.id && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl md:text-5xl font-bold text-[#2F2A25] mb-4">
          Où en êtes-vous dans votre parcours ?
        </h2>
        <p className="text-lg text-[#2F2A25]/70">
          Aidez-nous à mieux comprendre votre situation
        </p>
      </div>
      <div className="space-y-4">
        {EXPERIENCE_LEVELS.map((level) => (
          <button
            key={level.id}
            onClick={() => setSelectedExperience(level.id)}
            className={`w-full p-6 rounded-2xl border-2 text-left transition-all ${
              selectedExperience === level.id
                ? "border-[#C6A664] bg-[#C6A664]/10"
                : "border-[#E6D9C6] bg-white hover:border-[#C6A664]/50"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-lg font-medium text-[#2F2A25]">{level.label}</span>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-4 ${
                  selectedExperience === level.id
                    ? "border-[#C6A664] bg-[#C6A664]"
                    : "border-[#E6D9C6]"
                }`}
              >
                {selectedExperience === level.id && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
            </div>
            <p className="text-sm text-[#2F2A25]/60 mt-2">{level.description}</p>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl md:text-5xl font-bold text-[#2F2A25] mb-4">
          Découvrez les programmes recommandés pour vous
        </h2>
        <p className="text-lg text-[#2F2A25]/70">
          Remplissez vos coordonnées pour recevoir des recommandations personnalisées
        </p>
      </div>
      <div className="space-y-6 max-w-2xl">
        <div>
          <Label htmlFor="firstName" className="text-[#2F2A25] mb-2 block">
            Prénom
          </Label>
          <Input
            id="firstName"
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className="w-full p-4 rounded-xl border-2 border-[#E6D9C6] focus:border-[#C6A664]"
            placeholder="Votre prénom"
          />
        </div>
        <div>
          <Label htmlFor="lastName" className="text-[#2F2A25] mb-2 block">
            Nom
          </Label>
          <Input
            id="lastName"
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className="w-full p-4 rounded-xl border-2 border-[#E6D9C6] focus:border-[#C6A664]"
            placeholder="Votre nom"
          />
        </div>
        <div>
          <Label htmlFor="email" className="text-[#2F2A25] mb-2 block">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full p-4 rounded-xl border-2 border-[#E6D9C6] focus:border-[#C6A664]"
            placeholder="votre@email.com"
          />
        </div>
        <div>
          <Label htmlFor="phone" className="text-[#2F2A25] mb-2 block">
            Téléphone
          </Label>
          <div className="flex gap-2">
            <select className="p-4 rounded-xl border-2 border-[#E6D9C6] focus:border-[#C6A664] bg-white">
              <option>FR +33</option>
            </select>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="flex-1 p-4 rounded-xl border-2 border-[#E6D9C6] focus:border-[#C6A664]"
              placeholder="06 12 34 56 78"
            />
          </div>
        </div>
        <p className="text-sm text-[#2F2A25]/60">
          En cliquant sur "Envoyer", vous acceptez les Conditions d'utilisation et la Politique de
          confidentialité de Jessica Contentin. Vous consentez à recevoir des communications de
          notre part.
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      <div className="grid lg:grid-cols-2 min-h-screen">
        {/* Colonne gauche : Formulaire */}
        <div className="bg-white p-8 md:p-12 lg:p-16 flex flex-col">
          {/* Indicateur de progression */}
          <div className="mb-8">
            <div className="flex gap-2 mb-2">
              {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    index + 1 <= currentStep
                      ? "bg-[#C6A664]"
                      : "bg-[#E6D9C6]"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-[#2F2A25]/60">
              ÉTAPE {currentStep} SUR {TOTAL_STEPS}
            </p>
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
                  className="rounded-full px-8 py-6 border-2 border-[#E6D9C6] text-[#2F2A25] hover:bg-[#E6D9C6]/50"
                >
                  <ChevronLeft className="mr-2 h-5 w-5" />
                  Précédent
                </Button>
              )}
              <div className="flex-1" />
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="rounded-full px-8 py-6 bg-[#C6A664] hover:bg-[#B88A44] text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentStep === TOTAL_STEPS ? "Envoyer" : "Étape suivante"}
                {currentStep < TOTAL_STEPS && <ChevronRight className="ml-2 h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Colonne droite : Image correspondant à l'étape */}
        <div className="hidden lg:block relative overflow-hidden">
          {(() => {
            const media = QUIZ_MEDIA_BY_STEP[currentStep];
            if (!media) return null;
            
            const mediaUrl = getSupabaseStorageUrl(BUCKET_NAME, media.path);
            
            return (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                {media.type === "image" ? (
                  <Image
                    src={mediaUrl || "https://images.unsplash.com/photo-1524502397800-09d3eff08e04?auto=format&fit=crop&w=1600&q=80"}
                    alt={media.name}
                    fill
                    className="object-cover"
                    priority={currentStep === 1}
                    unoptimized={!!mediaUrl}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (!target.src.includes('unsplash.com')) {
                        target.src = "https://images.unsplash.com/photo-1524502397800-09d3eff08e04?auto=format&fit=crop&w=1600&q=80";
                      }
                    }}
                  />
                ) : (
                  <video
                    src={mediaUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      console.error("[Quiz] Erreur lors du chargement de la vidéo:", media.path);
                    }}
                  />
                )}
              </motion.div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

