"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { OrgSidebarBrand } from "@/components/enterprise/org-sidebar-brand";
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
        <OrgSidebarBrand logoUrl={branding.logoUrl} name={branding.name || "EDGE"} />
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
