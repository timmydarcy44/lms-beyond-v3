"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Talent = {
  id: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  temperament_traits?: string[] | null;
  mobility_national?: boolean;
  is_certified?: boolean;
};

type Company = {
  id: string;
  is_premium?: boolean;
};

type BeyondConnectCompanyDashboardProps = {
  userId: string;
};

const fallbackTalents: Talent[] = [
  {
    id: "talent-1",
    first_name: "Camille",
    last_name: "R.",
    temperament_traits: ["Audace", "Résilience", "Exécution"],
    mobility_national: true,
    is_certified: true,
  },
  {
    id: "talent-2",
    first_name: "Nicolas",
    last_name: "M.",
    temperament_traits: ["Rigueur", "Vision", "Leadership"],
    mobility_national: false,
    is_certified: false,
  },
  {
    id: "talent-3",
    first_name: "Sami",
    last_name: "L.",
    temperament_traits: ["Audace", "Communication", "Agilité"],
    mobility_national: true,
    is_certified: false,
  },
  {
    id: "talent-4",
    first_name: "Alex",
    last_name: "P.",
    temperament_traits: ["Résilience", "Concentration", "Analyse"],
    mobility_national: false,
    is_certified: true,
  },
];

function maskName(name?: string, isClient?: boolean) {
  if (!name) return "Candidat";
  if (isClient) return name;
  return `${name[0]}.`;
}

export function BeyondConnectCompanyDashboard({ userId }: BeyondConnectCompanyDashboardProps) {
  const [talents, setTalents] = useState<Talent[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortByAdn, setSortByAdn] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [talentsRes, companiesRes] = await Promise.all([
          fetch("/api/beyond-connect/talents"),
          fetch("/api/beyond-connect/companies"),
        ]);
        if (talentsRes.ok) {
          const data = await talentsRes.json();
          setTalents(data.talents || []);
        } else {
          setTalents([]);
        }
        if (companiesRes.ok) {
          const data = await companiesRes.json();
          setCompanies(data.companies || []);
        } else {
          setCompanies([]);
        }
      } catch {
        setTalents([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [userId]);

  const isClient = companies.some((company) => company.is_premium);
  const dataSource = talents.length > 0 ? talents : fallbackTalents;

  const sortedTalents = useMemo(() => {
    if (!sortByAdn) return dataSource;
    return [...dataSource].sort((a, b) => {
      const aAudace = (a.temperament_traits || []).join(" ").toLowerCase().includes("aud");
      const bAudace = (b.temperament_traits || []).join(" ").toLowerCase().includes("aud");
      const aScore = (a.mobility_national ? 1 : 0) + (aAudace ? 1 : 0);
      const bScore = (b.mobility_national ? 1 : 0) + (bAudace ? 1 : 0);
      return bScore - aScore;
    });
  }, [sortByAdn, dataSource]);

  const waitingCertification = sortedTalents.filter((talent) => !talent.is_certified);

  return (
    <div className="min-h-screen bg-[#050A18] text-white">
      <div className="flex min-h-screen">
        <aside className="fixed left-0 top-0 h-full w-64 border-r border-white/10 bg-[#050A18] px-6 py-8">
          <div className="text-lg font-bold tracking-tight">BEYOND CONNECT</div>
          <p className="mt-2 text-xs uppercase tracking-[0.4em] text-white/50">Espace entreprise</p>
          <nav className="mt-10 space-y-4 text-xs uppercase tracking-[0.3em] text-white/70">
            <a href="#talents" className="block">
              Talents
            </a>
            <a href="#attente" className="block">
              En attente
            </a>
            <Link href="/beyond-connect-app/companies/jobs" className="block">
              Offres
            </Link>
          </nav>
        </aside>

        <main className="ml-64 flex-1 overflow-y-auto px-10 py-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/50">Dashboard Entreprise</p>
              <h1 className="text-3xl font-bold tracking-tight">Talents Beyond Connect</h1>
            </div>
            <Link
              href="/beyond-connect-app/companies/jobs/new"
              className="rounded-sm border border-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-white"
            >
              Publier une mission
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setSortByAdn((prev) => !prev)}
              className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white"
            >
              Trier par ADN Beyond
            </button>
          </div>

          <section id="talents" className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight">Grille de talents</h2>
              {loading && <span className="text-xs text-white/50">Chargement...</span>}
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {sortedTalents.map((talent) => {
                const traits = talent.temperament_traits || [];
                return (
                  <div
                    key={talent.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 overflow-hidden rounded-full border border-white/10 bg-white/5">
                        {talent.avatar_url ? (
                          <img src={talent.avatar_url} alt={talent.first_name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs">
                            {maskName(talent.first_name, isClient).slice(0, 1)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">
                          {maskName(talent.first_name, isClient)} {isClient ? talent.last_name : ""}
                        </p>
                        <p className="text-xs text-white/60">Traits dominants</p>
                      </div>
                      {talent.mobility_national && (
                        <span className="rounded-full bg-white px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-[#050A18]">
                          Mobilité nationale
                        </span>
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {traits.slice(0, 3).map((trait) => (
                        <span
                          key={trait}
                          className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/80"
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                    {talent.is_certified && (
                      <span className="mt-4 inline-flex items-center rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white/80">
                        Certifié Beyond
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section id="attente" className="mt-14">
            <div className="mb-4">
              <h2 className="text-xl font-bold tracking-tight">Profils en attente de Certification</h2>
              <p className="text-sm text-white/60">
                Sponsorisez un badge pour activer immédiatement un talent.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {waitingCertification.map((talent) => (
                <div
                  key={`waiting-${talent.id}`}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
                >
                  <p className="text-sm font-semibold">
                    {maskName(talent.first_name, isClient)} {isClient ? talent.last_name : ""}
                  </p>
                  <p className="mt-2 text-xs text-white/60">Badge non certifié</p>
                  <button
                    type="button"
                    className="mt-4 rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white"
                  >
                    Sponsoriser le badge
                  </button>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
