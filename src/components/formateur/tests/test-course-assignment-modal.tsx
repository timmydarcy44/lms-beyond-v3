"use client";

import { useState, useTransition } from "react";
import { BookOpen, Loader2, Check, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

type TestCourseAssignmentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testId: string;
  testTitle: string;
  courses: Array<{ id: string; title: string }>;
  onAssign: (assignment: {
    courseId: string;
    sectionId?: string;
    chapterId?: string;
    subchapterId?: string;
    positionAfterId?: string;
    positionType?: "after_section" | "after_chapter" | "after_subchapter";
  }) => Promise<void>;
};

export function TestCourseAssignmentModal({
  open,
  onOpenChange,
  testId,
  testTitle,
  courses,
  onAssign,
}: TestCourseAssignmentModalProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");
  const [selectedSubchapterId, setSelectedSubchapterId] = useState<string>("");
  const [positionAfterId, setPositionAfterId] = useState<string>("");
  const [positionType, setPositionType] = useState<"after_section" | "after_chapter" | "after_subchapter">("after_chapter");
  const [courseStructure, setCourseStructure] = useState<CourseSection[]>([]);
  const [isLoadingStructure, setIsLoadingStructure] = useState(false);
  const [isPending, startTransition] = useTransition();

  const loadCourseStructure = async (courseId: string) => {
    setIsLoadingStructure(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/structure`);
      if (!response.ok) throw new Error("Erreur lors du chargement");
      const data = await response.json();
      setCourseStructure(data.sections || []);
    } catch (error) {
      console.error("Error loading course structure:", error);
      toast.error("Erreur lors du chargement de la structure");
    } finally {
      setIsLoadingStructure(false);
    }
  };

  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    setSelectedSectionId("");
    setSelectedChapterId("");
    setSelectedSubchapterId("");
    setPositionAfterId("");
    setCourseStructure([]);
    if (courseId) {
      loadCourseStructure(courseId);
    }
  };

  const handleAssign = () => {
    if (!selectedCourseId) {
      toast.error("Sélectionnez une formation");
      return;
    }

    startTransition(async () => {
      try {
        await onAssign({
          courseId: selectedCourseId,
          sectionId: selectedSectionId || undefined,
          chapterId: selectedChapterId || undefined,
          subchapterId: selectedSubchapterId || undefined,
          positionAfterId: positionAfterId || undefined,
          positionType: positionAfterId ? positionType : undefined,
        });
        toast.success("Test assigné à la formation avec succès");
        onOpenChange(false);
      } catch (error) {
        toast.error("Erreur lors de l'assignation");
        console.error(error);
      }
    });
  };

  const handleClose = () => {
    if (!isPending) {
      setSelectedCourseId("");
      setSelectedSectionId("");
      setSelectedChapterId("");
      setSelectedSubchapterId("");
      setPositionAfterId("");
      setCourseStructure([]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-gray-900 text-white border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Assigner le test à une formation</DialogTitle>
          <DialogDescription className="text-white/60">
            Positionnez "{testTitle}" dans une formation en sélectionnant où il doit apparaître.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sélection de la formation */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-white">Formation</Label>
            <Select value={selectedCourseId} onValueChange={handleCourseChange}>
              <SelectTrigger className="bg-white/5 border-white/20 text-white">
                <SelectValue placeholder="Sélectionnez une formation" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-white/20">
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id} className="text-white">
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Structure de la formation */}
          {isLoadingStructure ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-white/60" />
            </div>
          ) : courseStructure.length > 0 ? (
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {/* Sélection de la section */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">Section (optionnel)</Label>
                <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Sélectionnez une section" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-white/20">
                    <SelectItem value="none" className="text-white">Aucune section spécifique</SelectItem>
                    {courseStructure.map((section) => (
                      <SelectItem key={section.id} value={section.id} className="text-white">
                        {section.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sélection du chapitre */}
              {selectedSectionId && courseStructure.find((s) => s.id === selectedSectionId)?.chapters && courseStructure.find((s) => s.id === selectedSectionId)!.chapters.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-white">Chapitre (optionnel)</Label>
                  <Select value={selectedChapterId} onValueChange={setSelectedChapterId}>
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue placeholder="Sélectionnez un chapitre" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-white/20">
                      <SelectItem value="none" className="text-white">Aucun chapitre spécifique</SelectItem>
                      {courseStructure
                        .find((s) => s.id === selectedSectionId)
                        ?.chapters.map((chapter) => (
                          <SelectItem key={chapter.id} value={chapter.id} className="text-white">
                            {chapter.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Positionnement */}
              {(selectedSectionId || selectedChapterId) && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-white">Positionnement</Label>
                  <p className="text-xs text-white/50">
                    Après quel élément souhaitez-vous placer le test ?
                  </p>
                  <Select value={positionType} onValueChange={(v) => setPositionType(v as typeof positionType)}>
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-white/20">
                      <SelectItem value="after_section" className="text-white">Après une section</SelectItem>
                      <SelectItem value="after_chapter" className="text-white">Après un chapitre</SelectItem>
                      <SelectItem value="after_subchapter" className="text-white">Après un sous-chapitre</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Sélection de l'élément après lequel placer */}
                  {positionType && (
                    <Select value={positionAfterId} onValueChange={setPositionAfterId}>
                      <SelectTrigger className="bg-white/5 border-white/20 text-white mt-2">
                        <SelectValue placeholder="Sélectionnez l'élément" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-white/20">
                        {positionType === "after_section" &&
                          courseStructure.map((section) => (
                            <SelectItem key={section.id} value={section.id} className="text-white">
                              Après "{section.title}"
                            </SelectItem>
                          ))}
                        {positionType === "after_chapter" &&
                          courseStructure
                            .flatMap((s) => s.chapters)
                            .map((chapter) => (
                              <SelectItem key={chapter.id} value={chapter.id} className="text-white">
                                Après "{chapter.title}"
                              </SelectItem>
                            ))}
                        {positionType === "after_subchapter" &&
                          courseStructure
                            .flatMap((s) => s.chapters)
                            .flatMap((c) => c.subchapters || [])
                            .map((subchapter) => (
                              <SelectItem key={subchapter.id} value={subchapter.id} className="text-white">
                                Après "{subchapter.title}"
                              </SelectItem>
                            ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
            </div>
          ) : selectedCourseId ? (
            <p className="text-sm text-white/50 text-center py-4">
              Cette formation n&apos;a pas encore de structure définie.
            </p>
          ) : null}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isPending}
            className="border-white/20 text-white/80 hover:bg-white/10"
          >
            Annuler
          </Button>
          <Button
            onClick={handleAssign}
            disabled={isPending || !selectedCourseId}
            className="bg-gradient-to-r from-[#00C6FF] to-[#0072FF] text-white hover:opacity-90"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assignation...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Assigner
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}





