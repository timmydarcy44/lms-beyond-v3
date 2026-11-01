"use client";

import { useEffect, useState } from "react";

export type PassageNote = { id: string; text: string; range: Range | null };

let notes: PassageNote[] = [];
const listeners = new Set<(next: PassageNote[]) => void>();

function emit() {
  const next = notes.slice();
  for (const listener of listeners) listener(next);
}

export function usePassageNotes() {
  const [value, setValue] = useState<PassageNote[]>(notes);
  useEffect(() => {
    const update = (next: PassageNote[]) => setValue(next);
    listeners.add(update);
    setValue(notes.slice());
    return () => {
      listeners.delete(update);
    };
  }, []);
  return value;
}

const HTML_MARK = "passage-mark";
const PDF_MARK = "passage-mark-pdf";

function hostOf(node: Node | null) {
  if (!node) return null;
  const element = node instanceof Element ? node : node.parentElement;
  return element;
}

function readable(range: Range) {
  const element = hostOf(range.commonAncestorContainer);
  if (!element?.closest(".passage-root")) return false;
  if (element.closest("[contenteditable='true'], textarea, input, select, button, [data-passage-notes]")) return false;
  return (range.toString() ?? "").trim().length > 0;
}

function groups() {
  if (typeof CSS === "undefined" || !CSS.highlights) return [];
  return [HTML_MARK, PDF_MARK].map((name) => {
    const current = CSS.highlights.get(name);
    if (current) return current;
    const created = new Highlight();
    CSS.highlights.set(name, created);
    return created;
  });
}

function overlaps(left: Range, right: Range) {
  try {
    return left.compareBoundaryPoints(Range.END_TO_START, right) < 0 && left.compareBoundaryPoints(Range.START_TO_END, right) > 0;
  } catch {
    return false;
  }
}

export function PassageMarks() {
  const [box, setBox] = useState<{ x: number; y: number; below: boolean; marked: boolean } | null>(null);

  useEffect(() => {
    const root = document.querySelector(".passage-root");
    if (!root) return;
    const read = () => {
      const selection = document.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        setBox(null);
        return;
      }
      const range = selection.getRangeAt(0);
      if (!readable(range)) {
        setBox(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        setBox(null);
        return;
      }
      const marked = groups().some((group) => Array.from(group).some((item) => overlaps(item, range)));
      const below = rect.top < 72;
      setBox({ x: Math.min(window.innerWidth - 24, Math.max(24, rect.left + rect.width / 2)), y: below ? rect.bottom + 8 : rect.top - 8, below, marked });
    };
    const later = () => window.requestAnimationFrame(read);
    root.addEventListener("mouseup", later);
    root.addEventListener("keyup", later);
    return () => {
      root.removeEventListener("mouseup", later);
      root.removeEventListener("keyup", later);
    };
  }, []);

  const apply = () => {
    const selection = document.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    if (!readable(range)) return;
    const element = hostOf(range.commonAncestorContainer);
    const name = element?.closest(".textLayer") ? PDF_MARK : HTML_MARK;
    const available = groups();
    if (available.length === 0) return;
    const marked = available.some((group) => Array.from(group).some((item) => overlaps(item, range)));
    if (marked) {
      const removed = notes.filter((note) => note.range && overlaps(note.range, range)).map((note) => note.id);
      for (const group of available) {
        for (const item of Array.from(group)) {
          if (overlaps(item, range)) group.delete(item);
        }
      }
      if (removed.length) dropNotes(removed);
    } else {
      const stored = range.cloneRange();
      const target = CSS.highlights.get(name) ?? new Highlight();
      target.add(stored);
      CSS.highlights.set(name, target);
      const text = stored.toString().replace(/\s+/g, " ").trim();
      if (text) {
        notes = [...notes, { id: crypto.randomUUID(), text, range: stored }];
        emit();
      }
    }
    selection.removeAllRanges();
    setBox(null);
  };

  if (!box) return null;
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={apply}
      style={{ left: box.x, top: box.y, transform: box.below ? "translate(-50%, 0)" : "translate(-50%, -100%)", background: "var(--passage-action)", color: "var(--passage-action-text)" }}
      className="fixed z-30 rounded-full px-3 py-1.5 text-xs font-semibold shadow-lg"
    >
      {box.marked ? "Retirer" : "Surligner"}
    </button>
  );
}

function dropNotes(ids: string[]) {
  const gone = new Set(ids);
  notes = notes.filter((note) => !gone.has(note.id));
  emit();
}

export function removePassageNote(id: string) {
  const note = notes.find((item) => item.id === id);
  if (note?.range) {
    for (const group of groups()) {
      for (const item of Array.from(group)) {
        if (item === note.range || overlaps(item, note.range)) group.delete(item);
      }
    }
  }
  dropNotes([id]);
}

export function clearPassageMarks() {
  CSS.highlights?.delete(HTML_MARK);
  CSS.highlights?.delete(PDF_MARK);
  notes = [];
  emit();
}

export function PassageNotes({
  open,
  onOpenChange,
  placement,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placement: "rail" | "dock";
}) {
  const items = usePassageNotes();
  if (!open) {
    return (
      <button
        type="button"
        aria-expanded={false}
        onClick={() => onOpenChange(true)}
        className={placement === "rail" ? "flex h-full w-full flex-col items-center gap-3 px-2 py-4 text-xs text-[#C9C2FF]" : "flex w-full items-center justify-between px-4 py-3 text-sm"}
      >
        <span className={placement === "rail" ? "[writing-mode:vertical-rl]" : ""}>Mes prises de note</span>
        {items.length ? <span className="rounded-full bg-[#6E5BFF] px-2 py-0.5 text-[11px] text-white">{items.length}</span> : null}
      </button>
    );
  }
  return (
    <section className="px-4 py-4" aria-label="Mes prises de note" data-passage-notes>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Mes prises de note</h2>
        <button type="button" className="text-xs text-[#C9C2FF]" aria-expanded onClick={() => onOpenChange(false)}>
          Replier
        </button>
      </div>
      <p className="mt-1 text-xs text-[#8A8FA3]">
        {items.length === 0
          ? "Les passages surlignés s'affichent ici."
          : `${items.length} passage${items.length > 1 ? "s" : ""} retenu${items.length > 1 ? "s" : ""}`}
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((note) => (
          <li key={note.id} className="rounded-2xl border border-[#1E2130] bg-[#0B0C10] px-3 py-2" style={{ borderLeftWidth: 4, borderLeftColor: "#F6D56A" }}>
            <p className="text-sm leading-relaxed">{note.text}</p>
            <button type="button" className="mt-2 text-xs text-[#C9C2FF]" onClick={() => removePassageNote(note.id)}>
              Retirer
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
