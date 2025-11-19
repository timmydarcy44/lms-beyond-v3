"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { UserPlus, Users, Layers } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LearnerAssignmentModal } from "@/components/formateur/learner-assignment-modal";
import { GroupAssignmentModal } from "@/components/formateur/group-assignment-modal";
import { PathContentAssignmentModal } from "@/components/formateur/path-content-assignment-modal";
import { assignContentToLearner } from "@/app/dashboard/formateur/apprenants/actions";
import { assignContentToGroup } from "@/app/dashboard/formateur/apprenants/actions";
import { addContentToPath } from "./actions";
import type { FormateurPathOverview, FormateurLearner, FormateurGroup } from "@/lib/queries/formateur";
import { cn } from "@/lib/utils";

type AssignableContent = {
  courses: Array<{ id: string; title: string; status: string }>;
  resources: Array<{ id: string; title: string; published: boolean }>;
  tests: Array<{ id: string; title: string; status: string }>;
};

type ParcoursCardsClientProps = {
  paths: FormateurPathOverview[];
  statusConfig: Record<string, { label: string; tone: string }>;
  learners: FormateurLearner[];
  groups: FormateurGroup[];
  contentLibrary: AssignableContent;
};

export function ParcoursCardsClient({ paths, statusConfig, learners, groups, contentLibrary }: ParcoursCardsClientProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [isLearnerModalOpen, setIsLearnerModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [isLearnerSelectorOpen, setIsLearnerSelectorOpen] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState<FormateurLearner | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<FormateurGroup | null>(null);

  const formatStatus = (status: string | undefined | null) => statusConfig[status ?? "draft"] ?? statusConfig.draft;

  const handleOpenLearnerModal = (pathId: string) => {
    setSelectedPath(pathId);
    if (learners.length === 0) {
      alert("Aucun apprenant disponible");
      return;
    }
    // Si un seul apprenant, l'ouvrir directement
    if (learners.length === 1) {
      setSelectedLearner(learners[0]);
      setIsLearnerModalOpen(true);
    } else {
      // Si plusieurs apprenants, ouvrir le sélecteur
      setIsLearnerSelectorOpen(true);
    }
  };

  const handleSelectLearner = (learner: FormateurLearner) => {
    setSelectedLearner(learner);
    setIsLearnerSelectorOpen(false);
    setIsLearnerModalOpen(true);
  };

  const handleOpenGroupModal = (pathId: string) => {
    setSelectedPath(pathId);
    if (groups.length > 0) {
      setSelectedGroup(groups[0]);
      setIsGroupModalOpen(true);
    } else {
      alert("Aucun groupe disponible");
    }
  };

  const handleOpenContentModal = (pathId: string) => {
    setSelectedPath(pathId);
    setIsContentModalOpen(true);
  };

  const handleAssignContentToPath = async (content: { courseIds: string[]; testIds: string[]; resourceIds: string[] }): Promise<void> => {
    if (!selectedPath) return;
    await addContentToPath(selectedPath, content);
  };

  return (
    <>
      <section className="grid gap-8 md:grid-cols-2">
        {paths.map((path) => {
          const status = formatStatus(path.status);
          return (
            <Card
              key={path.id}
              className="group relative flex h-full flex-col overflow-hidden border-0 bg-black"
            >
              {/* Image de fond style Apple */}
              <div className="relative h-64 w-full overflow-hidden">
                <Image
                  src={path.heroUrl}
                  alt={path.title}
                  fill
                  className="object-cover transition duration-700 group-hover:scale-105"
                  sizes="(min-width: 1280px) 50vw, (min-width: 768px) 50vw, 100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
              </div>
              
              {/* Contenu textuel style Apple */}
              <CardContent className="relative z-10 flex flex-1 flex-col justify-between space-y-6 bg-black p-6 pt-8">
                {/* Titre et description */}
                <div className="space-y-3">
                  <h2 className="text-2xl font-semibold text-white md:text-3xl">{path.title}</h2>
                  <p className="text-base text-white/70">{path.description}</p>
                </div>
                
                {/* Nombre d'apprenants et statut */}
                <div className="flex flex-wrap items-center gap-3 text-sm text-white/60">
                  <span className="rounded-full bg-white/10 px-3 py-1.5">
                    0 apprenants
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1.5">
                    {path.courses.length + path.tests.length + path.resources.length} contenus
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1.5">
                    {status.label}
                  </span>
                </div>
                
                {/* 3 petits CTAs sans bordure */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto border-0 p-1 text-[9px] font-medium text-white/60 hover:bg-transparent hover:text-white/80"
                    title="Assigner à un apprenant"
                    onClick={() => handleOpenLearnerModal(path.id)}
                  >
                    <UserPlus className="mr-1 h-3 w-3" />
                    Assigner à un apprenant
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto border-0 p-1 text-[9px] font-medium text-white/60 hover:bg-transparent hover:text-white/80"
                    title="Assigner à un groupe"
                    onClick={() => handleOpenGroupModal(path.id)}
                  >
                    <Users className="mr-1 h-3 w-3" />
                    Assigner à un groupe
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto border-0 p-1 text-[9px] font-medium text-white/60 hover:bg-transparent hover:text-white/80"
                    title="Assigner du contenu"
                    onClick={() => handleOpenContentModal(path.id)}
                  >
                    <Layers className="mr-1 h-3 w-3" />
                    Assigner du contenu
                  </Button>
                </div>
                
                {/* Boutons style Apple */}
                <div className="flex flex-col gap-3">
                  <Button 
                    asChild 
                    className="w-full rounded-xl bg-[#0071E3] px-6 py-3 text-base font-medium text-white hover:bg-[#0077ED] transition-colors"
                  >
                    <Link href={`/dashboard/formateur/parcours/${path.id}/edit`}>Modifier</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full rounded-xl border-0 px-6 py-3 text-base font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  >
                    Supprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* Sélecteur d'apprenant */}
      <Dialog open={isLearnerSelectorOpen} onOpenChange={setIsLearnerSelectorOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sélectionner un apprenant</DialogTitle>
            <DialogDescription>
              Choisissez l'apprenant à qui assigner ce parcours.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {learners.map((learner) => (
              <button
                key={learner.id}
                onClick={() => handleSelectLearner(learner)}
                className="w-full text-left rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-[#00C6FF] to-[#0072FF] flex items-center justify-center text-white font-semibold text-sm">
                    {learner.full_name
                      ? learner.full_name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                      : "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">
                      {learner.full_name ?? "Apprenant sans nom"}
                    </p>
                    <p className="text-sm text-white/60 truncate">{learner.email ?? "Email non renseigné"}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modals */}
      {selectedLearner && selectedPath && (
        <LearnerAssignmentModal
          open={isLearnerModalOpen}
          onOpenChange={(open) => {
            setIsLearnerModalOpen(open);
            if (!open) {
              setSelectedLearner(null);
              setSelectedPath(null);
            }
          }}
          learner={selectedLearner}
          content={{
            courses: contentLibrary.courses,
            paths: selectedPath ? [{ id: selectedPath, title: paths.find((p) => p.id === selectedPath)?.title || "Parcours", status: paths.find((p) => p.id === selectedPath)?.status || "draft" }] : [],
            resources: contentLibrary.resources,
            tests: contentLibrary.tests,
          }}
        />
      )}

      {selectedGroup && selectedPath && (
        <GroupAssignmentModal
          open={isGroupModalOpen}
          onOpenChange={(open) => {
            setIsGroupModalOpen(open);
            if (!open) {
              setSelectedGroup(null);
              setSelectedPath(null);
            }
          }}
          group={selectedGroup}
          content={{
            courses: contentLibrary.courses,
            paths: selectedPath ? [{ id: selectedPath, title: paths.find((p) => p.id === selectedPath)?.title || "Parcours", status: paths.find((p) => p.id === selectedPath)?.status || "draft" }] : [],
            resources: contentLibrary.resources,
            tests: contentLibrary.tests,
          }}
        />
      )}

      {selectedPath && (
        <PathContentAssignmentModal
          open={isContentModalOpen}
          onOpenChange={setIsContentModalOpen}
          pathId={selectedPath}
          pathTitle={paths.find((p) => p.id === selectedPath)?.title || "Parcours"}
          content={{
            courses: contentLibrary.courses,
            resources: contentLibrary.resources,
            tests: contentLibrary.tests,
          }}
          onAssign={handleAssignContentToPath}
        />
      )}
    </>
  );
}

