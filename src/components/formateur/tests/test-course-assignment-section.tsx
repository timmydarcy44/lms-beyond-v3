"use client";

import { useState, useEffect } from "react";
import { BookOpen, Loader2, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

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

type TestCourseAssignmentSectionProps = {
  testId?: string;
  initialCourseId?: string;
  initialSectionId?: string;
  initialChapterId?: string;
  initialSubchapterId?: string;
  onAssignmentChange?: (assignment: {
    courseId: string;
    sectionId?: string;
    chapterId?: string;
    subchapterId?: string;
    positionAfterId?: string;
    positionType?: "after_section" | "after_chapter" | "after_subchapter";
  }) => void;
};

export function TestCourseAssignmentSection({
  testId,
  initialCourseId,
  initialSectionId,
  initialChapterId,
  initialSubchapterId,
  onAssignmentChange,
}: TestCourseAssignmentSectionProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(initialCourseId || "");
  const [selectedSectionId, setSelectedSectionId] = useState<string>(initialSectionId || "");
  const [selectedChapterId, setSelectedChapterId] = useState<string>(initialChapterId || "");
  const [selectedSubchapterId, setSelectedSubchapterId] = useState<string>(initialSubchapterId || "");
  const [positionAfterId, setPositionAfterId] = useState<string>("");
  const [positionType, setPositionType] = useState<"after_section" | "after_chapter" | "after_subchapter">("after_chapter");
  const [courseStructure, setCourseStructure] = useState<CourseSection[]>([]);
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [isLoadingStructure, setIsLoadingStructure] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId && selectedCourseId !== initialCourseId) {
      loadCourseStructure(selectedCourseId);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    if (onAssignmentChange && selectedCourseId) {
      onAssignmentChange({
        courseId: selectedCourseId,
        sectionId: selectedSectionId || undefined,
        chapterId: selectedChapterId || undefined,
        subchapterId: selectedSubchapterId || undefined,
        positionAfterId: positionAfterId || undefined,
        positionType: positionAfterId ? positionType : undefined,
      });
    }
  }, [selectedCourseId, selectedSectionId, selectedChapterId, selectedSubchapterId, positionAfterId, positionType, onAssignmentChange]);

  const loadCourses = async () => {
    setIsLoadingCourses(true);
    try {
      const response = await fetch("/api/formateur/courses");
      if (!response.ok) throw new Error("Erreur lors du chargement");
      const data = await response.json();
      setCourses(data.courses || []);
    } catch (error) {
      console.error("Error loading courses:", error);
      toast.error("Erreur lors du chargement des formations");
    } finally {
      setIsLoadingCourses(false);
    }
  };

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
      setCourseStructure([]);
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

  return (
    <div className="space-y-3 rounded-2xl border border-white/15 bg-black/35 px-4 py-4">
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-white/60" />
        <Label className="text-xs uppercase tracking-[0.3em] text-white/70 font-semibold">Assignation à une formation</Label>
      </div>
      <p className="text-xs text-white/50">Sélectionnez une formation pour positionner ce test (optionnel).</p>
      <div className="space-y-3">
        {/* Sélection de la formation */}
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-[0.3em] text-white/50">Formation</Label>
          {isLoadingCourses ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-white/60" />
            </div>
          ) : (
            <Select value={selectedCourseId} onValueChange={handleCourseChange}>
              <SelectTrigger className="border-white/15 bg-black/40 text-sm text-white">
                <SelectValue placeholder="Sélectionnez une formation (optionnel)" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-white/20">
                <SelectItem value="" className="text-white">Aucune formation</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id} className="text-white">
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Structure de la formation */}
        {selectedCourseId && (
          <div className="space-y-4">
            {isLoadingStructure ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-white/60" />
              </div>
            ) : courseStructure.length > 0 ? (
              <>
                {/* Sélection de la section */}
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.3em] text-white/50">Section (optionnel)</Label>
                  <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
                    <SelectTrigger className="border-white/15 bg-black/40 text-sm text-white">
                      <SelectValue placeholder="Sélectionnez une section" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-white/20">
                      <SelectItem value="" className="text-white">Aucune section spécifique</SelectItem>
                      {courseStructure.map((section) => (
                        <SelectItem key={section.id} value={section.id} className="text-white">
                          {section.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sélection du chapitre */}
                {selectedSectionId && courseStructure.find((s) => s.id === selectedSectionId)?.chapters.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-[0.3em] text-white/50">Chapitre (optionnel)</Label>
                    <Select value={selectedChapterId} onValueChange={setSelectedChapterId}>
                      <SelectTrigger className="border-white/15 bg-black/40 text-sm text-white">
                        <SelectValue placeholder="Sélectionnez un chapitre" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-white/20">
                        <SelectItem value="" className="text-white">Aucun chapitre spécifique</SelectItem>
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
                    <Label className="text-xs uppercase tracking-[0.3em] text-white/50">Positionnement</Label>
                    <p className="text-xs text-white/40">
                      Après quel élément souhaitez-vous placer le test ?
                    </p>
                    <Select value={positionType} onValueChange={(v) => setPositionType(v as typeof positionType)}>
                      <SelectTrigger className="border-white/15 bg-black/40 text-sm text-white">
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
                        <SelectTrigger className="border-white/15 bg-black/40 text-sm text-white mt-2">
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
              </>
            ) : (
              <p className="text-xs text-white/40 text-center py-4">
                Cette formation n&apos;a pas encore de structure définie.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

