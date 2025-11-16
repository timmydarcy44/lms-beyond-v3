"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, X, GripVertical, Trash2, Edit2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CourseBuilderSection } from "@/types/course-builder";
import { cn } from "@/lib/utils";
import { useCourseBuilder } from "@/hooks/use-course-builder";

export default function CourseValidationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydrate = useCourseBuilder((state) => state.hydrateFromSnapshot);
  const getSnapshot = useCourseBuilder((state) => state.getSnapshot);

  const [title, setTitle] = useState("");
  const [structure, setStructure] = useState<CourseBuilderSection[]>([]);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingChapter, setEditingChapter] = useState<{ sectionId: string; chapterId: string } | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    const titleParam = searchParams.get("title");
    const structureParam = searchParams.get("structure");

    if (titleParam) {
      setTitle(titleParam);
    }

    if (structureParam) {
      try {
        const parsed = JSON.parse(structureParam);
        setStructure(parsed.sections || parsed || []);
      } catch (error) {
        console.error("[validate] Error parsing structure:", error);
      }
    }
  }, [searchParams]);

  const handleRemoveSection = (sectionId: string) => {
    setStructure((prev) => prev.filter((s) => s.id !== sectionId));
  };

  const handleRemoveChapter = (sectionId: string, chapterId: string) => {
    setStructure((prev) =>
      prev.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            chapters: section.chapters.filter((ch) => ch.id !== chapterId),
          };
        }
        return section;
      })
    );
  };

  const handleRemoveSubchapter = (sectionId: string, chapterId: string, subchapterId: string) => {
    setStructure((prev) =>
      prev.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            chapters: section.chapters.map((chapter) => {
              if (chapter.id === chapterId) {
                return {
                  ...chapter,
                  subchapters: chapter.subchapters.filter((sub) => sub.id !== subchapterId),
                };
              }
              return chapter;
            }),
          };
        }
        return section;
      })
    );
  };

  const handleEdit = (type: "section" | "chapter" | "subchapter", id: string, currentValue: string) => {
    if (type === "section") {
      setEditingSection(id);
    } else if (type === "chapter") {
      const [sectionId, chapterId] = id.split(":");
      setEditingChapter({ sectionId, chapterId });
    }
    setEditValue(currentValue);
  };

  const handleSaveEdit = () => {
    if (editingSection) {
      setStructure((prev) =>
        prev.map((section) => {
          if (section.id === editingSection) {
            return { ...section, title: editValue };
          }
          return section;
        })
      );
      setEditingSection(null);
    } else if (editingChapter) {
      setStructure((prev) =>
        prev.map((section) => {
          if (section.id === editingChapter.sectionId) {
            return {
              ...section,
              chapters: section.chapters.map((chapter) => {
                if (chapter.id === editingChapter.chapterId) {
                  return { ...chapter, title: editValue };
                }
                return chapter;
              }),
            };
          }
          return section;
        })
      );
      setEditingChapter(null);
    }
    setEditValue("");
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setEditingChapter(null);
    setEditValue("");
  };

  const handleValidate = () => {
    // Créer un snapshot avec la structure validée
    const snapshot = {
      general: {
        title,
        subtitle: "",
        description: "",
        category: "",
        level: "",
        duration: "",
        heroImage: "",
        trailerUrl: "",
        badgeLabel: "",
        badgeDescription: "",
      },
      objectives: [],
      skills: [],
      sections: structure,
      resources: [],
      tests: [],
    };

    // Hydrater le builder avec cette structure
    hydrate(snapshot);

    // Rediriger vers les métadonnées
    router.push("/dashboard/formateur/formations/new/metadata");
  };

  return (
    <DashboardShell
      title="Validation de la structure"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/formateur" },
        { label: "Formateur", href: "/dashboard/formateur" },
        { label: "Formations", href: "/dashboard/formateur/formations" },
        { label: "Nouvelle formation", href: "/dashboard/formateur/formations/new" },
        { label: "Validation" },
      ]}
      initialCollapsed
    >
      <div className="space-y-6">
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-semibold">Validation de la nomenclature</CardTitle>
                <p className="text-sm text-white/60 mt-2">
                  Vérifiez, modifiez ou réorganisez la structure générée avant de l&apos;intégrer au builder
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="rounded-full border border-white/20 text-white hover:bg-white/10"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
            </div>
          </CardHeader>
        </Card>

        {structure.length === 0 ? (
          <Card className="border-white/10 bg-white/5 text-white">
            <CardContent className="py-12 text-center">
              <p className="text-white/60">Aucune structure à valider</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {structure.map((section) => (
              <Card key={section.id} className="border-white/10 bg-white/5 text-white">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      {editingSection === section.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-white/20 focus:outline-none"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit();
                              if (e.key === "Escape") handleCancelEdit();
                            }}
                            autoFocus
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={handleSaveEdit}
                            className="h-8 w-8 text-green-400 hover:text-green-300"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={handleCancelEdit}
                            className="h-8 w-8 text-red-400 hover:text-red-300"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-5 w-5 text-white/40" />
                          <h3 className="text-lg font-semibold">{section.title}</h3>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit("section", section.id, section.title)}
                            className="h-6 w-6 text-white/60 hover:text-white"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemoveSection(section.id)}
                            className="h-6 w-6 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                      {section.description && (
                        <p className="text-sm text-white/60 mt-1 ml-7">{section.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="ml-7 space-y-3">
                    {section.chapters.map((chapter) => (
                      <div key={chapter.id} className="border-l-2 border-white/10 pl-4">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          {editingChapter?.sectionId === section.id &&
                          editingChapter?.chapterId === chapter.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/20 focus:outline-none"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveEdit();
                                  if (e.key === "Escape") handleCancelEdit();
                                }}
                                autoFocus
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={handleSaveEdit}
                                className="h-7 w-7 text-green-400 hover:text-green-300"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={handleCancelEdit}
                                className="h-7 w-7 text-red-400 hover:text-red-300"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <h4 className="text-base font-medium text-white/90">{chapter.title}</h4>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() =>
                                    handleEdit("chapter", `${section.id}:${chapter.id}`, chapter.title)
                                  }
                                  className="h-6 w-6 text-white/60 hover:text-white"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleRemoveChapter(section.id, chapter.id)}
                                  className="h-6 w-6 text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>

                        {chapter.subchapters.length > 0 && (
                          <div className="ml-4 space-y-1">
                            {chapter.subchapters.map((subchapter) => (
                              <div
                                key={subchapter.id}
                                className="flex items-center justify-between gap-2 text-sm text-white/70"
                              >
                                <span>{subchapter.title}</span>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() =>
                                    handleRemoveSubchapter(section.id, chapter.id, subchapter.id)
                                  }
                                  className="h-5 w-5 text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="rounded-full border border-white/20 text-white hover:bg-white/10"
          >
            Annuler
          </Button>
          <Button
            onClick={handleValidate}
            disabled={structure.length === 0}
            className="rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-6 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
          >
            Valider et intégrer au builder
            <Check className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </DashboardShell>
  );
}


