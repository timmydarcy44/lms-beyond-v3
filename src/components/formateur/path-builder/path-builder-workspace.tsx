"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FormateurContentLibrary } from "@/lib/queries/formateur";
import { cn } from "@/lib/utils";
import { fetchPathSave } from "@/lib/paths/fetch-path-save";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { COURSE_TOOL_OPTIONS, normalizeCourseTools } from "@/lib/course-tools";
import { CourseToolsLogos } from "@/components/catalogue/course-tools-logos";

import { CourseObjectivesEditor } from "@/components/formateur/course-builder/course-objectives-editor";
import { ActionNode } from "@/components/formateur/path-builder/nodes/action-node";
import { TriggerNode, type TriggerCondition } from "@/components/formateur/path-builder/nodes/trigger-node";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { ArrowLeft, CheckCircle2, CirclePlus } from "lucide-react";
import { Sparkles } from "lucide-react";

function isVideoLike(url: string): boolean {
  const s = String(url ?? "").trim().toLowerCase();
  return s.endsWith(".mp4") || s.endsWith(".webm") || s.startsWith("data:video/");
}

type PathBuilderWorkspaceProps = {
  library: FormateurContentLibrary;
  initialData?: {
    pathId?: string;
    title?: string;
    subtitle?: string;
    objective?: string;
    selectedCourses?: string[];
    selectedTests?: string[];
    selectedResources?: string[];
    status?: "draft" | "published";
    price?: number | string | null;
    builderSnapshot?: unknown;
  };
  additionalFields?: () => Record<string, unknown>;
  extraHeaderSlot?: ReactNode;
};

type WorkflowStepType = "action" | "trigger";
type WorkflowActionKind = "course" | "test" | "resource";
type WorkflowTriggerCondition =
  | "previous_step_completed"
  | "formation_completed"
  | "quiz_score_gt_x"
  | "resource_link_clicked"
  | "resource_document_downloaded"
  | "evaluation_passed"
  | "case_study_submitted"
  | "oral_ia_passed"
  | "video_ia_passed"
  | "pdf_ia_passed";

type WorkflowStep = {
  id: string;
  type: WorkflowStepType;
  content_kind?: WorkflowActionKind;
  content_id?: string | null;
  trigger_condition?: WorkflowTriggerCondition | null;
  trigger_quiz_min_score?: number | null;
  trigger_quiz_test_id?: string | null;
  trigger_evaluation_passed?: boolean | null;
  // New AI triggers
  trigger_ai_min_score?: number | null;
  trigger_case_context?: string | null;
  /** Consigne vue par l'apprenant (hors zone de rédaction). */
  trigger_case_consigne?: string | null;
  /** Critères d'évaluation confidentiels — jamais affichés à l'apprenant. */
  trigger_case_prompt?: string | null;
  position: { x: number; y: number };
};

type PathBuilderSnapshotV2 = {
  version: 2;
  title: string;
  objectifs: string[];
  presentation?: string;
  cover_image?: string;
  tools?: string[];
  badgeId?: string | null;
  instructor_ids?: string[];
  assignment?: { learnerIds: string[]; groupIds: string[] };
  steps: WorkflowStep[];
  updatedAt: string;
};

const gradientCta = "bg-gradient-to-r from-[#003366] via-[#6633CC] to-[#FF00FF]";

function normalizePositions(steps: WorkflowStep[]): WorkflowStep[] {
  return steps.map((s, idx) => ({
    ...s,
    position: { x: 0, y: idx * 120 },
  }));
}

export function PathBuilderWorkspace({ library, initialData, additionalFields, extraHeaderSlot }: PathBuilderWorkspaceProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialData?.title || "Nouveau parcours");
  const [objectifs, setObjectifs] = useState<string[]>(
    initialData?.objective ? [initialData.objective] : [""],
  );
  const [presentation, setPresentation] = useState<string>("");
  const [coverImage, setCoverImage] = useState<string>("");
  const [tools, setTools] = useState<string[]>([]);
  const [isGeneratingPresentation, setIsGeneratingPresentation] = useState(false);

  const [steps, setSteps] = useState<WorkflowStep[]>([]);

  const [openBadges, setOpenBadges] = useState<Array<{ id: string; title?: string | null; name?: string | null }>>([]);
  const [selectedBadgeId, setSelectedBadgeId] = useState<string>("none");
  const [instructors, setInstructors] = useState<Array<{ id: string; email?: string | null; full_name?: string | null; role?: string | null }>>([]);
  const [selectedInstructorIds, setSelectedInstructorIds] = useState<string[]>([]);

  const [learners, setLearners] = useState<Array<{ id: string; full_name: string | null; email: string | null }>>([]);
  const [groups, setGroups] = useState<Array<{ id: string; name: string; members_count?: number }>>([]);
  const [assignedLearnerIds, setAssignedLearnerIds] = useState<string[]>([]);
  const [assignedGroupIds, setAssignedGroupIds] = useState<string[]>([]);

  const [savedPathId, setSavedPathId] = useState<string | null>(initialData?.pathId || null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [successOverlay, setSuccessOverlay] = useState<{ open: boolean; label: string }>({ open: false, label: "" });

  const [isTriggerSheetOpen, setIsTriggerSheetOpen] = useState(false);
  const [activeTriggerId, setActiveTriggerId] = useState<string | null>(null);
  const [isGeneratingTriggerQuiz, setIsGeneratingTriggerQuiz] = useState(false);
  const [isGeneratingCaseContext, setIsGeneratingCaseContext] = useState(false);

  const hydratedRef = useRef(false);

  const getAdditionalFields = useCallback(() => {
    try {
      return additionalFields ? additionalFields() ?? {} : {};
    } catch (error) {
      console.error("[path-builder] additionalFields() threw", error);
      return {};
    }
  }, [additionalFields]);

  const selectedOrgId = useMemo(() => {
    const extra = getAdditionalFields();
    const raw = (extra as any)?.orgId;
    const v = typeof raw === "string" ? raw.trim() : "";
    return v ? v : null;
  }, [getAdditionalFields]);

  const contentIndex = useMemo(() => {
    return {
      course: new Map(library.courses.map((c) => [c.id, c])),
      test: new Map(library.tests.map((t) => [t.id, t])),
      resource: new Map(library.resources.map((r) => [r.id, r])),
    };
  }, [library.courses, library.resources, library.tests]);

  const derivedSelections = useMemo(() => {
    const selectedCourses: string[] = [];
    const selectedTests: string[] = [];
    const selectedResources: string[] = [];
    steps.forEach((s) => {
      if (s.type !== "action") return;
      if (!s.content_kind || !s.content_id) return;
      if (s.content_kind === "course") selectedCourses.push(s.content_id);
      if (s.content_kind === "test") selectedTests.push(s.content_id);
      if (s.content_kind === "resource") selectedResources.push(s.content_id);
    });
    return {
      selectedCourses: Array.from(new Set(selectedCourses)),
      selectedTests: Array.from(new Set(selectedTests)),
      selectedResources: Array.from(new Set(selectedResources)),
    };
  }, [steps]);

  const getSnapshotV2 = (): PathBuilderSnapshotV2 => ({
    version: 2,
    title: title.trim(),
    objectifs: objectifs.map((x) => String(x ?? "").trim()).filter(Boolean),
    presentation: presentation.trim() || undefined,
    cover_image: coverImage.trim() || undefined,
    tools: normalizeCourseTools(tools),
    badgeId: selectedBadgeId !== "none" ? selectedBadgeId : null,
    instructor_ids: selectedInstructorIds,
    assignment: { learnerIds: assignedLearnerIds, groupIds: assignedGroupIds },
    steps,
    updatedAt: new Date().toISOString(),
  });

  const openTriggerSheet = (triggerId: string) => {
    setActiveTriggerId(triggerId);
    setIsTriggerSheetOpen(true);
  };

  const activeTriggerIndex = useMemo(() => {
    if (!activeTriggerId) return -1;
    return steps.findIndex((s) => s.id === activeTriggerId);
  }, [activeTriggerId, steps]);

  const activeTriggerStep = activeTriggerIndex >= 0 ? steps[activeTriggerIndex] : null;

  const prevActionOfActiveTrigger = useMemo(() => {
    if (!activeTriggerStep || activeTriggerStep.type !== "trigger") return null;
    const idx = activeTriggerIndex;
    for (let i = idx - 1; i >= 0; i--) {
      if (steps[i]?.type === "action") return steps[i]!;
    }
    return null;
  }, [activeTriggerIndex, activeTriggerStep, steps]);

  const generatePresentationWithIA = useCallback(async () => {
    if (isPreviewMode) return;
    if (!title?.trim()) return;
    setIsGeneratingPresentation(true);
    try {
      const objectifsClean = (objectifs ?? []).map((x) => String(x ?? "").trim()).filter(Boolean);
      const courseTitles = steps
        .filter((s) => s?.type === "action" && s?.content_kind === "course" && s?.content_id)
        .map((s) => {
          const c = library.courses.find((x) => x.id === String((s as any).content_id));
          return c?.title ? String(c.title).trim() : null;
        })
        .filter(Boolean) as string[];

      const intros = [
        "Ce parcours a été conçu comme une montée en puissance progressive : vous avancez pas à pas, avec des validations claires.",
        "Bienvenue dans un parcours pensé pour aller droit au but : compréhension, mise en pratique, puis consolidation.",
        "Ici, l’objectif est simple : transformer les concepts en réflexes opérationnels grâce à une progression structurée.",
      ];
      const closings = [
        "À la fin, vous saurez exactement quoi faire, comment le faire, et dans quel ordre — avec une confiance renforcée.",
        "En suivant la feuille de route, vous construisez des résultats visibles, mesurables et réutilisables dans votre quotidien.",
        "Chaque étape est là pour vous faire gagner du temps et éviter les angles morts, jusqu’à l’autonomie complète.",
      ];
      const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)] ?? arr[0] ?? "";

      const base = [
        `${pick(intros)}`,
        objectifsClean.length
          ? `Vous allez notamment :\n- ${objectifsClean.slice(0, 6).join("\n- ")}`
          : "Vous allez structurer vos apprentissages autour d’actions concrètes et de validations simples.",
        courseTitles.length
          ? `Le parcours s’appuie sur ${courseTitles.length} formation${courseTitles.length > 1 ? "s" : ""} : ${courseTitles
              .slice(0, 5)
              .join(", ")}${courseTitles.length > 5 ? "…" : ""}.`
          : "Le parcours s’appuie sur des étapes de formation et des déclencheurs pour sécuriser votre progression.",
        `${pick(closings)}`,
      ]
        .filter(Boolean)
        .join("\n\n");

      setPresentation(base.trim());
    } finally {
      setIsGeneratingPresentation(false);
    }
  }, [isPreviewMode, title, objectifs, steps, library.courses]);

  const handleGenerateTriggerQuiz = useCallback(async () => {
    if (isPreviewMode) return;
    if (!activeTriggerStep || activeTriggerStep.type !== "trigger") return;
    if (prevActionOfActiveTrigger?.content_kind !== "course") return;
    const courseId = String(prevActionOfActiveTrigger?.content_id ?? "").trim();
    if (!courseId) return;
    const threshold =
      typeof activeTriggerStep.trigger_quiz_min_score === "number" && Number.isFinite(activeTriggerStep.trigger_quiz_min_score)
        ? activeTriggerStep.trigger_quiz_min_score
        : 80;

    setIsGeneratingTriggerQuiz(true);
    const loadingId = toast.loading("Génération du quiz (IA)…");
    try {
      const title = library.courses.find((c) => c.id === courseId)?.title ?? "Formation";

      const genRes = await fetch("/api/formateur/trigger-quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formation_id: courseId, formation_titre: title, nb_questions: 20 }),
      });
      const genPayload = await genRes.json().catch(() => ({}));
      if (!genRes.ok) throw new Error(String(genPayload?.error ?? "Génération impossible"));
      const questions = Array.isArray(genPayload?.questions) ? genPayload.questions : [];
      if (!questions.length) throw new Error("Aucune question générée");

      const saveRes = await fetch("/api/formateur/quiz/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formation_id: courseId,
          title: `Quiz de validation — ${title}`,
          description: "Quiz de validation (trigger parcours) — généré par IA.",
          questions,
          scoring: { score_minimum: threshold },
          type: "mixed",
          placement: { type: "end" },
        }),
      });
      const savePayload = await saveRes.json().catch(() => ({}));
      if (!saveRes.ok) throw new Error(String(savePayload?.error ?? "Sauvegarde impossible"));
      const testId = String(savePayload?.test_id ?? "").trim();
      if (!testId) throw new Error("Aucun test_id retourné");

      setActiveTriggerPatch({ trigger_quiz_test_id: testId });
      toast.success("Quiz créé", {
        id: loadingId,
        description: "Le quiz est lié au trigger et servira au déblocage.",
      });
    } catch (e) {
      toast.error("Quiz IA", {
        id: loadingId,
        description: e instanceof Error ? e.message : "Erreur",
      });
    } finally {
      setIsGeneratingTriggerQuiz(false);
    }
  }, [isPreviewMode, activeTriggerStep, prevActionOfActiveTrigger, library.courses]);

  const handleGenerateCaseContext = useCallback(async () => {
    if (isPreviewMode) return;
    if (!activeTriggerStep || activeTriggerStep.trigger_condition !== "case_study_submitted") return;
    const prev = prevActionOfActiveTrigger;
    const courseTitle =
      prev?.content_kind === "course" && prev.content_id
        ? library.courses.find((c) => c.id === String(prev.content_id))?.title ?? ""
        : "";

    setIsGeneratingCaseContext(true);
    const loadingId = toast.loading("Rédaction de la consigne d’étude de cas…");
    try {
      const hint = String(activeTriggerStep.trigger_case_consigne ?? "").trim();
      const topic = `${courseTitle} ${hint}`.trim();
      if (topic.length < 8) {
        toast.error("Consigne trop courte", {
          id: loadingId,
          description:
            "Ajoutez le titre de la formation ou quelques mots sur le thème / le secteur (au moins 8 caractères).",
        });
        return;
      }
      const res = await fetch("/api/path-triggers/generate-case-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseTitle: String(courseTitle).trim(), hint }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        context?: unknown;
        error?: unknown;
        code?: unknown;
        usedWebContext?: unknown;
      };
      if (!res.ok) {
        const msg =
          typeof payload?.error === "string" && payload.error.trim().length > 0
            ? payload.error
            : "Échec de la génération du contexte.";
        throw new Error(msg);
      }
      const ctx = String(payload?.context ?? "").trim();
      if (!ctx) throw new Error("Réponse vide");
      setActiveTriggerPatch({ trigger_case_context: ctx });
      const usedWeb =
        typeof payload?.usedWebContext === "boolean" ? payload.usedWebContext : false;
      toast.success(usedWeb ? "Consigne générée (extraits web intégrés)" : "Consigne générée (sans recherche web)", {
        id: loadingId,
        description: usedWeb
          ? "Vérifiez les ordres de grandeur auprès de sources officielles si besoin."
          : "Chiffres et entreprises peuvent être entièrement fictifs.",
      });
    } catch (e) {
      toast.error("Contexte", {
        id: loadingId,
        description: e instanceof Error ? e.message : "Erreur",
      });
    } finally {
      setIsGeneratingCaseContext(false);
    }
  }, [isPreviewMode, activeTriggerStep, prevActionOfActiveTrigger, library.courses]);

  const allowedTriggerOptionsForPrevAction = useMemo(() => {
    const kind = prevActionOfActiveTrigger?.content_kind ?? null;
    if (kind === "course") {
      return [
        { id: "formation_completed" as const, label: "Terminée" },
        { id: "quiz_score_gt_x" as const, label: "Score Quiz > X%" },
        { id: "case_study_submitted" as const, label: "Étude de cas" },
        { id: "oral_ia_passed" as const, label: "Présentation orale" },
        { id: "video_ia_passed" as const, label: "Vidéo de présentation" },
        { id: "pdf_ia_passed" as const, label: "Dépôt PDF" },
      ];
    }
    if (kind === "resource") {
      return [
        { id: "resource_link_clicked" as const, label: "Lien cliqué" },
        { id: "resource_document_downloaded" as const, label: "Téléchargé" },
      ];
    }
    if (kind === "test") {
      return [
        { id: "evaluation_passed" as const, label: "Réussite (V/F)" },
      ];
    }
    return [{ id: "previous_step_completed" as const, label: "Étape précédente terminée" }];
  }, [prevActionOfActiveTrigger?.content_kind]);

  const setActiveTriggerPatch = (patch: Partial<WorkflowStep>) => {
    if (!activeTriggerId) return;
    setSteps((prev) => normalizePositions(prev.map((s) => (s.id === activeTriggerId ? { ...s, ...patch } : s))));
  };

  const isTriggerIncomplete = useCallback((step: WorkflowStep, prevAction: WorkflowStep | null) => {
    if (step.type !== "trigger") return false;
    const prevKind = prevAction?.content_kind ?? null;
    const condition = step.trigger_condition ?? null;
    if (!condition) return true;

    if (prevKind === "course") {
      if (condition === "quiz_score_gt_x")
        return !(typeof step.trigger_quiz_min_score === "number") || !String(step.trigger_quiz_test_id ?? "").trim();
      if (condition === "formation_completed") return false;
      if (
        condition === "case_study_submitted" ||
        condition === "oral_ia_passed" ||
        condition === "video_ia_passed" ||
        condition === "pdf_ia_passed"
      ) {
        // V1: on exige juste un seuil et (pour étude de cas) un contexte/prompt.
        if (!(typeof step.trigger_ai_min_score === "number")) return true;
        if (condition === "case_study_submitted") {
          const ctxOk = String(step.trigger_case_context ?? "").trim().length >= 20;
          const consigneOk = String(step.trigger_case_consigne ?? "").trim().length >= 20;
          const evalOk = String(step.trigger_case_prompt ?? "").trim().length >= 20;
          return !(ctxOk && consigneOk && evalOk);
        }
        return false;
      }
      return true;
    }

    if (prevKind === "resource") {
      return !(condition === "resource_link_clicked" || condition === "resource_document_downloaded");
    }

    if (prevKind === "test") {
      if (condition !== "evaluation_passed") return true;
      return typeof step.trigger_evaluation_passed !== "boolean";
    }

    return false;
  }, []);

  const firstBlockingTriggerIndex = useMemo(() => {
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      if (s.type !== "trigger") continue;
      const prevAction = i > 0 ? steps[i - 1] : null;
      if (isTriggerIncomplete(s, prevAction)) return i;
    }
    return -1;
  }, [isTriggerIncomplete, steps]);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const badgesRes = await supabase.from("open_badges").select("id").limit(200);
        const profilesRes = await supabase
          .from("profiles")
          .select("id, email, full_name, role")
          .order("full_name", { ascending: true })
          .limit(500);
        if (ignore) return;
        setOpenBadges((badgesRes.data ?? []).map((b: any) => ({ id: String(b.id), title: null, name: null })));
        setInstructors((profilesRes.data ?? []).map((p: any) => ({ id: String(p.id), email: p.email ?? null, full_name: p.full_name ?? null, role: p.role ?? null })));
      } catch (e) {
        if (!ignore) console.warn("[path-builder] load badges/instructors failed", e);
      }
    };
    run();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      try {
        const [learnersRes, groupsRes] = await Promise.all([
          fetch(selectedOrgId ? `/api/formateur/learners?orgId=${encodeURIComponent(selectedOrgId)}` : "/api/formateur/learners")
            .then((r) => r.json())
            .catch(() => ({ learners: [] })),
          fetch(selectedOrgId ? `/api/formateur/groups?orgId=${encodeURIComponent(selectedOrgId)}` : "/api/formateur/groups")
            .then((r) => r.json())
            .catch(() => ({ groups: [] })),
        ]);
        if (ignore) return;
        setLearners((learnersRes.learners ?? []).map((l: any) => ({ id: String(l.id), full_name: l.full_name ?? null, email: l.email ?? null })));
        setGroups((groupsRes.groups ?? []).map((g: any) => ({ id: String(g.id), name: String(g.name ?? "Groupe"), members_count: g.members_count ?? undefined })));
      } catch (e) {
        if (!ignore) console.warn("[path-builder] unable to load learners/groups", e);
      }
    };
    run();
    return () => {
      ignore = true;
    };
  }, [selectedOrgId]);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    const snap = initialData?.builderSnapshot as any;
    if (snap && typeof snap === "object" && Array.isArray(snap.steps)) {
      setSteps(
        normalizePositions(
          (snap.steps as any[]).map((s, idx) => ({
            id: String(s.id ?? `step-${idx}`),
            type: s.type === "trigger" ? "trigger" : "action",
            content_kind: s.content_kind,
            content_id: s.content_id ?? null,
            trigger_condition: s.trigger_condition ?? null,
            trigger_quiz_min_score:
              typeof s.trigger_quiz_min_score === "number"
                ? s.trigger_quiz_min_score
                : s.trigger_quiz_min_score == null
                  ? null
                  : Number(s.trigger_quiz_min_score),
            trigger_quiz_test_id: s.trigger_quiz_test_id ? String(s.trigger_quiz_test_id) : null,
            trigger_evaluation_passed:
              typeof s.trigger_evaluation_passed === "boolean" ? s.trigger_evaluation_passed : null,
            trigger_ai_min_score:
              typeof s.trigger_ai_min_score === "number"
                ? s.trigger_ai_min_score
                : s.trigger_ai_min_score == null
                  ? null
                  : Number(s.trigger_ai_min_score),
            trigger_case_context: typeof s.trigger_case_context === "string" ? s.trigger_case_context : null,
            trigger_case_consigne: typeof s.trigger_case_consigne === "string" ? s.trigger_case_consigne : null,
            trigger_case_prompt: typeof s.trigger_case_prompt === "string" ? s.trigger_case_prompt : null,
            position: s.position && typeof s.position === "object"
              ? { x: Number(s.position.x ?? 0), y: Number(s.position.y ?? idx * 140) }
              : { x: 0, y: idx * 140 },
          })),
        ),
      );
      setSelectedBadgeId(snap.badgeId ? String(snap.badgeId) : "none");
      setSelectedInstructorIds(Array.isArray(snap.instructor_ids) ? snap.instructor_ids.map(String) : []);
      if (Array.isArray(snap.objectifs)) setObjectifs(snap.objectifs.map(String));
      else if (typeof snap.objective === "string") setObjectifs([snap.objective]);
      if (typeof snap.presentation === "string") setPresentation(snap.presentation);
      if (typeof snap.cover_image === "string") setCoverImage(snap.cover_image);
      if (Array.isArray(snap.tools)) setTools(snap.tools.map((x: any) => String(x ?? "").trim()).filter(Boolean));
      if (snap.assignment && typeof snap.assignment === "object") {
        const learnerIds = Array.isArray(snap.assignment.learnerIds) ? snap.assignment.learnerIds.map(String) : [];
        const groupIds = Array.isArray(snap.assignment.groupIds) ? snap.assignment.groupIds.map(String) : [];
        setAssignedLearnerIds(learnerIds);
        setAssignedGroupIds(groupIds);
      }
      return;
    }

    const migrated: WorkflowStep[] = [];
    const courseIds = initialData?.selectedCourses ?? [];
    const testIds = initialData?.selectedTests ?? [];
    const resourceIds = initialData?.selectedResources ?? [];

    const pushAction = (kind: WorkflowActionKind, id: string) => {
      const index = migrated.length;
      migrated.push({
        id: `step-${Date.now()}-${index}`,
        type: "action",
        content_kind: kind,
        content_id: id,
        trigger_condition: null,
        trigger_quiz_min_score: null,
        trigger_quiz_test_id: null,
        trigger_evaluation_passed: null,
        position: { x: 0, y: index * 120 },
      });
      const tIndex = migrated.length;
      migrated.push({
        id: `step-${Date.now()}-${tIndex}`,
        type: "trigger",
        content_id: null,
        trigger_condition: kind === "resource" ? "resource_link_clicked" : "previous_step_completed",
        trigger_quiz_min_score: null,
        trigger_quiz_test_id: null,
        trigger_evaluation_passed: null,
        position: { x: 0, y: tIndex * 120 },
      });
    };

    courseIds.forEach((id) => pushAction("course", id));
    testIds.forEach((id) => pushAction("test", id));
    resourceIds.forEach((id) => pushAction("resource", id));

    if (migrated.length > 0 && migrated[migrated.length - 1]?.type === "trigger") migrated.pop();
    setSteps(normalizePositions(migrated));
  }, [initialData?.builderSnapshot, initialData?.selectedCourses, initialData?.selectedResources, initialData?.selectedTests]);

  const insertNextStep = () => {
    setSteps((prev) => {
      const last = prev[prev.length - 1] ?? null;
      const nextType: WorkflowStepType = last?.type === "action" ? "trigger" : "action";
      const forceFirstAction = prev.length === 0;
      const type: WorkflowStepType = forceFirstAction ? "action" : nextType;
      const index = prev.length;

      const next: WorkflowStep =
        type === "action"
          ? {
              id: `step-${Date.now()}-${index}`,
              type: "action",
              content_kind: "course",
              content_id: null,
              trigger_condition: null,
              trigger_quiz_min_score: null,
              trigger_quiz_test_id: null,
              trigger_evaluation_passed: null,
              position: { x: 0, y: index * 120 },
            }
          : {
              id: `step-${Date.now()}-${index}`,
              type: "trigger",
              content_id: null,
              trigger_condition:
                last?.type === "action" && last.content_kind === "resource"
                  ? "resource_link_clicked"
                  : "previous_step_completed",
              trigger_quiz_min_score: null,
              trigger_quiz_test_id: null,
              trigger_evaluation_passed: null,
              position: { x: 0, y: index * 120 },
            };

      return normalizePositions([...prev, next]);
    });
  };

  const insertBetween = (afterIndex: number) => {
    setSteps((prev) => {
      const left = prev[afterIndex] ?? null;
      const right = prev[afterIndex + 1] ?? null;
      if (!left || !right) return prev;
      if (left.type !== "trigger" || right.type !== "action") return prev;

      const insertAt = afterIndex + 1;
      const now = Date.now();
      const newAction: WorkflowStep = {
        id: `step-${now}-${insertAt}-a`,
        type: "action",
        content_kind: "course",
        content_id: null,
        trigger_condition: null,
        trigger_quiz_min_score: null,
        trigger_quiz_test_id: null,
        trigger_evaluation_passed: null,
        position: { x: 0, y: 0 },
      };
      const newTrigger: WorkflowStep = {
        id: `step-${now}-${insertAt}-t`,
        type: "trigger",
        content_id: null,
        trigger_condition: "previous_step_completed",
        trigger_quiz_min_score: null,
        trigger_quiz_test_id: null,
        trigger_evaluation_passed: null,
        position: { x: 0, y: 0 },
      };

      return normalizePositions([...prev.slice(0, insertAt), newAction, newTrigger, ...prev.slice(insertAt)]);
    });
  };

  const validateWorkflow = (normalizedSteps: WorkflowStep[]): string | null => {
    if (normalizedSteps.length === 0) return "Ajoutez au moins une Action pour publier.";
    if (normalizedSteps[0]?.type !== "action") return "Le premier nœud doit être une Action.";
    if (normalizedSteps[0]?.content_kind === "test") return "La première Action doit être une Formation ou une Ressource.";

    for (let i = 1; i < normalizedSteps.length; i++) {
      const prev = normalizedSteps[i - 1];
      const cur = normalizedSteps[i];
      if (prev.type === cur.type) return "Le workflow doit alterner strictement Action → Trigger → Action.";
    }

    for (let i = 0; i < normalizedSteps.length; i++) {
      const s = normalizedSteps[i];
      if (s.type === "action") {
        const kind = s.content_kind;
        if (!kind) return `Action #${i + 1}: type de contenu manquant.`;
        if (!s.content_id) return `Action #${i + 1}: sélectionnez un contenu.`;
        const exists =
          kind === "course"
            ? contentIndex.course.has(String(s.content_id))
            : kind === "test"
              ? contentIndex.test.has(String(s.content_id))
              : contentIndex.resource.has(String(s.content_id));
        if (!exists) return `Action #${i + 1}: contenu introuvable (ID invalide).`;
      } else {
        const prevAction = i > 0 ? normalizedSteps[i - 1] : null;
        if (!s.trigger_condition) return `Trigger #${i + 1}: condition manquante.`;
        if (isTriggerIncomplete(s, prevAction)) return `Trigger #${i + 1}: configuration incomplète.`;
      }
    }
    return null;
  };

  const handleSave = async (status: "draft" | "published" = "draft") => {
    if (!title || !title.trim()) {
      toast.error("Titre requis", { description: "Veuillez saisir un titre pour le parcours avant de sauvegarder." });
      return;
    }

    if (isPreviewMode) {
      toast.error("Mode aperçu actif", {
        description: "Cliquez sur « Quitter l’aperçu » pour enregistrer ou publier le parcours.",
      });
      return;
    }

    const normalizedSteps = normalizePositions(steps);
    if (status === "published") {
      const errorMessage = validateWorkflow(normalizedSteps);
      if (errorMessage) {
        toast.error("Publication impossible pour l’instant", { description: errorMessage });
        return;
      }
    }

    if (status === "published") setIsPublishing(true);
    else setIsSaving(true);

    try {
      setSteps(normalizedSteps);
      const builderSnapshot = { ...getSnapshotV2(), steps: normalizedSteps };
      const extraPayload = getAdditionalFields();

      const isUpdate = Boolean(savedPathId);
      const endpoint = isUpdate ? `/api/paths/${savedPathId}` : "/api/paths";
      const method = isUpdate ? "PATCH" : "POST";

      const response = await fetchPathSave(endpoint, method, {
        // API minimaliste: tout est dans path_snapshot
        pathSnapshot: builderSnapshot,
        // Champs persistés en colonnes (pour listes / perfs / UI)
        cover_image: builderSnapshot.cover_image,
        description: builderSnapshot.presentation,
        ...extraPayload,
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const msg = data?.error || "Erreur lors de la sauvegarde";
        const detail = data?.details || data?.hint || "";
        throw new Error(detail ? `${msg}: ${detail}` : msg);
      }

      const createdPathId = String(data.path?.id || "");
      if (createdPathId) setSavedPathId(createdPathId);
      toast.success(status === "published" ? "Parcours publié !" : savedPathId ? "Parcours mis à jour !" : "Parcours sauvegardé !");
      setSuccessOverlay({
        open: true,
        label: status === "published" ? "Parcours publié" : savedPathId ? "Parcours mis à jour" : "Parcours sauvegardé",
      });
      setTimeout(() => setSuccessOverlay({ open: false, label: "" }), 1400);

      if (status === "published") {
        setTimeout(() => {
          router.push("/dashboard/formateur/parcours");
          router.refresh();
        }, 1500);
      }
    } catch (e) {
      const aborted =
        (typeof DOMException !== "undefined" && e instanceof DOMException && e.name === "AbortError") ||
        (e instanceof Error && e.name === "TimeoutError");
      toast.error(aborted ? "Délai dépassé" : "Erreur", {
        description: aborted
          ? "Aucune réponse du serveur dans le temps imparti (2 min). Réessayez ou vérifiez la connexion."
          : e instanceof Error
            ? e.message
            : "Une erreur est survenue.",
      });
    } finally {
      setIsSaving(false);
      setIsPublishing(false);
    }
  };

  const badgeOptions = useMemo(() => openBadges.map((b) => ({ id: b.id, label: b.title ?? b.name ?? b.id })), [openBadges]);
  const instructorOptions = useMemo(() => instructors.map((p) => ({ id: p.id, label: p.full_name || p.email || p.id })), [instructors]);

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [canvasSize, setCanvasSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      setCanvasSize({ w: rect.width, h: rect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /** Ligne droite verticale (timeline) entre les centres estimés des cartes — plus lisible que l’ancienne courbe en S. */
  const connectorPaths = useMemo(() => {
    if (steps.length <= 1 || canvasSize.w <= 0) return [];
    const x = canvasSize.w / 2;
    const topPadding = 64;
    const stepSpacing = 120;

    return steps.slice(0, -1).map((_, idx) => {
      const y1 = topPadding + idx * stepSpacing;
      const y2 = topPadding + (idx + 1) * stepSpacing;
      const d = `M ${x} ${y1} L ${x} ${y2}`;
      return { id: `p-${idx}`, d };
    });
  }, [canvasSize.w, steps]);

  const timelineNodes = useMemo(() => {
    if (canvasSize.w <= 0) return [];
    const x = canvasSize.w / 2;
    const topPadding = 64;
    const stepSpacing = 120;
    return steps.map((_, idx) => ({
      id: `n-${idx}`,
      cx: x,
      cy: topPadding + idx * stepSpacing,
    }));
  }, [canvasSize.w, steps]);

  return (
    <div
      className="path-builder-container min-h-screen bg-[#F9FAFB] text-slate-900"
      style={{
        backgroundImage: "radial-gradient(#e2e8f0 0.8px, transparent 0.8px)",
        backgroundSize: "24px 24px",
        fontFamily:
          '"SF Pro Display","SF Pro Text",-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,Arial,sans-serif',
      }}
    >
      {successOverlay.open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white/90 p-8 text-center shadow-2xl">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/25">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div className="mt-4 text-lg font-extrabold tracking-tight text-slate-900">{successOverlay.label}</div>
            <div className="mt-1 text-sm text-slate-600">Votre parcours est bien enregistré.</div>
          </div>
        </div>
      ) : null}
      <div className="fixed left-0 right-0 top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-6 py-4">
          <button
            type="button"
            onClick={() => router.push("/dashboard/formateur")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au dashboard
          </button>
          <div className="min-w-0 flex-1 px-4 text-center">
            <p className="truncate text-sm font-semibold text-slate-900">{title?.trim() ? title.trim() : "Parcours"}</p>
          </div>
          <div className="flex items-center gap-2">
            {extraHeaderSlot ? <div className="min-w-[220px]">{extraHeaderSlot}</div> : null}
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsPreviewMode((v) => !v)}
              className={cn(
                "rounded-full border px-5 py-2 text-sm font-semibold",
                isPreviewMode
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15"
                  : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
              )}
            >
              {isPreviewMode ? "Quitter l’aperçu" : "Aperçu apprenant"}
            </Button>
            <Button
              type="button"
              onClick={() => handleSave("draft")}
              disabled={isSaving || isPublishing || isPreviewMode}
              title={
                isPreviewMode
                  ? "Quittez « Aperçu apprenant » pour enregistrer"
                  : isSaving || isPublishing
                    ? "Une opération est en cours"
                    : undefined
              }
              className={cn("rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-60", gradientCta)}
            >
              {isSaving ? "Enregistrement..." : "Enregistrer"}
            </Button>
            <Button
              type="button"
              onClick={() => handleSave("published")}
              disabled={isSaving || isPublishing || isPreviewMode}
              title={
                isPreviewMode
                  ? "Quittez « Aperçu apprenant » pour publier"
                  : isSaving || isPublishing
                    ? "Une opération est en cours"
                    : undefined
              }
              className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50 disabled:opacity-60"
            >
              {isPublishing ? "Publication..." : "Publier"}
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1400px] space-y-8 px-6 pb-16 pt-28">
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-0">
            <CardTitle className="text-xl font-extrabold tracking-tight text-slate-900">Paramètres</CardTitle>
            <p className="text-sm text-slate-600">Titre, objectifs, badge, formateur.</p>
          </CardHeader>
          <CardContent className="grid gap-6 p-6 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="uppercase tracking-[0.3em] text-xs text-slate-500">Titre</span>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ex: Parcours Négociation & Influence"
                className="rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="uppercase tracking-[0.3em] text-xs text-slate-500">Cover (image ou vidéo)</span>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="URL (https://...) ou URL .mp4"
                    className="rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm"
                  />
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-900 shadow-sm hover:bg-slate-50">
                    Uploader
                    <input
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const dataUrl = String(reader.result ?? "");
                          if (dataUrl) setCoverImage(dataUrl);
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                </div>
                {coverImage ? (
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                    {isVideoLike(coverImage) ? (
                      <video className="h-32 w-full object-cover" src={coverImage} controls playsInline preload="metadata" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element -- data: URL / external URL preview
                      <img src={coverImage} alt="Cover du parcours" className="h-32 w-full object-cover" />
                    )}
                  </div>
                ) : null}
              </div>
              <p className="text-xs text-slate-500">Astuce: une URL finissant par .mp4 sera traitée comme vidéo.</p>
            </label>
            <div className="space-y-2 md:col-span-2">
              <p className="uppercase tracking-[0.3em] text-xs text-slate-500">Objectifs</p>
              <CourseObjectivesEditor value={objectifs} onChange={setObjectifs} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <p className="uppercase tracking-[0.3em] text-xs text-slate-500">Présentation</p>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">Décrivez le parcours, ses étapes, et la promesse.</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={generatePresentationWithIA}
                  disabled={isGeneratingPresentation || isPreviewMode || !title?.trim()}
                  className="rounded-full border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-900 hover:bg-slate-50"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {isGeneratingPresentation ? "Génération…" : "Générer avec l’IA"}
                </Button>
              </div>
              <Textarea
                value={presentation}
                onChange={(e) => setPresentation(e.target.value)}
                placeholder="Décrivez le parcours, ses étapes, et la promesse."
                className="rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <p className="uppercase tracking-[0.3em] text-xs text-slate-500">Outils</p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
                    aria-label="Choisir les outils utilisés"
                  >
                    <span className="truncate">
                      {tools.length ? `${tools.length} outil${tools.length > 1 ? "s" : ""}` : "Sélectionner des outils"}
                    </span>
                    <span className="text-slate-500">▾</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[280px]">
                  <DropdownMenuLabel>Sélectionner les outils</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {COURSE_TOOL_OPTIONS.map((tool) => (
                    <DropdownMenuCheckboxItem
                      key={tool}
                      checked={tools.includes(tool)}
                      onCheckedChange={(checked) => {
                        const next = new Set(tools);
                        if (checked) next.add(tool);
                        else next.delete(tool);
                        setTools(Array.from(next));
                      }}
                    >
                      {tool}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {tools.length ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <CourseToolsLogos tools={tools} className="text-slate-900" />
                </div>
              ) : null}
            </div>
            <div className="space-y-2 text-sm">
              <span className="uppercase tracking-[0.3em] text-xs text-slate-500">Badge</span>
              <Select value={selectedBadgeId} onValueChange={setSelectedBadgeId}>
                <SelectTrigger className="rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm">
                  <SelectValue placeholder="Sélectionner un badge" />
                </SelectTrigger>
                <SelectContent className="border border-slate-200 bg-white text-slate-900">
                  <SelectItem value="none">Aucun</SelectItem>
                  {badgeOptions.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 text-sm">
              <span className="uppercase tracking-[0.3em] text-xs text-slate-500">Formateurs</span>
              <Select
                value={selectedInstructorIds[0] ?? "none"}
                onValueChange={(value) => setSelectedInstructorIds(value === "none" ? [] : [value])}
              >
                <SelectTrigger className="rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm">
                  <SelectValue placeholder="Sélectionner un formateur" />
                </SelectTrigger>
                <SelectContent className="border border-slate-200 bg-white text-slate-900">
                  <SelectItem value="none">Aucun</SelectItem>
                  {instructorOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">(MVP) un seul formateur pour l’instant.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-0">
            <CardTitle className="text-xl font-extrabold tracking-tight text-slate-900">Assignation</CardTitle>
            <p className="text-sm text-slate-600">Choisissez des apprenants et/ou des groupes.</p>
          </CardHeader>
          <CardContent className="grid gap-6 p-6 md:grid-cols-2">
            <div className="space-y-2">
              <p className="uppercase tracking-[0.3em] text-xs text-slate-500">Apprenants</p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between rounded-2xl border border-slate-200 bg-white text-slate-900"
                  >
                    {assignedLearnerIds.length ? `${assignedLearnerIds.length} sélectionné(s)` : "Sélectionner"}
                    <span className="text-slate-400">▾</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[min(520px,92vw)] border border-slate-200 bg-white text-slate-900">
                  <DropdownMenuLabel>Apprenants</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {learners.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-slate-600">Aucun apprenant disponible.</div>
                  ) : (
                    learners.slice(0, 300).map((l) => {
                      const checked = assignedLearnerIds.includes(l.id);
                      const label = l.full_name || l.email || l.id;
                      return (
                        <DropdownMenuCheckboxItem
                          key={l.id}
                          checked={checked}
                          onCheckedChange={(next) => {
                            setAssignedLearnerIds((prev) =>
                              next ? Array.from(new Set([...prev, l.id])) : prev.filter((id) => id !== l.id),
                            );
                          }}
                        >
                          {label}
                        </DropdownMenuCheckboxItem>
                      );
                    })
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2">
              <p className="uppercase tracking-[0.3em] text-xs text-slate-500">Groupes</p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between rounded-2xl border border-slate-200 bg-white text-slate-900"
                  >
                    {assignedGroupIds.length ? `${assignedGroupIds.length} sélectionné(s)` : "Sélectionner"}
                    <span className="text-slate-400">▾</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[min(520px,92vw)] border border-slate-200 bg-white text-slate-900">
                  <DropdownMenuLabel>Groupes</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {groups.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-slate-600">Aucun groupe disponible.</div>
                  ) : (
                    groups.slice(0, 200).map((g) => {
                      const checked = assignedGroupIds.includes(g.id);
                      return (
                        <DropdownMenuCheckboxItem
                          key={g.id}
                          checked={checked}
                          onCheckedChange={(next) => {
                            setAssignedGroupIds((prev) =>
                              next ? Array.from(new Set([...prev, g.id])) : prev.filter((id) => id !== g.id),
                            );
                          }}
                        >
                          {g.name} {typeof g.members_count === "number" ? `(${g.members_count})` : ""}
                        </DropdownMenuCheckboxItem>
                      );
                    })
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-0">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-xl font-extrabold tracking-tight text-slate-900">Automate de parcours</CardTitle>
                <p className="text-sm text-slate-600">
                  Actions = contenu. Triggers = conditions. Le “+” insère entre deux étapes.
                </p>
              </div>
              <Button
                type="button"
                onClick={insertNextStep}
                disabled={isPreviewMode}
                className={cn("rounded-full px-5 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95", gradientCta)}
              >
                <CirclePlus className="mr-2 h-5 w-5" />
                Ajouter
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div
              ref={canvasRef}
              className="relative min-h-[520px] overflow-hidden rounded-3xl border border-slate-200 bg-white"
            >
              <div className="absolute inset-0 [background-image:radial-gradient(#e2e8f0_0.8px,transparent_0.8px)] [background-size:24px_24px]" />
              <svg className="pointer-events-none absolute inset-0 z-[1]" width="100%" height="100%">
                <defs>
                  <linearGradient id="wfStroke" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#cbd5e1" />
                    <stop offset="50%" stopColor="#94a3b8" />
                    <stop offset="100%" stopColor="#cbd5e1" />
                  </linearGradient>
                </defs>
                {connectorPaths.map((p) => (
                  <path
                    key={p.id}
                    d={p.d}
                    fill="none"
                    stroke="url(#wfStroke)"
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                ))}
                {timelineNodes.map((n) => (
                  <circle key={n.id} cx={n.cx} cy={n.cy} r={4} fill="#f8fafc" stroke="#94a3b8" strokeWidth={2} />
                ))}
              </svg>
              <div className="relative mx-auto max-w-3xl space-y-3 p-8">
                {steps.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
                    Workflow vide. Ajoutez une Action (formation ou ressource) pour commencer.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {steps.map((step, idx) => {
                      const showInsertBetween = step.type === "trigger" && steps[idx + 1]?.type === "action";

                      const handleUpdate = (patch: Partial<WorkflowStep>) => {
                        if (isPreviewMode) return;
                        setSteps((prev) =>
                          normalizePositions(prev.map((s) => (s.id === step.id ? { ...s, ...patch } : s))),
                        );
                      };

                      const handleRemove = () =>
                        isPreviewMode ? undefined : setSteps((prev) => normalizePositions(prev.filter((s) => s.id !== step.id)));

                      const kind = (step.content_kind ?? "course") as WorkflowActionKind;
                      const actionRow =
                        step.type === "action"
                          ? kind === "course"
                            ? contentIndex.course.get(String(step.content_id ?? ""))
                            : kind === "test"
                              ? contentIndex.test.get(String(step.content_id ?? ""))
                              : contentIndex.resource.get(String(step.content_id ?? ""))
                          : null;

                      const actionOptions =
                        kind === "course"
                          ? library.courses.map((c) => ({ id: c.id, label: c.title }))
                          : kind === "test"
                            ? library.tests.map((t) => ({ id: t.id, label: t.title }))
                            : library.resources.map((r) => ({ id: r.id, label: r.title }));

                      const triggerLabel =
                        step.trigger_condition === "formation_completed"
                          ? "Formation complétée"
                          : step.trigger_condition === "quiz_score_gt_80"
                            ? "Validation Quiz"
                            : step.trigger_condition === "resource_link_clicked"
                              ? "Lien cliqué"
                              : step.trigger_condition === "resource_document_downloaded"
                                ? "Document téléchargé"
                                : "Étape précédente terminée";

                      return (
                        <div
                          key={step.id}
                          className={cn(
                            "space-y-3",
                            isPreviewMode && firstBlockingTriggerIndex >= 0 && idx > firstBlockingTriggerIndex
                              ? "opacity-30"
                              : "",
                          )}
                        >
                          {step.type === "action" ? (
                            <ActionNode
                              index={idx}
                              kind={kind}
                              contentId={step.content_id ?? null}
                              contentTitle={actionRow?.title ? String(actionRow.title) : "Action (contenu à définir)"}
                              thumbnailUrl={
                                kind === "course"
                                  ? ((actionRow as any)?.coverImage as string | null) ?? null
                                  : kind === "resource"
                                    ? ((actionRow as any)?.thumbnail as string | null) ?? null
                                    : null
                              }
                              options={actionOptions}
                              disabledTestKind={idx === 0}
                              isReadonly={isPreviewMode}
                              onChangeKind={(nextKind) => {
                                if (idx === 0 && nextKind === "test") {
                                  toast.error("Premier nœud", {
                                    description: "La première Action doit être une Formation ou une Ressource.",
                                  });
                                  return;
                                }
                                handleUpdate({ content_kind: nextKind, content_id: null });
                              }}
                              onChangeContentId={(nextId) => handleUpdate({ content_id: nextId })}
                              onRemove={handleRemove as any}
                            />
                          ) : (
                            <TriggerNode
                              condition={(step.trigger_condition ?? "previous_step_completed") as TriggerCondition}
                              label={triggerLabel}
                              isReadonly={isPreviewMode}
                              isIncomplete={isTriggerIncomplete(step, idx > 0 ? steps[idx - 1] : null)}
                              onClick={() => openTriggerSheet(step.id)}
                              onRemove={handleRemove as any}
                            />
                          )}

                          {showInsertBetween ? (
                            <div className="relative flex justify-center py-1">
                              <button
                                type="button"
                                onClick={() => insertBetween(idx)}
                                disabled={isPreviewMode}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-700 hover:bg-slate-50"
                                aria-label="Insérer une étape"
                              >
                                <CirclePlus className="h-4 w-4" />
                                Insérer
                              </button>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={insertNextStep}
                    disabled={isPreviewMode}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700 hover:bg-slate-50"
                  >
                    <CirclePlus className="h-4 w-4" />
                    Ajouter
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Sheet open={isTriggerSheetOpen} onOpenChange={setIsTriggerSheetOpen}>
        <SheetContent
          side="right"
          className="gap-0 p-0 sm:max-w-[480px] flex w-[92vw] max-w-[480px] flex-col border-l border-slate-200 bg-white text-slate-900"
        >
          <SheetHeader className="shrink-0 border-b border-slate-100 px-6 pb-4 pt-6">
            <SheetTitle className="text-lg font-extrabold tracking-tight text-slate-900">
              Configuration du trigger
            </SheetTitle>
            <SheetDescription className="text-slate-600">
              Options proposées selon l’action précédente.
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6">
          <div className="space-y-6 pb-8">
            {activeTriggerStep?.type !== "trigger" ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                Sélectionnez un trigger dans le canevas.
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Action précédente</p>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900">
                    {prevActionOfActiveTrigger?.content_kind === "course"
                      ? "Formation"
                      : prevActionOfActiveTrigger?.content_kind === "resource"
                        ? "Ressource"
                        : prevActionOfActiveTrigger?.content_kind === "test"
                          ? "Évaluation"
                          : "—"}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Condition</p>
                  <Select
                    value={(activeTriggerStep.trigger_condition ?? "") as any}
                    onValueChange={(v) => {
                      if (isPreviewMode) return;
                      const next = v as WorkflowTriggerCondition;
                      setActiveTriggerPatch({
                        trigger_condition: next,
                        trigger_quiz_min_score: next === "quiz_score_gt_x" ? (activeTriggerStep.trigger_quiz_min_score ?? 80) : null,
                        trigger_quiz_test_id: next === "quiz_score_gt_x" ? (activeTriggerStep.trigger_quiz_test_id ?? null) : null,
                        trigger_evaluation_passed: next === "evaluation_passed" ? (typeof activeTriggerStep.trigger_evaluation_passed === "boolean" ? activeTriggerStep.trigger_evaluation_passed : true) : null,
                        trigger_ai_min_score:
                          next === "case_study_submitted" ||
                          next === "oral_ia_passed" ||
                          next === "video_ia_passed" ||
                          next === "pdf_ia_passed"
                            ? (typeof activeTriggerStep.trigger_ai_min_score === "number" ? activeTriggerStep.trigger_ai_min_score : 75)
                            : null,
                        trigger_case_context: next === "case_study_submitted" ? (activeTriggerStep.trigger_case_context ?? "") : null,
                        trigger_case_consigne: next === "case_study_submitted" ? (activeTriggerStep.trigger_case_consigne ?? "") : null,
                        trigger_case_prompt: next === "case_study_submitted" ? (activeTriggerStep.trigger_case_prompt ?? "") : null,
                      });
                    }}
                  >
                    <SelectTrigger className="rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm" disabled={isPreviewMode}>
                      <SelectValue placeholder="Choisir une condition" />
                    </SelectTrigger>
                    <SelectContent className="border border-slate-200 bg-white text-slate-900">
                      {allowedTriggerOptionsForPrevAction.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {prevActionOfActiveTrigger?.content_kind === "course" && activeTriggerStep.trigger_condition === "quiz_score_gt_x" ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Seuil</p>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={typeof activeTriggerStep.trigger_quiz_min_score === "number" ? String(activeTriggerStep.trigger_quiz_min_score) : ""}
                      onChange={(e) => {
                        if (isPreviewMode) return;
                        const raw = e.target.value;
                        const num = raw === "" ? null : Number(raw);
                        setActiveTriggerPatch({ trigger_quiz_min_score: Number.isFinite(num as any) ? (num as number) : null });
                      }}
                      placeholder="Ex: 80"
                      className="rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm"
                      disabled={isPreviewMode}
                    />
                    <p className="text-xs text-slate-500">Score minimum en %.</p>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={isPreviewMode || isGeneratingTriggerQuiz}
                        onClick={handleGenerateTriggerQuiz}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-800 shadow-sm transition hover:bg-slate-50",
                          isGeneratingTriggerQuiz ? "opacity-60" : "",
                        )}
                      >
                        <Sparkles className="h-4 w-4" />
                        Générer le quiz (IA) — 20 questions
                      </button>

                      {String(activeTriggerStep.trigger_quiz_test_id ?? "").trim() ? (
                        <a
                          href={`/quiz?testId=${encodeURIComponent(String(activeTriggerStep.trigger_quiz_test_id))}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-slate-900"
                        >
                          Ouvrir le quiz
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500">Créez un quiz pour activer ce trigger.</span>
                      )}
                    </div>
                  </div>
                ) : null}

                {prevActionOfActiveTrigger?.content_kind === "course" &&
                (activeTriggerStep.trigger_condition === "case_study_submitted" ||
                  activeTriggerStep.trigger_condition === "oral_ia_passed" ||
                  activeTriggerStep.trigger_condition === "video_ia_passed" ||
                  activeTriggerStep.trigger_condition === "pdf_ia_passed") ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Seuil (score IA)</p>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={
                          typeof activeTriggerStep.trigger_ai_min_score === "number"
                            ? String(activeTriggerStep.trigger_ai_min_score)
                            : ""
                        }
                        onChange={(e) => {
                          if (isPreviewMode) return;
                          const raw = e.target.value;
                          const num = raw === "" ? null : Number(raw);
                          setActiveTriggerPatch({ trigger_ai_min_score: Number.isFinite(num as any) ? (num as number) : null });
                        }}
                        placeholder="Ex: 75"
                        className="rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm"
                        disabled={isPreviewMode}
                      />
                      <p className="text-xs text-slate-500">Score minimum en % (0–100).</p>
                    </div>

                    {activeTriggerStep.trigger_condition === "case_study_submitted" ? (
                      <>
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                              Contexte (affiché à l&apos;apprenant)
                            </p>
                            <button
                              type="button"
                              disabled={isPreviewMode || isGeneratingCaseContext}
                              onClick={() => handleGenerateCaseContext()}
                              className={cn(
                                "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-800 shadow-sm transition hover:bg-slate-50",
                                isGeneratingCaseContext ? "opacity-60" : "",
                              )}
                            >
                              <Sparkles className="h-4 w-4" />
                              Générer la consigne
                            </button>
                          </div>
                          <p className="text-[11px] leading-snug text-slate-500">
                            Rédige une consigne type brief mission (vous êtes responsable de…). Si <code className="rounded bg-slate-100 px-1">
                              TAVILY_API_KEY
                            </code>{" "}
                            ou{" "}
                            <code className="rounded bg-slate-100 px-1">BRAVE_SEARCH_API_KEY</code> est définie sur le serveur, des extraits web
                            peuvent enrichir les chiffres ; sinon le modèle propose un scénario entièrement plausible (fiction pédagogique).
                          </p>
                          <Textarea
                            value={String(activeTriggerStep.trigger_case_context ?? "")}
                            onChange={(e) => {
                              if (isPreviewMode) return;
                              setActiveTriggerPatch({ trigger_case_context: e.target.value });
                            }}
                            placeholder="Contexte : périmètre, acteurs, enjeux… (hors zone de rédaction côté apprenant)."
                            className="max-h-[min(50vh,420px)] min-h-[140px] resize-y overflow-y-auto rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm"
                            disabled={isPreviewMode}
                          />
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                            Consigne (affichée à l&apos;apprenant)
                          </p>
                          <Textarea
                            value={String(activeTriggerStep.trigger_case_consigne ?? "")}
                            onChange={(e) => {
                              if (isPreviewMode) return;
                              setActiveTriggerPatch({ trigger_case_consigne: e.target.value });
                            }}
                            placeholder="Instructions claires pour la production attendue."
                            className="min-h-[100px] rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm"
                            disabled={isPreviewMode}
                          />
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                            Critères d&apos;évaluation (interne)
                          </p>
                          <p className="text-xs text-slate-500">
                            Jamais visible côté apprenant ; sert uniquement à l&apos;outil d&apos;analyse côté serveur.
                          </p>
                          <Textarea
                            value={String(activeTriggerStep.trigger_case_prompt ?? "")}
                            onChange={(e) => {
                              if (isPreviewMode) return;
                              setActiveTriggerPatch({ trigger_case_prompt: e.target.value });
                            }}
                            placeholder="Ex. : vérifie la présence des 4 parties demandées ; tolère les reformulations ; pénalise les affirmations sans source."
                            className="min-h-[100px] rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm"
                            disabled={isPreviewMode}
                          />
                        </div>
                      </>
                    ) : null}
                  </div>
                ) : null}

                {prevActionOfActiveTrigger?.content_kind === "test" && activeTriggerStep.trigger_condition === "evaluation_passed" ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Résultat attendu</p>
                    <Select
                      value={typeof activeTriggerStep.trigger_evaluation_passed === "boolean" ? (activeTriggerStep.trigger_evaluation_passed ? "true" : "false") : ""}
                      onValueChange={(v) => {
                        if (isPreviewMode) return;
                        setActiveTriggerPatch({ trigger_evaluation_passed: v === "true" });
                      }}
                    >
                      <SelectTrigger className="rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm" disabled={isPreviewMode}>
                        <SelectValue placeholder="Choisir" />
                      </SelectTrigger>
                      <SelectContent className="border border-slate-200 bg-white text-slate-900">
                        <SelectItem value="true">Réussite (Vrai)</SelectItem>
                        <SelectItem value="false">Échec (Faux)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  En mode “Aperçu apprenant”, l’édition est verrouillée.
                </div>
              </>
            )}
          </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

