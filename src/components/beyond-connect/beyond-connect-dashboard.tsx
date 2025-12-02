"use client";

import { useState, useEffect } from "react";
import { Plus, Briefcase, GraduationCap, Award, Code, Languages, Trophy, FileText, ArrowRight, Eye, Settings, Share2, Linkedin, BookOpen, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";
import { RecommendedFormationsSection } from "./recommended-formations-section";
import { getBeyondConnectBaseUrl } from "@/lib/beyond-connect/utils";

type BeyondConnectDashboardProps = {
  userId: string;
};

export function BeyondConnectDashboard({ userId }: BeyondConnectDashboardProps) {
  const [stats, setStats] = useState({
    experiences: 0,
    education: 0,
    skills: 0,
    certifications: 0,
    projects: 0,
    languages: 0,
    badges: 0,
    testResults: 0,
  });
  const [loading, setLoading] = useState(true);
  const [beyondNoSchoolTests, setBeyondNoSchoolTests] = useState<any[]>([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [isSoftSkillsCompleted, setIsSoftSkillsCompleted] = useState(false);

  const handleShareLinkedIn = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : getBeyondConnectBaseUrl();
    const profileUrl = `${baseUrl}/beyond-connect-app/profile/public`;
    const text = "Découvrez mon profil professionnel sur Beyond Connect !";
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}&summary=${encodeURIComponent(text)}`;
    window.open(linkedInUrl, '_blank', 'width=600,height=400');
  };

  useEffect(() => {
    loadStats();
    loadBeyondNoSchoolTests();
  }, [userId]);

  const loadBeyondNoSchoolTests = async () => {
    try {
      const response = await fetch("/api/beyond-connect/beyond-noschool-tests");
      if (response.ok) {
        const data = await response.json();
        setBeyondNoSchoolTests(data.tests || []);
        
        // Vérifier si le test Soft Skills est complété
        const softSkillsTest = (data.tests || []).find((test: any) => 
          test.title?.toLowerCase().includes("soft skills") || 
          test.title === "Soft Skills – Profil 360"
        );
        if (softSkillsTest && softSkillsTest.is_completed) {
          setIsSoftSkillsCompleted(true);
        }
      }
    } catch (error) {
      console.error("[beyond-connect] Error loading tests:", error);
    } finally {
      setLoadingTests(false);
    }
  };

  const loadStats = async () => {
    try {
      const [expRes, eduRes, skillsRes, certRes, projRes, langRes, badgesRes, testsRes] = await Promise.all([
        fetch("/api/beyond-connect/experiences").catch(() => ({ ok: false })),
        fetch("/api/beyond-connect/education").catch(() => ({ ok: false })),
        fetch("/api/beyond-connect/skills").catch(() => ({ ok: false })),
        fetch("/api/beyond-connect/certifications").catch(() => ({ ok: false })),
        fetch("/api/beyond-connect/projects").catch(() => ({ ok: false })),
        fetch("/api/beyond-connect/languages").catch(() => ({ ok: false })),
        fetch("/api/beyond-connect/badges").catch(() => ({ ok: false })),
        fetch("/api/beyond-connect/test-results").catch(() => ({ ok: false })),
      ]);

      setStats({
        experiences: expRes.ok && 'json' in expRes ? (await expRes.json()).experiences?.length || 0 : 0,
        education: eduRes.ok && 'json' in eduRes ? (await eduRes.json()).education?.length || 0 : 0,
        skills: skillsRes.ok && 'json' in skillsRes ? (await skillsRes.json()).skills?.length || 0 : 0,
        certifications: certRes.ok && 'json' in certRes ? (await certRes.json()).certifications?.length || 0 : 0,
        projects: projRes.ok && 'json' in projRes ? (await projRes.json()).projects?.length || 0 : 0,
        languages: langRes.ok && 'json' in langRes ? (await langRes.json()).languages?.length || 0 : 0,
        badges: badgesRes.ok && 'json' in badgesRes ? (await badgesRes.json()).badges?.length || 0 : 0,
        testResults: testsRes.ok && 'json' in testsRes ? (await testsRes.json()).results?.length || 0 : 0,
      });
    } catch (error) {
      console.error("[beyond-connect] Error loading stats:", error);
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
      <div className="mx-auto max-w-6xl px-6 py-16">
        {/* Header - Style Apple */}
        <div className="mb-20 text-center">
          <h1 className="mb-4 text-6xl font-semibold tracking-tight text-gray-900">Mon CV numérique</h1>
          <p className="text-xl text-gray-600">
            Gérez votre profil professionnel et vos compétences
          </p>
        </div>

        {/* Section : Boostez votre matching - Style Apple */}
        <section className="mb-20 bg-gray-50 py-16">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-4xl font-semibold tracking-tight text-gray-900">
                Boostez votre matching avec les recruteurs
              </h2>
              <p className="text-lg text-gray-600">
                Les profils avec <strong>test Soft Skills</strong> et <strong>Open Badges</strong> obtiennent jusqu'à <strong>40% de matching en plus</strong> et sont <strong>3x plus consultés</strong> par les recruteurs.
              </p>
            </div>
            <div className={`grid gap-6 ${isSoftSkillsCompleted ? 'md:grid-cols-1' : 'md:grid-cols-2'}`}>
              {!isSoftSkillsCompleted && (
                <Link href="/dashboard/apprenant/questionnaires">
                  <Card className="group h-full cursor-pointer border-0 bg-white p-8 shadow-sm transition-all hover:shadow-xl">
                    <div className="mb-6 flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 transition-all group-hover:bg-green-100">
                        <ClipboardCheck className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="mb-1 text-2xl font-semibold text-gray-900">Test Soft Skills</h3>
                        <p className="text-sm text-gray-500">+40% de matching</p>
                      </div>
                      <ArrowRight className="h-6 w-6 text-gray-400 transition-transform group-hover:translate-x-1" />
                    </div>
                    <p className="text-gray-600">
                      Les recruteurs sont particulièrement attentifs aux profils ayant complété le test Soft Skills.
                    </p>
                  </Card>
                </Link>
              )}
              <Link href="/beyond-connect-app/profile">
                <Card className="group h-full cursor-pointer border-0 bg-white p-8 shadow-sm transition-all hover:shadow-xl">
                  <div className="mb-6 flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-50 transition-all group-hover:bg-yellow-100">
                      <Award className="h-8 w-8 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="mb-1 text-2xl font-semibold text-gray-900">Open Badges</h3>
                      <p className="text-sm text-gray-500">3x plus consultés</p>
                    </div>
                    <ArrowRight className="h-6 w-6 text-gray-400 transition-transform group-hover:translate-x-1" />
                  </div>
                  <p className="text-gray-600">
                    Les profils avec Open Badges attirent l'attention des recruteurs et démontrent votre engagement.
                  </p>
                </Card>
              </Link>
            </div>
          </div>
        </section>

        {/* Quick Actions - Style Apple */}
        <section className="mb-20">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-semibold tracking-tight text-gray-900">Actions rapides</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/beyond-connect-app/jobs">
              <Card className="group h-full cursor-pointer border-0 bg-white p-6 shadow-sm transition-all hover:shadow-xl">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#003087] text-white transition-transform group-hover:scale-110">
                  <Briefcase className="h-7 w-7" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">Voir les annonces</h3>
                <p className="text-sm text-gray-500">Découvrez les opportunités disponibles</p>
              </Card>
            </Link>

            <Link href="/beyond-connect-app/profile">
              <Card className="group h-full cursor-pointer border-0 bg-white p-6 shadow-sm transition-all hover:shadow-xl">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-900 transition-all group-hover:bg-[#003087] group-hover:text-white">
                  <Settings className="h-7 w-7" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">Modifier mon compte</h3>
                <p className="text-sm text-gray-500">Gérez votre profil et vos informations</p>
              </Card>
            </Link>

            <Card className="group h-full cursor-pointer border-0 bg-white p-6 shadow-sm transition-all hover:shadow-xl" onClick={handleShareLinkedIn}>
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-900 transition-all group-hover:bg-[#003087] group-hover:text-white">
                <Linkedin className="h-7 w-7" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">Partager sur LinkedIn</h3>
              <p className="text-sm text-gray-500">Partagez votre profil professionnel</p>
            </Card>

            <Link href="/beyond-connect-app/profile/public">
              <Card className="group h-full cursor-pointer border-0 bg-white p-6 shadow-sm transition-all hover:shadow-xl">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-900 transition-all group-hover:bg-[#003087] group-hover:text-white">
                  <Eye className="h-7 w-7" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">Voir mon profil public</h3>
                <p className="text-sm text-gray-500">Comment les entreprises vous voient</p>
              </Card>
            </Link>
          </div>
        </section>

        {/* Stats Cards - Style Apple */}
        <section className="mb-20">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-semibold tracking-tight text-gray-900">Vos statistiques</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 bg-white shadow-sm">
              <CardContent className="p-8 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
                    <Briefcase className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <div className="mb-2 text-5xl font-semibold text-gray-900">{stats.experiences}</div>
                <p className="mb-4 text-sm font-medium text-gray-500">Expériences</p>
                <Link href="/beyond-connect-app/cv/experiences" className="text-sm text-[#003087] hover:underline">
                  Gérer →
                </Link>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-sm">
              <CardContent className="p-8 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50">
                    <GraduationCap className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
                <div className="mb-2 text-5xl font-semibold text-gray-900">{stats.education}</div>
                <p className="mb-4 text-sm font-medium text-gray-500">Formation</p>
                <Link href="/beyond-connect-app/cv/education" className="text-sm text-[#003087] hover:underline">
                  Gérer →
                </Link>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-sm">
              <CardContent className="p-8 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50">
                    <Code className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div className="mb-2 text-5xl font-semibold text-gray-900">{stats.skills}</div>
                <p className="mb-4 text-sm font-medium text-gray-500">Compétences</p>
                <Link href="/beyond-connect-app/cv/skills" className="text-sm text-[#003087] hover:underline">
                  Gérer →
                </Link>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-sm">
              <CardContent className="p-8 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-50">
                    <Trophy className="h-8 w-8 text-yellow-600" />
                  </div>
                </div>
                <div className="mb-2 text-5xl font-semibold text-gray-900">{stats.badges}</div>
                <p className="mb-4 text-sm font-medium text-gray-500">Badges</p>
                <Link href="/beyond-connect-app/cv/badges" className="text-sm text-[#003087] hover:underline">
                  Voir →
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Recent Activity - Style Apple */}
        <section className="mb-20">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-0 bg-white shadow-sm">
              <CardContent className="p-8">
                <h3 className="mb-4 text-2xl font-semibold text-gray-900">Mes candidatures</h3>
                <Link href="/beyond-connect-app/applications" className="text-[#003087] hover:underline">
                  Voir toutes mes candidatures →
                </Link>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-sm">
              <CardContent className="p-8">
                <h3 className="mb-4 text-2xl font-semibold text-gray-900">Matchings</h3>
                <p className="text-gray-600">Les entreprises premium peuvent vous contacter directement</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Formations et Tests Beyond No School - Style Apple */}
        <section className="grid gap-12 md:grid-cols-2">
          {/* Formations Beyond No School */}
          <Card className="border-0 bg-white shadow-sm">
            <CardContent className="p-8">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                    <BookOpen className="h-7 w-7 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-900">Formations</h3>
                    <p className="text-sm text-gray-500">Beyond No School</p>
                  </div>
                </div>
                <Link href="/dashboard/catalogue">
                  <Button variant="outline" size="sm" className="rounded-full border-gray-300">
                    Voir tout
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <RecommendedFormationsSection userId={userId} limit={2} />
            </CardContent>
          </Card>

          {/* Tests Beyond No School */}
          <Card className="border-0 bg-white shadow-sm">
            <CardContent className="p-8">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50">
                  <ClipboardCheck className="h-7 w-7 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">Tests</h3>
                  <p className="text-sm text-gray-500">Beyond No School</p>
                </div>
              </div>
              {loadingTests ? (
                <div className="text-gray-500">Chargement des tests...</div>
              ) : beyondNoSchoolTests.length === 0 ? (
                <p className="text-gray-500">Aucun test disponible pour le moment</p>
              ) : (
                <div className="space-y-4">
                  {beyondNoSchoolTests.map((test) => (
                    <Link
                      key={test.id}
                      href={`/dashboard/apprenant/questionnaires/${test.id}`}
                      className="block"
                    >
                      <Card className="group cursor-pointer border-0 bg-gray-50 p-4 transition-all hover:bg-gray-100 hover:shadow-md">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="mb-1 font-semibold text-gray-900">{test.title}</h4>
                            {test.description && (
                              <p className="mb-2 text-sm text-gray-600 line-clamp-2">
                                {test.description}
                              </p>
                            )}
                            {test.is_completed && test.score !== undefined && (
                              <div className="flex items-center gap-2">
                                <Trophy className="h-4 w-4 text-yellow-500" />
                                <span className="text-sm font-medium text-gray-700">
                                  Score: {test.score}%
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({new Date(test.completed_at).toLocaleDateString("fr-FR")})
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            {test.is_completed ? (
                              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                                Complété
                              </span>
                            ) : (
                              <Button size="sm" className="rounded-full bg-[#003087] hover:bg-[#002a6b] text-white">
                                Passer
                                <ArrowRight className="ml-2 h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

