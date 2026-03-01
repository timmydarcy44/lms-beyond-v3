"use client";

import { useEffect, useMemo, useState } from "react";
import { LayoutDashboard, Users, Sparkles, Briefcase, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import Link from "next/link";
import { TalentModal } from "@/components/beyond-connect/TalentModal";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSupabase } from "@/components/providers/supabase-provider";

type Talent = {
  id: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  temperament_traits?: string[] | null;
  mobility_national?: boolean;
  is_certified?: boolean;
  match_score?: number | null;
  matching_score?: number | null;
  soft_skills_scores?: {
    dimensions?: Record<string, { score10?: number; average?: number }>;
  } | null;
};

type Company = {
  id: string;
  is_premium?: boolean;
};
type JobOffer = {
  id: string;
  title?: string | null;
  required_soft_skills?: string[] | null;
};

const companyTypes = ["Start-up", "PME", "ETI", "Grand Groupe", "TPE"];

const fallbackTalents: Talent[] = [
  {
    id: "talent-1",
    first_name: "Camille",
    last_name: "R.",
    temperament_traits: ["Audace", "Résilience", "Écoute"],
    mobility_national: true,
    is_certified: true,
    match_score: 92,
  },
  {
    id: "talent-2",
    first_name: "Nicolas",
    last_name: "M.",
    temperament_traits: ["Rigueur", "Vision", "Leadership"],
    mobility_national: false,
    is_certified: false,
    match_score: 87,
  },
  {
    id: "talent-3",
    first_name: "Sami",
    last_name: "L.",
    temperament_traits: ["Audace", "Communication", "Agilité"],
    mobility_national: true,
    is_certified: false,
    match_score: 95,
  },
  {
    id: "talent-4",
    first_name: "Alex",
    last_name: "P.",
    temperament_traits: ["Résilience", "Concentration", "Analyse"],
    mobility_national: false,
    is_certified: true,
    match_score: 83,
  },
];

const fallbackImages = [
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1542206395-9feb3edaa68d?auto=format&fit=crop&w=300&q=80",
];

function maskName(name?: string, isClient?: boolean) {
  if (!name) return "Candidat";
  if (isClient) return name;
  return `${name[0]}.`;
}

function scoreFromSoftSkills(talent: Talent) {
  const dimensions = talent.soft_skills_scores?.dimensions;
  if (!dimensions) return null;
  const scores = Object.values(dimensions)
    .map((item) => item?.score10 ?? (item?.average ? item.average * 2 : null))
    .filter((value): value is number => typeof value === "number" && !Number.isNaN(value));
  if (scores.length === 0) return null;
  const avg = scores.reduce((sum, value) => sum + value, 0) / scores.length;
  return Math.round(avg * 10);
}

function getScore(talent: Talent, index: number) {
  const softSkillsScore = scoreFromSoftSkills(talent);
  if (softSkillsScore !== null) return softSkillsScore;
  if (typeof talent.match_score === "number") return talent.match_score;
  if (typeof talent.matching_score === "number") return talent.matching_score;
  const fallback = [92, 87, 95, 83][index % 4];
  return fallback;
}

export function CompanyDashboardElite({ userId }: { userId: string }) {
  const supabase = useSupabase();
  const [talents, setTalents] = useState<Talent[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobOffers, setJobOffers] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortByAdn, setSortByAdn] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState("");
  const [activeOfferId, setActiveOfferId] = useState<string | null>(null);
  const [activeTalent, setActiveTalent] = useState<Talent | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [analyzingTalentId, setAnalyzingTalentId] = useState<string | null>(null);
  const router = useRouter();

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
        const [talentsRes, companiesRes] = await Promise.all([
          fetch("/api/beyond-connect/talents"),
          fetch("/api/beyond-connect/companies"),
        ]);
        if (talentsRes.ok) {
          const data = await talentsRes.json();
          setTalents(data.talents || []);
        }
        if (companiesRes.ok) {
          const data = await companiesRes.json();
          setCompanies(data.companies || []);
        }
        if (supabase && userId) {
          const { data: offers, error } = await supabase
            .from("job_offers")
            .select("id, title, required_soft_skills")
            .eq("company_id", userId)
            .eq("status", "active");
          if (!error) {
            const normalizedOffers = offers || [];
            setJobOffers(normalizedOffers);
            if (!selectedOffer && normalizedOffers.length > 0) {
              setSelectedOffer(normalizedOffers[0].id);
              setActiveOfferId(normalizedOffers[0].id);
              console.log("UUID Offre utilisé:", normalizedOffers[0].id);
            }
            if (normalizedOffers.length === 0) {
              setActiveOfferId(null);
              console.log("UUID Offre utilisé:", null);
            }
          }
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId, supabase]);

  const isClient = companies.some((company) => company.is_premium);
  const dataSource = talents.length > 0 ? talents : fallbackTalents;

  const selectedOfferData = useMemo(
    () =>
      jobOffers.find((offer) => offer.id === selectedOffer) ||
      jobOffers.find((offer) => offer.id === activeOfferId) ||
      null,
    [jobOffers, selectedOffer, activeOfferId]
  );

  const normalizeScore = (raw?: number | null) => {
    if (raw === null || raw === undefined || Number.isNaN(raw)) return null;
    if (raw <= 1) return Math.round(raw * 100);
    if (raw <= 10) return Math.round(raw * 10);
    return Math.round(raw);
  };

  const matchScores = useMemo(() => {
    const required = (selectedOfferData?.required_soft_skills || []).map((skill) =>
      skill.toLowerCase().trim()
    );
    if (!selectedOfferData || required.length === 0) return new Map<string, number>();

    const scoreMap = new Map<string, number>();
    dataSource.forEach((talent, index) => {
      const dimensions = talent.soft_skills_scores?.dimensions || {};
      const normalized = Object.entries(dimensions).reduce<Record<string, number>>((acc, [key, value]) => {
        const raw = normalizeScore(value?.score10 ?? value?.average ?? null);
        if (raw !== null) acc[key.toLowerCase().trim()] = raw;
        return acc;
      }, {});

      const scores = required.map((skill) => normalized[skill] ?? 50);
      const average = scores.reduce((sum, current) => sum + current, 0) / (scores.length || 1);
      scoreMap.set(talent.id, Math.round(average));
      if (scores.length === 0) {
        scoreMap.set(talent.id, getScore(talent, index));
      }
    });
    return scoreMap;
  }, [selectedOfferData?.id, dataSource]);

  const sortedTalents = useMemo(() => {
    if (selectedOfferData) {
      return [...dataSource].sort((a, b) => {
        const scoreA = matchScores.get(a.id) ?? 0;
        const scoreB = matchScores.get(b.id) ?? 0;
        return scoreB - scoreA;
      });
    }
    if (!sortByAdn) return dataSource;
    return [...dataSource].sort((a, b) => {
      const aTraits = (a.temperament_traits || []).join(" ").toLowerCase();
      const bTraits = (b.temperament_traits || []).join(" ").toLowerCase();
      const aScore = (a.mobility_national ? 2 : 0) + (aTraits.includes("audace") ? 2 : 0);
      const bScore = (b.mobility_national ? 2 : 0) + (bTraits.includes("audace") ? 2 : 0);
      return bScore - aScore;
    });
  }, [sortByAdn, dataSource, selectedOfferData, matchScores]);

  const aiMatches = sortedTalents.slice(0, 4);

  const getMatchScore = (talent: Talent, index: number) => {
    if (!selectedOfferData) return getScore(talent, index);
    return matchScores.get(talent.id) ?? getScore(talent, index);
  };

  const handleViewAnalysis = async (talent: Talent, score: number) => {
    const jobOfferId = selectedOffer || activeOfferId;
    if (!jobOfferId) {
      console.error("job_offer_id manquant, impossible d'enregistrer le match.");
      toast.error("Veuillez créer une offre avant de lancer une analyse.");
      return;
    }
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        jobOfferId
      );
    if (!isUuid) {
      console.error("job_offer_id invalide:", jobOfferId);
      toast.error("Identifiant d'offre invalide. Merci de sélectionner une offre valide.");
      return;
    }
    setAnalyzingTalentId(talent.id);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const selectedOfferData = jobOffers.find((offer) => offer.id === jobOfferId) || null;
    const simulatedScore = matchScores.get(talent.id) ?? getScore(talent, 0);
    try {
      const response = await fetch("/api/beyond-connect/matches/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          talent_id: talent.id,
          job_offer_id: jobOfferId,
          match_score: simulatedScore || score,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        console.error("Erreur insertion match:", data?.error || response.statusText);
        toast.error("Impossible d'enregistrer le match.");
        setAnalyzingTalentId(null);
        return;
      }
      console.log("Match inséré avec succès");
      toast.success(`Analyse terminée : Score de ${simulatedScore}% ! Ajouté aux matchs.`);
    } catch (error) {
      console.error("Erreur insertion match:", error);
      toast.error("Impossible d'enregistrer le match.");
      setAnalyzingTalentId(null);
      return;
    }
    setAnalyzingTalentId(null);
    router.push(`/dashboard/entreprise/matchs?talent_id=${talent.id}&job_offer_id=${jobOfferId}`);
  };

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
            <Link
              href="/dashboard/entreprise"
              className="flex items-center gap-2 rounded-full px-3 py-2 transition hover:bg-white/10 hover:text-white"
            >
              <LayoutDashboard className="h-4 w-4 text-white" />
              {!sidebarCollapsed && "Tableau de bord"}
            </Link>
            <Link
              href="/dashboard/entreprise/matchs"
              className="flex items-center gap-2 rounded-full px-3 py-2 transition hover:bg-white/10 hover:text-white"
            >
              <Sparkles className="h-4 w-4 text-white" />
              {!sidebarCollapsed && "Matchs"}
            </Link>
            <Link
              href="/dashboard/entreprise/talents"
              className="flex items-center gap-2 rounded-full px-3 py-2 transition hover:bg-white/10 hover:text-white"
            >
              <Users className="h-4 w-4 text-white" />
              {!sidebarCollapsed && "Talents"}
            </Link>
            <Link
              href="/dashboard/entreprise/offres"
              className="flex items-center gap-2 rounded-full px-3 py-2 transition hover:bg-white/10 hover:text-white"
            >
              <Briefcase className="h-4 w-4 text-white" />
              {!sidebarCollapsed && "Offres"}
            </Link>
            <Link
              href="/dashboard/entreprise/entreprise"
              className="flex items-center gap-2 rounded-full px-3 py-2 transition hover:bg-white/10 hover:text-white"
            >
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
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1
              className="text-3xl font-black uppercase tracking-tight text-[#050A18]"
              style={{ fontFamily: "Anton, 'Futura Condensed', 'Arial Narrow', sans-serif" }}
            >
              Tableau de bord
            </h1>
            <Link
              href="/dashboard/entreprise/offres/creer"
              className="inline-flex rounded-full p-[1px]"
              style={{
                background: "#FFFFFF",
                border: "2px solid transparent",
                backgroundImage:
                  "linear-gradient(white, white), linear-gradient(to right, #3b82f6, #8b5cf6)",
                backgroundOrigin: "border-box",
                backgroundClip: "content-box, border-box",
              }}
            >
              <span
                className="rounded-full bg-white px-6 py-3 text-xs font-semibold tracking-tight"
                style={{
                  backgroundImage: "linear-gradient(to right, #3b82f6, #8b5cf6)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  color: "transparent",
                }}
              >
                Créer une offre
              </span>
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setSortByAdn((prev) => !prev)}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold tracking-tight text-[#050A18] shadow-sm"
            >
              Trier par ADN Beyond
            </button>
            {loading && <span className="text-xs text-[#050A18]/50">Chargement...</span>}
          </div>

          <section className="mt-10">
            <div className="mb-4 flex items-center justify-between">
            <h2
              className="text-xl font-black uppercase tracking-tight text-[#050A18]"
              style={{ fontFamily: "Anton, 'Futura Condensed', 'Arial Narrow', sans-serif" }}
            >
              Matchs
            </h2>
            </div>
            <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Matchs à +90%", value: "12" },
                { label: "Talents certifiés", value: "28" },
                { label: "Mobilité nationale", value: "16" },
                { label: "Nouveaux talents", value: "9" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <p className="text-xs text-[#050A18]/50">{item.label}</p>
                  <p className="mt-2 text-3xl font-bold text-[#050A18]">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="mb-6 flex flex-wrap gap-3">
              <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs tracking-tight text-[#050A18]/70 shadow-sm">
                Sélectionner une offre
              </div>
              <select
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs tracking-tight text-[#050A18] shadow-sm"
                value={selectedOffer}
                onChange={(event) => {
                  setSelectedOffer(event.target.value);
                  setActiveOfferId(event.target.value || null);
                  console.log("UUID Offre utilisé:", event.target.value || null);
                }}
              >
                <option value="">Toutes les offres</option>
                {jobOffers.map((offer) => (
                  <option key={offer.id} value={offer.id}>
                    {offer.title || "Offre sans titre"}
                  </option>
                ))}
              </select>
              {jobOffers.length === 0 && (
                <span className="text-xs text-[#050A18]/50">
                  Veuillez créer une offre avant de lancer une analyse.
                </span>
              )}
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {aiMatches.map((talent, index) => {
                const score = getMatchScore(talent, index);
                const traits = talent.temperament_traits || [];
                const primaryTrait = traits[0] || "Audace";
                return (
                  <div
                    key={`ai-${talent.id}`}
                    className="talent-card rounded-3xl border border-transparent bg-white p-6 shadow-sm"
                    style={{ borderImage: "linear-gradient(90deg, #050A18, #6D28D9) 1" }}
                    onClick={() => setActiveTalent(talent)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 overflow-hidden rounded-full border border-white/10 bg-white/5">
                        {talent.avatar_url ? (
                          <img src={talent.avatar_url} alt={talent.first_name} className="h-full w-full object-cover" />
                        ) : (
                          <img
                            src={fallbackImages[index % fallbackImages.length]}
                            alt={talent.first_name}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#050A18]">
                          {maskName(talent.first_name, isClient)} {isClient ? talent.last_name : ""}
                        </p>
                        <p className="text-[11px] text-[#050A18]/50">Score de matching</p>
                      </div>
                      {selectedOffer ? (
                        <span className="text-2xl font-bold text-[#050A18]">{score}%</span>
                      ) : (
                        <span className="text-[10px] text-[#050A18]/50">Sélectionnez une offre</span>
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {traits.slice(0, 3).map((trait) => (
                        <span
                          key={`${talent.id}-${trait}`}
                          className="rounded-full border border-slate-200 px-3 py-1 text-[10px] tracking-tight text-[#050A18]/70"
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4">
                      {selectedOffer ? (
                        <>
                          <div className="mb-2 flex items-center justify-between text-[10px] tracking-tight text-[#050A18]/50">
                            <span>{primaryTrait}</span>
                            <span>{score}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-100">
                            <div className="h-2 rounded-full bg-[#050A18]" style={{ width: `${Math.min(score, 100)}%` }} />
                          </div>
                        </>
                      ) : (
                        <div className="text-[10px] text-[#050A18]/50">Score disponible après sélection d'offre.</div>
                      )}
                    </div>
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] tracking-tight text-emerald-700">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                      Disponible
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleViewAnalysis(talent, score);
                      }}
                      disabled={analyzingTalentId === talent.id}
                      className="mt-4 inline-flex rounded-full p-[1px]"
                      style={{
                        background: "#FFFFFF",
                        border: "2px solid transparent",
                        backgroundImage:
                          "linear-gradient(white, white), linear-gradient(to right, #3b82f6, #8b5cf6)",
                        backgroundOrigin: "border-box",
                        backgroundClip: "content-box, border-box",
                      }}
                    >
                      <span
                        className="rounded-full bg-white px-4 py-2 text-[10px] font-semibold tracking-tight"
                        style={{
                          backgroundImage: "linear-gradient(to right, #3b82f6, #8b5cf6)",
                          WebkitBackgroundClip: "text",
                          backgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          color: "transparent",
                        }}
                      >
                        {analyzingTalentId === talent.id
                          ? "L'IA Beyond analyse..."
                          : "Voir l&apos;analyse"}
                      </span>
                    </button>
                    {talent.mobility_national && (
                      <span className="mt-4 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] tracking-tight text-emerald-700">
                        Mobilité nationale
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-12">
            <div className="mb-4">
              <h2
                className="text-xl font-black uppercase tracking-tight text-[#050A18]"
                style={{ fontFamily: "Anton, 'Futura Condensed', 'Arial Narrow', sans-serif" }}
              >
                Talents
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {sortedTalents.map((talent, index) => {
                const score = getMatchScore(talent, index);
                const traits = talent.temperament_traits || [];
                const primaryTrait = traits[0] || "Audace";
                return (
                  <div
                    key={talent.id}
                    className="talent-card rounded-3xl border border-transparent bg-white p-6 shadow-sm"
                    style={{ borderImage: "linear-gradient(90deg, #050A18, #6D28D9) 1" }}
                    onClick={() => setActiveTalent(talent)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 overflow-hidden rounded-full border border-white/10 bg-white/5">
                        {talent.avatar_url ? (
                          <img src={talent.avatar_url} alt={talent.first_name} className="h-full w-full object-cover" />
                        ) : (
                          <img
                            src={fallbackImages[index % fallbackImages.length]}
                            alt={talent.first_name}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#050A18]">
                          {maskName(talent.first_name, isClient)} {isClient ? talent.last_name : ""}
                        </p>
                        <p className="text-[11px] text-[#050A18]/50">Score de matching</p>
                      </div>
                      {selectedOffer ? (
                        <span className="text-2xl font-bold text-[#050A18]">{score}%</span>
                      ) : (
                        <span className="text-[10px] text-[#050A18]/50">Sélectionnez une offre</span>
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {traits.slice(0, 3).map((trait) => (
                        <span
                          key={`${talent.id}-${trait}-all`}
                          className="rounded-full border border-slate-200 px-3 py-1 text-[10px] tracking-tight text-[#050A18]/70"
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4">
                      {selectedOffer ? (
                        <>
                          <div className="mb-2 flex items-center justify-between text-[10px] tracking-tight text-[#050A18]/50">
                            <span>{primaryTrait}</span>
                            <span>{score}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-100">
                            <div className="h-2 rounded-full bg-[#050A18]" style={{ width: `${Math.min(score, 100)}%` }} />
                          </div>
                        </>
                      ) : (
                        <div className="text-[10px] text-[#050A18]/50">Score disponible après sélection d'offre.</div>
                      )}
                    </div>
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] tracking-tight text-emerald-700">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                      Disponible
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleViewAnalysis(talent, score);
                      }}
                      disabled={analyzingTalentId === talent.id}
                      className="mt-4 inline-flex rounded-full p-[1px]"
                      style={{
                        background: "#FFFFFF",
                        border: "2px solid transparent",
                        backgroundImage:
                          "linear-gradient(white, white), linear-gradient(to right, #3b82f6, #8b5cf6)",
                        backgroundOrigin: "border-box",
                        backgroundClip: "content-box, border-box",
                      }}
                    >
                      <span
                        className="rounded-full bg-white px-4 py-2 text-[10px] font-semibold tracking-tight"
                        style={{
                          backgroundImage: "linear-gradient(to right, #3b82f6, #8b5cf6)",
                          WebkitBackgroundClip: "text",
                          backgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          color: "transparent",
                        }}
                      >
                        {analyzingTalentId === talent.id
                          ? "L'IA Beyond analyse..."
                          : "Voir l&apos;analyse"}
                      </span>
                    </button>
                    {talent.mobility_national && (
                      <span className="mt-4 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] tracking-tight text-emerald-700">
                        Mobilité nationale
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      </div>
      <TalentModal
        open={!!activeTalent}
        onClose={() => setActiveTalent(null)}
        talent={
          activeTalent
            ? {
                id: activeTalent.id,
                name: `${activeTalent.first_name || ""} ${activeTalent.last_name || ""}`.trim(),
                email: activeTalent.email || "",
                phone: (activeTalent as any).phone || "",
                linkedin: (activeTalent as any).linkedin_url || "",
                avatar: activeTalent.avatar_url || fallbackImages[0],
                mobilityScore: activeTalent.mobility_national ? 95 : 70,
                openBadges: (activeTalent as any).open_badges || [],
                isCompany: true,
                softSkills: activeTalent.soft_skills_scores?.dimensions
                  ? Object.fromEntries(
                      Object.entries(activeTalent.soft_skills_scores.dimensions).map(([key, value]) => [
                        key,
                        typeof value === "number"
                          ? value
                          : value?.score10 ?? (value?.average ? value.average * 2 : 0),
                      ])
                    )
                  : undefined,
                hardSkills: ["Négociation", "CRM", "Reporting", "Prospection"],
              }
            : null
        }
      />
      <style jsx global>{`
        .talent-card {
          border-radius: 1.5rem !important;
          overflow: hidden;
          transition: transform 200ms ease, box-shadow 200ms ease;
        }
        .talent-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1),
            0 8px 10px -6px rgb(0 0 0 / 0.1);
        }
      `}</style>
    </div>
  );
}
