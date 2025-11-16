"use client";

import { useState, useTransition } from "react";
import { BookOpen, FileText, Layers, PenTool, Loader2, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { assignContentToLearner } from "@/app/dashboard/formateur/apprenants/actions";
import { cn } from "@/lib/utils";

type AssignableContent = {
  courses: Array<{ id: string; title: string; status: string }>;
  paths: Array<{ id: string; title: string; status: string }>;
  resources: Array<{ id: string; title: string; published: boolean }>;
  tests: Array<{ id: string; title: string; status: string }>;
};

type LearnerAssignmentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  learner: { id: string; full_name: string | null; email: string | null };
  content: AssignableContent;
};

export function LearnerAssignmentModal({
  open,
  onOpenChange,
  learner,
  content,
}: LearnerAssignmentModalProps) {
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [selectedResources, setSelectedResources] = useState<Set<string>>(new Set());
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const handleToggleCourse = (courseId: string) => {
    setSelectedCourses((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      return next;
    });
  };

  const handleTogglePath = (pathId: string) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(pathId)) {
        next.delete(pathId);
      } else {
        next.add(pathId);
      }
      return next;
    });
  };

  const handleToggleResource = (resourceId: string) => {
    setSelectedResources((prev) => {
      const next = new Set(prev);
      if (next.has(resourceId)) {
        next.delete(resourceId);
      } else {
        next.add(resourceId);
      }
      return next;
    });
  };

  const handleToggleTest = (testId: string) => {
    setSelectedTests((prev) => {
      const next = new Set(prev);
      if (next.has(testId)) {
        next.delete(testId);
      } else {
        next.add(testId);
      }
      return next;
    });
  };

  const handleAssign = () => {
    const totalSelected =
      selectedCourses.size + selectedPaths.size + selectedResources.size + selectedTests.size;

    if (totalSelected === 0) {
      toast.error("Sélectionnez au moins un élément à assigner");
      return;
    }

    startTransition(async () => {
      try {
        const result = await assignContentToLearner(learner.id, {
          courseIds: Array.from(selectedCourses),
          pathIds: Array.from(selectedPaths),
          resourceIds: Array.from(selectedResources),
          testIds: Array.from(selectedTests),
        });

        if (result.success) {
          toast.success(`${result.count} élément(s) assigné(s) avec succès`);
          // Réinitialiser les sélections
          setSelectedCourses(new Set());
          setSelectedPaths(new Set());
          setSelectedResources(new Set());
          setSelectedTests(new Set());
          onOpenChange(false);
        } else {
          toast.error(result.error ?? "Erreur lors de l'assignation");
        }
      } catch (error) {
        toast.error("Une erreur est survenue");
        console.error(error);
      }
    });
  };

  const handleClose = () => {
    if (!isPending) {
      setSelectedCourses(new Set());
      setSelectedPaths(new Set());
      setSelectedResources(new Set());
      setSelectedTests(new Set());
      onOpenChange(false);
    }
  };

  const totalSelected =
    selectedCourses.size + selectedPaths.size + selectedResources.size + selectedTests.size;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Assigner du contenu à {learner.full_name ?? learner.email}</DialogTitle>
          <DialogDescription>
            Sélectionnez les formations, parcours, ressources et tests à assigner à cet apprenant.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="courses" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="courses" className="relative">
              Formations
              {selectedCourses.size > 0 && (
                <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs">{selectedCourses.size}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="paths" className="relative">
              Parcours
              {selectedPaths.size > 0 && (
                <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs">{selectedPaths.size}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="resources" className="relative">
              Ressources
              {selectedResources.size > 0 && (
                <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs">{selectedResources.size}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="tests" className="relative">
              Tests
              {selectedTests.size > 0 && (
                <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs">{selectedTests.size}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 mt-4 overflow-y-auto max-h-[400px] pr-2">
            <TabsContent value="courses" className="space-y-2 mt-0">
              {content.courses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BookOpen className="h-12 w-12 text-white/20 mb-4" />
                  <p className="text-sm text-white/60">Aucune formation disponible</p>
                </div>
              ) : (
                content.courses.map((course) => (
                  <div
                    key={course.id}
                    className={cn(
                      "flex items-center space-x-3 rounded-lg border p-4 transition",
                      selectedCourses.has(course.id)
                        ? "border-white/30 bg-white/10"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    )}
                  >
                    <Checkbox
                      id={`course-${course.id}`}
                      checked={selectedCourses.has(course.id)}
                      onCheckedChange={() => handleToggleCourse(course.id)}
                      disabled={isPending}
                    />
                    <Label
                      htmlFor={`course-${course.id}`}
                      className="flex-1 cursor-pointer space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-white/60" />
                        <span className="font-medium text-white">{course.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            course.status === "published"
                              ? "border-emerald-500/30 text-emerald-200"
                              : "border-yellow-500/30 text-yellow-200"
                          )}
                        >
                          {course.status === "published" ? "Publié" : "Brouillon"}
                        </Badge>
                      </div>
                    </Label>
                    {selectedCourses.has(course.id) && (
                      <Check className="h-5 w-5 text-emerald-400" />
                    )}
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="paths" className="space-y-2 mt-0">
              {content.paths.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Layers className="h-12 w-12 text-white/20 mb-4" />
                  <p className="text-sm text-white/60">Aucun parcours disponible</p>
                </div>
              ) : (
                content.paths.map((path) => (
                  <div
                    key={path.id}
                    className={cn(
                      "flex items-center space-x-3 rounded-lg border p-4 transition",
                      selectedPaths.has(path.id)
                        ? "border-white/30 bg-white/10"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    )}
                  >
                    <Checkbox
                      id={`path-${path.id}`}
                      checked={selectedPaths.has(path.id)}
                      onCheckedChange={() => handleTogglePath(path.id)}
                      disabled={isPending}
                    />
                    <Label htmlFor={`path-${path.id}`} className="flex-1 cursor-pointer space-y-1">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-white/60" />
                        <span className="font-medium text-white">{path.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            path.status === "published"
                              ? "border-emerald-500/30 text-emerald-200"
                              : "border-yellow-500/30 text-yellow-200"
                          )}
                        >
                          {path.status === "published" ? "Publié" : "Brouillon"}
                        </Badge>
                      </div>
                    </Label>
                    {selectedPaths.has(path.id) && (
                      <Check className="h-5 w-5 text-emerald-400" />
                    )}
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="resources" className="space-y-2 mt-0">
              {content.resources.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-white/20 mb-4" />
                  <p className="text-sm text-white/60">Aucune ressource disponible</p>
                </div>
              ) : (
                content.resources.map((resource) => (
                  <div
                    key={resource.id}
                    className={cn(
                      "flex items-center space-x-3 rounded-lg border p-4 transition",
                      selectedResources.has(resource.id)
                        ? "border-white/30 bg-white/10"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    )}
                  >
                    <Checkbox
                      id={`resource-${resource.id}`}
                      checked={selectedResources.has(resource.id)}
                      onCheckedChange={() => handleToggleResource(resource.id)}
                      disabled={isPending}
                    />
                    <Label
                      htmlFor={`resource-${resource.id}`}
                      className="flex-1 cursor-pointer space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-white/60" />
                        <span className="font-medium text-white">{resource.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            resource.published
                              ? "border-emerald-500/30 text-emerald-200"
                              : "border-yellow-500/30 text-yellow-200"
                          )}
                        >
                          {resource.published ? "Publié" : "Brouillon"}
                        </Badge>
                      </div>
                    </Label>
                    {selectedResources.has(resource.id) && (
                      <Check className="h-5 w-5 text-emerald-400" />
                    )}
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="tests" className="space-y-2 mt-0">
              {content.tests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <PenTool className="h-12 w-12 text-white/20 mb-4" />
                  <p className="text-sm text-white/60">Aucun test disponible</p>
                </div>
              ) : (
                content.tests.map((test) => (
                  <div
                    key={test.id}
                    className={cn(
                      "flex items-center space-x-3 rounded-lg border p-4 transition",
                      selectedTests.has(test.id)
                        ? "border-white/30 bg-white/10"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    )}
                  >
                    <Checkbox
                      id={`test-${test.id}`}
                      checked={selectedTests.has(test.id)}
                      onCheckedChange={() => handleToggleTest(test.id)}
                      disabled={isPending}
                    />
                    <Label htmlFor={`test-${test.id}`} className="flex-1 cursor-pointer space-y-1">
                      <div className="flex items-center gap-2">
                        <PenTool className="h-4 w-4 text-white/60" />
                        <span className="font-medium text-white">{test.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            test.status === "published"
                              ? "border-emerald-500/30 text-emerald-200"
                              : "border-yellow-500/30 text-yellow-200"
                          )}
                        >
                          {test.status === "published" ? "Publié" : "Brouillon"}
                        </Badge>
                      </div>
                    </Label>
                    {selectedTests.has(test.id) && (
                      <Check className="h-5 w-5 text-emerald-400" />
                    )}
                  </div>
                ))
              )}
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="border-t border-white/10 pt-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-white/60">
              {totalSelected > 0 ? (
                <span>{totalSelected} élément{totalSelected > 1 ? "s" : ""} sélectionné{totalSelected > 1 ? "s" : ""}</span>
              ) : (
                <span>Sélectionnez du contenu à assigner</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} disabled={isPending}>
                Annuler
              </Button>
              <Button onClick={handleAssign} disabled={isPending || totalSelected === 0}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assignation...
                  </>
                ) : (
                  "Assigner"
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

