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
import { GenerateTestFromChaptersModal } from "@/components/formateur/tests/generate-test-from-chapters-modal";
import { TestCreationChoiceModal } from "@/components/formateur/tests/test-creation-choice-modal";
import { useState, useCallback, useEffect, Suspense } from "react";
import { nanoid } from "nanoid";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import type { TestBuilderQuestion } from "@/types/test-builder";

const gradeRanges = [
  { id: "A", label: "Excellent", min: 85, description: "Maîtrise avancée du sujet" },
  { id: "B", label: "Solide", min: 70, description: "Bon niveau, quelques optimisations" },
  { id: "C", label: "À renforcer", min: 55, description: "Compétences en construction" },
  { id: "D", label: "Prioritaire", min: 0, description: "Diagnostic et accompagnement" },
];

function FormateurTestCreatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const testId = searchParams?.get("testId");
  const [isLoading, setIsLoading] = useState(!!testId);
  const [showCreationChoice, setShowCreationChoice] = useState(!testId); // Afficher le modal si pas d'édition
  const [showAiTools, setShowAiTools] = useState(false);
  const [showGenerateFromChapters, setShowGenerateFromChapters] = useState(false);
  // Commencer avec un tableau vide - les formateurs créent leurs propres questions
  const [questions, setQuestions] = useState<TestBuilderQuestion[]>([]);
  
  // États pour les métadonnées
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [evaluationType, setEvaluationType] = useState("");
  const [skills, setSkills] = useState("");
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [adaptiveMode, setAdaptiveMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // État pour l'assignation à une formation
  const [assignment, setAssignment] = useState<{
    courseId?: string;
    sectionId?: string;
    chapterId?: string;
    subchapterId?: string;
    positionAfterId?: string;
    positionType?: "after_section" | "after_chapter" | "after_subchapter";
  } | null>(null);

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

  const handleQuestionsFromChapters = (generatedQuestions: TestBuilderQuestion[]) => {
    // Ajouter les questions générées aux questions existantes
    setQuestions((prev) => [...prev, ...generatedQuestions]);
    toast.success("Questions ajoutées", {
      description: `${generatedQuestions.length} questions ont été ajoutées au test`,
    });
  };

  // Charger les données du test si testId est fourni
  useEffect(() => {
    if (!testId) return;

    const loadTest = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/tests/${testId}`);
        if (!response.ok) {
          throw new Error("Test introuvable");
        }
        const data = await response.json();
        const test = data.test;

        if (test) {
          setTitle(test.title || "");
          setDescription(test.description || "");
          setDuration(test.duration || "");
          setEvaluationType(test.evaluation_type || "");
          setSkills(test.skills || "");
          
          // Charger les questions si disponibles
          if (test.questions && Array.isArray(test.questions)) {
            setQuestions(test.questions);
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement du test:", error);
        toast.error("Erreur", {
          description: "Impossible de charger le test. Création d'un nouveau test.",
        });
        router.replace("/dashboard/formateur/tests/new");
      } finally {
        setIsLoading(false);
      }
    };

    loadTest();
  }, [testId, router]);

  const handleSave = async (published: boolean = false) => {
    if (!title || !title.trim()) {
      toast.error("Titre requis", {
        description: "Veuillez saisir un titre pour le test avant de sauvegarder.",
      });
      return;
    }

    if (published) {
      setIsPublishing(true);
    } else {
      setIsSaving(true);
    }

    try {
      // Si testId existe, utiliser PATCH pour mettre à jour, sinon POST pour créer
      const currentTestId = testId || null;
      const method = currentTestId ? "PATCH" : "POST";
      const url = currentTestId ? `/api/tests/${currentTestId}` : "/api/tests";
      
      const requestBody: any = {
        title: title.trim(),
        description: description.trim() || null,
        duration: duration.trim() || null,
        evaluationType: evaluationType.trim() || null,
        skills: skills.trim() || null,
        price: 0,
        published,
        questions: questions.length > 0 ? questions : null,
      };
      
      // Ajouter testId seulement si on met à jour
      if (currentTestId) {
        requestBody.testId = currentTestId;
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          const text = await response.text();
          throw new Error(text || `Erreur HTTP ${response.status}: ${response.statusText}`);
        }

        const errorMessage = errorData.error || "Erreur lors de la sauvegarde";
        const errorDetails = errorData.details || "";
        throw new Error(errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage);
      }

      const data = await response.json();

      // Vérifier que le test a bien été créé/mis à jour
      if (!data.test || !data.test.id) {
        throw new Error("Le test a été sauvegardé mais l'ID n'est pas disponible");
      }

      const savedTestId = data.test.id;

      // Si une assignation a été configurée, assigner le test à la formation (même en brouillon)
      if (assignment?.courseId) {
        try {
          const assignResponse = await fetch("/api/tests/assign-to-course", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              testId: savedTestId,
              courseId: assignment.courseId,
              sectionId: assignment.sectionId || null,
              chapterId: assignment.chapterId || null,
              subchapterId: assignment.subchapterId || null,
              positionAfterId: assignment.positionAfterId || null,
              positionType: assignment.positionType || null,
            }),
          });

          if (!assignResponse.ok) {
            let assignErrorData;
            try {
              const text = await assignResponse.text();
              try {
                assignErrorData = JSON.parse(text);
              } catch {
                assignErrorData = { error: text || `Erreur HTTP ${assignResponse.status}: ${assignResponse.statusText}` };
              }
            } catch (error) {
              assignErrorData = { error: `Erreur HTTP ${assignResponse.status}: ${assignResponse.statusText}` };
            }
            
            console.error("Erreur lors de l'assignation du test à la formation:", {
              status: assignResponse.status,
              statusText: assignResponse.statusText,
              error: assignErrorData,
              testId: savedTestId,
              courseId: assignment.courseId,
            });
            
            toast.warning("Test créé mais assignation échouée", {
              description: assignErrorData.error || `Le test n'a pas pu être assigné à la formation (${assignResponse.status}).`,
            });
          } else {
            const assignData = await assignResponse.json();
            console.log("Test assigné avec succès:", assignData);
            toast.success("Test assigné à la formation", {
              description: "Le test a été correctement positionné dans la formation.",
            });
          }
        } catch (assignError) {
          console.error("Erreur lors de l'assignation:", assignError);
          toast.warning(currentTestId ? "Test mis à jour mais assignation échouée" : "Test créé mais assignation échouée", {
            description: currentTestId
              ? "Le test a été mis à jour mais n'a pas pu être assigné à la formation."
              : "Le test a été créé mais n'a pas pu être assigné à la formation.",
          });
        }
      }

      toast.success(published 
        ? (currentTestId ? "Test mis à jour et publié !" : "Test publié !")
        : (currentTestId ? "Test mis à jour !" : "Test sauvegardé"), {
        description: data.message || (currentTestId 
          ? "Le test a été mis à jour avec succès."
          : "Le test a été enregistré avec succès."),
      });

      if (published) {
        setTimeout(() => {
          router.push("/dashboard/formateur/tests");
          router.refresh();
        }, 1500);
      } else {
        // Même en brouillon, rediriger vers la liste pour voir le test
        setTimeout(() => {
          router.push("/dashboard/formateur/tests");
          router.refresh();
        }, 1000);
      }
    } catch (error) {
      console.error("[formateur-test-create] Erreur:", error);
      
      if (error instanceof TypeError && error.message.includes("fetch")) {
        toast.error("Erreur réseau", {
          description: "Impossible de contacter le serveur. Vérifiez votre connexion.",
        });
      } else {
        toast.error("Erreur", {
          description: error instanceof Error ? error.message : "Une erreur est survenue lors de la sauvegarde.",
        });
      }
    } finally {
      setIsSaving(false);
      setIsPublishing(false);
    }
  };

  return (
    <>
      <TestCreationChoiceModal
        open={showCreationChoice}
        onOpenChange={setShowCreationChoice}
        onChooseFromScratch={() => {
          // Continuer avec la création normale
          setShowCreationChoice(false);
        }}
        onChooseFromChapters={() => {
          // Ouvrir le modal de génération depuis les chapitres
          setShowGenerateFromChapters(true);
        }}
      />
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
            {title || "TITRE DU TEST"}
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
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex. Diagnostic neurosciences appliquées"
                    className="border-white/15 bg-black/40 text-sm text-white placeholder:text-white/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-[0.3em] text-white/50">Description</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Expliquez le contexte, l'intention pédagogique et les compétences mesurées."
                    className="border-white/15 bg-black/40 text-sm text-white placeholder:text-white/40"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-[0.3em] text-white/50">Durée estimée</label>
                    <Input
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="Ex. 20 minutes"
                      className="border-white/15 bg-black/40 text-sm text-white placeholder:text-white/40"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-[0.3em] text-white/50">Type d'évaluation</label>
                    <Input
                      value={evaluationType}
                      onChange={(e) => setEvaluationType(e.target.value)}
                      placeholder="QCM, scenario, étude de cas..."
                      className="border-white/15 bg-black/40 text-sm text-white placeholder:text-white/40"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-[0.3em] text-white/50">Compétences visées</label>
                  <Input
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
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
                  onAssignmentChange={useCallback((assignmentData: {
                    courseId: string;
                    sectionId?: string;
                    chapterId?: string;
                    subchapterId?: string;
                    positionAfterId?: string;
                    positionType?: "after_section" | "after_chapter" | "after_subchapter";
                  }) => {
                    // Sauvegarder l'assignation quand le test sera créé
                    setAssignment(assignmentData);
                  }, [])}
                />

                <div className="flex items-center justify-between rounded-2xl border border-white/15 bg-black/35 px-4 py-3">
                  <div>
                    <p className="font-semibold text-white">Chronomètre</p>
                    <p className="text-xs text-white/50">Limite le temps de réponse par apprenant.</p>
                  </div>
                  <Switch checked={timerEnabled} onCheckedChange={setTimerEnabled} />
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/15 bg-black/35 px-4 py-3">
                  <div>
                    <p className="font-semibold text-white">Mode adaptatif</p>
                    <p className="text-xs text-white/50">Ajuste la difficulté selon les réponses intermédiaires.</p>
                  </div>
                  <Switch checked={adaptiveMode} onCheckedChange={setAdaptiveMode} />
                </div>
                <div className="space-y-2 rounded-2xl border border-white/15 bg-black/35 px-4 py-4 text-xs text-white/65">
                  <p>• Restreindre l'accès à certains groupes</p>
                  <p>• Déclencher un message de lancement personnalisé</p>
                  <p>• Exiger un score minimum pour débloquer une ressource</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => handleSave(false)}
                    disabled={isSaving || isPublishing}
                    className="w-full rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-white/20"
                  >
                    {isSaving ? "Enregistrement..." : "Enregistrer en brouillon"}
                  </Button>
                  <Button
                    onClick={() => handleSave(true)}
                    disabled={isSaving || isPublishing}
                    className="w-full rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
                  >
                    {isPublishing ? "Publication..." : "Publier le test"}
                  </Button>
                </div>
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

      <GenerateTestFromChaptersModal
        open={showGenerateFromChapters}
        onOpenChange={setShowGenerateFromChapters}
        onQuestionsGenerated={handleQuestionsFromChapters}
      />
      </DashboardShell>
    </>
  );
}

export default function FormateurTestCreatePage() {
  return (
    <Suspense fallback={
      <DashboardShell
        title="Chargement..."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard/formateur" },
          { label: "Tests", href: "/dashboard/formateur/tests" },
          { label: "Nouveau test" },
        ]}
      >
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white/60" />
        </div>
      </DashboardShell>
    }>
      <FormateurTestCreatePageContent />
    </Suspense>
  );
}
