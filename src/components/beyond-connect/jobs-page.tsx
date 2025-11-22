"use client";

import { useState, useEffect } from "react";
import { Briefcase, MapPin, Clock, Euro, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type JobOffer = {
  id: string;
  title: string;
  description: string;
  contract_type: string;
  location?: string;
  remote_allowed: boolean;
  salary_min?: number;
  salary_max?: number;
  currency: string;
  company: {
    id: string;
    name: string;
    logo_url?: string;
  };
  created_at: string;
  application_deadline?: string;
};

export function BeyondConnectJobsPageContent() {
  const [jobOffers, setJobOffers] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterContract, setFilterContract] = useState<string>("all");

  useEffect(() => {
    loadJobOffers();
  }, []);

  const loadJobOffers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/beyond-connect/job-offers/public");
      if (response.ok) {
        const data = await response.json();
        setJobOffers(data.jobOffers || []);
      }
    } catch (error) {
      console.error("[beyond-connect/jobs] Error loading job offers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOffers = jobOffers.filter(offer => {
    const matchesSearch = !searchTerm || 
      offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.company.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesContract = filterContract === "all" || offer.contract_type === filterContract;
    
    return matchesSearch && matchesContract;
  });

  const contractTypes = [
    { value: "all", label: "Tous" },
    { value: "stage", label: "Stage" },
    { value: "alternance", label: "Alternance" },
    { value: "cdi", label: "CDI" },
    { value: "cdd", label: "CDD" },
    { value: "freelance", label: "Freelance" },
  ];

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">Offres d'emploi</h1>
          <p className="text-lg text-gray-600">
            Découvrez les opportunités de stage, alternance, CDI et CDD
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Rechercher une offre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-300"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={filterContract}
                onChange={(e) => setFilterContract(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                {contractTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Job Offers List */}
        {filteredOffers.length === 0 ? (
          <Card className="border-gray-200 bg-white">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="mb-4 h-12 w-12 text-gray-400" />
              <p className="text-gray-600">Aucune offre trouvée</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOffers.map((offer) => (
              <Card key={offer.id} className="border-gray-200 bg-white transition-all hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <h3 className="text-xl font-semibold text-gray-900">{offer.title}</h3>
                        <Badge className="bg-[#003087] text-white capitalize">
                          {offer.contract_type}
                        </Badge>
                      </div>
                      <p className="mb-4 text-gray-700">{offer.company.name}</p>
                      <p className="mb-4 line-clamp-2 text-gray-600">{offer.description}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        {offer.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {offer.location}
                          </span>
                        )}
                        {offer.remote_allowed && (
                          <Badge variant="outline" className="border-green-600 text-green-600">
                            Télétravail possible
                          </Badge>
                        )}
                        {(offer.salary_min || offer.salary_max) && (
                          <span className="flex items-center gap-1">
                            <Euro className="h-4 w-4" />
                            {offer.salary_min && offer.salary_max
                              ? `${offer.salary_min} - ${offer.salary_max} ${offer.currency}`
                              : offer.salary_min
                              ? `À partir de ${offer.salary_min} ${offer.currency}`
                              : `Jusqu'à ${offer.salary_max} ${offer.currency}`}
                          </span>
                        )}
                        {offer.application_deadline && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Clôture: {new Date(offer.application_deadline).toLocaleDateString("fr-FR")}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link href={`/beyond-connect-app/jobs/${offer.id}`}>
                      <Button className="bg-[#003087] hover:bg-[#002a6b] text-white">
                        Voir l'offre
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

