"use client";
import Link from "next/link";
import { useState } from "react";
import { LayoutDashboard, BookOpen, Users, Layers, FileStack, FlaskConical, Settings, LogOut } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter, usePathname } from "next/navigation";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();
  const pathname = usePathname();

  const items = [
    { href: "/dashboard", label: "Accueil", icon: LayoutDashboard },
    { href: "/formations", label: "Formations", icon: BookOpen },
    { href: "/groupes", label: "Groupes", icon: Users },
    { href: "/parcours", label: "Parcours", icon: Layers },
    { href: "/ressources", label: "Ressources", icon: FileStack },
    { href: "/tests", label: "Tests", icon: FlaskConical },
    { href: "/parametres", label: "Paramètres", icon: Settings },
  ];

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <aside
      className={`sticky top-0 h-screen border-r border-white/5 bg-[#0d0f14] transition-all ${collapsed ? "w-[72px]" : "w-[240px]"}`}
    >
      <div className="flex items-center justify-between px-3 h-14">
        <span className={`text-white/90 font-semibold tracking-wide ${collapsed ? "opacity-0 w-0" : "opacity-100"}`}>LMS</span>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="text-white/60 hover:text-white/90 p-2 rounded-lg"
          aria-label="Collapse sidebar"
        >
          {collapsed ? "›" : "‹"}
        </button>
      </div>

      <nav className="mt-2 space-y-1 px-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 h-10 text-sm
                ${active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"}
              `}
            >
              <Icon size={18} />
              <span className={`${collapsed ? "hidden" : "block"}`}>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-3 left-0 right-0 px-2">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 rounded-xl px-3 h-10 text-sm text-white/70 hover:text-white hover:bg-white/5"
        >
          <LogOut size={18} />
          <span className={`${collapsed ? "hidden" : "block"}`}>Se déconnecter</span>
        </button>
      </div>
    </aside>
  );
}



