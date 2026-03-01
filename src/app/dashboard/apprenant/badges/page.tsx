"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Award, BookOpen, Building2, Home, Sparkles, UserCircle } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { label: "Tableau de bord", href: "/dashboard/apprenant", icon: Home },
  { label: "Mes résultats", href: "/dashboard/apprenant/results", icon: Award },
  { label: "Mon coach", href: "/dashboard/apprenant/coach", icon: UserCircle },
  { label: "Mes badges", href: "/dashboard/apprenant/badges", icon: Sparkles },
  { label: "Carrière", href: "/dashboard/apprenant/career", icon: BookOpen },
];

const badgeCategories = [
  { title: "Tech", count: "3 badges", color: "bg-[#1E293B]" },
  { title: "Business", count: "7 badges", color: "bg-[#0F766E]" },
  { title: "Design", count: "5 badges", color: "bg-[#7C3AED]" },
  { title: "Soft Skills", count: "9 badges", color: "bg-[#F59E0B]" },
];

const techBadges = [
  {
    title: "IA Lvl 1",
    status: "Obtenu",
    accent: "text-emerald-200",
    badge: "bg-emerald-500/20",
    image:
      "/uploads/openbadges/6f863ff8-2ba4-408b-87b4-bc6a481eadae-1769415592064-20260126_0846_image-generation_remix_01kfwm7ajjecmtt88qza2t6cjr.png",
  },
  {
    title: "Automatisation Lvl 1",
    status: "Obtenu",
    accent: "text-yellow-200",
    badge: "bg-yellow-500/20",
    image:
      "/uploads/openbadges/81f19902-bc19-4cd2-a232-205c1c57e75d-1769416377419-20260126_0846_image-generation_remix_01kfwm7ajjecmtt88qza2t6cjr.png",
  },
  {
    title: "Prompting Master",
    status: "À obtenir",
    accent: "text-white/70",
    badge: "bg-white/10",
    image:
      "/uploads/openbadges/8c295fb0-abdb-4b6b-a0dc-95758e535166-1769374717892-20260125_2106_image-generation_remix_01kfvc6p6mfqsrr4eggq250396.png",
  },
];

export default function ApprenantBadgesPage() {
  const supabase = createSupabaseBrowserClient();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const [hasOrganisation, setHasOrganisation] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!supabase) return;
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user?.id) return;
      const userId = userData.user.id;
      const { data: profileData } = await supabase
        .from("profiles")
        .select("entreprise_id, school_id")
        .eq("id", userId)
        .maybeSingle();
      setHasOrganisation(Boolean(profileData?.entreprise_id || profileData?.school_id));
    };
    load();
  }, [supabase]);

  const navItems = useMemo(() => {
    const items = [...NAV_ITEMS];
    if (hasOrganisation) {
      items.splice(4, 0, {
        label: "Mon entreprise",
        href: "/dashboard/apprenant/entreprise",
        icon: Building2,
      });
    }
    return items;
  }, [hasOrganisation]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap");
      `}</style>
      <div className="flex h-screen overflow-hidden font-['Inter']">
        <aside
          className={`sticky left-0 top-0 hidden h-screen flex-col bg-transparent py-4 transition-all lg:flex ${
            isSidebarCollapsed ? "w-20 px-3" : "w-64 px-4"
          }`}
          style={{ zIndex: 20 }}
        >
          <div className="relative flex h-full flex-col overflow-hidden rounded-[32px] border border-white/15 bg-white/15 px-3 py-4 backdrop-blur-3xl shadow-[0_24px_70px_rgba(0,0,0,0.55)] ring-1 ring-white/10">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent" />
            <div className="relative flex items-center rounded-2xl border border-white/10 bg-white/10 px-3 py-2 overflow-visible">
            <div
              className={`text-[12px] font-black tracking-[0.35em] text-white ${
                isSidebarCollapsed ? "opacity-0" : "opacity-100"
              }`}
            >
              BEYOND
            </div>
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className="absolute right-2 top-1/2 z-10 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white/90 hover:bg-white/30"
            >
              {isSidebarCollapsed ? "›" : "‹"}
            </button>
          </div>
          <div className="mt-6 flex flex-col gap-2 text-[13px] text-white/70">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                  pathname === item.href
                    ? "bg-white/20 text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
                    : "hover:bg-white/15"
                }`}
              >
                <item.icon className="h-4 w-4 text-white/60" />
                <span className={`${isSidebarCollapsed ? "hidden" : "block"}`}>{item.label}</span>
              </Link>
            ))}
          </div>
          </div>
        </aside>

        <main
          className="flex-1 overflow-y-auto px-6 py-10 lg:px-12"
          style={{ marginLeft: isSidebarCollapsed ? "5rem" : "16rem" }}
        >
          <div className="mb-8">
            <div className="text-[12px] uppercase tracking-[0.3em] text-white/50">Mes badges</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              C&apos;est quoi un Open Badge ?
            </h1>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8">
            <div className="absolute inset-0 bg-[url('/uploads/editor/1766949485698-6fac6828-2cc5-4352-9b89-2306e7e38b80.jpeg')] bg-cover bg-center opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
            <div className="relative max-w-xl space-y-4">
              <p className="text-sm text-white/70">
                Un Open Badge certifie vos compétences et votre progression. Il s&apos;affiche
                partout : CV, LinkedIn, candidature.
              </p>
              <Link
                href="/dashboard/apprenant/results"
                className="inline-flex rounded-full bg-white/80 px-4 py-2 text-xs font-semibold text-black"
              >
                Découvrir mes badges
              </Link>
            </div>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {badgeCategories.map((category) => (
              <div
                key={category.title}
                className="rounded-3xl border border-white/10 bg-white/5 p-6"
              >
                <div className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${category.color}`}>
                  {category.title}
                </div>
                <div className="mt-4 text-sm text-white/70">{category.count}</div>
                <div className="mt-6 h-24 rounded-2xl border border-white/10 bg-white/5" />
              </div>
            ))}
          </div>

          <div className="mt-12">
            <div className="text-[12px] uppercase tracking-[0.3em] text-white/50">Catégorie Tech</div>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {techBadges.map((badge) => (
                <div
                  key={badge.title}
                  className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6"
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-40"
                    style={{ backgroundImage: `url('${badge.image}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
                  <div className="relative space-y-3">
                    <div className="text-lg font-semibold text-white">{badge.title}</div>
                    <div
                      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${badge.badge} ${badge.accent}`}
                    >
                      {badge.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
