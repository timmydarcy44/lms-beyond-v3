"use client";

import { BookOpen, CheckSquare, HardDrive, Layers, MessageCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const Sidebar = () => {
  const pathname = usePathname() ?? "/";
  /** Espace org (/g/…/dashboard/…) : remonter légèrement toute la barre (ex. Playmakers / formations). */
  const isOrgLearnerFormations = /^\/g\/[^/]+\/dashboard\/student\/learning\/formations/.test(pathname);

  const navItems = [
    { label: "Formations", href: "/dashboard/student/learning/formations", icon: BookOpen },
    { label: "Parcours", href: "/dashboard/student/learning/parcours", icon: Layers },
    { label: "Exercices", href: "/dashboard/student/learning/exercices", icon: CheckSquare },
    { label: "Ressources", href: "/dashboard/student/learning/ressources", icon: HardDrive },
    { label: "Connect", href: "/dashboard/student/learning/beyond-connect", icon: MessageCircle },
  ];

  return (
    <aside
      className={cn(
        "fixed left-6 z-[100] w-[70px] border-0 bg-transparent pointer-events-none",
        "flex items-center justify-center",
        isOrgLearnerFormations
          ? "top-[116px] h-[calc(100vh-116px)]"
          : "top-[140px] h-[calc(100vh-140px)]",
      )}
    >
      <div className={cn(
        "flex h-full w-full max-h-full flex-col items-center justify-center py-12",
        "pointer-events-auto shadow-2xl rounded-[32px] overflow-hidden",
        // EFFET GLASSMORPHISM :
        // bg-black/40 : fond noir très transparent
        // backdrop-blur-xl : flou intense de ce qui se trouve derrière
        // border-white/10 : bordure légère pour définir la forme
        "bg-black/40 backdrop-blur-xl border border-white/10"
      )}>
        
        {/* Navigation centrée */}
        <nav className="flex w-full flex-col items-center gap-8">
          {navItems.map((item) => {
            const isActive = pathname.includes(item.href);
            return (
              <Link key={item.href} href={item.href} title={item.label} className="relative flex items-center justify-center w-full">
                <div className={cn(
                  "flex items-center justify-center rounded-2xl w-11 h-11 transition-all duration-300",
                  isActive 
                    ? "bg-white text-black scale-110 shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
                    : "text-zinc-400 hover:text-white hover:bg-white/10"
                )}>
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                </div>
                
                {isActive && (
                  <div className="absolute left-0 h-4 w-[2px] bg-white rounded-r-full shadow-[0_0_8px_white]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};