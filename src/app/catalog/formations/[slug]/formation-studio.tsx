"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Bell,
  BookOpen,
  ChevronLeft,
  Gamepad2,
  MoreHorizontal,
  Play,
  Search,
  Shield,
} from "lucide-react";
import { useSupabase } from "@/components/providers/supabase-provider";
import type { CourseBuilderSnapshot } from "@/types/course-builder";

type StudioItem = {
  id: string;
  title: string;
  subtitle: string;
  kind: "game" | "quiz" | "interview" | "content" | "resource";
  href: string;
  progress: number | null;
};

type StudioChapter = {
  id: string;
  title: string;
  duration: string;
  moduleId: string;
  moduleTitle: string;
  items: StudioItem[];
};

function stripText(value: unknown): string {
  return String(value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function initialsFrom(value: string, fallback: string): string {
  const parts = value
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return fallback;
}

function progressLabel(progress: number | null): string {
  if (progress != null && progress >= 100) return "Terminé";
  if (progress != null && progress > 0) return "En cours";
  return "À faire";
}

export function FormationStudio({
  title,
  description,
  playBase,
  backHref,
  snapshot,
  skills,
  episodes,
}: {
  title: string;
  description: string;
  playBase: string;
  backHref: string;
  snapshot: CourseBuilderSnapshot | null;
  skills: string[];
  episodes: { id: string; progress?: number | null }[];
}) {
  const supabase = useSupabase();
  const [query, setQuery] = useState("");
  const [orgName, setOrgName] = useState("Byound");
  const [userInitials, setUserInitials] = useState("BY");
  const [moreOpen, setMoreOpen] = useState(false);

  const progressById = useMemo(() => {
    const map = new Map<string, number | null>();
    episodes.forEach((episode) => {
      map.set(episode.id, typeof episode.progress === "number" ? episode.progress : null);
    });
    return map;
  }, [episodes]);

  const chapters = useMemo(() => {
    const sections = snapshot?.sections ?? [];
    const built: StudioChapter[] = [];
    sections.forEach((section, sectionIndex) => {
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
          const subtitle =
            kind === "game"
              ? "Scénario à embranchements"
              : kind === "quiz"
                ? "Débloque le badge"
                : kind === "interview"
                  ? "Échange guidé"
                  : kind === "resource"
                    ? "Ressource"
                    : stripText(raw.summary || raw.duration || raw.content).slice(0, 80) || "Contenu du chapitre";
          items.push({
            id,
            title: raw.title?.trim() || "Sans titre",
            subtitle,
            kind,
            href: `${playBase}/play/${encodeURIComponent(id)}`,
            progress: progressById.get(id) ?? null,
          });
        };

        (chapter.subchapters ?? []).forEach((sub) => pushItem(sub));
        if (!items.length) pushItem(chapter);

        built.push({
          id: chapter.id || `chapter-${sectionIndex}-${chapterIndex}`,
          title: chapter.title?.trim() || "Chapitre",
          duration: chapter.duration?.trim() || "5 min",
          moduleId: section.id || `module-${sectionIndex}`,
          moduleTitle: section.title?.trim() || "Module",
          items,
        });
      });
    });
    return built;
  }, [playBase, progressById, snapshot]);

  const [activeId, setActiveId] = useState<string | null>(chapters[0]?.id ?? null);
  const active = chapters.find((chapter) => chapter.id === activeId) ?? chapters[0] ?? null;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return chapters;
    return chapters.filter((chapter) => chapter.title.toLowerCase().includes(needle));
  }, [chapters, query]);

  const modules = useMemo(() => {
    const groups = new Map<string, { id: string; title: string; chapters: StudioChapter[] }>();
    filtered.forEach((chapter) => {
      const current = groups.get(chapter.moduleId) ?? {
        id: chapter.moduleId,
        title: chapter.moduleTitle,
        chapters: [],
      };
      current.chapters.push(chapter);
      groups.set(chapter.moduleId, current);
    });
    return [...groups.values()];
  }, [filtered]);

  const badgeLabel = String(snapshot?.general?.badgeLabel ?? "").trim();
  const game = active?.items.find((item) => item.kind === "game") ?? null;
  const resume = active?.items.find((item) => item.progress == null || item.progress < 100) ?? active?.items[0] ?? null;
  const known = (active?.items ?? []).map((item) => item.progress).filter((value): value is number => typeof value === "number");
  const progress = known.length ? Math.round(known.reduce((sum, value) => sum + value, 0) / known.length) : 0;
  const contentDone = (active?.items ?? []).every((item) => item.progress != null && item.progress >= 100);
  const certifyHref = resume ? `${resume.href}${resume.href.includes("?") ? "&" : "?"}certify=1` : playBase;
  const leadItem = active?.items.find((item) => item.kind !== "game") ?? active?.items[0] ?? null;

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

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#09090b] text-white">
      <aside className="hidden h-full min-h-0 w-[300px] shrink-0 flex-col overflow-hidden border-r border-white/5 bg-[#070709] lg:flex">
        <div className="flex items-center gap-3 px-5 pb-4 pt-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xs font-bold text-black">
            {initialsFrom(orgName, "BY")}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{orgName}</span>
            <span className="block text-[11px] text-white/40">Powered by Byound</span>
          </span>
        </div>
        <div className="px-4">
          <label className="flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-2 text-sm text-white/50">
            <Search className="h-4 w-4" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un chapitre"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
            />
          </label>
        </div>
        <div className="mt-6 px-5">
          <p className="text-[11px] text-white/35">Formation</p>
          <h1 className="mt-1 text-[28px] font-semibold leading-tight tracking-tight">{title}</h1>
        </div>
        <div className="mt-4 min-h-0 flex-1 space-y-5 overflow-y-auto px-3 pb-4">
          {modules.map((module) => (
            <div key={module.id}>
              <p className="px-2 text-xs text-white/35">{module.title}</p>
              <div className="mt-2 space-y-1">
                {module.chapters.map((chapter) => {
                  const selected = chapter.id === active?.id;
                  const chapterProgress = chapter.items
                    .map((item) => item.progress)
                    .filter((value): value is number => typeof value === "number");
                  const value = chapterProgress.length
                    ? Math.round(chapterProgress.reduce((sum, item) => sum + item, 0) / chapterProgress.length)
                    : 0;
                  return (
                    <button
                      key={chapter.id}
                      type="button"
                      onClick={() => setActiveId(chapter.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left ${
                        selected ? "bg-white/[0.06]" : "hover:bg-white/[0.04]"
                      }`}
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#5b4dff] text-white">
                        <BookOpen className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{chapter.title}</span>
                        <span className="block text-[11px] text-white/40">
                          {chapter.duration}
                          {value > 0 ? ` · ${value >= 100 ? "Terminé" : "En cours"}` : ""}
                        </span>
                      </span>
                      {value > 0 && value < 100 ? <span className="h-2 w-2 rounded-full bg-[#7c6bff]" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {!modules.length ? <p className="px-2 text-sm text-white/40">Aucun chapitre ne correspond.</p> : null}
        </div>
        <div className="shrink-0 border-t border-white/5 p-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-[11px] text-white/40">Badge de la formation</p>
            <p className="mt-1 truncate text-sm font-semibold">{badgeLabel || title}</p>
          </div>
          {skills.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {skills.slice(0, 3).map((skill) => (
                <span key={skill} className="rounded-full border border-white/10 bg-white px-3 py-1 text-[11px] font-semibold text-black">
                  {skill}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <header className="flex items-center justify-between px-4 py-4 sm:px-8">
          <Link href={backHref} className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-2 text-sm text-white/80">
            <ChevronLeft className="h-4 w-4" />
            Retour
          </Link>
          <div className="flex items-center gap-2 lg:hidden">
            <span className="text-sm font-semibold">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/apprenant"
              aria-label="Accueil"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-white/80"
            >
              <Bell className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/apprenant/profil"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xs font-bold text-black"
            >
              {userInitials}
            </Link>
          </div>
        </header>

        <div className="px-4 pb-10 sm:px-8">
          <div className="flex gap-2 overflow-x-auto pb-4 lg:hidden">
            {chapters.map((chapter) => (
              <button
                key={chapter.id}
                type="button"
                onClick={() => setActiveId(chapter.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs ${
                  chapter.id === active?.id ? "bg-white text-black" : "bg-white/10 text-white/70"
                }`}
              >
                {chapter.title}
              </button>
            ))}
          </div>

          {active ? (
            <>
              <div className="overflow-hidden rounded-[28px] bg-[radial-gradient(120%_140%_at_50%_0%,#3c2d72_0%,#1a1430_46%,#121218_100%)] px-6 py-10 text-center">
                <p className="text-xs text-white/55">
                  {title} · {active.moduleTitle}
                </p>
                <p className="mt-3 text-7xl font-semibold tracking-tight">{progress} %</p>
                <p className="mt-2 text-sm text-white/70">
                  {active.title} · {active.duration}
                </p>
                <div className="mx-auto mt-5 h-[3px] w-40 overflow-hidden rounded-full bg-white/10">
                  {progress > 0 ? (
                    <div className="h-full rounded-full bg-white/80" style={{ width: `${Math.min(100, progress)}%` }} />
                  ) : (
                    <div className="mx-auto h-full w-10 rounded-full bg-white/70" />
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-start justify-center gap-6">
                <Action href={resume?.href ?? playBase} icon={<Play className="h-5 w-5 fill-current" />} label="Reprendre" primary />
                {game ? (
                  <Action href={game.href} icon={<Gamepad2 className="h-5 w-5" />} label="Jeu" />
                ) : (
                  <span className="flex flex-col items-center gap-2 text-white/25">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.04]">
                      <Gamepad2 className="h-5 w-5" />
                    </span>
                    <span className="text-xs">Jeu</span>
                  </span>
                )}
                <Action href={certifyHref} icon={<Shield className="h-5 w-5" />} label="Certifier" />
                <button type="button" onClick={() => setMoreOpen((open) => !open)} className="flex flex-col items-center gap-2 text-xs text-white/80">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#23232a]">
                    <MoreHorizontal className="h-5 w-5" />
                  </span>
                  Plus
                </button>
              </div>
              {moreOpen ? (
                <p className="mx-auto mt-4 max-w-xl text-center text-sm leading-relaxed text-white/60">
                  {description || "Cette formation se suit chapitre par chapitre. Reprenez le contenu, lancez le jeu, puis passez la certification."}
                </p>
              ) : null}

              <div className="mt-8 grid gap-4 lg:grid-cols-2">
                {game ? (
                  <article id="jeu" className="rounded-[28px] border border-white/10 bg-[#141418] p-6">
                    <div className="flex items-center justify-between text-[11px] text-white/45">
                      <span className="rounded-full bg-[#5b4dff] px-2.5 py-1 font-semibold text-white">Jeu interactif</span>
                      <span>Plein écran</span>
                    </div>
                    <h2 className="mt-5 text-3xl font-semibold tracking-tight">{active.title}</h2>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-white/55">
                      Le jeu s&apos;ouvre en plein écran. Vous pouvez quitter à tout moment pour revenir au chapitre.
                    </p>
                    <Link
                      href={game.href}
                      className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black"
                    >
                      <Play className="h-4 w-4 fill-current" />
                      Commencer le jeu
                    </Link>
                  </article>
                ) : leadItem ? (
                  <article className="rounded-[28px] border border-white/10 bg-[#141418] p-6">
                    <p className="text-[11px] text-white/45">Contenu</p>
                    <h2 className="mt-5 text-3xl font-semibold tracking-tight">{leadItem.title}</h2>
                    <p className="mt-3 text-sm text-white/55">{leadItem.subtitle}</p>
                    <Link
                      href={leadItem.href}
                      className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black"
                    >
                      <Play className="h-4 w-4 fill-current" />
                      Reprendre
                    </Link>
                  </article>
                ) : null}

                <article id="certification" className="rounded-[28px] border border-white/10 bg-[#141418] p-6">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="rounded-full bg-[#f5c451] px-2.5 py-1 font-semibold text-black">Certification</span>
                    <span className="text-white/45">Open Badge</span>
                  </div>
                  <h2 className="mt-5 text-3xl font-semibold tracking-tight">Validez la formation</h2>
                  <p className="mt-3 text-sm leading-relaxed text-white/55">
                    Passez la certification pour débloquer votre badge {(badgeLabel || title).trim()}.
                  </p>
                  <Link
                    href={certifyHref}
                    className="mt-6 inline-flex rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    Passer la certification
                  </Link>
                </article>
              </div>

              <article id="contenu" className="mt-4 rounded-[28px] border border-white/10 bg-[#141418] p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Contenu du chapitre</h2>
                  {resume ? (
                    <Link href={resume.href} className="text-sm text-[#8b7cff]">
                      Tout voir
                    </Link>
                  ) : null}
                </div>
                <ol className="mt-4 divide-y divide-white/5">
                  {active.items.map((item, index) => (
                    <li key={item.id}>
                      <Link href={item.href} className="flex items-center gap-4 py-4">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-xs text-white/70">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium">
                            {item.kind === "game" ? "Jeu interactif" : item.kind === "quiz" ? "Certification" : item.title}
                          </span>
                          <span className="block truncate text-xs text-white/40">
                            {item.kind === "game" ? "Scénario à embranchements" : item.subtitle}
                          </span>
                        </span>
                        <span className="text-xs text-white/45">{progressLabel(item.progress)}</span>
                      </Link>
                    </li>
                  ))}
                  <li className="flex items-center gap-4 py-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-xs text-white/70">
                      {String(active.items.length + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">Certification</span>
                      <span className="block text-xs text-white/40">Débloque le badge</span>
                    </span>
                    <span className="text-xs text-white/45">{contentDone ? "À faire" : "Verrouillé"}</span>
                  </li>
                </ol>
              </article>
            </>
          ) : (
            <div className="rounded-[28px] border border-white/10 bg-[#141418] p-8">
              <h2 className="text-3xl font-semibold">{title}</h2>
              <p className="mt-3 max-w-xl text-sm text-white/60">{description || "Aucun chapitre n'est encore publié dans cette formation."}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Action({
  href,
  icon,
  label,
  primary = false,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link href={href} className="flex flex-col items-center gap-2 text-xs text-white/80">
      <span
        className={`flex h-14 w-14 items-center justify-center rounded-full ${
          primary ? "bg-[#6d5efc] text-white" : "bg-[#23232a] text-white"
        }`}
      >
        {icon}
      </span>
      {label}
    </Link>
  );
}
