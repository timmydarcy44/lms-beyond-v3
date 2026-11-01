"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  kindLabel,
  lessonKey,
  locateNote,
  mapReadingNote,
  revealReadingAnchor,
  schemaBlocks,
  type NoteChapter,
  type NoteKind,
  type ReadingNote,
} from "@/lib/lms/reading-notes";
import "./reading-notes-panel.css";

const KINDS: Array<{ id: "all" | NoteKind; label: string }> = [
  { id: "all", label: "Tous les types" },
  { id: "highlight", label: "Surlignages" },
  { id: "personal", label: "Notes personnelles" },
  { id: "schema", label: "Schémas" },
  { id: "summary", label: "Résumés" },
];

function shortDate(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function matchesKind(note: ReadingNote, kind: "all" | NoteKind) {
  if (kind === "all") return true;
  if (kind === "personal") return Boolean(note.personalNote);
  return note.kind === kind;
}

async function downloadNotes(title: string, groups: Array<{ title: string; notes: ReadingNote[] }>) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  let y = 18;
  const write = (text: string, size: number, gap = 6) => {
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, width - 28);
    if (y + lines.length * gap > 280) {
      doc.addPage();
      y = 18;
    }
    doc.text(lines, 14, y);
    y += lines.length * gap + 2;
  };
  write(title || "Mes notes", 18, 8);
  write(new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }), 11);
  for (const group of groups) {
    y += 4;
    write(group.title, 14, 7);
    for (const note of group.notes) {
      write(`${kindLabel(note.kind)} · ${shortDate(note.createdAt)}`, 11);
      if (note.kind === "schema") {
        const blocks = schemaBlocks(note.schema);
        if (blocks.length) {
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(640, blocks.length * 170);
          canvas.height = 110;
          const pen = canvas.getContext("2d");
          if (pen) {
            pen.fillStyle = "#1C1F27";
            pen.fillRect(0, 0, canvas.width, canvas.height);
            blocks.forEach((label, index) => {
              const x = 16 + index * 160;
              pen.fillStyle = "#262A35";
              pen.beginPath();
              pen.roundRect(x, 28, 130, 52, 14);
              pen.fill();
              pen.fillStyle = "#F4F5F7";
              pen.font = "16px sans-serif";
              pen.fillText(label.slice(0, 16), x + 12, 58);
              if (index < blocks.length - 1) {
                pen.fillStyle = "#9A9FB2";
                pen.fillText(">", x + 136, 58);
              }
            });
            const image = canvas.toDataURL("image/png");
            if (y > 240) {
              doc.addPage();
              y = 18;
            }
            doc.addImage(image, "PNG", 14, y, Math.min(180, width - 28), 28);
            y += 34;
          }
        }
      } else if (note.excerpt) {
        write(`« ${note.excerpt} »`, 12);
      }
      if (note.personalNote) write(`Ma note : ${note.personalNote}`, 12);
      if (note.kind === "summary" && note.summary) write(note.summary, 12);
      y += 2;
    }
  }
  doc.save("mes-notes.pdf");
}

export function ReadingNotesPanel({
  open,
  onClose,
  courseId,
  courseTitle,
  playBase,
  chapters,
  currentLessonId,
  onJump,
}: {
  open: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
  playBase: string;
  chapters: NoteChapter[];
  currentLessonId?: string;
  onJump?: (note: ReadingNote) => boolean;
}) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const [notes, setNotes] = useState<ReadingNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [chapterId, setChapterId] = useState("all");
  const [kind, setKind] = useState<(typeof KINDS)[number]["id"]>("all");
  const [menu, setMenu] = useState<"chapter" | "type" | null>(null);
  const [narrow, setNarrow] = useState(false);
  const [edit, setEdit] = useState<{ id: string; value: string } | null>(null);
  const [confirmId, setConfirmId] = useState("");
  const [openSummary, setOpenSummary] = useState<string>("");
  const [zoom, setZoom] = useState<string[] | null>(null);
  const [warning, setWarning] = useState("");

  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const apply = () => setNarrow(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!open || !courseId) return;
    let cancelled = false;
    setLoading(true);
    void fetch(`/api/ai/lesson-assistant?courseId=${encodeURIComponent(courseId)}&limit=200`)
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        const items = Array.isArray(data?.items) ? data.items : [];
        setNotes(items.map(mapReadingNote).filter((note) => note.id));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId, open]);

  useEffect(() => {
    if (!open) return;
    const node = panelRef.current;
    const previous = document.activeElement as HTMLElement | null;
    node?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (zoom) setZoom(null);
        else if (menu) setMenu(null);
        else onClose();
        return;
      }
      if (event.key !== "Tab" || !node) return;
      const items = Array.from(node.querySelectorAll<HTMLElement>("button, a, input, textarea, select")).filter((item) => !item.hasAttribute("disabled"));
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
  }, [menu, onClose, open, zoom]);

  useEffect(() => {
    if (!edit) return;
    const timer = window.setTimeout(() => {
      void persistNote(edit.id, edit.value);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [edit]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return notes
      .filter((note) => matchesKind(note, kind))
      .filter((note) => {
        if (chapterId === "all") return true;
        return locateNote(note, chapters).chapter?.id === chapterId;
      })
      .filter((note) => {
        if (!needle) return true;
        return `${note.excerpt} ${note.personalNote} ${note.summary}`.toLowerCase().includes(needle);
      })
      .sort((a, b) => {
        const left = locateNote(a, chapters);
        const right = locateNote(b, chapters);
        if (left.chapterOrder !== right.chapterOrder) return left.chapterOrder - right.chapterOrder;
        if (left.lessonIndex !== right.lessonIndex) return left.lessonIndex - right.lessonIndex;
        return a.createdAt.localeCompare(b.createdAt);
      });
  }, [chapterId, chapters, kind, notes, query]);

  const groups = useMemo(() => {
    const built: Array<{ title: string; countLabel: string; notes: ReadingNote[] }> = [];
    for (const note of visible) {
      const place = locateNote(note, chapters);
      const chapterTitle = place.chapter?.title.replace(/\s*[·•]\s*\d+\s*h\s*$/iu, "") ?? "";
      const title = place.chapter ? `Chapitre ${place.chapter.number} · ${chapterTitle}` : "Autres passages";
      const last = built[built.length - 1];
      if (!last || last.title !== title) built.push({ title, countLabel: "", notes: [note] });
      else last.notes.push(note);
    }
    return built.map((group) => ({ ...group, countLabel: `${group.notes.length} note${group.notes.length > 1 ? "s" : ""}` }));
  }, [chapters, visible]);

  if (!open || typeof document === "undefined") return null;

  const go = (note: ReadingNote) => {
    if (onJump?.(note)) {
      onClose();
      return;
    }
    if (currentLessonId && currentLessonId === lessonKey(note)) {
      const root = document.querySelector("[data-dyslexia-content]")?.parentElement ?? document;
      const found = revealReadingAnchor(root, note.anchor);
      if (!found) setWarning("Ce passage a été modifié depuis votre note");
      onClose();
      return;
    }
    const params = new URLSearchParams();
    if (note.anchor?.blockId) params.set("noteBlock", note.anchor.blockId);
    if (note.anchor?.excerpt) params.set("noteExcerpt", note.anchor.excerpt.slice(0, 120));
    const id = lessonKey(note);
    if (!id) {
      setWarning("Ce passage a été modifié depuis votre note");
      return;
    }
    router.push(`${playBase}/play/${encodeURIComponent(id)}?${params.toString()}`);
    onClose();
  };

  const persistNote = async (id: string, value: string) => {
    const response = await fetch("/api/ai/lesson-assistant", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, personalNote: value }),
    });
    if (!response.ok) return;
    setNotes((current) => current.map((note) => (note.id === id ? { ...note, personalNote: value.trim(), updatedAt: new Date().toISOString() } : note)));
  };

  const remove = async (id: string) => {
    const response = await fetch(`/api/ai/lesson-assistant?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!response.ok) return;
    setNotes((current) => current.filter((note) => note.id !== id));
    setConfirmId("");
  };

  const chapterLabel = chapters.find((chapter) => chapter.id === chapterId)?.title ?? "Tous les chapitres";
  const kindLabelText = KINDS.find((item) => item.id === kind)?.label ?? "Tous les types";
  const choices = menu === "chapter"
    ? [{ id: "all", label: "Tous les chapitres" }, ...chapters.map((chapter) => ({ id: chapter.id, label: `Chapitre ${chapter.number} · ${chapter.title}` }))]
    : KINDS;

  return createPortal(
    <div className="notes-lecture" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="notes-lecture__panel" role="dialog" aria-modal="true" aria-labelledby="notes-lecture-title" tabIndex={-1} ref={panelRef}>
        <header className="notes-lecture__head">
          <div>
            <h2 id="notes-lecture-title">Mes notes</h2>
            <p className="notes-lecture__count">{`${courseTitle} · ${visible.length} note${visible.length > 1 ? "s" : ""}`}</p>
          </div>
          <div className="notes-lecture__actions">
            <button type="button" className="notes-lecture__pdf" onClick={() => void downloadNotes(courseTitle, groups)}>Télécharger en PDF</button>
            <button type="button" className="notes-lecture__close" aria-label="Fermer" onClick={onClose}>✕</button>
          </div>
        </header>
        <div className="notes-lecture__tools">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher dans mes notes" aria-label="Rechercher dans mes notes" />
          <div className="notes-lecture__menu">
            <button type="button" aria-expanded={menu === "chapter"} onClick={() => setMenu(menu === "chapter" ? null : "chapter")}>{chapterLabel} ▾</button>
            {!narrow && menu === "chapter" ? (
              <ul>
                {choices.map((item) => (
                  <li key={item.id}><button type="button" aria-current={chapterId === item.id ? "true" : undefined} onClick={() => { setChapterId(item.id); setMenu(null); }}>{item.label}</button></li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="notes-lecture__menu">
            <button type="button" aria-expanded={menu === "type"} onClick={() => setMenu(menu === "type" ? null : "type")}>{kindLabelText} ▾</button>
            {!narrow && menu === "type" ? (
              <ul>
                {KINDS.map((item) => (
                  <li key={item.id}><button type="button" aria-current={kind === item.id ? "true" : undefined} onClick={() => { setKind(item.id); setMenu(null); }}>{item.label}</button></li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
        <div className="notes-lecture__scroll">
          {warning ? <p className="notes-lecture__count">{warning}</p> : null}
          {loading ? <p className="notes-lecture__count">Chargement…</p> : null}
          {!loading && notes.length === 0 ? (
            <div className="notes-lecture__empty">
              <svg width="72" height="48" viewBox="0 0 72 48" aria-hidden="true">
                <rect x="4" y="10" width="46" height="8" rx="2" fill="#262A35" />
                <rect x="4" y="24" width="36" height="8" rx="2" fill="#F5C85C" />
                <path d="M52 30l12 8-4-14z" fill="#F5C85C" />
              </svg>
              <p>Surlignez un passage pendant la lecture pour le retrouver ici.</p>
            </div>
          ) : null}
          {!loading && notes.length > 0 && visible.length === 0 ? <p className="notes-lecture__count">Aucune note ne correspond.</p> : null}
          {groups.map((group) => (
            <section key={group.title}>
              <h3 className="notes-lecture__chapter">{group.title} <span>· {group.countLabel}</span></h3>
              {group.notes.map((note) => {
                const place = locateNote(note, chapters);
                const blocks = note.kind === "schema" ? schemaBlocks(note.schema) : [];
                const summary = note.summary && note.summary !== note.excerpt ? note.summary : "";
                return (
                  <article key={note.id} className="notes-lecture__note">
                    <p className="notes-lecture__source">
                      <strong data-kind={note.kind}>{kindLabel(note.kind)}</strong>
                      {place.lesson ? ` · ${place.lesson.title}` : ""}
                      {shortDate(note.createdAt) ? ` · ${shortDate(note.createdAt)}` : ""}
                    </p>
                    {note.kind === "schema" && blocks.length ? (
                      <div className="notes-lecture__schema" aria-label="Schéma">
                        {blocks.map((block, index) => (
                          <Fragment key={`${note.id}-${index}`}>
                            {index > 0 ? <i aria-hidden="true">→</i> : null}
                            <span>{block}</span>
                          </Fragment>
                        ))}
                      </div>
                    ) : null}
                    {note.kind !== "schema" && note.excerpt ? <p className="notes-lecture__passage">{note.excerpt}</p> : null}
                    {summary ? (
                      <>
                        <p className="notes-lecture__summary" data-clamped={openSummary === note.id ? "false" : "true"}>{summary}</p>
                        {summary.length > 140 ? (
                          <button type="button" className="notes-lecture__more" onClick={() => setOpenSummary(openSummary === note.id ? "" : note.id)}>
                            {openSummary === note.id ? "Replier" : "Lire la suite"}
                          </button>
                        ) : null}
                      </>
                    ) : null}
                    {note.personalNote && edit?.id !== note.id ? <p className="notes-lecture__mine">Ma note : {note.personalNote}</p> : null}
                    {edit?.id === note.id ? (
                      <textarea className="notes-lecture__editor" aria-label="Ma note" value={edit.value} onChange={(event) => setEdit({ id: note.id, value: event.target.value })} />
                    ) : null}
                    <div className="notes-lecture__row">
                      <button type="button" onClick={() => go(note)}>Aller au passage ›</button>
                      {note.kind === "schema" && blocks.length ? <button type="button" onClick={() => setZoom(blocks)}>Agrandir</button> : null}
                      <button type="button" onClick={() => {
                        if (edit?.id === note.id) {
                          void persistNote(edit.id, edit.value);
                          setEdit(null);
                          return;
                        }
                        setEdit({ id: note.id, value: note.personalNote });
                      }}>
                        {note.personalNote ? "Modifier" : "Ajouter une note"}
                      </button>
                      <button type="button" onClick={() => setConfirmId(note.id)}>Supprimer</button>
                    </div>
                    {confirmId === note.id ? (
                      <p className="notes-lecture__confirm">
                        Supprimer cette note ?
                        <button type="button" onClick={() => void remove(note.id)}> Oui</button>
                        <button type="button" onClick={() => setConfirmId("")}> Annuler</button>
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </section>
          ))}
        </div>
        {zoom ? (
          <div className="notes-lecture__zoom" role="dialog" aria-label="Schéma agrandi">
            <div>
              {zoom.map((block, index) => <span key={block}>{block}{index < zoom.length - 1 ? " → " : ""}</span>)}
              <button type="button" onClick={() => setZoom(null)}>Fermer</button>
            </div>
          </div>
        ) : null}
        {narrow && menu ? (
          <div className="notes-lecture__sheet" role="dialog" aria-label={menu === "chapter" ? "Chapitres" : "Types"}>
            {(menu === "chapter" ? choices : KINDS).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (menu === "chapter") setChapterId(item.id);
                  else setKind(item.id as (typeof KINDS)[number]["id"]);
                  setMenu(null);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
