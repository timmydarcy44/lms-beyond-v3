"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSupabase } from "@/components/providers/supabase-provider";

const CRM_LINKS = [
  { href: "/super/utilisateurs", label: "Contacts", icon: Users },
  { href: "/super/crm/pipeline", label: "Pipeline BTOB", icon: Kanban, match: "/super/crm/pipeline", featured: true },
  { href: "/super/crm/pipeline?type=btoc", label: "Pipeline BTOC", icon: ShoppingBag },
  { href: "/super/crm/onboarding", label: "Onboarding clients", icon: Rocket },
  { href: "/super/crm/validators", label: "Validateurs", icon: ShieldCheck },
  { href: "/super/organisations", label: "Organisations", icon: Building2 },
  { href: "/super/utilisateurs?role=instructor", label: "Formateurs", icon: GraduationCap },
  { href: "/super/utilisateurs?role=learner", label: "Apprenants", icon: UserCircle },
  { href: "/super/utilisateurs?role=tutor", label: "Tuteurs", icon: UserCheck },
  { href: "/super/utilisateurs?role=btoc", label: "B2C", icon: ShoppingBag },
  { href: "/super/crm/emails", label: "Emails (Resend)", icon: Mail },
];

export function CrmSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  const supabase = useSupabase();
  const [userEmail, setUserEmail] = useState<string | null>(null);

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
    if (!isJerome) return CRM_LINKS;
    return CRM_LINKS.filter((l) => {
      if (l.href === "/super/crm/validators") return false;
      if (l.href === "/super/utilisateurs?role=tutor") return false;
      if (l.href.includes("/super/crm/pipeline?type=btoc")) return false;
      return true;
    });
  }, [isJerome]);

  return (
    <aside className="w-56 shrink-0 border-r border-gray-200 bg-gray-50/90 min-h-[calc(100vh-3rem)]">
      <div className="sticky top-12 p-4 space-y-1">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">CRM</p>
        {links.map((item) => {
          const Icon = item.icon;
          const isPipelineBtoc = item.href.includes("type=btoc");
          const isPipelineBtob = item.label === "Pipeline BTOB";
          let isActive = pathname === item.href.split("?")[0];
          if (isPipelineBtoc) {
            isActive = pathname === "/super/crm/pipeline" && typeParam === "btoc";
          } else if (isPipelineBtob) {
            isActive = pathname === "/super/crm/pipeline" && typeParam !== "btoc";
          } else if (item.href.includes("?role=")) {
            isActive =
              pathname === "/super/utilisateurs" &&
              searchParams.get("role") === item.href.split("role=")[1];
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                isActive
                  ? item.featured
                    ? "bg-indigo-600 text-white shadow-sm border border-indigo-600"
                    : "bg-white text-gray-900 shadow-sm border border-gray-200"
                  : item.featured
                    ? "text-indigo-700 hover:bg-indigo-50 hover:text-indigo-900 border border-transparent"
                    : "text-gray-600 hover:bg-white/80 hover:text-gray-900",
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isActive && item.featured ? "opacity-100" : "opacity-70")} />
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
    </aside>
  );
}
