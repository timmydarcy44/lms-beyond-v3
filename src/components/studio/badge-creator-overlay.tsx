"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Braces,
  ClipboardList,
  FileText,
  MessageSquareText,
  Mic,
  Presentation,
  Sparkles,
  X,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { BadgeEvalType, BadgeModalityKey, OpenBadgeSavePayload } from "@/components/super-admin/open-badge-types";
import { useSupabase } from "@/components/providers/supabase-provider";
import { syncOpenBadgeToDatabase } from "@/lib/badges/sync-badge";
import { useCourseBuilder } from "@/hooks/use-course-builder";

type SnapshotTest = { id?: string; title?: string };

type InternalQuizQuestion = {
  type: "multiple_choice" | "true_false" | "fill_in_the_blank";
  question: string;
  options?: [string, string, string, string];
  correctIndex?: number;
  correctBoolean?: boolean;
  answer?: string;
};

export type BadgeCreatorOverlayProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId?: string | null;
  courseTitle?: string;
  courseObjectives: string[];
  onObjectivesChange: (next: string[]) => void;
  onSave: (badge: OpenBadgeSavePayload) => void | Promise<void>;
  complexity?: string;
  onComplexityChange?: (value: string) => void;
  onModalitiesConfigChange?: (config: Record<string, unknown>) => void;
  initialName?: string;
  initialDescription?: string;
  initialImageUrl?: string;
  initialCasePrompt?: string;
  initialAudioNegotiationScenario?: string;
  initialVideoPresentationUrl?: string;
  initialFileUploadInstructions?: string;
  initialAiQaTopic?: string;
};

function modalityKeysToEvaluationType(keys: BadgeModalityKey[]): BadgeEvalType {
  if (keys.includes("qcm")) return "qcm";
  if (keys.includes("case_study")) return "case_study";
  if (keys.includes("oral_ia")) return "audio_negotiation";
  if (keys.includes("technical_json")) return "file_upload";
  return "qcm";
}

function buildModalitiesKeys(args: {
  casePrompt: string;
  oralIa: string;
  fileDepot: string;
}): BadgeModalityKey[] {
  const keys: BadgeModalityKey[] = [];
  // QCM est toujours disponible (quiz interne)
  keys.push("qcm");
  if (args.casePrompt.trim()) keys.push("case_study");
  if (args.oralIa.trim()) keys.push("oral_ia");
  if (args.fileDepot.trim()) keys.push("technical_json");
  if (keys.length === 0) keys.push("qcm");
  return keys;
}

const CARDS = [
  { id: "qcm" as const, title: "QCM", subtitle: "Quiz du builder", icon: ClipboardList },
  { id: "case" as const, title: "Étude de cas IA", subtitle: "Énoncé & consignes", icon: FileText },
  { id: "oral" as const, title: "Audio / Vidéo IA", subtitle: "Retranscription & analyse IA", icon: Mic },
  { id: "video" as const, title: "Présentation", subtitle: "Vidéo & consignes", icon: Presentation },
  { id: "qa_ia" as const, title: "Q&A IA", subtitle: "Dialogue guidé", icon: MessageSquareText },
  { id: "file" as const, title: "Automatisation", subtitle: "Dépôt, critères, livrables", icon: Braces },
];

type ModalityCardId = (typeof CARDS)[number]["id"];

const COMPLEXITIES = ["Débutant", "Acquisition", "Intermédiaire", "Spécialiste", "Expert"] as const;

const CARD_ID_TO_MODALITY_KEY: Record<(typeof CARDS)[number]["id"], BadgeModalityKey | null> = {
  qcm: "qcm",
  case: "case_study",
  oral: "oral_ia",
  video: null,
  qa_ia: null,
  file: "technical_json",
};

/**
 * Overlay plein écran — création Open Badge (`open_badges`).
 * Objectifs = snapshot formation (lecture seule). Cartes modalités sélectionnables (bordure néon).
 */
export function BadgeCreatorOverlay({
  open,
  onOpenChange,
  courseId,
  courseTitle,
  courseObjectives,
  onObjectivesChange,
  onSave,
  complexity,
  onComplexityChange,
  onModalitiesConfigChange,
  initialName = "",
  initialDescription = "",
  initialImageUrl = "",
  initialCasePrompt = "",
  initialAudioNegotiationScenario = "",
  initialVideoPresentationUrl = "",
  initialFileUploadInstructions = "",
  initialAiQaTopic = "",
}: BadgeCreatorOverlayProps) {
  if (!open) return null;

  const resetKey = [
    String(courseId ?? ""),
    initialName,
    initialDescription,
    initialImageUrl,
    initialCasePrompt,
    initialAudioNegotiationScenario,
    initialVideoPresentationUrl,
    initialFileUploadInstructions,
    initialAiQaTopic,
    String(complexity ?? ""),
  ].join("|");

  return (
    <BadgeCreatorOverlayInner
      key={resetKey}
      open={open}
      onOpenChange={onOpenChange}
      courseId={courseId}
      courseTitle={courseTitle}
      courseObjectives={courseObjectives}
      onObjectivesChange={onObjectivesChange}
      onSave={onSave}
      complexity={complexity}
      onComplexityChange={onComplexityChange}
      onModalitiesConfigChange={onModalitiesConfigChange}
      initialName={initialName}
      initialDescription={initialDescription}
      initialImageUrl={initialImageUrl}
      initialCasePrompt={initialCasePrompt}
      initialAudioNegotiationScenario={initialAudioNegotiationScenario}
      initialVideoPresentationUrl={initialVideoPresentationUrl}
      initialFileUploadInstructions={initialFileUploadInstructions}
      initialAiQaTopic={initialAiQaTopic}
    />
  );
}

function BadgeCreatorOverlayInner({
  onOpenChange,
  courseId,
  courseTitle,
  courseObjectives,
  onObjectivesChange,
  onSave,
  complexity,
  onComplexityChange,
  onModalitiesConfigChange,
  initialName = "",
  initialDescription = "",
  initialImageUrl = "",
  initialCasePrompt = "",
  initialAudioNegotiationScenario = "",
  initialVideoPresentationUrl = "",
  initialFileUploadInstructions = "",
  initialAiQaTopic = "",
}: BadgeCreatorOverlayProps) {
  const supabase = useSupabase();
  const [title, setTitle] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [internalQuiz, setInternalQuiz] = useState<InternalQuizQuestion[]>([]);
  const [casePrompt, setCasePrompt] = useState(initialCasePrompt);
  const [oralIa, setOralIa] = useState(initialAudioNegotiationScenario);
  const [videoInstr, setVideoInstr] = useState(initialVideoPresentationUrl);
  const [qaIa, setQaIa] = useState(initialAiQaTopic);
  const [fileDepot, setFileDepot] = useState(initialFileUploadInstructions);
  const [proofsUserPrompt, setProofsUserPrompt] = useState("");
  const [modalityEditUnlocked, setModalityEditUnlocked] = useState<
    Pick<Record<ModalityCardId, boolean>, "case" | "oral" | "video" | "qa_ia" | "file">
  >(() => ({
    case: Boolean(String(initialCasePrompt ?? "").trim()),
    oral: Boolean(String(initialAudioNegotiationScenario ?? "").trim()),
    video: Boolean(String(initialVideoPresentationUrl ?? "").trim()),
    qa_ia: Boolean(String(initialAiQaTopic ?? "").trim()),
    file: Boolean(String(initialFileUploadInstructions ?? "").trim()),
  }));
  const [selectedModality, setSelectedModality] = useState<string | null>(null);
  const [activeModalities, setActiveModalities] = useState<ModalityCardId[]>(() => {
    const keys = buildModalitiesKeys({
      casePrompt: initialCasePrompt,
      oralIa: initialAudioNegotiationScenario,
      fileDepot: initialFileUploadInstructions,
    });
    const picked: ModalityCardId[] = [];
    if (keys.includes("qcm")) picked.push("qcm");
    if (keys.includes("case_study")) picked.push("case");
    if (keys.includes("oral_ia")) picked.push("oral");
    if (keys.includes("technical_json")) picked.push("file");
    // Default: show what can be configured.
    if (picked.length === 0) picked.push("qcm");
    return picked;
  });
  const [complexityValue, setComplexityValue] = useState<string>(complexity ?? "");
  const [modalitiesOpen, setModalitiesOpen] = useState(false);
  const [expectedProofs, setExpectedProofs] = useState<Array<{ text: string; checked: boolean }>>([]);
  const [proofsByModality, setProofsByModality] = useState<Record<ModalityCardId, string>>({
    qcm: "",
    case: "",
    oral: "",
    video: "",
    qa_ia: "",
    file: "",
  });
  const [isGeneratingProofs, setIsGeneratingProofs] = useState(false);
  const [successOverlayOpen, setSuccessOverlayOpen] = useState(false);

  const objectivesList = courseObjectives.map((o) => o.trim()).filter(Boolean);
  const visibleCards = useMemo(() => {
    const has = new Set(activeModalities);
    return CARDS.filter((c) => has.has(c.id));
  }, [activeModalities]);

  const toggleModality = (id: ModalityCardId) => {
    setActiveModalities((prev) => {
      const has = prev.includes(id);
      const next = has ? prev.filter((k) => k !== id) : [...prev, id];
      if (next.length === 0) return ["qcm"];
      return next;
    });
  };

  const runBeyondAIGeneration = async (modality: ModalityCardId) => {
    if (!title.trim()) {
      toast.error("Titre requis", { description: "Donnez un nom au badge avant de générer." });
      return;
    }
    try {
      const type = modality === "qcm" ? "internal_quiz" : "content";
      const res = await fetch("/api/ai/generate-badge-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          badgeTitle: title.trim(),
          complexity: complexityValue || null,
          modality,
          type,
          objectives: objectivesList,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(String(data?.error ?? `Erreur HTTP ${res.status}`));
      const mapping: Record<ModalityCardId, () => void> = {
        qcm: () => {
          const items = Array.isArray(data?.internalQuiz) ? (data.internalQuiz as unknown[]) : [];
          const cleaned = items
            .map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : null))
            .filter(Boolean)
            .map((obj) => {
              const type = String(obj?.type ?? "").trim();
              const q = String(obj?.question ?? "").trim();
              if (!q) return null;
              if (type === "multiple_choice") {
                const optsRaw = Array.isArray(obj?.options) ? (obj.options as unknown[]) : [];
                const opts = optsRaw.map((o) => String(o ?? "").trim()).filter(Boolean);
                const ci = typeof obj?.correctIndex === "number" ? obj.correctIndex : Number(obj?.correctIndex);
                if (opts.length !== 4) return null;
                const correctIndex = Number.isFinite(ci) ? Math.max(0, Math.min(3, Math.floor(ci))) : 0;
                return {
                  type: "multiple_choice",
                  question: q,
                  options: [opts[0], opts[1], opts[2], opts[3]] as [string, string, string, string],
                  correctIndex,
                } satisfies InternalQuizQuestion;
              }
              if (type === "true_false") {
                const cb =
                  typeof obj?.correctBoolean === "boolean"
                    ? obj.correctBoolean
                    : String(obj?.correctBoolean ?? "").toLowerCase() === "true";
                return { type: "true_false", question: q, correctBoolean: cb } satisfies InternalQuizQuestion;
              }
              if (type === "fill_in_the_blank") {
                const answer = String(obj?.answer ?? "").trim();
                if (!answer) return null;
                return { type: "fill_in_the_blank", question: q, answer } satisfies InternalQuizQuestion;
              }
              return null;
            })
            .filter(Boolean) as InternalQuizQuestion[];
          if (cleaned.length) {
            setInternalQuiz(cleaned.slice(0, 10));
            toast.success("QCM généré");
          } else {
            toast.message("Génération terminée", { description: "Aucun QCM exploitable." });
          }
        },
        case: () => {
          const prompt = String(data?.casePrompt ?? "").trim();
          if (prompt) {
            setCasePrompt(prompt);
            setModalityEditUnlocked((u) => ({ ...u, case: true }));
          }
        },
        oral: () => {
          const prompt = String(data?.oralScenario ?? "").trim();
          if (prompt) {
            setOralIa(prompt);
            setModalityEditUnlocked((u) => ({ ...u, oral: true }));
          }
        },
        video: () => {
          const prompt = String(data?.videoInstructions ?? "").trim();
          if (prompt) {
            setVideoInstr(prompt);
            setModalityEditUnlocked((u) => ({ ...u, video: true }));
          }
        },
        qa_ia: () => {
          const topic = String(data?.aiQaTopic ?? "").trim();
          if (topic) {
            setQaIa(topic);
            setModalityEditUnlocked((u) => ({ ...u, qa_ia: true }));
          }
        },
        file: () => {
          const instr = String(data?.fileUploadInstructions ?? "").trim();
          if (instr) {
            setFileDepot(instr);
            setModalityEditUnlocked((u) => ({ ...u, file: true }));
          }
        },
      };
      mapping[modality]?.();
    } catch (e) {
      toast.error("Génération impossible", { description: e instanceof Error ? e.message : "Erreur" });
    }
  };

  const handleGenerateContent = (modality: ModalityCardId) => runBeyondAIGeneration(modality);
  const handleGenerate = () => {
    void runBeyondAIGeneration("qcm");
  };

  const runGenerateProofs = async () => {
    if (!title.trim()) {
      toast.error("Titre requis", { description: "Donnez un nom au badge avant de générer." });
      return;
    }
    setIsGeneratingProofs(true);
    try {
      const res = await fetch("/api/ai/generate-badge-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          badgeTitle: title.trim(),
          complexity: complexityValue || null,
          type: "proofs",
          objectives: objectivesList,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(String(data?.error ?? `Erreur HTTP ${res.status}`));
      const items = Array.isArray(data?.proofsItems) ? (data.proofsItems as unknown[]) : [];
      const cleaned = items.map((x) => String(x ?? "").trim()).filter(Boolean).slice(0, 5);
      if (cleaned.length) setExpectedProofs(cleaned.map((t: string) => ({ text: t, checked: true })));
    } catch (e) {
      toast.error("Génération impossible", { description: e instanceof Error ? e.message : "Erreur" });
    } finally {
      setIsGeneratingProofs(false);
    }
  };

  const handleCreate = async () => {
    const resolvedTitle = title.trim() || `Badge ${String(courseTitle ?? "").trim() || "Formation"}`;
    onObjectivesChange(objectivesList);

    const criteriaHtml = `<ul>${objectivesList.map((o) => `<li>${escapeHtml(o)}</li>`).join("")}</ul>`;

    const modalitiesJson: Record<string, unknown> = {};
    if (activeModalities.includes("qcm")) modalitiesJson.qcm = { mode: "internal" };
    if (activeModalities.includes("case")) modalitiesJson.case_study = { prompt: casePrompt.trim() };
    if (activeModalities.includes("oral")) modalitiesJson.oral_ia = { prompt: oralIa.trim() };
    if (activeModalities.includes("file")) modalitiesJson.file_upload = { instructions: fileDepot.trim() };
    if (activeModalities.includes("video")) modalitiesJson.video = { instructions: videoInstr.trim() };
    if (activeModalities.includes("qa_ia")) modalitiesJson.ai_qa = { topic: qaIa.trim() };

    const proofsSelected = expectedProofs.map((p) => ({ ...p, text: p.text.trim() })).filter((p) => p.checked && p.text);
    if (proofsSelected.length) modalitiesJson.expected_proofs = proofsSelected.map((p) => p.text);
    onModalitiesConfigChange?.(modalitiesJson);

    const modalitiesKeys = (activeModalities.length ? activeModalities : ["qcm"])
      .map((id) => CARD_ID_TO_MODALITY_KEY[id])
      .filter(Boolean) as BadgeModalityKey[];
    const evaluationType = modalityKeysToEvaluationType(modalitiesKeys);

    const payload: OpenBadgeSavePayload = {
      name: resolvedTitle,
      description: description.trim(),
      imageUrl: imageUrl || undefined,
      criteriaHtml,
      modalitiesKeys,
      modalitiesObtention: "Studio — configuration complète",
      competenciesText: objectivesList.join("\n"),
      evaluationType,
      quizTestId: undefined,
      casePrompt: casePrompt.trim() || undefined,
      oralScenario: oralIa.trim() || undefined,
      oralIaEvaluationPrompt: undefined,
      technicalJsonEndpoint: undefined,
      videoPresentationUrl: videoInstr.trim() || undefined,
      fileUploadInstructions: fileDepot.trim() || undefined,
      audioPresentationScenario: undefined,
      audioNegotiationScenario: oralIa.trim() || undefined,
      aiQaTopic: qaIa.trim() || undefined,
    };
    (payload as any).courseId = String(courseId ?? "").trim() || null;
    (payload as any).title = resolvedTitle;

    try {
      onComplexityChange?.(complexityValue);
      await Promise.resolve(onSave(payload));
    } catch (e) {
      console.warn("[badge-creator-overlay] onSave:", e);
      return;
    }

    const cid = String(courseId ?? "").trim();
    if (cid && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id ? String(user.id) : null;
      if (!userId) return;
      const nextInternalQuiz =
        activeModalities.includes("qcm")
          ? internalQuiz
              .map((q) => ({
                type: q.type,
                question: String(q.question ?? "").trim(),
                options:
                  q.type === "multiple_choice"
                    ? ([
                        String(q.options?.[0] ?? "").trim(),
                        String(q.options?.[1] ?? "").trim(),
                        String(q.options?.[2] ?? "").trim(),
                        String(q.options?.[3] ?? "").trim(),
                      ] as [string, string, string, string])
                    : undefined,
                correctIndex:
                  q.type === "multiple_choice"
                    ? typeof q.correctIndex === "number"
                      ? Math.max(0, Math.min(3, Math.floor(q.correctIndex)))
                      : 0
                    : undefined,
                correctBoolean: q.type === "true_false" ? Boolean(q.correctBoolean) : undefined,
                answer: q.type === "fill_in_the_blank" ? String(q.answer ?? "").trim() : undefined,
              }))
              .filter((q) => {
                if (!q.question) return false;
                if (q.type === "multiple_choice") return Array.isArray(q.options) && q.options.every(Boolean);
                if (q.type === "true_false") return typeof q.correctBoolean === "boolean";
                if (q.type === "fill_in_the_blank") return Boolean(q.answer);
                return false;
              })
          : [];
      const badgeData = {
        name: resolvedTitle,
        title: resolvedTitle,
        description: description.trim() || undefined,
        criteria: criteriaHtml.trim() || undefined,
        image_url: imageUrl?.trim() ? imageUrl.trim() : undefined,
        objectives: objectivesList,
        modalities: modalitiesJson,
        ...(nextInternalQuiz.length > 0 ? { internal_quiz: nextInternalQuiz } : {}),
        ...(oralIa.trim() ? { audio_prompt: oralIa.trim() } : {}),
      };
      const { data: insertedBadge, error: badgeError } = await supabase
        .from("open_badges")
        .insert([
          {
            ...badgeData,
            user_id: userId,
            course_id: cid,
          } as never,
        ])
        .select("id")
        .single();
      if (badgeError) {
        console.warn("[badge-creator-overlay] insert open_badges:", badgeError);
        toast.error("Sauvegarde Supabase impossible", { description: badgeError.message });
        return;
      }

      const badgeId = String((insertedBadge as any)?.id ?? "").trim();
      if (badgeId) {
        const proofRows = (activeModalities.length ? activeModalities : ["qcm"]).map((modality) => {
          const text = String(proofsByModality[modality] ?? "").trim();
          return text
            ? ({
                badge_id: badgeId,
                course_id: cid,
                modality,
                proof_text: text,
                user_id: userId,
              } as never)
            : null;
        }).filter(Boolean) as never[];

        if (proofRows.length) {
          const { error: proofsError } = await supabase.from("badge_proofs").insert(proofRows);
          if (proofsError) {
            console.warn("[badge-creator-overlay] insert badge_proofs:", proofsError);
          }
        }
      }
    }

    toast.success("Badge créé");
    try {
      confetti({ particleCount: 140, spread: 70, origin: { y: 0.65 } });
    } catch {
      // ignore
    }
    setSuccessOverlayOpen(false);
    onOpenChange(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0B0E14] text-white">
      <header className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#0B0E14] px-4 py-4 sm:px-8">
        <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Créer ton Open Badge</h1>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10"
          onClick={() => onOpenChange(false)}
          aria-label="Fermer"
        >
          <X className="h-6 w-6" />
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-4xl space-y-10 pb-28">
          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400/90">Identité</h2>
            <div className="space-y-2">
              <Label className="text-slate-200">Nom de l&apos;Open Badge</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                className="min-h-[56px] border-white/15 bg-white/[0.06] py-3 text-2xl font-bold tracking-tight text-white placeholder:text-slate-500"
                placeholder="Ex. Expert Comprendre l’IA"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                className="min-h-[100px] border-white/15 bg-white/[0.06] text-white placeholder:text-slate-500"
                placeholder="Ce que valide ce badge…"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Complexité</Label>
              <Select
                value={complexityValue || "none"}
                onValueChange={(v) => {
                  const next = v === "none" ? "" : v;
                  setComplexityValue(next);
                  onComplexityChange?.(next);
                }}
              >
                <SelectTrigger className="border-white/15 bg-white/[0.06] text-white">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent className="z-[300]">
                  <SelectItem value="none">—</SelectItem>
                  {COMPLEXITIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Image (URL)</Label>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                className="border-white/15 bg-white/[0.06] text-white"
                placeholder="https://…"
              />
              {imageUrl?.startsWith("http") ? (
                <div className="relative mt-2 h-20 w-20 overflow-hidden rounded-lg border border-white/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                </div>
              ) : null}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400/90">Objectifs de la formation (lecture seule)</h2>
            <p className="text-sm text-slate-300">
              Issus du builder — modifie les objectifs dans l’onglet métadonnées du cours si besoin.
            </p>
            {objectivesList.length > 0 ? (
              <ul className="list-inside list-disc space-y-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-slate-100">
                {objectivesList.map((obj, i) => (
                  <li key={i} className="text-sm leading-relaxed">
                    {obj}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl border border-dashed border-white/20 px-4 py-3 text-sm text-slate-400">
                Aucun objectif défini dans le snapshot du cours.
              </p>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400/90">Preuves attendues</h2>
            {expectedProofs.length === 0 ? (
              <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <Label className="text-slate-200">Consignes pour l&apos;IA</Label>
                <Textarea
                  value={proofsUserPrompt}
                  onChange={(e) => setProofsUserPrompt(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="min-h-[100px] border-white/15 bg-[#12161f] text-white placeholder:text-slate-500"
                  placeholder="Contexte, ton, contraintes pour générer les preuves attendues…"
                />
                <div className="flex justify-end pt-1">
                  <Button
                    type="button"
                    variant="secondary"
                    className="relative z-[999] pointer-events-auto cursor-pointer opacity-100 h-9 rounded-full bg-white/10 text-white hover:bg-white/15"
                    onClick={runGenerateProofs}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Générer
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                {expectedProofs.map((item, idx) => (
                  <label key={idx} className="flex items-start gap-3 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) =>
                        setExpectedProofs((prev) =>
                          prev.map((p, i) => (i === idx ? { ...p, checked: e.target.checked } : p)),
                        )
                      }
                      className="mt-1 h-4 w-4 accent-fuchsia-500"
                    />
                    <input
                      value={item.text}
                      onChange={(e) =>
                        setExpectedProofs((prev) => prev.map((p, i) => (i === idx ? { ...p, text: e.target.value } : p)))
                      }
                      className="h-10 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-fuchsia-400/60"
                    />
                  </label>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-400">Affiché comme checklist (Beyond) — stocké dans la config du badge.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400/90">Modalités</h2>
            <p className="text-sm text-slate-300">Choisis les modalités à configurer. Seules les cartes sélectionnées sont affichées.</p>
            <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              {(activeModalities.length ? activeModalities : ["qcm"]).map((modality) => (
                <div key={modality} className="space-y-2">
                  <Label className="text-xs text-white/70">Preuve attendue pour {CARDS.find((c) => c.id === modality)?.title ?? modality}</Label>
                  <Textarea
                    value={proofsByModality[modality] ?? ""}
                    onChange={(e) => setProofsByModality((prev) => ({ ...prev, [modality]: e.target.value }))}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="min-h-[88px] border-white/15 bg-black/30 text-white"
                    placeholder="Preuve attendue…"
                  />
                </div>
              ))}
            </div>
            <div className="relative">
              <Button
                type="button"
                variant="secondary"
                className="h-11 w-full justify-between rounded-2xl bg-white/10 text-white hover:bg-white/15"
                onClick={() => setModalitiesOpen((v) => !v)}
              >
                <span className="truncate">
                  {activeModalities.length
                    ? activeModalities
                        .map((id) => CARDS.find((c) => c.id === id)?.title)
                        .filter(Boolean)
                        .join(" · ")
                    : "Sélectionner des modalités"}
                </span>
                <span className="ml-3 text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
                  {activeModalities.length}
                </span>
              </Button>
              {modalitiesOpen ? (
                <div className="absolute z-[400] mt-2 w-full rounded-2xl border border-white/10 bg-[#0B0E14] p-2 shadow-2xl">
                  <div className="grid gap-1">
                    {CARDS.map((c) => {
                      const checked = activeModalities.includes(c.id);
                      return (
                        <label
                          key={c.id}
                          className={cn(
                            "flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm transition",
                            checked ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white",
                          )}
                        >
                          <span className="font-semibold">{c.title}</span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onKeyDown={(e) => e.stopPropagation()}
                            onChange={() => toggleModality(c.id)}
                            className="h-4 w-4 accent-fuchsia-500"
                          />
                        </label>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex justify-end gap-2 px-1 pb-1">
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-9 rounded-full text-slate-200 hover:bg-white/10"
                      onClick={() => setActiveModalities(["qcm"])}
                    >
                      Réinitialiser
                    </Button>
                    <Button
                      type="button"
                      className="h-9 rounded-full bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white hover:opacity-95"
                      onClick={() => setModalitiesOpen(false)}
                    >
                      OK
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {visibleCards.map((c) => {
                const Icon = c.icon;
                const active = selectedModality === c.id;
                return (
                  <div
                    key={c.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedModality((s) => (s === c.id ? null : c.id))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedModality((s) => (s === c.id ? null : c.id));
                      }
                    }}
                    className={cn(
                      "cursor-pointer rounded-2xl border bg-white/[0.04] p-4 text-left outline-none transition-[box-shadow,border-color] duration-200",
                      active
                        ? "border-cyan-400/80 shadow-[0_0_28px_rgba(34,211,238,0.35)] ring-2 ring-cyan-400/70"
                        : "border-white/10 ring-1 ring-white/5 hover:border-fuchsia-400/45 hover:shadow-[0_0_32px_rgba(236,72,153,0.38)] hover:ring-fuchsia-500/35",
                    )}
                  >
                    <div className="mb-3 flex items-start gap-3">
                      <span
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                          active ? "bg-cyan-500/25 text-cyan-200" : "bg-violet-600/30 text-violet-200",
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-bold text-white">{c.title}</p>
                        <p className="text-xs text-slate-400">{c.subtitle}</p>
                      </div>
                    </div>
                    {c.id === "qcm" ? (
                      <div
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        className="relative z-[100] isolate"
                      >
                        <div className="mt-3 flex justify-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleGenerate();
                            }}
                            className="relative z-[999999] pointer-events-auto cursor-pointer bg-blue-600 text-white p-4 rounded-xl"
                          >
                            <span className="inline-flex items-center gap-2">
                              <Sparkles className="h-4 w-4" />
                              Générer avec Beyond AI
                            </span>
                          </button>
                        </div>
                        {internalQuiz.length > 0 ? (
                        <div className="mt-4 space-y-3">
                          {internalQuiz.map((q, qIdx) => (
                            <div key={qIdx} className="rounded-2xl border border-white/10 bg-[#12161f] p-3">
                              <div className="flex items-center justify-between gap-2">
                                <Label className="text-xs text-white/70">Question {qIdx + 1}</Label>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="h-7 rounded-full border-white/15 bg-transparent px-3 text-[11px] text-white/80 hover:bg-white/10"
                                  onClick={() =>
                                    setInternalQuiz((prev) => {
                                      const next = prev.filter((_, i) => i !== qIdx);
                                      return next;
                                    })
                                  }
                                >
                                  Supprimer
                                </Button>
                              </div>
                              <div className="mt-2">
                                <Label className="text-xs text-white/60">Type</Label>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    className={cn(
                                      "rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition",
                                      q.type === "multiple_choice"
                                        ? "border-cyan-400/80 bg-cyan-500/20 text-cyan-100"
                                        : "border-white/15 bg-[#0f1420] text-white/80 hover:bg-white/10",
                                    )}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setInternalQuiz((prev) =>
                                        prev.map((it, i) => {
                                          if (i !== qIdx) return it;
                                          return {
                                            type: "multiple_choice",
                                            question: it.question ?? "",
                                            options: ["", "", "", ""],
                                            correctIndex: 0,
                                          };
                                        }),
                                      );
                                    }}
                                  >
                                    QCM
                                  </button>
                                  <button
                                    type="button"
                                    className={cn(
                                      "rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition",
                                      q.type === "true_false"
                                        ? "border-cyan-400/80 bg-cyan-500/20 text-cyan-100"
                                        : "border-white/15 bg-[#0f1420] text-white/80 hover:bg-white/10",
                                    )}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setInternalQuiz((prev) =>
                                        prev.map((it, i) => {
                                          if (i !== qIdx) return it;
                                          return { type: "true_false", question: it.question ?? "", correctBoolean: true };
                                        }),
                                      );
                                    }}
                                  >
                                    Vrai / Faux
                                  </button>
                                  <button
                                    type="button"
                                    className={cn(
                                      "rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition",
                                      q.type === "fill_in_the_blank"
                                        ? "border-cyan-400/80 bg-cyan-500/20 text-cyan-100"
                                        : "border-white/15 bg-[#0f1420] text-white/80 hover:bg-white/10",
                                    )}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setInternalQuiz((prev) =>
                                        prev.map((it, i) => {
                                          if (i !== qIdx) return it;
                                          return { type: "fill_in_the_blank", question: it.question ?? "", answer: "" };
                                        }),
                                      );
                                    }}
                                  >
                                    Texte à trou
                                  </button>
                                </div>
                              </div>
                              <Input
                                value={q.question}
                                onKeyDown={(e) => e.stopPropagation()}
                                onChange={(e) =>
                                  setInternalQuiz((prev) =>
                                    prev.map((it, i) => (i === qIdx ? { ...it, question: e.target.value } : it)),
                                  )
                                }
                                className="mt-2 border-white/20 bg-[#0f1420] text-white"
                                placeholder="Texte de la question…"
                              />
                              {q.type === "multiple_choice" ? (
                                <div className="mt-3 grid grid-cols-1 gap-2">
                                  {(q.options ?? ["", "", "", ""]).map((opt, optIdx) => (
                                    <div key={optIdx} className="flex items-center gap-2">
                                      <input
                                        type="radio"
                                        name={`correct-${qIdx}`}
                                        checked={(q.correctIndex ?? 0) === optIdx}
                                        onKeyDown={(e) => e.stopPropagation()}
                                        onChange={() =>
                                          setInternalQuiz((prev) =>
                                            prev.map((it, i) =>
                                              i === qIdx ? { ...it, correctIndex: optIdx } : it,
                                            ),
                                          )
                                        }
                                      />
                                      <Input
                                        value={opt}
                                        onKeyDown={(e) => e.stopPropagation()}
                                        onChange={(e) =>
                                          setInternalQuiz((prev) =>
                                            prev.map((it, i) => {
                                              if (i !== qIdx) return it;
                                              const nextOpts = [...(it.options ?? ["", "", "", ""])] as [
                                                string,
                                                string,
                                                string,
                                                string,
                                              ];
                                              nextOpts[optIdx] = e.target.value;
                                              return { ...it, options: nextOpts };
                                            }),
                                          )
                                        }
                                        className="border-white/20 bg-[#0f1420] text-white"
                                        placeholder={`Option ${optIdx + 1}`}
                                      />
                                    </div>
                                  ))}
                                </div>
                              ) : q.type === "true_false" ? (
                                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/80">
                                  <Label className="text-xs text-white/60">Bonne réponse</Label>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      className={cn(
                                        "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                                        (q.correctBoolean ?? true)
                                          ? "border-emerald-400/80 bg-emerald-500/20 text-emerald-100"
                                          : "border-white/15 bg-[#0f1420] text-white/70 hover:bg-white/10",
                                      )}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setInternalQuiz((prev) =>
                                          prev.map((it, i) => (i === qIdx ? { ...it, correctBoolean: true } : it)),
                                        );
                                      }}
                                    >
                                      Vrai
                                    </button>
                                    <button
                                      type="button"
                                      className={cn(
                                        "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                                        (q.correctBoolean ?? true) === false
                                          ? "border-rose-400/80 bg-rose-500/20 text-rose-100"
                                          : "border-white/15 bg-[#0f1420] text-white/70 hover:bg-white/10",
                                      )}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setInternalQuiz((prev) =>
                                          prev.map((it, i) => (i === qIdx ? { ...it, correctBoolean: false } : it)),
                                        );
                                      }}
                                    >
                                      Faux
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-3">
                                  <Label className="text-xs text-white/60">Réponse attendue</Label>
                                  <Input
                                    value={q.answer ?? ""}
                                    onKeyDown={(e) => e.stopPropagation()}
                                    onChange={(e) =>
                                      setInternalQuiz((prev) =>
                                        prev.map((it, i) => (i === qIdx ? { ...it, answer: e.target.value } : it)),
                                      )
                                    }
                                    className="mt-1 border-white/20 bg-[#0f1420] text-white"
                                    placeholder="Texte attendu…"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        ) : null}
                      </div>
                    ) : null}
                    {c.id === "case" ? (
                      <div
                        className="relative z-[100] space-y-3"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!modalityEditUnlocked.case ? (
                          <>
                            <div className="flex justify-end">
                              <Button
                                type="button"
                                variant="secondary"
                                className="relative z-[999] pointer-events-auto cursor-pointer opacity-100 h-9 rounded-full bg-white/10 text-white hover:bg-white/15"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void runBeyondAIGeneration("case");
                                }}
                              >
                                <Sparkles className="mr-2 h-4 w-4" />
                                Générer avec Beyond AI
                              </Button>
                            </div>
                          </>
                        ) : (
                          <Textarea
                            value={casePrompt}
                            onChange={(e) => setCasePrompt(e.target.value)}
                            onKeyDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            className="min-h-[100px] border-white/20 bg-[#12161f] text-white"
                            placeholder="Énoncé, données, livrables…"
                          />
                        )}
                      </div>
                    ) : null}
                    {c.id === "oral" ? (
                      <div
                        className="relative z-[100] space-y-3"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!modalityEditUnlocked.oral ? (
                          <>
                            <div className="flex justify-end">
                              <Button
                                type="button"
                                variant="secondary"
                                className="relative z-[999] pointer-events-auto cursor-pointer opacity-100 h-9 rounded-full bg-white/10 text-white hover:bg-white/15"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void runBeyondAIGeneration("oral");
                                }}
                              >
                                <Sparkles className="mr-2 h-4 w-4" />
                                Générer avec Beyond AI
                              </Button>
                            </div>
                          </>
                        ) : (
                          <Textarea
                            value={oralIa}
                            onChange={(e) => setOralIa(e.target.value)}
                            onKeyDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            className="min-h-[100px] border-white/20 bg-[#12161f] text-white"
                            placeholder="Consignes audio / vidéo — transcription IA…"
                          />
                        )}
                      </div>
                    ) : null}
                    {c.id === "video" ? (
                      <div
                        className="relative z-[100] space-y-3"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!modalityEditUnlocked.video ? (
                          <>
                            <div className="flex justify-end">
                              <Button
                                type="button"
                                variant="secondary"
                                className="relative z-[999] pointer-events-auto cursor-pointer opacity-100 h-9 rounded-full bg-white/10 text-white hover:bg-white/15"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void runBeyondAIGeneration("video");
                                }}
                              >
                                <Sparkles className="mr-2 h-4 w-4" />
                                Générer avec Beyond AI
                              </Button>
                            </div>
                          </>
                        ) : (
                          <Textarea
                            value={videoInstr}
                            onChange={(e) => setVideoInstr(e.target.value)}
                            onKeyDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            className="min-h-[88px] border-white/20 bg-[#12161f] text-white"
                            placeholder="Consignes de présentation…"
                          />
                        )}
                      </div>
                    ) : null}
                    {c.id === "qa_ia" ? (
                      <div
                        className="relative z-[100] space-y-3"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!modalityEditUnlocked.qa_ia ? (
                          <>
                            <div className="flex justify-end">
                              <Button
                                type="button"
                                variant="secondary"
                                className="relative z-[999] pointer-events-auto cursor-pointer opacity-100 h-9 rounded-full bg-white/10 text-white hover:bg-white/15"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void runBeyondAIGeneration("qa_ia");
                                }}
                              >
                                <Sparkles className="mr-2 h-4 w-4" />
                                Générer avec Beyond AI
                              </Button>
                            </div>
                          </>
                        ) : (
                          <Textarea
                            value={qaIa}
                            onChange={(e) => setQaIa(e.target.value)}
                            onKeyDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            className="min-h-[88px] border-white/20 bg-[#12161f] text-white"
                            placeholder="Sujet Q&R avec l’IA…"
                          />
                        )}
                      </div>
                    ) : null}
                    {c.id === "file" ? (
                      <div
                        className="relative z-[100] space-y-3"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!modalityEditUnlocked.file ? (
                          <>
                            <div className="flex justify-end">
                              <Button
                                type="button"
                                variant="secondary"
                                className="relative z-[999] pointer-events-auto cursor-pointer opacity-100 h-9 rounded-full bg-white/10 text-white hover:bg-white/15"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void runBeyondAIGeneration("file");
                                }}
                              >
                                <Sparkles className="mr-2 h-4 w-4" />
                                Générer avec Beyond AI
                              </Button>
                            </div>
                          </>
                        ) : (
                          <Textarea
                            value={fileDepot}
                            onChange={(e) => setFileDepot(e.target.value)}
                            onKeyDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            className="min-h-[88px] border-white/20 bg-[#12161f] text-white"
                            placeholder="Automatisation, dépôt, critères, livrables…"
                          />
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      <footer className="flex shrink-0 justify-end border-t border-white/10 bg-[#0B0E14] px-4 py-4 sm:px-8">
        <Button
          type="button"
          onClick={handleCreate}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 px-8 font-bold text-white shadow-lg"
        >
          Créer
        </Button>
      </footer>
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
