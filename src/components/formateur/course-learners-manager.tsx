"use client";

import { useState, useTransition } from "react";
import { Check, Users, UserPlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { assignLearnersToCourse, removeLearnerFromCourse } from "@/app/dashboard/formateur/formations/[courseId]/apprenants/actions";
import { toast } from "sonner";

type CourseLearnersManagerProps = {
  courseId: string;
  courseTitle: string;
  learners: Array<{ id: string; full_name: string | null; email: string | null }>;
  groups: Array<{ id: string; name: string; members_count: number }>;
  currentEnrollments: string[];
};

export function CourseLearnersManager({
  courseId,
  courseTitle,
  learners,
  groups,
  currentEnrollments,
}: CourseLearnersManagerProps) {
  const [selectedLearners, setSelectedLearners] = useState<Set<string>>(new Set());
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [enrolledLearners, setEnrolledLearners] = useState<Set<string>>(new Set(currentEnrollments));

  const handleToggleLearner = (learnerId: string) => {
    setSelectedLearners((prev) => {
      const next = new Set(prev);
      if (next.has(learnerId)) {
        next.delete(learnerId);
      } else {
        next.add(learnerId);
      }
      return next;
    });
  };

  const handleToggleGroup = (groupId: string) => {
    setSelectedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleAssign = async () => {
    const learnerIds = Array.from(selectedLearners);
    const groupIds = Array.from(selectedGroups);

    if (learnerIds.length === 0 && groupIds.length === 0) {
      toast.error("Sélectionnez au moins un apprenant ou un groupe");
      return;
    }

    startTransition(async () => {
      try {
        const result = await assignLearnersToCourse(courseId, learnerIds, groupIds);
        if (result.success) {
          toast.success(`${result.count} apprenant(s) assigné(s) avec succès`);
          // Ajouter les nouveaux apprenants à la liste des inscrits
          const newlyEnrolled = result.enrolledLearnerIds ?? [];
          setEnrolledLearners((prev) => {
            const next = new Set(prev);
            newlyEnrolled.forEach((id) => next.add(id));
            return next;
          });
          // Réinitialiser les sélections
          setSelectedLearners(new Set());
          setSelectedGroups(new Set());
        } else {
          toast.error(result.error ?? "Erreur lors de l'assignation");
        }
      } catch (error) {
        toast.error("Une erreur est survenue");
        console.error(error);
      }
    });
  };

  const handleRemoveLearner = async (learnerId: string) => {
    startTransition(async () => {
      try {
        const result = await removeLearnerFromCourse(courseId, learnerId);
        if (result.success) {
          toast.success("Apprenant retiré avec succès");
          setEnrolledLearners((prev) => {
            const next = new Set(prev);
            next.delete(learnerId);
            return next;
          });
        } else {
          toast.error(result.error ?? "Erreur lors de la suppression");
        }
      } catch (error) {
        toast.error("Une erreur est survenue");
        console.error(error);
      }
    });
  };

  // Calculer les apprenants d'un groupe (approximation)
  const getGroupLearnerIds = (groupId: string): string[] => {
    // Dans une vraie implémentation, on récupérerait les membres du groupe depuis la BDD
    // Pour l'instant, on retourne un tableau vide car on n'a pas cette info
    return [];
  };

  const totalSelectedCount =
    selectedLearners.size +
    Array.from(selectedGroups).reduce((acc, groupId) => {
      const group = groups.find((g) => g.id === groupId);
      return acc + (group?.members_count ?? 0);
    }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Assigner des apprenants</h2>
          <p className="mt-1 text-sm text-white/70">
            Sélectionnez des apprenants individuels ou des groupes pour leur donner accès à cette formation.
          </p>
        </div>
        <Button
          onClick={handleAssign}
          disabled={isPending || totalSelectedCount === 0}
          className="rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
        >
          {isPending ? "Assignation..." : `Assigner ${totalSelectedCount > 0 ? `(${totalSelectedCount})` : ""}`}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Liste des apprenants */}
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.3em] text-white/60">
              <UserPlus className="h-4 w-4" />
              Apprenants individuels ({learners.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
            {learners.length === 0 ? (
              <p className="py-8 text-center text-sm text-white/50">Aucun apprenant disponible</p>
            ) : (
              learners.map((learner) => {
                const isSelected = selectedLearners.has(learner.id);
                const isEnrolled = enrolledLearners.has(learner.id);
                return (
                  <div
                    key={learner.id}
                    className={`flex items-center justify-between rounded-lg border px-4 py-3 transition ${
                      isSelected
                        ? "border-[#00C6FF] bg-[#00C6FF]/10"
                        : isEnrolled
                          ? "border-white/20 bg-white/5"
                          : "border-white/10 bg-transparent hover:border-white/20"
                    }`}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-white">{learner.full_name ?? "Apprenant"}</p>
                      <p className="text-xs text-white/60">{learner.email ?? ""}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isEnrolled && (
                        <Badge variant="secondary" className="rounded-full bg-emerald-500/20 text-emerald-200">
                          Assigné
                        </Badge>
                      )}
                      {!isEnrolled && (
                        <button
                          onClick={() => handleToggleLearner(learner.id)}
                          className={`rounded-full p-1.5 transition ${
                            isSelected ? "bg-[#00C6FF]/20 text-[#00C6FF]" : "bg-white/10 text-white/60 hover:bg-white/20"
                          }`}
                        >
                          {isSelected ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                        </button>
                      )}
                      {isEnrolled && (
                        <button
                          onClick={() => handleRemoveLearner(learner.id)}
                          disabled={isPending}
                          className="rounded-full bg-red-500/20 p-1.5 text-red-200 transition hover:bg-red-500/30"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Liste des groupes */}
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.3em] text-white/60">
              <Users className="h-4 w-4" />
              Groupes ({groups.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
            {groups.length === 0 ? (
              <p className="py-8 text-center text-sm text-white/50">Aucun groupe disponible</p>
            ) : (
              groups.map((group) => {
                const isSelected = selectedGroups.has(group.id);
                return (
                  <div
                    key={group.id}
                    className={`flex items-center justify-between rounded-lg border px-4 py-3 transition ${
                      isSelected ? "border-[#00C6FF] bg-[#00C6FF]/10" : "border-white/10 bg-transparent hover:border-white/20"
                    }`}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-white">{group.name}</p>
                      <p className="text-xs text-white/60">{group.members_count} membre(s)</p>
                    </div>
                    <button
                      onClick={() => handleToggleGroup(group.id)}
                      className={`rounded-full p-1.5 transition ${
                        isSelected ? "bg-[#00C6FF]/20 text-[#00C6FF]" : "bg-white/10 text-white/60 hover:bg-white/20"
                      }`}
                    >
                      {isSelected ? <Check className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                    </button>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}










