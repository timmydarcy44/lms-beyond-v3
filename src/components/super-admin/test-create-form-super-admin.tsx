"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { nanoid } from "nanoid";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuestionFlowBuilder } from "@/components/formateur/tests/question-flow-builder";
import { TestQuestionBuilder } from "@/components/formateur/tests/test-question-builder";
import { CategorySelectField } from "./category-select-field";

import type { TestBuilderQuestion } from "@/types/test-builder";

export function TestCreateFormSuperAdmin() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [evaluationType, setEvaluationType] = useState("");
  const [skills, setSkills] = useState("");
  const [price, setPrice] = useState<string>("15");
  const [category, setCategory] = useState<string>("");
  const [displayFormat, setDisplayFormat] = useState<"ranking" | "radar" | "score" | "detailed">("score");
  const [showAiTools, setShowAiTools] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [adaptiveMode, setAdaptiveMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  // Commencer avec un tableau vide - les formateurs créent leurs propres questions
  const [questions, setQuestions] = useState<TestBuilderQuestion[]>([]);

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
      const response = await fetch("/api/tests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          duration: duration.trim() || null,
          evaluationType: evaluationType.trim() || null,
          skills: skills.trim() || null,
          price: parseFloat(price) || 0,
          category: category.trim() || null,
          published,
          questions: questions, // Inclure les questions dans la sauvegarde
          display_format: displayFormat, // Format d'affichage des résultats
        }),
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

      toast.success(published ? "Test publié !" : "Test sauvegardé", {
        description: data.message || "Le test a été enregistré avec succès.",
      });

      if (published) {
        setTimeout(() => {
          router.push("/super/studio/tests");
          router.refresh();
        }, 1500);
      }
    } catch (error) {
      console.error("[test-create-super-admin] Erreur:", error);
      
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
    <div className="space-y-10 rounded-2xl border border-gray-200 bg-white px-8 py-10 shadow-sm">
      <header className="flex flex-col items-center gap-6 text-center">
        <Badge className="rounded-full border border-gray-300 bg-gray-100 px-4 py-1 text-[10px] uppercase tracking-wider text-gray-700">
          Générateur Beyond AI
        </Badge>
        <h1
          className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-4xl font-semibold uppercase tracking-wider text-transparent md:text-5xl"
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
        >
          {title || "TITRE DU TEST"}
        </h1>
        <p className="max-w-3xl text-sm text-gray-600" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
          Construisez un flux de questions à la Typeform : transitions fluides, storytelling immersif et analyse des réponses automatisée.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            className="rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:from-blue-700 hover:to-violet-700"
            onClick={() => setShowAiTools(true)}
            disabled={showAiTools}
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
          >
            {showAiTools ? "Atelier IA activé" : "Générer avec Beyond AI"}
          </Button>
          <Button
            variant="outline"
            className="rounded-lg border-gray-300 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-gray-700 hover:bg-gray-50"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
          >
            Prévisualiser le flow
          </Button>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-8">
          <Card className="border-gray-200 bg-white">
            <CardHeader className="space-y-2">
              <CardTitle className="text-lg font-semibold uppercase tracking-wider text-gray-900" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
                01 · Métadonnées
              </CardTitle>
              <p className="text-sm text-gray-600" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
                Cadrez votre test avant de générer les questions.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider text-gray-500" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
                  Titre
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex. Diagnostic neurosciences appliquées"
                  className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-400"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider text-gray-500" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
                  Description
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Expliquez le contexte, l'intention pédagogique et les compétences mesurées."
                  className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-400"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wider text-gray-500" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
                    Durée estimée
                  </label>
                  <Input
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="Ex. 20 minutes"
                    className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-400"
                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wider text-gray-500" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
                    Type d'évaluation
                  </label>
                  <Input
                    value={evaluationType}
                    onChange={(e) => setEvaluationType(e.target.value)}
                    placeholder="QCM, scenario, étude de cas..."
                    className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-400"
                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider text-gray-500" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
                  Compétences visées
                </label>
                <Input
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="Ajouter des mots-clés séparés par des virgules"
                  className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-400"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
                />
              </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wider text-gray-500" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
                    Prix (€)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-400"
                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
                  />
                </div>
                <CategorySelectField
                  value={category}
                  onChange={setCategory}
                  label="Catégorie"
                />
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wider text-gray-500" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
                    Format d'affichage des résultats
                  </label>
                  <Select value={displayFormat} onValueChange={(value: "ranking" | "radar" | "score" | "detailed") => setDisplayFormat(value)}>
                    <SelectTrigger className="border-gray-300 bg-white text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-gray-900">
                      <SelectItem value="score">Score simple</SelectItem>
                      <SelectItem value="ranking">Classement par catégorie</SelectItem>
                      <SelectItem value="radar">Graphique radar</SelectItem>
                      <SelectItem value="detailed">Détails complets</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    {displayFormat === "ranking" && "Pour les tests de soft skills avec catégories (ex: Intelligence émotionnelle, Adaptabilité)"}
                    {displayFormat === "radar" && "Pour les tests MAI avec visualisation radar des compétences"}
                    {displayFormat === "score" && "Affichage simple du score total"}
                    {displayFormat === "detailed" && "Affichage détaillé avec toutes les informations"}
                  </p>
                </div>
            </CardContent>
          </Card>

          {showAiTools && (
            <Card className="border-gray-200 bg-white">
              <CardHeader className="space-y-2">
                <CardTitle className="text-lg font-semibold uppercase tracking-wider text-gray-900" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
                  02 · Prompt IA
                </CardTitle>
                <p className="text-sm text-gray-600" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
                  Rédigez votre brief pour générer automatiquement questions, réponses et feedbacks.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={5}
                  placeholder="Décrivez le public cible, le ton, la difficulté, les formats de questions, la progression souhaitée..."
                  className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-400"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
                />
              </CardContent>
            </Card>
          )}

          <Card className="border-gray-200 bg-white">
            <CardHeader className="space-y-2">
              <CardTitle className="text-lg font-semibold uppercase tracking-wider text-gray-900" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
                03 · Questions & scénarios
              </CardTitle>
              <p className="text-sm text-gray-600" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
                Ajustez vos questions, scénarisez les transitions et enrichissez vos réponses. Utilisez le drag and drop pour réorganiser.
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
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-6 py-5 text-sm text-gray-500">
                  Activez l'atelier IA pour générer des questions assistées avec Beyond.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-8">
          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold uppercase tracking-wider text-gray-900" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
                Paramètres de diffusion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-700">
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <div>
                  <p className="font-semibold text-gray-900">Chronomètre</p>
                  <p className="text-xs text-gray-500">Limite le temps de réponse par apprenant.</p>
                </div>
                <Switch checked={timerEnabled} onCheckedChange={setTimerEnabled} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <div>
                  <p className="font-semibold text-gray-900">Mode adaptatif</p>
                  <p className="text-xs text-gray-500">Ajuste la difficulté selon les réponses intermédiaires.</p>
                </div>
                <Switch checked={adaptiveMode} onCheckedChange={setAdaptiveMode} />
              </div>
              <div className="flex flex-col gap-3 pt-4">
                <Button
                  onClick={() => handleSave(false)}
                  disabled={isSaving || isPublishing}
                  className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white hover:from-blue-700 hover:to-violet-700"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
                >
                  {isSaving ? "Enregistrement..." : "Enregistrer"}
                </Button>
                <Button
                  onClick={() => handleSave(true)}
                  disabled={isSaving || isPublishing}
                  className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-semibold text-white hover:from-emerald-600 hover:to-teal-600"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
                >
                  {isPublishing ? "Publication..." : "Publier le test"}
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full rounded-lg border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
                >
                  <Link href="/super/studio/tests">Retour</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

