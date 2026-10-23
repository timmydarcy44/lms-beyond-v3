"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Atkinson_Hyperlegible, Manrope } from "next/font/google";
import { ChevronLeft, ChevronRight, Gamepad2, List, ListChecks, Lock, MessagesSquare, MoreHorizontal } from "lucide-react";
import "./lesson-reader.css";

const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const atkinson = Atkinson_Hyperlegible({ subsets: ["latin"], weight: ["400", "700"] });

const THEME_KEY = "lesson-reading-theme";
type ThemeChoice = "auto" | "light" | "dark";
type ReadingTheme = "dark" | "light" | "dys";

export type ReaderLeaf = {
  id: string;
  href: string;
  title: string;
  status: "done" | "current" | "todo" | "locked";
  percent?: number | null;
  mark?: "quiz" | "game" | "interview";
};

export type ReaderPart = {
  id: string;
  title: string;
  href?: string;
  done: number;
  total: number;
  items: ReaderLeaf[];
};

type Props = {
  backHref: string;
  kicker: string;
  partTitle: string;
  courseTitle: string;
  chapterTitle: string;
  chapterDone: number;
  chapterTotal: number;
  chapterPercent: number;
  chip: string;
  heading: string;
  segments: Array<"done" | "current" | "todo">;
  index: number;
  total: number;
  prevDisabled: boolean;
  nextLabel: string;
  onPrev: () => void;
  onNext: () => void;
  dyslexia: boolean;
  onToggleDyslexia: () => void;
  onOpenStrategy: () => void;
  parts: ReaderPart[];
  initialOpenPartId: string | null;
  children: ReactNode;
};

function readThemeChoice(): ThemeChoice {
  try {
    const value = localStorage.getItem(THEME_KEY);
    if (value === "light" || value === "dark" || value === "auto") return value;
  } catch {
    /* ignore */
  }
  return "auto";
}

export function LessonReaderShell({
  backHref,
  kicker,
  partTitle,
  courseTitle,
  chapterTitle,
  chapterDone,
  chapterTotal,
  chapterPercent,
  chip,
  heading,
  segments,
  index,
  total,
  prevDisabled,
  nextLabel,
  onPrev,
  onNext,
  dyslexia,
  onToggleDyslexia,
  onOpenStrategy,
  parts,
  initialOpenPartId,
  children,
}: Props) {
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const mainRef = useRef<HTMLElement | null>(null);
  const [readProgress, setReadProgress] = useState(0);
  const [stageBox, setStageBox] = useState({ left: 0, width: 0 });
  const [choice, setChoice] = useState<ThemeChoice>("auto");
  const [systemDark, setSystemDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [desktopOutline, setDesktopOutline] = useState(true);
  const [openPartId, setOpenPartId] = useState<string | null>(initialOpenPartId);

  useEffect(() => {
    setChoice(readThemeChoice());
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => setSystemDark(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    setOpenPartId(initialOpenPartId);
  }, [initialOpenPartId]);

  useEffect(() => {
    const update = () => {
      const stage = stageRef.current;
      const main = mainRef.current;
      if (!stage || !main) return;
      const box = stage.getBoundingClientRect();
      setStageBox({ left: box.left, width: box.width });
      const total = main.offsetHeight - window.innerHeight;
      if (total <= 8) {
        setReadProgress(1);
        return;
      }
      const top = main.getBoundingClientRect().top + window.scrollY;
      setReadProgress(Math.min(1, Math.max(0, (window.scrollY - top) / total)));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [heading, children]);

  const theme: ReadingTheme = dyslexia ? "dys" : choice === "auto" ? (systemDark ? "dark" : "light") : choice;

  const choose = (next: ThemeChoice) => {
    setChoice(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* ignore */
    }
    setMenuOpen(false);
  };

  useEffect(() => {
    if (!sheetOpen) return;
    const node = sheetRef.current;
    const previous = document.activeElement as HTMLElement | null;
    const focusable = () =>
      Array.from(node?.querySelectorAll<HTMLElement>("a, button, [tabindex]:not([tabindex='-1'])") ?? []).filter(
        (item) => !item.hasAttribute("disabled"),
      );
    focusable()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSheetOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [sheetOpen]);

  const outline = (
    <>
      <article className="lesson-reader__progress-card">
        <header>
          <h3>{chapterTitle}</h3>
          <span>
            {chapterPercent} % · {chapterDone}/{chapterTotal}
          </span>
        </header>
        <i>
          <b style={{ width: `${Math.max(0, Math.min(100, chapterPercent))}%` }} />
        </i>
      </article>
      {parts.map((part) => {
        const open = openPartId === part.id;
        return (
          <div key={part.id}>
            <div className="lesson-reader__part-btn" data-open={open || undefined}>
              <button
                type="button"
                className="lesson-reader__part-toggle"
                aria-expanded={open}
                aria-label={open ? "Replier" : "Déployer"}
                onClick={() => setOpenPartId(open ? null : part.id)}
              >
                <ChevronRight className="lesson-reader__chevron" size={16} strokeWidth={2} aria-hidden />
              </button>
              {part.href ? (
                <Link href={part.href} className="lesson-reader__part-link">
                  <strong>{part.title}</strong>
                </Link>
              ) : (
                <button type="button" className="lesson-reader__part-link" onClick={() => setOpenPartId(open ? null : part.id)}>
                  <strong>{part.title}</strong>
                </button>
              )}
              <em>
                {part.done}/{part.total}
              </em>
            </div>
            {open ? (
              <ul className="lesson-reader__leaves">
                {part.items.map((item) => (
                  <li key={item.id}>
                    <Link href={item.href} aria-current={item.status === "current" ? "page" : undefined} onClick={() => setSheetOpen(false)}>
                      {item.mark ? (
                        <span className="lesson-reader__mark" data-mark={item.mark} aria-hidden>
                          {item.mark === "quiz" ? (
                            <ListChecks size={13} strokeWidth={2} />
                          ) : item.mark === "game" ? (
                            <Gamepad2 size={13} strokeWidth={2} />
                          ) : (
                            <MessagesSquare size={13} strokeWidth={2} />
                          )}
                        </span>
                      ) : item.status === "locked" ? (
                        <Lock size={14} strokeWidth={2} aria-hidden />
                      ) : (
                        <i className="lesson-reader__dot" data-status={item.status} />
                      )}
                      <b>{item.title}</b>
                      <small data-status={item.status}>
                        {item.status === "done"
                          ? "Terminé"
                          : item.status === "current"
                            ? item.percent
                              ? `${item.percent} %`
                              : "En cours"
                            : item.status === "locked"
                              ? "Verrouillé"
                              : item.percent
                                ? `${item.percent} %`
                                : "À faire"}
                      </small>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
    </>
  );

  return (
    <div
      className={`lesson-reader ${manrope.className}`}
      data-reading-theme={theme}
      style={{ ["--font-reader" as string]: manrope.style.fontFamily, ["--font-dys" as string]: atkinson.style.fontFamily }}
    >
      {desktopOutline ? (
        <aside className="lesson-reader__sidebar" aria-label="Sommaire">
          <h2 className="lesson-reader__h1" style={{ fontSize: 20, margin: 0 }}>
            Sommaire
          </h2>
          <p className="lesson-reader__kicker">{courseTitle}</p>
          {outline}
        </aside>
      ) : null}
      <div className="lesson-reader__stage" ref={stageRef}>
        <div className="lesson-reader__progress" style={{ left: stageBox.left, width: stageBox.width || "100%" }} aria-hidden>
          <span style={{ width: `${Math.round(readProgress * 100)}%` }} />
        </div>
        <header className="lesson-reader__header">
          <div className="lesson-reader__header-row">
            <Link href={backHref} className="lesson-reader__icon-btn" aria-label="Retour">
              <ChevronLeft size={18} strokeWidth={2} />
            </Link>
            <div className="lesson-reader__titles">
              <p className="lesson-reader__kicker">{kicker}</p>
              <p className="lesson-reader__part">{partTitle}</p>
            </div>
            <div id="byound-ai-trigger" className="lesson-reader__ai-trigger" />
            <button type="button" className="lesson-reader__icon-btn" aria-label="Sommaire" onClick={() => {
              if (window.matchMedia("(min-width: 1024px)").matches) setDesktopOutline((value) => !value);
              else setSheetOpen(true);
            }}>
              <List size={18} strokeWidth={2} />
            </button>
            <button type="button" className="lesson-reader__aa" aria-pressed={dyslexia} aria-label="Mode neuro-adapté" onClick={onToggleDyslexia}>
              Aa
            </button>
            <button type="button" className="lesson-reader__icon-btn" aria-label="Plus d'options" aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}>
              <MoreHorizontal size={18} strokeWidth={2} />
            </button>
          </div>
          <div className="lesson-reader__segments" role="img" aria-label={`Sous-chapitre ${index} sur ${total}`}>
            {segments.map((segment, segmentIndex) => (
              <span key={`${segment}-${segmentIndex}`} data-on={segment === "done" || segment === "current"} />
            ))}
          </div>
          {menuOpen ? (
            <div className="lesson-reader__menu">
              <p>Thème</p>
              {(["auto", "light", "dark"] as ThemeChoice[]).map((item) => (
                <button key={item} type="button" data-on={choice === item} onClick={() => choose(item)}>
                  {item === "auto" ? "Auto" : item === "light" ? "Clair" : "Sombre"}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenStrategy();
                }}
              >
                Stratégie
              </button>
            </div>
          ) : null}
        </header>
        <div className="lesson-reader__body">
          <main className="lesson-reader__main" ref={mainRef}>
            <p className="lesson-reader__chip">{chip}</p>
            <h1 className="lesson-reader__h1">{heading}</h1>
            {children}
          </main>
          <div id="byound-ai-dock" className="lesson-reader__ai-dock" />
        </div>
        <div className="lesson-reader__fade" style={{ left: stageBox.left, width: stageBox.width || "100%" }} aria-hidden />
        <div className="lesson-reader__bar">
          <button type="button" className="lesson-reader__bar-prev" aria-label="Sous-chapitre précédent" disabled={prevDisabled} aria-disabled={prevDisabled} onClick={onPrev}>
            <ChevronLeft size={18} strokeWidth={2} />
          </button>
          <p className="lesson-reader__bar-count">
            {index} / {total}
          </p>
          <button type="button" className="lesson-reader__bar-next" onClick={onNext}>
            {nextLabel}
            <ChevronRight size={18} strokeWidth={2} />
          </button>
        </div>
      </div>
      {sheetOpen ? (
        <div className="lesson-reader__sheet" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <button type="button" className="lesson-reader__sheet-backdrop" aria-label="Fermer" onClick={() => setSheetOpen(false)} />
          <div className="lesson-reader__sheet-panel" ref={sheetRef}>
            <div className="lesson-reader__handle" />
            <div className="lesson-reader__sheet-head">
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 id={titleId}>Sommaire</h2>
                <p>{courseTitle}</p>
              </div>
              <button type="button" className="lesson-reader__icon-btn" aria-label="Fermer" onClick={() => setSheetOpen(false)}>
                ×
              </button>
            </div>
            {outline}
          </div>
        </div>
      ) : null}
    </div>
  );
}
