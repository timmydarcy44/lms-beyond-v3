"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { UserPlus, Users, Route } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SectionSlider } from "@/components/dashboard/section-slider";
import { LearnerAssignmentModal } from "@/components/formateur/learner-assignment-modal";
import { GroupAssignmentModal } from "@/components/formateur/group-assignment-modal";
import { PathContentAssignmentModal } from "@/components/formateur/path-content-assignment-modal";
import { addContentToPath } from "@/app/dashboard/formateur/parcours/actions";
import type { FormateurCourseListItem } from "@/lib/queries/formateur";
import { cn } from "@/lib/utils";

type FormationsCardsClientProps = {
  courses: FormateurCourseListItem[];
  statusConfig: Record<string, { label: string; tone: string }>;
};

export function FormationsCardsClient({ courses, statusConfig }: FormationsCardsClientProps) {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [isLearnerModalOpen, setIsLearnerModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isPathModalOpen, setIsPathModalOpen] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState<{ id: string; full_name: string | null; email: string | null } | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<{ id: string; name: string; members_count?: number } | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [assignableContent, setAssignableContent] = useState<any>(null);
  const [learners, setLearners] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [paths, setPaths] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const [learnersData, groupsData, contentData, pathsData] = await Promise.all([
        fetch("/api/formateur/learners").then((r) => r.json()).catch(() => ({ learners: [] })),
        fetch("/api/formateur/groups").then((r) => r.json()).catch(() => ({ groups: [] })),
        fetch("/api/formateur/content-library").then((r) => r.json()).catch(() => ({ courses: [], tests: [], resources: [] })),
        fetch("/api/formateur/paths").then((r) => r.json()).catch(() => ({ paths: [] })),
      ]);
      
      setLearners(learnersData.learners || []);
      setGroups(groupsData.groups || []);
      setPaths(pathsData.paths || []);
      setAssignableContent({
        courses: (contentData.courses || []).map((c: any) => ({ id: c.id, title: c.title, status: c.status })),
        tests: (contentData.tests || []).map((t: any) => ({ id: t.id, title: t.title, status: t.status })),
        resources: (contentData.resources || []).map((r: any) => ({ id: r.id, title: r.title, published: r.published })),
      });
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleOpenLearnerModal = async (courseId: string) => {
    setSelectedCourse(courseId);
    if (learners.length === 0 || !assignableContent) {
      await loadData();
    }
    if (learners.length > 0) {
      setSelectedLearner(learners[0]);
      setIsLearnerModalOpen(true);
    } else {
      alert("Aucun apprenant disponible");
    }
  };

  const handleOpenGroupModal = async (courseId: string) => {
    setSelectedCourse(courseId);
    if (groups.length === 0 || !assignableContent) {
      await loadData();
    }
    if (groups.length > 0) {
      setSelectedGroup(groups[0]);
      setIsGroupModalOpen(true);
    } else {
      alert("Aucun groupe disponible");
    }
  };

  const handleOpenPathModal = async (courseId: string) => {
    setSelectedCourse(courseId);
    if (paths.length === 0 || !assignableContent) {
      await loadData();
    }
    if (paths.length > 0) {
      setSelectedPath(paths[0].id);
      setIsPathModalOpen(true);
    } else {
      alert("Aucun parcours disponible");
    }
  };

  const handleAssignToPath = async (content: { courseIds: string[]; testIds: string[]; resourceIds: string[] }): Promise<void> => {
    if (!selectedPath || !selectedCourse) return;
    // Ajouter le cours sélectionné à la liste (s'il n'est pas déjà présent)
    const courseIds = content.courseIds.includes(selectedCourse)
      ? content.courseIds
      : [selectedCourse, ...content.courseIds];
    await addContentToPath(selectedPath, {
      ...content,
      courseIds,
    });
  };

  // Convertir les courses en format SliderCard si nécessaire
  const sliderCards = courses.map((course) => ({
    id: course.id,
    title: course.title,
    image: course.image,
    meta: course.category,
    badge: statusConfig[course.status].label,
    href: `/dashboard/formateur/formations/${course.id}/structure`,
  }));

  return (
    <>
      {courses.length > 3 ? (
        <SectionSlider title="Mes formations" cards={sliderCards} accent="formateur" />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 w-full max-w-full">
          {courses.map((course) => (
          <Card
            key={course.id}
            className="group flex h-full flex-col overflow-hidden border border-white/10 bg-gradient-to-br from-[#1f2937]/70 via-[#111827]/80 to-[#020617]/80"
          >
            <div className="relative h-48 w-full overflow-hidden">
              <Image
                src={course.image}
                alt={course.title}
                fill
                className="object-cover transition duration-500 group-hover:scale-105 group-hover:saturate-125"
                sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute bottom-4 left-4 flex flex-wrap items-center gap-2">
                <Badge className="rounded-full border border-white/20 bg-black/40 text-[10px] uppercase tracking-[0.3em] text-white/70">
                  {course.category}
                </Badge>
                <Badge className={cn("rounded-full text-[10px] uppercase tracking-[0.3em]", statusConfig[course.status].tone)}>
                  {statusConfig[course.status].label}
                </Badge>
              </div>
            </div>
            <CardHeader className="flex-1 space-y-3">
              <CardTitle className="text-lg font-semibold text-white">{course.title}</CardTitle>
              <p className="text-sm text-white/60">
                Mise à jour {formatDistanceToNow(new Date(course.updatedAt), { addSuffix: true, locale: fr })}
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>Progression du contenu</span>
                  <span>{course.completion}%</span>
                </div>
                <Progress value={course.completion} className="h-2" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
                <span className="rounded-full bg-white/10 px-3 py-1">{course.learners} apprenants</span>
                {course.nextStep ? <span className="text-white/50">Prochaine action · {course.nextStep}</span> : null}
              </div>
              
              {/* 3 petits CTAs sans bordure */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto border-0 p-1 text-[9px] font-medium text-white/60 hover:bg-transparent hover:text-white/80"
                  title="Assigner à un apprenant"
                  onClick={() => handleOpenLearnerModal(course.id)}
                >
                  <UserPlus className="mr-1 h-3 w-3" />
                  Assigner à un apprenant
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto border-0 p-1 text-[9px] font-medium text-white/60 hover:bg-transparent hover:text-white/80"
                  title="Assigner à un groupe"
                  onClick={() => handleOpenGroupModal(course.id)}
                >
                  <Users className="mr-1 h-3 w-3" />
                  Assigner à un groupe
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto border-0 p-1 text-[9px] font-medium text-white/60 hover:bg-transparent hover:text-white/80"
                  title="Assigner à un parcours"
                  onClick={() => handleOpenPathModal(course.id)}
                >
                  <Route className="mr-1 h-3 w-3" />
                  Assigner à un parcours
                </Button>
              </div>
              
              {/* MODIFIER - largeur complète */}
              <Button 
                asChild 
                className="w-full rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white"
              >
                <Link href={`/dashboard/formateur/formations/${course.id}/structure`}>Modifier</Link>
              </Button>
              
              {/* SUPPRIMER - rouge sans bordure */}
              <Button
                variant="ghost"
                className="w-full rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                Supprimer
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      )}

      {/* Modals */}
      {selectedLearner && selectedCourse && assignableContent && (
        <LearnerAssignmentModal
          open={isLearnerModalOpen}
          onOpenChange={(open) => {
            setIsLearnerModalOpen(open);
            if (!open) {
              setSelectedLearner(null);
              setSelectedCourse(null);
            }
          }}
          learner={selectedLearner}
          content={{
            courses: selectedCourse ? [{ id: selectedCourse, title: courses.find((c) => c.id === selectedCourse)?.title || "Formation", status: courses.find((c) => c.id === selectedCourse)?.status || "published" }] : [],
            paths: paths.map((p) => ({ id: p.id, title: p.title, status: p.status })),
            resources: assignableContent.resources,
            tests: assignableContent.tests,
          }}
        />
      )}

      {selectedGroup && selectedCourse && assignableContent && (
        <GroupAssignmentModal
          open={isGroupModalOpen}
          onOpenChange={(open) => {
            setIsGroupModalOpen(open);
            if (!open) {
              setSelectedGroup(null);
              setSelectedCourse(null);
            }
          }}
          group={selectedGroup as any}
          content={{
            courses: selectedCourse ? [{ id: selectedCourse, title: courses.find((c) => c.id === selectedCourse)?.title || "Formation", status: courses.find((c) => c.id === selectedCourse)?.status || "published" }] : [],
            paths: paths.map((p) => ({ id: p.id, title: p.title, status: p.status })),
            resources: assignableContent.resources,
            tests: assignableContent.tests,
          }}
        />
      )}

      {selectedPath && selectedCourse && (
        <PathContentAssignmentModal
          open={isPathModalOpen}
          onOpenChange={(open) => {
            setIsPathModalOpen(open);
            if (!open) {
              setSelectedPath(null);
              setSelectedCourse(null);
            }
          }}
          pathId={selectedPath}
          pathTitle={paths.find((p) => p.id === selectedPath)?.title || "Parcours"}
          content={{
            courses: assignableContent ? assignableContent.courses : [],
            resources: assignableContent ? assignableContent.resources : [],
            tests: assignableContent ? assignableContent.tests : [],
          }}
          onAssign={handleAssignToPath}
        />
      )}
    </>
  );
}

