import Link from "next/link";

import { cn } from "@/lib/utils";
import { learnerNavItems } from "@/components/dashboard/learner-nav-items";
import { learnerNavIconMap } from "@/components/dashboard/learner-nav-icons";

type LearnerNavRailProps = {
  activeHref?: string;
};

const navItems = learnerNavItems;
const primaryNav = navItems.filter((item) => item.group !== "apps");
const appsNav = navItems.filter((item) => item.group === "apps");

const isItemActive = (activeHref: string | undefined, href: string) => {
  if (!activeHref) return false;
  return activeHref === href || activeHref.startsWith(href);
};

export function LearnerNavRail({ activeHref }: LearnerNavRailProps) {
  return (
    <div className="md:w-[260px] md:flex-none">
      <div className="md:hidden">
        <nav className="scrollbar-none flex gap-2 overflow-x-auto rounded-full border border-white/10 bg-white/5 p-2 backdrop-blur">
          {primaryNav.map((item) => {
            const active = isItemActive(activeHref, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
                  active
                    ? "bg-white text-slate-900"
                    : "bg-white/10 text-white/60 hover:bg-white/15 hover:text-white",
                )}
              >
                <span className="grid h-6 w-6 place-items-center rounded-full bg-black/10 text-white/80">
                  {item.icon ? learnerNavIconMap[item.icon] : learnerNavIconMap.home}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="sticky top-6 hidden md:block">
        <div className="space-y-5 rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/40">Navigation</p>
            <nav className="flex flex-col gap-1">
              {primaryNav.map((item, index) => {
                const active = isItemActive(activeHref, item.href) || (!activeHref && index === 0);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-[16px] px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
                      active ? "text-white" : "text-white/55 hover:text-white",
                    )}
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-white/70 transition group-hover:bg-white/20 group-hover:text-white">
                      {item.icon ? learnerNavIconMap[item.icon] : learnerNavIconMap.home}
                    </span>
                    <span className="truncate">{item.label}</span>
                    {active ? (
                      <span className="ml-auto h-2 w-2 rounded-full bg-white/70 shadow-[0_0_10px_rgba(255,255,255,0.6)]" />
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </div>

          {appsNav.length > 0 ? (
            <div className="space-y-2">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/40">Apps</p>
              <nav className="flex flex-col gap-1">
                {appsNav.map((item) => {
                  const active = isItemActive(activeHref, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-[16px] px-4 py-2 text-sm font-semibold text-white/55 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
                        active && "text-white",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold uppercase tracking-wide",
                          item.brandColor ? item.brandColor.dot : "bg-white/20 text-white",
                        )}
                      >
                        {item.label.slice(0, 2)}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}


