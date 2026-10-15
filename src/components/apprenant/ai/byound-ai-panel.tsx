"use client";

import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import {
  AudioLines,
  ChevronRight,
  Copy,
  FileText,
  Languages,
  Map,
  MoreHorizontal,
  RefreshCw,
  ScanSearch,
  Shapes,
  Sparkles,
  X,
} from "lucide-react";

import { MindmapViewer } from "@/components/apprenant/mindmap-viewer";
import { TimelineTube } from "@/components/apprenant/timeline-tube";
import type { AIAction } from "@/lib/ai/utils";
import "./byound-ai-panel.css";

export const BYOUND_AI_ACTIONS = [
  { id: "rephrase" as const, short: "Reformuler", aria: "Reformuler", hint: "Simplifie ou enrichit le sous-chapitre", icon: Sparkles, tint: "#2A2452", vivid: "#8B7BFF", ink: "#B9AFFF", dys: "#ECE7FF" },
  { id: "synthesis" as const, short: "Fiche", aria: "Fiche synthétique", hint: "Résumé structuré du sous-chapitre", icon: FileText, tint: "#132A4D", vivid: "#2F7CF6", ink: "#8DB8FF", dys: "#E3EEFF" },
  { id: "schema" as const, short: "Schéma", aria: "Transformer en schéma", hint: "Schéma visuel du sous-chapitre", icon: Shapes, tint: "#0F3330", vivid: "#14A38B", ink: "#5EDCC3", dys: "#DDF5F0" },
  { id: "audio" as const, short: "Audio", aria: "Transformer en audio", hint: "Version audio du sous-chapitre", icon: AudioLines, tint: "#3A2414", vivid: "#E7782C", ink: "#FFAA6B", dys: "#FDEBDD" },
  { id: "mindmap" as const, short: "Map", aria: "Transformer en carte mentale", hint: "Carte mentale du sous-chapitre", icon: Map, tint: "#3A1832", vivid: "#D9459E", ink: "#FF8AD0", dys: "#FBE3F1" },
  { id: "translate" as const, short: "Traduire", aria: "Traduire", hint: "Dans la langue de ton choix", icon: Languages, tint: "#36301A", vivid: "#C99A12", ink: "#F2CF6B", dys: "#FBF1D6" },
  { id: "insights" as const, short: "Analyser", aria: "Analyser", hint: "Points clés et notions à revoir", icon: ScanSearch, tint: "#12301F", vivid: "#1F9D57", ink: "#6BE39B", dys: "#DEF5E7" },
];

const PRIMARY = ["rephrase", "synthesis", "schema", "audio"] as const;
const MORE = ["mindmap", "translate", "insights"] as const;
const LANGUAGES = ["anglais", "espagnol", "allemand", "italien", "arabe"];
const REPHRASE = [
  { id: "simplify", title: "Reformulation simple" },
  { id: "theoretical", title: "Reformulation théorique" },
  { id: "examples", title: "Reformulation avec exemples" },
  { id: "structured", title: "Reformulation structurée" },
];
const OPEN_KEY = "byound-ai-panel-open";
const LAST_KEY = "byound-ai-last-action";

export type ByoundAiTone = (typeof BYOUND_AI_ACTIONS)[number];

export function byoundAiTone(id: string | null | undefined): ByoundAiTone {
  return BYOUND_AI_ACTIONS.find((item) => item.id === id) ?? BYOUND_AI_ACTIONS[1];
}

type HistoryRow = {
  id: string;
  action: AIAction;
  created_at: string;
  lessonTitle: string;
  value: string;
};

type ResultState = {
  action: AIAction;
  result: string | Record<string, unknown> | null;
  format: "text" | "json";
  audio?: { base64: string; mimeType: string; voice: string } | null;
  fresh: boolean;
};

type Props = {
  dyslexia: boolean;
  lessonTitle?: string;
  processing: boolean;
  error: string | null;
  result: ResultState | null;
  history: HistoryRow[];
  historyLoading: boolean;
  onLaunch: (action: AIAction, options?: Record<string, string>) => void;
  onSave: () => void;
  onCopy: () => void;
  onRegenerate: () => void;
  onRetry: () => void;
  onOpenHistory: (id: string) => void;
};

function readStoredAction(): AIAction {
  try {
    const value = localStorage.getItem(LAST_KEY);
    if (BYOUND_AI_ACTIONS.some((item) => item.id === value)) return value as AIAction;
  } catch {
    /* ignore */
  }
  return "synthesis";
}

function pointsFrom(result: ResultState["result"], action: AIAction): string[] {
  if (!result) return [];
  if (typeof result === "string") {
    const lines = result
      .split(/\n+/)
      .map((line) => line.replace(/^#{1,6}\s+/, "").replace(/^[-*•]\s+/, "").replace(/^\d+[.)]\s+/, "").trim())
      .filter((line) => line.length > 12 && line.length < 180);
    return lines.slice(0, 5);
  }
  const record = result as Record<string, unknown>;
  if (action === "insights" && Array.isArray(record.keyConcepts)) return record.keyConcepts.map(String).slice(0, 5);
  if (action === "schema" && Array.isArray(record.steps)) {
    return record.steps.map((step) => String((step as { title?: string }).title ?? "")).filter(Boolean).slice(0, 5);
  }
  if (action === "audio" && typeof record.script === "string") return pointsFrom(record.script, "rephrase");
  return [];
}

function periodOf(iso: string): string {
  const date = new Date(iso);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (date >= start) return "Aujourd'hui";
  const week = new Date(start);
  week.setDate(week.getDate() - 6);
  if (date >= week) return "Cette semaine";
  return "Plus ancien";
}

function relativeDate(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  return `il y a ${Math.round(hours / 24)} j`;
}

function ActionButton({
  item,
  pressed,
  dyslexia,
  disabled,
  onClick,
}: {
  item: ByoundAiTone;
  pressed: boolean;
  dyslexia: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button type="button" className="byound-ai__action" aria-label={item.aria} aria-pressed={pressed} disabled={disabled} onClick={onClick}>
      <span
        className="byound-ai__orb"
        style={{
          background: pressed ? item.vivid : dyslexia ? item.dys : item.tint,
          color: pressed ? "#fff" : dyslexia ? item.vivid : item.ink,
          boxShadow: pressed ? `0 0 0 3px ${dyslexia ? "#FBF7EE" : "#0C0D12"}, 0 0 0 5px ${item.vivid}` : undefined,
        }}
      >
        <Icon size={22} strokeWidth={2} aria-hidden />
      </span>
      <span>{item.short}</span>
    </button>
  );
}

export function ByoundAiPanel(props: Props) {
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [desktop, setDesktop] = useState(false);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<"transform" | "history">("transform");
  const [selected, setSelected] = useState<AIAction>("synthesis");
  const [more, setMore] = useState(false);
  const [host, setHost] = useState<{ trigger: HTMLElement | null; dock: HTMLElement | null }>({ trigger: null, dock: null });

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const apply = () => setDesktop(media.matches);
    apply();
    media.addEventListener("change", apply);
    try {
      if (localStorage.getItem(OPEN_KEY) === "1") setOpen(true);
      setSelected(readStoredAction());
    } catch {
      /* ignore */
    }
    setHost({
      trigger: document.getElementById("byound-ai-trigger"),
      dock: document.getElementById("byound-ai-dock"),
    });
    setReady(true);
    return () => media.removeEventListener("change", apply);
  }, []);

  const setPanel = (next: boolean) => {
    setOpen(next);
    try {
      localStorage.setItem(OPEN_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  const choose = (action: AIAction, options?: Record<string, string>) => {
    setSelected(action);
    setTab("transform");
    try {
      localStorage.setItem(LAST_KEY, action);
    } catch {
      /* ignore */
    }
    if (action === "rephrase" || action === "translate") return;
    props.onLaunch(action, action === "audio" ? { voice: "alloy", ...options } : options);
  };

  useEffect(() => {
    if (!props.processing && !props.error && !props.result) return;
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [props.processing, props.error, props.result]);

  useEffect(() => {
    if (!open || desktop) return;
    const node = sheetRef.current;
    const previous = document.activeElement as HTMLElement | null;
    const focusable = () =>
      Array.from(node?.querySelectorAll<HTMLElement>("button, a, input, select, textarea") ?? []).filter((item) => !item.hasAttribute("disabled"));
    focusable()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPanel(false);
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
  }, [desktop, open]);

  const tone = byoundAiTone(props.result?.action ?? selected);
  const visible = desktop ? BYOUND_AI_ACTIONS : BYOUND_AI_ACTIONS.filter((item) => (PRIMARY as readonly string[]).includes(item.id));
  const groups = ["Aujourd'hui", "Cette semaine", "Plus ancien"].map((label) => ({
    label,
    items: props.history.filter((item) => periodOf(item.created_at) === label),
  })).filter((group) => group.items.length);

  const docked = desktop && Boolean(host.dock);
  const panel = (
    <div className={`byound-ai ${docked ? "byound-ai-dock" : "byound-ai-sheet__panel"}`} data-dys={props.dyslexia || undefined} ref={docked ? undefined : sheetRef}>
      <div className="byound-ai__halo" aria-hidden />
      {docked ? null : <div className="byound-ai__handle" />}
      <div className="byound-ai__scroll">
        <header className="byound-ai__head">
          <div style={{ flex: 1 }}>
            <p className="byound-ai__kicker">Byound AI</p>
            <h2 className="byound-ai__title" id={titleId}>Transforme ce sous-chapitre</h2>
          </div>
          <button type="button" className="byound-ai__close" aria-label="Fermer Byound AI" onClick={() => setPanel(false)}>
            <X size={18} strokeWidth={2} />
          </button>
        </header>
        <div className="byound-ai__tabs" role="tablist" aria-label="Byound AI">
          <button type="button" className="byound-ai__tab" role="tab" aria-selected={tab === "transform"} onClick={() => setTab("transform")}>Transformer</button>
          <button type="button" className="byound-ai__tab" role="tab" aria-selected={tab === "history"} onClick={() => setTab("history")}>Mes transformations</button>
        </div>
        {tab === "transform" ? (
          <div role="tabpanel">
            <div className={desktop ? "byound-ai__actions byound-ai__grid" : "byound-ai__actions"}>
              {visible.map((item) => (
                <ActionButton key={item.id} item={item} pressed={selected === item.id} dyslexia={props.dyslexia} disabled={props.processing} onClick={() => choose(item.id)} />
              ))}
              {desktop ? null : (
                <button type="button" className="byound-ai__action" aria-expanded={more} aria-label={more ? "Moins" : "Plus"} onClick={() => setMore((value) => !value)}>
                  <span className="byound-ai__orb" style={{ background: "rgba(255,255,255,.1)", color: "#F4F5F7" }}>
                    <MoreHorizontal size={22} strokeWidth={2} />
                  </span>
                  <span>{more ? "Moins" : "Plus"}</span>
                </button>
              )}
            </div>
            {!desktop && more ? (
              <div className="byound-ai__more">
                {BYOUND_AI_ACTIONS.filter((item) => (MORE as readonly string[]).includes(item.id)).map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.id} type="button" aria-label={item.aria} onClick={() => choose(item.id)}>
                      <span className="byound-ai__mini" style={{ background: props.dyslexia ? item.dys : item.tint, color: props.dyslexia ? item.vivid : item.ink }}>
                        <Icon size={18} strokeWidth={2} />
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <strong>{item.short}</strong>
                        <small>{item.hint}</small>
                      </span>
                      <ChevronRight size={18} strokeWidth={2} />
                    </button>
                  );
                })}
              </div>
            ) : null}
            {selected === "rephrase" ? (
              <div className="byound-ai__choices">
                {REPHRASE.map((style) => (
                  <button key={style.id} type="button" onClick={() => props.onLaunch("rephrase", { style: style.id })}>{style.title}</button>
                ))}
              </div>
            ) : null}
            {selected === "translate" ? (
              <div className="byound-ai__choices">
                {LANGUAGES.map((language) => (
                  <button key={language} type="button" onClick={() => props.onLaunch("translate", { targetLanguage: language })}>{language}</button>
                ))}
              </div>
            ) : null}
            <ResultCard cardRef={cardRef} tone={tone} processing={props.processing} error={props.error} result={props.result} onSave={props.onSave} onCopy={props.onCopy} onRegenerate={props.onRegenerate} onRetry={props.onRetry} />
          </div>
        ) : (
          <div role="tabpanel">
            {props.historyLoading ? <p className="byound-ai__period">Chargement…</p> : null}
            {!props.historyLoading && props.history.length === 0 ? (
              <div className="byound-ai__empty">
                <i aria-hidden />
                <p>Tes transformations apparaîtront ici</p>
              </div>
            ) : (
              <div className="byound-ai__groups">
                {groups.map((group) => (
                  <section key={group.label}>
                    <p className="byound-ai__period">{group.label}</p>
                    {group.items.map((item) => {
                      const itemTone = byoundAiTone(item.action);
                      const Icon = itemTone.icon;
                      return (
                        <button key={item.id} type="button" className="byound-ai__tx" onClick={() => { props.onOpenHistory(item.id); setTab("transform"); }}>
                          <span className="byound-ai__mini" style={{ width: 44, height: 44, flexBasis: 44, background: props.dyslexia ? itemTone.dys : itemTone.tint, color: props.dyslexia ? itemTone.vivid : itemTone.ink }}>
                            <Icon size={18} strokeWidth={2} />
                          </span>
                          <span className="byound-ai__tx-copy">
                            <strong>{itemTone.aria}</strong>
                            <small>{item.lessonTitle}</small>
                          </span>
                          <span className="byound-ai__tx-value">
                            <b>{item.value}</b>
                            <span>{relativeDate(item.created_at)}</span>
                          </span>
                        </button>
                      );
                    })}
                  </section>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const trigger = (
    <button type="button" className="byound-ai-trigger" aria-pressed={open} aria-label="Byound AI" onClick={() => setPanel(!open)}>
      <Sparkles size={18} strokeWidth={2} aria-hidden />
      <span className="byound-ai-trigger__label">Byound AI</span>
    </button>
  );

  if (!ready) return null;

  return (
    <>
      {host.trigger ? createPortal(trigger, host.trigger) : <span className="byound-ai-trigger--fallback">{trigger}</span>}
      {!open ? (
        <button type="button" className="byound-ai-recall" onClick={() => setPanel(true)}>
          <span className="byound-ai-recall__halo" aria-hidden />
          <span className="byound-ai-recall__orb"><Sparkles size={20} strokeWidth={2} /></span>
          <span>
            <strong>Transformer ce sous-chapitre</strong>
            <small>Fiche, schéma, audio, traduction… avec Byound AI</small>
          </span>
          <span className="byound-ai-recall__open">Ouvrir</span>
        </button>
      ) : null}
      {open && docked && host.dock ? createPortal(panel, host.dock) : null}
      {open && !docked ? (
        <div className="byound-ai-sheet" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <button type="button" className="byound-ai-sheet__backdrop" aria-label="Fermer" onClick={() => setPanel(false)} />
          {panel}
        </div>
      ) : null}
    </>
  );
}

function ResultCard({
  cardRef,
  tone,
  processing,
  error,
  result,
  onSave,
  onCopy,
  onRegenerate,
  onRetry,
}: {
  cardRef: RefObject<HTMLElement | null>;
  tone: ByoundAiTone;
  processing: boolean;
  error: string | null;
  result: ResultState | null;
  onSave: () => void;
  onCopy: () => void;
  onRegenerate: () => void;
  onRetry: () => void;
}) {
  if (!processing && !error && !result) return null;
  const active = byoundAiTone(result?.action ?? tone.id);
  const points = result ? pointsFrom(result.result, result.action) : [];
  const audioSrc = result?.audio?.base64 ? `data:${result.audio.mimeType};base64,${result.audio.base64}` : null;
  return (
    <article ref={cardRef} className="byound-ai__card" data-error={error ? "true" : undefined} style={{ background: error ? "#2A1416" : active.vivid }}>
      <span className="byound-ai__blob byound-ai__blob--a" aria-hidden />
      <span className="byound-ai__blob byound-ai__blob--b" aria-hidden />
      <div className="byound-ai__card-body">
        {processing ? (
          <>
            <div className="byound-ai__bone byound-ai__bone--lg" />
            <div className="byound-ai__bone" />
            <div className="byound-ai__bone" />
          </>
        ) : error ? (
          <>
            <h3>Transformation impossible</h3>
            <p className="byound-ai__prose">{error}</p>
          </>
        ) : result ? (
          <>
            <div className="byound-ai__card-type">
              <span>{active.short}</span>
              {result.fresh ? <span className="byound-ai__pill">Générée à l&apos;instant</span> : null}
            </div>
            <h3>{active.aria}</h3>
            {result.action === "schema" && result.result && typeof result.result === "object" ? (
              <div className="byound-ai__embed"><TimelineTube data={result.result as never} /></div>
            ) : null}
            {result.action === "mindmap" && result.result && typeof result.result === "object" ? (
              <div className="byound-ai__embed"><MindmapViewer data={result.result as never} /></div>
            ) : null}
            {audioSrc ? <audio className="byound-ai__audio" controls src={audioSrc} /> : null}
            {points.length ? (
              <ol className="byound-ai__points">
                {points.map((point, index) => (
                  <li key={`${point}-${index}`}><span className="byound-ai__num">{index + 1}</span><span>{point}</span></li>
                ))}
              </ol>
            ) : result.action !== "schema" && result.action !== "mindmap" && !audioSrc ? (
              <p className="byound-ai__prose">{typeof result.result === "string" ? result.result : ""}</p>
            ) : null}
          </>
        ) : null}
        <div className="byound-ai__card-actions">
          {error ? (
            <button type="button" className="byound-ai__save" onClick={onRetry}>Réessayer</button>
          ) : (
            <>
              <button type="button" className="byound-ai__save" disabled={processing} onClick={onSave}>Enregistrer</button>
              <button type="button" className="byound-ai__round" aria-label="Copier" disabled={processing} onClick={onCopy}><Copy size={18} strokeWidth={2} /></button>
              <button type="button" className="byound-ai__round" aria-label="Régénérer" disabled={processing} onClick={onRegenerate}><RefreshCw size={18} strokeWidth={2} /></button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export function historyMetric(action: AIAction, result: unknown): string {
  const record = result && typeof result === "object" ? (result as Record<string, unknown>) : null;
  if (action === "audio") return String(record?.durationEstimate ?? "Audio");
  if (action === "mindmap") {
    const children = Array.isArray(record?.children) ? record.children.length : Array.isArray(record?.branches) ? record.branches.length : 0;
    return children ? `${children} branches` : "Carte";
  }
  if (action === "schema" && Array.isArray(record?.steps)) return `${record.steps.length} étapes`;
  if (action === "insights" && Array.isArray(record?.keyConcepts)) return `${record.keyConcepts.length} points`;
  if (action === "synthesis") {
    const count = typeof result === "string" ? result.split(/\n+/).filter((line) => line.trim().length > 12).length : 0;
    return count ? `${Math.min(count, 6)} points` : "Fiche";
  }
  if (action === "translate") return "Traduction";
  return "Texte";
}
