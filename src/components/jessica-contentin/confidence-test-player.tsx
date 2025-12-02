"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Heart, Target, MessageSquare, Users, Calendar } from "lucide-react";

// Configuration du test
const TEST_QUESTIONS = [
  // DIMENSION 1 – Estime de soi (6 items)
  {
    id: "estime_1",
    dimension: "estime",
    dimensionLabel: "Estime de soi",
    text: "Je me sens capable de reconnaître mes qualités.",
    reversed: false,
    imageIndex: 0,
  },
  {
    id: "estime_2",
    dimension: "estime",
    dimensionLabel: "Estime de soi",
    text: "Globalement, je suis satisfait(e) de moi-même.",
    reversed: false,
    imageIndex: 1,
  },
  {
    id: "estime_3",
    dimension: "estime",
    dimensionLabel: "Estime de soi",
    text: "Je me sens digne d'être respecté(e) par les autres.",
    reversed: false,
    imageIndex: 2,
  },
  {
    id: "estime_4",
    dimension: "estime",
    dimensionLabel: "Estime de soi",
    text: "Il m'arrive de penser que je ne vaux pas grand-chose.",
    reversed: true, // Item inversé
    imageIndex: 3,
  },
  {
    id: "estime_5",
    dimension: "estime",
    dimensionLabel: "Estime de soi",
    text: "Je me sens légitime dans mes choix et dans ce que j'entreprends.",
    reversed: false,
    imageIndex: 4,
  },
  {
    id: "estime_6",
    dimension: "estime",
    dimensionLabel: "Estime de soi",
    text: "Je suis à l'aise pour parler de mes réussites sans culpabiliser.",
    reversed: false,
    imageIndex: 5,
  },
  // DIMENSION 2 – Auto-efficacité (6 items)
  {
    id: "auto_1",
    dimension: "auto_efficacite",
    dimensionLabel: "Auto-efficacité",
    text: "Je me sens capable de trouver des solutions même en situation difficile.",
    reversed: false,
    imageIndex: 0,
  },
  {
    id: "auto_2",
    dimension: "auto_efficacite",
    dimensionLabel: "Auto-efficacité",
    text: "Je peux gérer un imprévu avec calme et lucidité.",
    reversed: false,
    imageIndex: 1,
  },
  {
    id: "auto_3",
    dimension: "auto_efficacite",
    dimensionLabel: "Auto-efficacité",
    text: "Je crois en ma capacité à atteindre mes objectifs.",
    reversed: false,
    imageIndex: 2,
  },
  {
    id: "auto_4",
    dimension: "auto_efficacite",
    dimensionLabel: "Auto-efficacité",
    text: "Lorsque je rencontre un obstacle, je trouve généralement un moyen de m'en sortir.",
    reversed: false,
    imageIndex: 3,
  },
  {
    id: "auto_5",
    dimension: "auto_efficacite",
    dimensionLabel: "Auto-efficacité",
    text: "Je peux rester concentré(e) même lorsque je suis sous pression.",
    reversed: false,
    imageIndex: 4,
  },
  {
    id: "auto_6",
    dimension: "auto_efficacite",
    dimensionLabel: "Auto-efficacité",
    text: "Je me sens capable d'affronter des défis importants sans me décourager.",
    reversed: false,
    imageIndex: 5,
  },
  // DIMENSION 3 – Assertivité (6 items)
  {
    id: "assertivite_1",
    dimension: "assertivite",
    dimensionLabel: "Assertivité",
    text: "Je me sens capable d'exprimer clairement mon opinion.",
    reversed: false,
    imageIndex: 0,
  },
  {
    id: "assertivite_2",
    dimension: "assertivite",
    dimensionLabel: "Assertivité",
    text: "J'ose défendre mes idées face aux autres.",
    reversed: false,
    imageIndex: 1,
  },
  {
    id: "assertivite_3",
    dimension: "assertivite",
    dimensionLabel: "Assertivité",
    text: "Je peux dire non sans culpabiliser.",
    reversed: false,
    imageIndex: 2,
  },
  {
    id: "assertivite_4",
    dimension: "assertivite",
    dimensionLabel: "Assertivité",
    text: "Je me sens légitime pour poser des limites.",
    reversed: false,
    imageIndex: 3,
  },
  {
    id: "assertivite_5",
    dimension: "assertivite",
    dimensionLabel: "Assertivité",
    text: "Je peux accepter les critiques sans me sentir diminué(e).",
    reversed: false,
    imageIndex: 4,
  },
  {
    id: "assertivite_6",
    dimension: "assertivite",
    dimensionLabel: "Assertivité",
    text: "Je me permets de demander de l'aide lorsque j'en ai besoin.",
    reversed: false,
    imageIndex: 5,
  },
  // DIMENSION 4 – Compétences sociales & Adaptabilité (6 items)
  {
    id: "social_1",
    dimension: "competences_sociales",
    dimensionLabel: "Compétences sociales & Adaptabilité",
    text: "Je me sens à l'aise dans des situations sociales nouvelles.",
    reversed: false,
    imageIndex: 0,
  },
  {
    id: "social_2",
    dimension: "competences_sociales",
    dimensionLabel: "Compétences sociales & Adaptabilité",
    text: "J'ose prendre des initiatives même si je risque de me tromper.",
    reversed: false,
    imageIndex: 1,
  },
  {
    id: "social_3",
    dimension: "competences_sociales",
    dimensionLabel: "Compétences sociales & Adaptabilité",
    text: "Je peux prendre des décisions rapidement lorsque c'est nécessaire.",
    reversed: false,
    imageIndex: 2,
  },
  {
    id: "social_4",
    dimension: "competences_sociales",
    dimensionLabel: "Compétences sociales & Adaptabilité",
    text: "Je me sens capable de parler devant un groupe.",
    reversed: false,
    imageIndex: 3,
  },
  {
    id: "social_5",
    dimension: "competences_sociales",
    dimensionLabel: "Compétences sociales & Adaptabilité",
    text: "J'essaie volontiers de nouvelles expériences.",
    reversed: false,
    imageIndex: 4,
  },
  {
    id: "social_6",
    dimension: "competences_sociales",
    dimensionLabel: "Compétences sociales & Adaptabilité",
    text: "Je m'adapte facilement à des environnements ou des personnes inconnues.",
    reversed: false,
    imageIndex: 5,
  },
];

// Images pour chaque dimension (cycle entre plusieurs images)
const DIMENSION_IMAGES: Record<string, string[]> = {
  estime: [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2070&auto=format&fit=crop",
  ],
  auto_efficacite: [
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1932&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2084&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1556761175-4b46a572b786?q=80&w=1974&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2070&auto=format&fit=crop",
  ],
  assertivite: [
    "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1932&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2084&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1556761175-4b46a572b786?q=80&w=1974&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1932&auto=format&fit=crop",
  ],
  competences_sociales: [
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2084&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1932&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1556761175-4b46a572b786?q=80&w=1974&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2084&auto=format&fit=crop",
  ],
};

// Échelle de réponse
const RESPONSE_SCALE = [
  { value: 1, label: "Pas du tout d'accord" },
  { value: 2, label: "Plutôt pas d'accord" },
  { value: 3, label: "Plutôt d'accord" },
  { value: 4, label: "Tout à fait d'accord" },
];

type Answers = Record<string, number>;

type AnalysisResult = {
  global: string;
  dimensions: {
    estime: {
      score: number;
      analyse: string;
      points_forts: string[];
      axes_amelioration: string[];
    };
    auto_efficacite: {
      score: number;
      analyse: string;
      points_forts: string[];
      axes_amelioration: string[];
    };
    assertivite: {
      score: number;
      analyse: string;
      points_forts: string[];
      axes_amelioration: string[];
    };
    competences_sociales: {
      score: number;
      analyse: string;
      points_forts: string[];
      axes_amelioration: string[];
    };
  };
  recommandations: {
    prioritaires: string[];
    complementaires: string[];
  };
};

type ConfidenceTestPlayerProps = {
  initialFirstName?: string;
};

export function ConfidenceTestPlayer({ initialFirstName }: ConfidenceTestPlayerProps = {}) {
  const [phase, setPhase] = useState<"intro" | "questions" | "results">("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const [firstName] = useState<string>(initialFirstName || "");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const currentQuestion = TEST_QUESTIONS[currentIndex];
  const totalQuestions = TEST_QUESTIONS.length;
  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  const handleAnswer = (value: number) => {
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: value,
    };
    setAnswers(newAnswers);

    // Navigation automatique vers la question suivante après un court délai
    setTimeout(() => {
      if (currentIndex < totalQuestions - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        // Dernière question, calculer les scores et passer aux résultats
        // Utiliser les nouvelles réponses pour le calcul
        const dimensionScores: Record<string, number> = {
          estime: 0,
          auto_efficacite: 0,
          assertivite: 0,
          competences_sociales: 0,
        };

        TEST_QUESTIONS.forEach((question) => {
          const answer = newAnswers[question.id] || 0;
          let score = answer;

          // Recodage des items inversés
          if (question.reversed) {
            score = 5 - answer; // 1→4, 2→3, 3→2, 4→1
          }

          dimensionScores[question.dimension] += score;
        });

        setScores(dimensionScores);
        setPhase("results");
        setLoadingAnalysis(true);

        // Appeler l'API d'analyse IA
        fetch("/api/jessica-contentin/analyze-confidence-test", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            scores: dimensionScores,
            firstName: firstName || undefined,
          }),
        })
          .then((response) => {
            if (response.ok) {
              return response.json();
            }
            throw new Error("Erreur lors de l'analyse");
          })
          .then((data) => {
            setAnalysis(data.analysis);
          })
          .catch((error) => {
            console.error("[confidence-test] Erreur lors de l'analyse:", error);
          })
          .finally(() => {
            setLoadingAnalysis(false);
          });
      }
    }, 500); // Délai de 500ms pour une meilleure UX
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };


  const getImageUrl = (question: typeof TEST_QUESTIONS[0]) => {
    const images = DIMENSION_IMAGES[question.dimension] || DIMENSION_IMAGES.estime;
    return images[question.imageIndex % images.length];
  };

  const renderIntro = () => (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F5F0] to-white py-12 px-4">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-semibold text-[#2F2A25] mb-6">
            Test de Confiance en soi
          </h1>
          <p className="text-xl text-[#2F2A25]/80 max-w-2xl mx-auto leading-relaxed">
            Un outil d'auto-évaluation bienveillant pour mieux comprendre votre fonctionnement
          </p>
        </motion.div>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-8 md:p-12">
            <div className="space-y-6 text-[#2F2A25]">
              <div>
                <h2 className="text-2xl font-semibold mb-4">À propos de ce test</h2>
                <p className="leading-relaxed">
                  Ce test mesure quatre dimensions essentielles de la confiance en soi : <strong>l'estime de soi</strong>, 
                  <strong> l'auto-efficacité</strong>, <strong>l'assertivité</strong> et <strong>les compétences sociales</strong>. 
                  Il repose sur des modèles validés scientifiquement (Rosenberg, GSES) et vous permet une auto-évaluation 
                  claire et en douceur.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">Pour qui ?</h3>
                <p className="leading-relaxed">
                  Ce test s'adresse aux adultes, adolescents, étudiants ou parents accompagnés qui souhaitent mieux 
                  comprendre leur fonctionnement, identifier leurs forces et leurs axes de progression.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">Comment ça fonctionne ?</h3>
                <ul className="space-y-2 list-disc list-inside leading-relaxed">
                  <li>24 questions réparties en 4 dimensions</li>
                  <li>Répondez selon votre ressenti actuel</li>
                  <li>Obtenez une analyse personnalisée par dimension</li>
                  <li>Découvrez votre profil global synthétique</li>
                </ul>
              </div>

              <div className="pt-6 border-t border-[#E6D9C6]">
                <Button
                  onClick={() => setPhase("questions")}
                  className="w-full md:w-auto bg-[#C6A664] hover:bg-[#B89654] text-white px-8 py-6 text-lg rounded-full"
                >
                  Commencer le test
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderQuestion = () => {
    const currentAnswer = answers[currentQuestion.id];
    const imageUrl = getImageUrl(currentQuestion);

    return (
      <div className="min-h-screen bg-white">
        <div className="grid lg:grid-cols-2 min-h-screen">
          {/* Colonne gauche : Questions */}
          <div className="bg-white p-4 sm:p-6 md:p-8 lg:p-12 xl:p-16 flex flex-col min-h-screen lg:min-h-0 overflow-y-auto">
            {/* Indicateur de progression */}
            <div className="mb-6 md:mb-8">
              <Progress value={progress} className="h-2 mb-2" />
              <p className="text-sm text-[#2F2A25]/60">
                QUESTION {currentIndex + 1} SUR {totalQuestions}
              </p>
            </div>

            {/* Dimension actuelle */}
            <div className="mb-6">
              <span className="inline-block px-4 py-2 bg-[#F8F5F0] text-[#C6A664] rounded-full text-sm font-medium">
                {currentQuestion.dimensionLabel}
              </span>
            </div>

            {/* Question */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col"
              >
                <h2 className="text-2xl md:text-3xl font-semibold text-[#2F2A25] mb-8 leading-relaxed">
                  {currentQuestion.text}
                </h2>

                {/* Échelle de réponse */}
                <div className="space-y-3 mb-8">
                  {RESPONSE_SCALE.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleAnswer(option.value)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        currentAnswer === option.value
                          ? "border-[#C6A664] bg-[#F8F5F0]"
                          : "border-[#E6D9C6] hover:border-[#C6A664]/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            currentAnswer === option.value
                              ? "border-[#C6A664] bg-[#C6A664]"
                              : "border-[#E6D9C6]"
                          }`}
                        >
                          {currentAnswer === option.value && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <span className="text-[#2F2A25] font-medium">{option.label}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Navigation - Bouton Précédent uniquement */}
                {currentIndex > 0 && (
                  <div className="mt-auto">
                    <Button
                      onClick={handlePrevious}
                      variant="outline"
                      className="w-full border-[#E6D9C6] text-[#2F2A25] hover:bg-[#F8F5F0]"
                    >
                      ← Précédent
                    </Button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Colonne droite : Image */}
          <div className="hidden lg:block relative overflow-hidden bg-gray-100">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                <Image
                  src={imageUrl}
                  alt={`Illustration pour la question ${currentIndex + 1}`}
                  fill
                  className="object-cover"
                  priority={currentIndex < 3}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const dimensionLabels: Record<string, { label: string; icon: any }> = {
      estime: { label: "Estime de soi", icon: Heart },
      auto_efficacite: { label: "Auto-efficacité", icon: Target },
      assertivite: { label: "Assertivité", icon: MessageSquare },
      competences_sociales: { label: "Compétences sociales & Adaptabilité", icon: Users },
    };

    if (loadingAnalysis) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F5F0] to-white py-12 px-4">
          <div className="mx-auto max-w-4xl">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#C6A664] mb-4"></div>
              <p className="text-[#2F2A25]/80 text-lg">
                Analyse de vos résultats en cours...
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (!analysis) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F5F0] to-white py-12 px-4">
          <div className="mx-auto max-w-4xl">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <p className="text-[#2F2A25]/80">
                  Erreur lors de l'analyse. Veuillez réessayer.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8F5F0] to-white py-12 px-4">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-semibold text-[#2F2A25] mb-4">
              {firstName ? `${firstName}, voici vos résultats` : "Voici vos résultats"}
            </h1>
            <p className="text-xl text-[#2F2A25]/80">
              Analyse personnalisée de votre confiance en soi
            </p>
          </motion.div>

          {/* Résultat global */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mb-8">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-2xl font-semibold text-[#2F2A25] mb-4">Votre profil global</h2>
              <div 
                className="text-[#2F2A25]/80 leading-relaxed prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: analysis.global.replace(/\n/g, '<br />') }}
              />
            </CardContent>
          </Card>

          {/* Analyse par dimension */}
          <div className="space-y-6 mb-12">
            <h2 className="text-3xl font-semibold text-[#2F2A25] mb-6">Analyse par dimension</h2>
            {Object.entries(analysis.dimensions).map(([dimensionKey, dimensionData]) => {
              const { label, icon: Icon } = dimensionLabels[dimensionKey];
              const score = dimensionData.score;
              const percentage = (score / 24) * 100;

              return (
                <Card key={dimensionKey} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-6 md:p-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-[#F8F5F0] rounded-xl">
                        <Icon className="h-6 w-6 text-[#C6A664]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-[#2F2A25]">{label}</h3>
                        <p className="text-2xl font-bold text-[#C6A664]">
                          {score} / 24
                        </p>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-3 mb-6" />
                    
                    {/* Analyse */}
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-[#2F2A25] mb-3">Analyse</h4>
                      <p className="text-[#2F2A25]/80 leading-relaxed">
                        {dimensionData.analyse}
                      </p>
                    </div>

                    {/* Points forts */}
                    {dimensionData.points_forts && dimensionData.points_forts.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-lg font-semibold text-[#2F2A25] mb-3">Points forts</h4>
                        <ul className="space-y-2">
                          {dimensionData.points_forts.map((point, index) => (
                            <li key={index} className="flex items-start gap-2 text-[#2F2A25]/80">
                              <span className="text-green-600 mt-1">✓</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Axes d'amélioration */}
                    {dimensionData.axes_amelioration && dimensionData.axes_amelioration.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-[#2F2A25] mb-3">Axes d'amélioration</h4>
                        <ul className="space-y-2">
                          {dimensionData.axes_amelioration.map((axe, index) => (
                            <li key={index} className="flex items-start gap-2 text-[#2F2A25]/80">
                              <span className="text-[#C6A664] mt-1">→</span>
                              <span>{axe}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recommandations */}
          <Card className="bg-gradient-to-r from-[#C6A664] to-[#B89654] border-0 shadow-lg mb-12">
            <CardContent className="p-8 md:p-12">
              <h2 className="text-2xl md:text-3xl font-semibold text-white mb-6">
                Recommandations personnalisées
              </h2>
              
              {analysis.recommandations.prioritaires && analysis.recommandations.prioritaires.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-white mb-4">Prioritaires</h3>
                  <ul className="space-y-3">
                    {analysis.recommandations.prioritaires.map((reco, index) => (
                      <li key={index} className="flex items-start gap-3 text-white/90">
                        <span className="text-white font-bold mt-1">{index + 1}.</span>
                        <span className="leading-relaxed">{reco}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.recommandations.complementaires && analysis.recommandations.complementaires.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Complémentaires</h3>
                  <ul className="space-y-3">
                    {analysis.recommandations.complementaires.map((reco, index) => (
                      <li key={index} className="flex items-start gap-3 text-white/90">
                        <span className="text-white/70 mt-1">•</span>
                        <span className="leading-relaxed">{reco}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-2xl md:text-3xl font-semibold text-[#2F2A25] mb-4">
                Comment utiliser ces résultats ?
              </h2>
              <p className="text-[#2F2A25]/80 mb-8 leading-relaxed max-w-2xl mx-auto">
                Ces résultats sont un point de départ pour mieux vous comprendre. L'évaluation intérieure est 
                un premier pas vers le changement. Si vous souhaitez approfondir cette réflexion et bénéficier 
                d'un accompagnement personnalisé, je serais ravie de vous accompagner dans votre développement.
              </p>
              <Link href="/consultations">
                <Button className="bg-[#C6A664] hover:bg-[#B89654] text-white px-8 py-6 text-lg rounded-full">
                  <Calendar className="mr-2 h-5 w-5" />
                  Prendre rendez-vous avec Jessica
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  if (phase === "intro") return renderIntro();
  if (phase === "questions") return renderQuestion();
  if (phase === "results") return renderResults();

  return null;
}

