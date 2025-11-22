"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Briefcase, GraduationCap, Award, Code, Languages, Trophy, MapPin, Mail, Phone, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";

type CandidateProfilePageProps = {
  candidateUserId: string;
  jobOfferId?: string;
  viewerUserId: string;
};

type ProfileData = {
  profile: {
    user_id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    avatar_url?: string;
    phone?: string;
    birth_date?: string;
  };
  experiences: Array<{
    id: string;
    title: string;
    company: string;
    location?: string;
    start_date: string;
    end_date?: string;
    is_current: boolean;
    description?: string;
  }>;
  education: Array<{
    id: string;
    degree: string;
    institution: string;
    field_of_study?: string;
    start_date?: string;
    end_date?: string;
    grade?: string;
  }>;
  skills: Array<{
    id: string;
    name: string;
    category?: string;
    level?: string;
  }>;
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    issue_date?: string;
  }>;
  languages: Array<{
    id: string;
    language: string;
    level: string;
  }>;
  badges: Array<{
    badge_id: string;
    code: string;
    label: string;
    description?: string;
    earned_at: string;
  }>;
  testResults: Array<{
    test_id: string;
    test_title: string;
    score: number;
    completed_at: string;
  }>;
  matchData?: {
    match_score: number;
    skills_match: number;
    experience_match: number;
    education_match: number;
    details: {
      matched_skills: string[];
      missing_skills: string[];
    };
  };
};

export function CandidateProfilePage({ candidateUserId, jobOfferId, viewerUserId }: CandidateProfilePageProps) {
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [candidateUserId, jobOfferId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (jobOfferId) params.append("job_offer_id", jobOfferId);

      const response = await fetch(`/api/beyond-connect/candidates/${candidateUserId}?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
      }
    } catch (error) {
      console.error("[candidate-profile] Error loading profile:", error);
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

  if (!profileData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-gray-600">Profil non trouvé</div>
      </div>
    );
  }

  const { profile, experiences, education, skills, certifications, languages, badges, testResults, matchData } = profileData;

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

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header avec bouton retour */}
        <div className="mb-6">
          <Link href="/beyond-connect-app/companies/candidates">
            <Button variant="ghost" className="text-[#003087] hover:bg-gray-100">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à la recherche
            </Button>
          </Link>
        </div>

        {/* En-tête du profil */}
        <Card className="border-gray-200 bg-white mb-6">
          <CardContent className="p-8">
            <div className="flex items-start gap-6">
              <div className="h-32 w-32 rounded-full bg-[#003087] flex items-center justify-center text-white text-4xl font-semibold">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || profile.email}
                    className="h-32 w-32 rounded-full object-cover"
                  />
                ) : (
                  (profile.first_name?.charAt(0) || profile.email.charAt(0).toUpperCase())
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {profile.full_name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-4">
                  {profile.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {profile.email}
                    </span>
                  )}
                  {profile.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {profile.phone}
                    </span>
                  )}
                  {profile.birth_date && calculateAge(profile.birth_date) && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {calculateAge(profile.birth_date)} ans
                    </span>
                  )}
                </div>

                {/* Score de matching si disponible */}
                {matchData && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-[#003087]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900">Score de matching</span>
                      <span className="text-2xl font-bold text-[#003087]">{matchData.match_score}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div
                        className="bg-[#003087] h-3 rounded-full"
                        style={{ width: `${matchData.match_score}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm text-gray-700">
                      <div>Compétences: {matchData.skills_match}%</div>
                      <div>Expérience: {matchData.experience_match}%</div>
                      <div>Formation: {matchData.education_match}%</div>
                    </div>
                    {matchData.details.matched_skills.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700 mb-1">Compétences correspondantes:</p>
                        <div className="flex flex-wrap gap-1">
                          {matchData.details.matched_skills.map((skill, idx) => (
                            <Badge key={idx} className="bg-green-600 text-white">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {matchData.details.missing_skills.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700 mb-1">Compétences manquantes:</p>
                        <div className="flex flex-wrap gap-1">
                          {matchData.details.missing_skills.map((skill, idx) => (
                            <Badge key={idx} variant="outline" className="border-red-600 text-red-600">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grille de contenu */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Expériences */}
          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Briefcase className="h-5 w-5 text-[#003087]" />
                Expériences professionnelles
              </CardTitle>
            </CardHeader>
            <CardContent>
              {experiences.length === 0 ? (
                <p className="text-gray-600">Aucune expérience</p>
              ) : (
                <div className="space-y-4">
                  {experiences.map((exp) => (
                    <div key={exp.id} className="border-l-2 border-[#003087] pl-4">
                      <h3 className="font-semibold text-gray-900">{exp.title}</h3>
                      <p className="text-gray-700">{exp.company}</p>
                      {exp.location && (
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {exp.location}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        {new Date(exp.start_date).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })} -{" "}
                        {exp.is_current
                          ? "Aujourd'hui"
                          : exp.end_date
                          ? new Date(exp.end_date).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
                          : ""}
                      </p>
                      {exp.description && <p className="mt-2 text-sm text-gray-700">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Formation */}
          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <GraduationCap className="h-5 w-5 text-[#003087]" />
                Formation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {education.length === 0 ? (
                <p className="text-gray-600">Aucune formation</p>
              ) : (
                <div className="space-y-4">
                  {education.map((edu) => (
                    <div key={edu.id} className="border-l-2 border-[#003087] pl-4">
                      <h3 className="font-semibold text-gray-900">{edu.degree}</h3>
                      <p className="text-gray-700">{edu.institution}</p>
                      {edu.field_of_study && <p className="text-sm text-gray-600">{edu.field_of_study}</p>}
                      {edu.grade && <p className="text-sm text-gray-600">Note: {edu.grade}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Compétences */}
          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Code className="h-5 w-5 text-[#003087]" />
                Compétences
              </CardTitle>
            </CardHeader>
            <CardContent>
              {skills.length === 0 ? (
                <p className="text-gray-600">Aucune compétence</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <Badge key={skill.id} className="bg-[#003087] text-white">
                      {skill.name}
                      {skill.level && ` (${skill.level})`}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Langues */}
          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Languages className="h-5 w-5 text-[#003087]" />
                Langues
              </CardTitle>
            </CardHeader>
            <CardContent>
              {languages.length === 0 ? (
                <p className="text-gray-600">Aucune langue</p>
              ) : (
                <div className="space-y-2">
                  {languages.map((lang) => (
                    <div key={lang.id} className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{lang.language}</span>
                      <Badge variant="outline" className="border-[#003087] text-[#003087]">
                        {lang.level}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Open Badges */}
          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Trophy className="h-5 w-5 text-[#003087]" />
                Open Badges
              </CardTitle>
            </CardHeader>
            <CardContent>
              {badges.length === 0 ? (
                <p className="text-gray-600">Aucun badge</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {badges.map((badge) => (
                    <div key={badge.badge_id} className="p-3 border border-gray-200 rounded-lg">
                      <Trophy className="h-6 w-6 text-yellow-500 mb-2" />
                      <h4 className="font-semibold text-gray-900">{badge.label}</h4>
                      {badge.description && <p className="text-sm text-gray-600 mt-1">{badge.description}</p>}
                      <p className="text-xs text-gray-500 mt-2">
                        Obtenu le {new Date(badge.earned_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Résultats de tests */}
          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Award className="h-5 w-5 text-[#003087]" />
                Résultats de tests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <p className="text-gray-600">Aucun résultat de test</p>
              ) : (
                <div className="space-y-3">
                  {testResults.map((result) => (
                    <div key={result.test_id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-semibold text-gray-900">{result.test_title}</h4>
                        <p className="text-sm text-gray-600">
                          {new Date(result.completed_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <Badge className="bg-green-600 text-white text-lg">{result.score}%</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

