"use client";

import { useState, useEffect } from "react";
import { Briefcase, MapPin, Clock, CheckCircle, XCircle, ClockIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type CandidateApplicationsPageProps = {
  userId: string;
};

type Application = {
  id: string;
  job_offer: {
    id: string;
    title: string;
    contract_type: string;
    location?: string;
    company: {
      id: string;
      name: string;
      logo_url?: string;
    };
  };
  status: string;
  cover_letter?: string;
  applied_at: string;
  updated_at: string;
};

export function CandidateApplicationsPage({ userId }: CandidateApplicationsPageProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, [userId]);

  const loadApplications = async () => {
    try {
      const response = await fetch("/api/beyond-connect/applications/my");
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
      }
    } catch (error) {
      console.error("[applications] Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const statusLabels: Record<string, string> = {
    pending: "En attente",
    reviewed: "En cours d'examen",
    accepted: "Acceptée",
    rejected: "Refusée",
    withdrawn: "Retirée",
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    reviewed: "bg-blue-100 text-blue-800",
    accepted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    withdrawn: "bg-gray-100 text-gray-800",
  };

  const statusIcons: Record<string, any> = {
    pending: ClockIcon,
    reviewed: ClockIcon,
    accepted: CheckCircle,
    rejected: XCircle,
    withdrawn: XCircle,
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
        <div className="mb-8">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">Mes candidatures</h1>
          <p className="text-lg text-gray-600">
            Suivez l'état de vos candidatures
          </p>
        </div>

        {applications.length === 0 ? (
          <Card className="border-gray-200 bg-white">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="mb-4 h-12 w-12 text-gray-400" />
              <p className="mb-4 text-gray-600">Aucune candidature pour le moment</p>
              <Link href="/beyond-connect-app/jobs">
                <Button className="bg-[#003087] hover:bg-[#002a6b] text-white">
                  Voir les offres d'emploi
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => {
              const StatusIcon = statusIcons[application.status] || ClockIcon;
              return (
                <Card key={application.id} className="border-gray-200 bg-white transition-all hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-3">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {application.job_offer.title}
                          </h3>
                          <Badge className="bg-[#003087] text-white capitalize">
                            {application.job_offer.contract_type}
                          </Badge>
                          <Badge className={statusColors[application.status] || "bg-gray-100 text-gray-800"}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {statusLabels[application.status] || application.status}
                          </Badge>
                        </div>
                        <p className="mb-2 text-gray-700">{application.job_offer.company.name}</p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          {application.job_offer.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {application.job_offer.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Candidaté le {new Date(application.applied_at).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                        {application.cover_letter && (
                          <div className="mt-4 rounded-lg bg-gray-50 p-4">
                            <p className="text-sm font-semibold text-gray-900">Lettre de motivation</p>
                            <p className="mt-1 line-clamp-2 text-sm text-gray-700">
                              {application.cover_letter}
                            </p>
                          </div>
                        )}
                      </div>
                      <Link href={`/beyond-connect-app/jobs/${application.job_offer.id}`}>
                        <Button variant="outline" className="ml-4">
                          Voir l'offre
                        </Button>
                      </Link>
                    </div>
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

