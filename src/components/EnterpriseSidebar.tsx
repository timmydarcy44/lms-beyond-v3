"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Menu } from "lucide-react";
import { useOptionalEnterpriseOverviewContext } from "@/components/enterprise/enterprise-overview-provider";
import { OrgSidebarBrand } from "@/components/enterprise/org-sidebar-brand";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Briefcase,
  MessageCircle,
  Settings,
  Users,
  BookOpen,
} from "lucide-react";

type NavLeaf = { label: string; href: string };
type NavItem =
  | { type: "link"; label: string; href: string; icon: typeof LayoutDashboard }
  | {
      type: "group";
      label: string;
      href: string;
      icon: typeof LayoutDashboard;
      children: NavLeaf[];
    };

const NAV_ITEMS: NavItem[] = [
  { type: "link", label: "Dashboard", href: "/dashboard/entreprise", icon: LayoutDashboard },
  {
    type: "group",
    label: "Salariés",
    href: "/dashboard/entreprise/salaries",
    icon: Users,
    children: [
      { label: "Métiers", href: "/dashboard/entreprise/metiers" },
      { label: "Équipe Insight", href: "/dashboard/entreprise/equipe-insight" },
    ],
  },
  {
    type: "group",
    label: "Formations",
    href: "/dashboard/entreprise/formations/catalogue",
    icon: BookOpen,
    children: [
      { label: "Formations EDGE", href: "/dashboard/entreprise/formations/catalogue" },
      { label: "Créer une formation", href: "/dashboard/entreprise/formations/creer" },
      { label: "Gérer mes formations", href: "/dashboard/entreprise/formations/gerer" },
      { label: "Parcours", href: "/dashboard/entreprise/formations/parcours" },
      { label: "Statistiques", href: "/dashboard/entreprise/statistiques" },
    ],
  },
  {
    type: "group",
    label: "Recrutement",
    href: "/dashboard/entreprise/offres",
    icon: Briefcase,
    children: [{ label: "Mes offres", href: "/dashboard/entreprise/offres" }],
  },
  { type: "link", label: "Messages", href: "/dashboard/entreprise/messages", icon: MessageCircle },
  { type: "link", label: "Paramètres", href: "/dashboard/entreprise/parametres", icon: Settings },
];

type ViewerState = {
  prenom: string | null;
  nom: string | null;
  email: string | null;
};

let viewerInflight: Promise<ViewerState | null> | null = null;

/** Purge le cache sidebar (ex. après correction profil RH en base). */
export function invalidateEnterpriseViewerCache() {
  viewerInflight = null;
}

function viewerInitials(prenom: string | null, nom: string | null, email: string | null) {
  const a = (prenom ?? "").trim().slice(0, 1).toUpperCase();
  const b = (nom ?? "").trim().slice(0, 1).toUpperCase();
  if (a || b) return `${a}${b}`.trim();
  return (email ?? "?").slice(0, 2).toUpperCase();
}

async function fetchViewer(): Promise<ViewerState | null> {
  if (viewerInflight) return viewerInflight;
  viewerInflight = fetch("/api/dashboard/entreprise/viewer", { credentials: "include" })
    .then(async (res) => {
      if (!res.ok) return null;
      return (await res.json()) as ViewerState;
    })
    .finally(() => {
      viewerInflight = null;
    });
  return viewerInflight;
}

function isPathActive(pathname: string, href: string) {
  if (href === "/dashboard/entreprise") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isGroupActive(pathname: string, item: Extract<NavItem, { type: "group" }>) {
  if (item.label === "Formations") {
    return (
      pathname.startsWith("/dashboard/entreprise/formations") ||
      pathname.startsWith("/dashboard/entreprise/statistiques")
    );
  }
  if (item.label === "Salariés") {
    return (
      pathname.startsWith("/dashboard/entreprise/salaries") ||
      pathname.startsWith("/dashboard/entreprise/metiers") ||
      pathname.startsWith("/dashboard/entreprise/equipe-insight")
    );
  }
  if (item.label === "Recrutement") {
    return pathname.startsWith("/dashboard/entreprise/offres");
  }
  return isPathActive(pathname, item.href) || item.children.some((c) => isPathActive(pathname, c.href));
}

function NavLinks({
  pathname,
  onNavigate,
  openGroups,
  toggleGroup,
}: {
  pathname: string;
  onNavigate?: () => void;
  openGroups: Record<string, boolean>;
  toggleGroup: (label: string) => void;
}) {
  return (
    <>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        if (item.type === "link") {
          const active = isPathActive(pathname, item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              prefetch
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-violet-600/20 text-violet-200"
                  : "text-white/55 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon size={18} strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        }

        const groupActive = isGroupActive(pathname, item);
        const open = openGroups[item.label] ?? groupActive;

        return (
          <div key={item.label} className="space-y-1">
            <button
              type="button"
              onClick={() => toggleGroup(item.label)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                groupActive
                  ? "bg-violet-600/20 text-violet-200"
                  : "text-white/55 hover:bg-white/5 hover:text-white",
              )}
              aria-expanded={open}
            >
              <Icon size={18} strokeWidth={1.75} />
              <span className="flex-1 text-left">{item.label}</span>
              <ChevronDown
                size={16}
                className={cn("shrink-0 opacity-60 transition-transform", open ? "rotate-180" : "")}
              />
            </button>
            {open ? (
              <div className="ml-3 space-y-0.5 border-l border-white/10 pl-3">
                {item.children.map((child) => {
                  const childActive = isPathActive(pathname, child.href);
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      prefetch
                      onClick={onNavigate}
                      className={cn(
                        "block rounded-lg px-3 py-2 text-[13px] font-medium transition",
                        childActive
                          ? "bg-white/10 text-white"
                          : "text-white/50 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      {child.label}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
}

export function EnterpriseMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const overviewCtx = useOptionalEnterpriseOverviewContext();
  const orgName = overviewCtx?.data?.organisation?.name || "Beyond Enterprise";
  const orgLogo = overviewCtx?.data?.organisation?.logo_url || null;
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setOpenGroups((prev) => ({
      ...prev,
      Formations:
        pathname.startsWith("/dashboard/entreprise/formations") ||
        pathname.startsWith("/dashboard/entreprise/statistiques")
          ? true
          : prev.Formations,
      Salariés:
        pathname.startsWith("/dashboard/entreprise/salaries") ||
        pathname.startsWith("/dashboard/entreprise/metiers") ||
        pathname.startsWith("/dashboard/entreprise/equipe-insight")
          ? true
          : prev.Salariés,
      Recrutement: pathname.startsWith("/dashboard/entreprise/offres") ? true : prev.Recrutement,
    }));
  }, [pathname]);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !(prev[label] ?? false) }));
  };

  return (
    <div className="sticky top-0 z-40 border-b border-violet-500/15 bg-[#0f0e1a]/95 px-4 py-3 backdrop-blur-md lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/10 text-violet-100"
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="border-violet-500/20 bg-[#0f0e1a] text-white">
            <SheetHeader>
              <SheetTitle className="text-left text-white">{orgName}</SheetTitle>
            </SheetHeader>
            <div className="mt-2 text-[10px] font-medium tracking-[0.08em] text-white/40">
              Powered by EDGE
            </div>
            <nav className="mt-6 flex flex-col gap-1" aria-label="Navigation entreprise mobile">
              <NavLinks
                pathname={pathname}
                onNavigate={() => setOpen(false)}
                openGroups={openGroups}
                toggleGroup={toggleGroup}
              />
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex min-w-0 flex-col items-center">
          {orgLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={orgLogo} alt="" className="h-8 w-8 rounded-lg object-contain" />
          ) : null}
          <div className="mt-1 truncate text-sm font-semibold text-white">{orgName}</div>
          <div className="text-[9px] tracking-[0.08em] text-white/40">Powered by EDGE</div>
        </div>
        <div className="w-10" />
      </div>
    </div>
  );
}

export default function EnterpriseSidebar() {
  const pathname = usePathname();
  const overviewCtx = useOptionalEnterpriseOverviewContext();
  const overviewData = overviewCtx?.data;
  const [viewer, setViewer] = useState<ViewerState>({ prenom: null, nom: null, email: null });
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Formations: true,
    Salariés: false,
  });

  useEffect(() => {
    invalidateEnterpriseViewerCache();
    if (overviewData?.viewer) {
      setViewer({
        prenom: overviewData.viewer.prenom,
        nom: overviewData.viewer.nom,
        email: overviewData.viewer.email,
      });
      return;
    }
    void fetchViewer().then((v) => {
      if (v) setViewer(v);
    });
  }, [overviewData?.viewer]);

  useEffect(() => {
    setOpenGroups((prev) => ({
      ...prev,
      Formations:
        pathname.startsWith("/dashboard/entreprise/formations") ||
        pathname.startsWith("/dashboard/entreprise/statistiques")
          ? true
          : prev.Formations,
      Salariés:
        pathname.startsWith("/dashboard/entreprise/salaries") ||
        pathname.startsWith("/dashboard/entreprise/metiers") ||
        pathname.startsWith("/dashboard/entreprise/equipe-insight")
          ? true
          : prev.Salariés,
      Recrutement: pathname.startsWith("/dashboard/entreprise/offres") ? true : prev.Recrutement,
    }));
  }, [pathname]);

  const displayName = useMemo(() => {
    const full = [viewer.prenom, viewer.nom].filter(Boolean).join(" ").trim();
    return full || viewer.email || "—";
  }, [viewer]);

  const initials = viewerInitials(viewer.prenom, viewer.nom, viewer.email);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !(prev[label] ?? false) }));
  };

  return (
    <aside
      className="fixed inset-y-0 left-0 z-50 hidden h-full w-[260px] flex-col border-r border-[rgba(124,58,237,0.15)] lg:flex"
      style={{ background: "linear-gradient(180deg, #0f0e1a 0%, #1a1535 100%)" }}
    >
      <div className="border-b border-white/10 px-6 pb-6 pt-8">
        <OrgSidebarBrand
          logoUrl={overviewData?.organisation?.logo_url}
          name={overviewData?.organisation?.name || "Beyond"}
        />
        <div className="mt-5 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{displayName}</p>
            <p className="truncate text-xs text-white/40">{viewer.email ?? ""}</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4" aria-label="Navigation entreprise">
        <NavLinks pathname={pathname} openGroups={openGroups} toggleGroup={toggleGroup} />
      </nav>
    </aside>
  );
}
