"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  User,
  LineChart,
  Sparkles,
  BookOpenCheck
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type LearnerDashboardData = {
  overallScore: number | null;
  scoreTrend: "up" | "down" | "stable";
  nextQuestionnaireDate: string | null;
  indicators: {
    stress: number;
    wellbeing: number;
    motivation: number;
  };
  recentScores: Array<{
    date: string;
    score: number;
  }>;
  completedQuestionnaires: number;
  pendingQuestionnaires: number;
};

export function LearnerBeyondCareDashboard() {
  const [data, setData] = useState<LearnerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const brandColor = "#c91459";

  const quickMenuItems = [
    { label: "Mon profil", icon: User },
    { label: "Mes résultats", icon: LineChart },
    { label: "Programmes", icon: Calendar },
    { label: "Mes conseils", icon: Sparkles },
    { label: "Ressources", icon: BookOpenCheck },
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/beyond-care/learner/dashboard");
      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
      }
    } catch (error) {
      console.error("[learner-beyond-care] Error loading data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 rounded bg-[#f9d7e5]"></div>
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded bg-[#fce8f1]"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold" style={{ color: brandColor }}>
            <Heart className="h-8 w-8" style={{ color: brandColor }} />
            Beyond Care
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Suivez votre évolution et accédez à vos rituels de bien-être.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 rounded-full bg-white px-6 py-4 shadow-[0_20px_40px_rgba(0,0,0,0.05)]">
          {quickMenuItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              className="flex flex-col items-center gap-2 text-xs font-semibold text-slate-800 transition-transform hover:scale-[1.02]"
            >
              <Icon className="h-7 w-7 text-black" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Hero tiles */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-[#f6cada] bg-gradient-to-br from-[#fef5f9] to-white p-6 shadow-[0_18px_36px_rgba(201,20,89,0.12)]">
          <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-[#c91459]/70">Focus du jour</h2>
          <p className="mt-3 text-lg font-semibold text-[#c91459]">Respirer pour relâcher la pression</p>
          <p className="mt-2 text-sm text-slate-500">Une routine guidée en 5 minutes pour apaiser l&apos;esprit et rééquilibrer votre énergie.</p>
          <Button className="mt-4 bg-[#c91459] hover:bg-[#b2124f]">Lancer le rituel</Button>
        </div>
        <div className="relative overflow-hidden rounded-3xl border border-[#f6cada] bg-[#101828] text-white shadow-[0_25px_45px_rgba(16,24,40,0.25)]">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80')] bg-cover bg-center opacity-60" />
          <div className="relative z-10 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-white/70">Inspiration</h2>
            <p className="mt-3 text-lg font-semibold">Retrouver l&apos;équilibre</p>
            <p className="mt-2 text-sm text-white/80">Des actions concrètes et des exercices de respiration à intégrer dans votre semaine.</p>
            <Button variant="outline" className="mt-4 border-white/40 text-white hover:bg-white/10">Découvrir</Button>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-3xl border border-[#f6cada] bg-white shadow-[0_18px_36px_rgba(0,0,0,0.08)]">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80')] bg-cover bg-center opacity-40" />
          <div className="relative z-10 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-[#c91459]/80">Coach Beyond Care</h2>
            <p className="mt-3 text-lg font-semibold text-slate-900">Prendre le temps pour soi</p>
            <p className="mt-2 text-sm text-slate-700">Planifiez un temps calme guidé par nos coachs. Vos données restent privées et protégées.</p>
            <Button variant="ghost" className="mt-4 text-[#c91459] hover:bg-[#fef0f6]">Planifier</Button>
          </div>
        </div>
      </div>

      {/* Score global */}
      <Card className="border border-[#f6cada] bg-gradient-to-br from-[#fef5f9] to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" style={{ color: brandColor }} />
            Score global
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              {data.overallScore !== null ? (
                <>
                  <div className="mb-2 text-5xl font-bold" style={{ color: brandColor }}>
                    {data.overallScore.toFixed(1)}
                    <span className="text-2xl text-gray-500">/100</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {data.scoreTrend === "up" ? (
                      <>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-green-600 font-medium">En amélioration</span>
                      </>
                    ) : data.scoreTrend === "down" ? (
                      <>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        <span className="text-red-600 font-medium">En baisse</span>
                      </>
                    ) : (
                      <span className="text-slate-500">Stable</span>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-slate-500">
                  Aucun score disponible pour le moment
                </div>
              )}
            </div>
            {data.recentScores.length > 0 && (
              <div className="text-right">
                <div className="mb-1 text-sm text-slate-500">Dernière évaluation</div>
                <div className="text-lg font-semibold">
                  {new Date(data.recentScores[0].date).toLocaleDateString("fr-FR")}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Indicateurs clés */}
       <div className="grid gap-4 md:grid-cols-3">
        <Card className="border border-[#f6cada] bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: brandColor }}>Stress</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fce7f0] text-xs font-bold text-[#c91459]">
              S
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: brandColor }}>
              {data.indicators.stress}/100
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f7d1e0]">
              <div
                className="h-full transition-all"
                style={{
                  width: `${data.indicators.stress}%`,
                  backgroundColor: brandColor,
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#f6cada] bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: brandColor }}>Bien-être</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fce7f0] text-xs font-bold text-[#c91459]">
              B
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: brandColor }}>
              {data.indicators.wellbeing}/100
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f7d1e0]">
              <div
                className="h-full transition-all"
                style={{
                  width: `${data.indicators.wellbeing}%`,
                  backgroundColor: brandColor,
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#f6cada] bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: brandColor }}>Motivation</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fce7f0] text-xs font-bold text-[#c91459]">
              M
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: brandColor }}>
              {data.indicators.motivation}/100
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f7d1e0]">
              <div
                className="h-full transition-all"
                style={{
                  width: `${data.indicators.motivation}%`,
                  backgroundColor: brandColor,
                }}
              />
            </div>
          </CardContent>
        </Card>
       </div>

      {/* Prochain questionnaire */}
      {data.nextQuestionnaireDate && (
        <Card className="border border-[#f6cada] bg-[#fef5f9]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: brandColor }}>
              <Calendar className="h-5 w-5" style={{ color: brandColor }} />
              Prochain questionnaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="mb-1 text-lg font-semibold" style={{ color: brandColor }}>
                  {new Date(data.nextQuestionnaireDate).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <div className="text-sm text-slate-600">
                  Vous recevrez une notification et un email pour compléter le questionnaire
                </div>
              </div>
              <Clock className="h-8 w-8" style={{ color: brandColor }} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questionnaires */}
      <Card className="border border-[#f1d8e3] bg-white">
        <CardHeader>
          <CardTitle style={{ color: brandColor }}>Mes questionnaires</CardTitle>
          <CardDescription className="text-slate-500">
            Historique de vos questionnaires de santé mentale
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-[#f3c3d6] bg-[#fef5f9] p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5" style={{ color: brandColor }} />
                <div>
                  <div className="font-medium" style={{ color: brandColor }}>Questionnaires complétés</div>
                  <div className="text-sm text-slate-500">
                    {data.completedQuestionnaires} questionnaire{data.completedQuestionnaires > 1 ? "s" : ""}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-[#f1c5d9] text-[#c91459] hover:bg-[#fef0f6]"
              >
                <Link href="/dashboard/apprenant/questionnaires">
                  Voir l'historique
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>

            {data.pendingQuestionnaires > 0 && (
              <div className="flex items-center justify-between rounded-lg border border-[#f6cada] bg-[#fef5f9] p-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5" style={{ color: brandColor }} />
                  <div>
                    <div className="font-medium" style={{ color: brandColor }}>Questionnaires en attente</div>
                    <div className="text-sm text-slate-600">
                      {data.pendingQuestionnaires} questionnaire{data.pendingQuestionnaires > 1 ? "s" : ""} à compléter
                    </div>
                  </div>
                </div>
                <Button
                  className="bg-[#c91459] hover:bg-[#b2124f]"
                  size="sm"
                  asChild
                >
                  <Link href="/dashboard/apprenant/questionnaires">
                    Compléter
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Évolution */}
      {data.recentScores.length > 0 && (
        <Card className="border border-[#f1d8e3] bg-white">
          <CardHeader>
            <CardTitle style={{ color: brandColor }}>Évolution</CardTitle>
            <CardDescription className="text-slate-500">
              Votre progression sur les 30 derniers jours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-center justify-center text-slate-400">
              Graphique d'évolution (à implémenter)
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


