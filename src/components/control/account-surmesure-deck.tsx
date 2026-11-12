"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Mail, X } from "lucide-react";
import type { SurMesureCourse } from "@/lib/training-courses/surmesure-ui";
import { splitPrerequisites } from "@/lib/training-courses/surmesure-ui";
import { buildSessionPlan } from "@/lib/training-courses/surmesure-planning";
import { fieldClass } from "./chrome";

const BG = "#070412";
const TEXT = "#F7F5FF";
const MUTED = "#B7A9D9";
const PURPLE = "#7B61FF";
const PURPLE_DEEP = "#5B3DF5";
const CARD = "rgba(28, 18, 52, 0.55)";
const CARD_BORDER = "rgba(167, 139, 250, 0.22)";

type Slide =
  | { id: string; kind: "cover" }
  | { id: string; kind: "intent" }
  | { id: string; kind: "objectives" }
  | { id: string; kind: "audience" }
  | { id: string; kind: "slot"; slotIndex: number }
  | { id: string; kind: "skills" }
  | { id: string; kind: "close" };

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[12px] font-semibold uppercase tracking-[0.22em]"
      style={{ color: "#C4B5FD" }}
    >
      {children}
    </p>
  );
}

function Glass({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[28px] p-5 backdrop-blur-xl sm:p-6 ${className}`}
      style={{
        background: CARD,
        border: `1px solid ${CARD_BORDER}`,
        boxShadow: "0 24px 80px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      {children}
    </div>
  );
}

export function AccountSurMesureDeck({
  organizationId,
  organizationName,
  course,
  defaultEmail,
  defaultName,
  onClose,
}: {
  organizationId: string;
  organizationName: string;
  course: SurMesureCourse;
  defaultEmail?: string | null;
  defaultName?: string | null;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [sendOpen, setSendOpen] = useState(false);
  const [to, setTo] = useState(defaultEmail?.trim() || "");
  const [name, setName] = useState(defaultName?.trim() || "");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendOk, setSendOk] = useState<string | null>(null);
  const [animKey, setAnimKey] = useState(0);

  const prerequisites = useMemo(
    () => splitPrerequisites(course.prerequisites).filter(Boolean),
    [course.prerequisites],
  );
  const objectives = useMemo(
    () => (course.objectives ?? []).filter(Boolean),
    [course.objectives],
  );
  const skills = useMemo(() => (course.skills ?? []).filter(Boolean), [course.skills]);
  const audience = useMemo(() => (course.audience ?? []).filter(Boolean), [course.audience]);
  const plan = useMemo(
    () => buildSessionPlan(course.program_structure ?? [], course.duration),
    [course.program_structure, course.duration],
  );

  const slides = useMemo<Slide[]>(() => {
    const out: Slide[] = [{ id: "cover", kind: "cover" }];
    if (course.short_description?.trim()) out.push({ id: "intent", kind: "intent" });
    if (objectives.length) out.push({ id: "objectives", kind: "objectives" });
    if (audience.length || prerequisites.length) out.push({ id: "audience", kind: "audience" });
    plan.forEach((slot, slotIndex) => {
      if (slot.sections.length) out.push({ id: `slot-${slotIndex}`, kind: "slot", slotIndex });
    });
    if (skills.length) out.push({ id: "skills", kind: "skills" });
    out.push({ id: "close", kind: "close" });
    return out;
  }, [course.short_description, objectives, audience, prerequisites, plan, skills]);

  const total = slides.length;
  const slide = slides[index] ?? slides[0];
  const progress = total ? Math.round(((index + 1) / total) * 100) : 0;

  function go(delta: number) {
    setIndex((i) => {
      const next = Math.min(total - 1, Math.max(0, i + delta));
      if (next !== i) setAnimKey((k) => k + 1);
      return next;
    });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (sendOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        go(1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sendOpen, total, onClose]);

  async function sendPresentation() {
    if (!to.includes("@")) {
      setSendError("E-mail invalide.");
      return;
    }
    setSending(true);
    setSendError(null);
    setSendOk(null);
    try {
      const res = await fetch(
        `/api/super/comptes-clients/${organizationId}/surmesure/${course.id}/presentation/send`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: to.trim(),
            name: name.trim() || undefined,
            message: message.trim() || undefined,
          }),
        },
      );
      const json = (await res.json()) as { error?: string; sent_to?: string };
      if (!res.ok) throw new Error(json.error || "Envoi impossible");
      setSendOk(`Présentation envoyée à ${json.sent_to || to}.`);
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "Envoi impossible");
    } finally {
      setSending(false);
    }
  }

  const currentSlot = slide?.kind === "slot" ? plan[slide.slotIndex] : null;
  const metaBits = [course.duration, course.level, course.domain].filter(Boolean);

  return (
    <div className="fixed inset-0 z-[80] overflow-hidden" style={{ background: BG, color: TEXT }}>
      <style>{`@keyframes surmesureDeckIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-40 h-[28rem] w-[28rem] rounded-full blur-3xl"
        style={{ background: "rgba(123, 97, 255, 0.42)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-28 h-[30rem] w-[30rem] rounded-full blur-3xl"
        style={{ background: "rgba(236, 72, 153, 0.22)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-[42%] top-[18%] h-80 w-80 -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "rgba(99, 102, 241, 0.16)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      <div className="relative flex h-full flex-col">
        <header className="flex items-center justify-between gap-3 px-5 py-4 sm:px-10">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold"
                style={{
                  background: `linear-gradient(145deg, ${PURPLE}, ${PURPLE_DEEP})`,
                  boxShadow: "0 0 24px rgba(123,97,255,0.45)",
                }}
              >
                B
              </span>
              <p className="truncate text-sm font-medium" style={{ color: MUTED }}>
                {organizationName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSendOpen(true);
                setSendError(null);
                setSendOk(null);
              }}
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition hover:bg-white/10"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <Mail className="h-4 w-4" /> Envoyer
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 transition hover:bg-white/10"
              style={{ background: "rgba(255,255,255,0.06)" }}
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="px-5 sm:px-10">
          <div className="h-[3px] overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${Math.max(progress, 6)}%`,
                background: `linear-gradient(90deg, ${PURPLE}, #C084FC)`,
                boxShadow: "0 0 16px rgba(123,97,255,0.55)",
              }}
            />
          </div>
        </div>

        <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-8 sm:px-12">
          <div
            key={animKey}
            style={{
              animation: "surmesureDeckIn 420ms ease-out",
            }}
          >
            {slide?.kind === "cover" ? (
              <div className="space-y-8">
                <Eyebrow>Sur-mesure</Eyebrow>
                <h1 className="max-w-[15ch] text-[48px] font-semibold leading-[0.98] tracking-[-0.045em] sm:text-[72px] lg:text-[84px]">
                  {course.title}
                </h1>
                {metaBits.length ? (
                  <div className="flex flex-wrap gap-2">
                    {metaBits.map((bit) => (
                      <span
                        key={bit}
                        className="rounded-full px-3.5 py-1.5 text-sm font-medium"
                        style={{
                          background: "rgba(123,97,255,0.14)",
                          border: "1px solid rgba(167,139,250,0.28)",
                          color: "#E8DEFF",
                        }}
                      >
                        {bit}
                      </span>
                    ))}
                  </div>
                ) : null}
                <p className="max-w-xl text-base sm:text-lg" style={{ color: MUTED }}>
                  Une formation construite avec {organizationName}.
                </p>
              </div>
            ) : null}

            {slide?.kind === "intent" ? (
              <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
                <div className="space-y-5">
                  <Eyebrow>Intention</Eyebrow>
                  <h2 className="text-[40px] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[58px]">
                    Pourquoi
                    <br />
                    cette formation
                  </h2>
                </div>
                <Glass>
                  <p className="text-[22px] font-medium leading-relaxed tracking-[-0.02em] sm:text-[28px]">
                    {course.short_description}
                  </p>
                </Glass>
              </div>
            ) : null}

            {slide?.kind === "objectives" ? (
              <div className="space-y-8">
                <div className="space-y-4">
                  <Eyebrow>Objectifs</Eyebrow>
                  <h2 className="max-w-[12ch] text-[40px] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[58px]">
                    Ce que vos équipes sauront faire
                  </h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {objectives.map((item, i) => (
                    <Glass key={item} className="!p-5">
                      <div className="flex gap-4">
                        <span
                          className="text-2xl font-semibold tabular-nums"
                          style={{ color: PURPLE }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <p className="text-[17px] font-medium leading-snug sm:text-[19px]">{item}</p>
                      </div>
                    </Glass>
                  ))}
                </div>
              </div>
            ) : null}

            {slide?.kind === "audience" ? (
              <div className="space-y-8">
                <div className="space-y-4">
                  <Eyebrow>Cadre</Eyebrow>
                  <h2 className="text-[40px] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[58px]">
                    Pour qui · avec quels prérequis
                  </h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Glass>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C4B5FD]">
                      Public
                    </p>
                    <ul className="mt-5 space-y-3">
                      {(audience.length ? audience : ["À préciser"]).map((item) => (
                        <li key={item} className="text-[18px] font-medium leading-snug sm:text-[20px]">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </Glass>
                  <Glass>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C4B5FD]">
                      Prérequis
                    </p>
                    <ul className="mt-5 space-y-3">
                      {(prerequisites.length ? prerequisites : ["Aucun"]).map((item) => (
                        <li key={item} className="text-[18px] font-medium leading-snug sm:text-[20px]">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </Glass>
                </div>
                {course.specific_needs ? (
                  <Glass className="!bg-[rgba(123,97,255,0.12)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C4B5FD]">
                      Adaptations
                    </p>
                    <p className="mt-3 text-[17px] font-medium leading-relaxed">{course.specific_needs}</p>
                  </Glass>
                ) : null}
              </div>
            ) : null}

            {slide?.kind === "slot" && currentSlot ? (
              <div className="space-y-8">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div className="space-y-4">
                    <Eyebrow>{currentSlot.label}</Eyebrow>
                    <h2 className="text-[40px] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[58px]">
                      Au programme
                    </h2>
                  </div>
                  <p className="text-sm font-medium" style={{ color: MUTED }}>
                    {currentSlot.sections.length} section
                    {currentSlot.sections.length > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="grid gap-4">
                  {currentSlot.sections.map((section, localIdx) => (
                    <Glass key={section.id}>
                      <div className="flex flex-wrap items-start gap-4 sm:gap-6">
                        <span
                          className="text-3xl font-semibold tabular-nums sm:text-4xl"
                          style={{
                            background: `linear-gradient(180deg, ${PURPLE}, #C084FC)`,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                          }}
                        >
                          {String((currentSlot.sectionIndexes[localIdx] ?? localIdx) + 1).padStart(
                            2,
                            "0",
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[22px] font-semibold tracking-[-0.02em] sm:text-[26px]">
                            {section.title}
                          </p>
                          {section.description ? (
                            <p className="mt-2 text-[15px] leading-relaxed sm:text-base" style={{ color: MUTED }}>
                              {section.description}
                            </p>
                          ) : null}
                          <div className="mt-4 flex flex-wrap gap-2">
                            {section.chapters.slice(0, 5).map((chapter) => (
                              <span
                                key={chapter.id}
                                className="rounded-full px-3 py-1 text-[12px] font-medium sm:text-[13px]"
                                style={{
                                  background: "rgba(255,255,255,0.05)",
                                  border: "1px solid rgba(255,255,255,0.08)",
                                  color: MUTED,
                                }}
                              >
                                {chapter.title}
                              </span>
                            ))}
                            {section.chapters.length > 5 ? (
                              <span className="rounded-full px-3 py-1 text-[12px]" style={{ color: MUTED }}>
                                +{section.chapters.length - 5}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </Glass>
                  ))}
                </div>
              </div>
            ) : null}

            {slide?.kind === "skills" ? (
              <div className="space-y-8">
                <div className="space-y-4">
                  <Eyebrow>Compétences</Eyebrow>
                  <h2 className="max-w-[14ch] text-[40px] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[58px]">
                    Des acquis concrets
                  </h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  {skills.map((item) => (
                    <span
                      key={item}
                      className="rounded-full px-5 py-3 text-[15px] font-medium sm:text-[17px]"
                      style={{
                        background: "rgba(123,97,255,0.14)",
                        border: "1px solid rgba(167,139,250,0.28)",
                        boxShadow: "0 0 30px rgba(123,97,255,0.08)",
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {slide?.kind === "close" ? (
              <div className="mx-auto max-w-3xl space-y-8 text-center">
                <div
                  className="mx-auto grid h-16 w-16 place-items-center rounded-full text-2xl font-bold"
                  style={{
                    background: `linear-gradient(145deg, ${PURPLE}, ${PURPLE_DEEP})`,
                    boxShadow: "0 0 48px rgba(123,97,255,0.5)",
                  }}
                >
                  ✓
                </div>
                <Eyebrow>Merci</Eyebrow>
                <h2 className="text-[40px] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[60px]">
                  Le parcours est posé.
                  <br />
                  La suite, à votre rythme.
                </h2>
                <p className="mx-auto max-w-xl text-base leading-relaxed sm:text-lg" style={{ color: MUTED }}>
                  On pourra affiner le cadre (dates, formateur, modalités) quand vous serez prêts.
                  Rien n’est figé pour l’instant.
                </p>
              </div>
            ) : null}
          </div>
        </main>

        <footer className="flex items-center justify-between gap-3 px-5 py-5 sm:px-10">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={index === 0}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold disabled:opacity-25"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Précédent</span>
          </button>
          <div className="flex items-center gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Slide ${i + 1}`}
                onClick={() => {
                  setIndex(i);
                  setAnimKey((k) => k + 1);
                }}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: i === index ? 22 : 6,
                  background: i === index ? PURPLE : "rgba(255,255,255,0.2)",
                }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => (index >= total - 1 ? onClose() : go(1))}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white"
            style={{
              background: `linear-gradient(145deg, ${PURPLE}, ${PURPLE_DEEP})`,
              boxShadow: "0 10px 30px rgba(123,97,255,0.35)",
            }}
          >
            {index >= total - 1 ? "Terminer" : "Continuer"}
            {index >= total - 1 ? null : <ChevronRight className="h-4 w-4" />}
          </button>
        </footer>
      </div>

      {sendOpen ? (
        <div className="absolute inset-0 z-10 flex items-end justify-center bg-black/65 p-4 backdrop-blur-sm sm:items-center">
          <div
            className="w-full max-w-md rounded-[28px] p-5 shadow-2xl"
            style={{
              background: "rgba(20, 12, 40, 0.96)",
              border: `1px solid ${CARD_BORDER}`,
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold tracking-tight">Envoyer la présentation</h3>
              <button type="button" onClick={() => setSendOpen(false)} className="text-sm" style={{ color: MUTED }}>
                Fermer
              </button>
            </div>
            <p className="mt-2 text-sm" style={{ color: MUTED }}>
              Un récap soigné : intention, objectifs, planning et compétences.
            </p>
            <div className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block" style={{ color: MUTED }}>
                  Destinataire
                </span>
                <input
                  className={fieldClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Camille Martin"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block" style={{ color: MUTED }}>
                  E-mail
                </span>
                <input
                  className={fieldClass}
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="client@entreprise.fr"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block" style={{ color: MUTED }}>
                  Note personnelle (optionnel)
                </span>
                <textarea
                  className={fieldClass}
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Suite à notre échange de ce matin…"
                />
              </label>
            </div>
            {sendError ? <p className="mt-3 text-sm text-[#FF8A9B]">{sendError}</p> : null}
            {sendOk ? <p className="mt-3 text-sm text-[#6BE39B]">{sendOk}</p> : null}
            <button
              type="button"
              disabled={sending}
              onClick={() => void sendPresentation()}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: `linear-gradient(145deg, ${PURPLE}, ${PURPLE_DEEP})` }}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Envoyer par e-mail
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
