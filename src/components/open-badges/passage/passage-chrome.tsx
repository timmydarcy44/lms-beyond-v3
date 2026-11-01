"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Check, Circle } from "lucide-react";
import { clearPassageMarks, PassageMarks, PassageNotes } from "@/components/open-badges/passage/passage-marks";
import "./passage-theme.css";

const PILL = { background: "var(--passage-action)", color: "var(--passage-action-text)" };

function usePassageTheme() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const id = "passage-mark-highlight-style";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = "::highlight(passage-mark){background-color:#f6d56a;color:#1c1e26}::highlight(passage-mark-pdf){background-color:rgb(246 213 106 / 0.55)}";
      document.head.appendChild(style);
    }
    const stored = window.localStorage.getItem("badge-passage-theme");
    if (stored === "light" || stored === "dark") setTheme(stored);
  }, []);
  const choose = (next: "dark" | "light") => {
    setTheme(next);
    try {
      window.localStorage.setItem("badge-passage-theme", next);
    } catch {
      /* ignore */
    }
  };
  return [theme, choose] as const;
}

export type PassageStep = {
  id: string;
  label: string;
  blurb: string;
  minutes: number;
  done: boolean;
  current: boolean;
};

export function PassageButton({
  children,
  onClick,
  disabled,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={PILL}
      className={`inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

function clock(seconds: number) {
  const safe = Math.max(0, seconds);
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

export function PassageFrame({
  badgeName,
  level,
  steps,
  secondsLeft,
  savedLabel,
  preview,
  onQuit,
  integrityQuit,
  children,
}: {
  badgeName: string;
  level: number;
  steps: PassageStep[];
  secondsLeft: number | null;
  savedLabel: string;
  preview: boolean;
  onQuit: () => void;
  integrityQuit: boolean;
  children: ReactNode;
}) {
  const [theme, chooseTheme] = usePassageTheme();
  const [notesOpen, setNotesOpen] = useState(true);
  const [confirm, setConfirm] = useState(false);
  const [readingOpen, setReadingOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [adapted, setAdapted] = useState(false);
  const [rewrite, setRewrite] = useState("");
  const [rewriting, setRewriting] = useState(false);
  const [readingError, setReadingError] = useState("");

  useEffect(() => () => clearPassageMarks(), []);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("badge-passage-reading") ?? "{}") as { scale?: number; adapted?: boolean };
      if (stored.scale && stored.scale >= 1 && stored.scale <= 1.5) setScale(stored.scale);
      if (stored.adapted) setAdapted(true);
    } catch {
      /* ignore */
    }
  }, []);

  const remember = (nextScale: number, nextAdapted: boolean) => {
    setScale(nextScale);
    setAdapted(nextAdapted);
    try {
      localStorage.setItem("badge-passage-reading", JSON.stringify({ scale: nextScale, adapted: nextAdapted }));
    } catch {
      /* ignore */
    }
  };

  const reformulate = async () => {
    const text = Array.from(document.querySelectorAll("[data-passage-prompt]"))
      .map((node) => node.textContent?.trim() ?? "")
      .filter((line) => line.length > 4)
      .join("\n\n");
    if (!text) return;
    setRewriting(true);
    setReadingError("");
    try {
      const response = await fetch("/api/ai/transform-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, action: "rephrase", options: { style: "simplify" } }),
      });
      const payload = await response.json();
      if (!response.ok || typeof payload.result !== "string") {
        setReadingError(payload.error ?? "Reformulation impossible");
        return;
      }
      setRewrite(payload.result.trim());
    } catch {
      setReadingError("Reformulation impossible");
    } finally {
      setRewriting(false);
    }
  };

  return (
    <div className="passage-root fixed inset-0 z-[200] flex bg-[#0B0C10] text-[#F2F2F5]" data-theme={theme}>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
      {preview ? (
        <p className="bg-[#15171E] px-4 py-1.5 text-center text-[11px] text-[#8A8FA3]">
          Essai privé. Rien n&apos;est enregistré. Le contrôle d&apos;intégrité est simulé.
        </p>
      ) : null}
      <header className="sticky top-0 z-10 bg-[#0B0C10]/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex flex-wrap items-center gap-4">
          <button type="button" onClick={() => setConfirm(true)} className="text-sm text-[#B4B8C8]">
            ‹ Quitter
          </button>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6E5BFF] text-xs font-semibold text-white">
            {badgeName.slice(0, 1)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{badgeName}</p>
            <p className="text-xs text-[#8A8FA3]">Open Badge · Niveau {level}</p>
          </div>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            {secondsLeft != null ? (
              <span className="rounded-full bg-[#15171E] px-3 py-1.5 text-xs text-[#F2F2F5]" aria-live="polite">
                {clock(secondsLeft)}
              </span>
            ) : null}
            <span className="rounded-full bg-[#15171E] px-3 py-1.5 text-xs text-[#2FD08A]">{savedLabel.replace("● ", "● ")}</span>
            <div className="flex rounded-full p-0.5 text-xs" style={{ background: "var(--passage-chip)" }}>
              <button type="button" onClick={() => chooseTheme("dark")} style={theme === "dark" ? PILL : undefined} className={`rounded-full px-2.5 py-1 ${theme === "dark" ? "" : "text-[#B4B8C8]"}`}>
                Sombre
              </button>
              <button type="button" onClick={() => chooseTheme("light")} style={theme === "light" ? PILL : undefined} className={`rounded-full px-2.5 py-1 ${theme === "light" ? "" : "text-[#B4B8C8]"}`}>
                Clair
              </button>
            </div>
            <button type="button" aria-expanded={readingOpen} onClick={() => setReadingOpen((open) => !open)} className="rounded-full bg-[#15171E] px-3 py-1.5 text-xs text-[#F2F2F5]">
              Aa
            </button>
          </div>
        </div>
        {readingOpen ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            {[1, 1.15, 1.3, 1.5].map((value) => (
              <button key={value} type="button" onClick={() => remember(value, adapted)} style={scale === value ? PILL : undefined} className={`rounded-full px-3 py-1 ${scale === value ? "" : "bg-[#15171E] text-[#B4B8C8]"}`}>
                {Math.round(value * 100)} %
              </button>
            ))}
            <button type="button" onClick={() => remember(scale, !adapted)} style={adapted ? PILL : undefined} className={`rounded-full px-3 py-1 ${adapted ? "" : "bg-[#15171E] text-[#B4B8C8]"}`}>
              {adapted ? "Typo adaptée" : "Typo standard"}
            </button>
            <button type="button" disabled={rewriting} onClick={() => void reformulate()} className="rounded-full bg-[#15171E] px-3 py-1 text-[#C9C2FF] disabled:opacity-50">
              {rewriting ? "Reformulation…" : "Reformuler"}
            </button>
            <button type="button" onClick={() => clearPassageMarks()} className="rounded-full bg-[#15171E] px-3 py-1 text-[#B4B8C8]">
              Effacer les prises de note
            </button>
            {readingError ? <span className="text-[#F2C15A]">{readingError}</span> : null}
          </div>
        ) : null}
        <div className="mt-3 flex justify-center gap-2 overflow-x-auto">
          {steps.map((step) => (
            <span
              key={step.id}
              style={step.current ? PILL : undefined}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs ${
                step.done
                  ? "bg-[#12352A] text-[#2FD08A]"
                  : step.current
                    ? ""
                    : "bg-[#15171E] text-[#8A8FA3]"
              }`}
            >
              {step.done ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
              {step.label}
            </span>
          ))}
        </div>
      </header>
      <div style={{ zoom: scale, fontFamily: adapted ? "OpenDyslexic, Verdana, sans-serif" : undefined, letterSpacing: adapted ? "0.04em" : undefined, lineHeight: adapted ? 1.65 : undefined }}>
        {rewrite ? (
          <aside className="mx-auto max-w-3xl px-4 pt-4 sm:px-6">
            <div className="rounded-3xl bg-[#15171E] p-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs text-[#8A8FA3]">Version reformulée</p>
                <button type="button" className="text-xs text-[#C9C2FF]" onClick={() => setRewrite("")}>Texte d&apos;origine</button>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{rewrite}</p>
            </div>
          </aside>
        ) : null}
        {children}
      </div>
      </div>
      <div className={`${notesOpen ? "max-h-[40vh]" : ""} overflow-y-auto border-t border-[#1E2130] bg-[#15171E] lg:hidden`}>
        <PassageNotes open={notesOpen} onOpenChange={setNotesOpen} placement="dock" />
      </div>
      </div>
      <aside className={`${notesOpen ? "w-80" : "w-14"} hidden min-h-0 shrink-0 overflow-y-auto border-l border-[#1E2130] bg-[#15171E] lg:block`}>
        <PassageNotes open={notesOpen} onOpenChange={setNotesOpen} placement="rail" />
      </aside>
      <PassageMarks />
      {confirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="max-w-md rounded-3xl bg-[#15171E] p-6">
            <p className="text-lg font-semibold">Quitter cette épreuve ?</p>
            <p className="mt-2 text-sm text-[#B4B8C8]">
              {integrityQuit
                ? "Quitter maintenant arrête l'épreuve et consomme une tentative."
                : "Votre progression est enregistrée. Vous pourrez reprendre cette épreuve tant que le temps n'est pas écoulé."}
            </p>
            <div className="mt-5 flex gap-3">
              <PassageButton onClick={onQuit}>Quitter</PassageButton>
              <button type="button" onClick={() => setConfirm(false)} className="text-sm text-[#B4B8C8]">
                Rester
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function PassageBriefing({
  steps,
  resume,
  attempts,
  retryDelayDays,
  reviewMonths,
  competencies,
  criteria,
  accommodationsOffered,
  onStart,
}: {
  steps: PassageStep[];
  resume: boolean;
  attempts: number;
  retryDelayDays: number;
  reviewMonths: number;
  competencies: string[];
  criteria: Array<{ label: string; outcome: string }>;
  accommodationsOffered: boolean;
  onStart: (accommodation: boolean) => void;
}) {
  const [accepted, setAccepted] = useState(false);
  const [accommodation, setAccommodation] = useState(false);
  const [showCriteria, setShowCriteria] = useState(false);
  const totalMin = steps.reduce((sum, step) => sum + step.minutes, 0);

  const hours = Math.floor(totalMin / 60);
  const remain = totalMin % 60;
  const durationLabel = hours > 0 ? `${hours} h ${remain || ""}`.trim() : `${totalMin} min`;

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 lg:grid-cols-[1.2fr_0.8fr] sm:px-6">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">{resume ? "Reprendre" : "Avant de commencer"}</h1>
        <p className="mt-3 max-w-xl text-[#B4B8C8]">
          {steps.length} épreuve{steps.length > 1 ? "s" : ""}, environ {durationLabel} au total. Vous pouvez faire une pause entre deux épreuves : votre progression est enregistrée.
        </p>
        <ol className="mt-6 space-y-3">
          {steps.map((step) => (
            <li key={step.id} className="flex items-center justify-between gap-4 rounded-2xl bg-[#15171E] px-4 py-3">
              <div>
                <p className="text-sm font-semibold">
                  {step.label}
                  {step.done ? <span className="ml-2 text-[#2FD08A]">Envoyée</span> : null}
                </p>
                <p className="mt-0.5 text-xs text-[#8A8FA3]">{step.blurb}</p>
              </div>
              <span className="shrink-0 text-sm text-[#B4B8C8]">{step.minutes} min</span>
            </li>
          ))}
        </ol>
        <section className="mt-4 rounded-2xl bg-[#15171E] p-4">
          <h2 className="text-sm font-semibold">Ce qui sera évalué</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {competencies.map((name) => (
              <span key={name} className="rounded-full bg-[#2A2458] px-3 py-1 text-xs text-[#C9C2FF]">
                {name}
              </span>
            ))}
          </div>
          <button type="button" onClick={() => setShowCriteria((value) => !value)} className="mt-3 text-sm text-[#C9C2FF]">
            {showCriteria ? "Masquer les critères" : `Voir les ${criteria.length || ""} critères et leurs attendus`.replace("  ", " ")}
          </button>
          {showCriteria
            ? criteria.map((item) => (
                <p key={item.label} className="mt-3 text-sm text-[#B4B8C8]">
                  <span className="text-[#F2F2F5]">{item.label}.</span> {item.outcome}
                </p>
              ))
            : null}
        </section>
      </div>
      <div className="space-y-4">
        <section className="rounded-2xl bg-[#15171E] p-4 text-sm text-[#B4B8C8]">
          <h2 className="text-sm font-semibold text-[#F2F2F5]">Les règles</h2>
          <ul className="mt-3 space-y-2">
            <li>Chaque épreuve a un temps affiché. À zéro, la réponse part telle quelle.</li>
            <li>
              {attempts} tentative{attempts > 1 ? "s" : ""} par épreuve, {retryDelayDays} jour{retryDelayDays > 1 ? "s" : ""} entre deux essais.
            </li>
            <li>Questionnaire et étude de cas : quitter la page arrête l&apos;épreuve et consomme une tentative. Une sortie de moins de 2 secondes est seulement notée.</li>
            <li>Votre travail est enregistré automatiquement. Les vidéos et les audios sont supprimés {reviewMonths} mois après la décision.</li>
          </ul>
        </section>
        {accommodationsOffered ? (
          <label className="flex items-center justify-between gap-4 rounded-2xl bg-[#15171E] p-4 text-sm">
            <span>
              <span className="block font-semibold">Besoin d&apos;un aménagement ?</span>
              <span className="mt-1 block text-[#8A8FA3]">Temps majoré d&apos;un tiers, ou réponse orale à la place de l&apos;écrit. À demander avant de commencer.</span>
            </span>
            <input type="checkbox" checked={accommodation} onChange={(event) => setAccommodation(event.target.checked)} className="h-5 w-5" />
          </label>
        ) : null}
        <section className="rounded-2xl bg-[#15171E] p-4">
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1" />
            <span>J&apos;ai compris que si je quitte la page pendant le questionnaire ou l&apos;étude de cas, l&apos;épreuve s&apos;arrête et la tentative est perdue.</span>
          </label>
          <PassageButton disabled={!accepted} onClick={() => onStart(accommodation)} className="mt-4 w-full">
            {resume ? "Reprendre l'épreuve" : "Commencer la première épreuve"}
          </PassageButton>
        </section>
      </div>
    </div>
  );
}

export function PassageStopped({
  attemptsLeft,
  retryDate,
  onLeave,
  onContinue,
}: {
  attemptsLeft: number;
  retryDate: string;
  onLeave: () => void;
  onContinue?: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold">L&apos;épreuve s&apos;est arrêtée</h1>
      <p className="mt-3 text-[#B4B8C8]">
        L&apos;épreuve s&apos;est arrêtée parce que vous avez quitté la page. Il vous reste {attemptsLeft} tentative
        {attemptsLeft > 1 ? "s" : ""}, disponible le {retryDate}.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        {onContinue ? <PassageButton onClick={onContinue}>Continuer l'essai</PassageButton> : null}
        <PassageButton onClick={onLeave}>Retour à mon espace</PassageButton>
      </div>
    </div>
  );
}

export function PassageDone({
  expertName,
  resultDate,
  steps,
  onLeave,
  preview,
}: {
  expertName: string;
  resultDate: string;
  steps: PassageStep[];
  onLeave: () => void;
  preview: boolean;
}) {
  const [theme] = usePassageTheme();
  return (
    <div className="passage-root min-h-screen bg-[#0B0C10] px-6 py-16 text-center text-[#F2F2F5]" data-theme={theme}>
      <div className="mx-auto max-w-lg">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#2FD08A]/20 text-2xl text-[#2FD08A]">
        ✓
      </div>
      <h1 className="mt-4 text-3xl font-semibold">C&apos;est envoyé</h1>
      <p className="mt-3 text-[#B4B8C8]">
        {preview
          ? "Essai terminé. Rien n'est enregistré et aucun badge n'est délivré."
          : `${expertName} vous répond au plus tard le ${resultDate}. Le résultat arrive par e-mail, critère par critère.`}
      </p>
      <ul className="mt-8 space-y-2 text-left text-sm">
        {steps.map((step) => (
          <li key={step.id} className="flex justify-between rounded-2xl bg-[#15171E] px-4 py-3">
            <span>{step.label}</span>
            <span className="text-[#2FD08A]">Envoyée</span>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <PassageButton onClick={onLeave}>Retour à mon espace</PassageButton>
      </div>
      </div>
    </div>
  );
}
