"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { LazyBandwidthVideo } from "@/components/media/lazy-bandwidth-video";

type LearnerProgress = {
  state: "none" | "percent" | "completed";
  percent: number | null;
};

type SubchapterOut = {
  id: string;
  title: string;
  learnerProgress: LearnerProgress;
};

type ChapterOut = {
  id: string;
  title: string;
  learnerProgress: LearnerProgress;
  subchapters: SubchapterOut[];
};

type Outline = {
  sections: Array<{
    id: string;
    title: string;
    chapters: ChapterOut[];
  }>;
};

function progressChipClass(p: LearnerProgress): string {
  if (p.state === "completed") return "border-emerald-500/40 bg-emerald-500/20 text-emerald-100";
  return "border-sky-500/35 bg-sky-500/15 text-sky-100";
}

function ProgressChip({ progress }: { progress: LearnerProgress }) {
  if (progress.state === "none") return null;
  if (progress.state === "completed") {
    return (
      <span
        className={cn(
          "pointer-events-none absolute right-2 top-2 z-20 rounded-full border px-2 py-0.5 text-[10px] font-semibold tabular-nums shadow-sm backdrop-blur-sm",
          progressChipClass(progress),
        )}
      >
        Terminé
      </span>
    );
  }
  if (typeof progress.percent === "number") {
    return (
      <span
        className={cn(
          "pointer-events-none absolute right-2 top-2 z-20 rounded-full border px-2 py-0.5 text-[10px] font-semibold tabular-nums shadow-sm backdrop-blur-sm",
          progressChipClass(progress),
        )}
      >
        {progress.percent}&nbsp;%
      </span>
    );
  }
  return null;
}

function CoverMedia({ url, label }: { url: string | null; label: string }) {
  if (!url) {
    return (
      <div
        className="absolute inset-0 bg-gradient-to-br from-indigo-950/90 via-zinc-900 to-violet-950/80"
        aria-hidden
      >
        <div className="absolute inset-0 flex items-center justify-center p-3 text-center text-[11px] font-semibold leading-snug text-white/35">
          {label.slice(0, 48)}
          {label.length > 48 ? "…" : ""}
        </div>
      </div>
    );
  }
  const u = url.trim().toLowerCase();
  if (u.endsWith(".mp4") || url.trim().startsWith("data:video/")) {
    return (
      <LazyBandwidthVideo
        src={url.trim()}
        rootMargin="60px"
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay={false}
        muted
        playsInline
        loop
        aria-hidden
      />
    );
  }
  return (
    <img
      src={url.trim()}
      alt=""
      className="absolute inset-0 h-full w-full object-cover"
      loading="lazy"
    />
  );
}

export function CourseOutlineDisclosure({
  courseId,
  slugOrId,
  locked,
  posterUrl,
  playBasePath = "/formations/",
}: {
  courseId: string;
  slugOrId: string;
  locked?: boolean;
  /** Couverture de l’étape parcours (prioritaire sur la cover formation API). */
  posterUrl?: string | null;
  /** Ex. `/formations/` — doit se terminer par `/`. */
  playBasePath?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [outline, setOutline] = useState<Outline | null>(null);
  const [learnerProgress, setLearnerProgress] = useState<LearnerProgress | null>(null);
  const [courseCover, setCourseCover] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const basePlay = playBasePath.endsWith("/") ? playBasePath : `${playBasePath}/`;

  useEffect(() => {
    let ignore = false;
    if (!expanded) return;

    setLoading(true);
    setError(null);
    fetch(`/api/courses/${encodeURIComponent(courseId)}/structure`, { credentials: "include" })
      .then(async (r) => {
        const json = (await r.json().catch(() => ({}))) as any;
        if (!r.ok) throw new Error(String(json?.error ?? `HTTP ${r.status}`));
        return json;
      })
      .then((json) => {
        if (ignore) return;
        const sections = Array.isArray(json?.sections) ? json.sections : [];
        const next = { sections } as Outline;
        const lp = json?.learnerProgress as LearnerProgress | undefined;
        const cover = typeof json?.courseCover === "string" && json.courseCover.trim() ? json.courseCover.trim() : null;
        setOutline(next);
        setCourseCover(cover);
        if (lp && typeof lp.state === "string") setLearnerProgress(lp);
        else setLearnerProgress(null);
        try {
          sessionStorage.setItem(
            `course_outline:${courseId}`,
            JSON.stringify({ ts: Date.now(), sections, learnerProgress: lp, courseCover: cover }),
          );
        } catch {
          // ignore
        }
      })
      .catch((e: unknown) => {
        if (ignore) return;
        setError(e instanceof Error ? e.message : "Impossible de charger le sommaire");
      })
      .finally(() => {
        if (ignore) return;
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [expanded, courseId]);

  const sections = useMemo(() => outline?.sections ?? [], [outline]);

  const poster = (posterUrl && String(posterUrl).trim()) || courseCover;

  const progressLabel = useMemo(() => {
    if (!learnerProgress || learnerProgress.state === "none") return null;
    if (learnerProgress.state === "completed") return "Terminé";
    if (typeof learnerProgress.percent === "number") return `${learnerProgress.percent} %`;
    return null;
  }, [learnerProgress]);

  const chapterProgressLabel = (p: LearnerProgress) => {
    if (p.state === "none") return null;
    if (p.state === "completed") return "Terminé";
    if (typeof p.percent === "number") return `${p.percent} %`;
    return null;
  };

  return (
    <div
      className="mt-3 w-full min-w-0 shrink-0 basis-full border-t border-white/10 pt-3"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-expanded={expanded}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (locked) return;
            setExpanded((v) => !v);
          }}
          disabled={Boolean(locked)}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70 transition hover:bg-white/10",
            locked ? "cursor-not-allowed opacity-50" : "",
          )}
        >
          <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform duration-200", expanded && "rotate-180")} />
          Sommaire
          {loading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : null}
        </button>
        {progressLabel ? (
          <span
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-semibold tabular-nums",
              learnerProgress?.state === "completed"
                ? "border-emerald-500/35 bg-emerald-500/15 text-emerald-200"
                : "border-sky-500/30 bg-sky-500/10 text-sky-100",
            )}
          >
            {progressLabel}
          </span>
        ) : null}
      </div>

      {expanded ? (
        <div
          className="mt-4 max-h-[min(78vh,820px)] overflow-y-auto rounded-2xl border border-white/10 bg-zinc-950/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm"
          role="region"
          aria-label="Sommaire de la formation"
        >
          {error ? <div className="text-sm text-white/60">{error}</div> : null}
          {!error && loading ? <div className="text-sm text-white/60">Chargement…</div> : null}
          {!error && !loading && sections.length === 0 ? (
            <div className="text-sm text-white/60">Sommaire indisponible pour cette formation.</div>
          ) : null}

          {!error && sections.length > 0 ? (
            <div className="space-y-10">
              {sections.map((s) => (
                <div key={s.id} className="space-y-5">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
                    {s.title || "Section"}
                  </h3>

                  <div className="space-y-8">
                    {(s.chapters ?? []).map((ch) => {
                      const chapterId = String(ch?.id ?? "").trim();
                      const chapterHref = chapterId
                        ? `${basePlay}${encodeURIComponent(slugOrId)}/play/${encodeURIComponent(chapterId)}`
                        : "#";
                      const chProg = ch.learnerProgress ?? { state: "none" as const, percent: null };
                      const subs = (ch.subchapters ?? []).slice(0, 36);

                      return (
                        <div
                          key={String(ch?.id ?? ch?.title ?? "chapter")}
                          className="rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-4 shadow-sm"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              {chapterId ? (
                                <Link
                                  href={chapterHref}
                                  className="text-sm font-semibold leading-snug text-white/95 transition hover:text-white"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {String(ch?.title ?? "Chapitre")}
                                </Link>
                              ) : (
                                <div className="text-sm font-semibold text-white/95">{String(ch?.title ?? "Chapitre")}</div>
                              )}
                            </div>
                            {chapterProgressLabel(chProg) ? (
                              <span
                                className={cn(
                                  "shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold tabular-nums",
                                  chProg.state === "completed"
                                    ? "border-emerald-500/35 bg-emerald-500/12 text-emerald-200"
                                    : "border-sky-500/30 bg-sky-500/10 text-sky-100",
                                )}
                              >
                                {chapterProgressLabel(chProg)}
                              </span>
                            ) : null}
                          </div>

                          {subs.length > 0 ? (
                            <div
                              className={cn(
                                "mt-4 flex gap-3 overflow-x-auto pb-2 pt-0.5",
                                "[scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.15)_transparent]",
                              )}
                            >
                              {subs.map((sub) => {
                                const subId = String(sub?.id ?? "").trim();
                                if (!subId) return null;
                                const href = `${basePlay}${encodeURIComponent(slugOrId)}/play/${encodeURIComponent(subId)}`;
                                const subProg = sub.learnerProgress ?? { state: "none" as const, percent: null };
                                return (
                                  <Link
                                    key={subId}
                                    href={href}
                                    onClick={(e) => e.stopPropagation()}
                                    className={cn(
                                      "group relative w-[132px] shrink-0 snap-start sm:w-[154px]",
                                      "rounded-xl border border-white/[0.08] bg-black/40 shadow-md",
                                      "transition duration-300 hover:-translate-y-0.5 hover:border-violet-400/30 hover:shadow-lg hover:shadow-violet-500/10",
                                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40",
                                    )}
                                  >
                                    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-zinc-900">
                                      <CoverMedia url={poster} label={String(sub?.title ?? "")} />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent opacity-95" />
                                      <ProgressChip progress={subProg} />
                                      <div className="absolute inset-x-0 bottom-0 z-10 p-2.5 pt-8">
                                        <p className="line-clamp-3 text-left text-[11px] font-semibold leading-snug text-white drop-shadow-md">
                                          {String(sub?.title ?? "Leçon")}
                                        </p>
                                      </div>
                                    </div>
                                  </Link>
                                );
                              })}
                            </div>
                          ) : chapterId ? (
                            <Link
                              href={chapterHref}
                              onClick={(e) => e.stopPropagation()}
                              className={cn(
                                "mt-4 block overflow-hidden rounded-xl border border-white/[0.08] bg-black/40 shadow-md",
                                "transition duration-300 hover:border-violet-400/30 hover:shadow-lg",
                              )}
                            >
                              <div className="relative aspect-[21/9] w-full sm:aspect-[24/9]">
                                <CoverMedia url={poster} label={String(ch?.title ?? "")} />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-transparent" />
                                <ProgressChip progress={chProg} />
                                <div className="absolute inset-y-0 left-0 z-10 flex max-w-[85%] flex-col justify-center p-4">
                                  <p className="text-sm font-semibold text-white drop-shadow">Ouvrir le chapitre</p>
                                  <p className="mt-1 line-clamp-2 text-xs text-white/70">{String(ch?.title ?? "")}</p>
                                </div>
                              </div>
                            </Link>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
