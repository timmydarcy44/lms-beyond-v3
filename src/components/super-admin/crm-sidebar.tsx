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
  Handshake,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSupabase } from "@/components/providers/supabase-provider";
import { isPipelinePrescripteurUser } from "@/lib/crm/pipeline-prescripteur-access";

const CRM_LINKS = [
  { href: "/super/utilisateurs", label: "Contacts", icon: Users },
  { href: "/super/crm/pipeline", label: "Pipeline BTOB", icon: Kanban, match: "/super/crm/pipeline", featured: true },
  { href: "/super/crm/pipeline/prescripteurs", label: "Prescripteur", icon: Handshake, nested: true, prescripteurOnly: true },
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

  return (
    <aside className="w-full shrink-0 border-b border-gray-200 bg-gray-50/90 lg:w-56 lg:border-b-0 lg:border-r lg:min-h-[calc(100vh-3rem)]">
      <div className="sticky top-12 p-2 lg:p-4">
        <p className="hidden px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 lg:block">CRM</p>
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:block lg:space-y-1 lg:overflow-visible lg:px-0 lg:pb-0">
        {links.map((item) => {
          const Icon = item.icon;
          const isPipelineBtoc = item.href.includes("type=btoc");
          const isPipelineBtob = item.label === "Pipeline BTOB";
          const isPrescripteur = item.href === "/super/crm/pipeline/prescripteurs";
          let isActive = pathname === item.href.split("?")[0];
          if (isPipelineBtoc) {
            isActive = pathname === "/super/crm/pipeline" && typeParam === "btoc";
          } else if (isPipelineBtob) {
            isActive = pathname === "/super/crm/pipeline" && typeParam !== "btoc";
          } else if (isPrescripteur) {
            isActive = pathname.startsWith("/super/crm/pipeline/prescripteurs");
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
                "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors lg:shrink lg:w-full",
                item.nested ? "ml-4 lg:ml-2 lg:border-l-2 lg:border-indigo-100 lg:pl-4" : "",
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
      </div>
    </aside>
  );
}
