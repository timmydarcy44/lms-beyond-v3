"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, NotebookPen } from "lucide-react";

import { PieceDocument, pieceKindLabel } from "@/components/apprenant/workshop-piece-view";
import { workshopMaxImprovements } from "@/lib/workshops/workshop-block";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { WorkshopCharacter, WorkshopConfig, WorkshopField, WorkshopPiece } from "@/types/course-builder";

type Feedback = {
  criteres: { critere: string; statut: "reussi" | "a_ameliorer"; commentaire: string; suggestion: string }[];
  commentaire_global: string;
};

type OutputPayload = {
  final?: boolean;
  answers?: Record<string, string>;
  feedback?: Feedback | null;
  feedbackCount?: number;
  updatedAt?: string | null;
  error?: string;
};

type Step = 1 | 2 | 3 | "done";

const PROJECT_HREF = "/dashboard/apprenant/mon-projet-expert";
const WAITING = ["Lecture de votre réponse…", "Analyse des critères…", "Préparation du retour…"];

function isFeedback(value: unknown): value is Feedback {
  if (!value || typeof value !== "object") return false;
  const row = value as Feedback;
  return Array.isArray(row.criteres) && typeof row.commentaire_global === "string";
}

function formatDay(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

function fieldForCriterion(label: string, fields: WorkshopField[]) {
  const needle = label.toLowerCase();
  const found = fields.findIndex((field) => {
    const current = field.label.toLowerCase();
    return current.length > 3 && (needle.includes(current) || current.includes(needle));
  });
  return found >= 0 ? found : 0;
}

export function WorkshopLearnerView({
  courseId,
  blockId,
  workshop,
  title,
  duration,
  continueHref,
  preview = false,
}: {
  courseId: string;
  blockId: string;
  workshop: WorkshopConfig;
  title?: string;
  duration?: string;
  continueHref?: string | null;
  preview?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const fields = useMemo(
    () => (workshop.fields ?? []).filter((field) => field.id && (field.label.trim() || field.placeholder?.trim())),
    [workshop.fields],
  );
  const visibleFields = fields.length > 0 ? fields : (workshop.fields ?? []).filter((field) => field.id);
  const criteria = (workshop.criteria ?? []).map((item) => item.label.trim()).filter(Boolean);
  const max = workshopMaxImprovements(workshop);
  const example = workshop.example?.trim() ?? "";
  const situation = workshop.situation?.trim() ?? "";
  const brief = workshop.brief?.trim() ?? "";
  const personnage = visibleCharacter(workshop.personnage);
  const pieces = workshop.pieces ?? [];
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [locked, setLocked] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [busy, setBusy] = useState<"feedback" | "final" | null>(null);
  const [notice, setNotice] = useState("");
  const [step, setStep] = useState<Step>(1);
  const [fieldIndex, setFieldIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [exampleOpen, setExampleOpen] = useState(false);
  const [criteriaOpen, setCriteriaOpen] = useState(false);
  const [piecesOpen, setPiecesOpen] = useState(false);
  const [openPiece, setOpenPiece] = useState<WorkshopPiece | null>(null);
  const [validatedAt, setValidatedAt] = useState<string | null>(null);
  const [waitIndex, setWaitIndex] = useState(0);
  const savedRef = useRef("{}");
  const timerRef = useRef<number | null>(null);
  const answersRef = useRef(answers);
  const lockedRef = useRef(locked);
  const holdRef = useRef(false);
  const landedRef = useRef(false);
  answersRef.current = answers;
  lockedRef.current = locked;

  useEffect(() => {
    if (preview) {
      setHydrated(true);
      return;
    }
    let ignore = false;
    const params = new URLSearchParams({ courseId, blockId });
    fetch(`/api/workshops/output?${params.toString()}`, { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as OutputPayload;
      })
      .then((payload) => {
        if (ignore || !payload) {
          if (!ignore) setHydrated(true);
          return;
        }
        const next = payload.answers ?? {};
        savedRef.current = JSON.stringify(next);
        setAnswers(next);
        setFeedback(isFeedback(payload.feedback) ? payload.feedback : null);
        setFeedbackCount(payload.feedbackCount ?? 0);
        setLocked(Boolean(payload.final));
        setValidatedAt(payload.updatedAt ?? null);
        setHydrated(true);
      })
      .catch(() => {
        if (!ignore) setHydrated(true);
      });
    return () => {
      ignore = true;
    };
  }, [blockId, courseId, preview]);

  useEffect(() => {
    if (!hydrated || landedRef.current) return;
    landedRef.current = true;
    if (locked) setStep(3);
  }, [hydrated, locked]);

  useEffect(() => {
    if (!hydrated || locked || preview) return;
    const serialized = JSON.stringify(answers);
    if (serialized === savedRef.current || holdRef.current) return;
    timerRef.current = window.setTimeout(() => {
      void persist(answers, false);
    }, 2000);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [answers, hydrated, locked, preview]);

  useEffect(() => {
    if (preview) return;
    return () => {
      if (lockedRef.current || holdRef.current) return;
      const current = answersRef.current;
      const serialized = JSON.stringify(current);
      if (serialized === savedRef.current) return;
      void fetch("/api/workshops/output", {
        method: "PATCH",
        credentials: "include",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, blockId, answers: current }),
      });
    };
  }, [blockId, courseId, preview]);

  useEffect(() => {
    if (busy !== "feedback") return;
    if (reduceMotion) return;
    const timer = window.setInterval(() => setWaitIndex((value) => (value + 1) % WAITING.length), 1600);
    return () => window.clearInterval(timer);
  }, [busy, reduceMotion]);

  async function persist(next: Record<string, string>, silent: boolean) {
    if (lockedRef.current || preview) return;
    const serialized = JSON.stringify(next);
    if (serialized === savedRef.current) return;
    if (!silent) setSaveState("saving");
    const response = await fetch("/api/workshops/output", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, blockId, answers: next }),
    });
    const payload = (await response.json().catch(() => null)) as OutputPayload | null;
    if (response.status === 409 && payload?.final) {
      savedRef.current = JSON.stringify(payload.answers ?? next);
      setLocked(true);
      setFeedback(isFeedback(payload.feedback) ? payload.feedback : null);
      setValidatedAt(payload.updatedAt ?? null);
      setSaveState("saved");
      setStep(3);
      return;
    }
    if (!response.ok) {
      if (!silent) setSaveState("error");
      return;
    }
    savedRef.current = serialized;
    if (!silent) setSaveState("saved");
  }

  async function requestFeedback() {
    if (locked || busy) return;
    if (!Object.values(answers).some((item) => item.trim())) {
      setNotice("Écrivez une réponse avant de demander un retour.");
      setStep(2);
      return;
    }
    if (timerRef.current) window.clearTimeout(timerRef.current);
    holdRef.current = true;
    setBusy("feedback");
    setNotice("");
    setStep(3);
    try {
      if (!preview) await persist(answers, true);
      const response = await fetch("/api/ai/workshop-feedback", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, blockId, answers, preview }),
      });
      const payload = (await response.json().catch(() => null)) as { feedback?: Feedback; error?: string } | null;
      if (!response.ok || !isFeedback(payload?.feedback)) {
        setNotice(feedbackNotice(response.status, payload?.error));
        setStep(2);
        return;
      }
      setFeedback(payload.feedback);
      setFeedbackCount((count) => count + 1);
      savedRef.current = JSON.stringify(answers);
      setSaveState("saved");
    } finally {
      holdRef.current = false;
      setBusy(null);
      const current = answersRef.current;
      if (!lockedRef.current && JSON.stringify(current) !== savedRef.current) void persist(current, false);
    }
  }

  async function validateAnswer() {
    if (locked || busy) return;
    if (preview) {
      setLocked(true);
      setStep("done");
      return;
    }
    if (!Object.values(answers).some((item) => item.trim())) {
      setNotice("Écrivez une réponse avant de la valider.");
      return;
    }
    if (timerRef.current) window.clearTimeout(timerRef.current);
    holdRef.current = true;
    setBusy("final");
    setNotice("");
    try {
      const response = await fetch("/api/workshops/output", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, blockId, answers }),
      });
      const payload = (await response.json().catch(() => null)) as OutputPayload | null;
      if (!response.ok || !payload?.final) {
        setNotice(payload?.error || "La validation n'a pas abouti. Relancez.");
        return;
      }
      savedRef.current = JSON.stringify(payload.answers ?? answers);
      setAnswers(payload.answers ?? answers);
      setFeedback(isFeedback(payload.feedback) ? payload.feedback : feedback);
      setValidatedAt(payload.updatedAt ?? new Date().toISOString());
      lockedRef.current = true;
      setLocked(true);
      setSaveState("saved");
      setStep("done");
    } finally {
      holdRef.current = false;
      setBusy(null);
      const current = answersRef.current;
      if (!lockedRef.current && JSON.stringify(current) !== savedRef.current) void persist(current, false);
    }
  }

  const usedImprovements = Math.max(0, feedbackCount - (feedback ? 1 : 0));
  const remaining = Math.max(0, max - usedImprovements);
  const remainingLabel = remaining === 1 ? "1 essai restant" : `${remaining} essais restants`;
  const hasAnswer = Object.values(answers).some((item) => item.trim().length > 0);
  const passedCount = feedback?.criteres.filter((item) => item.statut === "reussi").length ?? 0;
  const totalCriteria = feedback?.criteres.length ?? criteria.length;
  const activeField = visibleFields[Math.min(fieldIndex, Math.max(visibleFields.length - 1, 0))];
  const motionTime = reduceMotion ? 0 : 0.28;

  function openExample() {
    if (example) setExampleOpen(true);
  }

  function rework(label: string) {
    if (locked) return;
    setFieldIndex(fieldForCriterion(label, visibleFields));
    setShowAll(false);
    setStep(2);
  }

  return (
    <section className="workshop-mission mx-auto flex w-full max-w-5xl flex-col text-[#F4F1EA]" data-workshop="atelier">
      <Stepper step={step} locked={locked} onStep={setStep} hasFeedback={Boolean(feedback) || locked} />

      {step === 3 && locked && step !== "done" ? (
        <p className="mt-4 rounded-2xl border border-[#2FD08A]/40 bg-[#2FD08A]/10 px-4 py-3 text-sm font-medium text-[#d9ffe9]">
          Atelier validé le {formatDay(validatedAt) || "—"}
        </p>
      ) : null}

      <div className="mt-5">
        {step === 1 ? (
          <Brief
            title={title?.trim() || "Atelier"}
            duration={duration}
            brief={brief}
            situation={situation}
            personnage={personnage}
            pieces={pieces}
            criteria={criteria}
            example={example}
            onExample={openExample}
            onOpenPiece={setOpenPiece}
            onStart={() => setStep(2)}
          />
        ) : null}

        {step === 2 ? (
          <Production
            fields={visibleFields}
            field={activeField}
            index={Math.min(fieldIndex, Math.max(visibleFields.length - 1, 0))}
            showAll={showAll}
            answers={answers}
            locked={locked}
            criteria={criteria}
            checked={checked}
            saveState={saveState}
            example={example}
            pieces={pieces}
            notice={notice}
            busy={busy !== null}
            hasAnswer={hasAnswer}
            onToggleAll={() => setShowAll((value) => !value)}
            onCheck={(index) => setChecked((current) => ({ ...current, [index]: !current[index] }))}
            onExample={openExample}
            onCriteria={() => setCriteriaOpen(true)}
            onPieces={() => setPiecesOpen(true)}
            onOpenPiece={setOpenPiece}
            onChange={(id, value) => setAnswers((current) => ({ ...current, [id]: value }))}
            onPrev={() => setFieldIndex((value) => Math.max(0, value - 1))}
            onNext={() => setFieldIndex((value) => Math.min(visibleFields.length - 1, value + 1))}
            onFeedback={() => void requestFeedback()}
          />
        ) : null}

        {step === 3 ? (
          <div aria-live="polite">
            {busy === "feedback" ? (
              <Waiting message={WAITING[waitIndex]} reduceMotion={Boolean(reduceMotion)} />
            ) : feedback ? (
              <FeedbackView
                feedback={feedback}
                passed={passedCount}
                total={totalCriteria}
                remaining={remaining}
                remainingLabel={remainingLabel}
                locked={locked}
                busy={busy !== null}
                feedbackCount={feedbackCount}
                notice={notice}
                reduceMotion={Boolean(reduceMotion)}
                motionTime={motionTime}
                onRework={rework}
                onImprove={() => void requestFeedback()}
                onValidate={() => void validateAnswer()}
              />
            ) : (
              <p className="text-sm text-white/70">Le retour s’affichera ici.</p>
            )}
          </div>
        ) : null}

        {step === "done" ? <Confirmed continueHref={continueHref} preview={preview} reduceMotion={Boolean(reduceMotion)} /> : null}
      </div>

      <Sheet open={exampleOpen} onOpenChange={setExampleOpen}>
        <SheetContent side="right" className="border-[#1A2340] bg-[#111831] text-[#F4F1EA] sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-[#F4F1EA]">Exemple</SheetTitle>
            <SheetDescription className="text-white/60">Une réponse qui répond aux critères.</SheetDescription>
          </SheetHeader>
          <p className="whitespace-pre-wrap px-4 text-base leading-relaxed">{example}</p>
        </SheetContent>
      </Sheet>

      <Sheet open={piecesOpen} onOpenChange={setPiecesOpen}>
        <SheetContent side="bottom" className="max-h-[80vh] border-[#1A2340] bg-[#111831] text-[#F4F1EA]">
          <SheetHeader>
            <SheetTitle className="text-[#F4F1EA]">Pièces</SheetTitle>
            <SheetDescription className="text-white/60">Ouvrez un document pendant que vous répondez.</SheetDescription>
          </SheetHeader>
          <PieceList pieces={pieces} onOpen={(piece) => { setPiecesOpen(false); setOpenPiece(piece); }} />
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(openPiece)} onOpenChange={(open) => { if (!open) setOpenPiece(null); }}>
        <SheetContent side="right" className="w-full overflow-x-hidden overflow-y-auto border-[#1A2340] bg-[#0A0F1E] text-[#F4F1EA] sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle className="text-[#F4F1EA]">{openPiece?.titre || "Pièce"}</SheetTitle>
            <SheetDescription className="text-white/60">{openPiece ? pieceKindLabel(openPiece) : ""}</SheetDescription>
          </SheetHeader>
          <div className="min-w-0 overflow-x-auto px-4 pb-6">{openPiece ? <PieceDocument piece={openPiece} /> : null}</div>
        </SheetContent>
      </Sheet>

      <Sheet open={criteriaOpen} onOpenChange={setCriteriaOpen}>
        <SheetContent side="bottom" className="border-[#1A2340] bg-[#111831] text-[#F4F1EA]">
          <SheetHeader>
            <SheetTitle className="text-[#F4F1EA]">Ce qui sera regardé</SheetTitle>
            <SheetDescription className="text-white/60">Cochez pour vous, rien n’est enregistré.</SheetDescription>
          </SheetHeader>
          <CriteriaList criteria={criteria} checked={checked} onCheck={(index) => setChecked((current) => ({ ...current, [index]: !current[index] }))} />
        </SheetContent>
      </Sheet>
    </section>
  );
}

function Stepper({
  step,
  locked,
  hasFeedback,
  onStep,
}: {
  step: Step;
  locked: boolean;
  hasFeedback: boolean;
  onStep: (step: Step) => void;
}) {
  const items: { id: 1 | 2 | 3; label: string }[] = [
    { id: 1, label: "Le brief" },
    { id: 2, label: "Votre production" },
    { id: 3, label: "Le retour" },
  ];
  const current = step === "done" ? 3 : step;
  return (
    <nav aria-label="Étapes de l'atelier" className="grid grid-cols-3 gap-2">
      {items.map((item) => {
        const active = current === item.id && step !== "done";
        const disabled = locked ? item.id !== 3 : item.id === 3 && !hasFeedback;
        return (
          <button
            key={item.id}
            type="button"
            aria-current={active ? "step" : undefined}
            disabled={disabled}
            onClick={() => onStep(item.id)}
            className={`min-h-11 rounded-full px-2 text-[11px] font-semibold leading-none whitespace-nowrap transition-colors duration-200 sm:text-sm ${
              active ? "bg-[#6E5BFF] text-white" : "bg-[#111831] text-white/75"
            } disabled:opacity-40`}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

function visibleCharacter(personnage?: WorkshopCharacter) {
  const nom = personnage?.nom?.trim() ?? "";
  const fonction = personnage?.fonction?.trim() ?? "";
  const description = personnage?.description?.trim() ?? "";
  if (!nom && !fonction && !description) return null;
  return { nom, fonction, description };
}

function characterInitials(nom: string) {
  const letters = nom.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
  return letters || "?";
}

function Brief({
  title,
  duration,
  brief,
  situation,
  personnage,
  pieces,
  criteria,
  example,
  onExample,
  onOpenPiece,
  onStart,
}: {
  title: string;
  duration?: string;
  brief: string;
  situation: string;
  personnage: { nom: string; fonction: string; description: string } | null;
  pieces: WorkshopPiece[];
  criteria: string[];
  example: string;
  onExample: () => void;
  onOpenPiece: (piece: WorkshopPiece) => void;
  onStart: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 pb-24 lg:pb-0">
      <article className="rounded-[28px] border border-[#1A2340] bg-[#111831] px-6 py-8 sm:px-10">
        <p className="inline-flex items-center gap-2 rounded-full bg-[#6E5BFF]/20 px-3 py-1 text-xs font-semibold text-[#d9d4ff]">
          <NotebookPen className="size-3.5" aria-hidden />
          Atelier
        </p>
        <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{title}</h2>
        {duration?.trim() ? <p className="mt-3 text-sm text-white/60">{duration.trim()}</p> : null}
      </article>
      {situation ? (
        <div>
          <h3 className="text-sm font-semibold text-white/70">Situation</h3>
          <p className="mt-3 whitespace-pre-wrap text-xl leading-relaxed text-white/90">{situation}</p>
        </div>
      ) : null}
      {personnage ? (
        <article className="flex gap-4 rounded-[24px] border border-[#1A2340] bg-[#111831] p-5">
          <span aria-hidden className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-[#6E5BFF] text-sm font-semibold">
            {characterInitials(personnage.nom)}
          </span>
          <div>
            {personnage.nom ? <p className="text-lg font-semibold">{personnage.nom}</p> : null}
            {personnage.fonction ? <p className="text-sm text-[#d9d4ff]">{personnage.fonction}</p> : null}
            {personnage.description ? <p className="mt-2 whitespace-pre-wrap text-base leading-relaxed text-white/85">{personnage.description}</p> : null}
          </div>
        </article>
      ) : null}
      {pieces.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold text-white/70">Pièces</h3>
          <PieceList pieces={pieces} onOpen={onOpenPiece} />
        </div>
      ) : null}
      {brief ? (
        <div className="rounded-[24px] border border-[#26304F] bg-[#0B1122] p-5">
          <h3 className="text-sm font-semibold text-[#E85AA8]">Votre mission</h3>
          <p className="mt-3 whitespace-pre-wrap text-lg leading-relaxed text-white/90">{brief}</p>
        </div>
      ) : null}
      {example ? (
        <button type="button" onClick={onExample} className="self-start text-sm font-semibold text-[#d9d4ff] underline-offset-4 hover:underline lg:hidden">
          Voir un exemple
        </button>
      ) : null}
      {criteria.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold text-white/70">Ce qui sera regardé</h3>
          <ol className="mt-3 flex flex-col gap-2">
            {criteria.map((label, index) => (
              <li key={`${label}-${index}`} className="flex items-start gap-3 rounded-2xl bg-[#111831] px-4 py-3">
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-[#6E5BFF] text-xs font-semibold">{index + 1}</span>
                <span className="pt-0.5 text-sm leading-relaxed">{label}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      <div className="fixed inset-x-0 bottom-0 z-20 flex gap-3 border-t border-[#1A2340] bg-[#0A0F1E]/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0">
        {example ? (
          <button type="button" onClick={onExample} className="hidden min-h-12 items-center justify-center rounded-full border border-[#26304F] px-5 text-sm font-semibold lg:inline-flex">
            Voir un exemple
          </button>
        ) : null}
        <button type="button" onClick={onStart} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#6E5BFF] px-5 text-sm font-semibold text-white">
          Commencer
        </button>
      </div>
    </div>
  );
}

function Production(props: {
  fields: WorkshopField[];
  field?: WorkshopField;
  index: number;
  showAll: boolean;
  answers: Record<string, string>;
  locked: boolean;
  criteria: string[];
  checked: Record<number, boolean>;
  saveState: "idle" | "saving" | "saved" | "error";
  example: string;
  pieces: WorkshopPiece[];
  notice: string;
  busy: boolean;
  hasAnswer: boolean;
  onToggleAll: () => void;
  onCheck: (index: number) => void;
  onExample: () => void;
  onCriteria: () => void;
  onPieces: () => void;
  onOpenPiece: (piece: WorkshopPiece) => void;
  onChange: (id: string, value: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onFeedback: () => void;
}) {
  const last = props.index >= props.fields.length - 1;
  return (
    <div className="grid gap-6 pb-28 lg:grid-cols-[minmax(0,1fr)_280px] lg:pb-0">
      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-white/70">
            Question {props.fields.length ? props.index + 1 : 0}/{props.fields.length}
          </p>
          <p className="text-sm text-white/60" aria-live="polite">
            {props.saveState === "saving" ? "Enregistrement…" : props.saveState === "saved" ? <SavedMark /> : props.saveState === "error" ? "Enregistrement interrompu" : ""}
          </p>
        </div>
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-[#1A2340]">
          <div
            className="h-full rounded-full bg-[#6E5BFF] transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${props.fields.length ? ((props.index + 1) / props.fields.length) * 100 : 0}%` }}
          />
        </div>
        <button type="button" onClick={props.onToggleAll} className="mb-4 hidden text-sm font-semibold text-[#d9d4ff] underline-offset-4 hover:underline lg:inline">
          {props.showAll ? "Une question à la fois" : "Voir toutes les questions"}
        </button>
        <div className="flex flex-col gap-4">
          {(props.showAll ? props.fields : props.field ? [props.field] : []).map((field) => (
            <FieldCard key={field.id} field={field} value={props.answers[field.id] ?? ""} locked={props.locked} onChange={props.onChange} />
          ))}
        </div>
        {props.notice ? <p className="mt-3 text-sm text-[#E4A84A]">{props.notice}</p> : null}
        <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t border-[#1A2340] bg-[#0A0F1E]/95 p-4 backdrop-blur lg:static lg:mt-5 lg:border-0 lg:bg-transparent lg:p-0">
          {props.pieces.length > 0 ? (
            <button type="button" onClick={props.onPieces} className="inline-flex min-h-12 items-center rounded-full border border-[#26304F] px-4 text-sm font-semibold lg:hidden">
              Pièces
            </button>
          ) : null}
          <button type="button" onClick={props.onCriteria} className="inline-flex min-h-12 items-center rounded-full border border-[#26304F] px-4 text-sm font-semibold lg:hidden">
            Critères
          </button>
          <button type="button" onClick={props.onPrev} disabled={props.index === 0 || props.showAll} className="inline-flex min-h-12 items-center gap-1 rounded-full border border-[#26304F] px-4 text-sm font-semibold disabled:opacity-40">
            <ChevronLeft className="size-4" aria-hidden />
            Précédent
          </button>
          {last || props.showAll ? (
            <button type="button" onClick={props.onFeedback} disabled={!props.hasAnswer || props.busy || props.locked} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#6E5BFF] px-4 text-sm font-semibold text-white disabled:opacity-50">
              Obtenir mon retour
            </button>
          ) : (
            <button type="button" onClick={props.onNext} className="inline-flex min-h-12 flex-1 items-center justify-center gap-1 rounded-full bg-[#6E5BFF] px-4 text-sm font-semibold text-white">
              Suivant
              <ChevronRight className="size-4" aria-hidden />
            </button>
          )}
        </div>
      </div>
      <aside className="hidden h-fit flex-col gap-4 lg:flex">
        {props.pieces.length > 0 ? (
          <div className="rounded-[24px] border border-[#1A2340] bg-[#111831] p-5">
            <h3 className="text-sm font-semibold">Pièces</h3>
            <PieceList pieces={props.pieces} onOpen={props.onOpenPiece} />
          </div>
        ) : null}
        <div className="rounded-[24px] border border-[#1A2340] bg-[#111831] p-5">
          <h3 className="text-sm font-semibold">Ce qui sera regardé</h3>
          <p className="mt-1 text-xs text-white/50">Cochez pour vous. Ce n’est pas enregistré.</p>
          <CriteriaList criteria={props.criteria} checked={props.checked} onCheck={props.onCheck} />
          {props.example ? (
            <button type="button" onClick={props.onExample} className="mt-4 text-sm font-semibold text-[#d9d4ff] underline-offset-4 hover:underline">
              Voir un exemple
            </button>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function FieldCard({
  field,
  value,
  locked,
  onChange,
}: {
  field: WorkshopField;
  value: string;
  locked: boolean;
  onChange: (id: string, value: string) => void;
}) {
  const label = field.label.trim() || "Réponse";
  return (
    <label className="flex flex-col gap-3 rounded-[24px] border border-[#1A2340] bg-[#111831] p-5">
      <span className="text-lg font-semibold">{label}</span>
      {field.type === "short" ? (
        <input
          value={value}
          disabled={locked}
          aria-label={label}
          placeholder={field.placeholder || ""}
          onChange={(event) => onChange(field.id, event.target.value)}
          className="min-h-12 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-4 text-base text-[#F4F1EA] outline-none focus:border-[#6E5BFF] disabled:opacity-80"
        />
      ) : (
        <textarea
          value={value}
          disabled={locked}
          aria-label={label}
          placeholder={field.placeholder || ""}
          rows={6}
          onChange={(event) => onChange(field.id, event.target.value)}
          className="field-sizing-fixed min-h-36 w-full resize-y rounded-2xl border border-[#26304F] bg-[#0B1122] px-4 py-3 text-base text-[#F4F1EA] outline-none focus:border-[#6E5BFF] disabled:opacity-80"
        />
      )}
    </label>
  );
}

function PieceList({ pieces, onOpen }: { pieces: WorkshopPiece[]; onOpen: (piece: WorkshopPiece) => void }) {
  return (
    <ul className="mt-3 flex flex-col gap-2">
      {pieces.map((piece) => (
        <li key={piece.id}>
          <button
            type="button"
            onClick={() => onOpen(piece)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[#26304F] bg-[#0B1122] px-4 py-3 text-left"
          >
            <span className="text-sm font-semibold">{piece.titre}</span>
            <span className="shrink-0 text-xs text-[#d9d4ff]">{pieceKindLabel(piece)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function CriteriaList({
  criteria,
  checked,
  onCheck,
}: {
  criteria: string[];
  checked: Record<number, boolean>;
  onCheck: (index: number) => void;
}) {
  return (
    <ul className="mt-3 flex flex-col gap-2">
      {criteria.map((label, index) => (
        <li key={`${label}-${index}`}>
          <button
            type="button"
            aria-pressed={Boolean(checked[index])}
            onClick={() => onCheck(index)}
            className="flex w-full items-start gap-3 rounded-2xl px-1 py-2 text-left text-sm leading-relaxed hover:bg-white/5"
          >
            <span className={`mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-md border ${checked[index] ? "border-[#2FD08A] bg-[#2FD08A] text-[#062016]" : "border-[#26304F]"}`}>
              {checked[index] ? <Check className="size-3.5" aria-hidden /> : null}
            </span>
            {label}
          </button>
        </li>
      ))}
    </ul>
  );
}

function SavedMark() {
  return (
    <span className="inline-flex items-center gap-1 text-[#2FD08A] motion-safe:animate-pulse motion-reduce:animate-none">
      <Check className="size-3.5" aria-hidden />
      Enregistré
    </span>
  );
}

function Waiting({ message, reduceMotion }: { message: string; reduceMotion: boolean }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-[28px] border border-[#1A2340] bg-[#111831]" role="status">
      <span className={`size-12 rounded-full border-2 border-[#6E5BFF] border-t-transparent ${reduceMotion ? "" : "animate-spin"}`} />
      <p className="text-lg font-medium">{message}</p>
    </div>
  );
}

function FeedbackView(props: {
  feedback: Feedback;
  passed: number;
  total: number;
  remaining: number;
  remainingLabel: string;
  locked: boolean;
  busy: boolean;
  feedbackCount: number;
  notice: string;
  reduceMotion: boolean;
  motionTime: number;
  onRework: (label: string) => void;
  onImprove: () => void;
  onValidate: () => void;
}) {
  const ratio = props.total ? props.passed / props.total : 0;
  return (
    <div className="flex flex-col gap-4 pb-28 lg:pb-0">
      <div className="flex items-center gap-4 rounded-[28px] border border-[#1A2340] bg-[#111831] p-6">
        <div
          className="grid size-20 place-items-center rounded-full"
          style={{ background: `conic-gradient(#2FD08A ${ratio * 360}deg, #26304F 0deg)` }}
          aria-hidden
        >
          <span className="grid size-14 place-items-center rounded-full bg-[#111831] text-sm font-semibold">
            {props.passed}/{props.total}
          </span>
        </div>
        <p className="text-xl font-semibold">
          {props.passed} / {props.total} critères réussis
        </p>
      </div>
      {props.feedback.criteres.map((item, index) => {
        const passed = item.statut === "reussi";
        return (
          <motion.article
            key={`${item.critere}-${index}`}
            initial={props.reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: props.motionTime, delay: props.reduceMotion ? 0 : Math.min(index * 0.08, 0.4) }}
            className="workshop-feedback-card rounded-[24px] border p-5"
            data-status={passed ? "reussi" : "a_ameliorer"}
          >
            <p className="workshop-feedback-title font-semibold">{item.critere}</p>
            <p className="workshop-feedback-status mt-1 text-sm font-semibold" data-status={passed ? "reussi" : "a_ameliorer"}>
              {passed ? "Réussi" : "À améliorer"}
            </p>
            {item.commentaire ? <p className="workshop-feedback-body mt-2 whitespace-pre-wrap">{item.commentaire}</p> : null}
            {item.suggestion ? <p className="workshop-feedback-body mt-2 whitespace-pre-wrap">{item.suggestion}</p> : null}
            {!passed && !props.locked ? (
              <button type="button" onClick={() => props.onRework(item.critere)} className="workshop-feedback-rework mt-3 text-sm font-semibold underline-offset-4 hover:underline">
                Retravailler ce point
              </button>
            ) : null}
          </motion.article>
        );
      })}
      {props.feedback.commentaire_global ? <p className="workshop-feedback-note whitespace-pre-wrap text-base leading-relaxed">{props.feedback.commentaire_global}</p> : null}
      {props.notice ? <p className="text-sm text-[#E4A84A]">{props.notice}</p> : null}
      {props.locked ? null : (
        <div className="fixed inset-x-0 bottom-0 z-20 flex flex-col gap-2 border-t border-[#1A2340] bg-[#0A0F1E]/95 p-4 backdrop-blur sm:flex-row lg:static lg:border-0 lg:bg-transparent lg:p-0">
          {props.feedbackCount > 0 && props.remaining > 0 ? (
            <button type="button" disabled={props.busy} onClick={props.onImprove} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#6E5BFF] px-4 text-sm font-semibold text-white disabled:opacity-50">
              Améliorer ma réponse ({props.remainingLabel})
            </button>
          ) : null}
          <button type="button" disabled={props.busy} onClick={props.onValidate} className="workshop-feedback-validate inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-[#26304F] px-4 text-sm font-semibold disabled:opacity-50">
            {props.busy ? "Validation…" : "Valider ma réponse"}
          </button>
        </div>
      )}
    </div>
  );
}

function feedbackNotice(status: number, error?: string) {
  if (error === "Vous n'êtes pas inscrit à cette formation.") return error;
  if (error === "Nombre d'améliorations atteint.") return error;
  if (error === "Réponse IA invalide.") return error;
  if (error === "Le service IA ne répond pas.") return error;
  if (status === 403) return "Vous n'êtes pas inscrit à cette formation.";
  if (status === 409) return "Nombre d'améliorations atteint.";
  if (status === 502) return "Réponse IA invalide.";
  return "Le service IA ne répond pas.";
}

function Confirmed({ continueHref, preview, reduceMotion }: { continueHref?: string | null; preview?: boolean; reduceMotion: boolean }) {
  return (
    <div className="mx-auto flex min-h-[360px] max-w-lg flex-col items-center justify-center gap-5 text-center">
      <AnimatePresence>
        <motion.div
          initial={reduceMotion ? false : { y: 24, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.35 }}
          className="w-full rounded-[28px] border border-[#2FD08A]/40 bg-[#111831] px-6 py-8"
        >
          <p className="text-sm font-semibold text-[#2FD08A]">Mon projet expert</p>
          <p className="mt-3 text-2xl font-semibold">{preview ? "Aperçu : rien n'est ajouté à votre projet expert" : "Ajouté à votre projet expert"}</p>
        </motion.div>
      </AnimatePresence>
      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <Link href={PROJECT_HREF} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#6E5BFF] px-4 text-sm font-semibold text-white">
          Voir mon projet
        </Link>
        {continueHref ? (
          <Link href={continueHref} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-[#26304F] px-4 text-sm font-semibold">
            Continuer la formation
          </Link>
        ) : null}
      </div>
    </div>
  );
}
