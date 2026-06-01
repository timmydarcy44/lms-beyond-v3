"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
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

const CRM_LINKS = [
  { href: "/super/utilisateurs", label: "Contacts", icon: Users },
  { href: "/super/crm/pipeline", label: "Pipeline BTOB", icon: Kanban, match: "/super/crm/pipeline" },
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

  return (
    <aside className="w-56 shrink-0 border-r border-gray-200 bg-gray-50/90 min-h-[calc(100vh-3rem)]">
      <div className="sticky top-12 p-4 space-y-1">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">CRM</p>
        {CRM_LINKS.map((item) => {
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
                  ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                  : "text-gray-600 hover:bg-white/80 hover:text-gray-900",
              )}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-70" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
