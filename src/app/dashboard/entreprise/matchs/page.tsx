"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Users, Sparkles, Briefcase, ChevronLeft, ChevronRight, LogOut, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";

type MatchItem = {
  id: string;
  match_score?: number | null;
  beyond_connect_job_offers?: {
    id?: string;
    title?: string;
    contract_type?: string | null;
  } | null;
  profiles?: {
    id?: string;
    first_name?: string | null;
    last_name?: string | null;
    avatar_url?: string | null;
  } | null;
};

type JobOfferItem = {
  id: string;
  title?: string | null;
  contract_type?: string | null;
};

const fallbackSkills = ["Résolution de problèmes", "Adaptabilité", "Organisation"];

function EnterpriseMatchesInner() {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [jobOffers, setJobOffers] = useState<JobOfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [contractFilter, setContractFilter] = useState("all");
  const [selectedOfferId, setSelectedOfferId] = useState("all");
  const [scoreMin, setScoreMin] = useState(60);
  const [scoreMax, setScoreMax] = useState(100);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [talentFilter, setTalentFilter] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      if ((isMac ? event.metaKey : event.ctrlKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();
        setSidebarCollapsed((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [matchesRes, offersRes] = await Promise.all([
          fetch("/api/beyond-connect/matches"),
          fetch("/api/beyond-connect/job-offers?is_active=true"),
        ]);
        if (matchesRes.ok) {
          const data = await matchesRes.json();
          setMatches(data.matches || []);
        }
        if (offersRes.ok) {
          const data = await offersRes.json();
          setJobOffers(data.jobOffers || []);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const talentId = searchParams.get("talent_id");
    const jobOfferId = searchParams.get("job_offer_id");
    setTalentFilter(talentId);
    if (jobOfferId && selectedOfferId === "all") {
      setSelectedOfferId(jobOfferId);
    }
  }, [searchParams]);

  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      if (talentFilter && match.profiles?.id !== talentFilter) return false;
      if (selectedOfferId !== "all") {
        if (match.beyond_connect_job_offers?.id !== selectedOfferId) return false;
      }
      const contract = match.beyond_connect_job_offers?.contract_type?.toLowerCase() || "";
      if (contractFilter === "freelance" && !contract.includes("freelance")) return false;
      if (
        contractFilter === "alternance" &&
        !(contract.includes("alternance") || contract.includes("apprentissage"))
      )
        return false;
      if (contractFilter === "cdi" && !contract.includes("cdi")) return false;
      if (contractFilter === "stage" && !contract.includes("stage")) return false;
      const score = Math.round(match.match_score || 0);
      if (score < scoreMin || score > scoreMax) return false;
      return true;
    });
  }, [contractFilter, matches, scoreMax, scoreMin, selectedOfferId, talentFilter]);

  return (
    <div
      className="min-h-screen bg-white text-[#050A18]"
      style={{ backgroundColor: "#FFFFFF", color: "#000000" }}
    >
      <div className="flex min-h-screen">
        <aside
          className={`fixed left-0 top-0 flex h-full flex-col bg-[#0B1120] py-8 text-white transition-all duration-300 ${
            sidebarCollapsed ? "w-20 px-3" : "w-64 px-6"
          }`}
        >
          <div>
            <div className="text-lg font-bold tracking-tight">BEYOND CONNECT</div>
            <p className="mt-2 text-xs tracking-tight text-white/50">Entreprise</p>
          </div>
          <button
            type="button"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            className="mt-6 inline-flex items-center justify-center rounded-full border border-white/10 p-1 text-white/50 hover:text-white"
            aria-label="Réduire la sidebar"
          >
            {sidebarCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </button>
          <nav className="mt-10 space-y-8 text-sm tracking-tight text-white/70">
            <Link href="/dashboard/entreprise" className="flex items-center gap-2 rounded-full px-3 py-2 hover:bg-white/10">
              <LayoutDashboard className="h-4 w-4 text-white" />
              {!sidebarCollapsed && "Tableau de bord"}
            </Link>
            <Link href="/dashboard/entreprise/matchs" className="flex items-center gap-2 rounded-full px-3 py-2 hover:bg-white/10">
              <Sparkles className="h-4 w-4 text-white" />
              {!sidebarCollapsed && "Matchs"}
            </Link>
            <Link href="/dashboard/entreprise/talents" className="flex items-center gap-2 rounded-full px-3 py-2 hover:bg-white/10">
              <Users className="h-4 w-4 text-white" />
              {!sidebarCollapsed && "Talents"}
            </Link>
            <Link href="/dashboard/entreprise/offres" className="flex items-center gap-2 rounded-full px-3 py-2 hover:bg-white/10">
              <Briefcase className="h-4 w-4 text-white" />
              {!sidebarCollapsed && "Offres"}
            </Link>
            <Link href="/dashboard/entreprise/entreprise" className="flex items-center gap-2 rounded-full px-3 py-2 hover:bg-white/10">
              <Users className="h-4 w-4 text-white" />
              {!sidebarCollapsed && "Entreprise"}
            </Link>
          </nav>
          <div className="mt-auto pt-6">
            <Link
              href="/dashboard/entreprise/badges/delivrer"
              className={`block w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold tracking-tight text-white ${
                sidebarCollapsed ? "text-xs" : ""
              }`}
            >
              {sidebarCollapsed ? "Badges" : "Certifier vos talents"}
            </Link>
            <Link
              href="/logout"
              className={`mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-medium tracking-tight text-white/80 hover:text-white ${
                sidebarCollapsed ? "text-xs" : ""
              }`}
            >
              <LogOut className="h-4 w-4" />
              {!sidebarCollapsed && "Déconnexion"}
            </Link>
          </div>
        </aside>

        <main
          className={`relative flex-1 overflow-y-auto px-10 py-10 transition-all duration-300 ${
            sidebarCollapsed ? "ml-20" : "ml-64"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <h1
                className="text-4xl font-black uppercase tracking-tight text-[#050A18]"
                style={{ fontFamily: "Anton, 'Futura Condensed', 'Arial Narrow', sans-serif" }}
              >
                VOS MATCHS
              </h1>
              <p className="mt-2 text-sm text-[#050A18]/60">
                Les meilleurs talents pour vos missions selon l&apos;algorithme Beyond.
              </p>
            </div>
          </div>

          <div
            className="mt-6 flex flex-wrap items-center gap-6 rounded-3xl border border-slate-200 bg-white px-6 py-4 shadow-sm"
            style={{ background: "#FFFFFF" }}
          >
            <div className="min-w-[240px] flex-1">
              <label className="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-400">
                Filtrer par annonce
              </label>
              <div
                className="mt-2 rounded-xl p-[1px]"
                style={{
                  backgroundImage:
                    "linear-gradient(white, white), linear-gradient(to right, #3b82f6, #8b5cf6)",
                  backgroundOrigin: "border-box",
                  backgroundClip: "content-box, border-box",
                }}
              >
                <select
                  value={selectedOfferId}
                  onChange={(event) => setSelectedOfferId(event.target.value)}
                  className="w-full rounded-[0.7rem] bg-white px-4 py-2 text-sm focus:outline-none"
                  style={{
                    backgroundImage: "linear-gradient(to right, #3b82f6, #8b5cf6)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    color: "#000000",
                    caretColor: "#3b82f6",
                  }}
                >
                  <option value="all" style={{ backgroundColor: "#FFFFFF", color: "#3b82f6" }}>
                    Toutes mes annonces
                  </option>
                  {jobOffers.map((offer) => (
                    <option
                      key={offer.id}
                      value={offer.id}
                      style={{ backgroundColor: "#FFFFFF", color: "#3b82f6" }}
                    >
                      {offer.title || "Offre sans titre"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="min-w-[220px]">
              <label className="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-400">
                Type de contrat
              </label>
              <div
                className="mt-2 rounded-xl p-[1px]"
                style={{
                  backgroundImage:
                    "linear-gradient(white, white), linear-gradient(to right, #3b82f6, #8b5cf6)",
                  backgroundOrigin: "border-box",
                  backgroundClip: "content-box, border-box",
                }}
              >
                <select
                  value={contractFilter}
                  onChange={(event) => setContractFilter(event.target.value)}
                  className="w-full rounded-[0.7rem] bg-white px-4 py-2 text-sm focus:outline-none"
                  style={{
                    backgroundImage: "linear-gradient(to right, #3b82f6, #8b5cf6)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    color: "#000000",
                    caretColor: "#3b82f6",
                  }}
                >
                  <option value="all" style={{ backgroundColor: "#FFFFFF", color: "#3b82f6" }}>
                    Tous les contrats
                  </option>
                  <option value="alternance" style={{ backgroundColor: "#FFFFFF", color: "#3b82f6" }}>
                    Alternance
                  </option>
                  <option value="freelance" style={{ backgroundColor: "#FFFFFF", color: "#3b82f6" }}>
                    Freelance
                  </option>
                  <option value="cdi" style={{ backgroundColor: "#FFFFFF", color: "#3b82f6" }}>
                    CDI
                  </option>
                  <option value="stage" style={{ backgroundColor: "#FFFFFF", color: "#3b82f6" }}>
                    Stage
                  </option>
                </select>
              </div>
            </div>
            <div className="min-w-[160px]">
              <label className="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-400">
                Score min (%)
              </label>
              <div
                className="mt-2 rounded-xl p-[1px]"
                style={{
                  backgroundImage:
                    "linear-gradient(white, white), linear-gradient(to right, #3b82f6, #8b5cf6)",
                  backgroundOrigin: "border-box",
                  backgroundClip: "content-box, border-box",
                }}
              >
                <input
                  type="number"
                  min={0}
                  max={scoreMax}
                  value={scoreMin}
                  onChange={(event) => setScoreMin(Math.min(Number(event.target.value || 0), scoreMax))}
                  className="w-full rounded-[0.7rem] bg-white px-4 py-2 text-sm focus:outline-none"
                  style={{
                    backgroundImage: "linear-gradient(to right, #3b82f6, #8b5cf6)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    color: "#000000",
                    caretColor: "#3b82f6",
                  }}
                />
              </div>
            </div>
            <div className="min-w-[160px]">
              <label className="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-400">
                Score max (%)
              </label>
              <div
                className="mt-2 rounded-xl p-[1px]"
                style={{
                  backgroundImage:
                    "linear-gradient(white, white), linear-gradient(to right, #3b82f6, #8b5cf6)",
                  backgroundOrigin: "border-box",
                  backgroundClip: "content-box, border-box",
                }}
              >
                <input
                  type="number"
                  min={scoreMin}
                  max={100}
                  value={scoreMax}
                  onChange={(event) => setScoreMax(Math.max(Number(event.target.value || 0), scoreMin))}
                  className="w-full rounded-[0.7rem] bg-white px-4 py-2 text-sm focus:outline-none"
                  style={{
                    backgroundImage: "linear-gradient(to right, #3b82f6, #8b5cf6)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    color: "#000000",
                    caretColor: "#3b82f6",
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-10 space-y-6">
            {loading && <p className="text-sm text-[#050A18]/60">Chargement...</p>}
            {!loading && filteredMatches.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white">
                  <Search className="h-5 w-5 text-[#050A18]/50" />
                </div>
                <p className="text-sm font-medium text-[#050A18]/60">
                  Aucun match enregistré pour le moment. Allez dans l&apos;onglet Talents pour ajouter des profils ici.
                </p>
              </div>
            )}
            {filteredMatches.map((match, index) => {
              const score = Math.round(match.match_score || 0);
              const firstName = match.profiles?.first_name || "Talent";
              const lastName = match.profiles?.last_name || "";
              const skills = fallbackSkills;
              return (
                <div
                  key={match.id || index}
                  className="rounded-3xl border border-transparent bg-white p-6 shadow-sm"
                  style={{ borderImage: "linear-gradient(90deg, #050A18, #6D28D9) 1" }}
                >
                  <div className="grid gap-6 md:grid-cols-[180px_1fr_auto] md:items-center">
                    <div className="text-[clamp(2rem,5vw,4rem)] font-black leading-none text-transparent bg-clip-text bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6]">
                      {score}%
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-[#050A18]">
                        {firstName} {lastName}
                      </p>
                      <span className="mt-2 inline-flex rounded-full border border-[#007AFF] px-3 py-1 text-[11px] tracking-tight text-[#007AFF]">
                        Top Atout
                      </span>
                    </div>
                    <Link
                      href={`/dashboard/entreprise/talents/${match.profiles?.id ?? ""}`}
                      className="inline-flex rounded-full bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] p-[1px]"
                    >
                      <span
                        className="rounded-full bg-white px-5 py-2 text-xs font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6]"
                        style={{
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        Voir le profil
                      </span>
                    </Link>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span
                        key={`${match.id}-${skill}`}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] tracking-tight text-[#050A18]/70"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function EnterpriseMatchesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <EnterpriseMatchesInner />
    </Suspense>
  );
}
