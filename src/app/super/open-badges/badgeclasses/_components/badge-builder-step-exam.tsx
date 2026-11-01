"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FileText, FileUp, ListChecks, Mic, Plus, Sparkles, Video, X } from "lucide-react";
import { resolveValidatorPhotoUrl } from "@/lib/validators/photo-url";
import {
  resolvedWeights,
  setCriterionWeight,
  type BadgeBuilderState,
  type BadgeDeliverableDraft,
  type DeliverableFormat,
  type MethodPractice,
} from "@/lib/openbadges/badge-builder";
import { methodDisplayName } from "@/lib/openbadges/criterion-coverage";
import { gradingPromptFromCriteria } from "@/lib/openbadges/grading-guard";
import {
  createEmptyQcmQuestion,
  defaultMethodConfig,
  ensureUniqueQcmIds,
  quizAskedCount,
  type BadgeMethodConfig,
  type CaseMaterial,
  type QcmQuestion,
} from "@/lib/openbadges/badge-method-config";
import { type BadgeEvaluationMethodId } from "@/lib/openbadges/badge-evaluation";
import { activityExamKey, listPlaygroundActivities, playgroundCardStatus, playgroundSubtitle, type PlaygroundActivity } from "@/lib/openbadges/playground-activity";
import { PlaygroundActivityFields } from "@/app/super/open-badges/badgeclasses/_components/badge-builder-playground-fields";
import { PassageFrame } from "@/components/open-badges/passage/passage-chrome";
import { examMinutes, PassageExamHost } from "@/components/open-badges/passage/passage-host";
import type { PassageMeta } from "@/components/open-badges/passage/passage-meta";

const METHODS: Array<{ id: BadgeEvaluationMethodId; title: string; phrase: string; icon: typeof FileText }> = [
  { id: "case_study", title: "Étude de cas", phrase: "Un cas à traiter par écrit.", icon: FileText },
  { id: "video", title: "Vidéo", phrase: "Une prise de parole filmée.", icon: Video },
  { id: "playground", title: "Playground", phrase: "Une activité interactive.", icon: Sparkles },
  { id: "qcm", title: "Questionnaire", phrase: "Des questions à choix.", icon: ListChecks },
  { id: "dictation", title: "Réponse orale", phrase: "Une réponse enregistrée.", icon: Mic },
  { id: "pdf_upload", title: "Document", phrase: "Un fichier à déposer.", icon: FileUp },
];

const FORMATS: Array<{ id: DeliverableFormat; label: string }> = [
  { id: "text", label: "Texte" },
  { id: "file", label: "Fichier" },
  { id: "video", label: "Vidéo" },
  { id: "link", label: "Lien" },
];

type Criterion = { id: string; label: string; expectedOutcome?: string | null };
type Validator = { id: string; first_name?: string | null; last_name?: string | null; full_name?: string | null; description?: string | null; photo_url?: string | null };

function fieldClass() {
  return "w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 py-2 text-sm text-[#EEF0F7] placeholder:text-[#8C94B2]";
}

function instructionOf(config: BadgeMethodConfig | undefined): string {
  if (!config) return "";
  if (config.methodId === "case_study") return config.caseStudy?.learnerPrompt ?? "";
  if (config.methodId === "playground") return config.playground?.learnerPrompt ?? "";
  return config.learnerInstruction ?? "";
}

export function BadgeBuilderStepExam({
  name,
  level,
  criteria,
  methods,
  onMethods,
  configs,
  onConfigs,
  builder,
  onBuilder,
  validators,
  expertId,
  onExpert,
  aiPrecheck,
  onAiPrecheck,
  openId,
  onOpen,
  onAddCriteria,
  variant = "cards",
  domainLabel,
}: {
  name: string;
  level: string;
  criteria: Criterion[];
  methods: string[];
  onMethods: (next: string[]) => void;
  configs: BadgeMethodConfig[];
  onConfigs: (next: BadgeMethodConfig[]) => void;
  builder: BadgeBuilderState;
  onBuilder: (patch: Partial<BadgeBuilderState>) => void;
  validators: Validator[];
  expertId: string;
  onExpert: (id: string) => void;
  aiPrecheck: boolean;
  onAiPrecheck: (value: boolean) => void;
  openId: string | null;
  onOpen: (id: string | null) => void;
  onAddCriteria: (items: Array<{ label: string; description: string; expectedOutcome: string }>) => void;
  variant?: "cards" | "full";
  domainLabel?: string | null;
}) {
  const titled = criteria.filter((item) => item.label.trim());
  const practiceOf = (id: string): MethodPractice => builder.exam.practices[id] ?? { criteria: [], deliverables: [] };
  const checkedIds = (id: string) => practiceOf(id).criteria.map((link) => link.criterionId);
  const weightsOf = (id: string) => resolvedWeights(checkedIds(id), Object.fromEntries(practiceOf(id).criteria.map((link) => [link.criterionId, link.weight])));
  const [advanced, setAdvanced] = useState<string | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [pickingExpert, setPickingExpert] = useState(false);
  const [adding, setAdding] = useState(false);
  const [pickingActivity, setPickingActivity] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingKey, setGeneratingKey] = useState<string | null>(null);
  const [modalityError, setModalityError] = useState("");
  const [quizError, setQuizError] = useState("");
  const [anthropicPrompt, setAnthropicPrompt] = useState("");
  const [briefing, setBriefing] = useState(false);
  const [asLearner, setAsLearner] = useState(false);
  const [learnerSeconds, setLearnerSeconds] = useState<number | null>(null);
  const [deduced, setDeduced] = useState<Array<{ label: string; description: string; expectedOutcome: string }>>([]);
  const [deducing, setDeducing] = useState(false);

  const patchExam = (patch: Partial<BadgeBuilderState["exam"]>) => {
    onBuilder({ exam: { ...builder.exam, ...patch } });
  };

  const configOf = (id: string) => configs.find((item) => item.methodId === id);

  const writeConfig = (id: BadgeEvaluationMethodId, patch: Partial<BadgeMethodConfig>) => {
    onConfigs(configs.map((item) => (item.methodId === id ? { ...item, ...patch } : item)));
  };

  const setInstruction = (id: BadgeEvaluationMethodId, value: string) => {
    const current = configOf(id) ?? defaultMethodConfig(id);
    if (id === "case_study") {
      writeConfig(id, { caseStudy: { context: current.caseStudy?.context ?? "", learnerPrompt: value, materials: current.caseStudy?.materials, characterName: current.caseStudy?.characterName } });
      return;
    }
    if (id === "playground") {
      writeConfig(id, { playground: { learnerPrompt: value, maxAttempts: current.playground?.maxAttempts ?? 2 } });
      return;
    }
    writeConfig(id, { learnerInstruction: value });
  };

  const promptFor = (id: string) => gradingPromptFromCriteria(
    titled
      .filter((item) => checkedIds(id).includes(item.id))
      .map((item) => ({ ...item, weight: weightsOf(id)[item.id] ?? 0 })),
  );

  useEffect(() => {
    const practice = builder.exam.practices.qcm;
    if (!practice || practice.deliverables.length === 0) return;
    onBuilder({ exam: { ...builder.exam, practices: { ...builder.exam.practices, qcm: { ...practice, deliverables: [] } } } });
    // On retire le livrable dès qu'un questionnaire en a un.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builder.exam.practices.qcm?.deliverables.length]);

  const setPractice = (id: string, practice: MethodPractice) => {
    onBuilder({ exam: { ...builder.exam, practices: { ...builder.exam.practices, [id]: practice } } });
  };

  const deduceCriteria = async (methodId: string, consigne: string) => {
    setDeducing(true);
    try {
      const response = await fetch("/api/super-admin/open-badges/suggest-criteria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `${name} · ${methodDisplayName(methodId)}`, description: consigne, level: level ? Number(level) : null }),
      });
      const payload = await response.json();
      setDeduced(Array.isArray(payload.criteria) ? payload.criteria : []);
    } catch {
      setDeduced([]);
    } finally {
      setDeducing(false);
    }
  };

  const toggleCriterion = (methodId: string, criterionId: string) => {
    const practice = practiceOf(methodId);
    const exists = practice.criteria.some((link) => link.criterionId === criterionId);
    const ids = exists
      ? practice.criteria.filter((link) => link.criterionId !== criterionId).map((link) => link.criterionId)
      : [...practice.criteria.map((link) => link.criterionId), criterionId];
    const weights = resolvedWeights(ids, Object.fromEntries(practice.criteria.map((link) => [link.criterionId, link.weight])));
    setPractice(methodId, { ...practice, criteria: ids.map((item) => ({ criterionId: item, weight: weights[item] ?? 0 })) });
  };

  useEffect(() => {
    setAsLearner(false);
  }, [openId]);

  useEffect(() => {
    if (variant !== "cards" || !openId) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [variant, openId, onOpen]);

  useEffect(() => {
    const next = configs.map((item) => {
      if (builder.exam.promptCustom[item.methodId]) return item;
      const prompt = promptFor(item.methodId);
      if (item.evaluationPrompt === prompt) return item;
      return { ...item, evaluationPrompt: prompt };
    });
    if (next.some((item, index) => item !== configs[index])) onConfigs(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builder.exam.practices, criteria, builder.exam.promptCustom]);

  const toggle = (id: BadgeEvaluationMethodId, checked: boolean) => {
    if (!checked) {
      onMethods(methods.filter((item) => item !== id));
      onConfigs(configs.filter((item) => item.methodId !== id));
      if (openId === id) onOpen(null);
      return;
    }
    onMethods(methods.includes(id) ? methods : [...methods, id]);
    onOpen(id);
    if (!configOf(id)) {
      const created = defaultMethodConfig(id);
      created.evaluationPrompt = promptFor(id);
      if (id === "qcm" && created.quiz) {
        created.quiz = { ...created.quiz, title: name, level: level ? Number(level) : undefined, passingScorePercent: 80, randomDraw: true };
      }
      onConfigs([...configs, created]);
    }
  };

  const addPlayground = (type: PlaygroundActivity["type"]) => {
    const current = configOf("playground") ?? defaultMethodConfig("playground");
    const activity: PlaygroundActivity = {
      id: crypto.randomUUID(),
      type,
      learnerPrompt: "",
      maxAttempts: current.playground?.maxAttempts ?? 2,
      mode: type === "module" ? "training" : "certification",
      situation: type === "situation" ? { character: "", objective: "", moments: [], variants: [], mode: "certification" } : undefined,
    };
    const activities = [...(current.playground?.activities ?? []), activity];
    const next = { ...current, evaluationPrompt: current.evaluationPrompt || promptFor("playground"), playground: { learnerPrompt: "", maxAttempts: activity.maxAttempts, activities } };
    onConfigs(configOf("playground") ? configs.map((item) => item.methodId === "playground" ? next : item) : [...configs, next]);
    if (!methods.includes("playground")) onMethods([...methods, "playground"]);
    onOpen(activityExamKey(activity));
    setPickingActivity(false);
    setAdding(false);
  };

  const updateActivity = (key: string, next: PlaygroundActivity) => {
    const current = configOf("playground") ?? defaultMethodConfig("playground");
    const stored = current.playground?.activities ?? [];
    const activities = stored.length ? stored : listPlaygroundActivities(current.playground);
    const saved = next.id === "main" ? { ...next, id: crypto.randomUUID() } : next;
    writeConfig("playground", {
      playground: {
        learnerPrompt: current.playground?.learnerPrompt ?? "",
        maxAttempts: current.playground?.maxAttempts ?? 2,
        activities: activities.map((item) => {
          const itemKey = stored.length ? activityExamKey(item) : "playground";
          return itemKey === key ? saved : item;
        }),
      },
    });
    if (next.id === "main") onOpen(activityExamKey(saved));
  };

  const generateQuestions = async (extra: boolean) => {
    const quiz = configOf("qcm");
    if (!quiz) return;
    setGenerating(true);
    setQuizError("");
    try {
      const response = await fetch("/api/admin/open-badges/generate-qcm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          evaluationPrompt: promptFor("qcm"),
          questionCount: extra ? 5 : quiz.quiz?.questionCount ?? 5,
          badgeTitle: name,
          quizTitle: name,
          quizLevel: level ? Number(level) : null,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !Array.isArray(payload.questions)) {
        setQuizError(payload.message ?? payload.error ?? "Génération impossible");
        return;
      }
      const linked = checkedIds("qcm");
      const incoming = ensureUniqueQcmIds(payload.questions as QcmQuestion[]).map((question, index) => ({
        ...question,
        reviewStatus: "to_review" as const,
        criterionId: linked[index % Math.max(1, linked.length)] || undefined,
      }));
      const previous = extra ? quiz.quiz?.questions ?? [] : [];
      const questions = [...previous, ...incoming];
      writeConfig("qcm", {
        evaluationPrompt: builder.exam.promptCustom.qcm ? quiz.evaluationPrompt : promptFor("qcm"),
        quiz: {
          ...(quiz.quiz ?? { questions: [] }),
          generationMode: "ai",
          title: name,
          level: level ? Number(level) : undefined,
          randomDraw: false,
          limitDraw: false,
          questionCount: questions.length,
          passingScorePercent: quiz.quiz?.passingScorePercent ?? 80,
          questions,
        },
      });
    } catch {
      setQuizError("Génération impossible");
    } finally {
      setGenerating(false);
    }
  };

  const createWithAi = async (key: string, methodId: BadgeEvaluationMethodId, activity?: PlaygroundActivity) => {
    if (methodId === "qcm") {
      await generateQuestions(false);
      return;
    }
    if (methodId === "case_study" && !configOf("case_study")?.caseStudy?.characterName?.trim()) {
      setModalityError("Indiquez d'abord le prénom du personnage.");
      return;
    }
    if (activity?.type === "module") return;
    const selected = titled.filter((item) => checkedIds(key).includes(item.id));
    if (selected.length === 0) return;
    setGeneratingKey(key);
    setModalityError("");
    try {
      const response = await fetch("/api/super-admin/open-badges/generate-modality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          methodId,
          activityType: activity?.type,
          badgeName: name,
          level,
          characterName: methodId === "case_study" ? configOf("case_study")?.caseStudy?.characterName?.trim() ?? "" : "",
          criteria: selected.map((item) => ({ label: item.label, expectedOutcome: item.expectedOutcome ?? "" })),
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.modality?.learnerPrompt) {
        setModalityError(payload.error ?? "Création impossible");
        return;
      }
      const modality = payload.modality as {
        context?: string;
        learnerPrompt: string;
        deliverable?: { title?: string; description?: string };
        situation?: { character?: string; objective?: string; moments?: Array<{ prompt?: string; choices?: string[]; requiresJustification?: boolean }> };
      };
      if (activity) {
        const situation = activity.type === "situation" ? {
          character: modality.situation?.character ?? "",
          objective: modality.situation?.objective ?? "",
          moments: (modality.situation?.moments ?? []).map((moment) => ({
            id: crypto.randomUUID(),
            prompt: moment.prompt ?? "",
            choices: moment.choices ?? [],
            freeTalk: (moment.choices ?? []).length === 0,
            requiresJustification: moment.requiresJustification !== false,
          })),
          variants: activity.situation?.variants ?? [],
          mode: activity.situation?.mode ?? activity.mode,
        } : activity.situation;
        updateActivity(key, { ...activity, learnerPrompt: modality.learnerPrompt, situation });
      } else if (methodId === "case_study") {
        const current = configOf("case_study");
        writeConfig(methodId, { caseStudy: { context: modality.context ?? "", learnerPrompt: modality.learnerPrompt, materials: current?.caseStudy?.materials, characterName: current?.caseStudy?.characterName } });
      } else if (methodId === "video" || methodId === "dictation") {
        setInstruction(methodId, modality.learnerPrompt.trim());
      } else {
        const frame = modality.context?.trim();
        setInstruction(methodId, frame ? `${frame}\n\n${modality.learnerPrompt}` : modality.learnerPrompt);
      }
      const title = modality.deliverable?.title?.trim() ?? "";
      if (title && methodId !== "qcm") {
        const practice = practiceOf(key);
        const format: DeliverableFormat = methodId === "video" ? "video" : methodId === "pdf_upload" ? "file" : "text";
        const current = practice.deliverables[0];
        const deliverables = current
          ? [{ ...current, title, description: modality.deliverable?.description?.trim() || current.description, format }, ...practice.deliverables.slice(1)]
          : [{ id: crypto.randomUUID(), title, description: modality.deliverable?.description?.trim() ?? "", format }];
        setPractice(key, { ...practice, deliverables });
      }
    } catch {
      setModalityError("Création impossible");
    } finally {
      setGeneratingKey(null);
    }
  };

  const rows: Array<{ key: string; method: (typeof METHODS)[number]; activity?: PlaygroundActivity }> = methods.flatMap((id) => {
    const method = METHODS.find((item) => item.id === id);
    if (!method) return [];
    if (id !== "playground") return [{ key: id, method }];
    const config = configOf("playground");
    const activities = listPlaygroundActivities(config?.playground);
    if (!config?.playground?.activities?.length) return [{ key: "playground", method, activity: activities[0] }];
    return activities.map((activity) => ({ key: activityExamKey(activity), method: { ...method, title: playgroundSubtitle(activity.type) }, activity }));
  });

  const selectedExpert = validators.find((validator) => validator.id === expertId);
  const expertName = selectedExpert ? (selectedExpert.full_name || [selectedExpert.first_name, selectedExpert.last_name].filter(Boolean).join(" ") || "Expert") : "";
  const toReview = (id: string) => (configOf(id)?.quiz?.questions ?? []).filter((question) => question.reviewStatus !== "reviewed").length;

  return (
    <div className="space-y-5">
      {variant === "cards" ? (
        <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
          <h2 className="text-lg font-semibold">Comment le candidat le prouve</h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {rows.map(({ key, method, activity }) => {
              const config = configOf(method.id);
              const instruction = instructionOf(config);
              const linked = practiceOf(key).criteria;
              const numbers = linked.map((link) => titled.findIndex((item) => item.id === link.criterionId) + 1).filter((number) => number > 0);
              const pending = method.id === "qcm" ? toReview(method.id) : 0;
              const ready = activity ? playgroundCardStatus(activity, linked.length) === "✓ Prête" : linked.length > 0 && (method.id === "qcm" ? (config?.quiz?.questions.length ?? 0) > 0 && pending === 0 : instruction.trim().length >= 40);
              const status = activity ? playgroundCardStatus(activity, linked.length) : ready ? "✓ Prête" : pending ? `${pending} question${pending > 1 ? "s" : ""} à relire` : "Consigne à compléter";
              const Icon = method.icon;
              const minutes = builder.exam.durationMin ? `${builder.exam.durationMin} min` : null;
              const facts = (method.id === "qcm"
                ? [`${config?.quiz?.questions.length ?? 0} questions`, `Seuil ${config?.quiz?.passingScorePercent ?? 80} %`, minutes]
                : [activity ? playgroundSubtitle(activity.type).replace("Playground · ", "") : practiceOf(key).deliverables[0]?.title || "Texte", minutes, activity?.mode === "training" ? "Entraînement" : activity?.mode === "certification" ? "Certification" : null, formatCriterionNumbers(numbers)]
              ).filter((fact): fact is string => Boolean(fact));
              return (
                <article key={key} className="rounded-3xl border border-[#1A2340] bg-[#0B1122] p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Icon className="h-4 w-4 text-[#B9B2FF]" />
                    <p className="font-medium">{method.title}</p>
                  </div>
                  <p className="text-sm text-[#A9B0CC]">{formatCriterionNumbers(numbers)}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-[#8C94B2]">{instruction || "Consigne à rédiger."}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {facts.map((fact) => <span key={fact} className="rounded-full border border-[#26304F] px-2 py-1 text-xs text-[#A9B0CC]">{fact}</span>)}
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className={`text-xs ${status.startsWith("✓") ? "text-[#3DDCAB]" : "text-[#F2C15A]"}`}>{status}</span>
                    <button type="button" className="text-sm text-[#B9B2FF]" onClick={() => onOpen(key)}>{pending ? "Relire" : "Modifier"}</button>
                  </div>
                </article>
              );
            })}
          </div>
          <button type="button" className="mt-4 text-sm text-[#B9B2FF]" onClick={() => setAdding(true)}>+ Ajouter une épreuve</button>
        </section>
      ) : null}
      {variant === "full" || adding ? (
      <section className={`${adding ? "fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-[#0A0F1E] p-5 lg:w-[560px] lg:border-l lg:border-[#1A2340]" : "rounded-[28px] border border-[#1A2340] bg-[#111831] p-5"}`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{adding ? "Ajouter une épreuve" : "Méthodes"}</h2>
          {adding ? <button type="button" className="text-sm text-[#A9B0CC]" onClick={() => setAdding(false)}>Fermer</button> : null}
        </div>
        <p className="mb-4 text-sm text-[#8C94B2]">Plusieurs méthodes peuvent composer l&apos;épreuve.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {METHODS.map((method) => {
            const checked = methods.includes(method.id);
            const Icon = method.icon;
            return (
              <button
                key={method.id}
                type="button"
                onClick={() => { if (method.id === "playground") { setPickingActivity(true); setAdding(false); return; } toggle(method.id, !checked); if (!checked) setAdding(false); }}
                className={`rounded-3xl border p-4 text-left ${checked ? "border-[#6E5BFF] bg-[#241C4A]" : "border-[#1A2340] bg-[#0B1122]"}`}
              >
                <Icon className="mb-3 h-5 w-5 text-[#B9B2FF]" />
                <p className="font-medium">{method.title}</p>
                <p className="text-sm text-[#8C94B2]">{method.phrase}</p>
              </button>
            );
          })}
        </div>
      </section>
      ) : null}

      {pickingActivity ? (
        <section className="fixed inset-y-0 right-0 z-50 w-full space-y-3 overflow-y-auto bg-[#0A0F1E] p-5 lg:w-[560px] lg:border-l lg:border-[#1A2340]">
          <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Type d&apos;activité</h2><button type="button" className="text-sm text-[#A9B0CC]" onClick={() => setPickingActivity(false)}>Fermer</button></div>
          {([
            ["sandbox", "Bac à sable IA", "Consigne, essais et correction IA. Réservé aux badges sur l'usage de l'IA."],
            ["situation", "Mise en situation", "L'IA joue un personnage. Adapté aux compétences relationnelles."],
            ["module", "Module interactif (ZIP)", "SCORM, xAPI, cmi5 ou HTML5 fourni par l'admin."],
          ] as const).map(([type, title, phrase]) => (
            <button key={type} type="button" onClick={() => addPlayground(type)} className="block w-full rounded-3xl border border-[#1A2340] bg-[#111831] p-4 text-left">
              <p className="font-medium">{title}</p>
              <p className="mt-1 text-sm text-[#8C94B2]">{phrase}</p>
            </button>
          ))}
        </section>
      ) : null}

      {rows
        .sort((a, b) => (a.key === openId ? -1 : b.key === openId ? 1 : 0))
        .map(({ key, method, activity }) => {
        const config = configOf(method.id);
        const custom = builder.exam.promptCustom[key] === true;
        const instruction = activity?.learnerPrompt ?? instructionOf(config);
        const linked = practiceOf(key).criteria;
        const numbers = linked.map((link) => titled.findIndex((item) => item.id === link.criterionId) + 1).filter((number) => number > 0);
        const criterionLabel = formatCriterionNumbers(numbers);
        const complete = linked.length > 0 && (method.id === "qcm"
          ? (config?.quiz?.questions.length ?? 0) > 0 && (config?.quiz?.questions ?? []).every((question) => question.reviewStatus === "reviewed")
          : Boolean(instruction.trim()));
        if (variant === "cards" && key !== openId) return null;
        if (key !== openId) {
          const Icon = method.icon;
          return (
            <button key={key} type="button" onClick={() => onOpen(key)} className="flex w-full items-center gap-3 rounded-3xl border border-[#1A2340] bg-[#111831] px-4 py-3 text-left">
              <Icon className="h-4 w-4 text-[#B9B2FF]" />
              <span className="font-medium">{method.title}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-[#8C94B2]">
                {criterionLabel} · {activity ? playgroundSubtitle(activity.type) : methodSummary(method.id, config, practiceOf(key).deliverables)}
              </span>
              <span className={`text-xs ${complete ? "text-[#3DDCAB]" : "text-[#F2C15A]"}`}>{complete ? "✓ Complet" : "À compléter"}</span>
              <span className="text-sm text-[#A9B0CC]">Ouvrir ⌄</span>
            </button>
          );
        }
        const editor = (
          <section key={key} className={variant === "cards" ? "space-y-4 p-5" : "space-y-4 rounded-[28px] border border-[#6E5BFF]/50 bg-[#111831] p-5"}>
            <div className={`flex items-center justify-between gap-3 ${variant === "cards" ? "sticky top-0 z-10 -mx-5 mb-1 bg-[#0A0F1E] px-5 py-3" : ""}`}>
              <h2 className="text-lg font-semibold">{method.title}</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-full px-3 py-1 text-sm font-semibold"
                  style={{ background: "#EEF0F7", color: "#0A0F1E" }}
                  onClick={() => { setLearnerSeconds(null); setAsLearner(true); }}
                >
                  Voir comme l&apos;apprenant
                </button>
                <button type="button" className="rounded-full border border-[#26304F] px-3 py-1 text-sm text-[#EEF0F7]" onClick={() => onOpen(null)}>{variant === "cards" ? "Fermer" : "Replier"}</button>
              </div>
            </div>
            {asLearner && typeof document !== "undefined" ? createPortal((() => {
              const learnerMethod: BadgeMethodConfig = activity
                ? {
                    ...(config ?? defaultMethodConfig("playground")),
                    methodId: "playground",
                    evaluationPrompt: config?.evaluationPrompt ?? "",
                    playground: { learnerPrompt: activity.learnerPrompt, maxAttempts: activity.maxAttempts, activities: [activity] },
                  }
                : { ...(config ?? defaultMethodConfig(method.id)), methodId: method.id };
              const learnerMeta: PassageMeta = {
                level: Number(level) || 1,
                competencies: [],
                criteria: titled.map((item) => ({ label: item.label, outcome: item.expectedOutcome ?? "" })),
                attempts: builder.exam.attempts,
                retryDelayDays: builder.exam.retryDelayDays,
                reviewSlaDays: builder.exam.reviewSlaDays,
                accommodations: builder.exam.accommodations,
                integrityCheck: false,
                integrityToleranceSec: builder.exam.integrityToleranceSec,
                integrityToleratedLeaves: builder.exam.integrityToleratedLeaves,
                integrityConsequence: "note",
              };
              return (
                <PassageFrame
                  badgeName={name || "Open Badge"}
                  level={learnerMeta.level}
                  steps={[{ id: key, label: method.title, blurb: "", minutes: examMinutes(method.id), done: false, current: true }]}
                  secondsLeft={learnerSeconds}
                  savedLabel="Aperçu"
                  preview
                  onQuit={() => setAsLearner(false)}
                  integrityQuit={false}
                >
                  <PassageExamHost
                    badgeClassId="preview"
                    userId="preview"
                    method={learnerMethod}
                    meta={learnerMeta}
                    preview
                    accommodation={false}
                    seed="apercu"
                    onTick={setLearnerSeconds}
                    onSubmit={() => setAsLearner(false)}
                    onLeave={() => setAsLearner(false)}
                  />
                </PassageFrame>
              );
            })(), document.body) : null}
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm text-[#A9B0CC]">Critères évalués par cette épreuve</p>
                <button type="button" className="text-sm text-[#B9B2FF]" onClick={() => {
                  const uncovered = titled.filter((item) => {
                    const holders = rows.map((row) => row.key).filter((examId) => (builder.exam.practices[examId]?.criteria ?? []).some((link) => link.criterionId === item.id));
                    const practical = holders.filter((examId) => examId !== "qcm");
                    return method.id === "qcm" ? holders.length === 0 : practical.length === 0;
                  });
                  const pick = [...new Set([...checkedIds(key), ...(uncovered.length ? uncovered : titled).map((item) => item.id)])];
                  const weights = resolvedWeights(pick, Object.fromEntries(practiceOf(key).criteria.map((link) => [link.criterionId, link.weight])));
                  setPractice(key, { ...practiceOf(key), criteria: pick.map((id) => ({ criterionId: id, weight: weights[id] ?? 0 })) });
                }}>✦ Suggérer</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {titled.map((item, index) => {
                  const on = linked.some((link) => link.criterionId === item.id);
                  return (
                    <button key={item.id} type="button" onClick={() => toggleCriterion(key, item.id)} className={`rounded-full px-3 py-1 text-sm ${on ? "bg-[#6E5BFF] text-white" : "border border-[#26304F]"}`}>
                      {index + 1}. {item.label}
                    </button>
                  );
                })}
              </div>
              <button type="button" disabled={deducing || !instruction.trim()} onClick={() => void deduceCriteria(method.id, instruction)} className="mt-3 text-sm text-[#B9B2FF] disabled:opacity-50">✦ Déduire les critères de cette épreuve</button>
              {deduced.length > 0 ? (
                <div className="mt-3 rounded-2xl border border-[#F2C15A]/40 p-3 text-sm">
                  <p className="mb-2 text-[#F2C15A]">Ajouter ces critères à l&apos;étape Critères d&apos;évaluation ?</p>
                  <ul className="mb-3 space-y-1">{deduced.map((item) => <li key={item.label}>{item.label}</li>)}</ul>
                  <button type="button" className="bb-white mr-3 rounded-full px-3 py-1" onClick={() => { onAddCriteria(deduced); setDeduced([]); }}>Ajouter</button>
                  <button type="button" className="text-[#A9B0CC]" onClick={() => setDeduced([])}>Annuler</button>
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[#8C94B2]">{linked.length === 0 ? "Choisissez les critères, puis créez le contenu." : "Le contenu généré reste modifiable."}</p>
              <button
                type="button"
                disabled={generating || generatingKey === key || linked.length === 0 || activity?.type === "module"}
                onClick={() => void createWithAi(key, method.id, activity)}
                className="bb-white rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50"
                style={{ background: "#EEF0F7", color: "#0A0F1E" }}
              >
                {generatingKey === key || (method.id === "qcm" && generating) ? "Création…" : instruction.trim() ? "Recréer avec l'IA" : "Créer avec l'IA"}
              </button>
            </div>
            {activity?.type === "module" ? <p className="text-xs text-[#8C94B2]">Le module interactif s&apos;importe. L&apos;IA ne le rédige pas.</p> : null}
            {modalityError ? <p className="text-sm text-[#F2C15A]">{modalityError}</p> : null}
            <div>
              <p className="mb-2 text-sm text-[#A9B0CC]">{method.id === "video" || method.id === "dictation" ? "La question" : "1. Ce que voit le candidat"}</p>
              {method.id === "case_study" ? (
                <>
                  <input
                    value={config?.caseStudy?.characterName ?? ""}
                    onChange={(event) => writeConfig(method.id, { caseStudy: { context: config?.caseStudy?.context ?? "", learnerPrompt: config?.caseStudy?.learnerPrompt ?? "", materials: config?.caseStudy?.materials, characterName: event.target.value } })}
                    placeholder="Prénom du personnage, un seul"
                    className={`${fieldClass()} mb-2`}
                  />
                  <textarea
                    value={config?.caseStudy?.context ?? ""}
                    onChange={(event) => writeConfig(method.id, { caseStudy: { context: event.target.value, learnerPrompt: config?.caseStudy?.learnerPrompt ?? "", materials: config?.caseStudy?.materials, characterName: config?.caseStudy?.characterName } })}
                    placeholder="Contexte, facultatif"
                    rows={2}
                    className={`${fieldClass()} mb-2`}
                  />
                  <CaseDossier
                    materials={config?.caseStudy?.materials ?? []}
                    prompt={anthropicPrompt}
                    briefing={briefing}
                    onMaterials={(materials) => writeConfig("case_study", { caseStudy: { context: config?.caseStudy?.context ?? "", learnerPrompt: config?.caseStudy?.learnerPrompt ?? "", materials, characterName: config?.caseStudy?.characterName } })}
                    onPrompt={() => {
                      const characterName = config?.caseStudy?.characterName?.trim() ?? "";
                      if (!characterName) {
                        setModalityError("Indiquez d'abord le prénom du personnage.");
                        return;
                      }
                      const selected = titled.filter((item) => checkedIds(key).includes(item.id));
                      if (selected.length === 0) {
                        setModalityError("Choisissez au moins un critère.");
                        return;
                      }
                      setBriefing(true);
                      setModalityError("");
                      void fetch("/api/super-admin/open-badges/generate-modality", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          purpose: "anthropic",
                          badgeName: name,
                          level,
                          characterName,
                          criteria: selected.map((item) => ({ label: item.label, expectedOutcome: item.expectedOutcome ?? "" })),
                        }),
                      })
                        .then((response) => response.json().then((payload) => ({ ok: response.ok, payload })))
                        .then(({ ok, payload }) => {
                          if (!ok || !payload.prompt) {
                            setModalityError(payload.error ?? "Le prompt n'a pas abouti.");
                            return;
                          }
                          setAnthropicPrompt(payload.prompt);
                        })
                        .catch(() => setModalityError("Le prompt n'a pas abouti."))
                        .finally(() => setBriefing(false));
                    }}
                  />
                </>
              ) : null}
              {activity ? <PlaygroundActivityFields activity={activity} criteria={titled} onChange={(next) => updateActivity(key, next)} /> : null}
              <textarea
                value={instruction}
                onChange={(event) => {
                  if (activity) updateActivity(key, { ...activity, learnerPrompt: event.target.value });
                  else setInstruction(method.id, event.target.value);
                }}
                placeholder={method.id === "video" || method.id === "dictation" ? "Une seule question, par exemple : Comment ajusteriez-vous cet atelier ?" : "Consigne obligatoire, en deux phrases au moins"}
                rows={3}
                className={fieldClass()}
              />
            </div>
            {method.id === "qcm" ? (
              <p className="text-sm text-[#8C94B2]">Le questionnaire n&apos;a pas de livrable : le résultat suffit.</p>
            ) : (
              <DeliverableList
                items={practiceOf(key).deliverables}
                onChange={(deliverables) => setPractice(key, { ...practiceOf(key), deliverables })}
              />
            )}
            <MethodRules method={method.id} config={config} onChange={(patch) => writeConfig(method.id, patch)} />
            {method.id === "qcm" && config?.quiz ? (
              <>
              {(config.quiz.questions ?? []).some((question) => question.reviewStatus !== "reviewed") ? (
                <button type="button" className="bb-white rounded-full px-4 py-2 text-sm font-semibold" onClick={() => writeConfig("qcm", { quiz: { ...config.quiz!, questions: config.quiz!.questions.map((question) => ({ ...question, reviewStatus: "reviewed" as const })) } })}>Questions relues</button>
              ) : null}
              <QuizBank
                name={name}
                level={level}
                criteria={titled.filter((item) => linked.some((link) => link.criterionId === item.id))}
                config={config}
                generating={generating}
                error={quizError}
                onChange={(patch) => writeConfig("qcm", patch)}
                onGenerate={() => void generateQuestions(false)}
                onMore={() => void generateQuestions(true)}
                onScratch={() => writeConfig("qcm", {
                  quiz: {
                    ...(config.quiz ?? { questions: [] }),
                    generationMode: "scratch",
                    questions: config.quiz?.questions?.length ? config.quiz.questions : [createEmptyQcmQuestion()],
                  },
                })}
              />
              </>
            ) : null}
            <div>
              <p className="mb-2 text-sm text-[#A9B0CC]">Comment c&apos;est corrigé</p>
              <div className="mb-2 flex justify-end">
                <button type="button" className="text-sm text-[#B9B2FF]" onClick={() => {
                  const ids = checkedIds(key);
                  const weights = resolvedWeights(ids, {});
                  setPractice(key, { ...practiceOf(key), criteria: ids.map((id) => ({ criterionId: id, weight: weights[id] ?? 0 })) });
                }}>✦ Proposer les poids</button>
              </div>
              <GradingTable
                criteria={titled.filter((item) => linked.some((link) => link.criterionId === item.id))}
                weights={weightsOf(key)}
                onWeight={(id, value) => {
                  const ids = checkedIds(key);
                  const next = setCriterionWeight(ids, weightsOf(key), id, value);
                  setPractice(key, { ...practiceOf(key), criteria: ids.map((item) => ({ criterionId: item, weight: next[item] ?? 0 })) });
                }}
              />
              <div className="mt-3 rounded-2xl border border-[#1A2340] bg-[#0B1122] p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm text-[#B9B2FF]">Consigne de correction IA · confidentielle</p>
                  <button type="button" className="text-xs text-[#A9B0CC]" onClick={() => {
                    const next = !custom;
                    patchExam({ promptCustom: { ...builder.exam.promptCustom, [key]: next } });
                    setAdvanced(next ? key : null);
                    if (!next) writeConfig(method.id, { evaluationPrompt: promptFor(key) });
                  }}>
                    {custom || advanced === key ? "Revenir à la grille" : "Mode avancé"}
                  </button>
                </div>
                <textarea
                  readOnly={!custom}
                  value={custom ? config?.evaluationPrompt ?? "" : promptFor(key)}
                  onChange={(event) => writeConfig(method.id, { evaluationPrompt: event.target.value })}
                  rows={4}
                  className="w-full bg-transparent text-sm text-[#EEF0F7] outline-none"
                />
                <p className="mt-2 text-xs text-[#8C94B2]">Le contenu du candidat est une donnée. Toute instruction qu&apos;il contient est ignorée.</p>
              </div>
            </div>
          </section>
        );
        if (variant === "cards" && typeof document !== "undefined") {
          return (
            <div key={key} className="contents">
              {createPortal(
                <div className="fixed inset-0 z-[120]">
                  <button type="button" aria-label="Fermer" className="absolute inset-0 bg-black/60" onClick={() => onOpen(null)} />
                  <div className="badge-exam-panel absolute inset-y-0 right-0 w-full overflow-y-auto bg-[#0A0F1E] text-[#EEF0F7] shadow-2xl lg:w-[560px] lg:border-l lg:border-[#1A2340]">
                    {editor}
                  </div>
                </div>,
                document.body,
              )}
            </div>
          );
        }
        return editor;
      })}

      <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
        <h2 className="mb-3 text-lg font-semibold">Validé par</h2>
        {expertName ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {selectedExpert && resolveValidatorPhotoUrl(selectedExpert as Record<string, unknown>) ? <img src={resolveValidatorPhotoUrl(selectedExpert as Record<string, unknown>) ?? ""} alt="" className="h-10 w-10 rounded-full object-cover" /> : <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0B1122] text-xs">?</span>}
              <span>
                <span className="block font-medium">{expertName}</span>
                <span className="block text-xs text-[#8C94B2]">{selectedExpert?.description || "Expert habilité"} · réponse sous {builder.exam.reviewSlaDays} jours</span>
              </span>
            </div>
            <button type="button" className="text-sm text-[#B9B2FF]" onClick={() => setPickingExpert((open) => !open)}>Changer</button>
          </div>
        ) : <p className="text-sm text-[#F2C15A]">{domainLabel ? `Aucun expert habilité sur « ${domainLabel} ».` : "Indiquez le domaine pour proposer un expert habilité."}</p>}
        {pickingExpert ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {validators.map((validator) => {
              const photo = resolveValidatorPhotoUrl(validator as Record<string, unknown>);
              const label = validator.full_name || [validator.first_name, validator.last_name].filter(Boolean).join(" ") || "Expert";
              return (
                <button key={validator.id} type="button" onClick={() => { onExpert(validator.id); setPickingExpert(false); }} className={`flex items-center gap-3 rounded-3xl border p-3 text-left ${expertId === validator.id ? "border-[#6E5BFF] bg-[#241C4A]" : "border-[#1A2340]"}`}>
                  {photo ? <img src={photo} alt="" className="h-10 w-10 rounded-full object-cover" /> : <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0B1122] text-xs">?</span>}
                  <span className="font-medium">{label}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </section>

      <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
        <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => setRulesOpen((open) => !open)}>
          <span>
            <span className="block text-lg font-semibold">Réglages avancés</span>
            <span className="mt-1 block text-sm text-[#8C94B2]">{builder.exam.attempts} tentatives · {builder.exam.retryDelayDays} jours entre deux essais · aménagements et contrôle d&apos;intégrité activés · poids et consignes IA automatiques</span>
          </span>
          <span className="text-sm text-[#A9B0CC]">{rulesOpen ? "Masquer" : "Afficher ⌄"}</span>
        </button>
        {rulesOpen ? (
        <div className="mt-4">
        <h2 className="text-lg font-semibold">Règles de l&apos;épreuve</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-[#A9B0CC] sm:col-span-2">
            <span className="flex items-center gap-2">
              <input type="checkbox" checked={builder.exam.requirePractice} onChange={(event) => patchExam({ requirePractice: event.target.checked })} />
              Exiger une mise en pratique
            </span>
            <span className="mt-1 block text-xs text-[#8C94B2]">Un critère seulement couvert par le questionnaire n&apos;est pas validé si cette option est cochée.</span>
          </label>
          <label className="text-sm text-[#A9B0CC]">
            Réussite
            <p className="mt-1 text-xs text-[#8C94B2]">Chaque épreuve doit être réussie. Le badge est obtenu quand toutes le sont.</p>
            <select value={builder.exam.passMode} onChange={(event) => patchExam({ passMode: event.target.value === "threshold" ? "threshold" : "all" })} className={`${fieldClass()} mt-1`}>
              <option value="all">Tous les critères validés</option>
              <option value="threshold">Un seuil de critères</option>
            </select>
          </label>
          {builder.exam.passMode === "threshold" ? (
            <label className="text-sm text-[#A9B0CC]">
              Critères exigés
              <input type="number" min={1} max={Math.max(1, titled.length)} value={builder.exam.passCount} onChange={(event) => patchExam({ passCount: Number(event.target.value) })} className={`${fieldClass()} mt-1`} />
            </label>
          ) : null}
          <label className="text-sm text-[#A9B0CC]">
            Tentatives
            <input type="number" min={1} value={builder.exam.attempts} onChange={(event) => patchExam({ attempts: Number(event.target.value) })} className={`${fieldClass()} mt-1`} />
          </label>
          <label className="text-sm text-[#A9B0CC]">
            Délai entre deux essais (jours)
            <input type="number" min={0} value={builder.exam.retryDelayDays} onChange={(event) => patchExam({ retryDelayDays: Number(event.target.value) })} className={`${fieldClass()} mt-1`} />
          </label>
          <label className="text-sm text-[#A9B0CC]">
            Durée estimée (minutes)
            <input type="number" min={0} value={builder.exam.durationMin ?? ""} onChange={(event) => patchExam({ durationMin: event.target.value ? Number(event.target.value) : null })} className={`${fieldClass()} mt-1`} />
          </label>
          <label className="text-sm text-[#A9B0CC]">
            Délai de correction (jours ouvrés)
            <input type="number" min={1} value={builder.exam.reviewSlaDays} onChange={(event) => patchExam({ reviewSlaDays: Number(event.target.value) })} className={`${fieldClass()} mt-1`} />
          </label>
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <Toggle label="Aménagements possibles" hint="Temps majoré d'un tiers, ou réponse orale à la place de l'écrit, sur demande avant de commencer." checked={builder.exam.accommodations} onChange={(value) => patchExam({ accommodations: value })} />
          <Toggle label="Pré-contrôle par l'IA" hint="L'IA prépare la relecture. L'expert décide." checked={aiPrecheck} onChange={onAiPrecheck} />
          <Toggle label="Contrôle d'intégrité" hint="Questionnaire et étude de cas. La vidéo, l'oral et le Playground sont seulement notés." checked={builder.exam.integrityCheck} onChange={(value) => patchExam({ integrityCheck: value })} />
          {builder.exam.integrityCheck ? (
            <div className="grid gap-3 pl-1 sm:grid-cols-3">
              <label className="text-sm text-[#A9B0CC]">
                Tolérance (secondes)
                <input type="number" min={0} max={5} value={builder.exam.integrityToleranceSec} onChange={(event) => patchExam({ integrityToleranceSec: Math.min(5, Math.max(0, Number(event.target.value) || 0)) })} className={`${fieldClass()} mt-1`} />
              </label>
              <label className="text-sm text-[#A9B0CC]">
                Sorties tolérées
                <select value={builder.exam.integrityToleratedLeaves} onChange={(event) => patchExam({ integrityToleratedLeaves: event.target.value === "0" ? 0 : 1 })} className={`${fieldClass()} mt-1`}>
                  <option value={1}>1 sortie courte</option>
                  <option value={0}>Aucune</option>
                </select>
              </label>
              <label className="text-sm text-[#A9B0CC]">
                Conséquence
                <select value={builder.exam.integrityConsequence} onChange={(event) => patchExam({ integrityConsequence: event.target.value === "note" ? "note" : "attempt" })} className={`${fieldClass()} mt-1`}>
                  <option value="attempt">L'épreuve s'arrête</option>
                  <option value="note">Signalement seul</option>
                </select>
              </label>
            </div>
          ) : null}
          <Toggle label="Livrables visibles par les entreprises connectées" hint="Uniquement si le titulaire l'autorise." checked={builder.exam.deliverablesVisible} onChange={(value) => patchExam({ deliverablesVisible: value })} />
        </div>
        </div>
        ) : null}
      </section>
    </div>
  );
}

function formatCriterionNumbers(numbers: number[]): string {
  if (numbers.length === 0) return "Aucun critère";
  if (numbers.length === 1) return `Critère ${numbers[0]}`;
  const last = numbers[numbers.length - 1];
  return `Critères ${numbers.slice(0, -1).join(", ")} et ${last}`;
}

function methodSummary(id: string, config: BadgeMethodConfig | undefined, deliverables: BadgeDeliverableDraft[]): string {
  if (id === "qcm") {
    const asked = config?.quiz?.questionCount ?? 5;
    const bank = config?.quiz?.questions.length ?? 0;
    return `${bank} questions, ${asked} posées · seuil ${config?.quiz?.passingScorePercent ?? 80} %`;
  }
  const titles = deliverables.map((item) => item.title.trim()).filter(Boolean);
  const render = titles.length > 0 ? titles.join(", ") : "consigne du candidat";
  if (id === "playground") return `${render} · ${config?.playground?.maxAttempts ?? 2} essais`;
  return render;
}

function DeliverableList({
  items,
  onChange,
}: {
  items: BadgeDeliverableDraft[];
  onChange: (next: BadgeDeliverableDraft[]) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm text-[#A9B0CC]">2. Ce qu&apos;il rend</p>
      <p className="mb-2 text-xs text-[#8C94B2]">Visibles par les entreprises connectées.</p>
      {items.map((item) => (
        <div key={item.id} className="mb-2 grid gap-2 rounded-2xl border border-[#1A2340] p-3">
          <div className="flex gap-2">
            <input value={item.title} onChange={(event) => onChange(items.map((row) => row.id === item.id ? { ...row, title: event.target.value } : row))} placeholder="Titre" className={fieldClass()} />
            <button type="button" aria-label="Retirer le livrable" onClick={() => onChange(items.filter((row) => row.id !== item.id))}><X className="h-4 w-4" /></button>
          </div>
          <input value={item.description} onChange={(event) => onChange(items.map((row) => row.id === item.id ? { ...row, description: event.target.value } : row))} placeholder="Description" className={fieldClass()} />
          <div className="flex flex-wrap gap-2">
            {FORMATS.map((format) => (
              <button key={format.id} type="button" onClick={() => onChange(items.map((row) => row.id === item.id ? { ...row, format: format.id } : row))} className={`rounded-full px-3 py-1 text-xs ${item.format === format.id ? "bg-[#6E5BFF] text-white" : "border border-[#26304F]"}`}>{format.label}</button>
            ))}
          </div>
        </div>
      ))}
      <button type="button" className="inline-flex items-center gap-2 rounded-full border border-[#26304F] px-4 py-2 text-sm" onClick={() => onChange([...items, { id: crypto.randomUUID(), title: "", description: "", format: "text" }])}>
        <Plus className="h-4 w-4" />
        Ajouter un livrable
      </button>
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex w-full items-start justify-between gap-4 rounded-2xl border border-[#1A2340] px-3 py-3 text-left">
      <span>
        <span className="block font-medium">{label}</span>
        <span className="block text-xs text-[#8C94B2]">{hint}</span>
      </span>
      <span className={`mt-1 h-6 w-11 shrink-0 rounded-full p-1 ${checked ? "bg-[#6E5BFF]" : "bg-[#26304F]"}`}>
        <span className={`block h-4 w-4 rounded-full bg-white transition ${checked ? "translate-x-5" : ""}`} />
      </span>
    </button>
  );
}

function GradingTable({
  criteria,
  weights,
  onWeight,
}: {
  criteria: Criterion[];
  weights: Record<string, number>;
  onWeight: (id: string, value: number) => void;
}) {
  const total = criteria.reduce((sum, item) => sum + (weights[item.id] ?? 0), 0);
  return (
    <div className="overflow-hidden rounded-2xl border border-[#1A2340]">
      <div className="grid grid-cols-[1.2fr_1.4fr_90px] gap-2 bg-[#0B1122] px-3 py-2 text-xs text-[#8C94B2]">
        <span>Critère</span>
        <span>Attendu pour valider</span>
        <span>Poids</span>
      </div>
      {criteria.length === 0 ? <p className="px-3 py-3 text-sm text-[#8C94B2]">Ajoutez des critères à l&apos;étape précédente.</p> : null}
      {criteria.map((item) => (
        <div key={item.id} className="grid grid-cols-[1.2fr_1.4fr_90px] gap-2 border-t border-[#1A2340] px-3 py-2 text-sm">
          <span>{item.label}</span>
          <span className="text-[#A9B0CC]">{item.expectedOutcome || "—"}</span>
          <input type="number" min={0} max={100} value={weights[item.id] ?? 0} onChange={(event) => onWeight(item.id, Number(event.target.value))} className="rounded-xl border border-[#26304F] bg-[#0B1122] px-2 py-1" />
        </div>
      ))}
      <p className={`px-3 py-2 text-xs ${total === 100 ? "text-[#3DDCAB]" : "text-[#F2C15A]"}`}>Total {total} %</p>
    </div>
  );
}

function MethodRules({
  method,
  config,
  onChange,
}: {
  method: BadgeEvaluationMethodId;
  config: BadgeMethodConfig | undefined;
  onChange: (patch: Partial<BadgeMethodConfig>) => void;
}) {
  if (method === "playground") {
    return (
      <label className="block text-sm text-[#A9B0CC]">
        Nombre d&apos;essais
        <input type="number" min={1} max={5} value={config?.playground?.maxAttempts ?? 2} onChange={(event) => onChange({ playground: { learnerPrompt: config?.playground?.learnerPrompt ?? "", maxAttempts: Number(event.target.value) } })} className={`${fieldClass()} mt-1`} />
      </label>
    );
  }
  if (method === "qcm" && config?.quiz) {
    const bank = config.quiz.questions.length;
    const asked = quizAskedCount(config.quiz);
    const needed = Math.max(1, Math.round((asked * (config.quiz.passingScorePercent ?? 80)) / 100));
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm text-[#A9B0CC]">Banque
          <input type="number" min={asked} value={Math.max(config.quiz.questions.length, asked)} readOnly className={`${fieldClass()} mt-1`} />
        </label>
        <label className="text-sm text-[#A9B0CC]">Questions posées
          <input type="number" min={1} max={Math.max(1, bank)} value={asked} onChange={(event) => {
            const next = Number(event.target.value);
            onChange({ quiz: { ...config.quiz!, questionCount: next, limitDraw: bank > 0 && next < bank, randomDraw: bank > 0 && next < bank } });
          }} className={`${fieldClass()} mt-1`} />
        </label>
        <label className="text-sm text-[#A9B0CC]">Seuil
          <input type="number" min={1} max={100} value={config.quiz.passingScorePercent ?? 80} onChange={(event) => onChange({ quiz: { ...config.quiz!, passingScorePercent: Number(event.target.value) } })} className={`${fieldClass()} mt-1`} />
        </label>
        <p className="sm:col-span-3 text-xs text-[#8C94B2]">{bank > asked ? `${asked} questions tirées parmi ${bank}` : `Les ${asked || bank} questions préparées sont posées.`} {needed} bonnes réponses pour atteindre le seuil.</p>
      </div>
    );
  }
  return <p className="text-xs text-[#8C94B2]">Durée, nombre de prises et format sont annoncés au candidat avec la consigne.</p>;
}

function QuizBank({
  name,
  level,
  criteria = [],
  config,
  generating,
  error,
  onChange,
  onGenerate,
  onMore,
  onScratch,
}: {
  name: string;
  level: string;
  criteria?: Array<{ id: string; label: string }>;
  config: BadgeMethodConfig;
  generating: boolean;
  error: string;
  onChange: (patch: Partial<BadgeMethodConfig>) => void;
  onGenerate: () => void;
  onMore: () => void;
  onScratch: () => void;
}) {
  const questions = config.quiz?.questions ?? [];
  const update = (index: number, patch: Partial<QcmQuestion>) => {
    const next = questions.map((question, questionIndex) => (questionIndex === index ? { ...question, ...patch } : question));
    onChange({ quiz: { ...config.quiz!, questions: next } });
  };
  return (
    <div className="space-y-3">
      <p className="text-sm text-[#A9B0CC]">Questionnaire · {name || "Sans titre"} · niveau {level || "—"}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={generating} onClick={onGenerate} className="rounded-full bg-[#6E5BFF] px-3 py-1 text-sm text-white disabled:opacity-50">✦ Générer avec l&apos;IA</button>
        <button type="button" onClick={onScratch} className="rounded-full border border-[#26304F] px-3 py-1 text-sm">Partir de zéro</button>
        <button type="button" disabled={generating} onClick={onMore} className="rounded-full border border-[#26304F] px-3 py-1 text-sm disabled:opacity-50">Générer 5 de plus</button>
      </div>
      {error ? <p className="text-sm text-[#F2C15A]">{error}</p> : null}
      {questions.map((question, index) => (
        <article key={question.id} className="rounded-2xl border border-[#1A2340] p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs text-[#8C94B2]">Question {index + 1}</span>
            <button type="button" onClick={() => update(index, { reviewStatus: question.reviewStatus === "reviewed" ? "to_review" : "reviewed" })} className={`rounded-full px-2 py-1 text-xs ${question.reviewStatus === "reviewed" ? "text-[#3DDCAB]" : "text-[#F2C15A]"}`}>
              {question.reviewStatus === "reviewed" ? "✓ Relue" : "À relire"}
            </button>
          </div>
          <input value={question.prompt} onChange={(event) => update(index, { prompt: event.target.value })} placeholder="Énoncé" className={`${fieldClass()} mb-2`} />
          <select value={question.criterionId ?? ""} onChange={(event) => update(index, { criterionId: event.target.value })} className={`${fieldClass()} mb-2`}>
            <option value="">Critère évalué</option>
            {criteria.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
          <div className="mb-2 flex gap-2 text-xs">
            <button type="button" onClick={() => update(index, { questionType: "single" })} className={question.questionType !== "multiple" ? "text-[#B9B2FF]" : "text-[#8C94B2]"}>Choix unique</button>
            <button type="button" onClick={() => update(index, { questionType: "multiple" })} className={question.questionType === "multiple" ? "text-[#B9B2FF]" : "text-[#8C94B2]"}>Choix multiples</button>
          </div>
          {(question.choices ?? []).map((choice, choiceIndex) => (
            <label key={choice.id} className="mb-1 flex items-center gap-2 text-sm">
              <input
                type={question.questionType === "multiple" ? "checkbox" : "radio"}
                name={question.id}
                checked={choice.isCorrect}
                onChange={() => {
                  const choices = question.choices.map((item, itemIndex) => ({
                    ...item,
                    isCorrect: question.questionType === "multiple" ? (itemIndex === choiceIndex ? !item.isCorrect : item.isCorrect) : itemIndex === choiceIndex,
                  }));
                  update(index, { choices });
                }}
              />
              <input value={choice.label} onChange={(event) => {
                const choices = question.choices.map((item, itemIndex) => itemIndex === choiceIndex ? { ...item, label: event.target.value } : item);
                update(index, { choices });
              }} className={fieldClass()} />
            </label>
          ))}
        </article>
      ))}
    </div>
  );
}

function CaseDossier({
  materials,
  prompt,
  briefing,
  onMaterials,
  onPrompt,
}: {
  materials: CaseMaterial[];
  prompt: string;
  briefing: boolean;
  onMaterials: (next: CaseMaterial[]) => void;
  onPrompt: () => void;
}) {
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [note, setNote] = useState(false);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");

  const upload = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/super-admin/open-badges/case-material", { method: "POST", body });
      const payload = await response.json();
      if (!response.ok || !payload.url) {
        setError(payload.error ?? "Envoi impossible");
        return;
      }
      onMaterials([...materials, { id: crypto.randomUUID(), name: payload.name, kind: payload.kind === "pdf" ? "pdf" : "file", url: payload.url }]);
    } catch {
      setError("Envoi impossible");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mb-3 space-y-3 rounded-2xl border border-[#1A2340] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[#A9B0CC]">Dossier de l&apos;apprenant</p>
        <button type="button" disabled={briefing} onClick={onPrompt} className="text-sm text-[#B9B2FF] disabled:opacity-50">
          {briefing ? "Rédaction…" : "Prompt pour Anthropic"}
        </button>
      </div>
      <p className="text-xs text-[#8C94B2]">Un seul prénom, celui du champ au-dessus. Le prompt et Claude s&apos;y tiennent. Vous déposez ensuite les PDF, un ZIP ou une note.</p>
      {prompt ? (
        <div>
          <textarea readOnly value={prompt} rows={8} className={fieldClass()} />
          <button type="button" className="mt-2 text-sm text-[#B9B2FF]" onClick={() => void navigator.clipboard.writeText(prompt)}>Copier le prompt</button>
        </div>
      ) : null}
      {materials.map((item) => (
        <div key={item.id} className="flex items-start justify-between gap-3 rounded-xl bg-[#0B1122] px-3 py-2 text-sm">
          <span>
            <span className="block text-[#EEF0F7]">{item.name}</span>
            {item.kind === "note" && item.text ? <span className="mt-1 block whitespace-pre-wrap text-xs text-[#A9B0CC]">{item.text}</span> : null}
            {item.url ? <a href={item.url} target="_blank" rel="noreferrer" className="text-xs text-[#B9B2FF]">Ouvrir</a> : null}
          </span>
          <button type="button" aria-label="Retirer la pièce" onClick={() => onMaterials(materials.filter((row) => row.id !== item.id))}><X className="h-4 w-4" /></button>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <label className="cursor-pointer rounded-full border border-[#26304F] px-3 py-1 text-sm">
          {uploading ? "Envoi…" : "Ajouter un PDF ou un ZIP"}
          <input type="file" accept=".pdf,.zip,.txt,.csv,.png,.jpg,.jpeg,.webp,.docx,application/pdf,application/zip" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = ""; }} />
        </label>
        <button type="button" className="rounded-full border border-[#26304F] px-3 py-1 text-sm" onClick={() => setNote((open) => !open)}>Ajouter une note</button>
      </div>
      {note ? (
        <div className="space-y-2">
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Titre de la note" className={fieldClass()} />
          <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Le texte que l'apprenant lira" rows={4} className={fieldClass()} />
          <button type="button" className="text-sm text-[#B9B2FF]" onClick={() => {
            if (!title.trim() || !text.trim()) return;
            onMaterials([...materials, { id: crypto.randomUUID(), name: title.trim(), kind: "note", text: text.trim() }]);
            setTitle("");
            setText("");
            setNote(false);
          }}>Enregistrer la note</button>
        </div>
      ) : null}
      {error ? <p className="text-sm text-[#F2C15A]">{error}</p> : null}
    </div>
  );
}
