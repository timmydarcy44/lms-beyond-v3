"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, Search, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useSupabase } from "@/components/providers/supabase-provider";
import { TalentDashboardShell } from "@/components/beyond-connect/talent-dashboard-shell";

type JobOffer = {
  id: string;
  title?: string | null;
  city?: string | null;
  contract_type?: string | null;
  salary_range?: string | null;
  description?: string | null;
  required_soft_skills?: string[] | null;
};

type TalentProfile = {
  city?: string | null;
  contract_type?: string | null;
  salary_min?: string | null;
  tjm_min?: string | null;
  gratification_min?: string | null;
  soft_skills?: string[] | null;
  score_red?: number | null;
  score_yellow?: number | null;
  score_green?: number | null;
  score_blue?: number | null;
};

export default function TalentOffersPage() {
  const supabase = useSupabase();
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [profile, setProfile] = useState<TalentProfile | null>(null);
  const [query, setQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [minComp, setMinComp] = useState("");
  const [matchMin, setMatchMin] = useState(60);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);

  useEffect(() => {
    const loadOffers = async () => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from("job_offers")
        .select("id, title, city, contract_type, salary_range, description, required_soft_skills")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (!error) setOffers(data || []);
    };
    loadOffers();
  }, [supabase]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!supabase) return;
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) return;
      const { data } = await supabase
        .from("talent_profiles")
        .select("city, contract_type, salary_min, tjm_min, gratification_min, soft_skills")
        .eq("id", userData.user.id)
        .maybeSingle();
      setProfile(data || null);
    };
    loadProfile();
  }, [supabase]);

  useEffect(() => {
    const loadApplications = async () => {
      if (!supabase) return;
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) return;
      const { data } = await supabase
        .from("applications")
        .select("job_id")
        .eq("talent_id", userData.user.id);
      if (data && data.length) {
        setAppliedJobIds(new Set(data.map((row) => row.job_id)));
      }
    };
    loadApplications();
  }, [supabase]);

  const scoredOffers = useMemo(() => {
    return offers.map((offer) => ({
      offer,
      matchScore: computeMatchScore(offer, profile),
    }));
  }, [offers, profile]);

  const filteredOffers = useMemo(() => {
    return scoredOffers.filter(({ offer, matchScore }) => {
      const search = query.trim().toLowerCase();
      if (search) {
        const haystack = `${offer.title || ""} ${offer.description || ""}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      if (cityFilter && (offer.city || "").toLowerCase() !== cityFilter.toLowerCase()) return false;

      const offerRange = parseRange(offer.salary_range);
      const minValue = minComp ? Number(minComp) : null;
      const maxValue = null;
      if (minValue !== null && offerRange.max !== null && offerRange.max < minValue) return false;
      if (maxValue !== null && offerRange.min !== null && offerRange.min > maxValue) return false;
      if (matchScore < matchMin) return false;
      return true;
    });
  }, [scoredOffers, query, cityFilter, minComp, matchMin]);

  const handleApply = async (jobId: string) => {
    if (!supabase || applyingJobId) return;
    if (appliedJobIds.has(jobId)) return;
    setApplyingJobId(jobId);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) {
        setApplyingJobId(null);
        return;
      }
      const { error } = await supabase.from("applications").insert({
        job_id: jobId,
        talent_id: userId,
      });
      if (error) {
        toast.error("Erreur de connexion à la base de données.");
      } else {
        setAppliedJobIds((prev) => new Set(prev).add(jobId));
        toast.success("Candidature envoyée ✅");
      }
    } catch (error) {
      toast.error("Erreur de connexion à la base de données.");
    } finally {
      setApplyingJobId(null);
    }
  };

  return (
    <TalentDashboardShell>
      <div className="space-y-6 bg-slate-50 px-6 py-10">
        <h1 className="text-2xl font-semibold text-black">Offres</h1>
        <div className="sticky top-4 z-30 space-y-3">
          <div className="flex items-center gap-0 rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl">
            <div className="flex flex-1 items-center gap-3 border-r border-gray-200 px-4">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                className="w-full border-none bg-transparent text-sm focus:ring-0"
                placeholder="Quel metier ?"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="flex flex-1 items-center gap-3 border-r border-gray-200 px-4">
              <MapPin className="h-4 w-4 text-gray-400" />
              <input
                className="w-full border-none bg-transparent text-sm focus:ring-0"
                placeholder="Quelle ville ?"
                value={cityFilter}
                onChange={(event) => setCityFilter(event.target.value)}
              />
            </div>
            <div className="flex flex-1 items-center gap-3 border-r border-gray-200 px-4">
              <Wallet className="h-4 w-4 text-gray-400" />
              <input
                className="w-full border-none bg-transparent text-sm focus:ring-0"
                placeholder="Salaire/TJM souhaite"
                value={minComp}
                onChange={(event) => setMinComp(event.target.value)}
              />
            </div>
            <div className="px-2">
              <button
                type="button"
                className="rounded-xl bg-blue-600 px-8 py-4 text-sm font-bold text-white transition-all hover:bg-blue-700"
              >
                Rechercher
              </button>
            </div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <label className="text-sm font-semibold text-gray-500">
              Affiner par matching : +{matchMin}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={matchMin}
              onChange={(event) => setMatchMin(Number(event.target.value))}
              className="mt-2 h-1 w-full cursor-pointer appearance-none rounded-full bg-blue-100 accent-blue-600"
              style={{
                boxShadow: "0 6px 12px rgba(37, 99, 235, 0.2)",
              }}
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {filteredOffers.map(({ offer, matchScore }) => (
            <div
              key={offer.id}
              className="rounded-2xl border border-gray-50 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{offer.title || "Offre sans titre"}</h2>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                  {matchScore}% Match
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-black/60">
                  {offer.contract_type || "Contrat"}
                </span>
                <span className="text-sm text-black/50">{offer.city || "Ville non precisee"}</span>
              </div>
              <p className="mt-2 text-sm text-black/60">{formatCompensation(offer)}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleApply(offer.id)}
                  disabled={appliedJobIds.has(offer.id) || applyingJobId === offer.id}
                  className={`inline-flex w-full items-center justify-center rounded-lg py-2 text-sm font-semibold ${
                    appliedJobIds.has(offer.id)
                      ? "cursor-not-allowed bg-gray-200 text-gray-500"
                      : "bg-gray-900 text-white hover:bg-black"
                  }`}
                >
                  {appliedJobIds.has(offer.id)
                    ? "Candidature envoyée ✅"
                    : applyingJobId === offer.id
                      ? "Envoi en cours..."
                      : "Postuler"}
                </button>
                <Link
                  href={`/dashboard/talent/offres/${offer.id}`}
                  className="inline-flex w-full items-center justify-center rounded-lg border border-gray-200 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </TalentDashboardShell>
  );
}

function computeMatchScore(offer: JobOffer, profile: TalentProfile | null) {
  if (!profile) return 50;
  const locationScore =
    profile.city && offer.city && profile.city.toLowerCase() === offer.city.toLowerCase() ? 100 : 50;

  const offerRange = parseRange(offer.salary_range);
  const profileValue = getProfileCompValue(profile);
  const salaryScore =
    profileValue !== null && offerRange.min !== null && offerRange.max !== null
      ? profileValue >= offerRange.min && profileValue <= offerRange.max
        ? 100
        : 50
      : 50;

  const discScore = getDiscScore(profile);
  return Math.round((locationScore + salaryScore + discScore) / 3);
}

function getProfileCompValue(profile: TalentProfile) {
  if (profile.contract_type?.toLowerCase().includes("freelance") && profile.tjm_min) {
    return Number(extractNumber(profile.tjm_min));
  }
  if ((profile.contract_type || "").toLowerCase().includes("cdi") || (profile.contract_type || "").toLowerCase().includes("cdd")) {
    return Number(extractNumber(profile.salary_min || ""));
  }
  if (profile.gratification_min) {
    return Number(extractNumber(profile.gratification_min));
  }
  return null;
}

function getDiscScore(profile: TalentProfile) {
  const scores = [
    profile.score_red || 0,
    profile.score_yellow || 0,
    profile.score_green || 0,
    profile.score_blue || 0,
  ];
  const maxScore = Math.max(...scores);
  return Math.round((maxScore / 12) * 100);
}

function parseRange(value?: string | null) {
  if (!value) return { min: null, max: null };
  const numbers = value.match(/\d+/g)?.map(Number) || [];
  if (numbers.length === 0) return { min: null, max: null };
  if (numbers.length === 1) return { min: numbers[0], max: numbers[0] };
  return { min: Math.min(numbers[0], numbers[1]), max: Math.max(numbers[0], numbers[1]) };
}

function extractNumber(value: string) {
  const numbers = value.match(/\d+/g);
  if (!numbers || numbers.length === 0) return 0;
  return Number(numbers[0]);
}

function formatCompensation(offer: JobOffer) {
  if (!offer.salary_range) return "Remuneration non precisee";
  const base = offer.salary_range.includes("€") ? offer.salary_range : `${offer.salary_range} €`;
  const contract = (offer.contract_type || "").toLowerCase();
  if (contract.includes("freelance")) {
    return `${base} / jour`;
  }
  if (contract.includes("stage") || contract.includes("alternance")) {
    return `${base} / mois`;
  }
  return `${base} / an`;
}
