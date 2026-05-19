import Link from "next/link";
import { Play } from "lucide-react";

import { cn } from "@/lib/utils";
import type { LearnerNavItem } from "@/components/dashboard/learner-nav-items";
import { learnerNavItems as defaultLearnerNavItems } from "@/components/dashboard/learner-nav-items";
import { learnerNavIconMap } from "@/components/dashboard/learner-nav-icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LazyBandwidthVideo } from "@/components/media/lazy-bandwidth-video";

import type { LearnerHero as LearnerHeroType, LearnerCard } from "@/lib/queries/apprenant";

type CinematicHeroProps = {
  hero: LearnerHeroType;
  featured: LearnerCard[];
  stats: Array<{ label: string; value: string }>;
  navItems?: LearnerNavItem[];
  activeHref?: string;
  userName?: string | null;
  userAvatar?: string | null;
  /** "light" = fond clair type Augment (contenu sur blanc). */
  variant?: "dark" | "light";
  primaryCtaHref?: string;
};

const FEATURED_HALOS = [
  "from-amber-400/45 via-transparent to-transparent",
  "from-blue-400/40 via-transparent to-transparent",
  "from-rose-400/45 via-transparent to-transparent",
  "from-emerald-400/40 via-transparent to-transparent",
  "from-purple-400/45 via-transparent to-transparent",
  "from-slate-100/40 via-transparent to-transparent",
] as const;

const FALLBACK_HERO =
  "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=2000&q=80";

/** Aligné sur `catalog-card-image.tsx` : vidéo uniquement si l’URL se termine par `.mp4`. */
const isRemoteVideo = (url: string) => url.toLowerCase().endsWith(".mp4");

export function CinematicHero({
  hero,
  featured,
  stats,
  navItems = defaultLearnerNavItems,
  activeHref,
  userName,
  userAvatar,
  variant = "dark",
  primaryCtaHref,
}: CinematicHeroProps) {
  const isLight = variant === "light";
  const limitedFeatured = featured.slice(0, 6);
  const heroImage = hero.backgroundImage && hero.backgroundImage.trim() !== "" ? hero.backgroundImage : FALLBACK_HERO;
  const isHeroVideo = heroImage.toLowerCase().includes(".mp4");
  const isMp4MediaUrl = (url: string) => url.toLowerCase().includes(".mp4");
  const primaryNav = navItems.filter((item) => item.group !== "apps");
  const appsNav = navItems.filter((item) => item.group === "apps");
  const avatarInitial =
    userName?.trim()?.charAt(0)?.toUpperCase() ?? hero.meta?.trim()?.charAt(0)?.toUpperCase() ?? "B";
  const displayUserName = userName ?? "Jessica Contentin";

  return (
    <section
      className={cn(
        "relative -mx-4 flex min-h-[520px] flex-col overflow-visible md:-mx-10 md:min-h-[600px] lg:min-h-[660px]",
        isLight
          ? "border-b border-slate-200/90 bg-white text-slate-900 shadow-sm"
          : "bg-[#0b0b0f] text-white shadow-[0_120px_220px_-100px_rgba(0,0,0,0.9)]",
      )}
    >
      <div className={cn("absolute inset-0", isLight && "opacity-90")}>
        {isHeroVideo ? (
          <LazyBandwidthVideo
            src={heroImage}
            poster={FALLBACK_HERO}
            eager
            className={cn("h-full w-full object-cover", isLight && "opacity-40")}
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <img
            src={heroImage}
            alt={hero.title}
            className={cn("absolute inset-0 h-full w-full object-cover", isLight && "opacity-40")}
          />
        )}
        {!isLight ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-black/30" />
            <div className="absolute inset-y-0 left-0 w-2/5 bg-gradient-to-r from-black/92 via-black/60 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.35),transparent_55%)] mix-blend-screen opacity-60" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(255,214,118,0.25),transparent_60%)] mix-blend-screen opacity-70" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50/95 to-slate-100/90" />
        )}
      </div>

      <div className="relative z-10 flex flex-1 flex-col gap-8 px-6 py-10 md:flex-row md:gap-12 md:px-12 lg:py-14">
        <aside className="flex w-full flex-none flex-col gap-4 md:sticky md:top-10 md:w-[320px] md:self-start">
          <div
            className={cn(
              "rounded-[28px] p-5 backdrop-blur",
              isLight
                ? "border border-slate-200/80 bg-white/90 shadow-sm"
                : "border border-white/10 bg-white/5",
            )}
          >
            <div
              className={cn(
                "mb-4 flex items-center gap-3 rounded-[20px] px-4 py-3",
                isLight ? "border border-slate-200/80 bg-slate-50/90" : "border border-white/10 bg-white/10",
              )}
            >
              <Avatar
                className={cn(
                  "h-11 w-11 text-white shadow-[0_18px_45px_-28px_rgba(255,255,255,0.6)]",
                  isLight ? "border border-slate-200 bg-white text-slate-900" : "border border-white/15 bg-white/10",
                )}
              >
                {userAvatar ? (
                  <AvatarImage src={userAvatar} alt={displayUserName} className="object-cover" />
                ) : (
                  <AvatarFallback
                    className={cn("text-sm font-semibold", isLight ? "bg-slate-100 text-slate-700" : "bg-white/10 text-white")}
                  >
                    {avatarInitial}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <p className={cn("text-sm font-semibold", isLight ? "text-slate-900" : "text-white/90")}>
                  {hero.meta ?? "Espace apprenant"}
                </p>
                <p className={cn("text-xs", isLight ? "text-slate-500" : "text-white/60")}>{displayUserName}</p>
              </div>
            </div>

            <nav className="flex flex-col gap-1">
              {primaryNav.map((item, index) => {
                const isActive = activeHref
                  ? activeHref === item.href || activeHref.startsWith(item.href)
                  : index === 0;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2",
                      isLight
                        ? cn(
                            "focus-visible:ring-slate-900/20",
                            isActive ? "text-slate-900" : "text-slate-500 hover:text-slate-900",
                          )
                        : cn(
                            "focus-visible:ring-white/30",
                            isActive ? "text-white" : "text-white/50 hover:text-white",
                          ),
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-7 w-7 place-items-center rounded-full transition group-hover:text-white",
                        isLight
                          ? "bg-slate-100 text-slate-600 group-hover:bg-slate-200 group-hover:text-slate-900"
                          : "bg-white/10 text-white/70 group-hover:bg-white/20 group-hover:text-white",
                      )}
                    >
                      {item.icon ? learnerNavIconMap[item.icon] : learnerNavIconMap.home}
                    </span>
                    <span className="truncate">{item.label}</span>
                    {isActive ? (
                      <span
                        className={cn(
                          "ml-auto h-2 w-2 rounded-full",
                          isLight ? "bg-slate-900 shadow-[0_0_10px_rgba(15,23,42,0.35)]" : "bg-white/70 shadow-[0_0_10px_rgba(255,255,255,0.6)]",
                        )}
                      />
                    ) : null}
                  </Link>
                );
              })}
              {appsNav.length > 0 ? (
                <div className="mt-4 space-y-2">
                  <p
                    className={cn(
                      "px-4 text-[11px] font-semibold uppercase tracking-[0.35em]",
                      isLight ? "text-slate-400" : "text-white/40",
                    )}
                  >
                    Apps
                  </p>
                  <div className="flex flex-col gap-1">
                    {appsNav.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "group flex items-center gap-3 px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2",
                          isLight
                            ? "text-slate-500 hover:text-slate-900 focus-visible:ring-slate-900/20"
                            : "text-white/55 hover:text-white focus-visible:ring-white/30",
                        )}
                      >
                        <span
                          className={cn(
                            "grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold uppercase tracking-wide",
                            item.brandColor
                              ? item.brandColor.dot
                              : isLight
                                ? "bg-slate-200 text-slate-800"
                                : "bg-white/20 text-white",
                          )}
                        >
                          {item.label.slice(0, 2)}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </nav>
          </div>
          {stats.length > 0 ? (
            <div
              className={cn(
                "flex flex-col gap-3 rounded-[28px] px-4 py-5 backdrop-blur",
                isLight ? "border border-slate-200/80 bg-white/90 shadow-sm" : "border border-white/10 bg-white/5",
              )}
            >
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className={cn("flex items-center justify-between", isLight ? "text-slate-600" : "text-white/70")}
                >
                  <span
                    className={cn("text-[11px] uppercase tracking-[0.3em]", isLight ? "text-slate-400" : "text-white/45")}
                  >
                    {stat.label}
                  </span>
                  <span className={cn("text-lg font-semibold", isLight ? "text-slate-900" : "text-white")}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </aside>

        <div className="flex flex-1 flex-col justify-between pb-4">
          <div className="max-w-2xl space-y-6 pb-4">
            {hero.badge ? (
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] backdrop-blur",
                  isLight
                    ? "border border-slate-200/80 bg-slate-50 text-slate-600"
                    : "bg-white/10 text-white/70",
                )}
              >
                {hero.badge}
              </span>
            ) : null}
            <h1
              className={cn(
                "text-[clamp(36px,5vw,66px)] font-semibold leading-tight tracking-tight",
                isLight ? "text-slate-900" : "text-white drop-shadow-[0_30px_60px_rgba(0,0,0,0.7)]",
              )}
            >
              {hero.title}
            </h1>
            <p className={cn("text-lg md:text-xl", isLight ? "text-slate-600" : "text-white/70")}>{hero.description}</p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={primaryCtaHref ?? featured[0]?.href ?? "/dashboard/student/learning/formations"}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-6 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2",
                  isLight
                    ? "bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-900/30"
                    : "bg-white text-slate-900 hover:bg-white/90 focus-visible:ring-white/30",
                )}
              >
                <Play className="h-4 w-4" />
                Reprendre
              </Link>
              <Link
                href="/dashboard/student/learning/formations"
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-6 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2",
                  isLight
                    ? "border-slate-200 bg-white text-slate-800 hover:bg-slate-50 focus-visible:ring-slate-900/20"
                    : "border-white/20 bg-white/10 text-white/85 hover:bg-white/20 focus-visible:ring-white/30",
                )}
              >
                Explorer les programmes
              </Link>
            </div>
          </div>

          {limitedFeatured.length > 0 ? (
            <div className="mt-2 space-y-4 pb-2">
              <p
                className={cn(
                  "text-xs font-semibold uppercase tracking-[0.35em]",
                  isLight ? "text-slate-400" : "text-white/50",
                )}
              >
                Continuer
              </p>
              <div className="scrollbar-none flex max-w-full gap-5 overflow-x-auto overflow-y-visible pb-2">
                {limitedFeatured.map((item, index) => {
                  const progressValue =
                    typeof item.progress === "number"
                      ? Math.min(Math.max(item.progress, 0), 100)
                      : 0;
                  const halo = FEATURED_HALOS[index % FEATURED_HALOS.length];

                  return (
                    <Link
                      key={item.id}
                      href={item.href ?? `#${item.id}`}
                      className={cn(
                        "group relative flex w-[220px] max-w-[min(220px,100%)] flex-shrink-0 flex-col overflow-hidden rounded-3xl border transition hover:-translate-y-2 focus-visible:outline-none focus-visible:ring-2",
                        isLight
                          ? "border-slate-200/90 bg-white shadow-md hover:bg-slate-50 focus-visible:ring-slate-900/15"
                          : "border-white/10 bg-white/5 shadow-[0_30px_60px_-40px_rgba(0,0,0,0.65)] hover:bg-white/10 focus-visible:ring-white/30",
                      )}
                    >
                      <div className="relative aspect-video w-full overflow-hidden">
                        {item.image ? (
                          isRemoteVideo(item.image) ? (
                            <LazyBandwidthVideo
                              src={item.image}
                              poster={FALLBACK_HERO}
                              rootMargin="0px 200px 0px 200px"
                              className="object-cover w-full h-full transition duration-700 group-hover:scale-105"
                              autoPlay
                              loop
                              muted
                              playsInline
                            />
                          ) : (
                            <img
                              src={item.image}
                              alt={item.title}
                              className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                            />
                          )
                        ) : (
                          <div
                            className={cn(
                              "absolute inset-0",
                              isLight
                                ? "bg-[radial-gradient(circle_at_center,#f1f5f9,#e2e8f0)]"
                                : "bg-[radial-gradient(circle_at_center,#1f2335,#0f172a)]",
                            )}
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div
                          className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${halo} opacity-90 mix-blend-screen`}
                        />
                      </div>
                      <div
                        className={cn(
                          "space-y-3 px-4 py-4",
                          isLight ? "bg-white" : "",
                        )}
                      >
                        <div className="space-y-1">
                          <p
                            className={cn(
                              "line-clamp-2 text-sm font-semibold",
                              isLight ? "text-slate-900" : "text-white",
                            )}
                          >
                            {item.title}
                          </p>
                          {item.meta ? (
                            <p
                              className={cn(
                                "line-clamp-1 text-xs",
                                isLight ? "text-slate-500" : "text-white/60",
                              )}
                            >
                              {item.meta}
                            </p>
                          ) : null}
                        </div>
                        <div className="space-y-1">
                          <div
                            className={cn(
                              "h-1.5 w-full overflow-hidden rounded-full",
                              isLight ? "bg-slate-200" : "bg-white/10",
                            )}
                          >
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                isLight ? "bg-slate-900" : "bg-white",
                              )}
                              style={{ width: `${progressValue}%` }}
                            />
                          </div>
                          <p
                            className={cn(
                              "text-[11px] font-medium",
                              isLight ? "text-slate-500" : "text-white/60",
                            )}
                          >
                            {progressValue}%
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}


