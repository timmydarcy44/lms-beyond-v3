"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, GraduationCap, Brain, Sparkles, UserCircle, LogIn } from "lucide-react";

const ITEMS = [
  { label: "Accueil", href: "/particuliers", icon: Home },
  { label: "Test IDMC", href: "/particuliers/test-idmc", icon: Brain },
  { label: "Soft Skills", href: "/particuliers/soft-skills", icon: Sparkles },
  { label: "Test DISC", href: "/particuliers/disc-test", icon: GraduationCap },
  { label: "Carrière", href: "/particuliers/carriere", icon: UserCircle },
  { label: "Connexion", href: "/particuliers/login", icon: LogIn },
];

export function ParticuliersSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-60 flex-col bg-transparent px-4 py-6 lg:flex">
      <div className="relative flex h-full flex-col overflow-hidden rounded-[32px] border border-white/15 bg-white/15 px-4 py-4 backdrop-blur-3xl shadow-[0_24px_70px_rgba(0,0,0,0.55)] ring-1 ring-white/10">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent" />
        <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[12px] font-black tracking-[0.35em] text-white">
          BEYOND
        </div>
        <nav className="mt-6 flex flex-1 flex-col gap-2 text-[13px] text-white/70">
          {ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition ${
                  isActive
                    ? "bg-white/20 text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
                    : "hover:bg-white/15"
                }`}
              >
                <item.icon className="h-4 w-4 text-white/70" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
