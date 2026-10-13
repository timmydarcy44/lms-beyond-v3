"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Manrope } from "next/font/google";
import {
  Bell,
  BookOpen,
  Check,
  ChevronLeft,
  FileText,
  Lock,
  Play,
  Search,
  Shield,
  Sparkles,
  StickyNote,
} from "lucide-react";
import { useSupabase } from "@/components/providers/supabase-provider";
import type { CourseBuilderSnapshot } from "@/types/course-builder";
import "./formation-studio.css";

const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

type ProgressState = "none" | "percent" | "completed";
type ItemProgress = { state: ProgressState; percent: number | null };
type StudioItem = {
  id: string;
  title: string;
  subtitle: string;
  kind: "game" | "quiz" | "interview" | "content" | "resource";
  href: string;
  progress: ItemProgress;
};
type StudioChapter = {
  id: string;
  title: string;
  duration: string;
  moduleId: string;
  moduleTitle: string;
  progress: ItemProgress;
  items: StudioItem[];
};

const EMPTY_PROGRESS: ItemProgress = { state: "none", percent: null };

function stripText(value: unknown): string {
  return String(value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function initialsFrom(value: string, fallback: string): string {
  const parts = value.split(/\s+/).map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return fallback;
}

function statusOf(progress: ItemProgress): "done" | "progress" | "todo" {
  if (progress.state === "completed" || (progress.percent ?? 0) >= 100) return "done";
  if (progress.state === "percent" || (progress.percent ?? 0) > 0) return "progress";
  return "todo";
}

function statusLabel(progress: ItemProgress): string {
  const status = statusOf(progress);
  if (status === "done") return "Terminé";
  if (status === "progress") return "En cours";
  return "À faire";
}

export function FormationStudio({
  courseId,
  title,
  description,
  playBase,
  backHref,
  snapshot,
}: {
  courseId: string;
  title: string;
  description: string;
  playBase: string;
  backHref: string;
  snapshot: CourseBuilderSnapshot | null;
  skills?: string[];
  episodes?: { id: string; progress?: number | null }[];
}) {
  const supabase = useSupabase();
  const [query, setQuery] = useState("");
  const [orgName, setOrgName] = useState("Byound");
  const [userInitials, setUserInitials] = useState("BY");
  const [outline, setOutline] = useState<ItemProgress>(EMPTY_PROGRESS);
  const [progressById, setProgressById] = useState<Map<string, ItemProgress>>(new Map());
  const [chapterProgress, setChapterProgress] = useState<Map<string, ItemProgress>>(new Map());
  const [sheet, setSheet] = useState<"notes" | null>(null);
  const [notes, setNotes] = useState("");
  const [badgeState, setBadgeState] = useState<{ obtained: boolean; date: string | null; href: string | null }>({
    obtained: false,
    date: null,
    href: null,
  });

  const chapters = useMemo(() => {
    const built: StudioChapter[] = [];
    (snapshot?.sections ?? []).forEach((section, sectionIndex) => {
      (section.chapters ?? []).forEach((chapter, chapterIndex) => {
        const items: StudioItem[] = [];
        const pushItem = (raw: {
          id?: string;
          title?: string;
          duration?: string;
          type?: string;
          kind?: string;
          summary?: string;
          content?: string;
        }) => {
          const id = String(raw.id ?? "").trim();
          if (!id) return;
          const kindRaw = String(raw.kind ?? "");
          const typeRaw = String(raw.type ?? "");
          const kind: StudioItem["kind"] =
            typeRaw === "interactive_game"
              ? "game"
              : kindRaw === "quiz"
                ? "quiz"
                : kindRaw === "experiential_interview"
                  ? "interview"
                  : kindRaw === "resource"
                    ? "resource"
                    : "content";
          const typeLabel =
            kind === "game"
              ? "Jeu interactif"
              : kind === "quiz"
                ? "Quiz"
                : kind === "interview"
                  ? "Entretien"
                  : kind === "resource"
                    ? "Ressource"
                    : "Contenu";
          const duration = raw.duration?.trim() || "";
          items.push({
            id,
            title: raw.title?.trim() || "Sans titre",
            subtitle: [typeLabel, duration].filter(Boolean).join(" · "),
            kind,
            href: `${playBase}/play/${encodeURIComponent(id)}`,
            progress: progressById.get(id) ?? EMPTY_PROGRESS,
          });
        };
        (chapter.subchapters ?? []).forEach((sub) => pushItem(sub));
        if (!items.length) pushItem(chapter);
        const chapterId = chapter.id || `chapter-${sectionIndex}-${chapterIndex}`;
        built.push({
          id: chapterId,
          title: chapter.title?.trim() || "Chapitre",
          duration: chapter.duration?.trim() || "5 min",
          moduleId: section.id || `module-${sectionIndex}`,
          moduleTitle: section.title?.trim() || "Module",
          progress: chapterProgress.get(chapterId) ?? EMPTY_PROGRESS,
          items,
        });
      });
    });
    return built;
  }, [chapterProgress, playBase, progressById, snapshot]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const active = chapters.find((chapter) => chapter.id === activeId) ?? chapters[0] ?? null;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return chapters;
    return chapters.filter((chapter) => chapter.title.toLowerCase().includes(needle));
  }, [chapters, query]);

  const modules = useMemo(() => {
    const groups = new Map<string, { id: string; title: string; chapters: StudioChapter[] }>();
    filtered.forEach((chapter) => {
      const current = groups.get(chapter.moduleId) ?? { id: chapter.moduleId, title: chapter.moduleTitle, chapters: [] };
      current.chapters.push(chapter);
      groups.set(chapter.moduleId, current);
    });
    return [...groups.values()];
  }, [filtered]);

  const formationPercent = outline.state === "completed" ? 100 : Math.max(0, Math.min(100, outline.percent ?? 0));
  const complete = outline.state === "completed" || formationPercent >= 100;
  const doneChapters = chapters.filter((chapter) => statusOf(chapter.progress) === "done").length;
  const resume =
    chapters.flatMap((chapter) => chapter.items).find((item) => statusOf(item.progress) !== "done") ??
    active?.items[0] ??
    null;
  const game = active?.items.find((item) => item.kind === "game") ?? null;
  const badgeLabel = String(snapshot?.general?.badgeLabel ?? "").trim() || title;
  const notesKey = `byound-chapter-notes:${courseId}:${active?.id ?? "formation"}`;

  useEffect(() => {
    let cancel = false;
    void fetch("/api/organizations/nav-branding", { credentials: "include" })
      .then((response) => response.json())
      .then((payload) => {
        const name = String(payload?.branding?.name ?? "").trim();
        if (name && !cancel) setOrgName(name);
      })
      .catch(() => undefined);
    void supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user || cancel) return;
      const meta = user.user_metadata ?? {};
      const name = String(meta.full_name || meta.name || `${meta.first_name ?? ""} ${meta.last_name ?? ""}`).trim();
      setUserInitials(initialsFrom(name || user.email || "", "BY"));
    });
    return () => {
      cancel = true;
    };
  }, [supabase]);

  useEffect(() => {
    if (!courseId) return;
    let cancel = false;
    void fetch(`/api/courses/${encodeURIComponent(courseId)}/structure`, { credentials: "include", cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!payload || cancel) return;
        const nextItems = new Map<string, ItemProgress>();
        const nextChapters = new Map<string, ItemProgress>();
        for (const section of payload.sections ?? []) {
          for (const chapter of section.chapters ?? []) {
            if (chapter?.id && chapter.learnerProgress) nextChapters.set(String(chapter.id), chapter.learnerProgress);
            for (const sub of chapter.subchapters ?? []) {
              if (sub?.id && sub.learnerProgress) nextItems.set(String(sub.id), sub.learnerProgress);
            }
          }
        }
        setProgressById(nextItems);
        setChapterProgress(nextChapters);
        if (payload.learnerProgress) setOutline(payload.learnerProgress);
      })
      .catch(() => undefined);
    void fetch(`/api/earner/certification/badge?courseId=${encodeURIComponent(courseId)}`, { credentials: "include" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!payload || cancel) return;
        const submission = payload.submission as { status?: string; created_at?: string } | null;
        const status = String(submission?.status ?? "").toLowerCase();
        const obtained = ["approved", "validated", "issued", "accepted", "obtenu"].includes(status);
        setBadgeState({
          obtained,
          date: obtained ? submission?.created_at ?? null : null,
          href: "/dashboard/apprenant/badges",
        });
      })
      .catch(() => undefined);
    return () => {
      cancel = true;
    };
  }, [courseId]);

  useEffect(() => {
    if (!active) return;
    setNotes(window.localStorage.getItem(notesKey) ?? "");
  }, [active, notesKey]);

  const saveNotes = (value: string) => {
    setNotes(value);
    window.localStorage.setItem(notesKey, value);
  };

  const share = () => {
    const url = window.location.href;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={`formation-studio ${manrope.className}`}>
      <aside className="formation-studio__sidebar">
        <div className="formation-studio__brand">
          <span className="formation-studio__avatar">{initialsFrom(orgName, "BY")}</span>
          <span>
            <span className="formation-studio__name">{orgName}</span>
            <span className="formation-studio__powered">Powered by Byound</span>
          </span>
        </div>
        <label className="formation-studio__search">
          <Search size={18} strokeWidth={2} aria-hidden />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un chapitre" />
        </label>
        <div className="formation-studio__heading">
          <p className="formation-studio__kicker">Formation</p>
          <h1>{title}</h1>
        </div>
        <div className="formation-studio__chapters">
          {modules.map((module) => (
            <div key={module.id} className="formation-studio__module">
              <p>{module.title}</p>
              {module.chapters.map((chapter) => {
                const state = statusOf(chapter.progress);
                return (
                  <button
                    key={chapter.id}
                    type="button"
                    data-active={chapter.id === active?.id}
                    className="formation-studio__chapter"
                    onClick={() => setActiveId(chapter.id)}
                  >
                    <span className="formation-studio__pill" data-state={state === "todo" ? undefined : state}>
                      {state === "done" ? <Check size={18} strokeWidth={2} /> : <BookOpen size={18} strokeWidth={2} />}
                    </span>
                    <span>
                      <span className="formation-studio__chapter-title">{chapter.title}</span>
                      <span className="formation-studio__meta">
                        {chapter.duration} · {statusLabel(chapter.progress)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
          {!modules.length ? <p className="formation-studio__meta">Aucun chapitre ne correspond.</p> : null}
        </div>
        <div className="formation-studio__badge">
          <span className="formation-studio__kicker">Badge</span>
          <strong>{badgeLabel}</strong>
        </div>
      </aside>

      <section className="formation-studio__main">
        <header className="formation-studio__topbar">
          <Link href={backHref} className="formation-studio__back">
            <ChevronLeft size={18} strokeWidth={2} />
            Retour
          </Link>
          <div className="formation-studio__tools">
            <Link href="/dashboard/apprenant" aria-label="Notifications" className="formation-studio__icon-btn">
              <Bell size={18} strokeWidth={2} />
            </Link>
            <Link href="/dashboard/apprenant/profil" aria-label="Profil" className="formation-studio__user">
              {userInitials}
            </Link>
          </div>
        </header>

        {active ? (
          <div>
            <div className="formation-studio__hero">
              <p className="formation-studio__kicker">
                {title} · {active.moduleTitle}
              </p>
              <p className="formation-studio__score">
                {formationPercent}
                <span>%</span>
              </p>
              <p className="formation-studio__meta">
                {active.title} · {active.duration}
              </p>
              <div
                className="formation-studio__bar"
                role="progressbar"
                aria-valuenow={formationPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progression de la formation"
              >
                <span style={{ width: `${formationPercent}%` }} />
              </div>
            </div>

            <div className="formation-studio__actions">
              <Link href={resume?.href ?? playBase} className="formation-studio__action" data-primary="true" aria-label="Reprendre">
                <span className="formation-studio__round">
                  <Play size={22} strokeWidth={2} />
                </span>
                Reprendre
              </Link>
              <button type="button" className="formation-studio__action" disabled aria-disabled="true" title="Bientôt disponible" aria-label="Coach IA, bientôt disponible">
                <span className="formation-studio__round">
                  <Sparkles size={22} strokeWidth={2} />
                </span>
                Coach IA
              </button>
              <button type="button" className="formation-studio__action" disabled aria-disabled="true" title="Bientôt disponible" aria-label="Fiche mémo, bientôt disponible">
                <span className="formation-studio__round">
                  <FileText size={22} strokeWidth={2} />
                </span>
                Fiche mémo
              </button>
              <button type="button" className="formation-studio__action" aria-label="Mes notes" onClick={() => setSheet("notes")}>
                <span className="formation-studio__round">
                  <StickyNote size={22} strokeWidth={2} />
                </span>
                Mes notes
              </button>
            </div>

            <div className="formation-studio__grid">
              {game ? (
                <article className="formation-studio__card">
                  <span className="formation-studio__tag">Jeu interactif</span>
                  <h2>{active.title}</h2>
                  <p>Le jeu s&apos;ouvre en plein écran. Vous pouvez le quitter à tout moment pour revenir au chapitre.</p>
                  <Link href={game.href} className="formation-studio__game-btn">
                    {statusOf(game.progress) === "progress" ? "Reprendre le jeu" : "Commencer le jeu"}
                  </Link>
                </article>
              ) : null}

              <article className="formation-studio__card">
                {badgeState.obtained ? (
                  <>
                    <span className="formation-studio__tag" data-tone="success">Badge obtenu</span>
                    <h2>Badge {badgeLabel}</h2>
                    <p>
                      {badgeState.date
                        ? `Obtenu le ${new Date(badgeState.date).toLocaleDateString("fr-FR")}.`
                        : "Votre certification est validée."}
                    </p>
                    <div className="formation-studio__actions">
                      <Link href={badgeState.href || "/dashboard/apprenant/badges"} className="formation-studio__game-btn">
                        Voir mon badge
                      </Link>
                      <button type="button" className="formation-studio__validate-btn" onClick={share}>
                        Partager sur LinkedIn
                      </button>
                    </div>
                  </>
                ) : complete ? (
                  <>
                    <span className="formation-studio__tag" data-tone="gold">
                      <Shield size={14} strokeWidth={2} /> Certification
                    </span>
                    <h2>Badge {badgeLabel}</h2>
                    <p>La formation est terminée. Vous pouvez passer la certification.</p>
                    <Link href={`${resume?.href ?? playBase}${String(resume?.href ?? playBase).includes("?") ? "&" : "?"}certify=1`} className="formation-studio__validate-btn">
                      Passer la certification
                    </Link>
                  </>
                ) : (
                  <>
                    <span className="formation-studio__tag">
                      <Lock size={14} strokeWidth={2} /> Verrouillé
                    </span>
                    <h2>Badge {badgeLabel}</h2>
                    <p>Termine tous les chapitres pour débloquer la certification.</p>
                    <p>
                      {doneChapters} / {chapters.length} chapitres terminés
                    </p>
                    <div className="formation-studio__mini" aria-hidden>
                      <span style={{ width: `${chapters.length ? Math.round((doneChapters / chapters.length) * 100) : 0}%` }} />
                    </div>
                    <button type="button" className="formation-studio__validate-btn" data-locked="true" disabled aria-disabled="true" title="Termine tous les chapitres pour débloquer la certification">
                      Verrouillé
                    </button>
                  </>
                )}
              </article>

              <article className="formation-studio__card">
                <h2>Contenu du chapitre</h2>
                <ol className="formation-studio__list">
                  {active.items.map((item, index) => (
                    <li key={item.id}>
                      <Link href={item.href} className="formation-studio__row">
                        <span className="formation-studio__index">{String(index + 1).padStart(2, "0")}</span>
                        <span>
                          <span className="formation-studio__row-title">{item.title}</span>
                          <span className="formation-studio__meta">{item.subtitle}</span>
                        </span>
                        <span className="formation-studio__row-status" data-state={statusOf(item.progress)}>
                          {statusOf(item.progress) === "done" ? <Check size={14} strokeWidth={2} /> : null} {statusLabel(item.progress)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </article>
            </div>
          </div>
        ) : (
          <article className="formation-studio__card">
            <h2>{title}</h2>
            <p>{description || "Aucun chapitre n'est encore publié dans cette formation."}</p>
          </article>
        )}
      </section>

      {sheet === "notes" ? (
        <div className="formation-studio__sheet-backdrop" role="presentation" onClick={() => setSheet(null)}>
          <div
            className="formation-studio__sheet"
            role="dialog"
            aria-label="Mes notes"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Mes notes</h2>
            <p>Notes personnelles pour {active?.title || title}. Elles restent sur cet appareil.</p>
            <textarea value={notes} onChange={(event) => saveNotes(event.target.value)} placeholder="Écrire une note…" />
            <button type="button" className="formation-studio__game-btn" onClick={() => setSheet(null)}>
              Fermer
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
