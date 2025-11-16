import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getLearnerContentDetail } from "@/lib/queries/apprenant";
import { TestQuestion } from "@/hooks/use-test-sessions";
import { LearningSessionTracker } from "@/components/learning-session-tracker";

import TestExperience from "./test-experience";

const FALLBACK_QUESTION_BANK: Record<string, TestQuestion[]> = {
  "assessment-neurosciences-appliqu-es": [
    {
      id: "intro-impact",
      type: "single",
      title: "Quel est votre objectif principal avec ce test ?",
      helper: "Une question rapide pour personnaliser la suite.",
      options: [
        { value: "diagnostic", label: "Diagnostiquer mon niveau actuel" },
        { value: "certification", label: "Obtenir un badge à partager" },
        { value: "progression", label: "Identifier des axes de progression" },
        { value: "curiosite", label: "Découvrir par curiosité" },
      ],
    },
    {
      id: "attention-driver",
      type: "multiple",
      title: "Quels leviers utilisez-vous pour capter l’attention au lancement d’une session ?",
      helper: "Sélectionnez toutes les réponses qui correspondent à votre pratique.",
      options: [
        { value: "story", label: "Storytelling ou ancrage émotionnel" },
        { value: "data", label: "Données surprenantes" },
        { value: "game", label: "Challenge ou mini-jeu d’ouverture" },
        { value: "ritual", label: "Rituel d’ancrage neuro-pédagogique" },
      ],
    },
    {
      id: "immersion",
      type: "scale",
      title: "À quel point vos expériences mixent-elles immersion et interaction ?",
      helper: "Positionnez-vous sur une échelle de 1 (peu intégré) à 10 (pleinement maîtrisé).",
      scale: {
        min: 1,
        max: 10,
        leftLabel: "Occasionnel",
        rightLabel: "Signature",
      },
    },
    {
      id: "memory-hook",
      type: "single",
      title: "Quelle est votre stratégie dominante pour soutenir la mémorisation ?",
      options: [
        { value: "espacement", label: "Rappels espacés" },
        { value: "emotion", label: "Ancrage émotionnel" },
        { value: "ritual", label: "Rituels de répétition guidée" },
        { value: "production", label: "Production active" },
      ],
    },
    {
      id: "feedback-loop",
      type: "multiple",
      title: "Comment alimentez-vous votre boucle d’amélioration continue ?",
      helper: "Sélectionnez au moins une réponse.",
      options: [
        { value: "data", label: "Analyse des données d’engagement" },
        { value: "qualitative", label: "Entretiens qualitatifs" },
        { value: "cohortes", label: "Retours cohortes / pairs" },
        { value: "ai", label: "Assistance IA pour analyser les tendances" },
      ],
    },
    {
      id: "transfert",
      type: "scale",
      title: "À quel niveau vos apprenants transfèrent-ils leurs acquis ?",
      helper: "Sur une échelle de 1 à 10.",
      scale: {
        min: 1,
        max: 10,
        leftLabel: "Encore fragile",
        rightLabel: "Systématique",
      },
    },
    {
      id: "trace",
      type: "text",
      title: "Quelles traces concrètes laissez-vous à vos apprenants pour prolonger l’expérience ?",
      helper: "Décrivez en quelques lignes vos supports mémoriels ou dispositifs d’ancrage.",
      placeholder: "Exemples : fiches immersives, rituels audio, recap émotionnels…",
    },
    {
      id: "tempo",
      type: "single",
      title: "Quelle est la durée idéale d’un bloc immersif selon vous ?",
      options: [
        { value: "15", label: "15 minutes" },
        { value: "25", label: "25 minutes" },
        { value: "45", label: "45 minutes" },
        { value: "60", label: "60 minutes" },
      ],
    },
    {
      id: "ia",
      type: "multiple",
      title: "Quels usages IA avez-vous déjà intégrés ?",
      options: [
        { value: "personnalisation", label: "Personnalisation du parcours" },
        { value: "analyse", label: "Analyse des feedbacks" },
        { value: "coaching", label: "Coaching automatisé" },
        { value: "aucun", label: "Pas encore" },
      ],
    },
    {
      id: "closing",
      type: "text",
      title: "Quelle serait la prochaine action que vous souhaitez mettre en place suite à ce test ?",
      helper: "Partagez une intention concrète pour ancrer votre progression.",
      placeholder: "Ex : programmer un débrief, re-designer un rituel d’ouverture, lancer un test pilote…",
    },
  ],
};

const GENERIC_QUESTIONS: TestQuestion[] = [
  {
    id: "motivation",
    type: "single",
    title: "Pourquoi lancez-vous ce test aujourd’hui ?",
    options: [
      { value: "obligation", label: "Parce qu’on me l’a demandé" },
      { value: "envie", label: "Par envie de progresser" },
      { value: "benchmark", label: "Pour me comparer à mes pairs" },
      { value: "curieux", label: "Par curiosité" },
    ],
  },
  {
    id: "richesse",
    type: "text",
    title: "Que souhaitez-vous retirer de cette expérience ?",
    helper: "Une phrase suffit pour guider la suite.",
  },
];

export default async function TestDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const awaited = await params;
  const slug = awaited.slug;

  const result = await getLearnerContentDetail("tests", slug);
  if (!result) {
    notFound();
  }

  const { card, detail } = result;
  const questions = FALLBACK_QUESTION_BANK[slug] ?? GENERIC_QUESTIONS;

  // Utiliser card.id pour le tracking (card contient toujours l'ID du test)
  const testId = card.id;

  return (
    <LearningSessionTracker
      contentType="test"
      contentId={testId}
      showIndicator={false}
    >
      <DashboardShell
        title={detail.title}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard/apprenant" },
          { label: "Tests", href: "/dashboard/tests" },
          { label: detail.title },
        ]}
        initialCollapsed
      >
        <TestExperience card={card} detail={detail} questions={questions} />
      </DashboardShell>
    </LearningSessionTracker>
  );
}

