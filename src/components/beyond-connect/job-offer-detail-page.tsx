"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Edit, Eye, FileText, MapPin, Euro, Clock, Briefcase, User, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";

type JobOfferDetailPageProps = {
  jobOfferId: string;
  userId: string;
};

type JobOffer = {
  id: string;
  title: string;
  description: string;
  company_presentation?: string;
  contract_type: string;
  location?: string;
  remote_allowed: boolean;
  salary_min?: number;
  salary_max?: number;
  hours_per_week?: number;
  required_skills?: string[];
  required_soft_skills?: string[];
  required_experience?: string;
  required_education?: string;
  benefits?: string[];
  application_deadline?: string;
  is_active: boolean;
  views_count: number;
  applications_count: number;
  company: {
    id: string;
    name: string;
  };
  created_at: string;
};

type Application = {
  id: string;
  job_offer_id: string;
  user_id: string;
  cover_letter?: string;
  status: string;
  match_score?: number;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    avatar_url?: string;
  };
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

export function JobOfferDetailPage({ jobOfferId, userId }: JobOfferDetailPageProps) {
  const router = useRouter();
  const [jobOffer, setJobOffer] = useState<JobOffer | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobOffer();
    loadApplications();
  }, [jobOfferId]);

  const loadJobOffer = async () => {
    try {
      const response = await fetch(`/api/beyond-connect/job-offers/${jobOfferId}`);
      if (response.ok) {
        const data = await response.json();
        setJobOffer(data.jobOffer);
      }
    } catch (error) {
      console.error("[job-offer-detail] Error loading job offer:", error);
    }
  };

  const loadApplications = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/beyond-connect/job-offers/${jobOfferId}/applications`);
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
      }
    } catch (error) {
      console.error("[job-offer-detail] Error loading applications:", error);
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

  if (!jobOffer) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-gray-600">Offre non trouvée</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/beyond-connect-app/companies">
            <Button variant="ghost" className="text-[#003087] hover:bg-gray-100">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </Link>
        </div>

        {/* En-tête de l'offre */}
        <Card className="border-gray-200 bg-white mb-6">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{jobOffer.title}</h1>
                  <Badge variant={jobOffer.is_active ? "default" : "secondary"} className={jobOffer.is_active ? "bg-green-600" : ""}>
                    {jobOffer.is_active ? "Publiée" : "Brouillon"}
                  </Badge>
                </div>
                <p className="text-lg text-gray-700 mb-4">{jobOffer.company.name}</p>
              </div>
              <Link href={`/beyond-connect-app/companies/jobs/${jobOfferId}/edit`}>
                <Button variant="outline" className="border-[#003087] text-[#003087] hover:bg-[#003087] hover:text-white">
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </Button>
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-2 text-gray-600">
                <Briefcase className="h-5 w-5 text-[#003087]" />
                <span className="capitalize">{jobOffer.contract_type}</span>
              </div>
              {jobOffer.location && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-5 w-5 text-[#003087]" />
                  {jobOffer.location}
                </div>
              )}
              {jobOffer.remote_allowed && (
                <Badge variant="outline" className="border-green-600 text-green-600 w-fit">
                  Télétravail possible
                </Badge>
              )}
              {jobOffer.hours_per_week && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-5 w-5 text-[#003087]" />
                  {jobOffer.hours_per_week}h/semaine
                </div>
              )}
              {(jobOffer.salary_min || jobOffer.salary_max) && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Euro className="h-5 w-5 text-[#003087]" />
                  {jobOffer.salary_min && jobOffer.salary_max
                    ? `${jobOffer.salary_min} - ${jobOffer.salary_max} €`
                    : jobOffer.salary_min
                    ? `À partir de ${jobOffer.salary_min} €`
                    : `Jusqu'à ${jobOffer.salary_max} €`}
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {jobOffer.views_count} vues
              </span>
              <span className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {jobOffer.applications_count} candidatures
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Description de l'annonce */}
        <Card className="border-gray-200 bg-white mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900">Description de l'annonce</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{jobOffer.description || "Aucune description"}</p>
          </CardContent>
        </Card>

        {/* Présentation de l'entreprise */}
        {jobOffer.company_presentation && (
          <Card className="border-gray-200 bg-white mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Présentation de l'entreprise</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{jobOffer.company_presentation}</p>
            </CardContent>
          </Card>
        )}

        {/* Savoir-être */}
        {jobOffer.required_soft_skills && jobOffer.required_soft_skills.length > 0 && (
          <Card className="border-gray-200 bg-white mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Savoir-être recherchés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {jobOffer.required_soft_skills.map((skillId) => (
                  <Badge key={skillId} className="bg-[#003087] text-white">
                    {SOFT_SKILLS_LABELS[skillId] || skillId}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Savoir-faire */}
        {jobOffer.required_skills && jobOffer.required_skills.length > 0 && (
          <Card className="border-gray-200 bg-white mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Savoir-faire requis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {jobOffer.required_skills.map((skill, idx) => (
                  <Badge key={idx} variant="outline" className="border-[#003087] text-[#003087]">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expérience et formation */}
        {(jobOffer.required_experience || jobOffer.required_education) && (
          <Card className="border-gray-200 bg-white mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Profil recherché</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {jobOffer.required_experience && (
                <div>
                  <span className="font-medium text-gray-900">Expérience: </span>
                  <span className="text-gray-700 capitalize">
                    {jobOffer.required_experience === "junior" ? "Junior (0-2 ans)" :
                     jobOffer.required_experience === "mid" ? "Intermédiaire (2-5 ans)" :
                     jobOffer.required_experience === "senior" ? "Senior (5+ ans)" :
                     jobOffer.required_experience}
                  </span>
                </div>
              )}
              {jobOffer.required_education && (
                <div>
                  <span className="font-medium text-gray-900">Formation: </span>
                  <span className="text-gray-700">
                    {jobOffer.required_education === "bac" ? "Bac" :
                     jobOffer.required_education === "bac+2" ? "Bac+2 (BTS, DUT)" :
                     jobOffer.required_education === "bac+3" ? "Bac+3 (Licence)" :
                     jobOffer.required_education === "bac+5" ? "Bac+5 (Master)" :
                     jobOffer.required_education === "doctorat" ? "Doctorat" :
                     jobOffer.required_education}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Avantages */}
        {jobOffer.benefits && jobOffer.benefits.length > 0 && (
          <Card className="border-gray-200 bg-white mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Avantages</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {jobOffer.benefits.map((benefit, idx) => (
                  <li key={idx}>{benefit}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Date limite */}
        {jobOffer.application_deadline && (
          <Card className="border-gray-200 bg-white mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="h-5 w-5 text-[#003087]" />
                <span className="font-medium">Date limite de candidature: </span>
                <span>{new Date(jobOffer.application_deadline).toLocaleDateString("fr-FR")}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Candidatures */}
        <Card className="border-gray-200 bg-white">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900">
              Candidatures ({applications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-600">Chargement des candidatures...</div>
            ) : applications.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Aucune candidature pour le moment</p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((application) => {
                  const profile = application.profiles;
                  const initials = profile?.first_name?.charAt(0) || profile?.email?.charAt(0).toUpperCase() || "?";
                  const fullName = profile?.full_name || `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || profile?.email || "Candidat";
                  const matchScore = application.match_score || 0;
                  
                  return (
                    <div
                      key={application.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="h-12 w-12 rounded-full bg-[#003087] flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold text-gray-900">{fullName}</h3>
                              {matchScore > 0 && (
                                <Badge className={`${
                                  matchScore >= 80 ? "bg-green-100 text-green-800 border-green-200" :
                                  matchScore >= 60 ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
                                  "bg-gray-100 text-gray-800 border-gray-200"
                                }`}>
                                  {matchScore.toFixed(0)}% match
                                </Badge>
                              )}
                              <Badge variant="outline" className="capitalize">
                                {application.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{profile?.email}</p>
                            {application.cover_letter && (
                              <p className="text-sm text-gray-700 line-clamp-2">{application.cover_letter}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              Candidature du {new Date(application.created_at).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                        </div>
                        <Link href={`/beyond-connect-app/companies/candidates/${application.user_id}?job_offer_id=${jobOfferId}`}>
                          <Button variant="outline" className="border-[#003087] text-[#003087] hover:bg-[#003087] hover:text-white">
                            <Eye className="mr-2 h-4 w-4" />
                            Voir le profil
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

