"use client";
import Link from "next/link";
import { House, BookOpen, Users, Route, Folder, FlaskConical, Settings, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const nav = [
  { href: "/dashboard", label: "Accueil", Icon: House },
  { href: "/formations", label: "Formations", Icon: BookOpen },
  { href: "/groupes", label: "Groupes", Icon: Users },
  { href: "/parcours", label: "Parcours", Icon: Route },
  { href: "/ressources", label: "Ressources", Icon: Folder },
  { href: "/tests", label: "Tests", Icon: FlaskConical },
  { href: "/parametres", label: "Paramètres", Icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Charger l'état depuis localStorage au montage
  useEffect(() => {
    const saved = localStorage.getItem('lms.sidebar.collapsed');
    if (saved !== null) {
      setCollapsed(saved === 'true');
    }
  }, []);

  // Sauvegarder l'état dans localStorage
  function toggleCollapsed() {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('lms.sidebar.collapsed', newState.toString());
  }

  async function logout() {
    await fetch('/api/auth/signout', { method: 'POST' })
    router.replace('/login')
  }

  return (
    <aside 
      className={`sticky top-0 h-screen bg-[#252525] border-r border-white/5 transition-all duration-300 overflow-y-auto ${
        collapsed ? "w-[72px]" : "w-[240px]"
      }`}
    >
      {/* Header avec toggle */}
      <div className="flex items-center justify-between px-3 h-14 border-b border-white/5 bg-[#252525]">
        <span className={`text-xl font-semibold transition-opacity ${collapsed ? "opacity-0" : "opacity-100"}`}>
          LMS
        </span>
        <button 
          onClick={toggleCollapsed}
          className="p-2 rounded hover:bg-white/5 transition-colors"
          aria-label={collapsed ? "Étendre la sidebar" : "Replier la sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="px-2 py-3 space-y-1">
        {nav.map(({href, label, Icon}) => {
          const active = pathname?.startsWith(href);
          return (
            <Link 
              key={href} 
              href={href} 
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors group relative ${
                active ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"
              }`}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              <span className={`transition-opacity ${collapsed ? "opacity-0 absolute" : "opacity-100"}`}>
                {label}
              </span>
              
              {/* Tooltip pour mode collapsed */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-black/80 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bouton de déconnexion - sticky en bas */}
      <div className="sticky bottom-0 w-full px-2 pb-3 bg-[#252525]">
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/5 transition-colors group relative"
          title={collapsed ? "Se déconnecter" : undefined}
        >
          <LogOut size={18} className="flex-shrink-0" />
          <span className={`transition-opacity ${collapsed ? "opacity-0 absolute" : "opacity-100"}`}>
            Se déconnecter
          </span>
          
          {/* Tooltip pour mode collapsed */}
          {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-black/80 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Se déconnecter
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
