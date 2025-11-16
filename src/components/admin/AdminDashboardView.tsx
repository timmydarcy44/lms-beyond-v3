"use client";

import { QuickCreateSlider } from "@/components/admin/QuickCreateSlider";
import { KPIGrid, type KpiCard } from "@/components/admin/KPIGrid";
import { ActivityFeed, type ActivityFeedItem } from "@/components/admin/ActivityFeed";
import { TasksBanner } from "@/components/dashboard/tasks-banner";
import { MessageCircle, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type AdminDashboardViewProps = {
  kpis: KpiCard[];
  quickItems: Parameters<typeof QuickCreateSlider>[0]["items"];
  activity: ActivityFeedItem[];
  firstName?: string | null;
  email?: string | null;
};

export const AdminDashboardView = ({ kpis, quickItems, activity, firstName, email }: AdminDashboardViewProps) => {
  // Utiliser une fonction locale pour extraire le prénom
  const getFirstNameLocal = (fullName: string | null | undefined, email: string | null | undefined): string => {
    if (fullName) {
      const firstName = fullName.trim().split(/\s+/)[0];
      if (firstName) {
        return firstName;
      }
    }
    if (email) {
      const emailPart = email.split("@")[0];
      return emailPart.split(/[._]/)[0];
    }
    return "Admin";
  };

  const firstNameDisplay = getFirstNameLocal(firstName, email);
  const greetingTitle = firstName ? `Bonjour ${firstNameDisplay}` : "Admin Dashboard";
  return (
    <div className="relative flex min-h-screen overflow-x-hidden text-white w-full" style={{ backgroundColor: 'transparent' }}>
      <div className="flex-1 w-full">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-transparent px-5 py-5 backdrop-blur-sm lg:px-8" style={{ border: 'none', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="flex items-center gap-3 lg:hidden">
            <div>
              <h1 className="text-xl font-semibold">{greetingTitle}</h1>
              <p className="text-xs text-white/60">Pilotage global</p>
            </div>
          </div>
          <div className="hidden lg:block">
            <h1 className="text-2xl font-semibold">{greetingTitle}</h1>
            <p className="text-sm text-white/60">Supervisez vos formations et vos communautés.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/10/90 px-4 py-2 text-sm text-white/80 backdrop-blur lg:flex">
              <span className="rounded-full bg-gradient-to-tr from-fuchsia-400/30 to-sky-400/40 px-2 py-1 text-xs text-white/90">🔍</span>
              <input
                type="text"
                placeholder="Rechercher…"
                className="w-48 bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
              />
            </div>
            <Link
              href="/dashboard/communaute"
              className="flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#8E2DE2,#4A00E0)] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_45px_rgba(78,0,224,0.35)] transition hover:scale-105"
            >
              <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/25 text-white">
                <MessageCircle className="h-4 w-4" />
                <span className="absolute -right-1 -top-1 inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Messagerie
            </Link>
            <Link
              href="/admin"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Paramètres"
            >
              <Settings className="h-5 w-5" />
            </Link>
          </div>
        </header>
        <main className="space-y-14 px-5 py-10 lg:px-8 w-full max-w-7xl mx-auto overflow-x-hidden">
          <TasksBanner roleFilter="admin" todoHref="/admin/todo" />
          
          <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#18181b]/90 via-[#11111f]/90 to-[#050505]/80 px-7 py-9 shadow-[0_40px_120px_rgba(59,130,246,0.15)] lg:px-10 lg:py-12">
            <div className="pointer-events-none absolute -left-28 -top-32 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.45),_transparent_70%)] blur-3xl" />
            <div className="pointer-events-none absolute -right-24 bottom-[-160px] h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,_rgba(244,114,182,0.35),_transparent_65%)] blur-3xl" />
            <div className="max-w-xl space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300/90">Pilotage global</p>
              <h2 className="text-3xl font-semibold leading-tight md:text-[34px]">Suivez les performances de vos formations en un coup d'œil.</h2>
              <p className="text-sm text-white/75">
                Déployez de nouveaux parcours, invitez vos formateurs et mesurez l'impact de vos programmes.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button className="rounded-full bg-[linear-gradient(135deg,#8E2DE2,#4A00E0)] px-5 py-2 text-sm font-semibold text-white shadow-[0_12px_45px_rgba(78,0,224,0.35)] transition hover:scale-105">
                  Voir tout
                </button>
                <button className="rounded-full border border-white/40 px-5 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10">
                  Rapports
                </button>
              </div>
            </div>
            <div className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 overflow-hidden rounded-3xl lg:block">
              <Image
                src="https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=900&q=80"
                alt="Admin analytics"
                width={360}
                height={240}
                className="opacity-90 saturate-125"
              />
            </div>
          </section>

          <QuickCreateSlider items={quickItems} />

          <KPIGrid kpis={kpis} />

          <ActivityFeed items={activity} />
        </main>
      </div>
    </div>
  );
};


