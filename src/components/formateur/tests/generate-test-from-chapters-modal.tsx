"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2, Check, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import type { TestBuilderQuestion } from "@/types/test-builder";

type CourseSection = {
  id: string;
  title: string;
  chapters: CourseChapter[];
};

type CourseChapter = {
  id: string;
  title: string;
  subchapters?: CourseSubchapter[];
};

type CourseSubchapter = {
  id: string;
  title: string;
};

type GenerateTestFromChaptersModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQuestionsGenerated: (questions: TestBuilderQuestion[]) => void;
};

export function GenerateTestFromChaptersModal({
  open,
  onOpenChange,
  onQuestionsGenerated,
}: GenerateTestFromChaptersModalProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
  const [numberOfQuestions, setNumberOfQuestions] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [questionTypes, setQuestionTypes] = useState<("multiple" | "single" | "text")[]>(["multiple", "single"]);
  
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);
  const [courseStructure, setCourseStructure] = useState<CourseSection[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [isLoadingStructure, setIsLoadingStructure] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (open) {
      loadCourses();
    }
  }, [open]);

  useEffect(() => {
    if (selectedCourseId) {
      loadCourseStructure(selectedCourseId);
    } else {
      setCourseStructure([]);
      setSelectedChapterIds([]);
    }
  }, [selectedCourseId]);

  const loadCourses = async () => {
    setIsLoadingCourses(true);
    try {
      const response = await fetch("/api/formateur/courses");
      if (!response.ok) throw new Error("Erreur lors du chargement des formations");
      const data = await response.json();
      setCourses(data.courses || []);
    } catch (error) {
      console.error("Error loading courses:", error);
      toast.error("Erreur", {
        description: "Impossible de charger les formations",
      });
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const loadCourseStructure = async (courseId: string) => {
    setIsLoadingStructure(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/structure`);
      if (!response.ok) throw new Error("Erreur lors du chargement de la structure");
      const data = await response.json();
      setCourseStructure(data.sections || []);
    } catch (error) {
      console.error("Error loading course structure:", error);
      toast.error("Erreur", {
        description: "Impossible de charger la structure de la formation",
      });
    } finally {
      setIsLoadingStructure(false);
    }
  };

  const toggleChapter = (chapterId: string) => {
    setSelectedChapterIds((prev) =>
      prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  const handleGenerate = async () => {
    if (!selectedCourseId || selectedChapterIds.length === 0) {
      toast.error("Sélection requise", {
        description: "Veuillez sélectionner une formation et au moins un chapitre",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/generate-test-from-chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourseId,
          chapterIds: selectedChapterIds,
          numberOfQuestions,
          difficulty,
          questionTypes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.details 
          ? `${errorData.error || "Erreur lors de la génération"}: ${errorData.details}`
          : errorData.error || "Erreur lors de la génération";
        console.error("[generate-test-from-chapters-modal] API Error:", {
          status: response.status,
          error: errorData,
        });
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        onQuestionsGenerated(data.questions);
        toast.success("Questions générées", {
          description: `${data.questions.length} questions ont été générées avec succès`,
        });
        onOpenChange(false);
        // Reset
        setSelectedCourseId("");
        setSelectedChapterIds([]);
      } else {
        throw new Error("Aucune question générée");
      }
    } catch (error) {
      console.error("Error generating test:", error);
      toast.error("Erreur", {
        description: error instanceof Error ? error.message : "Impossible de générer les questions",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const allChapters = courseStructure.flatMap((section) =>
    section.chapters.map((chapter) => ({
      ...chapter,
      sectionTitle: section.title,
    }))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-white/10 bg-[#06070d]/95 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <Sparkles className="h-5 w-5 text-[#00C6FF]" />
            Générer un test à partir des chapitres
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Sélectionnez une formation et les chapitres pour générer automatiquement des questions d'évaluation avec l'IA
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Sélection de la formation */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">
              Formation
            </Label>
            <Select
              value={selectedCourseId}
              onValueChange={setSelectedCourseId}
              disabled={isLoadingCourses}
            >
              <SelectTrigger className="border-white/15 bg-black/40 text-white">
                <SelectValue placeholder={isLoadingCourses ? "Chargement..." : "Sélectionner une formation"} />
              </SelectTrigger>
              <SelectContent className="bg-[#0f172a] text-white">
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sélection des chapitres */}
          {selectedCourseId && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">
                Chapitres à évaluer ({selectedChapterIds.length} sélectionné{selectedChapterIds.length > 1 ? "s" : ""})
              </Label>
              {isLoadingStructure ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-white/60" />
                </div>
              ) : allChapters.length === 0 ? (
                <p className="text-sm text-white/50">Aucun chapitre disponible dans cette formation</p>
              ) : (
                <div className="grid gap-3 max-h-[300px] overflow-y-auto">
                  {allChapters.map((chapter) => {
                    const isSelected = selectedChapterIds.includes(chapter.id);
                    return (
                      <Card
                        key={chapter.id}
                        className={`
                          cursor-pointer transition-all border-white/10 bg-black/30
                          ${isSelected ? "border-[#00C6FF]/50 bg-[#00C6FF]/10" : "hover:border-white/20"}
                        `}
                        onClick={() => toggleChapter(chapter.id)}
                      >
                        <CardContent className="flex items-center gap-3 p-4">
                          <div
                            className={`
                              flex h-5 w-5 items-center justify-center rounded border transition
                              ${isSelected ? "border-[#00C6FF] bg-[#00C6FF]/20" : "border-white/30"}
                            `}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5 text-[#00C6FF]" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-white/60" />
                              <p className="font-medium text-white">{chapter.title}</p>
                            </div>
                            <p className="text-xs text-white/50 mt-1">{chapter.sectionTitle}</p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Options de génération */}
          {selectedCourseId && selectedChapterIds.length > 0 && (
            <div className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-4">
              <Label className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">
                Options de génération
              </Label>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs text-white/60">Nombre de questions</Label>
                  <Select
                    value={String(numberOfQuestions)}
                    onValueChange={(value) => setNumberOfQuestions(Number(value))}
                  >
                    <SelectTrigger className="border-white/15 bg-black/40 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f172a] text-white">
                      {[5, 10, 15, 20, 25, 30].map((num) => (
                        <SelectItem key={num} value={String(num)}>
                          {num} questions
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-white/60">Difficulté</Label>
                  <Select
                    value={difficulty}
                    onValueChange={(value) => setDifficulty(value as "easy" | "medium" | "hard")}
                  >
                    <SelectTrigger className="border-white/15 bg-black/40 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f172a] text-white">
                      <SelectItem value="easy">Facile</SelectItem>
                      <SelectItem value="medium">Moyen</SelectItem>
                      <SelectItem value="hard">Difficile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-full border border-white/20 text-white/80 hover:bg-white/10"
            >
              Annuler
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!selectedCourseId || selectedChapterIds.length === 0 || isGenerating}
              className="rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:opacity-90 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Générer les questions
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

