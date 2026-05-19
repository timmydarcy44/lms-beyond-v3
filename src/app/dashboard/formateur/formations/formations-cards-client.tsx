"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarClock, FilePlus2, Play, PenSquare, Copy, UserPlus, Users, Route, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

type FilterValue = "all" | "published" | "draft";

const FILTERS: Array<{ value: FilterValue; label: string }> = [
  { value: "all", label: "Toutes" },
  { value: "published", label: "Publiées" },
  { value: "draft", label: "Brouillons" },
];

const levelToBars = (level?: string | null): number => {
  const v = String(level ?? "").trim().toLowerCase();
  if (!v) return 0;
  if (v.includes("débutant") || v.includes("debutant")) return 1;
  if (v.includes("acquisition")) return 2;
  if (v.includes("interm")) return 3;
  if (v.includes("spécialiste") || v.includes("specialiste")) return 4;
  if (v.includes("expert")) return 5;
  return 0;
};

export function FormationsCardsClient({ courses, statusConfig }: FormationsCardsClientProps) {
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");
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

  const loadData = useCallback(async () => {
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
  }, []);

  const handleOpenLearnerModal = useCallback(
    async (courseId: string) => {
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
    },
    [assignableContent, learners, loadData],
  );

  const handleOpenGroupModal = useCallback(
    async (courseId: string) => {
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
    },
    [assignableContent, groups, loadData],
  );

  const handleOpenPathModal = useCallback(
    async (courseId: string) => {
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
    },
    [assignableContent, loadData, paths],
  );

  const handleAssignToPath = useCallback(
    async (content: { courseIds: string[]; testIds: string[]; resourceIds: string[] }): Promise<void> => {
      if (!selectedPath || !selectedCourse) return;
      const courseIds = content.courseIds.includes(selectedCourse) ? content.courseIds : [selectedCourse, ...content.courseIds];
      await addContentToPath(selectedPath, {
        ...content,
        courseIds,
      });
    },
    [selectedCourse, selectedPath],
  );

  const continueCourses = useMemo(
    () => courses.filter((course) => course.status !== "published" && (course.completion ?? 0) > 0),
    [courses],
  );
  const draftCourses = useMemo(() => courses.filter((course) => course.status === "draft"), [courses]);
  const publishedCourses = useMemo(() => courses.filter((course) => course.status === "published"), [courses]);
  const filteredCourses = useMemo(
    () => (activeFilter === "all" ? courses : courses.filter((course) => course.status === activeFilter)),
    [activeFilter, courses],
  );

  return (
    <>
      <div className="space-y-16">
        <div className="flex flex-wrap items-center gap-3">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setActiveFilter(filter.value)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition",
                activeFilter === filter.value
                  ? "border-cyan-300 bg-cyan-50 text-cyan-900 shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="space-y-16">
          <FormationRail
            title="Continuer"
            subtitle="Vos brouillons récemment ouverts"
            courses={continueCourses}
            statusConfig={statusConfig}
            accent="from-cyan-400/25 via-cyan-400/10 to-transparent"
            onAssignLearner={handleOpenLearnerModal}
            onAssignGroup={handleOpenGroupModal}
            onAssignPath={handleOpenPathModal}
          />

          <FormationRail
            title="Brouillons à finaliser"
            subtitle="Parcours en cours de construction"
            courses={draftCourses}
            statusConfig={statusConfig}
            accent="from-orange-400/25 via-orange-400/10 to-transparent"
            onAssignLearner={handleOpenLearnerModal}
            onAssignGroup={handleOpenGroupModal}
            onAssignPath={handleOpenPathModal}
          />

          <FormationRail
            title="Formations publiées"
            subtitle="Contenus en ligne et disponibles"
            courses={publishedCourses}
            statusConfig={statusConfig}
            accent="from-emerald-400/25 via-emerald-400/10 to-transparent"
            onAssignLearner={handleOpenLearnerModal}
            onAssignGroup={handleOpenGroupModal}
            onAssignPath={handleOpenPathModal}
          />

          <FormationRail
            title={activeFilter === "all" ? "Toutes les formations" : `Filtre · ${FILTERS.find((f) => f.value === activeFilter)?.label}`}
            subtitle="Vue globale de vos parcours"
            courses={filteredCourses}
            statusConfig={statusConfig}
            accent="from-blue-400/25 via-blue-400/10 to-transparent"
            onAssignLearner={handleOpenLearnerModal}
            onAssignGroup={handleOpenGroupModal}
            onAssignPath={handleOpenPathModal}
          />
        </div>
      </div>

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
            courses: selectedCourse
              ? [
                  {
                    id: selectedCourse,
                    title: courses.find((c) => c.id === selectedCourse)?.title || "Formation",
                    status: courses.find((c) => c.id === selectedCourse)?.status || "published",
                  },
                ]
              : [],
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
            courses: selectedCourse
              ? [
                  {
                    id: selectedCourse,
                    title: courses.find((c) => c.id === selectedCourse)?.title || "Formation",
                    status: courses.find((c) => c.id === selectedCourse)?.status || "published",
                  },
                ]
              : [],
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

type FormationRailProps = {
  title: string;
  subtitle?: string;
  courses: FormateurCourseListItem[];
  statusConfig: Record<string, { label: string; tone: string }>;
  accent: string;
  onAssignLearner: (id: string) => void;
  onAssignGroup: (id: string) => void;
  onAssignPath: (id: string) => void;
};

function FormationRail({
  title,
  subtitle,
  courses,
  statusConfig,
  accent,
  onAssignLearner,
  onAssignGroup,
  onAssignPath,
}: FormationRailProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState({ left: false, right: false });

  const updateScrollState = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScroll({
      left: scrollLeft > 0,
      right: scrollLeft + clientWidth < scrollWidth - 1,
    });
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = railRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [courses.length, updateScrollState]);

  const handleScroll = (direction: number) => {
    const el = railRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.85;
    el.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  if (courses.length === 0) {
    return null;
  }

  return (
    <section
      className={cn(
        "space-y-5 rounded-[28px] border border-slate-200/90 bg-gradient-to-br p-5 shadow-sm",
        accent,
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 md:text-xl">{title}</h2>
          {subtitle ? <p className="text-sm text-slate-600">{subtitle}</p> : null}
        </div>
      </div>
      <div className="group/rail relative max-w-full">
        <div
          ref={railRef}
          className="flex max-w-full gap-5 overflow-x-auto overflow-y-visible pb-5 pr-1 scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-slate-300 scroll-smooth snap-x snap-mandatory"
        >
          {courses.map((course) => (
            <FormationCard
              key={course.id}
              course={course}
              statusConfig={statusConfig}
              accent={accent}
              onAssignLearner={onAssignLearner}
              onAssignGroup={onAssignGroup}
              onAssignPath={onAssignPath}
            />
          ))}
        </div>

        <div
          className={cn(
            "pointer-events-none absolute left-0 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-r from-white to-transparent text-slate-700 transition md:flex",
            canScroll.left ? "opacity-100" : "opacity-0",
          )}
        >
          <button
            type="button"
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-cyan-300 hover:text-cyan-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            onClick={() => handleScroll(-1)}
            aria-label="Faire défiler vers la gauche"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        <div
          className={cn(
            "pointer-events-none absolute right-0 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-l from-white to-transparent text-slate-700 transition md:flex",
            canScroll.right ? "opacity-100" : "opacity-0",
          )}
        >
          <button
            type="button"
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-cyan-300 hover:text-cyan-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            onClick={() => handleScroll(1)}
            aria-label="Faire défiler vers la droite"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}

type FormationCardProps = {
  course: FormateurCourseListItem;
  statusConfig: Record<string, { label: string; tone: string }>;
  accent: string;
  onAssignLearner: (id: string) => void;
  onAssignGroup: (id: string) => void;
  onAssignPath: (id: string) => void;
};

function FormationCard({ course, statusConfig, accent, onAssignLearner, onAssignGroup, onAssignPath }: FormationCardProps) {
  const status = statusConfig[course.status] ?? { label: course.status, tone: "bg-slate-100 text-slate-600 border border-slate-200" };
  const completion = course.completion ?? 0;
  const formattedUpdatedAt = formatDistanceToNow(new Date(course.updatedAt), { addSuffix: true, locale: fr });
  const primaryLabel = course.status === "published" ? "Consulter" : "Continuer";
  const microcopy =
    course.status === "published" ? "Prêt à diffuser" : completion >= 80 ? "Encore une étape" : completion >= 40 ? "Belle progression" : "À reprendre en douceur";
  const statusColorClass =
    course.status === "published" ? "text-emerald-700" : course.status === "draft" ? "text-orange-700" : "text-cyan-700";
  const filledBars = levelToBars((course as any).level ?? null);
  const levelLabel = String((course as any).level ?? "").trim();

  return (
    <article
      className="group relative w-[min(300px,85vw)] max-w-[300px] flex-shrink-0 snap-start overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow duration-200 focus-within:outline-none focus-within:ring-2 focus-within:ring-cyan-400/80 hover:shadow-md md:w-[300px]"
      tabIndex={0}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        {course.image ? (
          <Image
            src={course.image}
            alt={course.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.05]"
            sizes="(min-width: 1280px) 300px, (min-width: 768px) 260px, 80vw"
          />
        ) : (
          <div
            className={cn(
              "relative flex h-full w-full items-center justify-center bg-gradient-to-br text-white/40",
              course.status === "published" ? "from-slate-800 via-slate-900 to-black" : "from-slate-800 via-cyan-900/60 to-slate-900",
            )}
          >
            <FilePlus2 className="h-10 w-10" />
            {course.status !== "published" ? (
              <div className="absolute bottom-4 left-4 flex -space-x-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/12 text-xs text-white/70">😊</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xs text-white/70">👩‍🏫</span>
              </div>
            ) : null}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 via-black/35 to-transparent px-4 pb-3 pt-10">
          <div className="flex flex-col gap-2 text-xs text-white/85">
            <Badge className={cn("w-fit rounded-full text-[11px] uppercase tracking-[0.3em]", status.tone)}>{status.label}</Badge>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-5 py-5">
        <div className="space-y-2">
          <h3 className="line-clamp-2 text-lg font-semibold text-slate-900">{course.title}</h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
            {course.category ? (
              <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-600">
                {course.category}
              </span>
            ) : null}
            {filledBars > 0 && levelLabel ? (
              <span className="inline-flex items-center gap-2 text-[10px] font-medium text-slate-900/60">
                <span className="flex items-end gap-1 origin-left scale-[0.8]">
                  {(["h-2", "h-3", "h-4", "h-5", "h-6"] as const).map((h, i) => (
                    <span
                      // eslint-disable-next-line react/no-array-index-key
                      key={i}
                      className={`${h} w-1 rounded-sm ${i < filledBars ? "bg-slate-900" : "bg-slate-200"}`}
                    />
                  ))}
                </span>
                <span>{levelLabel}</span>
              </span>
            ) : null}
          </div>
          <p className="text-xs text-slate-500">Modifié {formattedUpdatedAt}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className={statusColorClass}>{microcopy}</span>
            <span className="text-slate-800">{completion}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 transition-[width] duration-300 motion-reduce:transition-none"
              style={{ width: `${Math.min(100, Math.max(0, completion))}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{course.learners} apprenants</span>
          {course.nextStep ? <span className="truncate text-slate-500">Prochaine étape · {course.nextStep}</span> : null}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-slate-900/90 via-slate-900/55 to-transparent opacity-0 transition duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 motion-reduce:transition-none">
        <div className="space-y-3 px-4 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              asChild
              size="sm"
              className="flex-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-xs font-semibold text-white shadow-md"
            >
              <Link href={`/dashboard/formateur/formations/${course.id}`} aria-label={`${primaryLabel} ${course.title}`}>
                <Play className="mr-2 h-3.5 w-3.5" />
                {primaryLabel}
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="secondary"
              className="flex-1 rounded-full border border-white/25 bg-white/15 text-xs font-semibold text-white hover:bg-white/25"
            >
              <Link href={`/dashboard/formateur/formations/${course.id}`} aria-label={`Modifier ${course.title}`}>
                <PenSquare className="mr-2 h-3.5 w-3.5" />
                Modifier
              </Link>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white hover:bg-white/20"
            >
              <Copy className="mr-2 h-3.5 w-3.5" />
              Dupliquer
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/90">
            <button
              type="button"
              onClick={() => onAssignLearner(course.id)}
              className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Assigner apprenant
            </button>
            <button
              type="button"
              onClick={() => onAssignGroup(course.id)}
              className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              <Users className="h-3.5 w-3.5" />
              Groupe
            </button>
            <button
              type="button"
              onClick={() => onAssignPath(course.id)}
              className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              <Route className="h-3.5 w-3.5" />
              Parcours
            </button>
          </div>
        </div>
      </div>

      <div className={cn("pointer-events-none absolute inset-0 opacity-0 transition duration-200", `bg-gradient-to-br ${accent}`, "group-hover:opacity-25")} />
    </article>
  );
}
