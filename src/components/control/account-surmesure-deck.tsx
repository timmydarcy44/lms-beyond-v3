"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Mail, X } from "lucide-react";
import type { SurMesureCourse } from "@/lib/training-courses/surmesure-ui";
import { splitPrerequisites } from "@/lib/training-courses/surmesure-ui";
import { buildSessionPlan } from "@/lib/training-courses/surmesure-planning";
import { fieldClass } from "./chrome";

const BG = "#0A0618";
const TEXT = "#F7F5FF";
const MUTED = "#B7A9D9";
const PURPLE = "#7B61FF";

type Slide =
  | { id: string; kind: "cover" }
  | { id: string; kind: "intent" }
  | { id: string; kind: "objectives" }
  | { id: string; kind: "audience" }
  | { id: string; kind: "slot"; slotIndex: number }
  | { id: string; kind: "skills" }
  | { id: string; kind: "close" };

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
    setIndex((i) => Math.min(total - 1, Math.max(0, i + delta)));
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

  return (
    <div className="fixed inset-0 z-[80]" style={{ background: BG, color: TEXT }}>
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full blur-3xl"
        style={{ background: "rgba(123, 97, 255, 0.45)", opacity: 0.55 }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-20 h-80 w-80 rounded-full blur-3xl"
        style={{ background: "rgba(236, 72, 153, 0.28)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "rgba(99, 102, 241, 0.18)" }}
      />

      <div className="relative flex h-full flex-col">
        <header className="flex items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C4B8FF]">
              Byound · Sur-mesure
            </p>
            <p className="truncate text-sm" style={{ color: MUTED }}>
              {organizationName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSendOpen(true);
                setSendError(null);
                setSendOk(null);
              }}
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <Mail className="h-4 w-4" /> Envoyer
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2"
              style={{ background: "rgba(255,255,255,0.08)" }}
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="px-5 sm:px-8">
          <div className="h-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, background: PURPLE }}
            />
          </div>
        </div>

        <main className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-8 sm:px-10">
          {slide?.kind === "cover" ? (
            <div className="space-y-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#C4B8FF]">
                Formation Sur-mesure
              </p>
              <h1 className="max-w-4xl text-[42px] font-extrabold leading-[1.05] tracking-[-1.6px] sm:text-[64px]">
                {course.title}
              </h1>
              <p className="max-w-2xl text-lg sm:text-xl" style={{ color: MUTED }}>
                {[course.duration, course.level, course.domain].filter(Boolean).join(" · ")}
              </p>
            </div>
          ) : null}

          {slide?.kind === "intent" ? (
            <div className="space-y-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#C4B8FF]">
                Intention
              </p>
              <h2 className="max-w-4xl text-[36px] font-extrabold leading-[1.1] tracking-[-1px] sm:text-[52px]">
                Ce que nous construisons ensemble
              </h2>
              <p className="max-w-3xl text-lg leading-relaxed sm:text-2xl" style={{ color: MUTED }}>
                {course.short_description}
              </p>
            </div>
          ) : null}

          {slide?.kind === "objectives" ? (
            <div className="space-y-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#C4B8FF]">
                Objectifs pédagogiques
              </p>
              <h2 className="text-[34px] font-extrabold tracking-[-1px] sm:text-[48px]">
                À la fin du parcours
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {objectives.map((item) => (
                  <li
                    key={item}
                    className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4 text-base sm:text-lg"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {slide?.kind === "audience" ? (
            <div className="space-y-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#C4B8FF]">
                Cadre Qualiopi
              </p>
              <h2 className="text-[34px] font-extrabold tracking-[-1px] sm:text-[48px]">
                Public & prérequis
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#C4B8FF]">
                    Public
                  </p>
                  <ul className="mt-3 space-y-2 text-base sm:text-lg">
                    {(audience.length ? audience : ["À préciser"]).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#C4B8FF]">
                    Prérequis
                  </p>
                  <ul className="mt-3 space-y-2 text-base sm:text-lg">
                    {(prerequisites.length ? prerequisites : ["Aucun"]).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
              {course.specific_needs ? (
                <p className="rounded-[22px] border border-[#7B61FF]/30 bg-[#7B61FF]/10 px-4 py-3 text-sm sm:text-base">
                  {course.specific_needs}
                </p>
              ) : null}
            </div>
          ) : null}

          {slide?.kind === "slot" && currentSlot ? (
            <div className="space-y-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#C4B8FF]">
                {currentSlot.label}
              </p>
              <h2 className="text-[34px] font-extrabold tracking-[-1px] sm:text-[48px]">
                Au programme
              </h2>
              <div className="space-y-4">
                {currentSlot.sections.map((section, localIdx) => (
                  <div
                    key={section.id}
                    className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5"
                  >
                    <p className="text-xs uppercase tracking-wide" style={{ color: MUTED }}>
                      Section {(currentSlot.sectionIndexes[localIdx] ?? localIdx) + 1}
                    </p>
                    <p className="mt-1 text-xl font-extrabold sm:text-2xl">{section.title}</p>
                    {section.description ? (
                      <p className="mt-2 text-sm sm:text-base" style={{ color: MUTED }}>
                        {section.description}
                      </p>
                    ) : null}
                    <ul className="mt-3 space-y-1.5 text-sm sm:text-base" style={{ color: MUTED }}>
                      {section.chapters.slice(0, 6).map((chapter) => (
                        <li key={chapter.id}>→ {chapter.title}</li>
                      ))}
                      {section.chapters.length > 6 ? (
                        <li>+ {section.chapters.length - 6} autres chapitres</li>
                      ) : null}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {slide?.kind === "skills" ? (
            <div className="space-y-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#C4B8FF]">
                Compétences
              </p>
              <h2 className="text-[34px] font-extrabold tracking-[-1px] sm:text-[48px]">
                Ce qu’ils sauront faire
              </h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm sm:text-base"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {slide?.kind === "close" ? (
            <div className="space-y-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#C4B8FF]">
                Suite
              </p>
              <h2 className="max-w-4xl text-[36px] font-extrabold leading-[1.08] tracking-[-1.2px] sm:text-[56px]">
                Prêts à finaliser le devis
              </h2>
              <p className="max-w-2xl text-lg sm:text-xl" style={{ color: MUTED }}>
                Le tarif sera calé selon le formateur retenu et les compétences à animer. La
                structure pédagogique est déjà posée avec vous.
              </p>
            </div>
          ) : null}
        </main>

        <footer className="flex items-center justify-between gap-3 px-5 py-5 sm:px-8">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={index === 0}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-30"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <ChevronLeft className="h-4 w-4" /> Précédent
          </button>
          <p className="text-xs font-semibold" style={{ color: MUTED }}>
            {index + 1} / {total}
          </p>
          <button
            type="button"
            onClick={() => (index >= total - 1 ? onClose() : go(1))}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white"
            style={{ background: PURPLE }}
          >
            {index >= total - 1 ? "Fermer" : "Suivant"}
            {index >= total - 1 ? null : <ChevronRight className="h-4 w-4" />}
          </button>
        </footer>
      </div>

      {sendOpen ? (
        <div className="absolute inset-0 z-10 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#140F28] p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-extrabold">Envoyer la présentation</h3>
              <button type="button" onClick={() => setSendOpen(false)} className="text-sm text-[#B7A9D9]">
                Fermer
              </button>
            </div>
            <p className="mt-2 text-sm" style={{ color: MUTED }}>
              Un e-mail soigné avec objectifs, planning et compétences.
            </p>
            <div className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block text-[#B7A9D9]">Destinataire</span>
                <input
                  className={fieldClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Camille Martin"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-[#B7A9D9]">E-mail</span>
                <input
                  className={fieldClass}
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="client@entreprise.fr"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-[#B7A9D9]">Note personnelle (optionnel)</span>
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
              style={{ background: PURPLE }}
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
