"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronRight, ChevronLeft, Phone, Video } from "lucide-react";
import Image from "next/image";

const TOTAL_STEPS = 5;

// Écosystèmes disponibles
const ECOSYSTEMS = [
  { id: "no-school", label: "Beyond No School", description: "Formations en ligne" },
  { id: "care", label: "Beyond Care", description: "Santé mentale et bien-être" },
  { id: "connect", label: "Beyond Connect", description: "Optimisation du recrutement" },
  { id: "play", label: "Beyond Play", description: "Gamification pédagogique" },
  { id: "note", label: "Beyond Note", description: "Prise de notes intelligente" },
  { id: "center", label: "Beyond Center", description: "Centre de formation" },
];

// Questions adaptatives selon l'écosystème sélectionné
const ECOSYSTEM_QUESTIONS: Record<string, { question: string; options: string[] }[]> = {
  "no-school": [
    {
      question: "Quel type de formation vous intéresse ?",
      options: ["Formation technique", "Formation soft skills", "Certification professionnelle", "Formation continue"]
    },
    {
      question: "Quel est votre niveau actuel ?",
      options: ["Débutant", "Intermédiaire", "Avancé", "Expert"]
    },
    {
      question: "Quel est votre objectif principal ?",
      options: ["Changer de carrière", "Monter en compétences", "Obtenir une certification", "Développer mes soft skills"]
    }
  ],
  "care": [
    {
      question: "Quel aspect du bien-être vous préoccupe le plus ?",
      options: ["Gestion du stress", "Confiance en soi", "Relations interpersonnelles", "Équilibre vie pro/perso"]
    },
    {
      question: "Avez-vous déjà consulté un professionnel ?",
      options: ["Oui, régulièrement", "Oui, occasionnellement", "Non, mais j'y pense", "Non, première fois"]
    },
    {
      question: "Quel est votre objectif principal ?",
      options: ["Mieux me connaître", "Gérer mes émotions", "Améliorer mes relations", "Trouver un équilibre"]
    }
  ],
  "connect": [
    {
      question: "Êtes-vous candidat ou recruteur ?",
      options: ["Candidat", "Recruteur", "Les deux", "Je ne sais pas encore"]
    },
    {
      question: "Dans quel secteur cherchez-vous ?",
      options: ["Tech / IT", "Marketing / Communication", "Commerce / Vente", "Autre"]
    },
    {
      question: "Quel est votre objectif principal ?",
      options: ["Trouver un emploi", "Trouver des candidats", "Découvrir le marché", "Optimiser mon profil"]
    }
  ],
  "play": [
    {
      question: "Quel type d'apprentissage vous intéresse ?",
      options: ["Apprentissage par le jeu", "Défis et compétitions", "Progression gamifiée", "Tout ce qui est ludique"]
    },
    {
      question: "Aimez-vous les jeux et défis ?",
      options: ["Oui, beaucoup", "Oui, modérément", "Ça dépend", "Pas vraiment"]
    },
    {
      question: "Quel est votre objectif principal ?",
      options: ["Apprendre en m'amusant", "Rester motivé", "Progresser rapidement", "Découvrir de nouvelles méthodes"]
    }
  ],
  "note": [
    {
      question: "Pour quel usage souhaitez-vous utiliser Beyond Note ?",
      options: ["Prise de notes personnelles", "Organisation professionnelle", "Collaboration en équipe", "Gestion de projets"]
    },
    {
      question: "Quel est votre niveau technique ?",
      options: ["Débutant", "Intermédiaire", "Avancé", "Expert"]
    },
    {
      question: "Quel est votre objectif principal ?",
      options: ["Mieux organiser mes notes", "Collaborer efficacement", "Automatiser mes tâches", "Découvrir les fonctionnalités"]
    }
  ],
  "center": [
    {
      question: "Quel type de certification vous intéresse ?",
      options: ["Titre professionnel", "Open Badge", "Certification ministère", "Formation continue"]
    },
    {
      question: "Quel est votre niveau actuel ?",
      options: ["Niveau 2", "Niveau 3", "Niveau 4", "Je ne sais pas"]
    },
    {
      question: "Quel est votre objectif principal ?",
      options: ["Obtenir une certification", "Développer mes compétences", "Changer de carrière", "Valider mon expérience"]
    }
  ],
};

// Génération des créneaux horaires (lundi-vendredi, 30min, pause 12h-14h)
const generateTimeSlots = () => {
  const slots: { day: string; time: string; value: string }[] = [];
  const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
  
  days.forEach((day, dayIndex) => {
    // Matin : 9h à 12h
    for (let hour = 9; hour < 12; hour++) {
      slots.push({
        day,
        time: `${hour.toString().padStart(2, "0")}:00`,
        value: `${dayIndex}-${hour}-00`,
      });
      slots.push({
        day,
        time: `${hour.toString().padStart(2, "0")}:30`,
        value: `${dayIndex}-${hour}-30`,
      });
    }
    // Après-midi : 14h à 18h
    for (let hour = 14; hour < 18; hour++) {
      slots.push({
        day,
        time: `${hour.toString().padStart(2, "0")}:00`,
        value: `${dayIndex}-${hour}-00`,
      });
      slots.push({
        day,
        time: `${hour.toString().padStart(2, "0")}:30`,
        value: `${dayIndex}-${hour}-30`,
      });
    }
  });
  
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

export default function RendezVousPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedEcosystem, setSelectedEcosystem] = useState<string>("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [selectedContactType, setSelectedContactType] = useState<"appel" | "visio" | "">("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const handleNext = () => {
    if (currentStep === 1) {
      // Passer à l'étape des questions adaptatives
      setCurrentStep(2);
      setQuestionIndex(0);
    } else if (currentStep === 2) {
      // Les questions sont gérées par handleQuestionAnswer
      // Si on arrive ici, c'est qu'on a fini toutes les questions
      setCurrentStep(3);
    } else if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep === 2 && questionIndex > 0) {
      setQuestionIndex(questionIndex - 1);
    } else if (currentStep > 1) {
      if (currentStep === 2) {
        setCurrentStep(1);
        setQuestionIndex(0);
        setSelectedAnswers({});
      } else {
        setCurrentStep(currentStep - 1);
      }
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedEcosystem !== "";
      case 2:
        const questions = selectedEcosystem ? ECOSYSTEM_QUESTIONS[selectedEcosystem] || [] : [];
        return questionIndex < questions.length - 1 
          ? selectedAnswers[questionIndex] !== undefined
          : selectedAnswers[questionIndex] !== undefined;
      case 3:
        return selectedTimeSlot !== "";
      case 4:
        return selectedContactType !== "";
      case 5:
        return formData.firstName && formData.lastName && formData.email && formData.phone;
      default:
        return false;
    }
  };

  const handleQuestionAnswer = (answer: string) => {
    setSelectedAnswers({ ...selectedAnswers, [questionIndex]: answer });
    const questions = selectedEcosystem ? ECOSYSTEM_QUESTIONS[selectedEcosystem] || [] : [];
    if (questionIndex < questions.length - 1) {
      setTimeout(() => setQuestionIndex(questionIndex + 1), 300);
    } else {
      setTimeout(() => setCurrentStep(3), 300);
    }
  };

  const handleSubmit = () => {
    console.log("Rendez-vous submitted:", {
      ecosystem: selectedEcosystem,
      answers: selectedAnswers,
      timeSlot: selectedTimeSlot,
      contactType: selectedContactType,
      formData,
    });
    // TODO: Envoyer les données au backend
    window.location.href = "/beyond-center/rendez-vous/merci";
  };

  // Étape 1 : Sélection de l'écosystème
  const renderStep1 = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl md:text-5xl font-light text-black mb-4" style={{ 
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
          letterSpacing: '-0.02em'
        }}>
          Quel écosystème vous intéresse ?
        </h2>
        <p className="text-lg text-gray-600 font-light">
          Sélectionnez l'écosystème pour lequel vous souhaitez réserver un rendez-vous
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ECOSYSTEMS.map((ecosystem) => (
          <button
            key={ecosystem.id}
            onClick={() => setSelectedEcosystem(ecosystem.id)}
            className={`p-6 rounded-2xl border-2 text-left transition-all ${
              selectedEcosystem === ecosystem.id
                ? "border-black bg-black text-white"
                : "border-gray-200 bg-white hover:border-gray-400"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-medium mb-1">{ecosystem.label}</div>
                <div className={`text-sm ${selectedEcosystem === ecosystem.id ? "text-white/70" : "text-gray-500"}`}>
                  {ecosystem.description}
                </div>
              </div>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedEcosystem === ecosystem.id
                    ? "border-white bg-white"
                    : "border-gray-300"
                }`}
              >
                {selectedEcosystem === ecosystem.id && (
                  <div className="w-2 h-2 rounded-full bg-black" />
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  // Étape 2 : Questions adaptatives
  const renderStep2 = () => {
    const questions = selectedEcosystem ? ECOSYSTEM_QUESTIONS[selectedEcosystem] || [] : [];
    const currentQuestion = questions[questionIndex];
    
    if (!currentQuestion) {
      return null;
    }
    
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-4xl md:text-5xl font-light text-black mb-4" style={{ 
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
            letterSpacing: '-0.02em'
          }}>
            {currentQuestion.question}
          </h2>
          <p className="text-lg text-gray-600 font-light">
            Question {questionIndex + 1} sur {questions.length}
          </p>
        </div>
        <div className="space-y-4">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleQuestionAnswer(option)}
                className={`w-full p-6 rounded-2xl border-2 text-left transition-all ${
                  selectedAnswers[questionIndex] === option
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-white hover:border-gray-400 text-black"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-lg font-medium ${selectedAnswers[questionIndex] === option ? "text-white" : "text-black"}`}>{option}</span>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedAnswers[questionIndex] === option
                        ? "border-white bg-white"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedAnswers[questionIndex] === option && (
                      <div className="w-2 h-2 rounded-full bg-black" />
                    )}
                  </div>
                </div>
              </button>
            ))}
        </div>
      </div>
    );
  };

  // Étape 3 : Sélection du créneau horaire
  const renderStep3 = () => {
    const slotsByDay = TIME_SLOTS.reduce((acc, slot) => {
      if (!acc[slot.day]) acc[slot.day] = [];
      acc[slot.day].push(slot);
      return acc;
    }, {} as Record<string, typeof TIME_SLOTS>);

    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-4xl md:text-5xl font-light text-black mb-4" style={{ 
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
            letterSpacing: '-0.02em'
          }}>
            Choisissez votre créneau
          </h2>
          <p className="text-lg text-gray-600 font-light">
            Sélectionnez un créneau de 30 minutes (pause entre 12h et 14h)
          </p>
        </div>
        <div className="space-y-6 max-h-[500px] overflow-y-auto">
          {Object.entries(slotsByDay).map(([day, slots]) => (
            <div key={day} className="space-y-3">
              <h3 className="text-xl font-medium text-black mb-2">{day}</h3>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot.value}
                    onClick={() => setSelectedTimeSlot(slot.value)}
                    className={`p-3 rounded-xl border-2 text-sm transition-all ${
                      selectedTimeSlot === slot.value
                        ? "border-black bg-black text-white"
                        : "border-gray-200 bg-white hover:border-gray-400"
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Étape 4 : Type de contact
  const renderStep4 = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl md:text-5xl font-light text-black mb-4" style={{ 
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
          letterSpacing: '-0.02em'
        }}>
          Comment préférez-vous échanger ?
        </h2>
        <p className="text-lg text-gray-600 font-light">
          Choisissez votre mode de communication préféré
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => setSelectedContactType("appel")}
          className={`p-8 rounded-2xl border-2 text-left transition-all ${
            selectedContactType === "appel"
              ? "border-black bg-black text-white"
              : "border-gray-200 bg-white hover:border-gray-400"
          }`}
        >
          <Phone className={`h-12 w-12 mb-4 ${selectedContactType === "appel" ? "text-white" : "text-black"}`} />
          <div className="text-xl font-medium mb-2">Appel téléphonique</div>
          <div className={`text-sm ${selectedContactType === "appel" ? "text-white/70" : "text-gray-500"}`}>
            Échangez par téléphone
          </div>
        </button>
        <button
          onClick={() => setSelectedContactType("visio")}
          className={`p-8 rounded-2xl border-2 text-left transition-all ${
            selectedContactType === "visio"
              ? "border-black bg-black text-white"
              : "border-gray-200 bg-white hover:border-gray-400"
          }`}
        >
          <Video className={`h-12 w-12 mb-4 ${selectedContactType === "visio" ? "text-white" : "text-black"}`} />
          <div className="text-xl font-medium mb-2">Visio-conférence</div>
          <div className={`text-sm ${selectedContactType === "visio" ? "text-white/70" : "text-gray-500"}`}>
            Échangez en visioconférence
          </div>
        </button>
      </div>
    </div>
  );

  // Étape 5 : Informations de contact
  const renderStep5 = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl md:text-5xl font-light text-black mb-4" style={{ 
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
          letterSpacing: '-0.02em'
        }}>
          Vos coordonnées
        </h2>
        <p className="text-lg text-gray-600 font-light">
          Remplissez vos informations pour finaliser la réservation
        </p>
      </div>
      <div className="space-y-6 max-w-2xl">
        <div>
          <Label htmlFor="firstName" className="text-black mb-2 block font-light">
            Prénom
          </Label>
          <Input
            id="firstName"
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-black text-black placeholder:text-gray-400"
            placeholder="Votre prénom"
            style={{ color: '#000000' }}
          />
        </div>
        <div>
          <Label htmlFor="lastName" className="text-black mb-2 block font-light">
            Nom
          </Label>
          <Input
            id="lastName"
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-black text-black placeholder:text-gray-400"
            placeholder="Votre nom"
            style={{ color: '#000000' }}
          />
        </div>
        <div>
          <Label htmlFor="email" className="text-black mb-2 block font-light">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-black text-black placeholder:text-gray-400"
            placeholder="votre@email.com"
            style={{ color: '#000000' }}
          />
        </div>
        <div>
          <Label htmlFor="phone" className="text-black mb-2 block font-light">
            Téléphone
          </Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-black text-black placeholder:text-gray-400"
            placeholder="06 12 34 56 78"
            style={{ color: '#000000' }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
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
                      ? "bg-black"
                      : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-gray-500 font-light">
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
                {currentStep === 5 && renderStep5()}
              </motion.div>
            </AnimatePresence>

            {/* Boutons de navigation */}
            <div className="flex justify-between mt-12">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className="rounded-full px-8 py-6 border-2 border-gray-200 text-black hover:bg-gray-50"
                >
                  <ChevronLeft className="mr-2 h-5 w-5" />
                  Précédent
                </Button>
              )}
              <div className="flex-1" />
              {/* Ne pas afficher le bouton "Étape suivante" à l'étape 2 car les questions avancent automatiquement */}
              {currentStep !== 2 && (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="rounded-full px-8 py-6 bg-black hover:bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {currentStep === TOTAL_STEPS ? "Confirmer" : "Étape suivante"}
                  {currentStep < TOTAL_STEPS && <ChevronRight className="ml-2 h-5 w-5" />}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Colonne droite : Image */}
        <div className="hidden lg:block relative overflow-hidden bg-black">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <Image
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop"
              alt="Beyond Center"
              fill
              className="object-cover opacity-50"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

