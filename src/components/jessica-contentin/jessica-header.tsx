"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  FileText,
  Package,
  Contact,
  Receipt,
  Mail,
  FolderKanban,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { jessicaSuper } from "@/lib/jessica-contentin/super-theme";
import { SUPER_SPACE_COOKIE } from "@/lib/utils/contentin-theme";

function setSuperSpace(space: "byound" | "jessica") {
  try {
    document.cookie = `${SUPER_SPACE_COOKIE}=${space}; Path=/; Max-Age=31536000; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

const NAV = [
  { href: "/super/jessica-crm", label: "CRM", icon: Contact, match: "/super/jessica-crm" },
  { href: "/super/jessica-factures", label: "Factures", icon: Receipt, match: "/super/jessica-factures" },
  { href: "/super/jessica-mails", label: "Mail", icon: Mail, match: "/super/jessica-mails" },
  {
    href: "/super/jessica-administratif",
    label: "Administratif",
    icon: FolderKanban,
    match: "/super/jessica-administratif",
  },
  {
    href: "/super/jessica-tests",
    label: "Tests",
    icon: ClipboardList,
    match: "/super/jessica-tests",
  },
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
      <nav className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-4 px-6">
        <Link
          href="/super/jessica-dashboard"
          onClick={() => setSuperSpace("jessica")}
          className="shrink-0 text-lg font-semibold tracking-tight text-black"
        >
          Jessica Contentin
        </Link>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5 overflow-x-auto">
          {NAV.map(({ href, label, icon: Icon, match }) => {
            const active = isActive(pathname, match);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSuperSpace("jessica")}
                className={cn(active ? jessicaSuper.navItemActive : jessicaSuper.navItem)}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>

        <Link
          href="/super?space=byound"
          onClick={() => setSuperSpace("byound")}
          className="shrink-0 rounded-full bg-gradient-to-br from-[#0B1426] via-[#1E1B4B] to-[#5B21B6] px-3.5 py-1.5 text-[12px] font-semibold tracking-wide text-white shadow-sm transition hover:brightness-110"
          title="Ouvrir Byound Control"
        >
          Byound
        </Link>
      </nav>
    </header>
  );
}
