"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Award, BookOpen, Building2, Home, Sparkles, UserCircle } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  AxisKey,
  IdmcRadarChart,
  resolveIdmcAxes,
} from "@/components/idmc/IdmcRadarChart";

type IdmcData = {
  scores?: Record<string, unknown> | null;
  responses?: Record<string, unknown> | null;
  global_score?: number | null;
  level?: string | null;
} | null;

const NAV_ITEMS = [
  { label: "Tableau de bord", href: "/dashboard/apprenant", icon: Home },
  { label: "Mes résultats", href: "/dashboard/apprenant/results", icon: Award },
  { label: "Mon coach", href: "/dashboard/apprenant/coach", icon: UserCircle },
  { label: "Mes badges", href: "/dashboard/apprenant/badges", icon: Sparkles },
  { label: "Carrière", href: "/dashboard/apprenant/career", icon: BookOpen },
];

export default function ApprenantResultsPage() {
  const supabase = createSupabaseBrowserClient();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const [profile, setProfile] = useState<{
    first_name?: string | null;
    entreprise_id?: string | null;
    school_id?: string | null;
  } | null>(null);
  const [idmcData, setIdmcData] = useState<IdmcData>(null);
  const [idmcAxes, setIdmcAxes] = useState<Record<AxisKey, number> | null>(null);

  const hasOrganisation = Boolean(profile?.entreprise_id || profile?.school_id);
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

  useEffect(() => {
    const load = async () => {
      if (!supabase) return;
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user?.id) return;
      const userId = userData.user.id;
      const profileIdsToQuery = [userId];

      try {
        let { data: profileData } = await supabase
          .from("profiles")
          .select("id, first_name, entreprise_id, school_id")
          .eq("id", userId)
          .maybeSingle();
        if (!profileData && userData.user.email) {
          const { data: legacyProfileData } = await supabase
            .from("profiles")
            .select("id, first_name, entreprise_id, school_id")
            .eq("email", userData.user.email)
            .maybeSingle();
          profileData = legacyProfileData ?? null;
        }
        const resolvedProfileId =
          profileData && typeof (profileData as Record<string, unknown>).id === "string"
            ? String((profileData as Record<string, unknown>).id)
            : null;
        if (resolvedProfileId && resolvedProfileId !== userId) {
          profileIdsToQuery.push(resolvedProfileId);
        }
        setProfile(profileData ?? null);
      } catch {
        setProfile(null);
      }

      try {
        let idmcResult: {
          responses?: Record<string, unknown> | null;
          scores?: Record<string, unknown> | null;
          global_score?: number | null;
          level?: string | null;
        } | null = null;
        for (const candidateId of profileIdsToQuery) {
          const { data, error } = await supabase
            .from("idmc_resultats")
            .select("responses, scores, global_score, level")
            .eq("profile_id", candidateId)
            .maybeSingle();
          if (error) {
            console.error("[idmc] idmc_resultats error:", error);
            continue;
          }
          if (data) {
            idmcResult = data as {
              responses?: Record<string, unknown> | null;
              scores?: Record<string, unknown> | null;
              global_score?: number | null;
              level?: string | null;
            };
            break;
          }
        }
        console.log("Données IDMC chargées pour:", userId, idmcResult);
        setIdmcData(idmcResult ?? null);
        const axes = resolveIdmcAxes(idmcResult?.scores ?? idmcResult?.responses);
        setIdmcAxes(axes);
      } catch {
        setIdmcData(null);
        setIdmcAxes(null);
      }
    };
    load();
  }, [supabase]);

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
        >
          <div className="mb-8">
            <div className="text-[12px] uppercase tracking-[0.3em] text-white/50">Mes résultats</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {profile?.first_name ? `Bonjour ${profile.first_name}` : "Bonjour !"}
            </h1>
          </div>

          {idmcData && idmcAxes ? (
            <div className="space-y-6">
              <IdmcRadarChart scores={idmcAxes} title="Spider Chart IDMC" />
              <div className="rounded-2xl border border-white/10 bg-slate-900 p-5 text-sm text-white/70">
                <div>Score global : {idmcData?.global_score ?? "--"}%</div>
                <div>Niveau : {idmcData?.level ?? "--"}</div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
              <div className="text-sm text-white/70">
                Aucune donnée IDMC trouvée pour le moment.
              </div>
              <Link
                href="/particuliers/test-idmc/"
                className="mt-4 inline-flex rounded-full bg-[#F59E0B] px-4 py-2 text-xs font-semibold text-black"
              >
                Commencer le test
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
