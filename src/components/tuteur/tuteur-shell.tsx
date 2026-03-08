"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  ListChecks,
  CheckSquare,
  MessageCircle,
  UserCircle,
} from "lucide-react";

type Props = {
  children: ReactNode;
  tutorName: string;
};

const navItems = [
  { label: "Tableau de bord", href: "/dashboard/tuteur", icon: LayoutDashboard },
  { label: "Mes alternants", href: "/dashboard/tuteur/alternants", icon: Users },
  { label: "Missions à valider", href: "/dashboard/tuteur/missions", icon: ListChecks },
  { label: "Évaluations", href: "/dashboard/tuteur/formulaires", icon: ClipboardList },
  { label: "To-Do", href: "/dashboard/tuteur/todo", icon: CheckSquare },
  { label: "Messagerie", href: "/dashboard/student/community", icon: MessageCircle },
];

export function TuteurShell({ children, tutorName }: Props) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex">
      <aside className="hidden lg:flex w-[260px] flex-col border-r border-gray-100 bg-white">
        <div className="px-6 py-6">
          <div className="text-sm font-bold tracking-[0.28em] text-gray-900">BEYOND</div>
          <div className="text-xs text-gray-400 mt-1">Espace Tuteur</div>
        </div>
        <div className="border-t border-gray-100 mx-6" />
        <nav className="mt-4 space-y-1 px-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition ${
                  isActive
                    ? "bg-gray-100 text-gray-900 font-medium"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
              <UserCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">{tutorName}</div>
              <div className="text-xs text-gray-400">Mon compte</div>
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
