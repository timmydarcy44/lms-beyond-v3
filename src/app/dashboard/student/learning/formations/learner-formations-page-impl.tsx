"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bell, BookOpen, LayoutGrid, Play, Plus, Search, User } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { CourseToolsLogos } from "@/components/catalogue/course-tools-logos";
import { EDGE_LAB_COURSE_CATEGORY_LABELS } from "@/lib/edge-lab-course-categories";
import { EDGE_LAB_GALAXY_LOGO_URL, isEdgeLabOrganizationSlug, isPlaymakersOrganizationSlug } from "@/lib/galaxy-branding";
import { LazyBandwidthVideo } from "@/components/media/lazy-bandwidth-video";
import { coverRawToDisplayUrl, pickCoverImageFromItem } from "@/lib/formation-cover";
import {
  resolveEdgeLabLearnerThematicSectionTitle,
  resolvePlaymakersLearnerThematicSectionTitle,
} from "@/lib/learner-thematic-sections";
import { PLAYMAKERS_COURSE_CATEGORY_LABELS } from "@/lib/playmakers-course-categories";
import type { ApprenantDashboardData, LearnerCard } from "@/lib/queries/apprenant";
import { edgeOnlinePublicHref, type EdgeOnlineHrefPrefix } from "@/lib/edge-online-public-path";
import { cn } from "@/lib/utils";

import { FormationsSliderClient } from "./formations-slider-client";
import { useOptionalEdgeOnlineHrefPrefix } from "@/app/edgeonline/edge-online-href-context";

/** Données chargées côté serveur par `getApprenantDashboardData` : les `select` Supabase des cours incluent `cover_image` (voir `lib/queries/apprenant.ts`). */

const AUTRES = "Autres";
const EXCERPT_MAX = 200;

/** Même ressource que la fiche catalogue (`view.tsx`) — logo galaxie par défaut. */
const DEFAULT_GALAXY_LOGO_URL =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/Public/logo-white.png";

/** Formation « à la une » : priorité au titre (insensible à la casse / accents). */
const FEATURED_HERO_TITLE_SNIPPET_EDGE_LAB = "utiliser l'ia pour la prospection commerciale";
const FEATURED_HERO_TITLE_SNIPPET_DEFAULT = "acteurs du sport business";

function normalizeTitleForMatch(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/** Cohérence buckets Supabase (casse) — aligné fiche catalogue. */
function normalizeGalaxyLogoUrl(url: string): string {
  if (!url) return url;
  return url
    .replace("/object/public/playmakers/", "/object/public/Playmakers/")
    .replace("/object/public/home/", "/object/public/Home/")
    .replace(/\/object\/public\/edge%20lab\//gi, "/object/public/EDGE%20Lab/")
    .replace(/\/object\/public\/edge lab\//gi, "/object/public/EDGE%20Lab/");
}

function getToolsFromLearnerCard(card: LearnerCard | null): string[] {
  if (!card) return [];
  const raw = card.builder_snapshot;
  if (raw == null) return [];

  let snap: unknown = raw;
  if (typeof raw === "string") {
    try {
      snap = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (typeof snap !== "object" || snap == null || Array.isArray(snap)) return [];

  const general = (snap as any).general;
  if (typeof general !== "object" || general == null || Array.isArray(general)) return [];

  const tools = (general as any).tools;
  if (!Array.isArray(tools)) return [];
  return tools.map((x: unknown) => String(x ?? "").trim()).filter(Boolean);
}

function GalaxyLogoHero({
  logoUrl,
  name,
  className,
}: {
  logoUrl: string;
  name: string;
  className?: string;
}) {
  const [src, setSrc] = useState(() => normalizeGalaxyLogoUrl(logoUrl));
  useEffect(() => {
    setSrc(normalizeGalaxyLogoUrl(logoUrl));
  }, [logoUrl]);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      className={className}
      loading="eager"
      decoding="async"
      onError={() => {
        setSrc((prev) => (prev === DEFAULT_GALAXY_LOGO_URL ? prev : DEFAULT_GALAXY_LOGO_URL));
      }}
    />
  );
}

export type LearnerFormationsSurfaceVariant = "default" | "edgeonline";

export type LearnerFormationsPageImplProps = {
  data: ApprenantDashboardData;
  orgSlug?: string | null;
  /** Surface edgeonline.fr : pas de sidebar dashboard, hero plein viewport, URLs `/formations/…`. */
  surfaceVariant?: LearnerFormationsSurfaceVariant;
};

function isVideoUrl(url: string): boolean {
  const u = url.toLowerCase();
  return u.endsWith(".mp4") || u.endsWith(".webm") || u.endsWith(".mov");
}

function pickHeroCourse(list: LearnerCard[], orgSlug?: string | null): LearnerCard | null {
  if (!list.length) return null;
  const org = String(orgSlug ?? "").trim();
  const desiredSnippet = isEdgeLabOrganizationSlug(org)
    ? FEATURED_HERO_TITLE_SNIPPET_EDGE_LAB
    : FEATURED_HERO_TITLE_SNIPPET_DEFAULT;
  const needle = normalizeTitleForMatch(desiredSnippet);
  const featured = list.find((c) => normalizeTitleForMatch(c.title).includes(needle));
  if (featured) return featured;

  const extended = list as Array<LearnerCard & { updated_at?: string; created_at?: string }>;
  const hasAnyDate = extended.some((c) => c.updated_at || c.created_at);
  if (!hasAnyDate) return extended[0] ?? null;
  return [...extended].sort((a, b) => {
    const ta = new Date(String(a.updated_at ?? a.created_at ?? 0)).getTime();
    const tb = new Date(String(b.updated_at ?? b.created_at ?? 0)).getTime();
    return tb - ta;
  })[0];
}

function resolveFormationHref(
  card: LearnerCard | null,
  orgSlug?: string | null,
  surfaceVariant?: LearnerFormationsSurfaceVariant,
): string {
  if (!card) return "#";
  const slug = String(card.slug ?? "").trim();
  if (!slug) return "#";
  if (surfaceVariant === "edgeonline") {
    return `/formations/${encodeURIComponent(slug)}`;
  }
  const o = String(orgSlug ?? "").trim();
  if (o) return `/g/${encodeURIComponent(o)}/catalog/formations/${encodeURIComponent(slug)}`;
  const fromCard = String(card.href ?? "").trim();
  if (fromCard) return fromCard;
  return `/catalog/formations/${encodeURIComponent(slug)}`;
}

/**
 * EDGE Lab : carrousels = thématiques business uniquement + « Autres ».
 * Playmakers : thématiques sport (liste Playmakers) uniquement + « Autres »
 * (un libellé EDGE en base ne forme jamais un titre de section ici).
 * Autres orgs : regroupement par `category` tel qu’en base, tri des clés.
 */
function buildThematicSectionRows(
  formations: LearnerCard[],
  heroId: string,
  orgSlug: string | null | undefined,
): { title: string; items: LearnerCard[] }[] {
  const list = Array.isArray(formations) ? formations : [];
  const slug = String(orgSlug ?? "").trim();

  if (isEdgeLabOrganizationSlug(slug)) {
    const order = [...EDGE_LAB_COURSE_CATEGORY_LABELS];
    const byKey = new Map<string, LearnerCard[]>();

    for (const f of list) {
      if (heroId && String(f.id) === heroId) continue;
      const key = resolveEdgeLabLearnerThematicSectionTitle(f, order);
      const k = key || AUTRES;
      const arr = byKey.get(k) ?? [];
      arr.push(f);
      byKey.set(k, arr);
    }

    const rows: { title: string; items: LearnerCard[] }[] = [];
    for (const title of order) {
      const items = byKey.get(title);
      if (items?.length) rows.push({ title, items });
    }
    const autres = byKey.get(AUTRES);
    if (autres?.length) rows.push({ title: AUTRES, items: autres });
    return rows;
  }

  if (isPlaymakersOrganizationSlug(slug)) {
    const order = [...PLAYMAKERS_COURSE_CATEGORY_LABELS];
    const byKey = new Map<string, LearnerCard[]>();

    for (const f of list) {
      if (heroId && String(f.id) === heroId) continue;
      const key = resolvePlaymakersLearnerThematicSectionTitle(f, order);
      const k = key || AUTRES;
      const arr = byKey.get(k) ?? [];
      arr.push(f);
      byKey.set(k, arr);
    }

    const rows: { title: string; items: LearnerCard[] }[] = [];
    for (const title of order) {
      const items = byKey.get(title);
      if (items?.length) rows.push({ title, items });
    }
    const autres = byKey.get(AUTRES);
    if (autres?.length) rows.push({ title: AUTRES, items: autres });
    return rows;
  }

  const byTheme: Record<string, LearnerCard[]> = Object.create(null) as Record<string, LearnerCard[]>;
  for (const f of list) {
    if (heroId && String(f.id) === heroId) continue;
    const raw = String(f.category_name ?? "").trim() || String(f.category ?? "").trim() || AUTRES;
    if (!Object.prototype.hasOwnProperty.call(byTheme, raw)) byTheme[raw] = [];
    byTheme[raw].push(f);
  }

  const keys = Object.keys(byTheme).filter((k) => k !== AUTRES);
  keys.sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "variant" }));
  if (Object.prototype.hasOwnProperty.call(byTheme, AUTRES)) keys.push(AUTRES);
  return keys
    .map((title) => {
      const items = byTheme[title];
      return { title, items: items ?? [] };
    })
    .filter((r) => r.items.length > 0);
}

function rowSectionDomId(title: string): string {
  const raw = title
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return raw ? `eco-sec-${raw}` : "eco-sec";
}

type EdgeNetflixMobileProps = {
  rows: { title: string; items: LearnerCard[] }[];
  pills: { label: string; href: string }[];
  thematic: string;
  title: string;
  presentationExcerpt: string;
  href: string;
  video: boolean;
  media: string | null | undefined;
  heroTools: string[];
  galaxyLogoSrc: string;
  galaxyLogoAlt: string;
  surfacePrefix: EdgeOnlineHrefPrefix;
};

function EdgeOnlineFormationsNetflixMobile({
  rows,
  pills,
  thematic,
  title,
  presentationExcerpt,
  href,
  video,
  media,
  heroTools,
  galaxyLogoSrc,
  galaxyLogoAlt,
  surfacePrefix,
}: EdgeNetflixMobileProps) {
  const nav = (path: string) => edgeOnlinePublicHref(path, surfacePrefix);

  return (
    <div className="bg-black pb-[calc(4.25rem+env(safe-area-inset-bottom,0px))] md:hidden">
      <header className="fixed inset-x-0 top-0 z-[95] border-b border-white/5 bg-black pt-[env(safe-area-inset-top,0px)]">
        <div className="flex h-11 items-center justify-between px-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#E50914] text-sm font-black text-white">
              E
            </span>
            <span className="truncate text-lg font-bold tracking-tight text-white">Formations</span>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <Link
              href={nav("/parcours")}
              className="rounded-full p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label="Explorer les parcours"
            >
              <Search className="h-5 w-5" />
            </Link>
            <Link
              href={nav("/communaute")}
              className="rounded-full p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label="Communauté"
            >
              <Bell className="h-5 w-5" />
            </Link>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto px-3 pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {pills.map((p) => (
            <a
              key={`${p.href}-${p.label}`}
              href={p.href}
              className="shrink-0 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 text-[12px] font-medium text-white/90 backdrop-blur-sm transition hover:bg-white/[0.14] hover:text-white"
            >
              {p.label}
            </a>
          ))}
        </div>
      </header>

      <div
        className="shrink-0 md:hidden"
        style={{ height: "calc(6.25rem + env(safe-area-inset-top, 0px))" }}
        aria-hidden
      />

      <div id="hero-top" className="scroll-mt-[calc(7rem+env(safe-area-inset-top,0px))] px-3 pt-1">
        <div className="relative overflow-hidden rounded-xl border border-white/12 bg-zinc-950 shadow-[0_20px_50px_rgba(0,0,0,0.65)]">
          <div className="relative aspect-[3/4] max-h-[min(68dvh,540px)] w-full sm:aspect-[4/5]">
            <div className="absolute inset-0 z-0">
              {video && media ? (
                <LazyBandwidthVideo
                  className="h-full w-full object-cover"
                  src={media}
                  poster={EDGE_LAB_GALAXY_LOGO_URL}
                  eager
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : media ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={media} alt="" className="h-full w-full object-cover" loading="eager" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-zinc-900 to-black" />
              )}
            </div>
            <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black via-black/55 to-transparent" />
            <div className="pointer-events-none absolute left-3 top-3 z-[2]">
              <GalaxyLogoHero
                logoUrl={galaxyLogoSrc}
                name={galaxyLogoAlt}
                className="h-7 w-auto max-w-[104px] object-contain opacity-95 drop-shadow-md"
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 z-[3] p-3 pt-12">
              {thematic ? (
                <div className="mb-2">
                  <span className="inline-block max-w-full truncate rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/90 ring-1 ring-white/20">
                    {thematic}
                  </span>
                </div>
              ) : null}
              <h2 className="text-balance text-2xl font-bold leading-tight tracking-tight text-white drop-shadow-md">
                {title}
              </h2>
              {presentationExcerpt ? (
                <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-white/85 drop-shadow">{presentationExcerpt}</p>
              ) : null}
              {heroTools.length > 0 ? (
                <div className="pointer-events-auto mt-2 max-w-full rounded-lg border border-white/10 bg-black/35 px-2 py-1.5 backdrop-blur-sm">
                  <CourseToolsLogos tools={heroTools} />
                </div>
              ) : null}
              <div className="pointer-events-auto mt-3 flex gap-2">
                <Link
                  href={href}
                  className="flex flex-1 items-center justify-center gap-2 rounded-md bg-white py-2.5 text-sm font-semibold text-black shadow-lg transition active:scale-[0.99] hover:bg-white/95"
                >
                  <Play className="h-5 w-5 shrink-0 fill-black text-black" />
                  Lancer
                </Link>
                <Link
                  href={nav("/parcours")}
                  className="flex flex-1 items-center justify-center gap-2 rounded-md border border-white/25 bg-white/15 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition active:scale-[0.99] hover:bg-white/25"
                >
                  <Plus className="h-5 w-5" />
                  Parcours
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {rows.map((row) => (
          <div key={row.title} id={rowSectionDomId(row.title)} className="scroll-mt-[calc(7rem+env(safe-area-inset-top,0px))]">
            <FormationsSliderClient title={row.title} cards={row.items} layoutVariant="netflixMobile" />
          </div>
        ))}
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-[100] border-t border-white/10 bg-black/95 pb-[env(safe-area-inset-bottom,0px)] pt-1.5 backdrop-blur-xl md:hidden"
        aria-label="Navigation mobile"
      >
        <div className="mx-auto grid max-w-lg grid-cols-3 gap-1 px-2">
          <Link
            href={nav("/parcours")}
            className="flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium text-white/55 transition hover:bg-white/[0.06] hover:text-white"
          >
            <LayoutGrid className="h-6 w-6" />
            Parcours
          </Link>
          <div className="flex flex-col items-center gap-0.5 py-1.5 text-[10px] font-semibold text-white">
            <BookOpen className="h-6 w-6" />
            <span>Formations</span>
            <span className="h-0.5 w-6 rounded-full bg-[#E50914]" aria-hidden />
          </div>
          <Link
            href={nav("/profil")}
            className="flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium text-white/55 transition hover:bg-white/[0.06] hover:text-white"
          >
            <User className="h-6 w-6" />
            Profil
          </Link>
        </div>
      </nav>
    </div>
  );
}

export function LearnerFormationsPageImpl({ data, orgSlug, surfaceVariant = "default" }: LearnerFormationsPageImplProps) {
  const orgSlugNorm = (orgSlug ?? data.organizationSlug ?? "").trim();
  const isEdgeOnlineSurface = surfaceVariant === "edgeonline";
  const edgeOnlinePrefix = useOptionalEdgeOnlineHrefPrefix();

  const formations = useMemo(() => {
    const raw = data.formations ?? [];
    if (!isEdgeOnlineSurface) return raw;
    return raw.map((c) => {
      const slug = String(c.slug ?? "").trim();
      if (!slug) return { ...c, href: "#" };
      const base = `/formations/${encodeURIComponent(slug)}`;
      return { ...c, href: edgeOnlinePublicHref(base, edgeOnlinePrefix) };
    });
  }, [data.formations, isEdgeOnlineSurface, edgeOnlinePrefix]);

  const heroCourse = useMemo(
    () => pickHeroCourse(formations, orgSlugNorm),
    [formations, orgSlugNorm],
  );
  const heroId = String(heroCourse?.id ?? "");

  const rows = useMemo(
    () =>
      buildThematicSectionRows(
        formations as LearnerCard[],
        heroId,
        orgSlug ?? data.organizationSlug ?? null,
      ),
    [formations, heroId, orgSlug, data.organizationSlug],
  );

  if (formations.length === 0) {
    return (
      <DashboardShell
        forceSidebar
        hideSidebar={isEdgeOnlineSurface}
        hideHeader={isEdgeOnlineSurface}
        fullBleed={isEdgeOnlineSurface}
        title="Mes formations"
        subtitle=""
      >
        <div className="px-4 py-10 text-white/70 sm:px-6">Aucune formation disponible pour le moment.</div>
      </DashboardShell>
    );
  }

  const h = heroCourse;
  const thematic =
    String(h?.category_name ?? "").trim() || String(h?.category ?? "").trim() || "";
  const title = String(h?.title ?? "Formation").trim() || "Formation";
  const presentationFull = String(h?.presentation ?? "").trim() || String(h?.meta ?? "").trim();
  const presentationExcerpt =
    presentationFull.length > EXCERPT_MAX
      ? `${presentationFull.slice(0, EXCERPT_MAX).trim()}…`
      : presentationFull;
  const slugHero = String(h?.slug ?? "").trim();
  const href =
    slugHero && isEdgeOnlineSurface
      ? edgeOnlinePublicHref(`/formations/${encodeURIComponent(slugHero)}`, edgeOnlinePrefix)
      : resolveFormationHref(h, orgSlug ?? data.organizationSlug, surfaceVariant);
  const hAsRow = h as unknown as Record<string, unknown> | null;
  const coverRawFromDb = String(h?.cover_image ?? "").trim();
  const coverFromNested = pickCoverImageFromItem(hAsRow);
  const coverRaw = coverRawFromDb || coverFromNested;
  const media = coverRawToDisplayUrl({
    raw: coverRaw,
    cover_url: h?.cover_url,
    image: h?.image,
    hero_image_url: h?.hero_image_url,
    image_url: h?.image_url,
  });
  const video = media && isVideoUrl(media);

  const rawOrgLogo = String(data.organizationLogoUrl ?? "").trim();
  const galaxyLogoSrc = isEdgeLabOrganizationSlug(orgSlugNorm)
    ? /* Toujours l’asset bucket — évite logo DB / onError sur URL cassée. */
      normalizeGalaxyLogoUrl(EDGE_LAB_GALAXY_LOGO_URL) || EDGE_LAB_GALAXY_LOGO_URL
    : normalizeGalaxyLogoUrl(rawOrgLogo || DEFAULT_GALAXY_LOGO_URL) || DEFAULT_GALAXY_LOGO_URL;
  const galaxyLogoAlt = String(data.organizationName ?? "").trim() || "Galaxie";

  const heroTools = useMemo(() => {
    if (!isEdgeLabOrganizationSlug(orgSlugNorm)) return [];
    return getToolsFromLearnerCard(h ?? null);
  }, [orgSlugNorm, h]);

  const netflixPills = useMemo(() => {
    const items: { label: string; href: string }[] = [{ label: "À la une", href: "#hero-top" }];
    for (const r of rows.slice(0, 10)) {
      const label = r.title.length > 24 ? `${r.title.slice(0, 22)}…` : r.title;
      items.push({ label, href: `#${rowSectionDomId(r.title)}` });
    }
    return items;
  }, [rows]);

  /** Sidebar fixe (galaxie apprenant) : rail logo + marge avant texte / sliders. */
  const contentShift = isEdgeOnlineSurface ? "" : "pl-[calc(1.5rem+70px+10px)]";
  /** Sur edgeonline : padding latéral classique ; sur galaxie : léger décalage sous le rail. */
  const heroTextNudge = isEdgeOnlineSurface ? "px-6 sm:px-10 lg:px-12" : "pl-3 md:pl-5";

  const heroMinHeightClass = isEdgeOnlineSurface
    ? "min-h-[100dvh]"
    : "min-h-[88dvh]";

  return (
    <DashboardShell
      forceSidebar
      hideSidebar={isEdgeOnlineSurface}
      hideHeader
      fullBleed={isEdgeOnlineSurface}
      title=""
      subtitle=""
      mainClassName="!px-0 !pt-0"
    >
      {isEdgeOnlineSurface ? (
        <EdgeOnlineFormationsNetflixMobile
          rows={rows}
          pills={netflixPills}
          thematic={thematic}
          title={title}
          presentationExcerpt={presentationExcerpt}
          href={href}
          video={Boolean(video && media)}
          media={media}
          heroTools={heroTools}
          galaxyLogoSrc={galaxyLogoSrc}
          galaxyLogoAlt={galaxyLogoAlt}
          surfacePrefix={edgeOnlinePrefix}
        />
      ) : null}
      <div className={cn("space-y-12 pb-12", isEdgeOnlineSurface && "hidden md:block")}>
        {/* main en !px-0 : le hero occupe toute la largeur du conteneur (plein écran sous la barre fixe) */}
        <section
          className={`relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden bg-black ${heroMinHeightClass}`}
          aria-label="Formation à la une"
        >
          <div className="absolute inset-0 z-0">
            {video && media ? (
              <LazyBandwidthVideo
                className="h-full w-full min-h-full min-w-full object-cover"
                src={media}
                poster={EDGE_LAB_GALAXY_LOGO_URL}
                eager
                autoPlay
                muted
                loop
                playsInline
              />
            ) : media ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={media} alt="" className="h-full w-full object-cover" loading="eager" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-zinc-900 to-black" />
            )}
          </div>
          <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-black/80 via-black/40 to-black/20" />

          <div
            className={`relative z-10 flex w-full flex-col ${isEdgeOnlineSurface ? "pt-14 md:pt-16" : "pt-6 md:pt-8"} ${heroMinHeightClass}`}
          >
            {/* Logo galaxie : ~5× la taille précédente (~36px → ~180px), centré sur la largeur du hero */}
            <div className="pointer-events-auto relative z-20 flex w-full shrink-0 justify-center px-4 md:px-8">
              <GalaxyLogoHero
                logoUrl={galaxyLogoSrc}
                name={galaxyLogoAlt}
                className="h-[132px] w-auto max-w-[min(92vw,720px)] object-contain opacity-95 md:h-[150px]"
              />
            </div>

            <div
              className={`flex flex-1 flex-col justify-center pb-8 pt-4 md:pb-10 md:pt-6 ${contentShift} pr-6 md:pr-12`}
            >
              <div
                className={`w-full text-left ${isEdgeOnlineSurface ? "max-w-2xl lg:max-w-3xl" : "max-w-xl"} ${heroTextNudge}`}
              >
                {thematic ? (
                  <div className="mb-3">
                    <span className="inline-flex max-w-full items-center rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/90 ring-1 ring-white/15">
                      {thematic}
                    </span>
                  </div>
                ) : null}

                <h1 className="text-3xl font-black leading-tight tracking-tight text-white drop-shadow-sm md:text-5xl">
                  {title}
                </h1>

                {presentationExcerpt ? (
                  <p className="mt-4 text-sm leading-relaxed text-white/88 md:text-base">{presentationExcerpt}</p>
                ) : null}

                <div className="pointer-events-auto mt-4 flex flex-col items-start gap-3">
                  {heroTools.length > 0 ? (
                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                      <CourseToolsLogos tools={heroTools} />
                    </div>
                  ) : null}
                  <Link
                    href={href}
                    className="text-sm font-semibold text-white/90 underline underline-offset-4 transition hover:text-white"
                  >
                    voir le contenu
                  </Link>
                  <Button
                    asChild
                    className="rounded-full bg-red-600 px-10 py-3 text-sm font-bold text-white shadow-lg hover:bg-red-700"
                  >
                    <Link href={href}>Lancer la séquence</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div
          className={`space-y-10 pr-4 md:pr-10 ${contentShift} ${isEdgeOnlineSurface ? "pl-4 sm:pl-6 md:pl-8" : ""}`}
        >
          {rows.map((row) => (
            <FormationsSliderClient key={row.title} title={row.title} cards={row.items} />
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}

export default LearnerFormationsPageImpl;
