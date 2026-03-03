import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";

import { cn } from "@/lib/utils";
import type { LearnerNavItem } from "@/components/dashboard/learner-nav-items";
import { learnerNavItems as defaultLearnerNavItems } from "@/components/dashboard/learner-nav-items";
import { learnerNavIconMap } from "@/components/dashboard/learner-nav-icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import type { LearnerHero as LearnerHeroType, LearnerCard } from "@/lib/queries/apprenant";

type CinematicHeroProps = {
  hero: LearnerHeroType;
  featured: LearnerCard[];
  stats: Array<{ label: string; value: string }>;
  navItems?: LearnerNavItem[];
  activeHref?: string;
  userName?: string | null;
  userAvatar?: string | null;
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

export function CinematicHero({
  hero,
  featured,
  stats,
  navItems = defaultLearnerNavItems,
  activeHref,
  userName,
  userAvatar,
}: CinematicHeroProps) {
  const limitedFeatured = featured.slice(0, 6);
  const heroImage = hero.backgroundImage && hero.backgroundImage.trim() !== "" ? hero.backgroundImage : FALLBACK_HERO;
  const primaryNav = navItems.filter((item) => item.group !== "apps");
  const appsNav = navItems.filter((item) => item.group === "apps");
  const avatarInitial =
    userName?.trim()?.charAt(0)?.toUpperCase() ?? hero.meta?.trim()?.charAt(0)?.toUpperCase() ?? "B";
  const displayUserName = userName ?? "Jessica Contentin";

  return (
    <section className="relative -mx-4 flex min-h-[520px] flex-col overflow-visible bg-[#0b0b0f] text-white shadow-[0_120px_220px_-100px_rgba(0,0,0,0.9)] md:-mx-10 md:min-h-[600px] lg:min-h-[660px]">
      <div className="absolute inset-0">
        <Image
          src={heroImage}
          alt={hero.title}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-black/30" />
        <div className="absolute inset-y-0 left-0 w-2/5 bg-gradient-to-r from-black/92 via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.35),transparent_55%)] mix-blend-screen opacity-60" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(255,214,118,0.25),transparent_60%)] mix-blend-screen opacity-70" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col gap-8 px-6 py-10 md:flex-row md:gap-12 md:px-12 lg:py-14">
        <aside className="flex w-full flex-none flex-col gap-4 md:sticky md:top-10 md:w-[320px] md:self-start">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="mb-4 flex items-center gap-3 rounded-[20px] border border-white/10 bg-white/10 px-4 py-3">
              <Avatar className="h-11 w-11 border border-white/15 bg-white/10 text-white shadow-[0_18px_45px_-28px_rgba(255,255,255,0.6)]">
                {userAvatar ? (
                  <AvatarImage src={userAvatar} alt={displayUserName} className="object-cover" />
                ) : (
                  <AvatarFallback className="bg-white/10 text-sm font-semibold text-white">
                    {avatarInitial}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-white/90">{hero.meta ?? "Espace apprenant"}</p>
                <p className="text-xs text-white/60">{displayUserName}</p>
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
                      "group flex items-center gap-3 px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
                      isActive
                        ? "text-white"
                        : "text-white/50 hover:text-white",
                    )}
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-white/70 transition group-hover:bg-white/20 group-hover:text-white">
                      {item.icon ? learnerNavIconMap[item.icon] : learnerNavIconMap.home}
                    </span>
                    <span className="truncate">{item.label}</span>
                    {isActive ? (
                      <span className="ml-auto h-2 w-2 rounded-full bg-white/70 shadow-[0_0_10px_rgba(255,255,255,0.6)]" />
                    ) : null}
                  </Link>
                );
              })}
              {appsNav.length > 0 ? (
                <div className="mt-4 space-y-2">
                  <p className="px-4 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/40">
                    Apps
                  </p>
                  <div className="flex flex-col gap-1">
                    {appsNav.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "group flex items-center gap-3 px-4 py-2 text-sm font-semibold text-white/55 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
                        )}
                      >
                        <span
                          className={cn(
                            "grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold uppercase tracking-wide",
                            item.brandColor
                              ? item.brandColor.dot
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
            <div className="flex flex-col gap-3 rounded-[28px] border border-white/10 bg-white/5 px-4 py-5 backdrop-blur">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center justify-between text-white/70">
                  <span className="text-[11px] uppercase tracking-[0.3em] text-white/45">
                    {stat.label}
                  </span>
                  <span className="text-lg font-semibold text-white">{stat.value}</span>
                </div>
              ))}
            </div>
          ) : null}
        </aside>

        <div className="flex flex-1 flex-col justify-between pb-4">
          <div className="max-w-2xl space-y-6 pb-4">
            {hero.badge ? (
              <span className="inline-flex items-center rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/70 backdrop-blur">
                {hero.badge}
              </span>
            ) : null}
            <h1 className="text-[clamp(36px,5vw,66px)] font-semibold leading-tight tracking-tight text-white drop-shadow-[0_30px_60px_rgba(0,0,0,0.7)]">
              {hero.title}
            </h1>
            <p className="text-lg text-white/70 md:text-xl">{hero.description}</p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={featured[0]?.href ?? "/dashboard/student/learning/formations"}
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                <Play className="h-4 w-4" />
                Reprendre
              </Link>
              <Link
                href="/dashboard/student/learning/formations"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                Explorer les programmes
              </Link>
            </div>
          </div>

          {limitedFeatured.length > 0 ? (
            <div className="mt-2 space-y-4 pb-2">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/50">
                Continuer
              </p>
              <div className="scrollbar-none flex gap-5 overflow-x-auto pb-2">
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
                      className="group relative flex w-[220px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_30px_60px_-40px_rgba(0,0,0,0.65)] transition hover:-translate-y-2 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                    >
                      <div className="relative aspect-video w-full overflow-hidden">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            className="object-cover transition duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1f2335,#0f172a)]" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div
                          className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${halo} opacity-90 mix-blend-screen`}
                        />
                      </div>
                      <div className="space-y-3 px-4 py-4">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-white line-clamp-2">{item.title}</p>
                          {item.meta ? (
                            <p className="text-xs text-white/60 line-clamp-1">{item.meta}</p>
                          ) : null}
                        </div>
                        <div className="space-y-1">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-white transition-all"
                              style={{ width: `${progressValue}%` }}
                            />
                          </div>
                          <p className="text-[11px] font-medium text-white/60">{progressValue}%</p>
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


