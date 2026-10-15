"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Manrope } from "next/font/google";
import { ArrowRight, Bell, Check, ChevronRight, Lock, Menu, MoreHorizontal, NotebookPen, Play, Search, Shield, Sparkles } from "lucide-react";
import { LearningStrategyModal } from "@/components/apprenant/learning-strategy-modal";
import { useDyslexiaMode } from "@/components/apprenant/dyslexia-mode-provider";
import { useSupabase } from "@/components/providers/supabase-provider";
import type { CourseBuilderSnapshot } from "@/types/course-builder";
import "./formation-studio.css";

const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

type ProgressState = "none" | "percent" | "completed";
type ItemProgress = { state: ProgressState; percent: number | null };
type Activity = {
  available: boolean;
  totalActiveSeconds: number;
  weekSeconds: number[];
  previousWeekSeconds: number;
  streakDays: number;
};
type Certification = {
  status: "locked" | "unlocked" | "earned";
  percent: number;
  doneChapters: number;
  totalChapters: number;
  earnedAt: string | null;
};
type Leaf = {
  id: string;
  title: string;
  duration: string;
  typeLabel: string;
  href: string;
  progress: ItemProgress;
  locked: boolean;
  lockReason?: string;
  /** Changement de niveau sur la même page, sans recharger le serveur. */
  openLevel?: { chapterId: string; nodeId?: string };
};
type Node = {
  id: string;
  title: string;
  duration: string;
  progress: ItemProgress;
  locked: boolean;
  lockReason?: string;
  href: string;
  readingHref?: string;
  leaves: Leaf[];
};
type Chapter = {
  id: string;
  number: number;
  title: string;
  nodes: Node[];
};

const EMPTY_PROGRESS: ItemProgress = { state: "none", percent: null };
const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

function initialsFrom(value: string, fallback: string): string {
  const parts = value.split(/\s+/).map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return fallback;
}

function isDone(progress: ItemProgress): boolean {
  return progress.state === "completed" || (progress.percent ?? 0) >= 100;
}

function typeLabel(raw: { type?: string; kind?: string }): string {
  const kind = String(raw.kind ?? "");
  const type = String(raw.type ?? "");
  if (type === "interactive_game") return "Jeu interactif";
  if (kind === "quiz") return "Quiz";
  if (kind === "experiential_interview") return "Entretien";
  if (kind === "resource") return "Ressource";
  if (type === "video") return "Vidéo";
  if (type === "audio") return "Audio";
  if (type === "document") return "Document";
  if (type === "text") return "Lecture";
  return "Lecture";
}

function lockExplanation(previousTitle: string, condition?: string): string {
  const target = previousTitle.trim() || "l'élément précédent";
  if (condition === "previous_quiz_score") {
    return `Verrouillé : obtenez le score requis au quiz de « ${target} ».`;
  }
  return `Verrouillé : terminez « ${target} » pour continuer.`;
}

function plainText(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

function hidesChapterKicker(title: string): boolean {
  return Boolean(title.match(/^chapitre\s*\d+/i));
}

function joinMeta(parts: Array<string | false | null | undefined>): string {
  return parts.map((part) => (typeof part === "string" ? part.trim() : "")).filter(Boolean).join(" · ");
}

function nodeProgress(node: Node): ItemProgress {
  if (!node.leaves.length) return node.progress;
  const done = node.leaves.filter((leaf) => isDone(leaf.progress)).length;
  if (done === node.leaves.length) return { state: "completed", percent: 100 };
  if (done > 0 || node.leaves.some((leaf) => leaf.progress.state === "percent")) {
    return { state: "percent", percent: Math.round((done / node.leaves.length) * 100) };
  }
  return node.progress.state === "none" ? { state: "none", percent: null } : node.progress;
}

function formatActive(seconds: number): { value: string; unit: string } {
  const minutes = Math.max(0, Math.round(seconds / 60));
  if (minutes < 60) return { value: String(minutes), unit: "min" };
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return { value: rest ? `${hours} h ${rest}` : String(hours), unit: rest ? "" : "h" };
}

export function FormationStudio({
  courseId,
  code,
  title,
  description,
  cover,
  playBase,
  backHref,
  snapshot,
}: {
  courseId: string;
  code: string;
  title: string;
  description?: string;
  cover?: string | null;
  playBase: string;
  backHref: string;
  snapshot: CourseBuilderSnapshot | null;
  skills?: string[];
  episodes?: { id: string; progress?: number | null }[];
}) {
  const supabase = useSupabase();
  const searchParams = useSearchParams();
  const [chapterParam, setChapterParam] = useState<string | null>(searchParams.get("chapitre"));
  const [niveauParam, setNiveauParam] = useState<string | null>(searchParams.get("niveau"));
  const { isDyslexiaMode, toggleDyslexiaMode } = useDyslexiaMode();
  const [query, setQuery] = useState("");
  const [drawer, setDrawer] = useState(false);
  const [strategyOpen, setStrategyOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState<"presentation" | "objectives" | null>(null);
  const [orgName, setOrgName] = useState("Byound");
  const [userInitials, setUserInitials] = useState("BY");
  const [outline, setOutline] = useState<ItemProgress>(EMPTY_PROGRESS);
  const [progressById, setProgressById] = useState<Map<string, ItemProgress>>(new Map());
  const [activity, setActivity] = useState<Activity | null>(null);
  const [certification, setCertification] = useState<Certification | null>(null);
  const [tab, setTab] = useState<"completion" | "time" | "streak">("completion");
  const [openIds, setOpenIds] = useState<string[]>([]);
  const [treeReady, setTreeReady] = useState(false);

  const chapters = useMemo(() => {
    const linear = Boolean(snapshot?.general?.linear_progression);
    const built: Chapter[] = [];
    let previousDone = true;
    let previousTitle = "";
    (snapshot?.sections ?? []).forEach((section, sectionIndex) => {
      const nodes: Node[] = [];
      (section.chapters ?? []).forEach((chapter, chapterIndex) => {
        const locked = (linear || Boolean(chapter.unlock_condition)) && !(sectionIndex === 0 && chapterIndex === 0) && !previousDone;
        const lockReason = locked ? lockExplanation(previousTitle, chapter.unlock_condition) : undefined;
        const leaves: Leaf[] = (chapter.subchapters ?? []).map((sub) => ({
          id: String(sub.id),
          title: sub.title?.trim() || "Sans titre",
          duration: sub.duration?.trim() || "",
          typeLabel: typeLabel(sub),
          href: `${playBase}/play/${encodeURIComponent(sub.id)}`,
          progress: progressById.get(String(sub.id)) ?? EMPTY_PROGRESS,
          locked,
          lockReason,
        }));
        const readingHref = `${playBase}/play/${encodeURIComponent(chapter.id)}`;
        if (readingHref && leaves.length) {
          leaves.unshift({
            id: `${chapter.id}-reading`,
            title: "Lire le chapitre",
            duration: chapter.duration?.trim() || "",
            typeLabel: typeLabel(chapter),
            href: readingHref,
            progress: progressById.get(String(chapter.id)) ?? EMPTY_PROGRESS,
            locked,
            lockReason,
          });
        }
        const own = progressById.get(String(chapter.id)) ?? EMPTY_PROGRESS;
        const done = leaves.length ? leaves.every((leaf) => isDone(leaf.progress)) : isDone(own);
        previousDone = done;
        previousTitle = chapter.title?.trim() || previousTitle;
        nodes.push({
          id: String(chapter.id),
          title: chapter.title?.trim() || "Sans titre",
          duration: chapter.duration?.trim() || "",
          progress: own,
          locked,
          lockReason,
          href: `${playBase}/play/${encodeURIComponent(chapter.id)}`,
          readingHref,
          leaves,
        });
      });
      built.push({
        id: String(section.id || `section-${sectionIndex}`),
        number: sectionIndex + 1,
        title: section.title?.trim() || "Chapitre",
        nodes,
      });
    });
    return built;
  }, [playBase, progressById, snapshot]);

  const flatLeaves = useMemo(
    () =>
      chapters.flatMap((chapter) =>
        chapter.nodes.flatMap((node) =>
          node.leaves.length
            ? node.leaves.map((leaf) => ({ ...leaf, chapterId: chapter.id, nodeId: node.id }))
            : [{ id: node.id, title: node.title, duration: node.duration, typeLabel: "Lecture", href: node.href, progress: node.progress, locked: node.locked, lockReason: node.lockReason, chapterId: chapter.id, nodeId: node.id }],
        ),
      ),
    [chapters],
  );
  const resume = flatLeaves.find((leaf) => !leaf.locked && !isDone(leaf.progress)) ?? null;
  const doneLeaves = flatLeaves.filter((leaf) => isDone(leaf.progress)).length;
  const leafScore = flatLeaves.length
    ? Math.round(
        flatLeaves.reduce((sum, leaf) => sum + (isDone(leaf.progress) ? 100 : leaf.progress.percent ?? 0), 0) /
          flatLeaves.length,
      )
    : 0;
  const formationPercent =
    outline.state === "completed" ? 100 : Math.max(0, Math.min(100, Math.max(outline.percent ?? 0, leafScore)));
  const resumeChapter = chapters.find((chapter) => chapter.id === resume?.chapterId) ?? chapters[0] ?? null;
  const selectedChapter =
    chapters.find((chapter) => chapter.id === chapterParam) ??
    chapters.find((chapter) => chapter.nodes.some((node) => node.id === niveauParam)) ??
    resumeChapter;
  const selectedNode = niveauParam ? selectedChapter?.nodes.find((node) => node.id === niveauParam) ?? null : null;
  const goLevel = (chapterId?: string | null, nodeId?: string | null) => {
    setChapterParam(chapterId ?? null);
    setNiveauParam(nodeId ?? null);
    const params = new URLSearchParams(window.location.search);
    if (chapterId) params.set("chapitre", chapterId);
    else params.delete("chapitre");
    if (nodeId) params.set("niveau", nodeId);
    else params.delete("niveau");
    const query = params.toString();
    window.history.replaceState(null, "", query ? `${window.location.pathname}?${query}` : window.location.pathname);
  };
  const nextChapter = chapters[chapters.findIndex((chapter) => chapter.id === resumeChapter?.id) + 1] ?? null;
  const nextHref = nextChapter?.nodes[0]?.leaves[0]?.href || nextChapter?.nodes[0]?.href || null;
  const actionHref = resume?.href ?? nextHref ?? playBase;
  const actionLabel = !resume ? "Suivant" : doneLeaves === 0 ? "Commencer" : "Reprendre";
  const storageKey = `formation-tree:${courseId}`;
  const treeInit = useRef(false);

  const filteredChapters = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return chapters;
    return chapters
      .map((chapter) => {
        const nodes = chapter.nodes
          .map((node) => {
            const leaves = node.leaves.filter((leaf) => leaf.title.toLowerCase().includes(needle));
            const self = node.title.toLowerCase().includes(needle) || chapter.title.toLowerCase().includes(needle);
            if (!self && !leaves.length) return null;
            return { ...node, leaves: leaves.length ? leaves : node.leaves };
          })
          .filter((node): node is Node => Boolean(node));
        return nodes.length ? { ...chapter, nodes } : null;
      })
      .filter((chapter): chapter is Chapter => Boolean(chapter));
  }, [chapters, query]);

  const searchOpen = useMemo(() => {
    const ids = new Set<string>();
    if (!query.trim()) return ids;
    filteredChapters.forEach((chapter) => {
      ids.add(chapter.id);
      chapter.nodes.forEach((node) => {
        if (node.leaves.length) ids.add(node.id);
      });
    });
    return ids;
  }, [filteredChapters, query]);

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
    const load = () => {
      void fetch(`/api/courses/${encodeURIComponent(courseId)}/structure`, { credentials: "include", cache: "no-store" })
        .then((response) => (response.ok ? response.json() : null))
        .then((payload) => {
          if (!payload || cancel) return;
          const next = new Map<string, ItemProgress>();
          for (const section of payload.sections ?? []) {
            for (const chapter of section.chapters ?? []) {
              if (chapter?.id) next.set(String(chapter.id), chapter.ownProgress ?? chapter.learnerProgress ?? EMPTY_PROGRESS);
              for (const sub of chapter.subchapters ?? []) {
                if (sub?.id && sub.learnerProgress) next.set(String(sub.id), sub.learnerProgress);
              }
            }
          }
          setProgressById(next);
          if (payload.learnerProgress) setOutline(payload.learnerProgress);
          if (payload.activity) setActivity(payload.activity);
          if (payload.certification) setCertification(payload.certification);
        })
        .catch(() => undefined);
    };
    load();
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancel = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [courseId]);

  useEffect(() => {
    if (treeInit.current || !chapters.length) return;
    treeInit.current = true;
    try {
      const raw = window.localStorage.getItem(storageKey);
      const stored = raw ? (JSON.parse(raw) as string[]) : [];
      if (Array.isArray(stored) && stored.length) setOpenIds(stored);
      else if (resumeChapter) setOpenIds([resumeChapter.id, resume?.nodeId].filter((id): id is string => Boolean(id)));
    } catch {
      if (resumeChapter) setOpenIds([resumeChapter.id, resume?.nodeId].filter((id): id is string => Boolean(id)));
    }
    setTreeReady(true);
  }, [chapters.length, resume?.nodeId, resumeChapter, storageKey]);

  useEffect(() => {
    if (!treeReady) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(openIds));
    } catch {
      /* navigation privée */
    }
  }, [openIds, storageKey, treeReady]);

  const toggle = (id: string) => {
    setOpenIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };
  const isOpen = (id: string) => searchOpen.has(id) || openIds.includes(id);
  const time = formatActive(activity?.totalActiveSeconds ?? 0);
  const weekTotal = (activity?.weekSeconds ?? []).reduce((sum, value) => sum + value, 0);
  const weekMax = Math.max(1, ...(activity?.weekSeconds ?? [0]));
  const delta = weekTotal - (activity?.previousWeekSeconds ?? 0);
  const levelRows: Leaf[] = selectedNode
    ? selectedNode.leaves
    : (selectedChapter?.nodes ?? []).map((node) => ({
        id: node.id,
        title: node.title,
        duration: node.duration,
        typeLabel: node.leaves.length ? "" : "Lecture",
        href: node.readingHref || (node.leaves.length ? playBase : node.href),
        openLevel:
          node.readingHref || !node.leaves.length || !selectedChapter
            ? undefined
            : { chapterId: selectedChapter.id, nodeId: node.id },
        progress: nodeProgress(node),
        locked: node.locked,
        lockReason: node.lockReason,
      }));
  const levelDone = levelRows.filter((row) => isDone(row.progress)).length;
  const levelNext = levelRows.find((row) => !row.locked && !isDone(row.progress)) ?? null;
  const chaptersDone = chapters.filter((chapter) => {
    const leaves = chapter.nodes.flatMap((node) => (node.leaves.length ? node.leaves : [node]));
    return leaves.length > 0 && leaves.every((item) => isDone(item.progress));
  }).length;
  const partTotal = selectedChapter?.nodes.length ?? 0;
  const partDone = (selectedChapter?.nodes ?? []).filter((node) =>
    node.leaves.length ? node.leaves.every((leaf) => isDone(leaf.progress)) : isDone(node.progress),
  ).length;
  const levelTitle = selectedNode?.title ?? selectedChapter?.title ?? title;
  const levelLabel = levelDone === 0 ? "Commencer" : levelNext ? "Reprendre" : "Chapitre suivant";
  const showIndicatorTabs = Boolean(activity?.available);
  const presentation = plainText(snapshot?.general?.presentation || snapshot?.general?.description || description || "");
  const objectives = [...new Set([...(snapshot?.general?.objectifs ?? []), ...(snapshot?.objectives ?? [])].flatMap((item) => item.split(/\n+/)).map((item) => item.trim()).filter(Boolean))];
  const coverUrl = [cover, snapshot?.general?.cover_image, snapshot?.general?.heroImage].find((value) => typeof value === "string" && /^https?:\/\//i.test(value.trim()))?.trim() ?? "";
  const badge = certification ?? {
    status: formationPercent >= 100 ? "unlocked" : "locked",
    percent: formationPercent,
    doneChapters: chapters.filter((chapter) => chapter.nodes.every((node) => (node.leaves.length ? node.leaves.every((leaf) => isDone(leaf.progress)) : isDone(node.progress)))).length,
    totalChapters: chapters.length,
    earnedAt: null,
  };
  const share = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={`formation-studio ${manrope.className}`}>
      {drawer ? <button type="button" className="formation-studio__backdrop" aria-label="Fermer le menu" onClick={() => setDrawer(false)} /> : null}
      <aside className="formation-studio__sidebar" data-open={drawer} aria-label="Chapitres">
        <div className="formation-studio__brand">
          <span className="formation-studio__avatar">{initialsFrom(orgName, "BY")}</span>
          <span>
            <span className="formation-studio__name">{orgName}</span>
            <span className="formation-studio__powered">Powered by Byound</span>
          </span>
        </div>
        <div className="formation-studio__heading">
          <p className="formation-studio__kicker">Formation</p>
          <h1>{title}</h1>
        </div>
        <label className="formation-studio__search">
          <Search size={18} strokeWidth={2} aria-hidden />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un chapitre" />
        </label>
        <div className="formation-studio__tree">
          {filteredChapters.map((chapter) => {
            const partsDone = chapter.nodes.filter((node) =>
              node.leaves.length ? node.leaves.every((leaf) => isDone(leaf.progress)) : isDone(node.progress),
            ).length;
            const panelId = `chapter-panel-${chapter.id}`;
            const chapterCurrent = chapter.id === selectedChapter?.id && !selectedNode;
            return (
              <div key={chapter.id}>
                <button
                  type="button"
                  className="formation-studio__chapter"
                  aria-expanded={isOpen(chapter.id)}
                  aria-current={chapterCurrent ? "page" : undefined}
                  aria-controls={panelId}
                  onClick={() => {
                    toggle(chapter.id);
                    goLevel(chapter.id);
                  }}
                >
                  <ChevronRight className="formation-studio__chevron" size={16} strokeWidth={2} aria-hidden />
                  <span className="formation-studio__chapter-copy">
                    {hidesChapterKicker(chapter.title) ? null : <span className="formation-studio__kicker">Chapitre {chapter.number}</span>}
                    <span className="formation-studio__chapter-title" title={chapter.title}>
                      {chapter.title}
                    </span>
                  </span>
                  <span className="formation-studio__count">
                    {partsDone}/{chapter.nodes.length}
                  </span>
                </button>
                {isOpen(chapter.id) ? (
                  <div id={panelId} className="formation-studio__children">
                    {chapter.nodes.map((node) => {
                      const nodeDone = node.leaves.filter((leaf) => isDone(leaf.progress)).length;
                      if (!node.leaves.length) {
                        return (
                          <Link key={node.id} href={node.locked ? playBase : node.href} className="formation-studio__leaf" data-locked={node.locked || undefined} title={node.lockReason} onClick={(event) => { if (node.locked) event.preventDefault(); }}>
                            <span className="formation-studio__dot" data-state={node.locked ? undefined : isDone(node.progress) ? "done" : node.id === resume?.id ? "next" : node.progress.state === "percent" ? "progress" : undefined} />
                            <span className="formation-studio__leaf-copy">
                              <span className="formation-studio__leaf-title" title={node.title}>{node.title}</span>
                              <span className="formation-studio__meta">{joinMeta([node.duration, node.locked ? null : isDone(node.progress) ? "Terminé" : "À faire"])}</span>
                            </span>
                            <span className="formation-studio__lock" title={node.lockReason} aria-label={node.lockReason}>{node.locked ? <Lock size={14} strokeWidth={2} aria-hidden /> : null}</span>
                          </Link>
                        );
                      }
                      const nodePanel = `node-panel-${node.id}`;
                      return (
                        <div key={node.id}>
                          <div
                            className="formation-studio__node"
                            data-locked={node.locked || undefined}
                            aria-expanded={isOpen(node.id)}
                            aria-current={selectedNode?.id === node.id ? "page" : undefined}
                          >
                            <button
                              type="button"
                              className="formation-studio__node-toggle"
                              aria-label={isOpen(node.id) ? "Replier" : "Déployer"}
                              aria-controls={nodePanel}
                              title={node.lockReason}
                              onClick={() => {
                                toggle(node.id);
                                goLevel(chapter.id, node.id);
                              }}
                            >
                              <ChevronRight className="formation-studio__chevron" size={14} strokeWidth={2} aria-hidden />
                            </button>
                            {node.readingHref && !node.locked ? (
                              <Link href={node.readingHref} className="formation-studio__node-read" title={node.title}>
                                <span className="formation-studio__leaf-copy">
                                  <span className="formation-studio__leaf-title" title={node.title}>{node.title}</span>
                                  <span className="formation-studio__meta">{joinMeta([node.duration, `${nodeDone}/${node.leaves.length}`])}</span>
                                </span>
                              </Link>
                            ) : (
                              <button
                                type="button"
                                className="formation-studio__node-read"
                                title={node.lockReason}
                                onClick={() => {
                                  toggle(node.id);
                                  goLevel(chapter.id, node.id);
                                }}
                              >
                                <span className="formation-studio__leaf-copy">
                                  <span className="formation-studio__leaf-title" title={node.title}>{node.title}</span>
                                  <span className="formation-studio__meta">{joinMeta([node.duration, `${nodeDone}/${node.leaves.length}`])}</span>
                                </span>
                              </button>
                            )}
                            <span className="formation-studio__lock" title={node.lockReason} aria-label={node.lockReason}>{node.locked ? <Lock size={14} strokeWidth={2} aria-hidden /> : null}</span>
                          </div>
                          {isOpen(node.id) ? (
                            <div id={nodePanel} className="formation-studio__children">
                              {node.leaves.map((leaf) => (
                                <Link
                                  key={leaf.id}
                                  href={leaf.locked ? playBase : leaf.href}
                                  className="formation-studio__leaf"
                                  title={leaf.lockReason}
                                  data-locked={leaf.locked || undefined}
                                  aria-disabled={leaf.locked || undefined}
                                  onClick={(event) => {
                                    if (leaf.locked) event.preventDefault();
                                  }}
                                >
                                  <span className="formation-studio__dot" data-state={leaf.locked ? undefined : isDone(leaf.progress) ? "done" : leaf.id === resume?.id ? "next" : leaf.progress.state === "percent" ? "progress" : undefined} />
                                  <span className="formation-studio__leaf-copy">
                                    <span className="formation-studio__leaf-title" title={leaf.title}>{leaf.title}</span>
                                    <span className="formation-studio__meta">{joinMeta([leaf.duration, leaf.locked ? null : isDone(leaf.progress) ? "Terminé" : leaf.progress.percent ? `${leaf.progress.percent} %` : "À faire"])}</span>
                                  </span>
                                  <span className="formation-studio__lock" title={leaf.lockReason} aria-label={leaf.lockReason}>{leaf.locked ? <Lock size={14} strokeWidth={2} aria-hidden /> : null}</span>
                                </Link>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
          {!filteredChapters.length ? <p className="formation-studio__meta">Aucun chapitre ne correspond.</p> : null}
        </div>
        <div className="formation-studio__chips">
          <button type="button" aria-pressed={isDyslexiaMode} onClick={() => toggleDyslexiaMode()}>
            Neuro
          </button>
          <button type="button" onClick={() => setStrategyOpen(true)}>
            + Stratégie
          </button>
        </div>
      </aside>

      <section className="formation-studio__main">
        <header className="formation-studio__topbar">
          <button type="button" className="formation-studio__icon-btn formation-studio__menu" aria-label="Ouvrir les chapitres" onClick={() => setDrawer(true)}>
            <Menu size={18} strokeWidth={2} />
          </button>
          <Link href={backHref} className="formation-studio__icon-btn" aria-label="Retour">
            <ChevronRight size={18} strokeWidth={2} style={{ transform: "rotate(180deg)" }} />
          </Link>
          <nav className="formation-studio__crumbs" aria-label="Fil d'Ariane">
            {selectedChapter ? <button type="button" onClick={() => goLevel()}>{code}</button> : <span aria-current="page">{code}</span>}
            {selectedChapter && selectedNode ? (
              <>
                <span aria-hidden>/</span>
                <button type="button" onClick={() => goLevel(selectedChapter.id)}>Chapitre {selectedChapter.number}</button>
                <span aria-hidden>/</span>
                <span aria-current="page">{selectedNode.title}</span>
              </>
            ) : selectedChapter ? (
              <>
                <span aria-hidden>/</span>
                <span aria-current="page">Chapitre {selectedChapter.number}</span>
              </>
            ) : null}
          </nav>
          <div className="formation-studio__tools">
            <Link href="/dashboard/apprenant" className="formation-studio__icon-btn" aria-label="Notifications">
              <Bell size={18} strokeWidth={2} />
            </Link>
            <Link href="/dashboard/apprenant/profil" className="formation-studio__avatar" aria-label="Profil">
              {userInitials}
            </Link>
          </div>
        </header>

        <div className="formation-studio__hero">
          {showIndicatorTabs ? (
            <div className="formation-studio__tabs" role="tablist" aria-label="Indicateur">
              <button type="button" role="tab" aria-selected={tab === "completion"} onClick={() => setTab("completion")}>
                Complétion
              </button>
              <button type="button" role="tab" aria-selected={tab === "time"} onClick={() => setTab("time")}>
                Temps passé
              </button>
              <button type="button" role="tab" aria-selected={tab === "streak"} onClick={() => setTab("streak")}>
                Série
              </button>
            </div>
          ) : null}
          {tab === "time" && showIndicatorTabs ? (
            <>
              <p className="formation-studio__score">
                {time.value}
                {time.unit ? <span>{time.unit}</span> : null}
              </p>
              <p className="formation-studio__context">Depuis le début de la formation</p>
            </>
          ) : tab === "streak" && showIndicatorTabs ? (
            <>
              <p className="formation-studio__score">
                {activity?.streakDays ?? 0}
                <span>{(activity?.streakDays ?? 0) > 1 ? "jours" : "jour"}</span>
              </p>
              <p className="formation-studio__context">Reviens demain pour continuer ta série</p>
            </>
          ) : (
            <>
              {showIndicatorTabs ? null : <p className="formation-studio__legend">Complétion</p>}
              <p className="formation-studio__score">
                {formationPercent}
                <span>%</span>
              </p>
              <p className="formation-studio__context">
                {chaptersDone} chapitre{chaptersDone > 1 ? "s" : ""} sur {chapters.length}
              </p>
            </>
          )}
          <div className="formation-studio__actions">
            <Link href={actionHref} className="formation-studio__action" aria-label={actionLabel}>
              <span className="formation-studio__round">
                <Play size={22} strokeWidth={2} />
              </span>
              {actionLabel}
            </Link>
            <Link href={actionHref} className="formation-studio__action" aria-label="Coach IA">
              <span className="formation-studio__round formation-studio__round--quiet">
                <Sparkles size={22} strokeWidth={2} />
              </span>
              Coach IA
            </Link>
            <Link href="/beyond-note-app" className="formation-studio__action" aria-label="Mes notes">
              <span className="formation-studio__round formation-studio__round--quiet">
                <NotebookPen size={22} strokeWidth={2} />
              </span>
              Mes notes
            </Link>
            <div className="formation-studio__more">
              <button type="button" className="formation-studio__action" aria-expanded={moreOpen} aria-label="Plus" onClick={() => setMoreOpen((open) => !open)}>
                <span className="formation-studio__round formation-studio__round--quiet">
                  <MoreHorizontal size={22} strokeWidth={2} />
                </span>
                Plus
              </button>
              {moreOpen ? (
                <div className="formation-studio__more-menu">
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false);
                      setStrategyOpen(true);
                    }}
                  >
                    Stratégie d&apos;apprentissage
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {coverUrl || presentation || objectives.length ? (
          <section className="formation-studio__docs">
            {coverUrl ? <img className="formation-studio__cover" src={coverUrl} alt="" /> : null}
            <div className="formation-studio__doc-actions">
              <button type="button" disabled={!presentation} onClick={() => setDetailOpen("presentation")}>
                Présentation
              </button>
              <button type="button" disabled={!objectives.length} onClick={() => setDetailOpen("objectives")}>
                Objectifs pédagogiques
              </button>
            </div>
          </section>
        ) : null}

        <div className="formation-studio__grid">
          <article className="formation-studio__card formation-studio__current">
            <span className="formation-studio__orb formation-studio__orb--a" aria-hidden />
            <span className="formation-studio__orb formation-studio__orb--b" aria-hidden />
            <p className="formation-studio__kicker">Chapitre en cours</p>
            <p>
              {partDone}/{partTotal}
            </p>
            <h2>{levelTitle}</h2>
            <p>{levelNext ? `Prochain : ${levelNext.title}` : "Tous les éléments de ce niveau sont terminés."}</p>
            <Link href={levelNext?.href ?? nextHref ?? playBase} className="formation-studio__pill">
              {levelLabel}
            </Link>
          </article>

          {activity?.available ? (
            <article className="formation-studio__card">
              <p className="formation-studio__kicker">Cette semaine</p>
              <p className="formation-studio__week-total">
                {formatActive(weekTotal).value} {formatActive(weekTotal).unit}
                <span className="formation-studio__delta">
                  {delta >= 0 ? "+" : "−"}
                  {formatActive(Math.abs(delta)).value} {formatActive(Math.abs(delta)).unit}
                </span>
              </p>
              <div
                className="formation-studio__bars"
                role="img"
                aria-label={`Temps du lundi au dimanche : ${activity.weekSeconds.map((value, index) => `${WEEKDAYS[index]} ${Math.round(value / 60)} min`).join(", ")}`}
              >
                {activity.weekSeconds.map((value, index) => (
                  <span key={WEEKDAYS[index] + index} data-on={value > 0} style={{ height: `${Math.max(8, Math.round((value / weekMax) * 100))}%` }} />
                ))}
              </div>
            </article>
          ) : null}

          <article className="formation-studio__card formation-studio__badge">
            {badge.status === "earned" ? (
              <>
                <span className="formation-studio__seal">
                  <Check size={22} strokeWidth={2} />
                </span>
                <h2>Badge {code}</h2>
                <p>{badge.earnedAt ? `Obtenu le ${new Date(badge.earnedAt).toLocaleDateString("fr-FR")}.` : "Certification validée."}</p>
                <Link href="/dashboard/apprenant/badges" className="formation-studio__pill">
                  Voir mon badge
                </Link>
                <button type="button" className="formation-studio__gold-btn" onClick={share}>
                  Partager sur LinkedIn
                </button>
              </>
            ) : badge.status === "unlocked" ? (
              <>
                <span className="formation-studio__seal">
                  <Shield size={22} strokeWidth={2} />
                </span>
                <h2>Badge {code}</h2>
                <p>Tous les chapitres sont terminés.</p>
                <Link href={`${actionHref}${actionHref.includes("?") ? "&" : "?"}certify=1`} className="formation-studio__gold-btn">
                  Passer la certification
                </Link>
              </>
            ) : (
              <>
                <span className="formation-studio__seal">
                  <Lock size={22} strokeWidth={2} />
                </span>
                <h2>Badge {code}</h2>
                <p>Se débloque quand tous les chapitres sont terminés.</p>
                <div className="formation-studio__gauge" aria-hidden>
                  <span style={{ width: `${badge.totalChapters ? Math.round((badge.doneChapters / badge.totalChapters) * 100) : 0}%` }} />
                </div>
                <p>
                  {badge.doneChapters} / {badge.totalChapters} chapitres terminés
                </p>
              </>
            )}
          </article>
        </div>

        <div className="formation-studio__follow">
          <article className="formation-studio__card">
            <div className="formation-studio__list-head">
              <h3>{selectedNode ? "Sous-chapitres" : "Parties"}</h3>
              <span>
                {levelDone} sur {levelRows.length}
              </span>
            </div>
            <ol className="formation-studio__list">
              {levelRows.map((leaf, index) => {
                const next = levelNext?.id === leaf.id;
                const done = isDone(leaf.progress);
                return (
                  <li key={leaf.id}>
                    <Link
                      href={leaf.locked ? playBase : leaf.href}
                      title={leaf.lockReason}
                      className="formation-studio__row"
                      data-next={next || undefined}
                      aria-disabled={leaf.locked || undefined}
                      onClick={(event) => {
                        if (leaf.locked) {
                          event.preventDefault();
                          return;
                        }
                        if (leaf.openLevel) {
                          event.preventDefault();
                          goLevel(leaf.openLevel.chapterId, leaf.openLevel.nodeId);
                        }
                      }}
                    >
                      <span className="formation-studio__index" data-state={done ? "done" : next ? "next" : undefined}>
                        {done ? <Check size={16} strokeWidth={2} /> : String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="formation-studio__row-copy">
                        <span className="formation-studio__row-title">{leaf.title}</span>
                        <span className="formation-studio__meta">{[leaf.typeLabel, leaf.duration].filter(Boolean).join(" · ")}</span>
                      </span>
                      <span className="formation-studio__status" data-state={done ? "done" : next ? "next" : undefined}>
                        {done ? "Terminé" : next ? "Prochain" : "À faire"}
                      </span>
                      <ChevronRight size={16} strokeWidth={2} aria-hidden />
                    </Link>
                  </li>
                );
              })}
            </ol>
          </article>

          {nextChapter && nextHref ? (
            <article className="formation-studio__card">
              <p className="formation-studio__kicker">Chapitre suivant</p>
              <h3>{nextChapter.title}</h3>
              <Link href={nextHref} className="formation-studio__icon-btn" aria-label={`Ouvrir ${nextChapter.title}`} style={{ marginTop: 16 }}>
                <ArrowRight size={18} strokeWidth={2} />
              </Link>
            </article>
          ) : null}
        </div>
      </section>

      {detailOpen ? (
        <div className="formation-studio__sheet" role="dialog" aria-modal="true" aria-label={detailOpen === "presentation" ? "Présentation" : "Objectifs pédagogiques"}>
          <button type="button" className="formation-studio__sheet-backdrop" aria-label="Fermer" onClick={() => setDetailOpen(null)} />
          <div className="formation-studio__sheet-panel">
            <h2>{detailOpen === "presentation" ? "Présentation" : "Objectifs pédagogiques"}</h2>
            {detailOpen === "presentation" ? <p>{presentation}</p> : (
              <ol className="formation-studio__goal-list">
                {objectives.map((objective) => (
                  <li key={objective}>{objective}</li>
                ))}
              </ol>
            )}
            <button type="button" className="formation-studio__pill" onClick={() => setDetailOpen(null)}>
              Fermer
            </button>
          </div>
        </div>
      ) : null}
      <LearningStrategyModal isOpen={strategyOpen} onClose={() => setStrategyOpen(false)} />
    </div>
  );
}
