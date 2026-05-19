import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getApprenantDashboardData, getLearnerPathDetail } from "@/lib/queries/apprenant";
import type { LearnerCard } from "@/lib/queries/apprenant";
import { LearnerPathProgramHero } from "@/components/apprenant/learner-path-program-hero";
import { getServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { LearningSessionTracker } from "@/components/learning-session-tracker";
import { CourseOutlineDisclosure } from "@/components/apprenant/course-outline-disclosure";
import { Flag, HelpCircle } from "lucide-react";
import { LearnerTriggerCTA, type LearnerPathTrigger } from "@/components/apprenant/path-trigger-overlays";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ColumnItem = {
  title: string;
  href: string;
  meta: string;
  progress: number;
  accent: "formations" | "tests" | "ressources";
  cover_url?: string | null;
  stepIndex?: number;
};

const gradients: Record<ColumnItem["accent"], string> = {
  formations: "from-[#FF512F]/18 via-[#DD2476]/10 to-transparent",
  tests: "from-[#00C6FF]/18 via-[#0072FF]/10 to-transparent",
  ressources: "from-[#8E2DE2]/18 via-[#4A00E0]/10 to-transparent",
};

const accentHeader: Record<ColumnItem["accent"], string> = {
  formations: "text-[#FF7A45]",
  tests: "text-[#3BA0FF]",
  ressources: "text-[#B388FF]",
};

const accentBorder: Record<ColumnItem["accent"], string> = {
  formations: "border-[#FF512F]/40",
  tests: "border-[#00C6FF]/40",
  ressources: "border-[#8E2DE2]/40",
};

const progressGradient: Record<ColumnItem["accent"], string> = {
  formations: "from-[#FF6A3A] via-[#DD2476] to-[#FF9A44]",
  tests: "from-[#00C6FF] via-[#0072FF] to-[#40A1FF]",
  ressources: "from-[#8E2DE2] via-[#C471ED] to-[#4A00E0]",
};

const clampProgress = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

const buildColumnItems = (cards: LearnerCard[], accent: ColumnItem["accent"], fallbackMeta: string): ColumnItem[] =>
  cards.slice(0, 4).map((card) => ({
    title: card.title,
    href: (card as any).href || `/dashboard/student/learning/parcours/${card.slug}`,
    meta: card.meta ?? fallbackMeta,
    progress: clampProgress(card.progress ?? 0),
    accent,
  }));

export default async function LearnerParcoursDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resolvedSlug = await slug;

  const data = await getApprenantDashboardData();

  const parcoursCard = data.parcours.find((item) => item.slug === resolvedSlug || item.id === resolvedSlug);
  if (!parcoursCard) {
    notFound();
  }

  // L'ID du parcours est présent dans la card (côté dashboard on hydrate depuis path_enrollments).
  const pathId = parcoursCard.id;

  // Récupérer les contenus spécifiques du parcours
  let pathContent = null;
  if (pathId) {
    pathContent = await getLearnerPathDetail(pathId);
  }

  // Utiliser les contenus du parcours si disponibles
  // Important : ne pas fallback sur les contenus généraux si pathContent existe mais est vide
  // Cela permet de distinguer "aucun contenu associé" de "erreur de récupération"
  const formationItems = pathContent && pathContent.courses.length > 0
    ? pathContent.courses.map((course, index) => ({
      title: course.title,
      href: (course as any).href || `/catalog/formations/${course.slug}`,
      meta: "Formation",
      progress: 0,
      accent: "formations" as const,
      cover_url: (course as any).cover_url ?? null,
      stepIndex: index,
    }))
    : [];

  const testItems = pathContent && pathContent.tests.length > 0
    ? pathContent.tests.map((test) => ({
      title: test.title,
      href: (test as any).href || `/catalog/tests/${test.slug}`,
      meta: (test as any).description || "Évaluation",
      progress: 0, // TODO: récupérer la progression depuis test_attempts
      accent: "tests" as const,
    }))
    : [];

  const resourceItems = pathContent && pathContent.resources.length > 0
    ? pathContent.resources.map((resource) => ({
      title: resource.title,
      href: (resource as any).href || `/catalog/ressources/${resource.slug}`,
      meta: (resource as any).type ? `Ressource ${(resource as any).type}` : "Ressource complémentaire",
      progress: 0, // TODO: récupérer la progression depuis resource_views
      accent: "ressources" as const,
    }))
    : [];

  const steps = Array.isArray((pathContent as any)?.steps) ? (((pathContent as any).steps as any[]) ?? []) : [];

  const courseById = new Map(
    (pathContent?.courses ?? []).map((c: any) => [String(c.id), c]),
  );
  const testById = new Map(
    (pathContent?.tests ?? []).map((t: any) => [String(t.id), t]),
  );
  const resourceById = new Map(
    (pathContent?.resources ?? []).map((r: any) => [String(r.id), r]),
  );

  const triggerLabel = (condition: unknown) => {
    const value = String(condition ?? "").trim();
    switch (value) {
      case "formation_completed":
        return "Déclencheur · Formation terminée";
      case "test_scored":
        return "Déclencheur · Quiz / test validé";
      case "quiz_score_gt_x":
        return "Déclencheur · Score quiz";
      case "case_study_submitted":
        return "Déclencheur · Étude de cas";
      case "oral_ia_passed":
        return "Déclencheur · Présentation orale";
      case "video_ia_passed":
        return "Déclencheur · Présentation vidéo";
      case "pdf_ia_passed":
        return "Déclencheur · Dépôt PDF";
      case "inactive_days":
        return "Déclencheur · Inactivité";
      default:
        return value ? `Déclencheur · ${value}` : "Déclencheur";
    }
  };

  const normalizeKind = (raw: unknown) => {
    const k = String(raw ?? "").trim().toLowerCase();
    if (k === "formation" || k === "formations") return "course";
    if (k === "cours" || k === "course" || k === "courses") return "course";
    if (k === "test" || k === "quiz" || k === "tests") return "test";
    if (k === "resource" || k === "resources" || k === "ressource" || k === "ressources") return "resource";
    return k;
  };
  const stepKind = (s: any) => normalizeKind(s?.content_kind ?? s?.contentKind ?? s?.kind);
  const stepId = (s: any) => String(s?.content_id ?? s?.contentId ?? "").trim();

  const timeline = (() => {
    const blocks: Array<
      | { kind: "course"; stepNumber: number; title: string; href: string; meta: string; cover_url?: string | null }
      | { kind: "trigger"; label: string }
      | { kind: "test"; title: string; href: string; meta: string }
      | { kind: "resource"; title: string; href: string; meta: string }
    > = [];

    let courseStep = 0;
    for (const s of steps) {
      const type = String(s?.type ?? "");
      if (type === "trigger") {
        blocks.push({ kind: "trigger", label: triggerLabel(s?.trigger_condition) });
        continue;
      }

      const contentKind = stepKind(s);
      const contentId = stepId(s);
      if (!contentKind || !contentId) continue;

      if (contentKind === "course") {
        const c: any = courseById.get(contentId);
        const slugOrId = String(c?.slug ?? contentId);
        courseStep += 1;
        blocks.push({
          kind: "course",
          stepNumber: courseStep,
          title: String(c?.title ?? "Formation"),
          href: `/catalog/formations/${encodeURIComponent(slugOrId)}`,
          meta: "Formation",
          cover_url: (c as any)?.cover_url ?? null,
        });
        continue;
      }

      if (contentKind === "test") {
        const t: any = testById.get(contentId);
        const slugOrId = String(t?.slug ?? contentId);
        blocks.push({
          kind: "test",
          title: String(t?.title ?? "Test"),
          href: `/catalog/tests/${encodeURIComponent(slugOrId)}`,
          meta: "Évaluation",
        });
        continue;
      }

      if (contentKind === "resource") {
        const r: any = resourceById.get(contentId);
        const slugOrId = String(r?.slug ?? contentId);
        blocks.push({
          kind: "resource",
          title: String(r?.title ?? "Ressource"),
          href: `/catalog/ressources/${encodeURIComponent(slugOrId)}`,
          meta: (r as any)?.type ? `Ressource ${(r as any).type}` : "Ressource",
        });
      }
    }

    // fallback si snapshot.steps absent (anciens parcours)
    if (blocks.length === 0 && formationItems.length > 0) {
      return formationItems.map((item) => ({
        kind: "course" as const,
        stepNumber: (item.stepIndex ?? 0) + 1,
        title: item.title,
        href: item.href,
        meta: item.meta,
        cover_url: item.cover_url ?? null,
      }));
    }

    return blocks;
  })();

  type TestAttemptRow = {
    id: string;
    test_id: string;
    percentage: number | null;
    total_score: number | null;
    max_score: number | null;
    completed_at: string | null;
    created_at: string | null;
    answers?: any;
    category_results?: any;
  };

  type QuizSubmissionRow = {
    id: string;
    test_id: string;
    score: number | null;
    created_at: string | null;
    answers?: any;
    review?: any;
  };

  const testAttempts: TestAttemptRow[] = [];
  const quizSubmissions: QuizSubmissionRow[] = [];
  const openedCourseIds = new Set<string>();
  type TriggerSubmissionRow = { step_id: string; status: string; created_at: string | null };
  const triggerSubmissions: TriggerSubmissionRow[] = [];

  const supabase = await getServerClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id) {
      const ids = (pathContent?.tests ?? []).map((t: any) => String(t.id)).filter(Boolean);
      if (testItems.length > 0 && ids.length > 0) {
        let res: any = await supabase
          .from("test_attempts")
          .select("id, test_id, percentage, total_score, max_score, completed_at, created_at, category_results, answers")
          .eq("user_id", user.id)
          .in("test_id", ids)
          .order("completed_at", { ascending: false })
          .limit(200);

        if (res?.error?.code === "42703" || res?.error?.code === "PGRST204") {
          res = await supabase
            .from("test_attempts")
            .select("id, test_id, percentage, completed_at, created_at, answers")
            .eq("user_id", user.id)
            .in("test_id", ids)
            .order("created_at", { ascending: false })
            .limit(200);
        }

        if (Array.isArray(res?.data)) testAttempts.push(...(res.data as TestAttemptRow[]));
      }

      // Quiz internes (formations) : API /api/quiz/submit -> table quiz_submissions
      if (testItems.length > 0 && ids.length > 0) {
        const { data: qs, error: qsErr } = await supabase
          .from("quiz_submissions")
          .select("id, test_id, score, created_at, answers, review")
          .eq("user_id", user.id)
          .in("test_id", ids)
          .order("created_at", { ascending: false })
          .limit(200);

        if (!qsErr && Array.isArray(qs)) {
          quizSubmissions.push(...(qs as QuizSubmissionRow[]));
        }
      }

      // “Formation complétée” (MVP) : on considère “ouverte” si une session d’apprentissage existe
      const courseIds = (pathContent?.courses ?? []).map((c: any) => String(c.id)).filter(Boolean);
      if (courseIds.length > 0) {
        const { data: sessions } = await supabase
          .from("learning_sessions")
          .select("content_id")
          .eq("user_id", user.id)
          .eq("content_type", "course")
          .in("content_id", courseIds)
          .limit(500);

        for (const row of sessions ?? []) {
          if ((row as any)?.content_id) openedCourseIds.add(String((row as any).content_id));
        }
      }

      if (pathId) {
        const { data: pts, error: ptsErr } = await supabase
          .from("path_trigger_submissions")
          .select("step_id, status, created_at")
          .eq("user_id", user.id)
          .eq("path_id", pathId)
          .order("created_at", { ascending: false })
          .limit(500);

        if (!ptsErr && Array.isArray(pts)) {
          triggerSubmissions.push(...(pts as TriggerSubmissionRow[]));
        }
      }
    }
  }

  const latestAttemptByTestId = (() => {
    const map = new Map<string, TestAttemptRow>();
    for (const a of testAttempts) {
      const key = String(a.test_id);
      if (!key) continue;
      if (!map.has(key)) map.set(key, a);
    }
    return map;
  })();

  const latestQuizSubmissionByTestId = (() => {
    const map = new Map<string, QuizSubmissionRow>();
    for (const s of quizSubmissions) {
      const key = String(s.test_id);
      if (!key) continue;
      if (!map.has(key)) map.set(key, s);
    }
    return map;
  })();

  const latestTriggerOutcomeByStepId = (() => {
    const map = new Map<string, { passed: boolean; status: string }>();
    for (const row of triggerSubmissions) {
      const sid = String((row as any)?.step_id ?? "").trim();
      if (!sid) continue;
      if (map.has(sid)) continue; // already newest (ordered desc)
      const st = String((row as any)?.status ?? "").trim();
      map.set(sid, { passed: st === "passed", status: st });
    }
    return map;
  })();

  const bestPercentForTestId = (testId: string) => {
    const attempt = latestAttemptByTestId.get(testId);
    const quiz = latestQuizSubmissionByTestId.get(testId);

    const attemptPercent =
      typeof attempt?.percentage === "number" && Number.isFinite(attempt.percentage)
        ? attempt.percentage
        : attempt?.total_score != null && attempt?.max_score
          ? (Number(attempt.total_score) / Number(attempt.max_score)) * 100
          : null;

    // quiz_submissions.score est généralement un pourcentage (0..100) dans le LMS quiz player
    const quizPercent =
      typeof quiz?.score === "number" && Number.isFinite(quiz.score) ? quiz.score : null;

    const values = [attemptPercent, quizPercent].filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    if (values.length === 0) return null;
    return Math.max(...values);
  };

  const maxPercentAcrossPathTests = (() => {
    const testIds = (pathContent?.tests ?? []).map((t: any) => String(t.id)).filter(Boolean);
    const values = testIds
      .map((id) => bestPercentForTestId(id))
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    return values.length ? Math.max(...values) : null;
  })();

  const timelineWithLocks = (() => {
    const blocks: Array<
      | { kind: "course"; stepNumber: number; title: string; href: string; slugOrId: string; meta: string; cover_url?: string | null; locked: boolean; courseId?: string }
      | {
          kind: "trigger";
          label: string;
          satisfied: boolean;
          requirement?: string;
          quiz?: { title: string; href: string };
          trigger?: LearnerPathTrigger;
        }
      | { kind: "test"; title: string; href: string; meta: string; locked: boolean }
      | { kind: "resource"; title: string; href: string; meta: string; locked: boolean }
    > = [];

    let unlocked = true;
    let courseStep = 0;
    let lastCourseId: string | null = null;

    for (const s of steps) {
      const type = String(s?.type ?? "");
      if (type === "trigger") {
        const condition = String(s?.trigger_condition ?? "").trim();
        const minScore = typeof s?.trigger_quiz_min_score === "number" ? s.trigger_quiz_min_score : Number(s?.trigger_quiz_min_score);
        const threshold = Number.isFinite(minScore) ? minScore : null;
        const aiMinRaw =
          typeof (s as any)?.trigger_ai_min_score === "number"
            ? (s as any).trigger_ai_min_score
            : Number((s as any)?.trigger_ai_min_score);
        const aiThreshold = Number.isFinite(aiMinRaw) ? Math.max(0, Math.min(100, Math.round(aiMinRaw))) : 75;
        const stepIdForTrigger = String((s as any)?.id ?? "").trim();

        let satisfied = true;
        let requirement: string | undefined = undefined;
        let trigger: LearnerPathTrigger | undefined = undefined;

        if (condition === "formation_completed") {
          satisfied = Boolean(lastCourseId && openedCourseIds.has(String(lastCourseId)));
          requirement = "Ouvrir la formation précédente";
        } else if (condition === "quiz_score_gt_x" || condition === "test_scored") {
          const linkedTestId = String((s as any)?.trigger_quiz_test_id ?? "").trim();
          const best = linkedTestId ? bestPercentForTestId(linkedTestId) : maxPercentAcrossPathTests;
          satisfied = threshold == null ? Boolean(best != null) : Boolean(best != null && best >= threshold);
          requirement = threshold != null ? `Obtenir ≥ ${Math.round(threshold)}% au quiz` : "Réussir un quiz";
        } else if (condition === "case_study_submitted") {
          const outcome = stepIdForTrigger ? latestTriggerOutcomeByStepId.get(stepIdForTrigger) : undefined;
          satisfied = Boolean(outcome?.passed);
          requirement = `Valider l'étude de cas — seuil ${aiThreshold}%`;
          if (pathId && stepIdForTrigger) {
            trigger = {
              kind: "case_study",
              pathId,
              stepId: stepIdForTrigger,
              prevCourseId: lastCourseId,
              minScore: aiThreshold,
              context: String((s as any)?.trigger_case_context ?? "").trim(),
              consigne: String((s as any)?.trigger_case_consigne ?? "").trim(),
            };
          }
        } else if (condition === "oral_ia_passed") {
          const outcome = stepIdForTrigger ? latestTriggerOutcomeByStepId.get(stepIdForTrigger) : undefined;
          satisfied = Boolean(outcome?.passed);
          requirement = `Présentation orale — seuil ${aiThreshold}%`;
          if (pathId && stepIdForTrigger) {
            trigger = { kind: "oral", pathId, stepId: stepIdForTrigger, prevCourseId: lastCourseId, minScore: aiThreshold };
          }
        } else if (condition === "video_ia_passed") {
          const outcome = stepIdForTrigger ? latestTriggerOutcomeByStepId.get(stepIdForTrigger) : undefined;
          satisfied = Boolean(outcome?.passed);
          requirement = `Présentation vidéo — seuil ${aiThreshold}%`;
          if (pathId && stepIdForTrigger) {
            trigger = { kind: "video", pathId, stepId: stepIdForTrigger, prevCourseId: lastCourseId, minScore: aiThreshold };
          }
        } else if (condition === "pdf_ia_passed") {
          const outcome = stepIdForTrigger ? latestTriggerOutcomeByStepId.get(stepIdForTrigger) : undefined;
          satisfied = Boolean(outcome?.passed);
          requirement = `Dépôt PDF — seuil ${aiThreshold}%`;
          if (pathId && stepIdForTrigger) {
            trigger = { kind: "pdf", pathId, stepId: stepIdForTrigger, prevCourseId: lastCourseId, minScore: aiThreshold };
          }
        } else if (condition) {
          satisfied = false;
          requirement = "Déclencheur non supporté côté apprenant (mettez à jour le parcours)";
        }

        let quiz: { title: string; href: string } | undefined = undefined;
        const linkedTestId = String((s as any)?.trigger_quiz_test_id ?? "").trim();
        if (linkedTestId) {
          const t: any = testById.get(linkedTestId);
          quiz = {
            title: String(t?.title ?? "Quiz de validation"),
            href: `/quiz?testId=${encodeURIComponent(linkedTestId)}`,
          };
        }

        blocks.push({
          kind: "trigger",
          label: triggerLabel(condition),
          satisfied,
          ...(requirement ? { requirement } : {}),
          ...(quiz ? { quiz } : {}),
          ...(trigger ? { trigger } : {}),
        });

        unlocked = satisfied;
        continue;
      }

      const contentKind = stepKind(s);
      const contentId = stepId(s);
      if (!contentKind || !contentId) continue;

      if (contentKind === "course") {
        const c: any = courseById.get(contentId);
        const slugOrId = String(c?.slug ?? contentId);
        courseStep += 1;
        lastCourseId = String(contentId);
        blocks.push({
          kind: "course",
          stepNumber: courseStep,
          title: String(c?.title ?? "Formation"),
          href: `/catalog/formations/${encodeURIComponent(slugOrId)}`,
          slugOrId,
          meta: "Formation",
          cover_url: (c as any)?.cover_url ?? null,
          locked: !unlocked,
          courseId: String(contentId),
        });
        continue;
      }

      if (contentKind === "test") {
        const t: any = testById.get(contentId);
        const slugOrId = String(t?.slug ?? contentId);
        blocks.push({
          kind: "test",
          title: String(t?.title ?? "Test"),
          href: `/catalog/tests/${encodeURIComponent(slugOrId)}`,
          meta: "Évaluation",
          locked: !unlocked,
        });
        continue;
      }

      if (contentKind === "resource") {
        const r: any = resourceById.get(contentId);
        const slugOrId = String(r?.slug ?? contentId);
        blocks.push({
          kind: "resource",
          title: String(r?.title ?? "Ressource"),
          href: `/catalog/ressources/${encodeURIComponent(slugOrId)}`,
          meta: (r as any)?.type ? `Ressource ${(r as any).type}` : "Ressource",
          locked: !unlocked,
        });
      }
    }

    return blocks.length ? blocks : (timeline as any);
  })();

  const heroCover = (pathContent as any)?.cover_image || parcoursCard.image;
  const heroPresentation = (pathContent as any)?.presentation || null;
  const heroObjectifs = Array.isArray((pathContent as any)?.objectifs) ? (pathContent as any).objectifs : [];
  const heroTools = Array.isArray((pathContent as any)?.tools) ? (pathContent as any).tools : [];
  const heroIsVideo =
    typeof heroCover === "string" &&
    (heroCover.trim().toLowerCase().endsWith(".mp4") || heroCover.trim().startsWith("data:video/"));

  const trackingPathId = pathId;

  return (
    <LearningSessionTracker
      contentType="path"
      contentId={trackingPathId}
      showIndicator={false}
    >
      <DashboardShell
        title={parcoursCard.title}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard/apprenant" },
          { label: "Parcours", href: "/dashboard/student/learning/parcours" },
          { label: parcoursCard.title },
        ]}
        initialCollapsed
      >
      <div className="space-y-10">
        <LearnerPathProgramHero
          title={parcoursCard.title}
          badge={(parcoursCard as any).badge ?? null}
          coverUrl={heroCover}
          coverIsVideo={Boolean(heroIsVideo)}
          presentation={heroPresentation}
          objectifs={heroObjectifs}
          tools={heroTools}
          resumeHref={parcoursCard.href}
          formationCount={formationItems.length}
          testCount={testItems.length}
          resourceCount={resourceItems.length}
          pathId={trackingPathId}
        />

        <section id="composition" className="space-y-8">
          <header className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">Feuille de route</h2>
            <p className="max-w-2xl text-sm text-white/50">Suivez les étapes dans l&apos;ordre : chaque bloc débloque la suite.</p>
          </header>

          <div className="space-y-12">
            {timelineWithLocks.length > 0 ? (
              <div className="relative space-y-6">
                <div className="absolute left-4 top-3 h-[calc(100%-12px)] w-px bg-white/10" />
                {timelineWithLocks.map((block: any, idx: number) => {
                  if ((block as any).kind === "trigger") {
                    const quiz = (block as any).quiz as { title: string; href: string } | undefined;
                    const learnerTrigger = (block as any).trigger as LearnerPathTrigger | undefined;
                    return (
                      <div key={`trigger-${idx}`} className="relative flex items-start gap-4">
                        <div className="relative z-10 mt-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[10px] font-semibold text-white/70">
                          •
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-3">
                          <div
                            className={cn(
                              "inline-flex w-full max-w-full flex-col gap-2 rounded-3xl border px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.28em] sm:flex-row sm:items-center sm:justify-between",
                              (block as any).satisfied
                                ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                                : "border-amber-400/20 bg-amber-500/10 text-amber-200",
                            )}
                          >
                            <div className="inline-flex min-w-0 flex-wrap items-center gap-2">
                              {quiz ? <HelpCircle className="h-4 w-4" /> : null}
                              {!quiz && String((block as any).label ?? "").includes("Formation") ? <Flag className="h-4 w-4" /> : null}
                              <span className="break-words">{(block as any).label}</span>
                              {(block as any).requirement ? (
                                <span className="normal-case tracking-normal text-white/60">
                                  — {(block as any).requirement}
                                </span>
                              ) : null}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                              {quiz ? (
                                <Button
                                  asChild
                                  type="button"
                                  variant="outline"
                                  className="rounded-full border-white/15 bg-white/5 text-[10px] font-semibold uppercase tracking-[0.28em] text-white hover:bg-white/10"
                                >
                                  <Link href={quiz.href} className="inline-flex items-center gap-2">
                                    <HelpCircle className="h-4 w-4" />
                                    {quiz.title}
                                  </Link>
                                </Button>
                              ) : null}

                              {learnerTrigger ? (
                                <LearnerTriggerCTA
                                  trigger={learnerTrigger}
                                  satisfied={Boolean((block as any).satisfied)}
                                />
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if ((block as any).kind === "course") {
                    const item = block as any;
                    const row = (
                      <>
                        <div className="relative z-10 mt-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/60 text-xs font-semibold text-white">
                          {item.stepNumber}
                        </div>
                        <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
                          <div className="relative h-24 w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800 via-slate-900 to-black md:h-20 md:w-44">
                            {item.cover_url ? (
                              String(item.cover_url).trim().toLowerCase().endsWith(".mp4") ||
                              String(item.cover_url).trim().startsWith("data:video/") ? (
                                <video
                                  className="h-full w-full object-cover"
                                  autoPlay
                                  muted
                                  playsInline
                                  loop
                                  preload="metadata"
                                  src={item.cover_url}
                                />
                              ) : (
                                <Image
                                  src={item.cover_url}
                                  alt={item.title}
                                  fill
                                  sizes="(min-width: 768px) 176px, 100vw"
                                  className="object-cover transition duration-700 group-hover:scale-[1.03]"
                                />
                              )
                            ) : null}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/45">
                              Étape {item.stepNumber}
                            </div>
                            <div className="mt-1 text-lg font-semibold leading-snug text-white">
                              {item.title}
                            </div>
                            <div className="mt-1 text-sm text-white/60">{item.meta}</div>
                          </div>
                          <div className="shrink-0">
                            <Button className="rounded-full bg-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-white/18">
                              {item.locked ? "Verrouillé" : "Lancer"}
                            </Button>
                          </div>
                        </div>
                      </>
                    );

                    return (
                      <div
                        key={`course-${item.href}-${item.stepNumber}`}
                        className={cn(
                          "group relative flex flex-col rounded-3xl border border-white/10 bg-white/5 p-4 transition focus-within:ring-2 focus-within:ring-white/20",
                          item.locked ? "opacity-50" : "hover:border-white/20 hover:bg-white/10",
                        )}
                      >
                        {item.locked ? (
                          <div
                            role="group"
                            aria-disabled
                            className="flex min-w-0 flex-wrap gap-4 outline-none"
                          >
                            {row}
                          </div>
                        ) : (
                          <Link
                            href={item.href}
                            className="flex min-w-0 flex-wrap gap-4 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                          >
                            {row}
                          </Link>
                        )}
                        {item.courseId && item.slugOrId ? (
                          <div className="min-w-0 w-full">
                            <CourseOutlineDisclosure
                              courseId={String(item.courseId)}
                              slugOrId={String(item.slugOrId)}
                              locked={Boolean(item.locked)}
                              posterUrl={item.cover_url ? String(item.cover_url) : null}
                            />
                          </div>
                        ) : null}
                      </div>
                    );
                  }

                  if ((block as any).kind === "test" || (block as any).kind === "resource") {
                    const item = block as any;
                    return (
                      <Link
                        key={`${item.kind}-${item.href}-${idx}`}
                        href={item.href}
                        aria-disabled={item.locked ? true : undefined}
                        className={cn(
                          "group relative flex gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
                          item.locked ? "pointer-events-none opacity-50" : "hover:border-white/20 hover:bg-white/10",
                        )}
                      >
                        <div className="relative z-10 mt-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[10px] font-semibold text-white/70">
                          {item.kind === "test" ? "T" : "R"}
                        </div>
                        <div className="flex-1">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/45">
                            {item.kind === "test" ? "Test" : "Ressource"}
                          </div>
                          <div className="mt-1 text-lg font-semibold leading-snug text-white">{item.title}</div>
                          <div className="mt-1 text-sm text-white/60">{item.meta}</div>
                        </div>
                        <div className="shrink-0 self-center">
                          <Button className="rounded-full bg-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-white/18">
                            {item.locked ? "Verrouillé" : "Ouvrir"}
                          </Button>
                        </div>
                      </Link>
                    );
                  }

                  return null;
                })}
              </div>
            ) : null}

            {testItems.length === 0 ? (
              <p className="text-sm text-white/45">Aucun quiz ou test n&apos;est rattaché à ce parcours.</p>
            ) : null}

            {testItems.length > 0 ? (
              <details className="group/notes rounded-2xl border border-white/10 bg-white/[0.04] open:border-white/15">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-white [&::-webkit-details-marker]:hidden">
                  <span>Résultats aux quiz</span>
                  <Badge className="shrink-0 rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/55">
                    {testItems.length}
                  </Badge>
                </summary>
                <div className="border-t border-white/10 px-4 pb-4 pt-2">
                <div className="grid gap-4 md:grid-cols-2">
                  {pathContent?.tests?.map((t: any) => {
                    const attempt = latestAttemptByTestId.get(String(t.id));
                    const percent =
                      typeof attempt?.percentage === "number"
                        ? Math.round(attempt.percentage)
                        : null;
                    const scoreLabel =
                      percent != null
                        ? `${percent}%`
                        : attempt?.total_score != null && attempt?.max_score != null
                          ? `${attempt.total_score}/${attempt.max_score}`
                          : "Pas encore de note";
                    return (
                      <Card
                        key={`test-note-${t.id}`}
                        className="overflow-hidden rounded-3xl border border-white/10 bg-white/5"
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/45">
                                Test
                              </div>
                              <div className="mt-1 truncate text-lg font-semibold text-white">
                                {String(t.title ?? "Test")}
                              </div>
                              <div className="mt-1 text-sm text-white/55">
                                {attempt?.completed_at ? "Terminé" : attempt ? "En cours" : "À faire"}
                              </div>
                            </div>
                            <div className="shrink-0 rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm font-semibold text-white">
                              {scoreLabel}
                            </div>
                          </div>

                          {attempt?.answers ? (
                            <details className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-white/70">
                              <summary className="cursor-pointer select-none text-[11px] font-semibold uppercase tracking-[0.28em] text-white/60">
                                Voir les réponses
                              </summary>
                              <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words text-white/70">
{JSON.stringify(attempt.answers, null, 2)}
                              </pre>
                            </details>
                          ) : null}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                </div>
              </details>
            ) : null}

            {resourceItems.length > 0 && renderContentSection("Ressources", "ressources", resourceItems)}
          </div>
        </section>
      </div>
    </DashboardShell>
    </LearningSessionTracker>
  );
}

function renderContentSection(title: string, accent: ColumnItem["accent"], items: ColumnItem[]) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className={cn("text-xl font-semibold", accentHeader[accent])}>{title}</h3>
          <Badge className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white/60">
            {items.length} {items.length === 1 ? 'élément' : 'éléments'}
          </Badge>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Link
            key={`${title}-${item.title}`}
            href={item.href}
            className="group"
          >
            <Card className={cn(
              "h-full overflow-hidden border transition duration-300",
              accentBorder[accent],
              "bg-gradient-to-br from-black/40 via-black/20 to-transparent",
              "hover:border-white/40 hover:shadow-lg hover:shadow-black/20"
            )}>
              <div className="relative h-48 w-full overflow-hidden">
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-60",
                  accent === "formations" && "from-[#FF512F]/30 via-[#DD2476]/20 to-transparent",
                  accent === "tests" && "from-[#00C6FF]/30 via-[#0072FF]/20 to-transparent",
                  accent === "ressources" && "from-[#8E2DE2]/30 via-[#4A00E0]/20 to-transparent",
                )} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-white line-clamp-2 group-hover:text-white/90 transition">
                        {item.title}
                      </h4>
                      <p className="mt-1 text-xs uppercase tracking-[0.3em] text-white/60">
                        {item.meta}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <CardContent className="p-5 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>Progression</span>
                    <span className="font-semibold text-white/80">{item.progress}%</span>
                  </div>
                  <div className="relative h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={cn(
                        "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
                        `bg-gradient-to-r ${progressGradient[accent]}`
                      )}
                      style={{ width: `${clampProgress(item.progress)}%` }}
                    />
                  </div>
                </div>
                
                <div className="pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full rounded-full border text-xs font-semibold uppercase tracking-[0.3em] transition",
                      accent === "formations" && "border-[#FF512F]/40 text-[#FF7A45] hover:border-[#FF512F]/60 hover:bg-[#FF512F]/10",
                      accent === "tests" && "border-[#00C6FF]/40 text-[#3BA0FF] hover:border-[#00C6FF]/60 hover:bg-[#00C6FF]/10",
                      accent === "ressources" && "border-[#8E2DE2]/40 text-[#B388FF] hover:border-[#8E2DE2]/60 hover:bg-[#8E2DE2]/10",
                    )}
                  >
                    Accéder
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}


