"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BookOpen,
  CheckSquare,
  ClipboardCheck,
  FolderOpen,
  HardDrive,
  Home,
  Layers,
  MessageCircle,
  Search,
} from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { resolveLearnerDisplayFirstName } from "@/lib/apprenant/display-first-name";

const sidebarItems = [
  { label: "Accueil", href: "/dashboard/formateur", icon: Home },
  { label: "Formations", href: "/dashboard/formateur/formations", icon: BookOpen },
  { label: "Parcours", href: "/dashboard/formateur/parcours", icon: Layers },
  { label: "Ressources", href: "/dashboard/formateur/ressources", icon: FolderOpen },
  { label: "Drive", href: "/dashboard/formateur/drive", icon: HardDrive },
  { label: "Tests", href: "/dashboard/formateur/tests", icon: ClipboardCheck },
  { label: "To-Do", href: "/dashboard/formateur/todo", icon: CheckSquare },
  { label: "Messages", href: "/dashboard/student/community", icon: MessageCircle },
];

type FormateurSidebarProps = {
  activeItem?: string;
};

export function FormateurSidebar({ activeItem }: FormateurSidebarProps) {
  const [initials, setInitials] = useState("?");
  const [displayName, setDisplayName] = useState("Formateur");

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id || ignore) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, full_name, email")
        .eq("id", user.id)
        .maybeSingle();

      const firstName = resolveLearnerDisplayFirstName({
        profileFirstName: profile?.first_name,
        email: profile?.email ?? user.email,
      });
      const lastName = String(profile?.last_name ?? "").trim();
      const fullName = String(profile?.full_name ?? "").trim();
      const name =
        firstName ||
        fullName.split(/\s+/)[0] ||
        String(user.email ?? "Formateur").split("@")[0] ||
        "Formateur";

      const letterSource = firstName || lastName || fullName || user.email || "?";
      const letters = letterSource
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");

      if (!ignore) {
        setDisplayName(name);
        setInitials(letters || "?");
      }
    };
    void load();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <aside className="fixed left-4 top-4 bottom-4 z-50 flex w-[220px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/50 backdrop-blur-2xl">
      <div className="px-5 pt-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white">
            {initials}
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{displayName}</div>
            <div className="text-xs text-white/60">Formateur</div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm text-white/70">
          <Search className="h-4 w-4 text-white/50" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="w-full bg-transparent text-sm text-white/80 outline-none placeholder:text-white/40"
          />
        </div>
      </div>
      <nav className="mt-5 flex flex-1 flex-col gap-2 px-3">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.label === activeItem;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                isActive
                  ? "bg-white/25 font-semibold text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-5 pb-5">
        <div className="mb-4 h-px w-full bg-white/10" />
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Espace formateur</div>
        <div className="mt-3 text-sm text-white/60">Contenus de votre organisation uniquement.</div>
      </div>
    </aside>
  );
}
