"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SALARIE_NAV_ITEMS } from "@/lib/salarie/connect-nav";

export default function SidebarSalarie() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden h-screen w-[280px] shrink-0 flex-col border-r border-white/[0.08] bg-transparent backdrop-blur-[20px] lg:flex">
      <div className="border-b border-white/[0.06] px-5 py-6">
        <div className="text-[18px] font-extrabold tracking-[-0.5px] text-white">EDGE</div>
        <div className="mt-1 text-[11px] font-medium uppercase tracking-[1.5px] text-white/45">
          Espace salarié
        </div>
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
