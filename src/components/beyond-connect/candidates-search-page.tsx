"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, Filter, Briefcase, GraduationCap, Award, Code, Languages, Trophy, X, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type CandidateProfile = {
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  avatar_url?: string;
  experiences_count: number;
  education_count: number;
  skills_count: number;
  certifications_count: number;
  projects_count: number;
  languages_count: number;
  badges_count: number;
  match_score?: number;
  skills_match?: number;
  experience_match?: number;
  education_match?: number;
};

type JobOffer = {
  id: string;
  title: string;
  company_id: string;
};

type CandidatesSearchPageProps = {
  userId: string;
};

export function CandidatesSearchPage({ userId }: CandidatesSearchPageProps) {
  const router = useRouter();
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [jobOffers, setJobOffers] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtres
  const [selectedJobOffer, setSelectedJobOffer] = useState<string>("all");
  const [matchRange, setMatchRange] = useState<string>("all");
  const [location, setLocation] = useState<string>("");
  const [ageMin, setAgeMin] = useState<string>("");
  const [ageMax, setAgeMax] = useState<string>("");
  const [skills, setSkills] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(false);

  useEffect(() => {
    loadJobOffers();
    loadCandidates();
  }, [userId]);

  useEffect(() => {
    loadCandidates();
  }, [selectedJobOffer, matchRange, location, ageMin, ageMax, skills, searchTerm]);

  const loadJobOffers = async () => {
    try {
      const response = await fetch("/api/beyond-connect/job-offers");
      if (response.ok) {
        const data = await response.json();
        setJobOffers(data.jobOffers || []);
      }
    } catch (error) {
      console.error("[candidates-search] Error loading job offers:", error);
    }
  };

  const loadCandidates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedJobOffer && selectedJobOffer !== "all") params.append("job_offer_id", selectedJobOffer);
      if (matchRange !== "all") params.append("match_range", matchRange);
      if (location) params.append("location", location);
      if (ageMin) params.append("age_min", ageMin);
      if (ageMax) params.append("age_max", ageMax);
      if (skills) params.append("skills", skills);
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/beyond-connect/candidates/search?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setCandidates(data.candidates || []);
      }
    } catch (error) {
      console.error("[candidates-search] Error loading candidates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateMatches = async () => {
    if (!selectedJobOffer) {
      alert("Veuillez sélectionner une offre d'emploi");
      return;
    }

    try {
      const response = await fetch("/api/beyond-connect/matches/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_offer_id: selectedJobOffer }),
      });

      if (response.ok) {
        // Recharger les candidats avec les matchings
        loadCandidates();
      } else {
        const error = await response.json();
        alert(error.error || "Erreur lors du calcul des matchings");
      }
    } catch (error) {
      console.error("[candidates-search] Error calculating matches:", error);
      alert("Erreur lors du calcul des matchings");
    }
  };

  const clearFilters = () => {
    setSelectedJobOffer("all");
    setMatchRange("all");
    setLocation("");
    setAgeMin("");
    setAgeMax("");
    setSkills("");
    setSearchTerm("");
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar - Bleu PSG */}
      <aside className="w-80 bg-[#003087] text-white p-6 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Mes offres d'emploi
          </h2>
        </div>

        {/* Liste des offres d'emploi */}
        <div className="space-y-3 mb-6">
          {jobOffers.length === 0 ? (
            <p className="text-sm text-white/70">Aucune offre d'emploi</p>
          ) : (
            <>
              {/* Option "Tous les candidats" */}
              <button
                onClick={() => {
                  setSelectedJobOffer("all");
                  setShowFilters(false);
                }}
                className={cn(
                  "w-full text-left p-3 rounded-lg border-2 transition-all",
                  selectedJobOffer === "all"
                    ? "bg-white/20 border-white/40 shadow-lg"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                )}
              >
                <div className="font-semibold text-sm">Tous les candidats</div>
                <div className="text-xs text-white/70 mt-1">Voir tous les profils</div>
              </button>

              {/* Offres d'emploi */}
              {jobOffers.map((offer) => (
                <button
                  key={offer.id}
                  onClick={() => {
                    setSelectedJobOffer(offer.id);
                    handleCalculateMatches();
                  }}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border-2 transition-all",
                    selectedJobOffer === offer.id
                      ? "bg-white/20 border-white/40 shadow-lg"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  )}
                >
                  <div className="font-semibold text-sm">{offer.title}</div>
                  <div className="text-xs text-white/70 mt-1">Voir les matchings</div>
                </button>
              ))}
            </>
          )}
        </div>

        {/* Filtre par % de matching - Affiché si une offre est sélectionnée */}
        {selectedJobOffer && selectedJobOffer !== "all" && (
          <div className="mb-6 p-4 bg-white/10 rounded-lg border border-white/20">
            <label className="block text-sm font-medium mb-2">Score de matching</label>
            <Select value={matchRange} onValueChange={setMatchRange}>
              <SelectTrigger className="bg-white text-gray-900 border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les scores</SelectItem>
                <SelectItem value="90-100">90-100%</SelectItem>
                <SelectItem value="80-89">80-89%</SelectItem>
                <SelectItem value="70-79">70-79%</SelectItem>
                <SelectItem value="60-69">60-69%</SelectItem>
                <SelectItem value="50-59">50-59%</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Bouton "Gérer mes filtres" */}
        <div className="mb-4">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="w-full border-white/30 text-white hover:bg-white/10 flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Gérer mes filtres
            </span>
            {showFilters ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Filtres de recherche - Affichés seulement si showFilters est true */}
        {showFilters && (
          <div className="space-y-4 pt-4 border-t border-white/20">
            {/* Recherche textuelle */}
            <div>
              <label className="block text-sm font-medium mb-2">Recherche</label>
              <Input
                placeholder="Nom, compétences..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white text-gray-900 border-gray-300"
              />
            </div>

            {/* Localisation */}
            <div>
              <label className="block text-sm font-medium mb-2">Ville</label>
              <Input
                placeholder="Ex: Paris, Lyon..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-white text-gray-900 border-gray-300"
              />
            </div>

            {/* Âge */}
            <div>
              <label className="block text-sm font-medium mb-2">Âge</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={ageMin}
                  onChange={(e) => setAgeMin(e.target.value)}
                  className="bg-white text-gray-900 border-gray-300"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={ageMax}
                  onChange={(e) => setAgeMax(e.target.value)}
                  className="bg-white text-gray-900 border-gray-300"
                />
              </div>
            </div>

            {/* Compétences */}
            <div>
              <label className="block text-sm font-medium mb-2">Compétences</label>
              <Input
                placeholder="Ex: JavaScript, Python..."
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="bg-white text-gray-900 border-gray-300"
              />
            </div>

            {/* Bouton réinitialiser */}
            <Button
              onClick={clearFilters}
              variant="outline"
              className="w-full border-white/30 text-white hover:bg-white/10"
            >
              <X className="mr-2 h-4 w-4" />
              Réinitialiser
            </Button>
          </div>
        )}
      </aside>

      {/* Zone principale - Liste des candidats */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Rechercher un candidat</h1>
          <p className="text-gray-600">
            {candidates.length} candidat{candidates.length > 1 ? "s" : ""} trouvé{candidates.length > 1 ? "s" : ""}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600">Chargement...</div>
          </div>
        ) : candidates.length === 0 ? (
          <Card className="border-gray-200 bg-white">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="mb-4 h-12 w-12 text-gray-400" />
              <p className="text-gray-600">Aucun candidat trouvé</p>
              <p className="text-sm text-gray-500 mt-2">Essayez de modifier vos critères de recherche</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {candidates.map((candidate) => (
              <Link
                key={candidate.user_id}
                href={`/beyond-connect-app/companies/candidates/${candidate.user_id}${selectedJobOffer ? `?job_offer_id=${selectedJobOffer}` : ""}`}
              >
                <Card className="border-gray-200 bg-white transition-all hover:shadow-lg cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="h-16 w-16 rounded-full bg-[#003087] flex items-center justify-center text-white text-xl font-semibold">
                        {candidate.avatar_url ? (
                          <img
                            src={candidate.avatar_url}
                            alt={candidate.full_name || candidate.email}
                            className="h-16 w-16 rounded-full object-cover"
                          />
                        ) : (
                          (candidate.first_name?.charAt(0) || candidate.email.charAt(0).toUpperCase())
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {candidate.full_name || `${candidate.first_name || ""} ${candidate.last_name || ""}`.trim() || candidate.email}
                        </h3>
                        <p className="text-sm text-gray-600">{candidate.email}</p>
                      </div>
                    </div>

                    {candidate.match_score !== undefined && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Score de matching</span>
                          <span className="text-lg font-bold text-[#003087]">{candidate.match_score}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-[#003087] h-2 rounded-full"
                            style={{ width: `${candidate.match_score}%` }}
                          />
                        </div>
                        {candidate.skills_match !== undefined && (
                          <div className="mt-2 text-xs text-gray-600">
                            Compétences: {candidate.skills_match}% | Expérience: {candidate.experience_match}% | Formation: {candidate.education_match}%
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {candidate.experiences_count} exp.
                      </div>
                      <div className="flex items-center gap-1">
                        <GraduationCap className="h-4 w-4" />
                        {candidate.education_count} form.
                      </div>
                      <div className="flex items-center gap-1">
                        <Code className="h-4 w-4" />
                        {candidate.skills_count} comp.
                      </div>
                      <div className="flex items-center gap-1">
                        <Trophy className="h-4 w-4" />
                        {candidate.badges_count} badges
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

