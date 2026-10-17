"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SALARIE_NAV_ITEMS } from "@/lib/salarie/connect-nav";

export default function SidebarSalarie() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4" aria-label="Navigation salarié">
      {SALARIE_NAV_ITEMS.map((item) => {
        const hrefPath = item.href.split("#")[0];
        const active = hrefPath === "/dashboard/salarie" ? pathname === hrefPath : pathname.startsWith(hrefPath);
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex h-11 items-center gap-3 rounded-full px-3 text-sm font-semibold text-[#B5BAC6]",
              active && "bg-[#1E2130] font-extrabold text-white",
            )}
          >
            <Icon size={18} strokeWidth={1.75} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-[#262A36] bg-[#12141A] text-white lg:hidden"
        aria-label="Ouvrir le menu"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-4 w-4" />
      </button>
      {open ? (
        <button type="button" aria-label="Fermer le menu" className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />
      ) : null}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen w-[240px] flex-col border-r border-[#16181F] bg-[#07080B] py-4",
          open ? "flex" : "hidden lg:flex",
        )}
      >
        <div className="mb-4 flex items-center justify-between px-4">
          <Link href="/dashboard/salarie" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[11px] font-extrabold text-[#07080B]">BY</span>
            <span className="text-[15px] font-extrabold text-white">Byound</span>
          </Link>
          <button type="button" className="lg:hidden" aria-label="Fermer" onClick={() => setOpen(false)}>
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
        {nav}
      </aside>
    </>
  );
}
