"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCourseBuilder } from "@/hooks/use-course-builder";

type GeneratedQuestion = {
  question: string;
  options: string[];
  correct: number;
  explication?: string;
  points?: number;
  type?: string;
};

export function CourseResourcesManager({ courseId }: { courseId?: string }) {
  const snapshot = useCourseBuilder((state) => state.snapshot);
  const resources = useCourseBuilder((state) => state.snapshot.resources);
  const tests = useCourseBuilder((state) => state.snapshot.tests);
  const addResource = useCourseBuilder((state) => state.addResource);
  const updateResource = useCourseBuilder((state) => state.updateResource);
  const removeResource = useCourseBuilder((state) => state.removeResource);
  const updateTest = useCourseBuilder((state) => state.updateTest);
  const removeTest = useCourseBuilder((state) => state.removeTest);

  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [selectedSectionIds, setSelectedSectionIds] = useState<Record<string, boolean>>({});
  const [selectedChapterIds, setSelectedChapterIds] = useState<Record<string, boolean>>({});
  const [selectedSubchapterIds, setSelectedSubchapterIds] = useState<Record<string, boolean>>({});
  const [questionCount, setQuestionCount] = useState("10");
  const [questionType, setQuestionType] = useState("qcm");
  const [difficulty, setDifficulty] = useState("Moyen");
  const [pointsPerQuestion, setPointsPerQuestion] = useState(1);
  const [penalty, setPenalty] = useState(0);
  const [scoreMinimum, setScoreMinimum] = useState(70);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [placementType, setPlacementType] = useState("end");
  const [placementId, setPlacementId] = useState("");

  const placementOptions = useMemo(() => {
    const options: Array<{ value: string; label: string; type: string; id?: string }> = [
      { value: "end", label: "À la fin de la formation", type: "end" },
    ];
    snapshot.sections.forEach((section, sectionIndex) => {
      options.push({
        value: `after_section:${section.id}`,
        label: `Après la section ${sectionIndex + 1} · ${section.title || "Sans titre"}`,
        type: "after_section",
        id: section.id,
      });
      section.chapters.forEach((chapter, chapterIndex) => {
        options.push({
          value: `after_chapter:${chapter.id}`,
          label: `Après le chapitre ${sectionIndex + 1}.${chapterIndex + 1} · ${chapter.title || "Sans titre"}`,
          type: "after_chapter",
          id: chapter.id,
        });
        chapter.subchapters.forEach((sub, subIndex) => {
          options.push({
            value: `after_subchapter:${sub.id}`,
            label: `Après le sous-chapitre ${sectionIndex + 1}.${chapterIndex + 1}.${subIndex + 1} · ${sub.title || "Sans titre"}`,
            type: "after_subchapter",
            id: sub.id,
          });
        });
      });
    });
    return options;
  }, [snapshot.sections]);

  const selectedPayload = useMemo(() => {
    return snapshot.sections
      .map((section) => {
        const sectionSelected = selectedSectionIds[section.id];
        const chapters = section.chapters
          .map((chapter) => {
            const chapterSelected = sectionSelected || selectedChapterIds[chapter.id];
            const subchapters = chapter.subchapters.filter(
              (sub) => chapterSelected || selectedSubchapterIds[sub.id],
            );
            if (!chapterSelected && subchapters.length === 0) return null;
            return {
              section: section.title,
              chapter: chapter.title,
              content: chapter.content || chapter.summary || "",
              subchapters: subchapters.map((sub) => ({
                title: sub.title,
                content: sub.content || sub.summary || "",
              })),
            };
          })
          .filter(Boolean);
        if (sectionSelected || chapters.length > 0) {
          return { section: section.title, chapters };
        }
        return null;
      })
      .filter(Boolean);
  }, [snapshot.sections, selectedChapterIds, selectedSectionIds, selectedSubchapterIds]);

  const toggleSection = (sectionId: string, checked: boolean) => {
    setSelectedSectionIds((prev) => ({ ...prev, [sectionId]: checked }));
    const section = snapshot.sections.find((item) => item.id === sectionId);
    if (!section) return;
    setSelectedChapterIds((prev) => {
      const next = { ...prev };
      section.chapters.forEach((chapter) => {
        next[chapter.id] = checked;
      });
      return next;
    });
    setSelectedSubchapterIds((prev) => {
      const next = { ...prev };
      section.chapters.forEach((chapter) => {
        chapter.subchapters.forEach((sub) => {
          next[sub.id] = checked;
        });
      });
      return next;
    });
  };

  const toggleChapter = (sectionId: string, chapterId: string, checked: boolean) => {
    setSelectedChapterIds((prev) => ({ ...prev, [chapterId]: checked }));
    const section = snapshot.sections.find((item) => item.id === sectionId);
    const chapter = section?.chapters.find((item) => item.id === chapterId);
    if (!chapter) return;
    setSelectedSubchapterIds((prev) => {
      const next = { ...prev };
      chapter.subchapters.forEach((sub) => {
        next[sub.id] = checked;
      });
      return next;
    });
  };

  const toggleSubchapter = (subchapterId: string, checked: boolean) => {
    setSelectedSubchapterIds((prev) => ({ ...prev, [subchapterId]: checked }));
  };

  const normalizeOptions = (type: string, options: string[]) => {
    if (type === "vrai_faux") {
      return ["Vrai", "Faux"];
    }
    if (options.length >= 2) return options;
    return ["Option 1", "Option 2", "Option 3", "Option 4"];
  };

  const handleGenerateQuiz = async () => {
    if (selectedPayload.length === 0) {
      toast.error("Sélectionnez au moins un chapitre.");
      return;
    }
    setIsGenerating(true);
    try {
      const response = await fetch("/api/formateur/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapitres: selectedPayload,
          nb_questions: Number(questionCount),
          type: questionType,
          niveau: difficulty,
          formation_titre: snapshot.general.title || "Formation",
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Génération impossible");
      }
      const nextQuestions = Array.isArray(payload?.questions) ? payload.questions : [];
      setGeneratedQuestions(
        nextQuestions.map((question: GeneratedQuestion) => ({
          question: question.question || "Nouvelle question",
          options: normalizeOptions(questionType, question.options || []),
          correct: typeof question.correct === "number" ? question.correct : 0,
          explication: question.explication || "",
          points: pointsPerQuestion,
          type: questionType === "mixed" ? "qcm" : questionType,
        })),
      );
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la génération du quiz.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveQuiz = async () => {
    if (!courseId) {
      toast.error("Enregistrez la formation avant de sauvegarder un quiz.");
      return;
    }
    if (generatedQuestions.length === 0) {
      toast.error("Aucune question à sauvegarder.");
      return;
    }
    setIsSaving(true);
    try {
      const testTitle = `Quiz IA · ${snapshot.general.title || "Formation"}`;
      const response = await fetch("/api/formateur/quiz/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formation_id: courseId,
          titre: testTitle,
          questions: generatedQuestions,
          scoring: {
            points_par_question: pointsPerQuestion,
            penalite: penalty,
            score_minimum: scoreMinimum,
          },
          type: questionType,
          placement: placementType === "end" ? { type: "end" } : { type: placementType, id: placementId },
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Sauvegarde impossible");
      }
      toast.success("Félicitations, votre quiz est crée");
      setIsQuizModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la sauvegarde du quiz.");
    } finally {
      setIsSaving(false);
    }
  };

  const addManualQuestion = () => {
    const baseType = questionType === "mixed" ? "qcm" : questionType;
    const baseOptions =
      baseType === "vrai_faux"
        ? ["Vrai", "Faux"]
        : ["Option 1", "Option 2", "Option 3", "Option 4"];
    setGeneratedQuestions((prev) => [
      ...prev,
      {
        question: "Nouvelle question",
        options: baseOptions,
        correct: 0,
        explication: "",
        points: pointsPerQuestion,
        type: baseType,
      },
    ]);
  };

  const moveOption = (questionIndex: number, optionIndex: number, direction: "up" | "down") => {
    setGeneratedQuestions((prev) =>
      prev.map((question, qIndex) => {
        if (qIndex !== questionIndex) return question;
        const nextOptions = [...question.options];
        const targetIndex = direction === "up" ? optionIndex - 1 : optionIndex + 1;
        if (targetIndex < 0 || targetIndex >= nextOptions.length) return question;
        const [removed] = nextOptions.splice(optionIndex, 1);
        nextOptions.splice(targetIndex, 0, removed);
        return { ...question, options: nextOptions };
      }),
    );
  };

  return (
    <Card className="border-white/10 bg-white/5 text-white">
      <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle className="text-lg font-semibold">Ressources & tests associés</CardTitle>
          <p className="text-sm text-white/60">
            Liez rapidement des supports complémentaires et les évaluations que vos apprenants devront réaliser.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={addResource}
            className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-white/20"
          >
            <Plus className="mr-2 h-3.5 w-3.5" /> Ressource
          </Button>
          <Button
            onClick={() => setIsQuizModalOpen(true)}
            className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2 text-xs font-semibold text-white"
          >
            ✨ Générer un quiz IA
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <section className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">Ressources</h3>
          {resources.length ? (
            resources.map((resource) => (
              <div key={resource.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-3">
                  <Input
                    value={resource.title}
                    onChange={(event) => updateResource(resource.id, { title: event.target.value })}
                    placeholder="Titre de la ressource"
                    className="rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30"
                  />
                  <div className="grid gap-2 md:grid-cols-[1fr_160px]">
                    <Input
                      value={resource.url}
                      onChange={(event) => updateResource(resource.id, { url: event.target.value })}
                      placeholder="URL de la ressource"
                      className="rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30"
                    />
                    <Input
                      value={resource.type}
                      onChange={(event) => updateResource(resource.id, { type: event.target.value as typeof resource.type })}
                      placeholder="Type (pdf, vidéo...)"
                      className="rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeResource(resource.id)}
                      className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 hover:border-white/40 hover:text-white"
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" /> Retirer
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-white/15 bg-transparent px-4 py-3 text-sm text-white/50">
              Ajoutez vos kits, PDF, replays ou supports complémentaires.
            </p>
          )}
        </section>

        <section className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">Tests & évaluations</h3>
          {tests.length ? (
            tests.map((test) => (
              <div key={test.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-3">
                  <Input
                    value={test.title}
                    onChange={(event) => updateTest(test.id, { title: event.target.value })}
                    placeholder="Titre du test"
                    className="rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30"
                  />
                  <div className="grid gap-2 md:grid-cols-[1fr_160px]">
                    <Input
                      value={test.url}
                      onChange={(event) => updateTest(test.id, { url: event.target.value })}
                      placeholder="Lien vers l'outil d'évaluation"
                      className="rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30"
                    />
                    <Input
                      value={test.type}
                      onChange={(event) => updateTest(test.id, { type: event.target.value as typeof test.type })}
                      placeholder="Type (quiz, diagnostic...)"
                      className="rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeTest(test.id)}
                      className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 hover:border-white/40 hover:text-white"
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" /> Retirer
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-white/15 bg-transparent px-4 py-3 text-sm text-white/50">
              Reliez vos quizzes, évaluations ou auto-diagnostics pour piloter la progression.
            </p>
          )}
        </section>
      </CardContent>

      <Dialog open={isQuizModalOpen} onOpenChange={setIsQuizModalOpen}>
        <DialogContent className="max-w-4xl border border-white/10 bg-[#0a0a0a] text-white p-0">
          <div className="flex max-h-[85vh] flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <DialogHeader>
                <DialogTitle>Sélectionnez les chapitres à analyser</DialogTitle>
                <DialogDescription className="text-white/60">
                  L&apos;IA va lire le contenu de ces chapitres et générer des questions automatiquement
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 rounded-2xl border border-white/10 bg-[#111] p-4 text-sm text-white/80">
                {snapshot.sections.map((section) => (
                  <div key={section.id} className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold">
                      <input
                        type="checkbox"
                        checked={Boolean(selectedSectionIds[section.id])}
                        onChange={(event) => toggleSection(section.id, event.target.checked)}
                      />
                      {section.title || "Section"}
                    </label>
                    <div className="space-y-2 pl-4">
                      {section.chapters.map((chapter) => (
                        <div key={chapter.id} className="space-y-1">
                          <label className="flex items-center gap-2 text-sm text-white/80">
                            <input
                              type="checkbox"
                              checked={Boolean(selectedChapterIds[chapter.id])}
                              onChange={(event) => toggleChapter(section.id, chapter.id, event.target.checked)}
                            />
                            Chapitre : {chapter.title || "Sans titre"}
                          </label>
                          <div className="space-y-1 pl-4 text-xs text-white/60">
                            {chapter.subchapters.map((sub) => (
                              <label key={sub.id} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={Boolean(selectedSubchapterIds[sub.id])}
                                  onChange={(event) => toggleSubchapter(sub.id, event.target.checked)}
                                />
                                {sub.title || "Sous-chapitre"}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-white">Où placer ce quiz dans la formation ?</p>
                <Select
                  value={placementType === "end" ? "end" : `${placementType}:${placementId}`}
                  onValueChange={(value) => {
                    if (value === "end") {
                      setPlacementType("end");
                      setPlacementId("");
                      return;
                    }
                    const [type, id] = value.split(":");
                    setPlacementType(type);
                    setPlacementId(id);
                  }}
                >
                  <SelectTrigger className="rounded-xl border border-white/10 bg-white/5 text-white">
                    <SelectValue placeholder="Choisir un emplacement" />
                  </SelectTrigger>
                  <SelectContent className="border border-white/10 bg-[#1a1a1a] text-white">
                    {placementOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-white">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <Select value={questionCount} onValueChange={setQuestionCount}>
                  <SelectTrigger className="rounded-xl border border-white/10 bg-white/5 text-white">
                    <SelectValue placeholder="Nombre de questions" />
                  </SelectTrigger>
                  <SelectContent className="border border-white/10 bg-[#1a1a1a] text-white">
                    {["5", "10", "15", "20"].map((value) => (
                      <SelectItem key={value} value={value} className="text-white">
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={questionType} onValueChange={setQuestionType}>
                  <SelectTrigger className="rounded-xl border border-white/10 bg-white/5 text-white">
                    <SelectValue placeholder="Type de questions" />
                  </SelectTrigger>
                  <SelectContent className="border border-white/10 bg-[#1a1a1a] text-white">
                    <SelectItem value="qcm" className="text-white">QCM (choix multiple)</SelectItem>
                    <SelectItem value="vrai_faux" className="text-white">Vrai / Faux</SelectItem>
                    <SelectItem value="ordering" className="text-white">Remise en ordre</SelectItem>
                    <SelectItem value="mixed" className="text-white">Mixte (tous les types)</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="rounded-xl border border-white/10 bg-white/5 text-white">
                    <SelectValue placeholder="Niveau de difficulté" />
                  </SelectTrigger>
                  <SelectContent className="border border-white/10 bg-[#1a1a1a] text-white">
                    {["Facile", "Moyen", "Difficile"].map((value) => (
                      <SelectItem key={value} value={value} className="text-white">
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="text-xs text-white/60">
                  <div className="mb-1">Points par bonne réponse</div>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={pointsPerQuestion}
                    onChange={(event) => setPointsPerQuestion(Number(event.target.value))}
                    placeholder="Points par bonne réponse"
                    className="rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30"
                  />
                </label>
                <label className="text-xs text-white/60">
                  <div className="mb-1">Pénalité mauvaise réponse</div>
                  <Input
                    type="number"
                    min={0}
                    max={5}
                    value={penalty}
                    onChange={(event) => setPenalty(Number(event.target.value))}
                    placeholder="Pénalité mauvaise réponse"
                    className="rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30"
                  />
                </label>
                <label className="text-xs text-white/60">
                  <div className="mb-1">Score minimum pour valider (%)</div>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={scoreMinimum}
                    onChange={(event) => setScoreMinimum(Number(event.target.value))}
                    placeholder="Score minimum (%)"
                    className="rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30"
                  />
                </label>
              </div>
              <Button
                type="button"
                onClick={handleGenerateQuiz}
                disabled={isGenerating}
                className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white"
              >
                ✨ Générer le quiz
              </Button>
              {isGenerating ? (
                <p className="text-xs text-white/60">L&apos;IA génère votre quiz...</p>
              ) : null}
              {generatedQuestions.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-white">Questions générées</p>
                  <div className="space-y-4">
                    {generatedQuestions.map((question, index) => {
                      const questionTypeValue = question.type || "qcm";
                      const options = questionTypeValue === "vrai_faux"
                        ? ["Vrai", "Faux"]
                        : question.options;
                      return (
                        <div key={`${question.question}-${index}`} className="rounded-2xl border border-white/10 bg-[#111] p-4 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <Input
                              value={question.question}
                              onChange={(event) =>
                                setGeneratedQuestions((prev) =>
                                  prev.map((row, idx) =>
                                    idx === index ? { ...row, question: event.target.value } : row,
                                  ),
                                )
                              }
                              className="rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setGeneratedQuestions((prev) => prev.filter((_, idx) => idx !== index))
                              }
                              className="text-red-400 hover:text-red-300"
                              aria-label="Supprimer la question"
                            >
                              🗑️
                            </button>
                          </div>
                          {questionTypeValue === "ordering" ? (
                            <div className="space-y-2">
                              {options.map((option, optIndex) => (
                                <div key={`${index}-${optIndex}`} className="flex items-center gap-2">
                                  <Input
                                    value={option}
                                    onChange={(event) =>
                                      setGeneratedQuestions((prev) =>
                                        prev.map((row, idx) =>
                                          idx === index
                                            ? {
                                                ...row,
                                                options: row.options.map((opt, optIdx) =>
                                                  optIdx === optIndex ? event.target.value : opt,
                                                ),
                                              }
                                            : row,
                                        ),
                                      )
                                    }
                                    className="rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30"
                                  />
                                  <button
                                    type="button"
                                    className="text-xs text-white/60 hover:text-white"
                                    onClick={() => moveOption(index, optIndex, "up")}
                                  >
                                    ↑
                                  </button>
                                  <button
                                    type="button"
                                    className="text-xs text-white/60 hover:text-white"
                                    onClick={() => moveOption(index, optIndex, "down")}
                                  >
                                    ↓
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="grid gap-2">
                              {options.map((option, optIndex) => (
                                <Input
                                  key={`${index}-${optIndex}`}
                                  value={option}
                                  onChange={(event) =>
                                    setGeneratedQuestions((prev) =>
                                      prev.map((row, idx) =>
                                        idx === index
                                          ? {
                                              ...row,
                                              options: row.options.map((opt, optIdx) =>
                                                optIdx === optIndex ? event.target.value : opt,
                                              ),
                                            }
                                          : row,
                                      ),
                                    )
                                  }
                                  className="rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30"
                                />
                              ))}
                            </div>
                          )}
                          <div className="grid gap-2 md:grid-cols-2">
                            {questionTypeValue !== "ordering" ? (
                              <Select
                                value={String(question.correct)}
                                onValueChange={(value) =>
                                  setGeneratedQuestions((prev) =>
                                    prev.map((row, idx) =>
                                      idx === index ? { ...row, correct: Number(value) } : row,
                                    ),
                                  )
                                }
                              >
                                <SelectTrigger className="rounded-xl border border-white/10 bg-white/5 text-white">
                                  <SelectValue placeholder="Bonne réponse" />
                                </SelectTrigger>
                                <SelectContent className="border border-white/10 bg-[#1a1a1a] text-white">
                                  {options.map((_, optIndex) => (
                                    <SelectItem key={`${index}-correct-${optIndex}`} value={String(optIndex)} className="text-white">
                                      Option {optIndex + 1}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60">
                                Ordre attendu : utilisez ↑ ↓
                              </div>
                            )}
                            <Input
                              type="number"
                              min={1}
                              max={10}
                              value={question.points ?? pointsPerQuestion}
                              onChange={(event) =>
                                setGeneratedQuestions((prev) =>
                                  prev.map((row, idx) =>
                                    idx === index ? { ...row, points: Number(event.target.value) } : row,
                                  ),
                                )
                              }
                              placeholder="Points"
                              className="rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30"
                            />
                          </div>
                          <Input
                            value={question.explication || ""}
                            onChange={(event) =>
                              setGeneratedQuestions((prev) =>
                                prev.map((row, idx) =>
                                  idx === index ? { ...row, explication: event.target.value } : row,
                                ),
                              )
                            }
                            placeholder="Explication"
                            className="rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30"
                          />
                        </div>
                      );
                    })}
                  </div>
                  <Button
                    type="button"
                    onClick={addManualQuestion}
                    className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white"
                  >
                    + Ajouter une question
                  </Button>
                </div>
              ) : null}
            </div>
            <div className="sticky bottom-0 border-t border-white/10 bg-[#0a0a0a]/95 px-6 py-4 backdrop-blur">
              <div className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsQuizModalOpen(false)}
                  className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white/60 hover:text-white hover:bg-white/10"
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveQuiz}
                  disabled={isSaving}
                  className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black"
                >
                  Sauvegarder
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

