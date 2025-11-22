"use client";

import { useState, useEffect } from "react";
import { Plus, Briefcase, GraduationCap, Award, Code, Languages, Trophy, FileText, ArrowRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";

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

  useEffect(() => {
    loadStats();
  }, [userId]);

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
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">Mon CV numérique</h1>
          <p className="text-lg text-gray-600">
            Gérez votre profil professionnel et vos compétences
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Link href="/beyond-connect-app/cv/edit">
            <Card className="cursor-pointer border-2 border-[#003087] bg-white transition-all hover:shadow-lg">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#003087] text-white">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Compléter mon CV</h3>
                  <p className="text-sm text-gray-600">Ajoutez vos expériences et compétences</p>
                </div>
                <ArrowRight className="h-5 w-5 text-[#003087]" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/beyond-connect-app/jobs">
            <Card className="cursor-pointer border-2 border-gray-200 bg-white transition-all hover:border-[#003087] hover:shadow-lg">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-[#003087]">
                  <Briefcase className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Voir les offres</h3>
                  <p className="text-sm text-gray-600">Découvrez les opportunités disponibles</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/beyond-connect-app/profile/public">
            <Card className="cursor-pointer border-2 border-gray-200 bg-white transition-all hover:border-[#003087] hover:shadow-lg">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-[#003087]">
                  <Eye className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Voir mon profil public</h3>
                  <p className="text-sm text-gray-600">Comment les entreprises vous voient</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-gray-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <Briefcase className="h-4 w-4 text-[#003087]" />
                Expériences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.experiences}</div>
              <Link href="/beyond-connect-app/cv/experiences" className="text-sm text-[#003087] hover:underline">
                Gérer →
              </Link>
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <GraduationCap className="h-4 w-4 text-[#003087]" />
                Formation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.education}</div>
              <Link href="/beyond-connect-app/cv/education" className="text-sm text-[#003087] hover:underline">
                Gérer →
              </Link>
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <Code className="h-4 w-4 text-[#003087]" />
                Compétences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.skills}</div>
              <Link href="/beyond-connect-app/cv/skills" className="text-sm text-[#003087] hover:underline">
                Gérer →
              </Link>
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <Trophy className="h-4 w-4 text-[#003087]" />
                Badges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.badges}</div>
              <Link href="/beyond-connect-app/cv/badges" className="text-sm text-[#003087] hover:underline">
                Voir →
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Mes candidatures</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/beyond-connect-app/applications" className="text-sm text-[#003087] hover:underline">
                Voir toutes mes candidatures →
              </Link>
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Matchings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Les entreprises premium peuvent vous contacter directement</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

