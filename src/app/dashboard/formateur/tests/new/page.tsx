'use client';

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { QuestionFlowBuilder } from "@/components/formateur/tests/question-flow-builder";
import { TestQuestionBuilder } from "@/components/formateur/tests/test-question-builder";
import { TestCourseAssignmentSection } from "@/components/formateur/tests/test-course-assignment-section";
import { useState } from "react";
import { nanoid } from "nanoid";

import type { TestBuilderQuestion } from "@/types/test-builder";

const gradeRanges = [
  { id: "A", label: "Excellent", min: 85, description: "Maîtrise avancée du sujet" },
  { id: "B", label: "Solide", min: 70, description: "Bon niveau, quelques optimisations" },
  { id: "C", label: "À renforcer", min: 55, description: "Compétences en construction" },
  { id: "D", label: "Prioritaire", min: 0, description: "Diagnostic et accompagnement" },
];

const INITIAL_QUESTIONS: Omit<TestBuilderQuestion, "id">[] = [
  {
    title: "Diagnostic neurosciences appliquées",
    type: "multiple",
    context: "Identifiez les leviers sensoriels à activer lors d'une ouverture immersive.",
    options: [
      { id: nanoid(), value: "Stimuler les sens visuels, auditifs et kinesthésiques", correct: true },
      { id: nanoid(), value: "Commencer directement par un quizz à froid", correct: false },
      { id: nanoid(), value: "Multiplier les consignes simultanées", correct: false },
    ],
    score: 5,
    feedback: "Insistez sur la mise en mouvement sensorielle pour créer un momentum.",
    status: "ready",
    tag: "Neurosciences",
    aiGenerated: false,
  },
  {
    title: "Storytelling & impact émotionnel",
    type: "open",
    context: "Vous introduisez un module sur l'expérience apprenante augmentée.",
    keywordRules: [
      { id: nanoid(), keywords: ["émotion", "mémoire"], score: 2 },
      { id: nanoid(), keywords: ["narration", "expérience"], score: 1 },
    ],
    score: 8,
    feedback: "Rappelez les 3 temps narratifs et proposez un moment signature.",
    status: "draft",
    aiGenerated: false,
  },
  {
    title: "Évaluer la posture live",
    type: "scale",
    scale: { min: 1, max: 5 },
    scaleScoreMap: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 },
    context: "Quel niveau de confiance ressentez-vous pour animer un live hybride ?",
    score: 3,
    status: "ready",
    aiGenerated: false,
  },
];

export default function FormateurTestCreatePage() {
  const [showAiTools, setShowAiTools] = useState(false);
  const [questions, setQuestions] = useState<TestBuilderQuestion[]>(() =>
    INITIAL_QUESTIONS.map((question) => ({ ...question, id: nanoid() })),
  );

  const handleAddBlankQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: nanoid(),
        title: "Nouvelle question",
        type: "multiple",
        options: [
          { id: nanoid(), value: "Option 1", correct: true },
          { id: nanoid(), value: "Option 2", correct: false },
        ],
        score: 1,
        status: "draft",
        aiGenerated: false,
      },
    ]);
  };

  const handleAiQuestionCreate = (question: TestBuilderQuestion) => {
    setQuestions((prev) => [...prev, question]);
  };

  return (
    <DashboardShell
      title="Créer un test"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/formateur" },
        { label: "Formateur", href: "/dashboard/formateur" },
        { label: "Tests", href: "/dashboard/formateur/tests" },
        { label: "Nouveau" },
      ]}
    >
      <div className="space-y-10 rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top,#2f2f2f,rgba(18,18,18,0.92))] px-8 py-10 text-white shadow-[0_25px_120px_-60px_rgba(0,0,0,0.75)]">
        <header className="flex flex-col items-center gap-6 text-center">
          <Badge className="rounded-full border border-white/20 bg-white/10 px-4 py-1 text-[10px] uppercase tracking-[0.35em] text-white/70">
            Générateur Beyond AI
          </Badge>
          <h1
            className="bg-gradient-to-r from-[#FF512F] via-[#DD2476] to-[#8E2DE2] bg-clip-text text-4xl font-semibold uppercase tracking-[0.45em] text-transparent md:text-5xl"
            style={{ fontFamily: '"SF Pro Display", "SF Pro Text", "-apple-system", "BlinkMacSystemFont", "Segoe UI", sans-serif' }}
          >
            TITRE DU TEST
          </h1>
          <p className="max-w-3xl text-sm text-white/60">
            Construisez un flux de questions à la Typeform : transitions fluides, storytelling immersif et analyse des réponses
            automatisée. Définissez vos objectifs, générez les items avec l'IA et paramétrez la notation.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              className="rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white shadow-lg shadow-[#0072FF]/40"
              onClick={() => setShowAiTools(true)}
              disabled={showAiTools}
            >
              {showAiTools ? "Atelier IA activé" : "Générer avec Beyond AI"}
            </Button>
            <Button
              variant="ghost"
              className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/70 hover:bg-white/15"
            >
              Prévisualiser le flow
            </Button>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-8">
            <Card className="border-white/10 bg-gradient-to-br from-[#1f1f1f]/95 via-[#161616]/95 to-[#090909]/95">
              <CardHeader className="space-y-2">
                <CardTitle className="text-lg font-semibold uppercase tracking-[0.25em] text-white">
                  01 · Métadonnées
                </CardTitle>
                <p className="text-sm text-white/50">Cadrez votre test avant de générer les questions.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-[0.3em] text-white/50">Titre</label>
                  <Input
                    placeholder="Ex. Diagnostic neurosciences appliquées"
                    className="border-white/15 bg-black/40 text-sm text-white placeholder:text-white/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-[0.3em] text-white/50">Description</label>
                  <Textarea
                    rows={4}
                    placeholder="Expliquez le contexte, l'intention pédagogique et les compétences mesurées."
                    className="border-white/15 bg-black/40 text-sm text-white placeholder:text-white/40"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-[0.3em] text-white/50">Durée estimée</label>
                    <Input
                      placeholder="Ex. 20 minutes"
                      className="border-white/15 bg-black/40 text-sm text-white placeholder:text-white/40"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-[0.3em] text-white/50">Type d'évaluation</label>
                    <Input
                      placeholder="QCM, scenario, étude de cas..."
                      className="border-white/15 bg-black/40 text-sm text-white placeholder:text-white/40"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-[0.3em] text-white/50">Compétences visées</label>
                  <Input
                    placeholder="Ajouter des mots-clés séparés par des virgules"
                    className="border-white/15 bg-black/40 text-sm text-white placeholder:text-white/40"
                  />
                </div>
              </CardContent>
            </Card>

            {showAiTools ? (
              <Card className="border-white/10 bg-gradient-to-br from-[#1f1f1f]/95 via-[#111111]/95 to-[#050505]/95">
                <CardHeader className="space-y-2">
                  <CardTitle className="text-lg font-semibold uppercase tracking-[0.25em] text-white">
                    02 · Prompt IA
                  </CardTitle>
                  <p className="text-sm text-white/50">
                    Rédigez votre brief pour générer automatiquement questions, réponses et feedbacks.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    rows={5}
                    placeholder="Décrivez le public cible, le ton, la difficulté, les formats de questions, la progression souhaitée..."
                    className="border-white/15 bg-black/40 text-sm text-white placeholder:text-white/40"
                  />
                  <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.3em] text-white/50">
                    <Badge className="rounded-full border border-white/20 bg-white/10 px-3 py-1">flow narratif</Badge>
                    <Badge className="rounded-full border border-white/20 bg-white/10 px-3 py-1">quiz progressif</Badge>
                    <Badge className="rounded-full border border-white/20 bg-white/10 px-3 py-1">feedback immédiat</Badge>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <Card className="border-white/10 bg-gradient-to-br from-[#1f1f1f]/95 via-[#161616]/95 to-[#090909]/95">
              <CardHeader className="space-y-2">
                <CardTitle className="text-lg font-semibold uppercase tracking-[0.25em] text-white">
                  03 · Questions & scénarios
                </CardTitle>
                <p className="text-sm text-white/50">
                  Ajustez vos questions, scénarisez les transitions et enrichissez vos réponses.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <TestQuestionBuilder
                  questions={questions}
                  onChange={setQuestions}
                  onAddQuestion={handleAddBlankQuestion}
                />
                {showAiTools ? (
                  <QuestionFlowBuilder onCreate={handleAiQuestionCreate} />
                ) : (
                  <div className="rounded-3xl border border-dashed border-white/15 bg-black/30 px-6 py-5 text-sm text-white/60">
                    Activez l'atelier IA pour générer des questions assistées avec Beyond.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-8">
            <Card className="border-white/10 bg-gradient-to-br from-[#1f1f1f]/95 via-[#121212]/95 to-[#050505]/95">
              <CardHeader>
                <CardTitle className="text-lg font-semibold uppercase tracking-[0.25em] text-white">
                  Notation & scoring
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-white/70">
                <p>
                  Définissez la grille d'évaluation. Les résultats seront synchronisés avec Supabase pour vos dashboards cohortes.
                </p>
                <div className="space-y-3">
                  {gradeRanges.map((range) => (
                    <div
                      key={range.id}
                      className="flex items-start justify-between gap-3 rounded-2xl border border-white/15 bg-black/35 px-4 py-3 text-xs text-white/70"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-white">
                          {range.id} · {range.label}
                        </p>
                        <p>{range.description}</p>
                      </div>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white">
                        ≥ {range.min}%
                      </span>
                    </div>
                  ))}
                </div>
                <Button className="w-full rounded-full bg-gradient-to-r from-[#8E2DE2] to-[#4A00E0] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white">
                  Calculer les scores automatiquement
                </Button>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-gradient-to-br from-[#1f1f1f]/95 via-[#161616]/95 to-[#090909]/95">
              <CardHeader>
                <CardTitle className="text-lg font-semibold uppercase tracking-[0.25em] text-white">
                  Paramètres de diffusion
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-white/70">
                {/* Assignation à une formation */}
                <TestCourseAssignmentSection
                  testId={undefined}
                  onAssignmentChange={(assignment) => {
                    // Sauvegarder l'assignation quand le test sera créé
                    console.log("Assignment changed:", assignment);
                  }}
                />

                <div className="flex items-center justify-between rounded-2xl border border-white/15 bg-black/35 px-4 py-3">
                  <div>
                    <p className="font-semibold text-white">Chronomètre</p>
                    <p className="text-xs text-white/50">Limite le temps de réponse par apprenant.</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/15 bg-black/35 px-4 py-3">
                  <div>
                    <p className="font-semibold text-white">Mode adaptatif</p>
                    <p className="text-xs text-white/50">Ajuste la difficulté selon les réponses intermédiaires.</p>
                  </div>
                  <Switch />
                </div>
                <div className="space-y-2 rounded-2xl border border-white/15 bg-black/35 px-4 py-4 text-xs text-white/65">
                  <p>• Restreindre l'accès à certains groupes</p>
                  <p>• Déclencher un message de lancement personnalisé</p>
                  <p>• Exiger un score minimum pour débloquer une ressource</p>
                </div>
                <Button className="w-full rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white">
                  Publier le test
                </Button>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-gradient-to-br from-[#1f1f1f]/95 via-[#121212]/95 to-[#090909]/95">
              <CardHeader>
                <CardTitle className="text-base font-semibold uppercase tracking-[0.25em] text-white">
                  Flow inspiré Typeform
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-white/70">
                <p>• Une question par écran pour maintenir la tension et l'attention.</p>
                <p>• Transitions douces, micro-interactions et feedback instantané.</p>
                <p>• Narration progressive : intro, immersion, validation, message final.</p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </DashboardShell>
  );
}
