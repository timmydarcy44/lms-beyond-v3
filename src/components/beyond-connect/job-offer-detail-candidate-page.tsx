"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  MapPin,
  Clock,
  Euro,
  Calendar,
  Building2,
  CheckCircle,
  Send,
  ArrowLeft,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";

type JobOfferDetailCandidatePageProps = {
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
  currency: string;
  hours_per_week?: number;
  required_skills?: string[];
  required_soft_skills?: string[];
  required_experience?: string;
  required_education?: string;
  benefits?: string[];
  application_deadline?: string;
  company: {
    id: string;
    name: string;
    logo_url?: string;
    description?: string;
  };
  created_at: string;
  has_applied?: boolean;
};

export function JobOfferDetailCandidatePage({
  jobOfferId,
  userId,
}: JobOfferDetailCandidatePageProps) {
  const router = useRouter();
  const [jobOffer, setJobOffer] = useState<JobOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    loadJobOffer();
    checkApplication();
  }, [jobOfferId, userId]);

  const loadJobOffer = async () => {
    try {
      const response = await fetch(`/api/beyond-connect/job-offers/public/${jobOfferId}`);
      if (response.ok) {
        const data = await response.json();
        setJobOffer(data.jobOffer);
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || "Erreur lors du chargement de l'offre");
      }
    } catch (error) {
      console.error("[job-offer-detail] Error:", error);
      toast.error("Erreur lors du chargement de l'offre");
    } finally {
      setLoading(false);
    }
  };

  const checkApplication = async () => {
    try {
      const response = await fetch(
        `/api/beyond-connect/job-offers/${jobOfferId}/applications?check=true`
      );
      if (response.ok) {
        const data = await response.json();
        setHasApplied(data.hasApplied || false);
        if (data.application?.cover_letter) {
          setCoverLetter(data.application.cover_letter);
        }
      }
    } catch (error) {
      console.error("[job-offer-detail] Error checking application:", error);
    }
  };

  const handleApply = async () => {
    if (!coverLetter.trim()) {
      toast.error("Veuillez rédiger une lettre de motivation");
      return;
    }

    setApplying(true);
    try {
      const response = await fetch(
        `/api/beyond-connect/job-offers/${jobOfferId}/applications`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cover_letter: coverLetter }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la candidature");
      }

      toast.success("Candidature envoyée avec succès !");
      setHasApplied(true);
      router.push("/beyond-connect-app/applications");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la candidature");
    } finally {
      setApplying(false);
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
        <Card className="border-gray-200 bg-white">
          <CardContent className="p-12 text-center">
            <p className="text-gray-600">Offre non trouvée</p>
            <Link href="/beyond-connect-app/jobs">
              <Button className="mt-4 bg-[#003087] hover:bg-[#002a6b] text-white">
                Retour aux offres
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const contractTypeLabels: Record<string, string> = {
    stage: "Stage",
    alternance: "Alternance",
    cdi: "CDI",
    cdd: "CDD",
    freelance: "Freelance",
    interim: "Intérim",
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Back button */}
        <Link href="/beyond-connect-app/jobs">
          <Button variant="ghost" className="mb-6 text-[#003087] hover:bg-gray-100">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux offres
          </Button>
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <Card className="border-gray-200 bg-white">
              <CardContent className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <h1 className="mb-2 text-3xl font-bold text-gray-900">{jobOffer.title}</h1>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-gray-400" />
                      <span className="text-lg text-gray-700">{jobOffer.company.name}</span>
                    </div>
                  </div>
                  <Badge className="bg-[#003087] text-white capitalize">
                    {contractTypeLabels[jobOffer.contract_type] || jobOffer.contract_type}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  {jobOffer.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {jobOffer.location}
                    </span>
                  )}
                  {jobOffer.remote_allowed && (
                    <Badge variant="outline" className="border-green-600 text-green-600">
                      Télétravail possible
                    </Badge>
                  )}
                  {(jobOffer.salary_min || jobOffer.salary_max) && (
                    <span className="flex items-center gap-1">
                      <Euro className="h-4 w-4" />
                      {jobOffer.salary_min && jobOffer.salary_max
                        ? `${jobOffer.salary_min} - ${jobOffer.salary_max} ${jobOffer.currency}`
                        : jobOffer.salary_min
                        ? `À partir de ${jobOffer.salary_min} ${jobOffer.currency}`
                        : `Jusqu'à ${jobOffer.salary_max} ${jobOffer.currency}`}
                    </span>
                  )}
                  {jobOffer.hours_per_week && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {jobOffer.hours_per_week}h/semaine
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="text-gray-900">Description du poste</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: jobOffer.description }}
                />
              </CardContent>
            </Card>

            {/* Company presentation */}
            {jobOffer.company_presentation && (
              <Card className="border-gray-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-gray-900">Présentation de l'entreprise</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="prose max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: jobOffer.company_presentation }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Requirements */}
            <Card className="border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="text-gray-900">Profil recherché</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {jobOffer.required_skills && jobOffer.required_skills.length > 0 && (
                  <div>
                    <h4 className="mb-2 font-semibold text-gray-900">Compétences requises</h4>
                    <div className="flex flex-wrap gap-2">
                      {jobOffer.required_skills.map((skill, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-blue-100 text-blue-800">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {jobOffer.required_experience && (
                  <div>
                    <h4 className="mb-2 font-semibold text-gray-900">Expérience</h4>
                    <p className="text-gray-700 capitalize">{jobOffer.required_experience}</p>
                  </div>
                )}

                {jobOffer.required_education && (
                  <div>
                    <h4 className="mb-2 font-semibold text-gray-900">Formation</h4>
                    <p className="text-gray-700">{jobOffer.required_education}</p>
                  </div>
                )}

                {jobOffer.benefits && jobOffer.benefits.length > 0 && (
                  <div>
                    <h4 className="mb-2 font-semibold text-gray-900">Avantages</h4>
                    <ul className="list-disc space-y-1 pl-5 text-gray-700">
                      {jobOffer.benefits.map((benefit, idx) => (
                        <li key={idx}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Application card */}
            <Card className="sticky top-6 border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="text-gray-900">Candidater</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasApplied ? (
                  <div className="rounded-lg bg-green-50 p-4 text-center">
                    <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-600" />
                    <p className="font-semibold text-green-900">Candidature envoyée</p>
                    <p className="text-sm text-green-700">
                      Votre candidature a été transmise à l'entreprise
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="cover_letter">Lettre de motivation *</Label>
                      <Textarea
                        id="cover_letter"
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        placeholder="Présentez-vous et expliquez pourquoi vous êtes intéressé(e) par ce poste..."
                        rows={8}
                        className="mt-1"
                      />
                    </div>

                    {jobOffer.application_deadline && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Clôture: {new Date(jobOffer.application_deadline).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    )}

                    <Button
                      onClick={handleApply}
                      disabled={applying || !coverLetter.trim()}
                      className="w-full bg-[#003087] hover:bg-[#002a6b] text-white"
                    >
                      {applying ? (
                        "Envoi en cours..."
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Envoyer ma candidature
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Quick info */}
            <Card className="border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Publiée le {new Date(jobOffer.created_at).toLocaleDateString("fr-FR")}</span>
                </div>
                {jobOffer.application_deadline && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Clôture: {new Date(jobOffer.application_deadline).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

