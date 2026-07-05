"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Award, ChevronLeft, ChevronRight, Clock, Star, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { coverRawToDisplayUrl, pickCoverImageFromItem } from "@/lib/formation-cover";
import { LazyBandwidthVideo } from "@/components/media/lazy-bandwidth-video";
import { deriveCourseCardMeta } from "@/lib/edge-online/course-hero-meta";
import type { LearnerCard } from "@/lib/queries/apprenant";

type SliderCard = {
  id: string;
  title: string;
  href: string;
  slug?: string | null;
  image?: string | null;
  cover_url?: string | null;
  image_url?: string | null;
  cover_image?: string | null;
  hero_image_url?: string | null;
  level?: string | null;
  category_name?: string | null;
  category?: string | null;
  presentation?: string | null;
  progress?: number | null;
  builder_snapshot?: unknown;
};

const PLAYMAKERS_LOGO =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/Playmakers/Copie%20de%20Jessica%20Contentin%20(1).png";

function isVideoUrl(url: string): boolean {
  const u = String(url ?? "").toLowerCase();
  return u.endsWith(".mp4") || u.endsWith(".webm") || u.endsWith(".mov");
}

const levelToBars = (level?: string | null): number => {
  const v = String(level ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (!v) return 0;
  if (v.includes("debutant") || v.includes("beginner")) return 1;
  if (v.includes("acquisition")) return 2;
  if (v.includes("interm") || v === "intermediate") return 3;
  if (v.includes("specialiste") || v.includes("specialist")) return 4;
  if (v.includes("expert") || v === "advanced") return 5;
  return 0;
};

function resolveDisplayUrl(card: SliderCard): string {
  return coverRawToDisplayUrl({
    raw: String(card.cover_image ?? "").trim(),
    hero_image_url: card.hero_image_url,
    image_url: card.image_url,
    cover_url: card.cover_url,
    image: card.image,
  });
}

function FormationPoster({
  course,
  aspect = "video",
  overlayVariant = "default",
}: {
  course: SliderCard;
  aspect?: "video" | "portrait";
  overlayVariant?: "default" | "edgeonline";
}) {
  const [failed, setFailed] = useState(false);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const img = resolveDisplayUrl(course);
  const showMedia = !failed;
  const isVideo = isVideoUrl(img);

  const markFailed = () => {
    const url = String(img);
    setFailed(true);
    setFailedUrl(url || null);
    // eslint-disable-next-line no-console
    console.error("[Storage] Erreur chargement visuel carte formation:", url);
  };

  const aspectClass = aspect === "portrait" ? "aspect-[2/3]" : "aspect-video";

  return (
    <div className={`relative ${aspectClass} w-full ${failed ? "ring-2 ring-red-500" : ""}`}>
      <div
        className={
          overlayVariant === "edgeonline"
            ? "absolute inset-0 bg-[rgba(0,0,0,0.55)]"
            : "absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"
        }
      />
      {showMedia ? (
        isVideo ? (
          <LazyBandwidthVideo
            src={img}
            rootMargin="0px 200px 0px 200px"
            poster={PLAYMAKERS_LOGO}
            className="absolute inset-0 h-full w-full object-cover object-center opacity-85 transition duration-700 group-hover:scale-[1.03] group-hover:opacity-100"
            autoPlay
            loop
            muted
            playsInline
            onError={markFailed}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={course.title}
            className="absolute inset-0 h-full w-full object-cover object-center opacity-85 transition duration-700 group-hover:scale-[1.03] group-hover:opacity-100"
            loading="lazy"
            onError={markFailed}
          />
        )
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#222,#070707)]">
          <div className="absolute inset-0 flex items-center justify-center p-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={PLAYMAKERS_LOGO}
              alt=""
              className="h-14 w-auto max-w-[70%] object-contain opacity-90"
            />
          </div>
          {failedUrl ? (
            <div className="absolute bottom-2 left-2 right-2 rounded-md border border-red-500/40 bg-black/60 px-2 py-1 text-[10px] text-red-200">
              {failedUrl}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function EdgeOnlineCardMeta({ course }: { course: SliderCard }) {
  const meta = deriveCourseCardMeta(course as LearnerCard);
  const category = String(course.category_name ?? course.category ?? meta.category ?? "").trim();
  const progress = course.progress ?? meta.progress;

  return (
    <div className="mt-2 space-y-1.5">
      {category ? (
        <p className="text-[10px] font-medium uppercase tracking-wider text-black/45">{category}</p>
      ) : null}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-black/55">
        <span className="inline-flex items-center gap-0.5">
          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
          {meta.rating.toFixed(1)}
        </span>
        <span className="inline-flex items-center gap-0.5">
          <Users className="h-3 w-3" />
          {meta.learners}
        </span>
        <span className="inline-flex items-center gap-0.5">
          <Clock className="h-3 w-3" />
          {meta.hours} h
        </span>
        {progress != null && progress > 0 ? <span>{Math.round(progress)} %</span> : null}
      </div>
      <div className="flex flex-wrap gap-1">
        {meta.level ? (
          <span className="rounded-full border border-black/[0.08] bg-[#f5f5f3] px-1.5 py-0.5 text-[9px] font-medium text-black/65">
            {meta.level}
          </span>
        ) : null}
        <span className="inline-flex items-center gap-0.5 rounded-full border border-[#FF3B30]/20 bg-[#FF3B30]/5 px-1.5 py-0.5 text-[9px] font-medium text-[#FF3B30]">
          <Award className="h-2.5 w-2.5" />
          EDGE
        </span>
      </div>
    </div>
  );
}

export function FormationsSliderClient({
  title,
  cards,
  layoutVariant = "default",
}: {
  title: string;
  cards: SliderCard[];
  /** Affiches plus verticales, titres type Netflix mobile. */
  layoutVariant?: "default" | "netflixMobile" | "edgeonlineLight";
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const isNetflix = layoutVariant === "netflixMobile";
  const isEdgeLight = layoutVariant === "edgeonlineLight";

  const normalized = useMemo(() => {
    const raw = Array.isArray(cards) ? cards : [];
    return raw
      .map((c, index) => {
        const fromCoverColumn = String(c.cover_image ?? "").trim();
        const fromNested = pickCoverImageFromItem(c);
        const cover_image = fromCoverColumn || fromNested || null;

        const slug = String(c.slug ?? c.id ?? "").trim();
        const id = String(c.id ?? "").trim() || slug || `card-${index}`;
        const title = String(c.title ?? "Formation").trim() || "Formation";
        const hrefRaw = String(c.href ?? "").trim();
        const href =
          hrefRaw ||
          (slug ? `/catalog/formations/${encodeURIComponent(slug)}` : `/catalog/formations/card-${index}`);
        return {
          id,
          title,
          href,
          slug: slug || null,
          image: (c.image as string | null | undefined) ?? null,
          cover_url: (c.cover_url as string | null | undefined) ?? null,
          image_url: (c.image_url as string | null | undefined) ?? null,
          cover_image,
          hero_image_url: (c.hero_image_url as string | null | undefined) ?? null,
          level: (c.level as string | null | undefined) ?? null,
          category_name: (c.category_name as string | null | undefined) ?? null,
          category: (c.category as string | null | undefined) ?? null,
          presentation: (c.presentation as string | null | undefined) ?? null,
          progress: (c.progress as number | null | undefined) ?? null,
          builder_snapshot: c.builder_snapshot,
        } satisfies SliderCard;
      })
      .slice(0, 12);
  }, [cards]);

  const scrollBy = (delta: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <section className={isNetflix ? "space-y-2" : "space-y-4"}>
      <div
        className={
          isNetflix
            ? "flex items-center justify-between gap-2 px-3"
            : "flex items-center justify-between gap-4"
        }
      >
        <h2
          className={
            isNetflix
              ? "min-w-0 flex-1 text-[15px] font-medium leading-snug tracking-wide text-white"
              : isEdgeLight
                ? "text-lg font-medium tracking-tight text-[#0a0a0a]"
                : "text-lg font-semibold tracking-tight text-white"
          }
        >
          {title}
        </h2>
        {!isNetflix ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              className={
                isEdgeLight
                  ? "h-8 w-8 rounded-full border border-black/[0.06] bg-[#f5f5f3] p-0 text-black/50 hover:border-black/10 hover:bg-black/[0.04]"
                  : "h-8 w-8 rounded-full border border-white/10 bg-black/30 p-0 text-white/70 hover:border-white/20 hover:bg-black/40"
              }
              onClick={() => scrollBy(-520)}
              aria-label="Précédent"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              className={
                isEdgeLight
                  ? "h-8 w-8 rounded-full border border-black/[0.06] bg-[#f5f5f3] p-0 text-black/50 hover:border-black/10 hover:bg-black/[0.04]"
                  : "h-8 w-8 rounded-full border border-white/10 bg-black/30 p-0 text-white/70 hover:border-white/20 hover:bg-black/40"
              }
              onClick={() => scrollBy(520)}
              aria-label="Suivant"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </div>

      <div
        ref={scrollerRef}
        className={
          isNetflix
            ? "flex gap-2 overflow-x-auto px-3 pb-1 pr-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            : "flex gap-4 overflow-x-auto pb-2 pr-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        }
      >
        {normalized.map((course) => {
          const filled = levelToBars(course.level);
          const levelLabel = String(course.level ?? "").trim();
          return (
            <Link
              key={course.id}
              href={course.href}
              className={
                isNetflix
                  ? "group relative w-[min(132px,calc(42vw))] shrink-0 overflow-hidden rounded-md border border-white/12 bg-zinc-900/80 shadow-lg transition active:scale-[0.98] hover:border-white/25"
                  : isEdgeLight
                    ? "group relative w-[min(300px,calc(100vw-2.5rem))] max-w-[85vw] shrink-0 overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.05)] transition duration-300 hover:border-black/15 sm:max-w-none"
                    : "group relative w-[min(360px,calc(100vw-2.5rem))] max-w-[85vw] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition duration-300 hover:border-white/25 hover:bg-white/10 sm:max-w-none"
              }
            >
              <FormationPoster
                course={course}
                aspect={isNetflix ? "portrait" : "video"}
                overlayVariant={isEdgeLight ? "edgeonline" : "default"}
              />
              <div
                className={
                  isEdgeLight
                    ? "border-t border-black/[0.06] bg-white p-3"
                    : isNetflix
                      ? "absolute bottom-0 left-0 right-0 p-2"
                      : "absolute bottom-0 left-0 right-0 p-4"
                }
              >
                <div
                  className={
                    isEdgeLight
                      ? "text-sm font-semibold leading-snug text-[#0a0a0a] line-clamp-2"
                      : isNetflix
                        ? "text-[11px] font-semibold leading-snug text-white line-clamp-2"
                        : "text-sm font-semibold leading-snug text-white line-clamp-2"
                  }
                >
                  {course.title}
                </div>
                {isEdgeLight ? (
                  <EdgeOnlineCardMeta course={course} />
                ) : filled > 0 && levelLabel ? (
                  <div className="mt-2 flex items-center gap-2 text-[10px] font-medium text-white/60">
                    <div className="flex items-end gap-1 origin-left scale-[0.8]">
                      {(["h-2", "h-3", "h-4", "h-5", "h-6"] as const).map((h, i) => (
                        <span
                          // eslint-disable-next-line react/no-array-index-key
                          key={i}
                          className={`${h} w-1 rounded-sm ${i < filled ? "bg-slate-100" : "bg-white/25"}`}
                        />
                      ))}
                    </div>
                    <span className="truncate">{levelLabel}</span>
                  </div>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
