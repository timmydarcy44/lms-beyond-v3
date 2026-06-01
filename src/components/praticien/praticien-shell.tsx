"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Home,
  Loader2,
  Settings,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PraticienProvider, usePraticien } from "@/components/praticien/praticien-context";

const NAV = [
  { href: "/dashboard/praticien", label: "Tableau de bord", icon: Home },
  { href: "/dashboard/praticien/agenda", label: "Agenda", icon: Calendar },
  { href: "/dashboard/praticien/rendez-vous", label: "Mes rendez-vous", icon: Users },
  { href: "/dashboard/praticien/revenus", label: "Revenus", icon: Wallet },
  { href: "/dashboard/praticien/profil", label: "Mon profil", icon: User },
  { href: "/dashboard/praticien/parametres", label: "Paramètres", icon: Settings },
] as const;

const MOBILE_NAV = NAV.filter((n) =>
  ["/dashboard/praticien", "/dashboard/praticien/agenda", "/dashboard/praticien/rendez-vous", "/dashboard/praticien/revenus", "/dashboard/praticien/profil"].includes(
    n.href,
  ),
);

function Sidebar() {
  const pathname = usePathname();
  const { praticien, loading } = usePraticien();
  const initials = praticien
    ? `${praticien.prenom.charAt(0)}${praticien.nom.charAt(0)}`.toUpperCase()
    : "?";

  return (
    <aside className="hidden w-[240px] shrink-0 flex-col border-r border-white/10 bg-[#0f1117] lg:flex">
      <div className="border-b border-white/10 px-5 py-6">
        <p className="text-xs font-bold tracking-[0.28em] text-violet-400">BEYOND</p>
        <p className="mt-1 text-[10px] uppercase tracking-widest text-slate-500">EDGE · Praticien BCT</p>
      </div>
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
        {praticien?.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={praticien.photo_url} alt="" className="h-11 w-11 rounded-xl object-cover" />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600/40 text-sm font-bold">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {loading ? "…" : `${praticien?.prenom ?? ""} ${praticien?.nom ?? ""}`}
          </p>
          {praticien?.bct_certified && (
            <span className="mt-1 inline-block rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
              BCT Certifié
            </span>
          )}
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const active =
            pathname === item.href || (item.href !== "/dashboard/praticien" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active ? "bg-violet-600/25 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-white/10 bg-[#0f1117] lg:hidden">
      {MOBILE_NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px]",
              active ? "text-violet-400" : "text-slate-500",
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="truncate px-1">{item.label.split(" ")[0]}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function ShellBody({ children }: { children: React.ReactNode }) {
  const { loading, error, refresh, praticien } = usePraticien();

  if (loading && !praticien && !error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-red-400">{error}</p>
        <button type="button" className="rounded-lg bg-violet-600 px-4 py-2 text-sm" onClick={() => void refresh()}>
          Réessayer
        </button>
      </div>
    );
  }

  return <div className="flex-1 overflow-y-auto pb-20 lg:pb-8">{children}</div>;
}

export function PraticienShell({ children }: { children: React.ReactNode }) {
  return (
    <PraticienProvider>
      <div className="flex min-h-screen bg-[#12141c] text-white">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <ShellBody>{children}</ShellBody>
        </div>
        <MobileNav />
      </div>
    </PraticienProvider>
  );
}
