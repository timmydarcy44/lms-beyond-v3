import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ParcoursChrono } from "@/components/apprenant/parcours-chrono";
import { CourseToolsLogos } from "@/components/catalogue/course-tools-logos";
import { filterDisplayObjectifs, splitPresentationParagraphs } from "@/lib/learner-path-presentation";
import { LazyBandwidthVideo } from "@/components/media/lazy-bandwidth-video";
import { cn } from "@/lib/utils";

export type LearnerPathProgramHeroProps = {
  title: string;
  badge?: string | null;
  /** Image ou vidéo URL */
  coverUrl: string | null | undefined;
  coverIsVideo: boolean;
  presentation: string | null | undefined;
  objectifs: unknown[] | null | undefined;
  tools: string[];
  resumeHref: string;
  formationCount: number;
  testCount: number;
  resourceCount: number;
  pathId: string | null | undefined;
  /** Si false, utilise <img> pour la cover (ex. domaines non déclarés dans next.config). */
  useNextImageForCover?: boolean;
  /** Lien du bouton principal (défaut : ancêtre #composition sur la page détail parcours). */
  primaryCtaHref?: string;
  /**
   * Bandeau « à la une » (liste mes parcours) : pleine largeur, sans objectifs / outils / colonne latérale.
   */
  featuredOverview?: boolean;
};

export function LearnerPathProgramHero({
  title,
  badge,
  coverUrl,
  coverIsVideo,
  presentation,
  objectifs,
  tools,
  resumeHref,
  formationCount,
  testCount,
  resourceCount,
  pathId,
  useNextImageForCover = true,
  primaryCtaHref = "#composition",
  featuredOverview = false,
}: LearnerPathProgramHeroProps) {
  const paragraphs = splitPresentationParagraphs(presentation);
  const objectifsClean = filterDisplayObjectifs(objectifs);
  const showIntroFallback = paragraphs.length === 0;

  if (featuredOverview) {
    return (
      <section className="flex min-h-0 w-full flex-1 flex-col">
        <article
          className={cn(
            "relative flex min-h-0 w-full flex-1 flex-col overflow-hidden border-y border-white/10",
            "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.65)]",
          )}
        >
          <div className="absolute inset-0">
            <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/80 via-black/55 to-black/90" />
            {coverUrl ? (
              coverIsVideo ? (
                <LazyBandwidthVideo
                  className="absolute inset-0 z-0 h-full w-full object-cover object-center opacity-50"
                  src={String(coverUrl)}
                  eager
                  autoPlay
                  muted
                  playsInline
                  loop
                />
              ) : useNextImageForCover ? (
                <Image
                  src={String(coverUrl)}
                  alt=""
                  fill
                  className="z-0 object-cover object-center opacity-50"
                  sizes="100vw"
                  priority
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={String(coverUrl)}
                  alt=""
                  className="absolute inset-0 z-0 h-full w-full object-cover object-center opacity-50"
                />
              )
            ) : (
              <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-800 to-slate-950 opacity-90" />
            )}
          </div>

          <div className="relative z-[2] mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col justify-between gap-8 px-6 py-8 sm:px-10 sm:py-10">
            <div className="min-h-0 space-y-4">
              {badge ? (
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/75">
                  {badge}
                </div>
              ) : null}

              <h2 className="max-w-4xl text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-[2rem] md:leading-tight">
                {title}
              </h2>

              {showIntroFallback ? (
                <p className="max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
                  Ouvrez ce parcours pour suivre la feuille de route et vos contenus.
                </p>
              ) : null}

              {paragraphs.length > 0 ? (
                <div className="max-w-3xl space-y-2 rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
                  {paragraphs.slice(0, 2).map((p, i) => (
                    <p key={i} className="text-sm leading-relaxed text-white/85 sm:text-[15px] sm:leading-[1.65]">
                      {p}
                    </p>
                  ))}
                </div>
              ) : null}

              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-white/70">
                <span className="font-medium text-white/90">{formationCount} formation{formationCount === 1 ? "" : "s"}</span>
                <span className="text-white/35" aria-hidden>
                  ·
                </span>
                <span>
                  {testCount} test{testCount === 1 ? "" : "s"}
                </span>
                <span className="text-white/35" aria-hidden>
                  ·
                </span>
                <span>
                  {resourceCount} ressource{resourceCount === 1 ? "" : "s"}
                </span>
              </p>
            </div>

            <div className="mt-auto flex flex-shrink-0 flex-wrap gap-2 pt-2 sm:gap-3">
              <Button
                asChild
                className="rounded-full bg-sky-500 px-5 text-sm font-semibold text-white shadow-sm hover:bg-sky-400"
              >
                <Link href={primaryCtaHref}>Voir les contenus</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-full border-white/25 bg-white/5 px-5 text-sm font-semibold text-white hover:bg-white/10"
              >
                <Link href={resumeHref}>Reprendre le parcours</Link>
              </Button>
            </div>
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]">
      <article
        className={cn(
          "relative min-h-[280px] overflow-hidden rounded-3xl border border-white/10",
          "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.65)]",
        )}
      >
        <div className="absolute inset-0">
          <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/75 via-black/60 to-black/85" />
          {coverUrl ? (
            coverIsVideo ? (
              <LazyBandwidthVideo
                className="absolute inset-0 z-0 h-full w-full object-cover object-center opacity-45"
                src={String(coverUrl)}
                eager
                autoPlay
                muted
                playsInline
                loop
              />
            ) : useNextImageForCover ? (
              <Image
                src={String(coverUrl)}
                alt=""
                fill
                className="z-0 object-cover object-center opacity-45"
                sizes="(min-width: 1024px) 55vw, 100vw"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={String(coverUrl)}
                alt=""
                className="absolute inset-0 z-0 h-full w-full object-cover object-center opacity-45"
              />
            )
          ) : (
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-800 to-slate-950 opacity-90" />
          )}
        </div>

        <div className="relative z-[2] flex flex-col gap-8 p-6 sm:p-8">
          <div className="space-y-5">
            {badge ? (
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/75">
                {badge}
              </div>
            ) : null}

            <h1 className="max-w-3xl text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-[2rem] md:leading-tight">
              {title}
            </h1>

            {showIntroFallback ? (
              <p className="max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">
                Consultez la présentation du programme et la feuille de route ci-dessous pour suivre les étapes dans
                l&apos;ordre.
              </p>
            ) : null}

            {paragraphs.length > 0 ? (
              <div className="max-w-2xl space-y-3 rounded-2xl border border-white/10 bg-black/25 p-4 sm:p-5">
                {paragraphs.map((p, i) => (
                  <p key={i} className="text-sm leading-relaxed text-white/80 sm:text-[15px] sm:leading-[1.65]">
                    {p}
                  </p>
                ))}
              </div>
            ) : null}

            {objectifsClean.length > 0 ? (
              <div className="max-w-xl rounded-2xl border border-white/10 bg-black/30 p-4 sm:p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">Objectifs pédagogiques</p>
                <ul className="mt-3 space-y-2.5 text-sm leading-snug text-white/80">
                  {objectifsClean.slice(0, 8).map((o, i) => (
                    <li key={`${i}-${o.slice(0, 24)}`} className="flex gap-2.5">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-sky-400/90" aria-hidden />
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {tools.length > 0 ? (
              <div className="max-w-xl rounded-2xl border border-white/10 bg-black/20 p-3">
                <CourseToolsLogos tools={tools} />
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Button
              asChild
              className="rounded-full bg-sky-500 px-5 text-sm font-semibold text-white shadow-sm hover:bg-sky-400"
            >
              <Link href={primaryCtaHref}>Voir les contenus</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-full border-white/25 bg-white/5 px-5 text-sm font-semibold text-white hover:bg-white/10"
            >
              <Link href={resumeHref}>Reprendre le parcours</Link>
            </Button>
          </div>
        </div>
      </article>

      <aside className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.06] p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">En bref</p>
        <ul className="space-y-2.5 text-sm text-white/75">
          <li className="flex gap-2.5">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
            <span>{formationCount} formation{formationCount === 1 ? "" : "s"}</span>
          </li>
          <li className="flex gap-2.5">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
            <span>{testCount} test{testCount === 1 ? "" : "s"}</span>
          </li>
          <li className="flex gap-2.5">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
            <span>{resourceCount} ressource{resourceCount === 1 ? "" : "s"}</span>
          </li>
        </ul>
        {pathId ? <ParcoursChrono pathId={pathId} /> : null}
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-relaxed text-white/60">
          <p className="font-medium text-white/85">Badges</p>
          <p className="mt-1">
            Attribués selon les règles de votre espace (pas seulement à la complétion du parcours).
          </p>
        </div>
      </aside>
    </section>
  );
}
