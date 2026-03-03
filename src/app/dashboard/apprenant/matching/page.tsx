"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  BookOpen,
  Briefcase,
  Building2,
  Home,
  Lock,
  Sparkles,
  UserCircle,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type JobOffer = {
  id: string;
  title?: string | null;
  city?: string | null;
  contract_type?: string | null;
  salary_range?: string | null;
  description?: string | null;
};

const NAV_ITEMS = [
  { label: "Tableau de bord", href: "/dashboard/apprenant", icon: Home },
  { label: "Mes résultats", href: "/dashboard/apprenant/results", icon: Award },
  { label: "Mon coach", href: "/dashboard/apprenant/coach", icon: UserCircle },
  { label: "Mes badges", href: "/dashboard/apprenant/badges", icon: Sparkles },
  { label: "Mes matching", href: "/dashboard/apprenant/matching", icon: Briefcase },
  { label: "Carrière", href: "/dashboard/apprenant/career", icon: BookOpen },
];

export default function ApprenantMatchingPage() {
  const supabase = createSupabaseBrowserClient();
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [hasOrganisation, setHasOrganisation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user?.id) {
        setIsLoading(false);
        return;
      }

      const userId = userData.user.id;
      const userEmail = userData.user.email ?? "";

      try {
        let { data: profileData } = await supabase
          .from("profiles")
          .select("entreprise_id, school_id")
          .eq("id", userId)
          .maybeSingle();

        if (!profileData && userEmail) {
          const { data: legacyProfileData } = await supabase
            .from("profiles")
            .select("entreprise_id, school_id")
            .eq("email", userEmail)
            .maybeSingle();
          profileData = legacyProfileData ?? null;
        }

        setHasOrganisation(Boolean(profileData?.entreprise_id || profileData?.school_id));
      } catch {
        setHasOrganisation(false);
      }

      try {
        const { data: offersData } = await supabase
          .from("job_offers")
          .select("id, title, city, contract_type, salary_range, description")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(12);

        setOffers(offersData ?? []);
      } catch {
        setOffers([]);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [supabase]);

  const navItems = useMemo(() => {
    const items = [...NAV_ITEMS];
    if (hasOrganisation) {
      items.splice(5, 0, {
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

        <main className="flex-1 overflow-y-auto px-6 py-10 lg:px-12">
          <div className="mb-8">
            <div className="text-[12px] uppercase tracking-[0.3em] text-white/50">Mes matchings</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Offres recommandees
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-white/65">
              Cette section montre les opportunites disponibles, mais le detail est reserve aux profils
              verifies via centre de formation ou abonnement particulier.
            </p>
          </div>

          <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
            <div className="pointer-events-none select-none blur-[6px] opacity-75">
              {isLoading ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={`matching-skeleton-${index}`}
                      className="h-44 rounded-2xl border border-white/10 bg-white/10"
                    />
                  ))}
                </div>
              ) : offers.length ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {offers.map((offer) => (
                    <article
                      key={offer.id}
                      className="rounded-2xl border border-white/10 bg-black/35 p-5"
                    >
                      <div className="text-base font-semibold text-white">
                        {offer.title || "Offre en recrutement"}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/70">
                        <span className="rounded-full border border-white/20 px-2.5 py-1">
                          {offer.contract_type || "Contrat"}
                        </span>
                        <span>{offer.city || "Localisation"}</span>
                      </div>
                      <div className="mt-3 text-xs text-white/60">{offer.salary_range || "Salaire selon profil"}</div>
                      <p className="mt-4 line-clamp-3 text-sm text-white/60">
                        {offer.description || "Description non disponible."}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-8 text-center text-sm text-white/60">
                  Aucune offre active pour le moment.
                </div>
              )}
            </div>

            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="w-full max-w-3xl rounded-3xl border border-white/20 bg-slate-950/90 p-6 text-center shadow-[0_25px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-8">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10">
                  <Lock className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-white md:text-2xl">
                  Debloquez vos matchings complets
                </h2>
                <p className="mt-3 text-sm text-white/70 md:text-base">
                  Vous etes alternant avec une ecole ? Faites la demande a votre centre pour activer
                  votre acces. Vous etes particulier ? La fonctionnalite sera bientot disponible.
                </p>
                <div className="mt-6 flex flex-col gap-3 md:flex-row md:justify-center">
                  <Link
                    href="/dashboard/apprenant/entreprise"
                    className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20"
                  >
                    Je passe par mon centre
                  </Link>
                  <span className="inline-flex items-center justify-center rounded-full border border-[#F59E0B]/50 bg-[#F59E0B]/20 px-5 py-2.5 text-sm font-semibold text-[#FDE68A]">
                    Particuliers : bientot disponible
                  </span>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
