"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, FileText, Package, Contact } from "lucide-react";
import { cn } from "@/lib/utils";
import { jessicaSuper } from "@/lib/jessica-contentin/super-theme";

const NAV = [
  { href: "/super/jessica-crm", label: "CRM", icon: Contact, match: "/super/jessica-crm" },
  { href: "/super/agenda", label: "Agenda", icon: Calendar, match: "/super/agenda" },
  { href: "/super/catalogue-jessica", label: "Catalogue", icon: Package, match: "/super/catalogue-jessica" },
  { href: "/super/blog/new", label: "Blog", icon: FileText, match: "/super/blog" },
] as const;

function isActive(pathname: string | null, match: string) {
  if (!pathname) return false;
  if (match === "/super/jessica-crm") {
    return pathname === match || pathname.startsWith(`${match}/`);
  }
  return pathname === match || pathname.startsWith(`${match}/`);
}

export function JessicaHeader() {
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-black/[0.06] bg-white/80 backdrop-blur-xl backdrop-saturate-150"
      style={{ fontFamily: jessicaSuper.font }}
    >
      <nav className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-6">
        <Link href="/super/jessica-dashboard" className="text-lg font-semibold tracking-tight text-black">
          Jessica Contentin
        </Link>

        <div className="flex items-center gap-1.5">
          {NAV.map(({ href, label, icon: Icon, match }) => {
            const active = isActive(pathname, match);
            return (
              <Link
                key={href}
                href={href}
                className={cn(active ? jessicaSuper.navItemActive : jessicaSuper.navItem)}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
