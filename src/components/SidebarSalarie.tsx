"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SALARIE_NAV_ITEMS } from "@/lib/salarie/connect-nav";

export default function SidebarSalarie() {
  const pathname = usePathname();
  const [branding, setBranding] = useState<{ logoUrl: string | null; name: string | null }>({
    logoUrl: null,
    name: null,
  });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/organizations/nav-branding", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const b = json?.branding;
        setBranding({
          logoUrl: typeof b?.logoUrl === "string" && b.logoUrl.trim() ? b.logoUrl.trim() : null,
          name: typeof b?.name === "string" && b.name.trim() ? b.name.trim() : null,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden h-screen w-[280px] shrink-0 flex-col border-r border-white/[0.08] bg-transparent backdrop-blur-[20px] lg:flex">
      <div className="border-b border-white/[0.06] px-5 py-6">
        {branding.logoUrl ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={branding.logoUrl}
              alt={branding.name || "Organisation"}
              className="h-11 w-11 rounded-xl border border-white/10 bg-white object-contain p-1"
            />
            <div className="min-w-0">
              <div className="truncate text-[16px] font-extrabold tracking-[-0.5px] text-white">
                {branding.name || "EDGE"}
              </div>
              <div className="mt-0.5 text-[11px] font-medium uppercase tracking-[1.5px] text-white/45">
                Espace salarié
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="text-[18px] font-extrabold tracking-[-0.5px] text-white">
              {branding.name || "EDGE"}
            </div>
            <div className="mt-1 text-[11px] font-medium uppercase tracking-[1.5px] text-white/45">
              Espace salarié
            </div>
          </>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-6" aria-label="Navigation salarié">
        {SALARIE_NAV_ITEMS.map((item) => {
          const active =
            item.href === "/dashboard/salarie"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "group flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition",
                active
                  ? "bg-[rgba(61,123,255,0.15)] text-white"
                  : "text-white/45 hover:bg-white/[0.04] hover:text-white",
              )}
            >
              <Icon
                size={16}
                strokeWidth={1.5}
                className={cn(active ? "text-[#3D7BFF]" : "text-white/45 group-hover:text-white/70")}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
