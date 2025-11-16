"use client";

import { useState, useTransition } from "react";
import { BookOpen, FileText, Layers, Loader2, Check } from "lucide-react";
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
import { cn } from "@/lib/utils";

type AssignableContent = {
  courses: Array<{ id: string; title: string; status: string }>;
  resources: Array<{ id: string; title: string; published: boolean }>;
  tests: Array<{ id: string; title: string; status: string }>;
};

type PathContentAssignmentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pathId: string;
  pathTitle: string;
  content: AssignableContent;
  onAssign: (content: { courseIds: string[]; testIds: string[]; resourceIds: string[] }) => Promise<void>;
};

export function PathContentAssignmentModal({
  open,
  onOpenChange,
  pathId,
  pathTitle,
  content,
  onAssign,
}: PathContentAssignmentModalProps) {
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
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
    const totalSelected = selectedCourses.size + selectedResources.size + selectedTests.size;

    if (totalSelected === 0) {
      toast.error("Sélectionnez au moins un élément à assigner");
      return;
    }

    startTransition(async () => {
      try {
        await onAssign({
          courseIds: Array.from(selectedCourses),
          testIds: Array.from(selectedTests),
          resourceIds: Array.from(selectedResources),
        });
        
        toast.success(`${totalSelected} élément(s) ajouté(s) au parcours`);
        // Réinitialiser les sélections
        setSelectedCourses(new Set());
        setSelectedResources(new Set());
        setSelectedTests(new Set());
        onOpenChange(false);
      } catch (error) {
        toast.error("Erreur lors de l'ajout du contenu");
        console.error(error);
      }
    });
  };

  const handleClose = () => {
    if (!isPending) {
      setSelectedCourses(new Set());
      setSelectedResources(new Set());
      setSelectedTests(new Set());
      onOpenChange(false);
    }
  };

  const totalSelected = selectedCourses.size + selectedResources.size + selectedTests.size;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl bg-gray-900 text-white border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Assigner du contenu au parcours</DialogTitle>
          <DialogDescription className="text-white/60">
            Sélectionnez les formations, tests et ressources à ajouter au parcours "{pathTitle}".
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="courses" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/5">
            <TabsTrigger value="courses" className="data-[state=active]:bg-white/10">
              <BookOpen className="mr-2 h-4 w-4" />
              Formations ({content.courses.length})
            </TabsTrigger>
            <TabsTrigger value="tests" className="data-[state=active]:bg-white/10">
              <Layers className="mr-2 h-4 w-4" />
              Tests ({content.tests.length})
            </TabsTrigger>
            <TabsTrigger value="resources" className="data-[state=active]:bg-white/10">
              <FileText className="mr-2 h-4 w-4" />
              Ressources ({content.resources.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="mt-4 space-y-3 max-h-[400px] overflow-y-auto">
            {content.courses.length === 0 ? (
              <p className="text-sm text-white/50 text-center py-8">Aucune formation disponible</p>
            ) : (
              content.courses.map((course) => {
                const isSelected = selectedCourses.has(course.id);
                return (
                  <div
                    key={course.id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                      isSelected ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleCourse(course.id)}
                      className="border-white/20"
                    />
                    <div className="flex-1">
                      <Label className="text-sm font-medium text-white cursor-pointer">
                        {course.title}
                      </Label>
                      <Badge className="ml-2 bg-white/10 text-white/70 text-xs">
                        {course.status === "published" ? "Publié" : "Brouillon"}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="tests" className="mt-4 space-y-3 max-h-[400px] overflow-y-auto">
            {content.tests.length === 0 ? (
              <p className="text-sm text-white/50 text-center py-8">Aucun test disponible</p>
            ) : (
              content.tests.map((test) => {
                const isSelected = selectedTests.has(test.id);
                return (
                  <div
                    key={test.id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                      isSelected ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleTest(test.id)}
                      className="border-white/20"
                    />
                    <div className="flex-1">
                      <Label className="text-sm font-medium text-white cursor-pointer">
                        {test.title}
                      </Label>
                      <Badge className="ml-2 bg-white/10 text-white/70 text-xs">
                        {test.status === "published" ? "Publié" : "Brouillon"}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="resources" className="mt-4 space-y-3 max-h-[400px] overflow-y-auto">
            {content.resources.length === 0 ? (
              <p className="text-sm text-white/50 text-center py-8">Aucune ressource disponible</p>
            ) : (
              content.resources.map((resource) => {
                const isSelected = selectedResources.has(resource.id);
                return (
                  <div
                    key={resource.id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                      isSelected ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleResource(resource.id)}
                      className="border-white/20"
                    />
                    <div className="flex-1">
                      <Label className="text-sm font-medium text-white cursor-pointer">
                        {resource.title}
                      </Label>
                      <Badge className="ml-2 bg-white/10 text-white/70 text-xs">
                        {resource.published ? "Publié" : "Brouillon"}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between">
          <p className="text-sm text-white/60">
            {totalSelected > 0 ? `${totalSelected} élément(s) sélectionné(s)` : "Aucun élément sélectionné"}
          </p>
          <div className="flex gap-2">
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
              disabled={isPending || totalSelected === 0}
              className="bg-gradient-to-r from-[#00C6FF] to-[#0072FF] text-white hover:opacity-90"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ajout en cours...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Ajouter au parcours
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}




