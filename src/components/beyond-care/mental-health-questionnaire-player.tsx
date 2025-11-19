'use client';

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, BookOpen, CheckCircle2, Clock, Download, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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

const brandColor = "#c91459";
const introHeroImage =
  "https://images.unsplash.com/photo-1524502397800-09d3eff08e04?auto=format&fit=crop&w=1600&q=80";
const pdfBrandGradient = {
  start: [255, 240, 246],
  end: [255, 255, 255],
};

export function MentalHealthQuestionnairePlayer({ questionnaire, assessments }: PlayerProps) {
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
          <Badge className="mx-auto w-fit rounded-full bg-[#c91459]/10 px-4 py-1 text-xs font-semibold text-[#c91459]">
            Beyond Care · Préparation
          </Badge>
          <CardTitle className="text-3xl font-semibold tracking-tight text-[#c91459]">
            {questionnaire.title}
          </CardTitle>
          {questionnaire.description ? (
            <CardDescription className="mx-auto max-w-2xl text-[#7b2a49]">
              {questionnaire.description}
            </CardDescription>
          ) : (
            <CardDescription className="mx-auto max-w-2xl text-[#7b2a49]">
              Prenez quelques minutes pour répondre aux questions et recevoir un retour personnalisé sur votre fonctionnement naturel.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6 text-sm text-[#5a1d35]">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 rounded-2xl bg-[#fef5f9] p-4">
              <Clock className="h-5 w-5 text-[#c91459]" />
              <div>
                <p className="font-semibold text-[#c91459]">Durée</p>
                <p className="text-xs text-[#7b2a49]">Environ 6 minutes</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-[#fef5f9] p-4">
              <BookOpen className="h-5 w-5 text-[#c91459]" />
              <div>
                <p className="font-semibold text-[#c91459]">Format</p>
                <p className="text-xs text-[#7b2a49]">Échelle de 1 à 5 — soyez spontané·e</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-[#fef5f9] p-4">
              <Sparkles className="h-5 w-5 text-[#c91459]" />
              <div>
                <p className="font-semibold text-[#c91459]">Résultat</p>
                <p className="text-xs text-[#7b2a49]">Analyse personnalisée & recommandations</p>
              </div>
            </div>
          </div>

          {history.length > 0 ? (
            <div className="rounded-3xl border border-[#f6cada] bg-[#fff7fb] p-6 shadow-inner">
              <h3 className="text-sm font-semibold text-[#c91459]">Vos derniers bilans</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {history.slice(0, 2).map((assessment) => (
                  <div key={assessment.id} className="rounded-2xl bg-white/80 p-4 shadow">
                    <div className="flex items-center justify-between text-xs text-[#7b2a49]/80">
                      <span>Analyse</span>
                      <span>{new Date(assessment.created_at).toLocaleDateString("fr-FR")}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-2xl font-semibold text-[#c91459]">
                        {Math.round(assessment.overall_score)}/100
                      </span>
                      <Button variant="ghost" size="sm" className="text-[#c91459]" onClick={() => setActiveResult(assessment)}>
                        Voir le détail
                      </Button>
                    </div>
                    <p className="mt-2 text-xs text-[#7b2a49]">
                      {assessment.analysis_summary ??
                        "Analyse enregistrée — consultez le détail pour découvrir vos axes de progression."}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-[#f6cada] bg-[#fff7fb] p-6 text-center">
              <p className="text-sm text-[#7b2a49]">
                Vous n’avez pas encore de résultat enregistré. Répondez au questionnaire pour recevoir votre premier bilan Beyond Care.
              </p>
            </div>
          )}

          <div className="flex justify-center">
            <Button className="bg-[#c91459] px-8 text-white shadow-lg hover:bg-[#b2124f]" size="lg" onClick={handleStart}>
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

    return (
      <div className="flex min-h-[75vh] flex-col items-center justify-center">
        <div className="w-full max-w-3xl space-y-6">
          <div className="flex items-center justify-between text-sm text-[#7b2a49]/70">
            <span>
              Question {currentIndex + 1}/{totalQuestions}
            </span>
            <div className="h-1.5 w-40 overflow-hidden rounded-full bg-[#fbd8e7]">
              <div className="h-full rounded-full bg-[#c91459]" style={{ width: `${progress}%`, transition: "width 0.4s ease" }} />
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
                  <p className="text-2xl font-semibold leading-relaxed text-[#5a1d35]">
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
                          isActive
                            ? "border-[#c91459] bg-[#fef1f7] text-[#c91459] shadow-[0_12px_28px_rgba(201,20,89,0.18)]"
                            : "border-[#f4c1d2] bg-white text-[#7b2a49] hover:border-[#c91459]/40 hover:bg-[#fef5f9]",
                        )}
                      >
                        <span className="text-lg font-semibold">{value}</span>
                        <span className="text-xs text-[#7b2a49]/80">{label ?? " "}</span>
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
                        className={cn(
                          "flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left text-sm transition-all duration-200",
                          isActive
                            ? "border-[#c91459] bg-[#fef1f7] text-[#c91459] shadow-[0_12px_28px_rgba(201,20,89,0.18)]"
                            : "border-[#f4c1d2] bg-white text-[#7b2a49] hover:border-[#c91459]/40 hover:bg-[#fef5f9]",
                        )}
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
                    className="w-full rounded-2xl border border-[#f4c1d2] bg-white/70 p-4 text-sm text-[#5a1d35] focus:border-[#c91459] focus:outline-none focus:ring-2 focus:ring-[#c91459]/40"
                    rows={4}
                    placeholder="Écris ta réponse en quelques phrases..."
                    value={textValue}
                    onChange={(event) => handleTextAnswer(currentQuestion, event.target.value)}
                    maxLength={600}
                    disabled={submitting}
                  />
                  <p className="mt-2 text-xs text-[#7b2a49]/60">{textValue.length}/600 caractères</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="mt-6 flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-between">
            <Button variant="ghost" className="text-[#c91459] hover:bg-[#fef5f9]" onClick={handlePrev} disabled={submitting}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>

            {currentIndex < totalQuestions - 1 && questionType === "text" ? (
              <Button
                className="bg-[#c91459] px-6 text-white hover:bg-[#b2124f]"
                onClick={handleNext}
                disabled={!canGoNext || submitting}
              >
                Continuer
              </Button>
            ) : null}

            {currentIndex === totalQuestions - 1 && (
              <Button
                className="bg-[#c91459] px-6 text-white hover:bg-[#b2124f]"
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
        <Card className="border border-dashed border-[#f6cada] bg-white text-center shadow-none">
          <CardHeader>
            <CardTitle className="text-[#c91459]">Aucun résultat disponible</CardTitle>
            <CardDescription className="text-[#7b2a49]">
              Complétez le questionnaire pour recevoir votre analyse personnalisée Beyond Care.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="bg-[#c91459] text-white hover:bg-[#b2124f]" onClick={handleRetry}>
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

    return (
      <div className="space-y-8">
        <Card className="border-0 bg-white shadow-[0_30px_70px_rgba(201,20,89,0.2)]">
          <CardHeader className="space-y-2 text-center">
            <Badge className="mx-auto w-fit rounded-full bg-[#c91459]/10 px-4 py-1 text-xs font-semibold text-[#c91459]">
              Résultat Beyond Care
            </Badge>
            <CardTitle className="text-3xl font-semibold tracking-tight text-[#c91459]">Analyse personnalisée</CardTitle>
            <CardDescription className="text-[#7b2a49]">
              {result.analysis_summary ??
                "Vos réponses permettent de cerner vos besoins naturels. Découvrez vos axes d’équilibre ci-dessous."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            <div className="flex flex-col items-center gap-4 md:flex-row md:items-end md:justify-between">
              <div className="text-center md:text-left">
                <p className="text-sm uppercase tracking-[0.4em] text-[#c91459]/60">Score global</p>
                <div className="mt-2 flex flex-wrap items-end gap-4">
                  <span className="text-6xl font-bold text-[#c91459]">
                    {Math.round(result.overall_score)}
                    <span className="ml-1 text-2xl text-[#7b2a49]">/100</span>
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
                <p className="mt-3 text-sm text-[#7b2a49]">
                  <span className="font-semibold text-[#c91459]">Comment lire ce score ?</span>{" "}
                  <span className="block text-sm text-[#7b2a49]/90">
                    80-100 : fonctionnement très aligné • 60-79 : équilibre global, quelques points à surveiller • 40-59 : équilibre fragile, priorité aux axes indiqués • inférieur à 40 : vigilance, un accompagnement est recommandé.
                  </span>
                </p>
                <p className="mt-2 text-xs text-[#7b2a49]/80">
                  Analyse réalisée le {new Date(result.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="ghost" className={cn(isSoftSkills ? "text-white" : "text-[#c91459]")} onClick={handleRetry}>
                  Recommencer
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    "border-[#c91459] text-[#c91459]",
                    isSoftSkills && "border-white text-white hover:border-white hover:text-black",
                  )}
                  onClick={() => handleDownload(result)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exporter
                </Button>
                <Button asChild className={cn("bg-[#c91459] text-white hover:bg-[#b2124f]", isSoftSkills && "bg-white text-black")}>
                  <Link href="/dashboard/apprenant/beyond-care">Revenir à Beyond Care</Link>
                </Button>
                {result.id ? (
                  <Button
                    variant="outline"
                    className={cn(
                      "border-[#c91459] text-[#c91459]",
                      isSoftSkills && "border-white text-white hover:border-white hover:text-black",
                    )}
                    onClick={() => {
                      window.location.href = `/dashboard/catalogue/beyond-link?assessment=${result.id}`;
                    }}
                  >
                    Beyond Link
                  </Button>
                ) : null}
              </div>
            </div>

            {profileIntroduction ? (
              <div className="rounded-3xl border border-[#f6cada] bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-[#c91459]/70">
                  Présentation du profil
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#5a1d35] whitespace-pre-line">{profileIntroduction}</p>
              </div>
            ) : null}

            {sortedDimensions.length > 0 ? (
              <div className="rounded-3xl border border-[#f6cada] bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-[#c91459]/70">
                  Classement décroissant des dimensions
                </h3>
                <ol className="mt-4 space-y-4">
                  {sortedDimensions.map(([dimension, score], index) => (
                    <li key={dimension} className="space-y-2 rounded-2xl bg-[#fef5f9] p-4">
                      <div className="flex items-center justify-between text-sm font-semibold text-[#5a1d35]">
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#c91459] shadow-sm">
                            {index + 1}
                          </span>
                          <span>{DIMENSION_LABELS[dimension] ?? dimension}</span>
                        </div>
                        <span className="text-[#c91459]">{Math.round(score)} / 100</span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/80">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#c91459] to-[#f76f9d] transition-all duration-500"
                          style={{ width: `${Math.max(4, Math.min(100, Math.round(score)))}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            <Card className="border border-[#f6cada] bg-white shadow-sm">
              <CardHeader className="text-left">
                <CardTitle className="text-[#c91459]">Répartition des dimensions</CardTitle>
                <CardDescription className="text-[#7b2a49]">
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
                      <PolarGrid stroke="#f6cada" />
                      <PolarAngleAxis dataKey="dimension" tick={{ fill: "#5a1d35", fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#a84a70", fontSize: 10 }} stroke="#f6cada" />
                      <Radar dataKey="score" stroke="#c91459" fill="#c91459" fillOpacity={0.32} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-[#7b2a49]/60">
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
                    className="rounded-3xl border border-[#f6cada] bg-[#fef5f9] p-6 shadow-[0_12px_32px_rgba(201,20,89,0.08)]"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#c91459]/70">
                        {DIMENSION_LABELS[dimension] ?? dimension}
                      </p>
                      <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-[#c91459]">
                        {Math.round(score)}/100
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-[#7b2a49]">{message}</p>
                    {recommendations.length > 0 ? (
                      <ul className="mt-3 space-y-2 text-sm text-[#5a1d35]">
                        {recommendations.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-[#c91459]" />
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
                  <div className="rounded-3xl border border-[#f6cada] bg-white p-6 shadow-sm">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-[#c91459]/70">
                      Points forts à consolider
                    </h3>
                    <ul className="mt-4 space-y-3 text-sm text-[#5a1d35]">
                      {aiStrengths.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="mt-1 inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full bg-[#c91459]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {aiImprovements.length > 0 ? (
                  <div className="rounded-3xl border border-[#f6cada] bg-white p-6 shadow-sm">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-[#c91459]/70">
                      Axes d’amélioration prioritaires
                    </h3>
                    <ul className="mt-4 space-y-3 text-sm text-[#5a1d35]">
                      {aiImprovements.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="mt-1 inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full bg-[#c91459]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}

            {aiCareerPaths.length > 0 ? (
              <div className="rounded-3xl border border-[#f6cada] bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-[#c91459]/70">
                  Métiers ou études alignés avec tes soft skills
                </h3>
                <ul className="mt-4 space-y-3 text-sm text-[#5a1d35]">
                  {aiCareerPaths.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="mt-1 inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full bg-[#c91459]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {aiRecommendations.length > 0 ? (
              <div className="rounded-3xl border border-[#f6cada] bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-[#c91459]/70">
                  Recommandations globales
                </h3>
                <ul className="mt-4 space-y-3 text-sm text-[#5a1d35]">
                  {aiRecommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="mt-1 inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full bg-[#c91459]" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {choiceAnswers.length > 0 ? (
              <div className="rounded-3xl border border-[#f6cada] bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-[#c91459]/70">
                  Tes préférences déclarées
                </h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {choiceAnswers.map((answer, idx) => (
                    <div key={`${answer.dimension}-${idx}`} className="rounded-2xl bg-[#fef5f9] p-4 text-left">
                      <p className="text-xs uppercase tracking-[0.35em] text-[#c91459]/60">
                        {DIMENSION_LABELS[answer.dimension] ?? answer.dimension}
                      </p>
                      {answer.question ? (
                        <p className="mt-2 text-xs font-semibold text-[#7b2a49]/80">{answer.question}</p>
                      ) : null}
                      <p className="mt-2 text-sm font-semibold text-[#5a1d35]">{answer.choice}</p>
                      {typeof answer.points === "number" ? (
                        <p className="text-xs text-[#7b2a49]/70">{answer.points} point(s)</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {qualitativeResponses.length > 0 ? (
              <div className="rounded-3xl border border-[#f6cada] bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-[#c91459]/70">
                  Ce que tu as exprimé
                </h3>
                <div className="mt-4 space-y-4">
                  {qualitativeResponses.map((response, idx) => (
                    <div key={`${response.dimension}-${idx}`} className="rounded-2xl bg-[#fef1f7] p-4 text-left">
                      <p className="text-xs uppercase tracking-[0.35em] text-[#c91459]/60">
                        {DIMENSION_LABELS[response.dimension] ?? response.dimension}
                      </p>
                      {response.question ? (
                        <p className="mt-2 text-xs font-semibold text-[#7b2a49]/80">{response.question}</p>
                      ) : null}
                      <p className="mt-2 text-sm leading-relaxed text-[#5a1d35] whitespace-pre-line">
                        {response.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border border-[#f6cada] bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#c91459]">Historique des analyses</CardTitle>
            <CardDescription className="text-[#7b2a49]">
              Retrouvez vos passations précédentes et observez l’évolution de vos scores.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {history.length === 0 ? (
              <p className="text-sm text-[#7b2a49]">Aucun résultat enregistré pour le moment.</p>
            ) : (
              <div className="space-y-4">
                {history.map((assessment) => (
                  <div
                    key={assessment.id}
                    className={cn(
                      "flex flex-col gap-3 rounded-2xl border p-4 transition",
                      assessment.id === result.id
                        ? "border-[#c91459] bg-[#fef1f7] text-[#c91459]"
                        : "border-[#f4c1d2] bg-white text-[#7b2a49]",
                    )}
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-[#c91459]/10 px-3 py-1 text-xs font-semibold text-[#c91459]">
                          {new Date(assessment.created_at).toLocaleDateString("fr-FR")}
                        </span>
                        <span className="text-lg font-semibold">
                          Score global : {Math.round(assessment.overall_score)}/100
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#c91459]"
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
    "relative min-h-screen bg-gradient-to-b from-[#fef5f9] via-white to-white px-4 pb-16",
    isSoftSkills && "soft-skills-monochrome",
  );
  const containerStyle = isSoftSkills ? { background: "#050505", color: "#f5f5f5" } : undefined;

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

function scoreToMessage(dimension: string, score: number) {
  let thresholds = DIMENSION_MESSAGES[dimension as keyof typeof DIMENSION_MESSAGES];
  if (!thresholds) {
    thresholds = DIMENSION_MESSAGES.coping_naturel;
  }

  if (score >= 70) return thresholds.high;
  if (score >= 45) return thresholds.medium;
  return thresholds.low;
}


