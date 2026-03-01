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
      <section className="grid gap-10 md:grid-cols-2">
        {paths.map((path) => {
          const status = formatStatus(path.status);
          const accentBorder =
            path.status === "published"
              ? "border-t-4 border-t-emerald-400/45"
              : path.status === "draft"
              ? "border-t-4 border-t-amber-400/45"
              : "border-t-4 border-t-sky-400/45";
          return (
            <Card
              key={path.id}
              className={cn(
                "group relative flex h-full flex-col overflow-hidden border border-white/12 bg-slate-950/85 transition-transform duration-200 focus-within:outline-none focus-within:ring-2 focus-within:ring-cyan-300/70 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(3,8,23,0.55)] motion-reduce:transition-none motion-reduce:hover:transform-none",
                accentBorder,
              )}
            >
              {/* Image de fond style Apple */}
              <div className="relative h-64 w-full overflow-hidden">
                <Image
                  src={path.heroUrl}
                  alt={path.title}
                  fill
                  className="object-cover transition duration-700 group-hover:scale-[1.03]"
                  sizes="(min-width: 1280px) 50vw, (min-width: 768px) 50vw, 100vw"
                  priority={path.status !== "published"}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/65 to-transparent" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/30 opacity-0 transition duration-200 group-hover:opacity-50" />
              </div>
              
              {/* Contenu textuel style Apple */}
              <CardContent className="relative z-10 flex flex-1 flex-col justify-between space-y-8 bg-slate-950/90 px-6 pb-6 pt-10">
                {/* Titre et description */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/45">
                    <span className="inline-flex h-1.5 w-10 rounded-full bg-gradient-to-r from-white/40 via-white/60 to-transparent" />
                    Parcours signature
                  </div>
                  <h2 className="text-2xl font-semibold text-white md:text-3xl">{path.title}</h2>
                  <p className="text-sm text-white/65 md:text-base">{path.description}</p>
                </div>
                
                {/* Nombre d'apprenants et statut */}
                <div className="flex flex-wrap items-center gap-2 text-sm text-white/60">
                  <span className="rounded-full bg-white/12 px-3 py-1.5 text-white/75">
                    0 apprenants
                  </span>
                  <span className="rounded-full bg-white/12 px-3 py-1.5 text-white/75">
                    {path.courses.length + path.tests.length + path.resources.length} contenus
                  </span>
                  <span className={cn("rounded-full px-3 py-1.5 text-sm font-medium", status.tone)}>
                    {status.label}
                  </span>
                  <span className="flex items-center gap-2 text-xs text-white/45">
                    Dernière édition {formatDistanceToNow(new Date(path.updatedAt ?? Date.now()), { addSuffix: true, locale: fr })}
                  </span>
                </div>
                
                {/* 3 petits CTAs sans bordure */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto border border-white/10 bg-white/6 px-3 py-1 text-[10px] font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300"
                    title="Assigner à un apprenant"
                    onClick={() => handleOpenLearnerModal(path.id)}
                  >
                    <UserPlus className="mr-1 h-3 w-3" />
                    Assigner à un apprenant
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto border border-white/10 bg-white/6 px-3 py-1 text-[10px] font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300"
                    title="Assigner à un groupe"
                    onClick={() => handleOpenGroupModal(path.id)}
                  >
                    <Users className="mr-1 h-3 w-3" />
                    Assigner à un groupe
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto border border-white/10 bg-white/6 px-3 py-1 text-[10px] font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300"
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
                    className="w-full rounded-xl border border-white/10 bg-white/12 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/18 focus-visible:ring-2 focus-visible:ring-white/30"
                  >
                    <Link href={`/dashboard/formateur/parcours/${path.id}`}>Voir le parcours</Link>
                  </Button>
                  <Button 
                    asChild 
                    className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:shadow-blue-500/30 focus-visible:ring-2 focus-visible:ring-blue-400"
                  >
                    <Link href={`/dashboard/formateur/parcours/${path.id}/edit`}>Modifier</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full rounded-xl border border-white/10 bg-white/4 px-6 py-3 text-sm font-semibold text-red-400 hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-300"
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
          <DialogTitle className="sr-only">Nouveau parcours</DialogTitle>
          <DialogDescription className="sr-only">
            Formulaire de création d'un parcours
          </DialogDescription>
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

