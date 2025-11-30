"use client";

import { useState, useEffect } from "react";
import { Search, Filter, MapPin, Calendar, Code, Brain, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

type Candidate = {
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  birth_date?: string;
  location?: string;
  skills: Array<{
    id: string;
    name: string;
    category?: string;
    level?: string;
  }>;
  soft_skills?: Array<{
    dimension: string;
    score: number;
  }>;
  created_at: string;
};

const SOFT_SKILLS_LABELS: Record<string, string> = {
  gestion_emotions_stress: "Gestion des émotions & du stress",
  communication_influence: "Communication & influence",
  perseverance_action: "Persévérance & passage à l'action",
  organisation_priorites: "Organisation, temps & priorités",
  empathie_ecoute_active: "Empathie & écoute active",
  resolution_problemes: "Résolution de problèmes & pensée critique",
  collaboration_conflits: "Collaboration & gestion des conflits",
  creativite_adaptabilite: "Créativité & adaptabilité",
  leadership_vision: "Leadership & vision",
  confiance_decision: "Confiance en soi & prise de décision",
};

export function BeyondConnectCandidatesAdminPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtres
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedAgeMin, setSelectedAgeMin] = useState<string>("all");
  const [selectedAgeMax, setSelectedAgeMax] = useState<string>("all");
  const [selectedSkill, setSelectedSkill] = useState<string>("all");
  const [selectedSoftSkill, setSelectedSoftSkill] = useState<string>("all");
  
  // Options de filtres
  const [cities, setCities] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);

  useEffect(() => {
    loadCandidates();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [candidates, searchQuery, selectedCity, selectedAgeMin, selectedAgeMax, selectedSkill, selectedSoftSkill]);

  const loadCandidates = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/beyond-connect/admin/candidates");
      if (response.ok) {
        const data = await response.json();
        setCandidates(data.candidates || []);
        
        // Extraire les villes uniques
        const uniqueCities = Array.from(
          new Set(
            data.candidates
              ?.map((c: Candidate) => c.location)
              .filter((city: string | undefined): city is string => !!city) || []
          )
        ).sort() as string[];
        setCities(uniqueCities);
        
        // Extraire les compétences uniques
        const allSkills = new Set<string>();
        data.candidates?.forEach((c: Candidate) => {
          c.skills?.forEach((skill) => {
            allSkills.add(skill.name);
          });
        });
        setSkills(Array.from(allSkills).sort());
      }
    } catch (error) {
      console.error("[candidates-admin] Error loading candidates:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const applyFilters = () => {
    let filtered = [...candidates];

    // Recherche textuelle
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.full_name?.toLowerCase().includes(query) ||
          c.first_name?.toLowerCase().includes(query) ||
          c.last_name?.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query)
      );
    }

    // Filtre par ville
    if (selectedCity !== "all") {
      filtered = filtered.filter((c) => c.location === selectedCity);
    }

    // Filtre par âge
    if (selectedAgeMin !== "all") {
      const minAge = parseInt(selectedAgeMin);
      filtered = filtered.filter((c) => {
        const age = calculateAge(c.birth_date);
        return age !== null && age >= minAge;
      });
    }
    if (selectedAgeMax !== "all") {
      const maxAge = parseInt(selectedAgeMax);
      filtered = filtered.filter((c) => {
        const age = calculateAge(c.birth_date);
        return age !== null && age <= maxAge;
      });
    }

    // Filtre par compétence
    if (selectedSkill !== "all") {
      filtered = filtered.filter((c) =>
        c.skills?.some((skill) => skill.name === selectedSkill)
      );
    }

    // Filtre par soft skill
    if (selectedSoftSkill !== "all") {
      filtered = filtered.filter((c) =>
        c.soft_skills?.some((ss) => ss.dimension === selectedSoftSkill)
      );
    }

    setFilteredCandidates(filtered);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCity("all");
    setSelectedAgeMin("all");
    setSelectedAgeMax("all");
    setSelectedSkill("all");
    setSelectedSoftSkill("all");
  };

  const hasActiveFilters =
    searchQuery ||
    selectedCity !== "all" ||
    selectedAgeMin !== "all" ||
    selectedAgeMax !== "all" ||
    selectedSkill !== "all" ||
    selectedSoftSkill !== "all";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Gestion des candidats Beyond Connect
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {filteredCandidates.length} candidat{filteredCandidates.length > 1 ? "s" : ""} trouvé{filteredCandidates.length > 1 ? "s" : ""}
            {hasActiveFilters && ` (${candidates.length} au total)`}
          </p>
        </div>

        {/* Filtres */}
        <Card className="border-gray-200 bg-white mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-[#003087]" />
              <h2 className="text-lg font-semibold text-gray-900">Filtres</h2>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="ml-auto text-xs sm:text-sm"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Réinitialiser
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Recherche */}
              <div className="sm:col-span-2 lg:col-span-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher par nom, prénom ou email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Ville */}
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                  Ville
                </label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les villes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les villes</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Âge min */}
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                  Âge minimum
                </label>
                <Select value={selectedAgeMin} onValueChange={setSelectedAgeMin}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    {[18, 20, 25, 30, 35, 40, 45, 50].map((age) => (
                      <SelectItem key={age} value={age.toString()}>
                        {age} ans
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Âge max */}
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                  Âge maximum
                </label>
                <Select value={selectedAgeMax} onValueChange={setSelectedAgeMax}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    {[25, 30, 35, 40, 45, 50, 60, 100].map((age) => (
                      <SelectItem key={age} value={age.toString()}>
                        {age} ans
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Compétence */}
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                  Compétence
                </label>
                <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les compétences" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les compétences</SelectItem>
                    {skills.map((skill) => (
                      <SelectItem key={skill} value={skill}>
                        {skill}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Soft skill */}
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                  Soft skill
                </label>
                <Select value={selectedSoftSkill} onValueChange={setSelectedSoftSkill}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les soft skills" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les soft skills</SelectItem>
                    {Object.entries(SOFT_SKILLS_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des candidats */}
        {filteredCandidates.length === 0 ? (
          <Card className="border-gray-200 bg-white">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-600 mb-4">Aucun candidat trouvé</p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Réinitialiser les filtres
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredCandidates.map((candidate) => {
              const age = calculateAge(candidate.birth_date);
              const initials =
                candidate.first_name?.charAt(0) ||
                candidate.email.charAt(0).toUpperCase() || "?";

              return (
                <Card
                  key={candidate.user_id}
                  className="border-gray-200 bg-white hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-4 sm:p-6">
                    <Link
                      href={`/beyond-connect-app/companies/candidates/${candidate.user_id}`}
                      className="block"
                    >
                      <div className="flex items-start gap-3 sm:gap-4 mb-4">
                        {candidate.avatar_url ? (
                          <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full overflow-hidden flex-shrink-0 border-2 border-[#003087]">
                            <img
                              src={candidate.avatar_url}
                              alt={candidate.full_name || candidate.email}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-[#003087] flex items-center justify-center text-white text-xl sm:text-2xl font-semibold flex-shrink-0">
                            {initials}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base sm:text-lg text-gray-900 truncate">
                            {candidate.full_name ||
                              `${candidate.first_name || ""} ${candidate.last_name || ""}`.trim() ||
                              candidate.email}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">
                            {candidate.email}
                          </p>
                          {age && (
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {age} ans
                            </p>
                          )}
                        </div>
                      </div>

                      {candidate.location && (
                        <div className="mb-3 flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate">{candidate.location}</span>
                        </div>
                      )}

                      {candidate.skills && candidate.skills.length > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center gap-1 mb-2 text-xs font-medium text-gray-700">
                            <Code className="h-3 w-3" />
                            Compétences
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {candidate.skills.slice(0, 3).map((skill) => (
                              <Badge
                                key={skill.id}
                                variant="outline"
                                className="text-xs border-[#003087] text-[#003087]"
                              >
                                {skill.name}
                              </Badge>
                            ))}
                            {candidate.skills.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{candidate.skills.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {candidate.soft_skills && candidate.soft_skills.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1 mb-2 text-xs font-medium text-gray-700">
                            <Brain className="h-3 w-3" />
                            Soft skills
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {candidate.soft_skills.slice(0, 2).map((ss, idx) => (
                              <Badge
                                key={idx}
                                className="text-xs bg-blue-100 text-blue-800"
                              >
                                {SOFT_SKILLS_LABELS[ss.dimension] || ss.dimension}: {ss.score}%
                              </Badge>
                            ))}
                            {candidate.soft_skills.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{candidate.soft_skills.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

