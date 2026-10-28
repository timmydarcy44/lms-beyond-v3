"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard/expert/care/fiche", label: "Ma fiche publique" },
  { href: "/dashboard/expert/care/disponibilites", label: "Disponibilités" },
  { href: "/dashboard/expert/care/rendez-vous", label: "Rendez-vous" },
];

export function CareExpertTabs() {
  const pathname = usePathname();
  return (
    <nav className="mb-6 flex flex-wrap gap-2" aria-label="Byound Care">
      {TABS.map((tab) => {
        const on = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold",
              on ? "bg-[#F4F5F7] text-[#07080B]" : "bg-[#12141A] text-[#DADDE4] hover:text-white",
            )}
            aria-current={on ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
