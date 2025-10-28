"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { House, BookOpen, Users, Route as RouteIcon, Folder, FlaskConical, Settings, LogOut, ChevronsLeft, ChevronsRight } from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Accueil", icon: House },
  { href: "/formations", label: "Formations", icon: BookOpen },
  { href: "/groupes", label: "Groupes", icon: Users },
  { href: "/parcours", label: "Parcours", icon: RouteIcon },
  { href: "/ressources", label: "Ressources", icon: Folder },
  { href: "/tests", label: "Tests", icon: FlaskConical },
  { href: "/parametres", label: "Paramètres", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const sb = createClientComponentClient();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem("lms.sidebar.collapsed") === "1");
  }, []);

  const toggle = () => {
    const v = !collapsed;
    setCollapsed(v);
    localStorage.setItem("lms.sidebar.collapsed", v ? "1" : "0");
  };

  async function logout() {
    await sb.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className={`sticky top-0 h-[100dvh] bg-[#0d1117] border-r border-white/10 transition-all ${collapsed ? "w-[72px]" : "w-[240px]"} flex flex-col`}>
      <div className="flex items-center justify-between px-3 py-3">
        <div className="text-lg font-semibold">{collapsed ? "L" : "LMS"}</div>
        <button onClick={toggle} className="p-2 rounded hover:bg-white/10">
          {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
        </button>
      </div>
      <nav className="flex-1 px-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href} title={label}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 mb-1 hover:bg-white/10 ${active ? "bg-white/10" : ""}`}>
              <Icon size={18} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="p-2">
        <button onClick={logout} className="w-full flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/10">
          <LogOut size={18} />
          {!collapsed && <span>Se déconnecter</span>}
        </button>
      </div>
    </aside>
  );
}
