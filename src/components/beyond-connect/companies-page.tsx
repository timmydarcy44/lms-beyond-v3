"use client";

import { useState, useEffect } from "react";
import { Briefcase, Users, Search, Plus, Eye, FileText, TrendingUp, Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type BeyondConnectCompaniesPageProps = {
  userId: string;
};

type Company = {
  id: string;
  name: string;
  description?: string;
  is_premium: boolean;
};

type JobOffer = {
  id: string;
  title: string;
  contract_type: string;
  location?: string;
  is_active: boolean;
  views_count: number;
  applications_count: number;
  created_at: string;
};

type Match = {
  id: string;
  user_id: string;
  job_offer_id?: string;
  match_score: number;
  profiles?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    avatar_url?: string;
  };
  beyond_connect_job_offers?: {
    id: string;
    title: string;
    contract_type: string;
  };
};

export function BeyondConnectCompaniesPageContent({ userId }: BeyondConnectCompaniesPageProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "jobs" | "cv-library" | "matches">("overview");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobOffers, setJobOffers] = useState<JobOffer[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Charger les entreprises de l'utilisateur
      const companiesResponse = await fetch("/api/beyond-connect/companies");
      if (companiesResponse.ok) {
        const companiesData = await companiesResponse.json();
        setCompanies(companiesData.companies || []);
        console.log("[beyond-connect/companies] Companies loaded:", companiesData.companies?.length || 0);
      } else {
        console.error("[beyond-connect/companies] Error loading companies:", companiesResponse.status);
        setCompanies([]);
      }

      // Charger les offres d'emploi
      const jobOffersResponse = await fetch("/api/beyond-connect/job-offers");
      if (jobOffersResponse.ok) {
        const jobOffersData = await jobOffersResponse.json();
        let loadedOffers = jobOffersData.jobOffers || [];
        
        // Si aucune offre, utiliser des données mock
        if (loadedOffers.length === 0) {
          loadedOffers = [
            {
              id: "mock-1",
              title: "Développeur Full Stack",
              contract_type: "cdi",
              location: "Paris",
              is_active: true,
              views_count: 45,
              applications_count: 12,
              created_at: new Date().toISOString(),
            },
            {
              id: "mock-2",
              title: "Stage Marketing Digital",
              contract_type: "stage",
              location: "Lyon",
              is_active: true,
              views_count: 32,
              applications_count: 8,
              created_at: new Date().toISOString(),
            },
            {
              id: "mock-3",
              title: "Alternance Data Analyst",
              contract_type: "alternance",
              location: "Remote",
              is_active: true,
              views_count: 28,
              applications_count: 15,
              created_at: new Date().toISOString(),
            },
          ];
        }
        setJobOffers(loadedOffers);
        console.log("[beyond-connect/companies] Job offers loaded:", loadedOffers.length);
      } else {
        console.error("[beyond-connect/companies] Error loading job offers:", jobOffersResponse.status);
        setJobOffers([]);
      }

      // Charger les matchings
      const matchesResponse = await fetch("/api/beyond-connect/matches");
      if (matchesResponse.ok) {
        const matchesData = await matchesResponse.json();
        let loadedMatches = matchesData.matches || [];
        
        // Si aucun matching et que l'entreprise est premium, utiliser des données mock
        const isPremium = companies.some(c => c.is_premium);
        if (loadedMatches.length === 0 && isPremium) {
          loadedMatches = [
            {
              id: "match-1",
              user_id: "user-1",
              match_score: 92,
              profiles: {
                id: "user-1",
                email: "alex.dupont@example.com",
                first_name: "Alex",
                last_name: "Dupont",
                full_name: "Alex Dupont",
              },
              beyond_connect_job_offers: {
                id: "job-1",
                title: "Développeur Full Stack",
                contract_type: "cdi",
              },
            },
            {
              id: "match-2",
              user_id: "user-2",
              match_score: 87,
              profiles: {
                id: "user-2",
                email: "sarah.bernard@example.com",
                first_name: "Sarah",
                last_name: "Bernard",
                full_name: "Sarah Bernard",
              },
              beyond_connect_job_offers: {
                id: "job-2",
                title: "Stage Marketing Digital",
                contract_type: "stage",
              },
            },
            {
              id: "match-3",
              user_id: "user-3",
              match_score: 85,
              profiles: {
                id: "user-3",
                email: "thomas.leroy@example.com",
                first_name: "Thomas",
                last_name: "Leroy",
                full_name: "Thomas Leroy",
              },
              beyond_connect_job_offers: {
                id: "job-1",
                title: "Développeur Full Stack",
                contract_type: "cdi",
              },
            },
            {
              id: "match-4",
              user_id: "user-4",
              match_score: 83,
              profiles: {
                id: "user-4",
                email: "marie.martin@example.com",
                first_name: "Marie",
                last_name: "Martin",
                full_name: "Marie Martin",
              },
              beyond_connect_job_offers: {
                id: "job-3",
                title: "Alternance Data Analyst",
                contract_type: "alternance",
              },
            },
            {
              id: "match-5",
              user_id: "user-5",
              match_score: 80,
              profiles: {
                id: "user-5",
                email: "lucas.dubois@example.com",
                first_name: "Lucas",
                last_name: "Dubois",
                full_name: "Lucas Dubois",
              },
              beyond_connect_job_offers: {
                id: "job-2",
                title: "Stage Marketing Digital",
                contract_type: "stage",
              },
            },
            {
              id: "match-6",
              user_id: "user-6",
              match_score: 78,
              profiles: {
                id: "user-6",
                email: "emma.roux@example.com",
                first_name: "Emma",
                last_name: "Roux",
                full_name: "Emma Roux",
              },
              beyond_connect_job_offers: {
                id: "job-1",
                title: "Développeur Full Stack",
                contract_type: "cdi",
              },
            },
          ];
        }
        setMatches(loadedMatches);
        console.log("[beyond-connect/companies] Matches loaded:", loadedMatches.length);
      } else {
        console.error("[beyond-connect/companies] Error loading matches:", matchesResponse.status);
        setMatches([]);
      }
    } catch (error) {
      console.error("[beyond-connect/companies] Error loading data:", error);
      setCompanies([]);
      setJobOffers([]);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Header déjà géré par le layout parent */}
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">Espace Entreprises</h1>
          <p className="text-lg text-gray-600">
            Gérez vos offres d'emploi, votre CVthèque et découvrez des profils correspondants
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#003087] data-[state=active]:text-white">
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="jobs" className="data-[state=active]:bg-[#003087] data-[state=active]:text-white">
              Offres d'emploi
            </TabsTrigger>
            <TabsTrigger value="cv-library" className="data-[state=active]:bg-[#003087] data-[state=active]:text-white">
              CVthèque
            </TabsTrigger>
            <TabsTrigger value="matches" className="data-[state=active]:bg-[#003087] data-[state=active]:text-white">
              Matchings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-gray-200 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <Briefcase className="h-4 w-4 text-[#003087]" />
                    Offres actives
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    {jobOffers.filter(j => j.is_active).length}
                  </div>
                  <Link href="/beyond-connect-app/companies?tab=jobs" className="text-sm text-[#003087] hover:underline">
                    Voir toutes →
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-gray-200 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <Users className="h-4 w-4 text-[#003087]" />
                    Candidatures
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    {jobOffers.reduce((sum, j) => sum + j.applications_count, 0)}
                  </div>
                  <p className="text-sm text-gray-600">Total des candidatures</p>
                </CardContent>
              </Card>

              <Card className="border-gray-200 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <TrendingUp className="h-4 w-4 text-[#003087]" />
                    Profils en CVthèque
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">0</div>
                  <Link href="/beyond-connect-app/companies?tab=cv-library" className="text-sm text-[#003087] hover:underline">
                    Gérer →
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <Link 
                href="/beyond-connect-app/companies/jobs/new"
                className="block"
              >
                <Card className="cursor-pointer border-2 border-[#003087] bg-white transition-all hover:shadow-lg">
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#003087] text-white">
                      <Plus className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Créer une offre d'emploi</h3>
                      <p className="text-sm text-gray-600">Publiez une nouvelle offre (stage, alternance, CDI, CDD)</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-[#003087]" />
                  </CardContent>
                </Card>
              </Link>

              <Link href="/beyond-connect-app/companies/candidates">
                <Card className="cursor-pointer border-2 border-[#003087] bg-white transition-all hover:shadow-lg">
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#003087] text-white">
                      <Search className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Rechercher un candidat</h3>
                      <p className="text-sm text-gray-600">Trouvez les profils qui correspondent à vos critères</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-[#003087]" />
                  </CardContent>
                </Card>
              </Link>

              <Link href="/beyond-connect-app/companies/cv-library">
                <Card className="cursor-pointer border-2 border-gray-200 bg-white transition-all hover:border-[#003087] hover:shadow-lg">
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-[#003087]">
                      <Users className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Gérer la CVthèque</h3>
                      <p className="text-sm text-gray-600">Suivez les profils de jeunes talents</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </CardContent>
                </Card>
              </Link>
            </div>
          </TabsContent>

          <TabsContent value="jobs" className="mt-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Offres d'emploi</h2>
              <Link href="/beyond-connect-app/companies/jobs/new">
                <Button className="bg-[#003087] hover:bg-[#002a6b] text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle offre
                </Button>
              </Link>
            </div>

            {jobOffers.length === 0 ? (
              <Card className="border-gray-200 bg-white">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Briefcase className="mb-4 h-12 w-12 text-gray-400" />
                  <p className="mb-4 text-gray-600">Aucune offre d'emploi pour le moment</p>
                  <Link href="/beyond-connect-app/companies/jobs/new">
                    <Button className="bg-[#003087] hover:bg-[#002a6b] text-white">
                      Créer votre première offre
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {jobOffers.map((job) => (
                  <Card key={job.id} className="border-gray-200 bg-white">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                            <Badge variant={job.is_active ? "default" : "secondary"} className={job.is_active ? "bg-green-600" : ""}>
                              {job.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <div className="mb-2 flex items-center gap-4 text-sm text-gray-600">
                            <span className="capitalize">{job.contract_type}</span>
                            {job.location && <span>{job.location}</span>}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {job.views_count} vues
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              {job.applications_count} candidatures
                            </span>
                          </div>
                        </div>
                        <Link href={`/beyond-connect-app/companies/jobs/${job.id}`}>
                          <Button variant="outline" className="border-[#003087] text-[#003087] hover:bg-[#003087] hover:text-white">
                            Voir
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cv-library" className="mt-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">CVthèque</h2>
              <p className="mt-2 text-gray-600">Profils de jeunes talents que vous suivez</p>
            </div>

            <Card className="border-gray-200 bg-white">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="mb-4 h-12 w-12 text-gray-400" />
                <p className="mb-4 text-gray-600">Votre CVthèque est vide</p>
                <p className="text-sm text-gray-500">Ajoutez des profils depuis les matchings ou les candidatures</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="matches" className="mt-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Matchings Premium</h2>
              <p className="mt-2 text-gray-600">
                Découvrez les profils qui correspondent à vos offres d'emploi
              </p>
            </div>

            {companies.some(c => c.is_premium) ? (
              matches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {matches.map((match) => {
                    const profile = match.profiles;
                    const jobOffer = match.beyond_connect_job_offers;
                    const initials = profile?.first_name?.charAt(0) || profile?.email?.charAt(0).toUpperCase() || "?";
                    const fullName = profile?.full_name || `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || profile?.email || "Candidat";
                    
                    return (
                      <Card key={match.id} className="border-gray-200 bg-white hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4 mb-4">
                            <div className="h-12 w-12 rounded-full bg-[#003087] flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                              {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">{fullName}</h3>
                              <p className="text-sm text-gray-500 truncate">{profile?.email}</p>
                            </div>
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              {match.match_score}%
                            </Badge>
                          </div>
                          
                          {jobOffer && (
                            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs text-gray-500 mb-1">Offre correspondante</p>
                              <p className="font-medium text-sm text-gray-900">{jobOffer.title}</p>
                              <p className="text-xs text-gray-600 capitalize">{jobOffer.contract_type}</p>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <Link 
                              href={`/beyond-connect-app/companies/candidates/${match.user_id}${jobOffer ? `?job_offer_id=${jobOffer.id}` : ""}`}
                              className="text-sm text-[#003087] hover:underline font-medium"
                            >
                              Voir le profil
                            </Link>
                            <Button size="sm" variant="outline" className="border-[#003087] text-[#003087] hover:bg-[#003087] hover:text-white">
                              Contacter
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="border-gray-200 bg-white">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <TrendingUp className="mb-4 h-12 w-12 text-gray-400" />
                    <p className="mb-4 text-gray-600">Aucun matching pour le moment</p>
                    <p className="text-sm text-gray-500">
                      Les matchings apparaîtront ici lorsque des profils correspondront à vos offres
                    </p>
                  </CardContent>
                </Card>
              )
            ) : (
              <Card className="border-2 border-[#003087] bg-blue-50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Building2 className="h-8 w-8 text-[#003087]" />
                    <div className="flex-1">
                      <h3 className="mb-2 text-lg font-semibold text-gray-900">Passez en Premium</h3>
                      <p className="mb-4 text-gray-700">
                        Accédez au système de matching intelligent qui vous permet de découvrir automatiquement
                        les profils correspondant à vos offres d'emploi.
                      </p>
                      <Button className="bg-[#003087] hover:bg-[#002a6b] text-white">
                        En savoir plus
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

