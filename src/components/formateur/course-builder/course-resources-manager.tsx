"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { AddCourseResourceModal } from "./add-course-resource-modal";

type GeneratedQuestion = {
  question: string;
  options: string[];
  correct: number;
  explication?: string;
  points?: number;
  type?: string;
  image_keyword?: string;
};

export function CourseResourcesManager({ courseId }: { courseId?: string }) {
  const pathname = usePathname();
  const snapshot = useCourseBuilder((state) => state.snapshot);
  const resources = useCourseBuilder((state) => state.snapshot.resources);
  const tests = useCourseBuilder((state) => state.snapshot.tests);
  const removeResource = useCourseBuilder((state) => state.removeResource);
  const updateTest = useCourseBuilder((state) => state.updateTest);
  const removeTest = useCourseBuilder((state) => state.removeTest);
  const hydrateFromSnapshot = useCourseBuilder((state) => state.hydrateFromSnapshot);

  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
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
  const [quizTitle, setQuizTitle] = useState("");

  const usedResourceIds = useMemo(
    () =>
      resources
        .map((r) => r.resource_id)
        .filter((id): id is string => Boolean(id)),
    [resources],
  );

  const handleRemoveResource = (localId: string) => {
    removeResource(localId);
    toast.success("Ressource retirée de la formation.");
  };

  const effectiveCourseId = useMemo(() => {
    if (courseId) return String(courseId);
    const match = String(pathname ?? "").match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
    );
    return match ? match[0] : undefined;
  }, [courseId, pathname]);

  const placementOptions = useMemo(() => {
    const options: Array<{ value: string; label: string; type: string; id?: string }> = [
      { value: "end", label: "À la fin de la formation", type: "end" },
    ];
    snapshot.sections.forEach((section, sectionIndex) => {
      options.push({
        value: `after_section:${section.id}`,
        label: `À la fin de la section ${sectionIndex + 1} · ${section.title || "Sans titre"}`,
        type: "after_section",
        id: section.id,
      });
      section.chapters.forEach((chapter, chapterIndex) => {
        options.push({
          value: `after_chapter:${chapter.id}`,
          label: `À la fin du chapitre ${sectionIndex + 1}.${chapterIndex + 1} · ${chapter.title || "Sans titre"}`,
          type: "after_chapter",
          id: chapter.id,
        });
        chapter.subchapters.forEach((sub, subIndex) => {
          options.push({
            value: `after_subchapter:${sub.id}`,
            label: `Juste après le sous-chapitre ${sectionIndex + 1}.${chapterIndex + 1}.${subIndex + 1} · ${sub.title || "Sans titre"}`,
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
          image_keyword:
            typeof question.image_keyword === "string" && question.image_keyword.trim()
              ? question.image_keyword.trim()
              : undefined,
        })),
      );
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la génération du quiz.", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveQuiz = async () => {
    console.info("[quiz] SAVE_CLICK", { courseId: effectiveCourseId, generatedQuestionsCount: generatedQuestions.length });
    if (!effectiveCourseId) {
      toast.error("Enregistrez la formation avant de sauvegarder un quiz.");
      return;
    }
    const trimmedQuizTitle = quizTitle.trim();
    if (!trimmedQuizTitle) {
      toast.error("Indiquez un titre pour ce quiz.");
      return;
    }
    if (generatedQuestions.length === 0) {
      toast.error("Aucune question à sauvegarder.");
      return;
    }
    setIsSaving(true);
    const loadingId = toast.loading("Sauvegarde du quiz…");
    try {
      const response = await fetch("/api/formateur/quiz/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formation_id: effectiveCourseId,
          title: trimmedQuizTitle,
          titre: trimmedQuizTitle,
          description: "",
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
        const code = String(payload?.code ?? "");
        const message = String(payload?.error ?? "Sauvegarde impossible");
        const details = payload?.details || payload?.hint || payload?.code || "";
        const isMissingTable =
          code === "42P01" ||
          message.toLowerCase().includes("42p01") ||
          message.toLowerCase().includes("relation") && message.toLowerCase().includes("does not exist");
        if (isMissingTable) {
          throw new Error("La table de base de données [tests] est manquante. Veuillez contacter l'administrateur.");
        }
        throw new Error(details ? `${message} (${details})` : message);
      }
      const testId = payload?.test_id ? String(payload.test_id) : "";
      const quizUrl = testId ? `/quiz?testId=${encodeURIComponent(testId)}` : "";

      // Construire un snapshot unique (évite d'écraser `tests` lors de l'injection)
      const next = structuredClone(snapshot) as any;

      // Ajouter au snapshot.tests (réutilisable ensuite pour insertion manuelle / preview)
      const testLocalId = nanoid();
      next.tests = Array.isArray(next.tests) ? next.tests : [];
      next.tests = [...next.tests, { id: testLocalId, title: trimmedQuizTitle, type: "quiz", url: quizUrl }];

      // Injection : le quiz est un sous-chapitre (kind: "quiz"), jamais un chapitre vide dédié.
      const insertQuizBlock = (base: any) => {
        const updated = base as any;
        const quizBlock = {
          id: nanoid(),
          title: trimmedQuizTitle,
          duration: "",
          type: "document",
          summary: "",
          content: quizUrl
            ? `<p><a href="${quizUrl}" target="_blank" rel="noreferrer">Ouvrir le quiz</a></p>`
            : "<p>Ouvrir le quiz</p>",
          quiz_id: testId,
          kind: "quiz",
        };

        const appendQuizToChapter = (ch: any) => {
          if (!ch) return false;
          ch.subchapters = Array.isArray(ch.subchapters) ? ch.subchapters : [];
          ch.subchapters.push(quizBlock);
          return true;
        };

        const place = placementType;
        const pid = placementId;

        if (place === "after_section") {
          const sectionIndex = updated.sections.findIndex((s: any) => s.id === pid);
          if (sectionIndex >= 0) {
            const s = updated.sections[sectionIndex];
            s.chapters = Array.isArray(s.chapters) ? s.chapters : [];
            if (s.chapters.length === 0) {
              s.chapters.push({
                id: nanoid(),
                title: "Chapitre",
                duration: "",
                type: "document",
                summary: "",
                content: "",
                subchapters: [quizBlock],
              });
            } else {
              appendQuizToChapter(s.chapters[s.chapters.length - 1]);
            }
            return updated;
          }
        }

        if (place === "after_chapter") {
          for (const s of updated.sections) {
            const chapterIndex = (s.chapters || []).findIndex((c: any) => c.id === pid);
            if (chapterIndex >= 0) {
              const ch = s.chapters[chapterIndex];
              appendQuizToChapter(ch);
              return updated;
            }
          }
        }

        if (place === "after_subchapter") {
          for (const s of updated.sections) {
            for (const ch of s.chapters || []) {
              const subs = Array.isArray(ch.subchapters) ? ch.subchapters : [];
              const idx = subs.findIndex((sub: any) => sub.id === pid);
              if (idx >= 0) {
                ch.subchapters = subs;
                ch.subchapters.splice(idx + 1, 0, quizBlock);
                return updated;
              }
            }
          }
        }

        // end / fallback → dernier sous-chapitre du dernier chapitre du dernier module
        const lastSection = updated.sections[updated.sections.length - 1];
        if (lastSection) {
          lastSection.chapters = Array.isArray(lastSection.chapters) ? lastSection.chapters : [];
          if (lastSection.chapters.length === 0) {
            lastSection.chapters.push({
              id: nanoid(),
              title: "Chapitre",
              duration: "",
              type: "document",
              summary: "",
              content: "",
              subchapters: [quizBlock],
            });
          } else {
            appendQuizToChapter(lastSection.chapters[lastSection.chapters.length - 1]);
          }
          return updated;
        }

        // Aucune section → créer une section minimale avec un chapitre qui ne contient que le quiz
        updated.sections = updated.sections || [];
        updated.sections.push({
          id: nanoid(),
          title: "Section",
          description: "",
          chapters: [
            {
              id: nanoid(),
              title: "Chapitre",
              duration: "",
              type: "document",
              summary: "",
              content: "",
              subchapters: [quizBlock],
            },
          ],
        });
        return updated;
      };

      try {
        const injected = insertQuizBlock(next);
        hydrateFromSnapshot(injected);
      } catch (e) {
        console.warn("[quiz] injection failed", e);
        hydrateFromSnapshot(next);
      }

      toast.dismiss(loadingId);
      toast.success("Quiz créé", { description: "Le quiz a été ajouté au builder et à la liste des tests." });
      setIsQuizModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.dismiss(loadingId);
      toast.error("Erreur lors de la sauvegarde du quiz.", {
        description: error instanceof Error ? error.message : "Une erreur est survenue.",
      });
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
          <CardTitle className="text-[30px] font-semibold leading-tight">Ressources & tests associés</CardTitle>
          <p className="text-sm text-white/60">
            Liez rapidement des supports complémentaires et les évaluations que vos apprenants devront réaliser.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setIsResourceModalOpen(true)}
            className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-white/20"
          >
            <Plus className="mr-2 h-3.5 w-3.5" /> Ressource
          </Button>
          <Button
            onClick={() => {
              setQuizTitle("");
              setIsQuizModalOpen(true);
            }}
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
                  <div>
                    <p className="text-sm font-semibold text-white">{resource.title || "Ressource"}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/50">
                      {resource.type}
                      {resource.placement_label ? ` · ${resource.placement_label}` : ""}
                    </p>
                  </div>
                  {resource.url ? (
                    <p className="truncate text-xs text-sky-200/80">{resource.url}</p>
                  ) : null}
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleRemoveResource(resource.id)}
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
              Intégrez une ressource de votre bibliothèque et choisissez son emplacement dans le parcours.
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
        <DialogContent className="max-w-4xl overflow-hidden border border-white/10 bg-slate-950 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-fuchsia-900/20 p-0 text-white shadow-[0_40px_120px_-60px_rgba(15,23,42,0.9)] backdrop-blur-xl">
          <div className="flex max-h-[85vh] flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <DialogHeader>
                <DialogTitle className="text-white">Générer un quiz avec l&apos;IA</DialogTitle>
                <DialogDescription className="text-slate-300">
                  Choisissez les chapitres sources, positionnez le quiz, puis générez et ajustez vos questions.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="quiz-title" className="text-sm font-semibold text-white">
                  Titre du quiz <span className="text-rose-300">*</span>
                </Label>
                <Input
                  id="quiz-title"
                  value={quizTitle}
                  onChange={(event) => setQuizTitle(event.target.value)}
                  placeholder="Ex. : Bilan — fondamentaux HSE"
                  required
                  className="rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/35"
                />
                <p className="text-xs text-slate-300/80">Ce titre apparaîtra dans le sommaire côté apprenant.</p>
              </div>
              <div className="space-y-3 rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-slate-100 backdrop-blur-md">
                {snapshot.sections.map((section) => (
                  <div key={section.id} className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-white">
                      <input
                        type="checkbox"
                        checked={Boolean(selectedSectionIds[section.id])}
                        onChange={(event) => toggleSection(section.id, event.target.checked)}
                        className="accent-indigo-400"
                      />
                      {section.title || "Section"}
                    </label>
                    <div className="space-y-2 pl-4">
                      {section.chapters.map((chapter) => (
                        <div key={chapter.id} className="space-y-1">
                          <label className="flex items-center gap-2 text-sm text-slate-200">
                            <input
                              type="checkbox"
                              checked={Boolean(selectedChapterIds[chapter.id])}
                              onChange={(event) => toggleChapter(section.id, chapter.id, event.target.checked)}
                              className="accent-indigo-400"
                            />
                            Chapitre : {chapter.title || "Sans titre"}
                          </label>
                          <div className="space-y-1 pl-4 text-xs text-slate-300/90">
                            {chapter.subchapters.map((sub) => (
                              <label key={sub.id} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={Boolean(selectedSubchapterIds[sub.id])}
                                  onChange={(event) => toggleSubchapter(sub.id, event.target.checked)}
                                  className="accent-indigo-400"
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
                  <SelectContent className="border border-white/10 bg-slate-950/95 text-white backdrop-blur-xl">
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
                  <SelectContent className="border border-white/10 bg-slate-950/95 text-white backdrop-blur-xl">
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
                  <SelectContent className="border border-white/10 bg-slate-950/95 text-white backdrop-blur-xl">
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
                  <SelectContent className="border border-white/10 bg-slate-950/95 text-white backdrop-blur-xl">
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
                        <div key={`${question.question}-${index}`} className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-md">
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
                                <SelectContent className="border border-white/10 bg-slate-950/95 text-white backdrop-blur-xl">
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
            <div className="sticky bottom-0 border-t border-white/10 bg-slate-950/80 px-6 py-4 backdrop-blur-xl">
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
                  className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-white/90"
                >
                  Sauvegarder
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AddCourseResourceModal
        open={isResourceModalOpen}
        onOpenChange={setIsResourceModalOpen}
        usedResourceIds={usedResourceIds}
      />
    </Card>
  );
}

