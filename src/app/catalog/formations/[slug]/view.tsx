"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CourseToolsLogos } from "@/components/catalogue/course-tools-logos";
import { LazyBandwidthVideo } from "@/components/media/lazy-bandwidth-video";
import {
  BadgeCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Info,
  Play,
  Plus,
} from "lucide-react";

const PLAYMAKERS_LOGO_CDN =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/Playmakers/Copie%20de%20Jessica%20Contentin%20(1).png";
const DEFAULT_GALAXY_LOGO_PATH =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/Public/logo-white.png";

type ExpertData = {
  name: string;
  professional_title: string;
  /** Optional; if missing we use an avatar placeholder URL. */
  photo_url?: string;
};

type ValidatorRow = {
  first_name?: string | null;
  last_name?: string | null;
  /** Colonne côté base (préférée quand prénom/nom séparés sont vides). */
  full_name?: string | null;
  professional_title?: string | null;
  /** Orthographe réelle de la table `public.validators` côté DB. */
  professionnal_title?: string | null;
  photo_url?: string | null;
};

function normalizePublicStorageUrl(url: string): string {
  // Ensure bucket casing is correct for known buckets (avoid 404 from wrong case).
  return url
    .replace("/object/public/playmakers/", "/object/public/Playmakers/")
    .replace("/object/public/home/", "/object/public/Home/");
}

function mapValidatorToExpert(v: ValidatorRow | null): ExpertData | null {
  if (!v) return null;
  const full = String(v.full_name ?? "").trim();
  const first = String(v.first_name ?? "").trim();
  const last = String(v.last_name ?? "").trim();
  const fromParts = `${first} ${last}`.trim();
  const name = full || fromParts || null;
  if (!name) return null;
  const titleRaw = String(v.professionnal_title ?? v.professional_title ?? "").trim();
  const professional_title = titleRaw || "Expert validateur";
  const rawPhoto = String(v.photo_url ?? "").trim();
  const photo_url = rawPhoto ? normalizePublicStorageUrl(rawPhoto) : undefined;
  return { name, professional_title, ...(photo_url ? { photo_url } : {}) };
}

export type Episode = {
  id: string;
  index: number;
  title: string;
  description?: string;
  imageUrl?: string | null;
  /** Aperçu / trailer au survol (style Netflix). */
  videoUrl?: string | null;
  href: string;
  progress?: number | null;
  durationLabel?: string | null;
  locked?: boolean;
};

type Breadcrumb = { label: string; href?: string };
type InfoPayload = {
  title: string;
  description?: string | null;
  backgroundImage?: string | null;
  meta?: string[];
  badge?: { label: string; description?: string } | null;
  skills?: string[] | null;
  competences?: string[] | null;
  badges?: { label?: string; name?: string }[] | string[];
  instructors?: { name?: string; role?: string; avatarUrl?: string | null }[] | string[];
  intervenants?: { name?: string; role?: string; avatarUrl?: string | null }[] | string[];
  validatedByPeerId?: string | null;
  validatorForBadge?: { name: string; professional_title: string; photo_url?: string } | null;
};

function expertFromValidatorForBadge(
  v: NonNullable<InfoPayload["validatorForBadge"]>,
): ExpertData | null {
  const name = String(v.name ?? "").trim();
  if (!name) return null;
  const titleRaw = String(v.professional_title ?? "").trim();
  const rawPhoto = typeof v.photo_url === "string" ? v.photo_url.trim() : "";
  return {
    name,
    professional_title: titleRaw || "Expert validateur",
    ...(rawPhoto ? { photo_url: normalizePublicStorageUrl(rawPhoto) } : {}),
  };
}

type CardPayload = {
  href: string;
};

const fallbackHero =
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=2200&q=80";

const EXPERT_AVATAR_PLACEHOLDER = "https://ui-avatars.com/api/?name=Laurent+Alexandre";

const isMp4Url = (value: string | null | undefined) =>
  typeof value === "string" && value.trim().toLowerCase().endsWith(".mp4");

/**
 * JSONB builder_snapshot : `course` = formation côté UI (même objet).
 * Aligné sur : `(typeof course.builder_snapshot === "string" ? JSON.parse(...) : ...) || {}`
 */
function parseBuilderSnapshotFromCourse(course: { builder_snapshot?: unknown } | null | undefined): Record<string, unknown> {
  if (course == null) return {};
  const raw = course.builder_snapshot;
  if (raw == null) return {};
  let snap: unknown;
  if (typeof raw === "string") {
    try {
      snap = JSON.parse(raw);
    } catch {
      return {};
    }
  } else {
    snap = raw;
  }
  if (typeof snap !== "object" || snap == null || Array.isArray(snap)) return {};
  return snap as Record<string, unknown>;
}

function getSnapshotGeneral(snap: Record<string, unknown>): Record<string, unknown> {
  const g = snap.general;
  if (typeof g === "object" && g != null && !Array.isArray(g)) return g as Record<string, unknown>;
  return {};
}

function getCourseToolsFromGeneral(content: Record<string, unknown>): string[] {
  const raw = (content as any)?.tools;
  if (!Array.isArray(raw)) return [];
  return raw.map((x: unknown) => String(x ?? "").trim()).filter(Boolean);
}

/** Carte séquence type Netflix (slider catalogue). */
const CatalogSequenceCard = ({
  episode,
  contentCoverImage,
}: {
  episode: Episode;
  /** `snap.general.cover_image` — repli si `e.imageUrl` absent. */
  contentCoverImage: string;
}) => {
  const [hovering, setHovering] = useState(false);
  const baseSrc = String(
    (typeof episode.imageUrl === "string" && episode.imageUrl.trim()) ||
      (contentCoverImage && contentCoverImage.trim()) ||
      fallbackHero,
  );
  const hoverVideo =
    typeof episode.videoUrl === "string" && episode.videoUrl.trim() ? episode.videoUrl.trim() : "";

  return (
    <Link
      href={episode.href}
      className="block min-w-[300px] shrink-0 snap-start transition-transform duration-500 hover:z-10 hover:scale-105"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="group relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
        <div className="absolute inset-0">
          {isMp4Url(baseSrc) ? (
            <LazyBandwidthVideo
              src={baseSrc}
              rootMargin="0px 220px 0px 220px"
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={baseSrc} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
        </div>
        {hoverVideo && hovering ? (
          <video
            src={hoverVideo}
            muted
            autoPlay
            loop
            playsInline
            preload="none"
            className="absolute inset-0 z-10 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        ) : null}
        <div className="pointer-events-none absolute inset-0 z-[12] bg-gradient-to-t from-black/90 to-transparent" />
        {episode.durationLabel ? (
          <div className="absolute right-3 top-3 z-20 rounded-full border border-white/15 bg-black/50 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur">
            {episode.durationLabel}
          </div>
        ) : null}
        <div className="absolute inset-x-0 bottom-0 z-20 p-4 pt-12">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">
            Séquence {episode.index}
          </div>
          <div className="mt-1 text-base font-semibold leading-snug text-white">{episode.title}</div>
        </div>
        {episode.locked ? (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 text-sm font-semibold text-white">
            Verrouillé
          </div>
        ) : null}
      </div>
    </Link>
  );
};

const SequenceCard = ({ episode }: { episode: Episode }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <Link
      href={episode.href}
      className="group relative z-0 flex aspect-video w-64 shrink-0 snap-start overflow-hidden rounded-xl border border-white/10 bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 md:w-72 md:hover:z-10 md:hover:scale-105 md:hover:border-[#D4AF37] md:hover:shadow-[0_20px_60px_-24px_rgba(212,175,55,0.4)]"
      aria-label={`Séquence ${episode.index}: ${episode.title}`}
    >
      {episode.imageUrl ? (
        <>
          <div
            className={`absolute inset-0 animate-pulse bg-white/10 transition-opacity duration-500 ${
              loaded ? "opacity-0" : "opacity-100"
            }`}
          />
          {isMp4Url(episode.imageUrl) ? (
            <LazyBandwidthVideo
              src={episode.imageUrl}
              rootMargin="120px"
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                loaded ? "opacity-100" : "opacity-0"
              }`}
              autoPlay
              loop
              muted
              playsInline
              onCanPlay={() => setLoaded(true)}
            />
          ) : (
            <Image
              src={episode.imageUrl}
              alt={episode.title}
              fill
              sizes="(max-width: 768px) 260px, 320px"
              priority={episode.index === 1}
              onLoadingComplete={() => setLoaded(true)}
              className={`object-cover transition-opacity duration-500 ${
                loaded ? "opacity-100" : "opacity-0"
              }`}
            />
          )}
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      {episode.locked ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm font-semibold text-white">
          Verrouillé
        </div>
      ) : null}
      <div className="absolute right-3 top-3 flex flex-col gap-2 text-[11px] text-white/80">
        {episode.durationLabel ? (
          <span className="rounded-full border border-white/20 bg-black/50 px-2 py-1 backdrop-blur">
            {episode.durationLabel}
          </span>
        ) : null}
        {typeof episode.progress === "number" ? (
          <span className="rounded-full border border-white/20 bg-black/50 px-2 py-1 backdrop-blur">
            {Math.round(episode.progress)}%
          </span>
        ) : null}
      </div>
      <div className="absolute inset-x-0 bottom-0 space-y-1 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-3 pt-6">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#999]">
          Séquence {episode.index}
        </p>
        <p className="text-sm font-semibold text-white">{episode.title}</p>
        <p className="text-[11px] text-white/60">Focus business premium</p>
      </div>
      {typeof episode.progress === "number" ? (
        <div className="absolute bottom-0 left-0 h-[2px] w-full bg-white/10">
          <div
            className="h-[2px] bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.55)]"
            style={{ width: `${Math.min(Math.max(episode.progress, 0), 100)}%` }}
          />
        </div>
      ) : null}
    </Link>
  );
};

const EpisodesList = ({ episodes }: { episodes: Episode[] }) => {
  return (
    <div className="mt-6 space-y-3">
      {episodes.map((episode) => (
        <div
          key={episode.id}
          className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-4 md:flex-row md:items-center"
        >
          <div className="relative aspect-video w-full overflow-hidden rounded-lg md:w-64">
            {episode.imageUrl ? (
              isMp4Url(episode.imageUrl) ? (
                <LazyBandwidthVideo
                  src={episode.imageUrl}
                  rootMargin="80px"
                  className="absolute inset-0 h-full w-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                <Image
                  src={episode.imageUrl}
                  alt={episode.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 260px"
                  className="object-cover"
                />
              )
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent" />
            )}
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute bottom-2 left-2 text-xs text-white/70">
              Séquence {episode.index}
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">{episode.title}</h3>
              <Button asChild variant="ghost" className="text-white/70 hover:text-white">
                <Link href={episode.href} aria-label={`Lire ${episode.title}`}>
                  <Play className="mr-2 h-4 w-4" />
                  Lire
                </Link>
              </Button>
            </div>
            {episode.description ? (
              <p className="text-sm text-white/70">{episode.description}</p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
};

const EpisodeCarousel = ({ episodes }: { episodes: Episode[] }) => {
  const listRef = useRef<HTMLDivElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const scrollByAmount = (direction: "left" | "right") => {
    if (!listRef.current) return;
    const width = listRef.current.clientWidth;
    listRef.current.scrollBy({
      left: direction === "left" ? -width : width,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      <div className="absolute -left-4 top-1/2 hidden -translate-y-1/2 md:block">
        <Button
          variant="secondary"
          size="icon"
          className="h-10 w-10 rounded-full bg-black/70 text-white hover:bg-black"
          onClick={() => scrollByAmount("left")}
          aria-label="Défiler vers la gauche"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </div>
      <div className="absolute -right-4 top-1/2 hidden -translate-y-1/2 md:block">
        <Button
          variant="secondary"
          size="icon"
          className="h-10 w-10 rounded-full bg-black/70 text-white hover:bg-black"
          onClick={() => scrollByAmount("right")}
          aria-label="Défiler vers la droite"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
      <div
        ref={listRef}
        className={`netflix-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 pr-10 transition-opacity duration-500 ${
          isMounted ? "opacity-100" : "opacity-0"
        }`}
        tabIndex={0}
        aria-label="Liste des épisodes"
      >
        {episodes.length > 0
          ? episodes.map((episode) => <SequenceCard key={episode.id} episode={episode} />)
          : Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="aspect-video w-64 shrink-0 snap-start animate-pulse rounded-xl border border-white/10 bg-white/5 md:w-72"
              />
            ))}
      </div>
    </div>
  );
};

const SkillBlackCard = ({ label }: { label: string }) => {
  return (
    <span className="flex items-center gap-2 rounded-xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_55%)] px-4 py-2 text-xs text-white/80 transition hover:ring-1 hover:ring-[#D4AF37]/20">
      <BadgeCheck className="h-3.5 w-3.5 text-white/70" />
      {label}
    </span>
  );
};

const InstructorsAvatars = ({ count = 3 }: { count?: number }) => {
  const placeholders = Array.from({ length: count }).map((_, idx) => ({
    name: `B${idx + 1}`,
  }));
  return (
    <div className="flex items-center -space-x-3">
      {placeholders.map((item, idx) => (
        <div
          key={idx}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-xs font-semibold text-white/70"
        >
          {item.name}
        </div>
      ))}
    </div>
  );
};

const DetailsGrid = ({ info }: { info: InfoPayload }) => {
  const formation = info as any;
  const course = formation;
  const snap = parseBuilderSnapshotFromCourse(course);
  const content = getSnapshotGeneral(snap);
  const tools = useMemo(() => getCourseToolsFromGeneral(content), [content]);
  /** Uniquement `snap.general.objectifs` (JSONB builder). */
  const objectifs = Array.isArray(content.objectifs)
    ? (content.objectifs as unknown[]).map((x) => String(x ?? "").trim()).filter(Boolean)
    : [];
  const data = snap;

  const skillChips = useMemo(() => {
    if (Array.isArray(info.skills) && info.skills.length > 0) return info.skills;
    if (Array.isArray(info.competences) && info.competences.length > 0) return info.competences;
    if (Array.isArray(info.badges) && info.badges.length > 0) {
      return info.badges.map((item) =>
        typeof item === "string" ? item : item.label ?? item.name ?? "",
      ).filter(Boolean);
    }
    if (info.badge?.label) return [info.badge.label];
    return [];
  }, [info.badge, info.badges, info.competences, info.skills]);
  const instructors = useMemo(() => {
    if (Array.isArray(info.instructors) && info.instructors.length > 0) return info.instructors;
    if (Array.isArray(info.intervenants) && info.intervenants.length > 0) return info.intervenants;
    return [];
  }, [info.instructors, info.intervenants]);

  return (
    <section
      id="details"
      className="relative w-full max-w-none overflow-hidden bg-black px-6 py-16 md:px-12"
    >
      {/* Couche d'ambiance colorée en arrière-plan */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {/* Halo Bleu - En haut à droite */}
        <div className="absolute -right-24 -top-24 h-[600px] w-[600px] rounded-full bg-blue-600 opacity-[0.08] blur-[120px]" />
        {/* Halo Rouge - Plus bas à gauche */}
        <div className="absolute -left-24 top-1/2 h-[500px] w-[500px] rounded-full bg-red-600 opacity-[0.06] blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-none space-y-8">
        <h2 className="text-2xl font-semibold text-white">Détails</h2>
        <div className="mt-8 grid gap-12 md:grid-cols-3">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-white/70">
              Objectifs pédagogiques
            </h3>
            {objectifs.length > 0 ? (
              <ul className="list-none space-y-3 text-sm leading-relaxed text-white/75">
                {objectifs.map((item, idx) => (
                  <li key={idx} className="flex gap-3">
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E50914] shadow-[0_0_0_1px_rgba(255,255,255,0.12)]"
                      aria-hidden
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm leading-relaxed text-white/55">Aucun objectif renseigné dans le builder.</p>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-white/70">
              Les outils
            </h3>
            {tools.length > 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <CourseToolsLogos tools={tools} />
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70">
                Aucun outil renseigné.
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-white/70">
              L’Open Badge
            </h3>
            {(() => {
              const badgeImage =
                (typeof content.badge_url === "string" && content.badge_url.trim()) ||
                (data?.badge_url != null ? String(data.badge_url) : "") ||
                null;
              const badgeName = (info as any)?.open_badge?.name ?? info.badge?.label ?? null;
              const displayBadgeName = badgeName != null ? String(badgeName).trim() : "";
              return (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black/40 ring-1 ring-white/10">
                    {badgeImage ? (
                      isMp4Url(String(badgeImage)) ? (
                        <LazyBandwidthVideo
                          src={String(badgeImage)}
                          rootMargin="80px"
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <Image src={String(badgeImage)} alt={displayBadgeName || "Open Badge"} fill className="object-contain p-6" />
                      )
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center p-6">
                        <div className="w-full rounded-xl border border-[#D4AF37]/30 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.18),transparent_55%)] p-6 text-center">
                          <div className="text-sm font-semibold text-white">Certification de compétence</div>
                          <div className="mt-2 text-xs text-white/60">Badge doré (placeholder)</div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 text-sm font-semibold text-white">{displayBadgeName || "Open Badge"}</div>
                  <div className="mt-2 text-xs leading-relaxed text-white/60">
                    Preuve de compétence : complétez les séquences et validez les critères pour obtenir ce badge.
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </section>
  );
};

const FormationBusinessHero = ({
  info,
  breadcrumbs,
  playHref,
  totalEpisodes,
}: {
  info: InfoPayload;
  breadcrumbs: Breadcrumb[];
  playHref: string;
  totalEpisodes: number;
}) => {
  const formation = info as any;
  const course = formation;
  const snap = parseBuilderSnapshotFromCourse(course);
  const content = getSnapshotGeneral(snap);
  const coverImageRaw =
    typeof content.cover_image === "string" && content.cover_image.trim() ? content.cover_image.trim() : "";
  const heroIsMp4Video = isMp4Url(coverImageRaw);
  const heroPosterOrImg = String(
    coverImageRaw ||
      formation?.cover_url ||
      formation?.cover_image ||
      info.backgroundImage ||
      fallbackHero ||
      "",
  );
  const presentationText =
    typeof content.presentation === "string" && content.presentation.trim() ? content.presentation.trim() : "";
  const presentationExtrait =
    presentationText.length > 0 ? `${presentationText.slice(0, 220)}...` : "";

  const supabase = useSupabase();
  const fromServer = info.validatorForBadge;
  const validatorIdRaw = String(
    info.validatedByPeerId ??
      (snap.general as { validated_by_peer_id?: string })?.validated_by_peer_id ??
      (content as { validated_by_peer_id?: string })?.validated_by_peer_id ??
      (content as { validatedByPeerId?: string })?.validatedByPeerId ??
      (info as { validatedByPeerId?: string | null })?.validatedByPeerId ??
      "",
  ).trim();

  const [expertData, setExpertData] = useState<ExpertData | null>(() =>
    fromServer ? expertFromValidatorForBadge(fromServer) : null,
  );
  const [expertPhotoFailed, setExpertPhotoFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setExpertPhotoFailed(false);

    const fromBadge = fromServer ? expertFromValidatorForBadge(fromServer) : null;
    if (fromBadge) {
      setExpertData(fromBadge);
      return () => {
        cancelled = true;
      };
    }

    if (!validatorIdRaw) {
      setExpertData(null);
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        const { data, error } = await supabase.from("validators").select("*").eq("id", validatorIdRaw).maybeSingle();
        if (cancelled) return;
        if (error) {
          setExpertData(null);
          return;
        }
        const mapped = mapValidatorToExpert(data as unknown as ValidatorRow);
        setExpertData(mapped);
      } catch {
        if (!cancelled) setExpertData(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, validatorIdRaw, fromServer]);

  const fallbackAvatar = expertData
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(expertData.name)}&background=0D8ABC&color=fff`
    : EXPERT_AVATAR_PLACEHOLDER;
  const resolvedPhoto =
    expertData &&
    typeof expertData.photo_url === "string" &&
    expertData.photo_url.trim()
      ? expertData.photo_url.trim()
      : fallbackAvatar;
  const avatarSrc = expertPhotoFailed ? fallbackAvatar : resolvedPhoto;

  const themeRaw = (info as any)?.category ?? (info as any)?.theme ?? null;
  const theme = typeof themeRaw === "string" ? themeRaw.trim() : themeRaw != null ? String(themeRaw).trim() : "";
  const level = useMemo(() => {
    const raw = (info.meta ?? []).find((item) => item.toLowerCase().includes("niveau")) ?? "";
    return String(raw).replace(/niveau\s*[:\-]?\s*/i, "").trim();
  }, [info.meta]);

  return (
    <section className="relative left-1/2 ml-[-50vw] w-screen min-w-0 min-h-screen max-w-[100vw] overflow-hidden bg-black pl-0">
      <div className="absolute inset-0 z-0 h-full w-full min-h-full">
        {heroIsMp4Video ? (
          <LazyBandwidthVideo
            src={coverImageRaw}
            poster={
              !isMp4Url(heroPosterOrImg) && heroPosterOrImg.trim() ? heroPosterOrImg : PLAYMAKERS_LOGO_CDN
            }
            eager
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full min-h-full w-full object-cover"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroPosterOrImg}
            className="absolute inset-0 h-full w-full min-h-full object-cover"
            alt=""
          />
        )}
        <div className="absolute inset-0 bg-black/40" aria-hidden />
      </div>

      {/* Cinematic Overlay - Rouge et Bleu */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden" aria-hidden>
        <div
          className="absolute -left-1/4 -top-1/4 h-[150%] w-full opacity-30 mix-blend-screen"
          style={{
            background: "radial-gradient(circle at center, rgba(220,38,38,0.4) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute -bottom-1/4 -right-1/4 h-[150%] w-full opacity-30 mix-blend-screen"
          style={{
            background: "radial-gradient(circle at center, rgba(37,99,235,0.4) 0%, transparent 60%)",
          }}
        />
      </div>

      <div className="relative z-20 ml-0 flex w-full max-w-none min-h-screen flex-col justify-start pl-0 pr-4 pb-16 pt-0 md:pr-10 md:pb-20 lg:pr-16">
        <div className="w-full max-w-3xl pl-4 pt-64 md:pl-10 md:pt-[25vh] lg:pl-16">
          {theme ? (
            <div className="mb-4">
              <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/90">
                {theme}
              </span>
            </div>
          ) : null}

          <h1 className="text-5xl font-bold tracking-tight text-white drop-shadow md:text-6xl">
            {(typeof content.title === "string" && content.title.trim()) || formation?.title || info.title}
          </h1>

          <div className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-white/80">
            {level ? `Niveau : ${level}` : "Niveau : Acquisition"} • {totalEpisodes} Séquence{totalEpisodes > 1 ? "s" : ""}
          </div>

          {presentationExtrait ? (
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/80">{presentationExtrait}</p>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center gap-6">
            <Button
              asChild
              className="rounded-full bg-[#E50914] px-10 py-6 text-base font-bold text-white shadow-[0_12px_40px_-18px_rgba(229,9,20,0.65)] transition hover:bg-[#E50914]/90"
            >
              <Link href={playHref}>
                <Play className="mr-2 h-4 w-4" fill="currentColor" />
                Lancer la séquence
              </Link>
            </Button>
            <button
              type="button"
              className="bg-transparent text-base font-bold text-white underline underline-offset-4 hover:text-white/85"
              onClick={() => document.getElementById("sequences")?.scrollIntoView({ behavior: "smooth" })}
            >
              Voir le contenu
            </button>
          </div>
        </div>
      </div>

      {expertData ? (
        <div
          className="absolute bottom-12 right-12 z-20 flex max-w-[min(100%,calc(100vw-2.5rem))] items-center gap-4 rounded-2xl border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-md max-sm:bottom-6 max-sm:right-4"
          role="complementary"
          aria-label="Badge validateur"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- avatar badge : <img> natif, pas next/image */}
          <img
            src={avatarSrc}
            alt={expertData.name}
            className="h-14 w-14 shrink-0 rounded-full border border-white/30 object-cover"
            onError={() => setExpertPhotoFailed(true)}
          />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold tracking-widest text-white/60">BADGE VALIDÉ PAR</p>
            <p className="mt-0.5 font-bold leading-tight text-lg text-white">{expertData.name}</p>
            <p className="mt-0.5 text-xs text-white/70">{expertData.professional_title}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export const FormationDetailView = ({
  card,
  info,
  related,
  playHref,
  episodes,
  breadcrumbs,
  orgSlug,
}: {
  card: CardPayload;
  info: InfoPayload;
  related: any[];
  playHref: string;
  episodes: Episode[];
  breadcrumbs: Breadcrumb[];
  orgSlug?: string | null;
}) => {
  const totalEpisodes = episodes.length;
  const pathname = usePathname() ?? "";
  const effectiveOrgSlug = useMemo(() => {
    if (orgSlug && String(orgSlug).trim() !== "") return String(orgSlug);
    const m = pathname.toLowerCase().match(/^\/g\/([^/]+)/);
    return m?.[1] ? m[1] : null;
  }, [orgSlug, pathname]);

  const formation = info as { builder_snapshot?: unknown } & InfoPayload;
  const detailSnap: Record<string, unknown> = (() => {
    const raw = formation.builder_snapshot;
    if (raw == null) return {};
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw) as unknown;
        return typeof parsed === "object" && parsed != null && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
      } catch {
        return {};
      }
    }
    if (typeof raw === "object" && !Array.isArray(raw)) return raw as Record<string, unknown>;
    return {};
  })();
  const content = (() => {
    const g = detailSnap.general;
    if (typeof g === "object" && g != null && !Array.isArray(g)) return g as Record<string, unknown>;
    return {};
  })();

  /**
   * Sans session résolue : priorité cours = `content.organization_logo` → logo Beyond blanc.
   * (Playmakers = priorité `brandLogoFromSession` une fois l’appartenance lue côté client.)
   */
  const orgLogoFromBuilder = useMemo(
    () =>
      typeof content.organization_logo === "string" && content.organization_logo.trim()
        ? content.organization_logo.trim()
        : "",
    [content.organization_logo],
  );
  const courseLogoFallback = useMemo(
    () => orgLogoFromBuilder || DEFAULT_GALAXY_LOGO_PATH,
    [orgLogoFromBuilder],
  );

  const [brandLogoFromSession, setBrandLogoFromSession] = useState<string | null>(null);
  const supabase = useSupabase();
  const brandLogoUrl = brandLogoFromSession ?? courseLogoFallback;

  const sequenceCoverFallback = String(
    (typeof content.cover_image === "string" && content.cover_image.trim()) || "",
  );
  const logoHref = effectiveOrgSlug
    ? `/g/${encodeURIComponent(String(effectiveOrgSlug))}/dashboard/student/learning/formations`
    : "/catalog";

  useEffect(() => {
    // Sur le catalogue public (/catalog/...), on garde le branding de la formation
    // (builder snapshot). Le branding basé sur les org memberships de l'utilisateur
    // peut être incohérent (ex: utilisateur Playmakers sur une formation EDGE Lab).
    if (!effectiveOrgSlug) {
      setBrandLogoFromSession(null);
      return;
    }

    let cancel = false;
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancel) return;

        const { data: memberships, error: mErr } = await supabase
          .from("org_memberships")
          .select("org_id")
          .eq("user_id", user.id);
        if (mErr || !memberships?.length) return;

        const orgIds = [...new Set(memberships.map((m) => m.org_id))];
        const { data: orgs, error: oErr } = await supabase
          .from("organizations")
          .select("id, name, logo_url")
          .in("id", orgIds);
        if (oErr || !orgs?.length) return;

        const playmakersOrg = orgs.find((o) => (o.name || "").toLowerCase().includes("playmakers"));
        if (playmakersOrg) {
          const u =
            String(playmakersOrg.logo_url || "").trim() || PLAYMAKERS_LOGO_CDN;
          if (u && !cancel) setBrandLogoFromSession(u);
          return;
        }

        const otherOrg = orgs.find((o) => {
          const n = (o.name || "").toLowerCase();
          return n.length > 0 && !n.includes("beyond");
        }) || orgs[0];
        if (!otherOrg || cancel) return;

        const u = String(otherOrg.logo_url || "").trim();
        if (u) setBrandLogoFromSession(u);
      } catch {
        /* RLS / réseau : garde le fallback snapshot */
      }
    })();
    return () => {
      cancel = true;
    };
  }, [supabase, effectiveOrgSlug]);

  return (
    <div className="m-0 ml-0 w-full min-w-0 max-w-none bg-black p-0 pl-0 text-white">
      <div className="relative m-0 ml-0 w-full min-w-0 max-w-none overflow-x-hidden pl-0">
        <header
          className="absolute inset-x-0 top-0 z-50 m-0 ml-0 bg-transparent p-0 pl-0"
        >
          <div className="flex w-full items-center justify-center px-2 pb-2 pt-6">
            <Link
              href={logoHref}
              className="mx-auto inline-flex h-40 w-auto max-w-[min(92vw,720px)] items-center justify-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={brandLogoUrl}
                alt=""
                className="mx-auto h-40 w-auto max-h-[160px] object-contain"
              />
            </Link>
          </div>
        </header>

        <FormationBusinessHero
          info={info}
          breadcrumbs={breadcrumbs}
          playHref={playHref}
          totalEpisodes={totalEpisodes}
        />
      </div>

      <section id="sequences" className="w-full max-w-none bg-black px-6 py-14 md:px-12">
        <div className="w-full max-w-none">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold text-white">Séquences</h2>
              <p className="mt-2 text-sm text-white/60">{totalEpisodes} séquence{totalEpisodes > 1 ? "s" : ""}</p>
            </div>
            {episodes.length > 0 ? (
              <Button
                variant="ghost"
                className="text-white/70 hover:text-white"
                onClick={() => document.getElementById("details")?.scrollIntoView({ behavior: "smooth" })}
              >
                Détails
              </Button>
            ) : null}
          </div>

          <div className="mt-8 flex overflow-x-auto snap-x scrollbar-hide snap-mandatory gap-6 overflow-y-visible pb-10 pr-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {episodes.map((e) => (
              <CatalogSequenceCard
                key={e.id}
                episode={e}
                contentCoverImage={sequenceCoverFallback}
              />
            ))}
          </div>
        </div>
      </section>

      <DetailsGrid info={info} />
      <style jsx global>{`
        .netflix-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .netflix-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .netflix-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(212, 175, 55, 0.35);
          border-radius: 999px;
        }
        .netflix-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #d4af37 transparent;
        }
      `}</style>
    </div>
  );
};
