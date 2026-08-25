"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import {
  Users,
  Kanban,
  ShieldCheck,
  Building2,
  Mail,
  GraduationCap,
  UserCircle,
  UserCheck,
  ShoppingBag,
  Rocket,
  Handshake,
  FileBadge,
  ClipboardList,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSupabase } from "@/components/providers/supabase-provider";
import { isPipelinePrescripteurUser } from "@/lib/crm/pipeline-prescripteur-access";

type CrmNavIcon = ComponentType<{ className?: string }>;

type CrmNavLink = {
  href: string;
  label: string;
  icon: CrmNavIcon;
  section: "commercial" | "clients" | "formation" | "certification" | "outils";
  match?: string;
  featured?: boolean;
  nested?: boolean;
  prescripteurOnly?: boolean;
};

const SECTION_ORDER = [
  "commercial",
  "clients",
  "formation",
  "certification",
  "outils",
] as const;

type SectionKey = (typeof SECTION_ORDER)[number];

const SECTION_LABELS: Record<SectionKey, string> = {
  commercial: "Commercial",
  clients: "Clients",
  formation: "Formation",
  certification: "Certification & Qualité",
  outils: "Outils",
};

const SIDEBAR_COLLAPSE_KEY = "crm-sidebar-collapsed-sections";

const CRM_LINKS: CrmNavLink[] = [
  { href: "/super/utilisateurs", label: "Contacts", icon: Users, section: "commercial" },
  {
    href: "/super/crm/pipeline",
    label: "Pipeline B2B",
    icon: Kanban,
    match: "/super/crm/pipeline",
    featured: true,
    section: "commercial",
  },
  {
    href: "/super/crm/pipeline/prescripteurs",
    label: "Prescripteurs",
    icon: Handshake,
    nested: true,
    prescripteurOnly: true,
    section: "commercial",
  },
  { href: "/super/crm/pipeline?type=btoc", label: "Pipeline B2C", icon: ShoppingBag, section: "commercial" },
  { href: "/super/crm/onboarding", label: "Onboarding clients", icon: Rocket, section: "commercial" },
  { href: "/super/organisations", label: "Organisations", icon: Building2, section: "clients" },
  { href: "/super/utilisateurs?role=btoc", label: "Clients particuliers", icon: ShoppingBag, section: "clients" },
  { href: "/super/crm/formations", label: "Formations", icon: ClipboardList, section: "formation" },
  { href: "/super/utilisateurs?role=learner", label: "Apprenants", icon: UserCircle, section: "formation" },
  { href: "/super/utilisateurs?role=instructor", label: "Formateurs", icon: GraduationCap, section: "formation" },
  { href: "/super/utilisateurs?role=tutor", label: "Tuteurs", icon: UserCheck, section: "formation" },
  { href: "/super/crm/validators", label: "Validateurs", icon: ShieldCheck, section: "certification" },
  { href: "/super/crm/qualiopi", label: "Qualiopi", icon: FileBadge, section: "certification" },
  { href: "/super/crm/emails", label: "Emails", icon: Mail, section: "outils" },
];

function isLinkActive(
  item: CrmNavLink,
  pathname: string,
  typeParam: string | null,
  roleParam: string | null,
): boolean {
  const isPipelineBtoc = item.href.includes("type=btoc");
  const isPipelineBtob = item.href === "/super/crm/pipeline";
  const isPrescripteur = item.href === "/super/crm/pipeline/prescripteurs";

  if (isPipelineBtoc) {
    return pathname === "/super/crm/pipeline" && typeParam === "btoc";
  }
  if (isPipelineBtob) {
    return (
      pathname === "/super/crm/pipeline" &&
      typeParam !== "btoc" &&
      !pathname.startsWith("/super/crm/pipeline/prescripteurs")
    );
  }
  if (isPrescripteur) {
    return pathname.startsWith("/super/crm/pipeline/prescripteurs");
  }
  if (item.href === "/super/crm/formations") {
    return pathname.startsWith("/super/crm/formations");
  }
  if (item.href === "/super/crm/qualiopi") {
    return pathname.startsWith("/super/crm/qualiopi");
  }
  if (item.href.includes("?role=")) {
    return pathname === "/super/utilisateurs" && roleParam === item.href.split("role=")[1];
  }
  if (item.href === "/super/utilisateurs") {
    return pathname === "/super/utilisateurs" && !roleParam;
  }
  return pathname === item.href.split("?")[0] || pathname.startsWith(`${item.href.split("?")[0]}/`);
}

function readCollapsed(): Partial<Record<SectionKey, boolean>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(SIDEBAR_COLLAPSE_KEY);
    if (!raw) return { commercial: false };
    return JSON.parse(raw) as Partial<Record<SectionKey, boolean>>;
  } catch {
    return {};
  }
}

export function CrmSidebar() {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  const roleParam = searchParams.get("role");
  const supabase = useSupabase();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Partial<Record<SectionKey, boolean>>>({});

  useEffect(() => {
    setCollapsed(readCollapsed());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!cancelled) setUserEmail(data.user?.email?.trim().toLowerCase() ?? null);
      } catch {
        if (!cancelled) setUserEmail(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const isJerome = userEmail === "jerome.picot@edgebs.fr";

  const links = useMemo(() => {
    let filtered = CRM_LINKS;
    if (isJerome) {
      filtered = filtered.filter((l) => {
        if (l.href === "/super/crm/validators") return false;
        if (l.href === "/super/utilisateurs?role=tutor") return false;
        if (l.href.includes("/super/crm/pipeline?type=btoc")) return false;
        return true;
      });
    }
    if (!isPipelinePrescripteurUser(userEmail)) {
      filtered = filtered.filter((l) => !l.prescripteurOnly);
    }
    return filtered;
  }, [isJerome, userEmail]);

  const sections = useMemo(() => {
    return SECTION_ORDER.map((key) => ({
      key,
      label: SECTION_LABELS[key],
      items: links.filter((l) => l.section === key),
    })).filter((s) => s.items.length > 0);
  }, [links]);

  const toggleSection = (key: SectionKey) => {
    setCollapsed((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(SIDEBAR_COLLAPSE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <aside className="w-full shrink-0 border-b border-gray-200 bg-gray-50/90 lg:w-56 lg:border-b-0 lg:border-r lg:min-h-[calc(100vh-3rem)]">
      <div className="sticky top-12 p-2 lg:p-4">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:block lg:space-y-3 lg:overflow-visible lg:px-0 lg:pb-0">
          {sections.map((section) => {
            const isCollapsed = Boolean(collapsed[section.key]);
            const hasActive = section.items.some((item) =>
              isLinkActive(item, pathname, typeParam, roleParam),
            );

            return (
              <div key={section.key} className="flex shrink-0 items-center gap-1 lg:block lg:space-y-1">
                <button
                  type="button"
                  className="hidden w-full items-center justify-between rounded-md px-3 py-1.5 text-left hover:bg-white/70 lg:flex"
                  onClick={() => toggleSection(section.key)}
                  aria-expanded={!isCollapsed}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                    {section.label}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 text-gray-400 transition-transform",
                      isCollapsed ? "-rotate-90" : "rotate-0",
                      hasActive && isCollapsed ? "text-indigo-500" : "",
                    )}
                  />
                </button>

                <div
                  className={cn(
                    "flex items-center gap-1 lg:block lg:space-y-1",
                    isCollapsed ? "lg:hidden" : "",
                  )}
                >
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = isLinkActive(item, pathname, typeParam, roleParam);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors lg:shrink lg:w-full",
                          item.nested ? "ml-4 lg:ml-2 lg:border-l-2 lg:border-indigo-100 lg:pl-4" : "",
                          isActive
                            ? item.featured
                              ? "border border-indigo-600 bg-indigo-600 text-white shadow-sm"
                              : "border border-gray-200 bg-white text-gray-900 shadow-sm"
                            : item.featured
                              ? "border border-transparent text-indigo-700 hover:bg-indigo-50 hover:text-indigo-900"
                              : "text-gray-600 hover:bg-white/80 hover:text-gray-900",
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            isActive && item.featured ? "opacity-100" : "opacity-70",
                          )}
                        />
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        {item.featured ? (
                          <span
                            className={cn(
                              "ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              isActive ? "bg-white/15 text-white" : "bg-indigo-100 text-indigo-800",
                            )}
                          >
                            Focus
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
