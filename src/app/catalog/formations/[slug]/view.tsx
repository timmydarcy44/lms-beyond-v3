"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  BadgeCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Info,
  Play,
  Plus,
} from "lucide-react";

export type Episode = {
  id: string;
  index: number;
  title: string;
  description?: string;
  imageUrl?: string | null;
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
  objectives?: string[] | string | null;
  objectifs?: string[] | string | null;
  skills?: string[] | null;
  competences?: string[] | null;
  badges?: { label?: string; name?: string }[] | string[];
  instructors?: { name?: string; role?: string; avatarUrl?: string | null }[] | string[];
  intervenants?: { name?: string; role?: string; avatarUrl?: string | null }[] | string[];
};

type CardPayload = {
  href: string;
};

const fallbackHero =
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=2200&q=80";

const toBullets = (value: string | string[] | null | undefined) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }
  const cleaned = value.replace(/\r/g, "").trim();
  if (!cleaned) return [];
  const splitBy = cleaned.includes("\n")
    ? cleaned.split("\n")
    : cleaned.includes("•")
      ? cleaned.split("•")
      : [cleaned];
  return splitBy.map((item) => item.replace(/^[-•]\s*/, "").trim()).filter(Boolean);
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
              <Image
                src={episode.imageUrl}
                alt={episode.title}
                fill
                sizes="(max-width: 768px) 100vw, 260px"
                className="object-cover"
              />
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
  const objectives = useMemo(
    () => toBullets(info.objectives ?? info.objectifs),
    [info.objectifs, info.objectives],
  );
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
    <section id="details" className="space-y-6 pt-16">
      <h2 className="text-2xl font-semibold text-white">Plus de détails</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-white/10 bg-black/70 p-5 text-white shadow-none">
          <h3 className="text-lg font-semibold">Objectifs</h3>
          <ul className="mt-4 space-y-2 text-sm text-white/70">
            {objectives.length > 0 ? (
              objectives.slice(0, 6).map((item, idx) => <li key={idx}>• {item}</li>)
            ) : (
              <li>• Aucun objectif renseigné.</li>
            )}
          </ul>
        </Card>
        <Card className="border-white/10 bg-black/70 p-5 text-white shadow-none">
          <h3 className="text-lg font-semibold">Badges / Compétences</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {skillChips.length > 0 ? (
              skillChips.map((chip, idx) => (
                <SkillBlackCard key={`${chip}-${idx}`} label={chip} />
              ))
            ) : (
              <span className="text-sm text-white/70">Aucun badge renseigné.</span>
            )}
          </div>
        </Card>
        <Card className="border-white/10 bg-black/70 p-5 text-white shadow-none">
          <h3 className="text-lg font-semibold">Intervenants</h3>
          <div className="mt-4 space-y-4 text-sm text-white/70">
            <InstructorsAvatars />
            {instructors.length > 0 ? (
              instructors.map((person, idx) => {
                const name = typeof person === "string" ? person : person.name ?? "Intervenant";
                const role = typeof person === "string" ? null : person.role ?? null;
                const avatarUrl = typeof person === "string" ? null : person.avatarUrl ?? null;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="h-9 w-9 overflow-hidden rounded-full bg-white/10">
                      {avatarUrl ? (
                        <Image src={avatarUrl} alt={name} width={36} height={36} />
                      ) : null}
                    </div>
                    <div>
                      <div className="text-white">{name}</div>
                      {role ? <div className="text-xs text-white/60">{role}</div> : null}
                    </div>
                  </div>
                );
              })
            ) : (
              <p>Équipe Beyond / Club</p>
            )}
          </div>
        </Card>
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
  const metaLine = useMemo(() => {
    const level = (info.meta ?? []).find((item) => item.toLowerCase().includes("niveau"));
    const season = `Cycle de Maîtrise 01 • ${totalEpisodes} séquence${totalEpisodes > 1 ? "s" : ""}`;
    return level ? `${season} • ${level}` : season;
  }, [info.meta, totalEpisodes]);

  return (
    <section className="relative min-h-[70vh] overflow-hidden rounded-3xl border border-white/10">
      <div className="absolute inset-0">
        <Image
          src={info.backgroundImage || fallbackHero}
          alt={info.title}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
      </div>
      <div className="relative z-10 flex h-full flex-col justify-center gap-6 px-6 py-16 md:px-12">
        <div className="text-xs text-white/60">
          {breadcrumbs.map((crumb, idx) => (
            <span key={`${crumb.label}-${idx}`}>
              {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : crumb.label}
              {idx < breadcrumbs.length - 1 ? " • " : ""}
            </span>
          ))}
        </div>
        <h1 className="text-4xl font-extrabold tracking-[0.02em] text-white md:text-6xl">
          {info.title}
        </h1>
        <div className="text-sm text-white/70">{metaLine}</div>
        {info.description ? (
          <p className="max-w-2xl text-base text-white/70 md:text-lg">{info.description}</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            asChild
            className="relative overflow-hidden bg-[#E50914] text-white transition-transform hover:scale-[1.02] hover:bg-[#E50914]/90 before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:transition-transform before:duration-700 hover:before:translate-x-full"
          >
            <Link href={playHref}>
              <Play className="mr-2 h-4 w-4" fill="currentColor" />
              Lancer la Séquence 01
            </Link>
          </Button>
          <Button variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
            <Plus className="mr-2 h-4 w-4" />
            Mon Roadmap
          </Button>
          <Button
            variant="ghost"
            className="text-white/70 hover:text-white"
            onClick={() => {
              document.getElementById("details")?.scrollIntoView({ behavior: "smooth" });
            }}
            aria-label="Voir plus de détails"
          >
            <Info className="mr-2 h-4 w-4" />
            Infos
          </Button>
        </div>
      </div>
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
}: {
  card: CardPayload;
  info: InfoPayload;
  related: any[];
  playHref: string;
  episodes: Episode[];
  breadcrumbs: Breadcrumb[];
}) => {
  const [showAll, setShowAll] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const totalEpisodes = episodes.length;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="space-y-16">
      <header
        className={`sticky top-0 z-50 flex items-center justify-between gap-4 px-4 py-3 md:px-8 ${
          scrolled ? "bg-black/90 backdrop-blur" : "bg-transparent"
        }`}
      >
        <div className="text-sm font-semibold uppercase tracking-[0.25em] text-white/70">
          Beyond No School
        </div>
        <div className="text-xs text-white/60">Catalogue</div>
      </header>

      <FormationBusinessHero
        info={info}
        breadcrumbs={breadcrumbs}
        playHref={playHref}
        totalEpisodes={totalEpisodes}
      />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Cycle de Maîtrise 01 : Les fondamentaux</h2>
            <p className="text-sm text-white/60">{totalEpisodes} séquences</p>
          </div>
          <Button
            variant="ghost"
            className="text-white/70 hover:text-white"
            onClick={() => setShowAll((prev) => !prev)}
          >
            {showAll ? "Masquer" : "Voir tout"}
          </Button>
        </div>
        <EpisodeCarousel episodes={episodes} />
        {showAll ? <EpisodesList episodes={episodes} /> : null}
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
