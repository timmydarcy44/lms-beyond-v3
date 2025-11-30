'use client';

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, BookOpen, CheckCircle2, Clock, Download, Loader2, Sparkles, ChevronLeft, ChevronRight, Printer, Linkedin } from "lucide-react";
import { toast } from "sonner";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { env } from "@/lib/env";
import type { MentalAssessment } from "@/types/mental-health-questionnaire";

type LikertScale = {
  min: number;
  max: number;
  labels?: Record<string, string>;
};

type QuestionItem = {
  id: string;
  question_text: string;
  question_type: "likert" | "single_choice" | "multiple_choice" | "text" | "number";
  metadata: Record<string, any> | null;
  likert_scale: LikertScale | null;
  options?: Array<{ label: string; value: string; points?: number }>;
};

type QuestionnairePayload = {
  id: string;
  title: string;
  description?: string | null;
  frequency?: string | null;
  send_day?: number | null;
  send_time?: string | null;
  target_roles?: string[] | null;
  questions: QuestionItem[];
};

type AssessmentSummary = Pick<
  MentalAssessment,
  "id" | "questionnaire_id" | "overall_score" | "dimension_scores" | "analysis_summary" | "analysis_details" | "metadata" | "created_at"
>;

type PlayerProps = {
  questionnaire: QuestionnairePayload;
  assessments: AssessmentSummary[];
  isJessicaContentin?: boolean;
  isTimDarcy?: boolean;
};

type Phase = "intro" | "questions" | "result";

const DIMENSION_LABELS: Record<string, string> = {
  style_cognitif_organisationnel: "Organisation cognitive",
  mode_emotionnel_naturel: "Mode émotionnel naturel",
  besoin_social_naturel: "Besoin social naturel",
  coping_naturel: "Coping naturel",
  energie_rythme_interne: "Énergie & rythme interne",
  gestion_emotions_stress: "Gestion des émotions & du stress",
  communication_influence: "Communication & influence",
  perseverance_action: "Persévérance & passage à l’action",
  organisation_priorites: "Organisation, temps & priorités",
  empathie_ecoute_active: "Empathie & écoute active",
  resolution_problemes: "Résolution de problèmes & pensée critique",
  collaboration_conflits: "Collaboration & gestion des conflits",
  creativite_adaptabilite: "Créativité & adaptabilité",
  leadership_vision: "Leadership & vision",
  confiance_decision: "Confiance en soi & prise de décision",
};

const DIMENSION_MESSAGES: Record<
  string,
  {
    high: string;
    medium: string;
    low: string;
  }
> = {
  style_cognitif_organisationnel: {
    high: "Vous aimez planifier, cadrer et anticiper. Cette structure vous aide à rester efficace.",
    medium: "Vous avez besoin d’un cadre clair tout en restant capable d’improviser selon la situation.",
    low: "La planification serrée peut devenir lourde : clarifiez vos priorités au fil de l’eau pour rester à l’aise.",
  },
  mode_emotionnel_naturel: {
    high: "Votre sensibilité émotionnelle est une force : elle vous permet de décoder les nuances d’ambiance.",
    medium: "Vous accueillez vos ressentis tout en gardant une certaine distance émotionnelle.",
    low: "Votre mode émotionnel reste plutôt calme : pensez à verbaliser ce que vous ressentez pour rester aligné·e.",
  },
  besoin_social_naturel: {
    high: "Les échanges nourrissent votre énergie. Préservez des temps de connexion authentiques dans votre agenda.",
    medium: "Vous alternez entre moments sociaux et temps seul·e selon vos besoins du moment.",
    low: "Vous préservez votre bulle pour vous ressourcer : osez poser vos limites pour protéger ces espaces.",
  },
  coping_naturel: {
    high: "Vous sollicitez facilement du soutien et exprimez vos besoins avec clarté : gardez ce réflexe précieux.",
    medium: "Vous gérez beaucoup par vous-même tout en demandant de l’aide si nécessaire.",
    low: "Vous avez tendance à tout porter seul·e : identifiez une personne ressource ou un rituel d’expression pour relâcher la pression.",
  },
  energie_rythme_interne: {
    high: "Votre énergie est stable et soutenante : gardez le rythme en prévoyant quelques micro-pauses.",
    medium: "Votre énergie varie : repérez vos pics pour y placer les activités importantes.",
    low: "Votre rythme demande des respirations fréquentes : planifiez des temps de récupération courts mais réguliers.",
  },
  gestion_emotions_stress: {
    high: "Tu restes lucide quand la pression monte et tu sais restaurer ton équilibre rapidement.",
    medium: "Tu gères le stress avec des hauts et des bas : sécurise un rituel court pour t’apaiser au quotidien.",
    low: "Le stress t’envahit vite : installe un filet de sécurité (pause courte, respiration, appuis physiques) avant d’agir.",
  },
  communication_influence: {
    high: "Tu fais passer tes idées avec impact tout en restant accessible.",
    medium: "Tu communiques clairement dans les contextes connus : prépare deux exemples simples pour convaincre plus vite.",
    low: "Ton message peut se diluer : structure-le (idée clé → illustration → bénéfice) et vérifie la compréhension.",
  },
  perseverance_action: {
    high: "Tu gardes le cap et tu trouves l’énergie d’aller au bout de tes projets.",
    medium: "Tu avances dès que le sens est clair : fractionne les étapes pour préserver ta motivation.",
    low: "L’élan retombe vite : fixe-toi un micro-objectif immédiat et célèbre chaque avancée.",
  },
  organisation_priorites: {
    high: "Tu hiérarchises vite ce qui compte et tu sais dire non.",
    medium: "Tu t’organises dès que la charge augmente : consolide une routine matinale de priorisation.",
    low: "Les priorités se superposent : utilise un tableau urgent / important pour clarifier ton plan de journée.",
  },
  empathie_ecoute_active: {
    high: "Tu captes les émotions et tu accompagnes avec une écoute très fine.",
    medium: "Tu es présent·e aux autres mais il t’arrive de manquer un signal faible : multiplie les reformulations.",
    low: "Les ressentis passent sous ton radar : pose une question ouverte avant de donner ton avis.",
  },
  resolution_problemes: {
    high: "Tu analyses vite et tu trouves des solutions pertinentes.",
    medium: "Tu alternes entre intuition et analyse : ancre-toi sur un schéma simple (constat → options → test).",
    low: "Tu peux agir trop vite ou te perdre dans les détails : impose-toi un temps d’observation avant toute décision.",
  },
  collaboration_conflits: {
    high: "Tu facilites le dialogue et tu apaises les tensions avec justesse.",
    medium: "Tu cherches l’équilibre collectif mais tu peux parfois t’effacer : prépare une phrase d’ouverture neutre.",
    low: "Le conflit te bouscule : pose le cadre (objectif commun, règles du jeu) avant de proposer une solution.",
  },
  creativite_adaptabilite: {
    high: "Tu changes facilement de stratégie et tu proposes des idées nouvelles.",
    medium: "Tu t’adaptes quand c’est nécessaire : prévois un temps de veille créative régulier.",
    low: "Les imprévus te freinent : teste une micro-variation par semaine pour gagner en souplesse.",
  },
  leadership_vision: {
    high: "Tu proposes une vision claire et tu donnes envie d’y aller.",
    medium: "Tu peux guider si on te sollicite : clarifie ce que tu veux porter pour prendre la parole plus tôt.",
    low: "Tu restes en retrait : structure une mini-vision (pourquoi → comment → bénéfice) pour entraîner ton groupe.",
  },
  confiance_decision: {
    high: "Tu assumes tes choix et tu sais trancher rapidement.",
    medium: "Tu décides correctement mais tu doutes quand l’enjeu grimpe : fixe des critères et valides-les.",
    low: "Tu repousses la décision : définis tes incontournables et consulte une personne de confiance avant de conclure.",
  },
};

// Couleurs Beyond Care (par défaut)
const beyondCareBrandColor = "#c91459";
const beyondCarePdfBrandGradient = {
  start: [255, 240, 246],
  end: [255, 255, 255],
};

// Couleurs Jessica Contentin
const jessicaBrandColor = "#8B6F47"; // Marron principal
const jessicaAccentColor = "#D4AF37"; // Doré
const jessicaSecondaryColor = "#D4C4A8"; // Beige
const jessicaBackgroundColor = "#F5F1E8"; // Beige très clair
const jessicaTextColor = "#5C4A37"; // Marron foncé
const jessicaPdfBrandGradient = {
  start: [245, 241, 232], // Beige très clair
  end: [255, 255, 255], // Blanc
};

const introHeroImage =
  "https://images.unsplash.com/photo-1524502397800-09d3eff08e04?auto=format&fit=crop&w=1600&q=80";

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

const JESSICA_BUCKET_NAME = "Jessica CONTENTIN";

export function MentalHealthQuestionnairePlayer({ questionnaire, assessments, isJessicaContentin = false, isTimDarcy = false }: PlayerProps) {
  // Debug: Log pour vérifier si isJessicaContentin est bien passé
  console.log("[MentalHealthQuestionnairePlayer] Rendering with:", {
    questionnaireTitle: questionnaire.title,
    isJessicaContentin,
    isTimDarcy,
    questionnaireId: questionnaire.id,
  });
  
  if (isTimDarcy) {
    console.log("[MentalHealthQuestionnairePlayer] ✅ Tim Darcy detected - will use black & white layout");
  }
  
  // Déterminer les couleurs à utiliser
  // Pour Tim Darcy : noir et blanc
  const brandColor = isTimDarcy ? "#000000" : (isJessicaContentin ? jessicaBrandColor : beyondCareBrandColor);
  const accentColor = isTimDarcy ? "#000000" : (isJessicaContentin ? jessicaAccentColor : beyondCareBrandColor);
  const secondaryColor = isTimDarcy ? "#666666" : (isJessicaContentin ? jessicaSecondaryColor : "#f4c1d2");
  const backgroundColor = isTimDarcy ? "#FFFFFF" : (isJessicaContentin ? jessicaBackgroundColor : "#fef5f9");
  const bgColor = isTimDarcy ? "#FFFFFF" : (isJessicaContentin ? jessicaBackgroundColor : "#fef5f9");
  const surfaceColor = isTimDarcy ? "#FFFFFF" : (isJessicaContentin ? "#FFFFFF" : "#FFFFFF");
  const textColor = isTimDarcy ? "#000000" : (isJessicaContentin ? jessicaTextColor : "#5a1d35");
  const textSecondaryColor = isTimDarcy ? "#666666" : (isJessicaContentin ? "#8B7355" : "#7b2a49");
  const hoverColor = isTimDarcy ? "#333333" : (isJessicaContentin ? "#B88A44" : "#b2124f");
  const pdfBrandGradient = isTimDarcy ? "linear-gradient(135deg, #000000 0%, #333333 100%)" : (isJessicaContentin ? jessicaPdfBrandGradient : beyondCarePdfBrandGradient);
  
  // Fonction utilitaire pour obtenir les styles inline avec les couleurs dynamiques
  const getColorStyle = (property: string) => ({ [property]: brandColor });
  const getTextColorStyle = () => ({ color: textColor });
  const getTextSecondaryColorStyle = () => ({ color: textSecondaryColor });
  const [phase, setPhase] = useState<Phase>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<AssessmentSummary[]>(assessments);
  const [activeResult, setActiveResult] = useState<AssessmentSummary | null>(null);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentQuestion = questionnaire.questions[currentIndex];
  const totalQuestions = questionnaire.questions.length;
  const progress = ((currentIndex + 1) / Math.max(totalQuestions, 1)) * 100;

  const latestHistory = history[0] ?? null;

  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  const isQuestionAnswered = (question: QuestionItem, value: number | string | undefined): boolean => {
    if (question.question_type === "likert") {
      return typeof value === "number" && Number.isFinite(value);
    }
    if (question.question_type === "single_choice" || question.question_type === "multiple_choice") {
      return typeof value === "string" && value.length > 0;
    }
    if (question.question_type === "text") {
      return typeof value === "string" && value.trim().length > 0;
    }
    return value != null;
  };

  const canGoNext = currentQuestion ? isQuestionAnswered(currentQuestion, currentAnswer) : false;

  useEffect(() => {
    return () => {
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
      }
    };
  }, []);

  const handleStart = () => {
    setPhase("questions");
    setCurrentIndex(0);
    setAnswers({});
    setActiveResult(null);
  };

  const handleSelectAnswer = (question: QuestionItem, value: number | string) => {
    if (submitting) return;

    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
    }

    if (question.question_type === "likert") {
      const numericValue = Number(value);
      if (!Number.isFinite(numericValue)) {
        return;
      }
      setAnswers((prev) => ({ ...prev, [question.id]: numericValue }));
    } else {
      setAnswers((prev) => ({ ...prev, [question.id]: String(value) }));
    }

    if (question.question_type === "likert" || question.question_type === "single_choice") {
      const isLast = currentIndex >= totalQuestions - 1;
      autoAdvanceTimer.current = setTimeout(() => {
        if (isLast) {
          void handleSubmit(true);
        } else {
          setCurrentIndex((prev) => Math.min(prev + 1, totalQuestions - 1));
        }
      }, 220);
    }
  };

  const handleTextAnswer = (question: QuestionItem, text: string) => {
    if (submitting) return;
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
    }
    setAnswers((prev) => ({ ...prev, [question.id]: text }));
  };

  const handlePrev = () => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
    }
    if (currentIndex === 0) {
      setPhase("intro");
      return;
    }
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleNext = () => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
    }
    if (!canGoNext) {
      toast.info("Complétez la question pour continuer.");
      return;
    }
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleSubmit = async (fromAuto = false) => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
    }
    if (!fromAuto && !canGoNext) {
      toast.info("Sélectionnez une réponse pour terminer.");
      return;
    }

    if (submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/mental-health/assessments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionnaireId: questionnaire.id,
          answers: Object.entries(answers).map(([questionId, value]) => ({
            questionId,
            value,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (data?.code === "42P01") {
          throw new Error(
            "Les tables Beyond Care (mental_health_assessments) ne sont pas encore installées. Lancez la migration Supabase.",
          );
        }
        throw new Error(data?.error || "Impossible d'enregistrer vos réponses.");
      }

      const payload = await response.json();
      const assessment = payload.assessment as AssessmentSummary;

      setActiveResult(assessment);
      setHistory((prev) => [assessment, ...prev]);
      setPhase("result");
      toast.success("Analyse enregistrée", {
        description: "Vous pouvez retrouver ce résultat dans votre espace Beyond Care.",
      });
    } catch (error: any) {
      console.error("[mental-health-player] submit error", error);
      toast.error(error?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
    }
    setPhase("intro");
    setAnswers({});
    setCurrentIndex(0);
    setActiveResult(null);
  };

  const handleDownload = async (result?: AssessmentSummary | null) => {
    const exportResult = result ?? activeResult ?? latestHistory;

    if (!exportResult) {
      toast.error("Aucun résultat à exporter.");
      return;
    }

    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        unit: "pt",
        format: "a4",
      });

      const width = doc.internal.pageSize.getWidth();
      const height = doc.internal.pageSize.getHeight();

      const softBackground = { r: 252, g: 238, b: 245 };
      const softPanel = { r: 254, g: 245, b: 249 };
      const brandPrimary = { r: 201, g: 20, b: 89 };
      const brandText = { r: 90, g: 29, b: 53 };
      const secondaryText = { r: 123, g: 42, b: 73 };

      doc.setFillColor(softBackground.r, softBackground.g, softBackground.b);
      doc.rect(0, 0, width, height, "F");
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(36, 36, width - 72, height - 72, 18, 18, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(96);
      doc.setTextColor(249, 215, 229);
      doc.text("BEYOND CARE", width / 2, height / 2, {
        align: "center",
        angle: 40,
      });

      doc.setFontSize(26);
      doc.setTextColor(brandPrimary.r, brandPrimary.g, brandPrimary.b);
      doc.text("Bilan Beyond Care", 72, 112);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(brandText.r, brandText.g, brandText.b);
      doc.text(`Date : ${new Date(exportResult.created_at).toLocaleDateString("fr-FR")}`, 72, 134);
      doc.text(`Score global : ${Math.round(exportResult.overall_score)} / 100`, 72, 150);

      let pageY = 190;
      const ensureSpace = (needed: number) => {
        if (pageY + needed > height - 72) {
          doc.addPage();
          doc.setFillColor(softBackground.r, softBackground.g, softBackground.b);
          doc.rect(0, 0, width, height, "F");
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(36, 36, width - 72, height - 72, 18, 18, "F");
          doc.setTextColor(brandText.r, brandText.g, brandText.b);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(12);
          pageY = 108;
        }
      };

      const sectionTitle = (title: string) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        doc.setTextColor(brandPrimary.r, brandPrimary.g, brandPrimary.b);
        doc.text(title, 72, pageY);
        pageY += 18;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor(brandText.r, brandText.g, brandText.b);
      };

      if (exportResult.analysis_summary) {
        sectionTitle("Analyse personnalisée");
        const summaryLines = doc.splitTextToSize(exportResult.analysis_summary, width - 144);
        summaryLines.forEach((line: string) => {
          ensureSpace(16);
          doc.text(line, 72, pageY);
          pageY += 16;
        });
        pageY += 6;
      }

      const dimensionEntries = Object.entries(exportResult.dimension_scores ?? {});
      if (dimensionEntries.length > 0) {
        sectionTitle("Scores par dimension");
        dimensionEntries
          .sort((a, b) => (b[1] as number) - (a[1] as number))
          .forEach(([key, value]) => {
            ensureSpace(94);
            doc.setFillColor(softPanel.r, softPanel.g, softPanel.b);
            doc.roundedRect(72, pageY - 16, width - 144, 86, 12, 12, "F");

            doc.setFont("helvetica", "bold");
            doc.setFontSize(13);
            doc.setTextColor(brandPrimary.r, brandPrimary.g, brandPrimary.b);
            doc.text(DIMENSION_LABELS[key] ?? key, 88, pageY + 4);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.setTextColor(brandText.r, brandText.g, brandText.b);
            doc.text(`${Math.round(value as number)} / 100`, width - 160, pageY + 4);
            pageY += 24;

            doc.setFont("helvetica", "normal");
            doc.setFontSize(11);
            const detail = (exportResult.analysis_details as Record<string, any> | undefined)?.[key];
            const message = detail?.message ?? scoreToMessage(key, value as number);
            const detailLines = doc.splitTextToSize(message, width - 188);
            detailLines.forEach((line: string) => {
              ensureSpace(14);
              doc.text(line, 90, pageY);
              pageY += 14;
            });

            if (Array.isArray(detail?.recommendations) && detail.recommendations.length > 0) {
              doc.setTextColor(secondaryText.r, secondaryText.g, secondaryText.b);
              detail.recommendations.slice(0, 3).forEach((rec: string) => {
                const recLines = doc.splitTextToSize(`• ${rec}`, width - 208);
                recLines.forEach((line: string) => {
                  ensureSpace(14);
                  doc.text(line, 100, pageY);
                  pageY += 14;
                });
              });
              doc.setTextColor(brandText.r, brandText.g, brandText.b);
            }

            pageY += 16;
          });
      }

      const globalRecs = Array.isArray(exportResult.metadata?.ai_recommendations)
        ? (exportResult.metadata?.ai_recommendations as string[])
        : [];
      if (globalRecs.length > 0) {
        ensureSpace(90);
        sectionTitle("Recommandations globales");
        globalRecs.slice(0, 6).forEach((rec) => {
          const lines = doc.splitTextToSize(`• ${rec}`, width - 160);
          lines.forEach((line: string) => {
            ensureSpace(14);
            doc.text(line, 82, pageY);
            pageY += 14;
          });
        });
        pageY += 10;
      }

      const choiceAnswers = Array.isArray(exportResult.metadata?.choice_answers)
        ? (exportResult.metadata?.choice_answers as Array<{ dimension: string; choice: string; question?: string; points?: number }>)
        : [];
      if (choiceAnswers.length > 0) {
        ensureSpace(120);
        sectionTitle("Tes préférences déclarées");
        choiceAnswers.forEach((entry) => {
          ensureSpace(72);
          doc.setFillColor(softPanel.r, softPanel.g, softPanel.b);
          doc.roundedRect(72, pageY - 12, width - 144, 70, 10, 10, "F");

          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.setTextColor(brandPrimary.r, brandPrimary.g, brandPrimary.b);
          doc.text(DIMENSION_LABELS[entry.dimension] ?? entry.dimension, 88, pageY + 4);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(11);
          doc.setTextColor(brandText.r, brandText.g, brandText.b);
          if (entry.question) {
            const questionLines = doc.splitTextToSize(entry.question, width - 192);
            questionLines.forEach((line: string) => {
              ensureSpace(14);
              doc.text(line, 88, pageY + 20);
              pageY += 14;
            });
          } else {
            pageY += 12;
          }

          doc.setFont("helvetica", "bold");
          const answerText = `${entry.choice}${typeof entry.points === "number" ? ` · ${entry.points} pts` : ""}`;
          const answerLines = doc.splitTextToSize(answerText, width - 192);
          answerLines.forEach((line: string) => {
            doc.text(line, 88, pageY + 22);
            pageY += 14;
          });
          pageY += 32;
        });
      }

      const qualitative = Array.isArray(exportResult.metadata?.qualitative_responses)
        ? (exportResult.metadata?.qualitative_responses as Array<{ dimension: string; answer: string; question?: string }>)
        : [];
      if (qualitative.length > 0) {
        ensureSpace(120);
        sectionTitle("Ce que tu as exprimé");
        qualitative.forEach((item) => {
          ensureSpace(86);
          doc.setFillColor(softPanel.r, softPanel.g, softPanel.b);
          doc.roundedRect(72, pageY - 12, width - 144, 76, 10, 10, "F");

          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.setTextColor(brandPrimary.r, brandPrimary.g, brandPrimary.b);
          doc.text(DIMENSION_LABELS[item.dimension] ?? item.dimension, 88, pageY + 4);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(11);
          doc.setTextColor(brandText.r, brandText.g, brandText.b);
          if (item.question) {
            const questionLines = doc.splitTextToSize(item.question, width - 192);
            questionLines.forEach((line: string) => {
              ensureSpace(14);
              doc.text(line, 88, pageY + 20);
              pageY += 14;
            });
          } else {
            pageY += 12;
          }

          const answerLines = doc.splitTextToSize(item.answer, width - 192);
          answerLines.forEach((line: string) => {
            doc.text(line, 88, pageY + 22);
            pageY += 14;
          });
          pageY += 34;
        });
      }

      const fileDate = new Date(exportResult.created_at).toISOString().split("T")[0];
      doc.save(`beyond-care-assessment-${fileDate}.pdf`);
      toast.success("PDF téléchargé");
    } catch (error) {
      console.error("[mental-health-player] pdf export", error);
      toast.error("Impossible de générer le PDF.");
    }
  };

  const isSoftSkills = questionnaire.title?.toLowerCase().includes("soft skills");

  const renderIntro = () => (
    <div className="space-y-8">
      <Card className="overflow-hidden border-0 bg-white shadow-[0_25px_65px_rgba(201,20,89,0.18)]">
        <div className="relative h-64 w-full">
          <Image
            src={introHeroImage}
            alt="Homme et femme souriants dans une lumière naturelle"
            fill
            className="object-cover"
            priority
            unoptimized
            sizes="(min-width: 1280px) 1280px, 100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>
        <CardHeader className="space-y-3 text-center">
          <Badge 
            className="mx-auto w-fit rounded-full px-4 py-1 text-xs font-semibold"
            style={{ 
              backgroundColor: `${brandColor}1A`, 
              color: brandColor 
            }}
          >
            {isJessicaContentin ? "Cabinet Contentin" : "Beyond Care"} · Préparation
          </Badge>
          <CardTitle 
            className="text-3xl font-semibold tracking-tight"
            style={{ color: brandColor }}
          >
            {questionnaire.title}
          </CardTitle>
          {questionnaire.description ? (
            <CardDescription 
              className="mx-auto max-w-2xl"
              style={{ color: textSecondaryColor }}
            >
              {questionnaire.description}
            </CardDescription>
          ) : (
            <CardDescription 
              className="mx-auto max-w-2xl"
              style={{ color: textSecondaryColor }}
            >
              Prenez quelques minutes pour répondre aux questions et recevoir un retour personnalisé sur votre fonctionnement naturel.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6 text-sm" style={{ color: textColor }}>
          <div className="grid gap-4 md:grid-cols-3">
            <div 
              className="flex items-center gap-3 rounded-2xl p-4"
              style={{ backgroundColor }}
            >
              <Clock className="h-5 w-5" style={{ color: brandColor }} />
              <div>
                <p className="font-semibold" style={{ color: brandColor }}>Durée</p>
                <p className="text-xs" style={{ color: textSecondaryColor }}>Environ 6 minutes</p>
              </div>
            </div>
            <div 
              className="flex items-center gap-3 rounded-2xl p-4"
              style={{ backgroundColor }}
            >
              <BookOpen className="h-5 w-5" style={{ color: brandColor }} />
              <div>
                <p className="font-semibold" style={{ color: brandColor }}>Format</p>
                <p className="text-xs" style={{ color: textSecondaryColor }}>Échelle de 1 à 5 — soyez spontané·e</p>
              </div>
            </div>
            <div 
              className="flex items-center gap-3 rounded-2xl p-4"
              style={{ backgroundColor }}
            >
              <Sparkles className="h-5 w-5" style={{ color: brandColor }} />
              <div>
                <p className="font-semibold" style={{ color: brandColor }}>Résultat</p>
                <p className="text-xs" style={{ color: textSecondaryColor }}>Analyse personnalisée & recommandations</p>
              </div>
            </div>
          </div>

          {history.length > 0 ? (
            <div 
              className="rounded-3xl border p-6 shadow-inner"
              style={{ 
                borderColor: secondaryColor, 
                backgroundColor: backgroundColor 
              }}
            >
              <h3 className="text-sm font-semibold" style={{ color: brandColor }}>Vos derniers bilans</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {history.slice(0, 2).map((assessment) => (
                  <div key={assessment.id} className="rounded-2xl bg-white/80 p-4 shadow">
                    <div 
                      className="flex items-center justify-between text-xs"
                      style={{ color: `${textSecondaryColor}CC` }}
                    >
                      <span>Analyse</span>
                      <span>{new Date(assessment.created_at).toLocaleDateString("fr-FR")}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span 
                        className="text-2xl font-semibold"
                        style={{ color: brandColor }}
                      >
                        {Math.round(assessment.overall_score)}/100
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        style={{ color: brandColor }}
                        onClick={() => setActiveResult(assessment)}
                      >
                        Voir le détail
                      </Button>
                    </div>
                    <p 
                      className="mt-2 text-xs"
                      style={{ color: textSecondaryColor }}
                    >
                      {assessment.analysis_summary ??
                        "Analyse enregistrée — consultez le détail pour découvrir vos axes de progression."}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div 
              className="rounded-3xl border border-dashed p-6 text-center"
              style={{ 
                borderColor: secondaryColor, 
                backgroundColor: backgroundColor 
              }}
            >
              <p 
                className="text-sm"
                style={{ color: textSecondaryColor }}
              >
                Vous n'avez pas encore de résultat enregistré. Répondez au questionnaire pour recevoir votre premier bilan {isJessicaContentin ? "Contentin" : "Beyond Care"}.
              </p>
            </div>
          )}

          <div className="flex justify-center">
            <Button 
              className="px-8 text-white shadow-lg" 
              size="lg" 
              style={{ 
                backgroundColor: brandColor,
                color: "white"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = hoverColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = brandColor;
              }}
              onClick={handleStart}
            >
              Commencer le test
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderQuestion = () => {
    if (!currentQuestion) return null;
    const currentValue = answers[currentQuestion.id];
    const questionType = currentQuestion.question_type;
    const likert = currentQuestion.likert_scale ?? { min: 1, max: 5 };
    const values = Array.from({ length: likert.max - likert.min + 1 }, (_, index) => likert.min + index);
    const mediaUrl = currentQuestion.metadata?.media_url as string | undefined;
    const textValue = typeof currentValue === "string" ? currentValue : "";
    const options = currentQuestion.options ?? [];

    // Layout en 2 colonnes pour Jessica CONTENTIN (questions à gauche, image à droite)
    // Layout en 2 colonnes pour Tim Darcy (image à gauche, questions à droite) - noir et blanc
    console.log("[renderQuestion] isJessicaContentin:", isJessicaContentin, "isTimDarcy:", isTimDarcy, "currentQuestion:", currentQuestion?.id);
    if (isTimDarcy) {
      console.log("[renderQuestion] ✅ Tim Darcy detected - using black & white layout with image on left, questions on right");
    } else if (isJessicaContentin) {
      console.log("[renderQuestion] ✅ Jessica CONTENTIN detected - using 2-column layout with questions on left, image on right");
    }
    if (isJessicaContentin || isTimDarcy) {
      console.log(`[renderQuestion] ✅ Using 2-column layout for ${isTimDarcy ? 'Tim Darcy' : 'Jessica CONTENTIN'}`);
      // Construire l'URL de l'image : utiliser media_url de la question ou une image par défaut
      // Le media_url crée un lien direct entre la question et l'image
      let imageUrl = mediaUrl;
      if (mediaUrl && !mediaUrl.startsWith('http')) {
        // Si c'est un chemin relatif, construire l'URL Supabase
        if (isJessicaContentin) {
          imageUrl = getSupabaseStorageUrl(JESSICA_BUCKET_NAME, mediaUrl);
        } else if (isTimDarcy) {
          // Pour Tim Darcy, on pourrait utiliser un bucket spécifique si nécessaire
          // Pour l'instant, on utilisera les images par défaut qui changent selon la question
          imageUrl = undefined;
        } else {
          imageUrl = undefined;
        }
      }
      if (!imageUrl) {
        if (isJessicaContentin) {
          // Image par défaut depuis le storage de Jessica CONTENTIN
          imageUrl = getSupabaseStorageUrl(JESSICA_BUCKET_NAME, "femme soleil.jpg");
        } else if (isTimDarcy) {
          // Pour Tim Darcy : images en couleur qui changent selon la question pour créer un lien visuel
          // Utiliser l'ID de la question ou l'index pour déterminer quelle image afficher
          // Cela crée un lien visuel entre chaque question et son image
          const questionHash = currentQuestion.id ? 
            currentQuestion.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 
            currentIndex;
          const imageIndex = questionHash % 5; // Cycle entre 5 images différentes
          const defaultImages = [
            "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop", // Collaboration
            "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop", // Leadership
            "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1932&auto=format&fit=crop", // Communication
            "https://images.unsplash.com/photo-1556761175-4b46a572b786?q=80&w=1974&auto=format&fit=crop", // Créativité
            "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2084&auto=format&fit=crop" // Organisation
          ];
          imageUrl = defaultImages[imageIndex];
        } else {
          imageUrl = "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop";
        }
      }

      // Pour Tim Darcy : image à gauche, questions à droite (inverse de Jessica)
      const isTimDarcyLayout = isTimDarcy;
      
      return (
        <div className="min-h-screen" style={{ backgroundColor: backgroundColor }}>
          <div className={`grid lg:grid-cols-2 min-h-screen ${isTimDarcyLayout ? '' : ''}`}>
            {/* Colonne gauche : Questions pour Jessica, Image pour Tim Darcy */}
            {isTimDarcyLayout ? (
              /* Image à gauche pour Tim Darcy - cachée sur mobile */
              <div className="hidden lg:block relative overflow-hidden bg-black">
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={imageUrl || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"}
                    alt={`Illustration pour la question ${currentIndex + 1}: ${currentQuestion.question_text?.substring(0, 100) || "Question Soft Skills"}`}
                    fill
                    className="object-cover transition-opacity duration-300"
                    priority={currentIndex === 0}
                    unoptimized={!!imageUrl && imageUrl.includes('supabase')}
                  />
                </motion.div>
              </div>
            ) : (
              /* Questions à gauche pour Jessica */
              <div className="bg-white p-4 sm:p-6 md:p-8 lg:p-12 xl:p-16 flex flex-col min-h-screen lg:min-h-0 overflow-y-auto">
              {/* Indicateur de progression */}
              <div className="mb-4 sm:mb-6 md:mb-8">
                <div className="flex gap-1 sm:gap-2 mb-2">
                  {Array.from({ length: totalQuestions }).map((_, index) => (
                    <div
                      key={index}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        index <= currentIndex
                          ? ""
                          : ""
                      }`}
                      style={{
                        backgroundColor: index <= currentIndex ? brandColor : secondaryColor
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs sm:text-sm" style={{ color: `${textColor}99` }}>
                  QUESTION {currentIndex + 1} SUR {totalQuestions}
                </p>
              </div>

              {/* Contenu de la question */}
              <div className="flex-1 flex flex-col overflow-y-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentQuestion.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1"
                  >
                    <div className="space-y-4 sm:space-y-6 md:space-y-8">
                      <div>
                        <h2 
                          className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 leading-tight"
                          style={{ color: textColor }}
                        >
                          {currentQuestion.question_text}
                        </h2>
                      </div>

                      {questionType === "likert" ? (
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
                          {values.map((value) => {
                            const isActive = currentValue === value;
                            const label = currentQuestion.likert_scale?.labels?.[String(value)];
                            return (
                              <button
                                key={value}
                                onClick={() => handleSelectAnswer(currentQuestion, value)}
                                className={`p-3 sm:p-4 md:p-5 lg:p-6 rounded-xl sm:rounded-2xl border-2 text-left transition-all ${
                                  isActive
                                    ? ""
                                    : ""
                                }`}
                                style={isActive ? {
                                  borderColor: brandColor,
                                  backgroundColor: `${brandColor}10`
                                } : {
                                  borderColor: secondaryColor,
                                  backgroundColor: "white"
                                }}
                                onMouseEnter={(e) => {
                                  if (!isActive) {
                                    e.currentTarget.style.borderColor = `${brandColor}80`;
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isActive) {
                                    e.currentTarget.style.borderColor = secondaryColor;
                                  }
                                }}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <span className="text-lg sm:text-xl md:text-2xl font-bold block mb-0.5 sm:mb-1" style={{ color: textColor }}>
                                      {value}
                                    </span>
                                    {label && (
                                      <span className="text-xs sm:text-sm block leading-tight" style={{ color: `${textColor}80` }}>
                                        {label}
                                      </span>
                                    )}
                                  </div>
                                  <div
                                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                      isActive ? "" : ""
                                    }`}
                                    style={isActive ? {
                                      borderColor: brandColor,
                                      backgroundColor: brandColor
                                    } : {
                                      borderColor: secondaryColor
                                    }}
                                  >
                                    {isActive && (
                                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white" />
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : null}

                      {questionType === "single_choice" ? (
                        <div className="space-y-2 sm:space-y-3 md:space-y-4">
                          {options.map((option) => {
                            const isActive = String(currentValue ?? "") === option.value;
                            return (
                              <button
                                key={option.value}
                                onClick={() => handleSelectAnswer(currentQuestion, option.value)}
                                className={`w-full p-3 sm:p-4 md:p-5 lg:p-6 rounded-xl sm:rounded-2xl border-2 text-left transition-all ${
                                  isActive ? "" : ""
                                }`}
                                style={isActive ? {
                                  borderColor: brandColor,
                                  backgroundColor: `${brandColor}10`
                                } : {
                                  borderColor: secondaryColor,
                                  backgroundColor: "white"
                                }}
                                onMouseEnter={(e) => {
                                  if (!isActive) {
                                    e.currentTarget.style.borderColor = `${brandColor}80`;
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isActive) {
                                    e.currentTarget.style.borderColor = secondaryColor;
                                  }
                                }}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm sm:text-base md:text-lg font-medium flex-1" style={{ color: textColor }}>
                                    {option.label}
                                  </span>
                                  <div
                                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                      isActive ? "" : ""
                                    }`}
                                    style={isActive ? {
                                      borderColor: brandColor,
                                      backgroundColor: brandColor
                                    } : {
                                      borderColor: secondaryColor
                                    }}
                                  >
                                    {isActive && (
                                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white" />
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : null}

                        {questionType === "text" ? (
                          <div className="space-y-2 sm:space-y-3 md:space-y-4">
                            <textarea
                              className="w-full rounded-xl sm:rounded-2xl border-2 p-3 sm:p-4 text-sm sm:text-base focus:outline-none resize-none"
                              style={{
                                borderColor: secondaryColor,
                                color: textColor
                              }}
                              onFocus={(e) => {
                                e.currentTarget.style.borderColor = brandColor;
                              }}
                              onBlur={(e) => {
                                e.currentTarget.style.borderColor = secondaryColor;
                              }}
                              rows={4}
                              placeholder="Écris ta réponse en quelques phrases..."
                              value={textValue}
                              onChange={(event) => handleTextAnswer(currentQuestion, event.target.value)}
                              maxLength={600}
                              disabled={submitting}
                            />
                            <p className="text-xs sm:text-sm" style={{ color: `${textColor}99` }}>
                              {textValue.length}/600 caractères
                            </p>
                          </div>
                        ) : null}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Boutons de navigation */}
                <div className="flex justify-between gap-2 sm:gap-4 mt-6 sm:mt-8 md:mt-12 pt-4 sm:pt-6 border-t border-gray-100">
                  {currentIndex > 0 && (
                    <Button
                      variant="outline"
                      onClick={handlePrev}
                      disabled={submitting}
                      className="rounded-full px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-6 border-2 text-sm sm:text-base"
                      style={{
                        borderColor: secondaryColor,
                        color: textColor
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = backgroundColor;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <ChevronLeft className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="hidden sm:inline">Précédent</span>
                      <span className="sm:hidden">Préc.</span>
                    </Button>
                  )}
                  <div className="flex-1" />
                  {currentIndex < totalQuestions - 1 && (questionType === "text" || canGoNext) ? (
                    <Button
                      onClick={handleNext}
                      disabled={!canGoNext || submitting}
                      className="rounded-full px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-6 text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                      style={{
                        backgroundColor: brandColor
                      }}
                      onMouseEnter={(e) => {
                        if (!e.currentTarget.disabled) {
                          e.currentTarget.style.backgroundColor = hoverColor;
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = brandColor;
                      }}
                    >
                      Continuer
                      <ChevronRight className="ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  ) : null}
                  {currentIndex === totalQuestions - 1 && (
                    <Button
                      onClick={() => handleSubmit()}
                      disabled={!canGoNext || submitting}
                      className="rounded-full px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-6 text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                      style={{
                        backgroundColor: brandColor
                      }}
                      onMouseEnter={(e) => {
                        if (!e.currentTarget.disabled) {
                          e.currentTarget.style.backgroundColor = hoverColor;
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = brandColor;
                      }}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                          <span className="hidden sm:inline">Analyse en cours</span>
                          <span className="sm:hidden">Analyse...</span>
                        </>
                      ) : (
                        <>
                          Terminer
                          <CheckCircle2 className="ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
              </div>
            )}

            {/* Colonne droite : Image pour Jessica, Questions pour Tim Darcy */}
            {isTimDarcyLayout ? (
              /* Questions à droite pour Tim Darcy - pleine largeur sur mobile */
              <div className="bg-white p-4 sm:p-6 md:p-8 lg:p-12 xl:p-16 flex flex-col min-h-screen lg:min-h-0 lg:col-span-1">
                {/* Indicateur de progression */}
                <div className="mb-4 sm:mb-6 md:mb-8">
                  <div className="flex gap-1 sm:gap-2 mb-2">
                    {Array.from({ length: totalQuestions }).map((_, index) => (
                      <div
                        key={index}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          index <= currentIndex
                            ? ""
                            : ""
                        }`}
                        style={{
                          backgroundColor: index <= currentIndex ? "#000000" : "#E5E5E5"
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm" style={{ color: "#666666" }}>
                    QUESTION {currentIndex + 1} SUR {totalQuestions}
                  </p>
                </div>

                {/* Contenu de la question */}
                <div className="flex-1 flex flex-col overflow-y-auto">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentQuestion.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="flex-1"
                    >
                      <div className="space-y-4 sm:space-y-6 md:space-y-8">
                        <div>
                          <h2 
                            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 leading-tight"
                            style={{ color: "#000000" }}
                          >
                            {currentQuestion.question_text}
                          </h2>
                        </div>

                        {questionType === "likert" ? (
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
                            {values.map((value) => {
                              const isActive = currentValue === value;
                              const label = currentQuestion.likert_scale?.labels?.[String(value)];
                              return (
                                <button
                                  key={value}
                                  onClick={() => handleSelectAnswer(currentQuestion, value)}
                                  className={`p-3 sm:p-4 md:p-5 lg:p-6 rounded-xl sm:rounded-2xl border-2 text-left transition-all ${
                                    isActive
                                      ? ""
                                      : ""
                                  }`}
                                  style={isActive ? {
                                    borderColor: "#000000",
                                    backgroundColor: "#F5F5F5"
                                  } : {
                                    borderColor: "#E5E5E5",
                                    backgroundColor: "white"
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!isActive) {
                                      e.currentTarget.style.borderColor = "#666666";
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!isActive) {
                                      e.currentTarget.style.borderColor = "#E5E5E5";
                                    }
                                  }}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <span className="text-lg sm:text-xl md:text-2xl font-bold block mb-0.5 sm:mb-1" style={{ color: "#000000" }}>
                                        {value}
                                      </span>
                                      {label && (
                                        <span className="text-xs sm:text-sm block leading-tight" style={{ color: "#666666" }}>
                                          {label}
                                        </span>
                                      )}
                                    </div>
                                    <div
                                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                        isActive ? "" : ""
                                      }`}
                                      style={isActive ? {
                                        borderColor: "#000000",
                                        backgroundColor: "#000000"
                                      } : {
                                        borderColor: "#E5E5E5"
                                      }}
                                    >
                                      {isActive && (
                                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white" />
                                      )}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : null}

                        {questionType === "single_choice" ? (
                          <div className="space-y-2 sm:space-y-3 md:space-y-4">
                            {options.map((option) => {
                              const isActive = String(currentValue ?? "") === option.value;
                              return (
                                <button
                                  key={option.value}
                                  onClick={() => handleSelectAnswer(currentQuestion, option.value)}
                                  className={`w-full p-3 sm:p-4 md:p-5 lg:p-6 rounded-xl sm:rounded-2xl border-2 text-left transition-all ${
                                    isActive ? "" : ""
                                  }`}
                                  style={isActive ? {
                                    borderColor: "#000000",
                                    backgroundColor: "#F5F5F5"
                                  } : {
                                    borderColor: "#E5E5E5",
                                    backgroundColor: "white"
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!isActive) {
                                      e.currentTarget.style.borderColor = "#666666";
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!isActive) {
                                      e.currentTarget.style.borderColor = "#E5E5E5";
                                    }
                                  }}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm sm:text-base md:text-lg font-medium flex-1" style={{ color: "#000000" }}>
                                      {option.label}
                                    </span>
                                    <div
                                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                        isActive ? "" : ""
                                      }`}
                                      style={isActive ? {
                                        borderColor: "#000000",
                                        backgroundColor: "#000000"
                                      } : {
                                        borderColor: "#E5E5E5"
                                      }}
                                    >
                                      {isActive && (
                                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white" />
                                      )}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : null}

                        {questionType === "text" ? (
                          <div className="space-y-2 sm:space-y-3 md:space-y-4">
                            <textarea
                              className="w-full rounded-xl sm:rounded-2xl border-2 p-3 sm:p-4 text-sm sm:text-base focus:outline-none resize-none"
                              style={{
                                borderColor: "#E5E5E5",
                                color: "#000000"
                              }}
                              onFocus={(e) => {
                                e.currentTarget.style.borderColor = "#000000";
                              }}
                              onBlur={(e) => {
                                e.currentTarget.style.borderColor = "#E5E5E5";
                              }}
                              rows={4}
                              placeholder="Écris ta réponse en quelques phrases..."
                              value={textValue}
                              onChange={(event) => handleTextAnswer(currentQuestion, event.target.value)}
                              maxLength={600}
                              disabled={submitting}
                            />
                            <p className="text-xs sm:text-sm" style={{ color: "#666666" }}>
                              {textValue.length}/600 caractères
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Boutons de navigation */}
                  <div className="flex justify-between gap-2 sm:gap-4 mt-6 sm:mt-8 md:mt-12 pt-4 sm:pt-6 border-t border-gray-100">
                    {currentIndex > 0 && (
                      <Button
                        variant="outline"
                        onClick={handlePrev}
                        disabled={submitting}
                        className="rounded-full px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-6 border-2 text-sm sm:text-base"
                        style={{
                          borderColor: "#E5E5E5",
                          color: "#000000"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#F5F5F5";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <ChevronLeft className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden sm:inline">Précédent</span>
                        <span className="sm:hidden">Préc.</span>
                      </Button>
                    )}
                    <div className="flex-1" />
                    {currentIndex < totalQuestions - 1 && (questionType === "text" || canGoNext) ? (
                      <Button
                        onClick={handleNext}
                        disabled={!canGoNext || submitting}
                        className="rounded-full px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-6 text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        style={{
                          backgroundColor: "#000000"
                        }}
                        onMouseEnter={(e) => {
                          if (!e.currentTarget.disabled) {
                            e.currentTarget.style.backgroundColor = "#333333";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#000000";
                        }}
                      >
                        Continuer
                        <ChevronRight className="ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    ) : null}
                    {currentIndex === totalQuestions - 1 && (
                      <Button
                        onClick={() => handleSubmit()}
                        disabled={!canGoNext || submitting}
                        className="rounded-full px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-6 text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        style={{
                          backgroundColor: "#000000"
                        }}
                        onMouseEnter={(e) => {
                          if (!e.currentTarget.disabled) {
                            e.currentTarget.style.backgroundColor = "#333333";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#000000";
                        }}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                            <span className="hidden sm:inline">Analyse en cours</span>
                            <span className="sm:hidden">Analyse...</span>
                          </>
                        ) : (
                          <>
                            Terminer
                            <CheckCircle2 className="ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Image à droite pour Jessica */
              <div className="hidden lg:block relative overflow-hidden">
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={imageUrl}
                    alt={`Illustration pour la question ${currentIndex + 1}: ${currentQuestion.question_text?.substring(0, 100) || "Question"}`}
                    fill
                    className="object-cover transition-opacity duration-300"
                    priority={currentIndex === 0}
                    unoptimized={!!imageUrl && imageUrl.includes('supabase')}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      // Si l'image par défaut échoue, essayer une autre image du storage
                      if (target.src.includes('femme soleil')) {
                        target.src = getSupabaseStorageUrl(JESSICA_BUCKET_NAME, "mere enfant.jpg");
                      } else if (target.src.includes('mere enfant')) {
                        target.src = getSupabaseStorageUrl(JESSICA_BUCKET_NAME, "couche soleil.png");
                      } else if (target.src.includes('couche soleil')) {
                        target.src = getSupabaseStorageUrl(JESSICA_BUCKET_NAME, "Couple.png");
                      }
                    }}
                  />
                </motion.div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Layout original (centré) pour Beyond
    return (
      <div className="flex min-h-[75vh] flex-col items-center justify-center">
        <div className="w-full max-w-3xl space-y-6">
          <div 
            className="flex items-center justify-between text-sm"
            style={{ color: `${textSecondaryColor}B3` }}
          >
            <span>
              Question {currentIndex + 1}/{totalQuestions}
            </span>
            <div 
              className="h-1.5 w-40 overflow-hidden rounded-full"
              style={{ backgroundColor: secondaryColor }}
            >
              <div 
                className="h-full rounded-full" 
                style={{ 
                  width: `${progress}%`, 
                  transition: "width 0.4s ease",
                  backgroundColor: brandColor
                }} 
              />
            </div>
          </div>

          <Card className="border-0 bg-white shadow-[0_25px_55px_rgba(0,0,0,0.08)]">
            {mediaUrl && (
              <div className="relative h-56 w-full overflow-hidden rounded-t-3xl">
                <Image
                  src={mediaUrl}
                  alt=""
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                  sizes="(min-width: 1024px) 640px, 100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-transparent" />
              </div>
            )}
            <CardContent
              className={cn(
                "space-y-6 rounded-3xl px-6 py-8 text-center",
                mediaUrl ? "pt-6" : "pt-10",
              )}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                >
                  <p 
                    className="text-2xl font-semibold leading-relaxed"
                    style={{ color: textColor }}
                  >
                    {currentQuestion.question_text}
                  </p>
                </motion.div>
              </AnimatePresence>

              {questionType === "likert" ? (
                <div className="mt-6 grid gap-3 justify-items-center md:grid-cols-5">
                  {values.map((value) => {
                    const isActive = currentValue === value;
                    const label = currentQuestion.likert_scale?.labels?.[String(value)];
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleSelectAnswer(currentQuestion, value)}
                        className={cn(
                          "group flex w-full max-w-[120px] flex-col items-center gap-2 rounded-2xl border p-4 text-sm transition-all duration-200",
                          isActive ? "" : ""
                        )}
                        style={isActive ? {
                          borderColor: brandColor,
                          backgroundColor: backgroundColor,
                          color: brandColor,
                          boxShadow: `0 12px 28px ${brandColor}2E`
                        } : {
                          borderColor: secondaryColor,
                          backgroundColor: "white",
                          color: textSecondaryColor
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.borderColor = `${brandColor}66`;
                            e.currentTarget.style.backgroundColor = backgroundColor;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.borderColor = secondaryColor;
                            e.currentTarget.style.backgroundColor = "white";
                          }
                        }}
                      >
                        <span className="text-lg font-semibold">{value}</span>
                        <span 
                          className="text-xs"
                          style={{ color: `${textSecondaryColor}CC` }}
                        >
                          {label ?? " "}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {questionType === "single_choice" ? (
                <div className="mt-6 grid gap-3">
                  {options.map((option) => {
                    const isActive = String(currentValue ?? "") === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleSelectAnswer(currentQuestion, option.value)}
                        className="flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left text-sm transition-all duration-200"
                        style={isActive ? {
                          borderColor: brandColor,
                          backgroundColor: backgroundColor,
                          color: brandColor,
                          boxShadow: `0 12px 28px ${brandColor}2E`
                        } : {
                          borderColor: secondaryColor,
                          backgroundColor: "white",
                          color: textSecondaryColor
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.borderColor = `${brandColor}66`;
                            e.currentTarget.style.backgroundColor = backgroundColor;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.borderColor = secondaryColor;
                            e.currentTarget.style.backgroundColor = "white";
                          }
                        }}
                      >
                        <span className="font-semibold">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {questionType === "text" ? (
                <div className="mt-6">
                  <textarea
                    className="w-full rounded-2xl border bg-white/70 p-4 text-sm focus:outline-none focus:ring-2"
                    style={{
                      borderColor: secondaryColor,
                      color: textColor
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = brandColor;
                      e.currentTarget.style.boxShadow = `0 0 0 2px ${brandColor}66`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = secondaryColor;
                      e.currentTarget.style.boxShadow = "none";
                    }}
                    rows={4}
                    placeholder="Écris ta réponse en quelques phrases..."
                    value={textValue}
                    onChange={(event) => handleTextAnswer(currentQuestion, event.target.value)}
                    maxLength={600}
                    disabled={submitting}
                  />
                  <p 
                    className="mt-2 text-xs"
                    style={{ color: `${textSecondaryColor}99` }}
                  >
                    {textValue.length}/600 caractères
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="mt-6 flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-between">
            <Button 
              variant="ghost" 
              style={{ 
                color: brandColor
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = backgroundColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              onClick={handlePrev} 
              disabled={submitting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>

            {currentIndex < totalQuestions - 1 && questionType === "text" ? (
              <Button
                className="px-6 text-white"
                style={{
                  backgroundColor: brandColor
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = hoverColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = brandColor;
                }}
                onClick={handleNext}
                disabled={!canGoNext || submitting}
              >
                Continuer
              </Button>
            ) : null}

            {currentIndex === totalQuestions - 1 && (
              <Button
                className="px-6 text-white"
                style={{
                  backgroundColor: brandColor
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = hoverColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = brandColor;
                }}
                onClick={() => handleSubmit()}
                disabled={!canGoNext || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyse en cours
                  </>
                ) : (
                  <>
                    Terminer
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderResult = () => {
    const result = activeResult ?? latestHistory;
    if (!result) {
      return (
        <Card 
          className="border border-dashed bg-white text-center shadow-none"
          style={{ borderColor: secondaryColor }}
        >
          <CardHeader>
            <CardTitle style={{ color: brandColor }}>Aucun résultat disponible</CardTitle>
            <CardDescription style={{ color: textSecondaryColor }}>
              Complétez le questionnaire pour recevoir votre analyse personnalisée {isJessicaContentin ? "Contentin" : "Beyond Care"}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="text-white"
              style={{
                backgroundColor: brandColor
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = hoverColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = brandColor;
              }}
              onClick={handleRetry}
            >
              Lancer le questionnaire
            </Button>
          </CardContent>
        </Card>
      );
    }

    const sortedDimensions = Object.entries(result.dimension_scores ?? {}).sort((a, b) => b[1] - a[1]);
    const qualitativeResponses = Array.isArray(result.metadata?.qualitative_responses)
      ? (result.metadata?.qualitative_responses as Array<{ dimension: string; answer: string; question?: string }>)
      : [];
    const choiceAnswers = Array.isArray(result.metadata?.choice_answers)
      ? (result.metadata?.choice_answers as Array<{ dimension: string; choice: string; question?: string; points?: number }>)
      : [];
    const aiRecommendations = Array.isArray(result.metadata?.ai_recommendations)
      ? (result.metadata?.ai_recommendations as string[])
      : [];
    const profileIntroduction =
      typeof result.metadata?.ai_profile_introduction === "string"
        ? (result.metadata?.ai_profile_introduction as string)
        : null;
    const aiStrengths = Array.isArray(result.metadata?.ai_strengths)
      ? (result.metadata?.ai_strengths as string[])
      : [];
    const aiImprovements = Array.isArray(result.metadata?.ai_improvement_opportunities)
      ? (result.metadata?.ai_improvement_opportunities as string[])
      : [];
    const aiCareerPaths = Array.isArray(result.metadata?.ai_career_paths)
      ? (result.metadata?.ai_career_paths as string[])
      : [];

    // Fonctions pour impression et partage LinkedIn
    const handlePrint = () => {
      window.print();
    };

    const handleShareLinkedIn = () => {
      const score = Math.round(result.overall_score);
      const text = `J'ai obtenu un score de ${score}/100 au test Soft Skills – Profil 360 de Jessica Contentin ! Découvrez votre profil de soft skills :`;
      const url = window.location.href;
      const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}`;
      window.open(linkedInUrl, '_blank', 'width=600,height=400');
    };

    return (
      <div className="space-y-8" style={{ backgroundColor: isJessicaContentin ? bgColor : undefined }}>
        <Card 
          className="border-0 shadow-[0_30px_70px_rgba(201,20,89,0.2)]"
          style={{ 
            backgroundColor: isJessicaContentin ? surfaceColor : 'white',
            boxShadow: isJessicaContentin ? `0_30px_70px_rgba(139,111,71,0.15)` : undefined
          }}
        >
          <CardHeader className="space-y-2 text-center">
            <Badge 
              className="mx-auto w-fit rounded-full px-4 py-1 text-xs font-semibold"
              style={{
                backgroundColor: `${brandColor}1A`,
                color: brandColor
              }}
            >
              Résultat {isJessicaContentin ? "Jessica Contentin" : "Beyond Care"}
            </Badge>
            <CardTitle 
              className="text-3xl font-semibold tracking-tight"
              style={{ color: brandColor }}
            >
              Analyse personnalisée
            </CardTitle>
            <CardDescription style={{ color: textSecondaryColor }}>
              {result.analysis_summary ??
                "Vos réponses permettent de cerner vos besoins naturels. Découvrez vos axes d’équilibre ci-dessous."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            <div className="flex flex-col items-center gap-4 md:flex-row md:items-end md:justify-between">
              <div className="text-center md:text-left">
                <p 
                  className="text-sm uppercase tracking-[0.4em]"
                  style={{ color: `${brandColor}99` }}
                >
                  Score global
                </p>
                <div className="mt-2 flex flex-wrap items-end gap-4">
                  <span 
                    className="text-6xl font-bold"
                    style={{ color: brandColor }}
                  >
                    {Math.round(result.overall_score)}
                    <span 
                      className="ml-1 text-2xl"
                      style={{ color: textSecondaryColor }}
                    >
                      /100
                    </span>
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em]",
                      result.overall_score >= 80
                        ? "bg-green-100 text-green-600"
                        : result.overall_score >= 60
                          ? "bg-emerald-100 text-emerald-600"
                          : result.overall_score >= 40
                            ? "bg-amber-100 text-amber-600"
                            : "bg-rose-100 text-rose-600",
                    )}
                  >
                    {result.overall_score >= 80
                      ? "équilibre élevé"
                      : result.overall_score >= 60
                        ? "équilibre présent"
                        : result.overall_score >= 40
                          ? "équilibre fragile"
                          : "vigilance forte"}
                  </span>
                </div>
                <p 
                  className="mt-3 text-sm"
                  style={{ color: textSecondaryColor }}
                >
                  <span 
                    className="font-semibold"
                    style={{ color: brandColor }}
                  >
                    Comment lire ce score ?
                  </span>{" "}
                  <span 
                    className="block text-sm"
                    style={{ color: `${textSecondaryColor}E6` }}
                  >
                    80-100 : fonctionnement très aligné • 60-79 : équilibre global, quelques points à surveiller • 40-59 : équilibre fragile, priorité aux axes indiqués • inférieur à 40 : vigilance, un accompagnement est recommandé.
                  </span>
                </p>
                <p 
                  className="mt-2 text-xs"
                  style={{ color: `${textSecondaryColor}CC` }}
                >
                  Analyse réalisée le {new Date(result.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button 
                  variant="ghost" 
                  style={{ 
                    color: brandColor
                  }}
                  onClick={handleRetry}
                >
                  Recommencer
                </Button>
                <Button
                  variant="outline"
                  style={{
                    borderColor: brandColor,
                    color: brandColor
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${brandColor}10`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  onClick={() => handleDownload(result)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exporter
                </Button>
                <Button
                  variant="outline"
                  style={{
                    borderColor: brandColor,
                    color: brandColor
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${brandColor}10`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  onClick={handlePrint}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimer
                </Button>
                <Button
                  variant="outline"
                  style={{
                    borderColor: brandColor,
                    color: brandColor
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${brandColor}10`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  onClick={handleShareLinkedIn}
                >
                  <Linkedin className="mr-2 h-4 w-4" />
                  Partager sur LinkedIn
                </Button>
                {isJessicaContentin ? (
                <Button 
                  asChild 
                    className="text-white"
                  style={{
                      backgroundColor: brandColor,
                      color: 'white'
                  }}
                  onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = hoverColor;
                  }}
                  onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = brandColor;
                    }}
                  >
                    <Link href="/jessica-contentin/mon-compte">Mon compte</Link>
                  </Button>
                ) : (
                  <>
                    <Button 
                      asChild 
                      className="text-white"
                      style={{
                        backgroundColor: brandColor,
                        color: 'white'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = hoverColor;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = brandColor;
                  }}
                >
                  <Link href="/dashboard/apprenant/beyond-care">Revenir à Beyond Care</Link>
                </Button>
                {result.id ? (
                  <Button
                    variant="outline"
                    style={{
                          borderColor: brandColor,
                          color: brandColor
                    }}
                    onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = `${brandColor}10`;
                    }}
                    onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    onClick={() => {
                      window.location.href = `/dashboard/catalogue/beyond-link?assessment=${result.id}`;
                    }}
                  >
                    Beyond Link
                  </Button>
                ) : null}
                  </>
                )}
              </div>
            </div>

            {profileIntroduction ? (
              <div 
                className="rounded-3xl border p-6 shadow-sm"
                style={{ 
                  borderColor: secondaryColor,
                  backgroundColor: isJessicaContentin ? surfaceColor : 'white'
                }}
              >
                <h3 
                  className="text-sm font-semibold uppercase tracking-[0.3em]"
                  style={{ color: `${brandColor}B3` }}
                >
                  Présentation du profil
                </h3>
                <p 
                  className="mt-3 text-sm leading-relaxed whitespace-pre-line"
                  style={{ color: textColor }}
                >
                  {profileIntroduction}
                </p>
              </div>
            ) : null}

            {sortedDimensions.length > 0 ? (
              <div 
                className="rounded-3xl border p-6 shadow-sm"
                style={{ 
                  borderColor: secondaryColor,
                  backgroundColor: isJessicaContentin ? surfaceColor : 'white'
                }}
              >
                <h3 
                  className="text-sm font-semibold uppercase tracking-[0.3em]"
                  style={{ color: `${brandColor}B3` }}
                >
                  Classement décroissant des dimensions
                </h3>
                <ol className="mt-4 space-y-4">
                  {sortedDimensions.map(([dimension, score], index) => (
                    <li 
                      key={dimension} 
                      className="space-y-2 rounded-2xl p-4"
                      style={{ backgroundColor }}
                    >
                      <div 
                        className="flex items-center justify-between text-sm font-semibold"
                        style={{ color: textColor }}
                      >
                        <div className="flex items-center gap-3">
                          <span 
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm"
                            style={{ color: brandColor }}
                          >
                            {index + 1}
                          </span>
                          <span>{DIMENSION_LABELS[dimension] ?? dimension}</span>
                        </div>
                        <span style={{ color: brandColor }}>{Math.round(score)} / 100</span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/80">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${Math.max(4, Math.min(100, Math.round(score)))}%`,
                            background: isJessicaContentin 
                              ? `linear-gradient(to right, ${brandColor}, ${accentColor})`
                              : `linear-gradient(to right, ${brandColor}, #f76f9d)`
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            <Card 
              className="border shadow-sm"
              style={{ 
                borderColor: secondaryColor,
                backgroundColor: isJessicaContentin ? surfaceColor : 'white'
              }}
            >
              <CardHeader className="text-left">
                <CardTitle style={{ color: brandColor }}>Répartition des dimensions</CardTitle>
                <CardDescription style={{ color: textSecondaryColor }}>
                  Plus la zone colorée est large, plus la dimension est soutenante pour toi.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {sortedDimensions.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      data={sortedDimensions.map(([dimension, score]) => ({
                        dimension: DIMENSION_LABELS[dimension] ?? dimension,
                        score: Math.round(score),
                      }))}
                      cx="50%"
                      cy="50%"
                      outerRadius="70%"
                    >
                      <PolarGrid stroke={secondaryColor} />
                      <PolarAngleAxis dataKey="dimension" tick={{ fill: textColor, fontSize: 12 }} />
                      <PolarRadiusAxis 
                        angle={30} 
                        domain={[0, 100]} 
                        tick={{ fill: isJessicaContentin ? textSecondaryColor : "#a84a70", fontSize: 10 }} 
                        stroke={secondaryColor} 
                      />
                      <Radar 
                        dataKey="score" 
                        stroke={brandColor} 
                        fill={brandColor} 
                        fillOpacity={0.32} 
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div 
                    className="flex h-full items-center justify-center text-sm"
                    style={{ color: `${textSecondaryColor}99` }}
                  >
                    Pas encore de données suffisantes pour afficher ce radar.
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              {sortedDimensions.map(([dimension, score]) => {
                const detail = result.analysis_details?.[dimension] as
                  | { message?: string; recommendations?: string[] }
                  | undefined;
                const message = detail?.message ?? scoreToMessage(dimension, score);
                const recommendations = Array.isArray(detail?.recommendations)
                  ? detail.recommendations
                      .filter((item) => typeof item === "string" && item.trim().length > 0)
                      .map((item) => item.trim())
                  : [];
                return (
                  <div
                    key={dimension}
                    className="rounded-3xl border p-6"
                    style={{
                      borderColor: secondaryColor,
                      backgroundColor: isJessicaContentin ? surfaceColor : backgroundColor,
                      boxShadow: `0 12px 32px ${brandColor}14`
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <p 
                        className="text-sm font-semibold uppercase tracking-[0.25em]"
                        style={{ color: `${brandColor}B3` }}
                      >
                        {DIMENSION_LABELS[dimension] ?? dimension}
                      </p>
                      <span 
                        className="rounded-full bg-white px-3 py-1 text-sm font-semibold"
                        style={{ color: brandColor }}
                      >
                        {Math.round(score)}/100
                      </span>
                    </div>
                    <p 
                      className="mt-3 text-sm leading-relaxed"
                      style={{ color: textSecondaryColor }}
                    >
                      {message}
                    </p>
                    {recommendations.length > 0 ? (
                      <ul 
                        className="mt-3 space-y-2 text-sm"
                        style={{ color: textColor }}
                      >
                        {recommendations.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span 
                              className="mt-1 h-2 w-2 flex-shrink-0 rounded-full"
                              style={{ backgroundColor: brandColor }}
                            />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {aiStrengths.length > 0 || aiImprovements.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {aiStrengths.length > 0 ? (
                  <div 
                    className="rounded-3xl border p-6 shadow-sm"
                    style={{ 
                      borderColor: secondaryColor,
                      backgroundColor: isJessicaContentin ? surfaceColor : 'white'
                    }}
                  >
                    <h3 
                      className="text-sm font-semibold uppercase tracking-[0.3em]"
                      style={{ color: `${brandColor}B3` }}
                    >
                      Points forts à consolider
                    </h3>
                    <ul 
                      className="mt-4 space-y-3 text-sm"
                      style={{ color: textColor }}
                    >
                      {aiStrengths.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span 
                            className="mt-1 inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
                            style={{ backgroundColor: brandColor }}
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {aiImprovements.length > 0 ? (
                  <div 
                    className="rounded-3xl border p-6 shadow-sm"
                    style={{ 
                      borderColor: secondaryColor,
                      backgroundColor: isJessicaContentin ? surfaceColor : 'white'
                    }}
                  >
                    <h3 
                      className="text-sm font-semibold uppercase tracking-[0.3em]"
                      style={{ color: `${brandColor}B3` }}
                    >
                      Axes d'amélioration prioritaires
                    </h3>
                    <ul className="mt-4 space-y-3 text-sm text-text-color">
                      {aiImprovements.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="mt-1 inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full bg-brand-color" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}

            {aiCareerPaths.length > 0 ? (
              <div 
                className="rounded-3xl border p-6 shadow-sm"
                style={{ 
                  borderColor: secondaryColor,
                  backgroundColor: isJessicaContentin ? surfaceColor : 'white'
                }}
              >
                <h3 
                  className="text-sm font-semibold uppercase tracking-[0.3em]"
                  style={{ color: `${brandColor}B3` }}
                >
                  Métiers ou études alignés avec tes soft skills
                </h3>
                <ul className="mt-4 space-y-3 text-sm text-text-color">
                  {aiCareerPaths.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="mt-1 inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full bg-brand-color" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {aiRecommendations.length > 0 ? (
              <div 
                className="rounded-3xl border p-6 shadow-sm"
                style={{ 
                  borderColor: secondaryColor,
                  backgroundColor: isJessicaContentin ? surfaceColor : 'white'
                }}
              >
                <h3 
                  className="text-sm font-semibold uppercase tracking-[0.3em]"
                  style={{ color: `${brandColor}B3` }}
                >
                  Recommandations globales
                </h3>
                <ul className="mt-4 space-y-3 text-sm text-text-color">
                  {aiRecommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="mt-1 inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full bg-brand-color" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {choiceAnswers.length > 0 ? (
              <div 
                className="rounded-3xl border p-6 shadow-sm"
                style={{ 
                  borderColor: secondaryColor,
                  backgroundColor: isJessicaContentin ? surfaceColor : 'white'
                }}
              >
                <h3 
                  className="text-sm font-semibold uppercase tracking-[0.3em]"
                  style={{ color: `${brandColor}B3` }}
                >
                  Tes préférences déclarées
                </h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {choiceAnswers.map((answer, idx) => (
                    <div 
                      key={`${answer.dimension}-${idx}`} 
                      className="rounded-2xl p-4 text-left"
                      style={{ backgroundColor }}
                    >
                      <p 
                        className="text-xs uppercase tracking-[0.35em]"
                        style={{ color: `${brandColor}99` }}
                      >
                        {DIMENSION_LABELS[answer.dimension] ?? answer.dimension}
                      </p>
                      {answer.question ? (
                        <p 
                          className="mt-2 text-xs font-semibold"
                          style={{ color: `${textSecondaryColor}CC` }}
                        >
                          {answer.question}
                        </p>
                      ) : null}
                      <p 
                        className="mt-2 text-sm font-semibold"
                        style={{ color: textColor }}
                      >
                        {answer.choice}
                      </p>
                      {typeof answer.points === "number" ? (
                        <p 
                          className="text-xs"
                          style={{ color: `${textSecondaryColor}B3` }}
                        >
                          {answer.points} point(s)
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {qualitativeResponses.length > 0 ? (
              <div 
                className="rounded-3xl border p-6 shadow-sm"
                style={{ 
                  borderColor: secondaryColor,
                  backgroundColor: isJessicaContentin ? surfaceColor : 'white'
                }}
              >
                <h3 
                  className="text-sm font-semibold uppercase tracking-[0.3em]"
                  style={{ color: `${brandColor}B3` }}
                >
                  Ce que tu as exprimé
                </h3>
                <div className="mt-4 space-y-4">
                  {qualitativeResponses.map((response, idx) => (
                    <div 
                      key={`${response.dimension}-${idx}`} 
                      className="rounded-2xl p-4 text-left"
                      style={{ backgroundColor }}
                    >
                      <p 
                        className="text-xs uppercase tracking-[0.35em]"
                        style={{ color: `${brandColor}99` }}
                      >
                        {DIMENSION_LABELS[response.dimension] ?? response.dimension}
                      </p>
                      {response.question ? (
                        <p 
                          className="mt-2 text-xs font-semibold"
                          style={{ color: `${textSecondaryColor}CC` }}
                        >
                          {response.question}
                        </p>
                      ) : null}
                      <p 
                        className="mt-2 text-sm leading-relaxed whitespace-pre-line"
                        style={{ color: textColor }}
                      >
                        {response.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card 
          className="border shadow-sm"
          style={{ 
            borderColor: secondaryColor,
            backgroundColor: isJessicaContentin ? surfaceColor : 'white'
          }}
        >
          <CardHeader>
            <CardTitle style={{ color: brandColor }}>Historique des analyses</CardTitle>
            <CardDescription style={{ color: textSecondaryColor }}>
              Retrouvez vos passations précédentes et observez l'évolution de vos scores.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {history.length === 0 ? (
              <p 
                className="text-sm"
                style={{ color: textSecondaryColor }}
              >
                Aucun résultat enregistré pour le moment.
              </p>
            ) : (
              <div className="space-y-4">
                {history.map((assessment) => (
                  <div
                    key={assessment.id}
                    className="flex flex-col gap-3 rounded-2xl border p-4 transition"
                    style={{
                      borderColor: assessment.id === result.id ? brandColor : secondaryColor,
                      backgroundColor: assessment.id === result.id 
                        ? (isJessicaContentin ? `${brandColor}15` : "#fef1f7")
                        : (isJessicaContentin ? surfaceColor : 'white'),
                      color: assessment.id === result.id ? brandColor : textSecondaryColor,
                    }}
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-3">
                        <span 
                          className="rounded-full px-3 py-1 text-xs font-semibold"
                          style={{
                            backgroundColor: `${brandColor}10`,
                            color: brandColor
                          }}
                        >
                          {new Date(assessment.created_at).toLocaleDateString("fr-FR")}
                        </span>
                        <span className="text-lg font-semibold">
                          Score global : {Math.round(assessment.overall_score)}/100
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        style={{ color: brandColor }}
                        className=""
                        onClick={() => {
                          setActiveResult(assessment);
                          setPhase("result");
                        }}
                      >
                        Consulter
                      </Button>
                    </div>
                    <p className="text-xs md:text-sm">
                      {assessment.analysis_summary ??
                        "Analyse enregistrée. Cliquez sur « Consulter » pour afficher les détails complets."}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const containerClass = cn(
    "relative min-h-screen px-4 pb-16",
    isSoftSkills && !isJessicaContentin && !isTimDarcy && "soft-skills-monochrome",
  );
  const containerStyle = isTimDarcy
    ? { background: "#FFFFFF", color: "#000000" }
    : isSoftSkills && !isJessicaContentin 
      ? { background: "#050505", color: "#f5f5f5" } 
      : isJessicaContentin 
        ? { background: bgColor, color: textColor }
        : { background: "linear-gradient(to bottom, white, white)" };

  // Pour Jessica CONTENTIN et Tim Darcy en phase questions, le layout est géré directement dans renderQuestion()
  // Pour les autres phases (intro, result), on utilise le layout normal
  if ((isJessicaContentin || isTimDarcy) && phase === "questions") {
    return renderQuestion();
  }

  return (
    <div className={containerClass} style={containerStyle}>
      <div className="mx-auto w-full max-w-4xl space-y-8 pt-10">
        {phase === "intro" && renderIntro()}
        {phase === "questions" && renderQuestion()}
        {phase === "result" && renderResult()}
      </div>
    </div>
  );
}

// Fonction utilitaire pour convertir un score en message
function scoreToMessage(dimension: string, score: number) {
  let thresholds = DIMENSION_MESSAGES[dimension as keyof typeof DIMENSION_MESSAGES];
  if (!thresholds) {
    thresholds = DIMENSION_MESSAGES.coping_naturel;
  }

  if (score >= 70) return thresholds.high;
  if (score >= 45) return thresholds.medium;
  return thresholds.low;
}


