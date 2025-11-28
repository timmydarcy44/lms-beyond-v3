"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Heart, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  AlertCircle,
  Calendar,
  ArrowRight,
  BarChart3,
  Phone,
  Video,
  Clock
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

type LearnerStats = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  lastScore: number | null;
  trend: "up" | "down" | "stable";
  lastQuestionnaireDate: string | null;
  nextQuestionnaireDate: string | null;
  riskLevel: "low" | "medium" | "high";
  indicators: {
    stress: number;
    wellbeing: number;
    motivation: number;
  };
};

type DashboardStats = {
  totalLearners: number;
  atRiskLearners: number;
  averageScore: number;
  scoreTrend: "up" | "down" | "stable";
  completedQuestionnaires: number;
  pendingQuestionnaires: number;
  dimensionAverages: Array<{
    key: string;
    label: string;
    average: number;
  }>;
  alerts: Array<{
    userId: string;
    name: string;
    email: string;
    latestScore: number;
    previousScore: number;
    delta: number;
    createdAt: string;
  }>;
  weeklyAverages?: {
    current: {
      stress: number;
      wellbeing: number;
      motivation: number;
    };
    last: {
      stress: number;
      wellbeing: number;
      motivation: number;
    };
    trends: {
      stress: "up" | "down" | "stable";
      wellbeing: "up" | "down" | "stable";
      motivation: "up" | "down" | "stable";
    };
  };
  monthlyAverages?: {
    last: {
      stress: number;
      wellbeing: number;
      motivation: number;
    };
  };
};

type LearnerDetail = {
  profile: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  indicators: {
    current: {
      stress: number;
      wellbeing: number;
      motivation: number;
    };
    evolution: {
      stress: Array<{ week: string; value: number }>;
      wellbeing: Array<{ week: string; value: number }>;
      motivation: Array<{ week: string; value: number }>;
    };
  };
  testResults: Array<{
    id: string;
    testId: string;
    testTitle: string;
    completedAt: string;
    overallScore: number;
    categoryResults: Array<{
      category: string;
      score: number;
      maxScore: number;
      percentage: number;
    }>;
    analysis: string | null;
  }>;
};

export function AdminBeyondCareDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [learners, setLearners] = useState<LearnerStats[]>([]);
  const [selectedLearner, setSelectedLearner] = useState<LearnerStats | null>(null);
  const [learnerDetail, setLearnerDetail] = useState<LearnerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Couleurs Beyond Care - Rouge Beyond Care et blanc
  const brandColor = "#c91459"; // Rouge Beyond Care
  const bgColor = "#FFFFFF";
  const surfaceColor = "#FAFAFA";
  const borderColor = "#f6cada";
  const lightBgColor = "#fef5f9";

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, learnersRes] = await Promise.all([
        fetch("/api/beyond-care/admin/stats"),
        fetch("/api/beyond-care/admin/learners"),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats({
          ...statsData,
          dimensionAverages: statsData.dimensionAverages ?? [],
          alerts: statsData.alerts ?? [],
        });
      }

      if (learnersRes.ok) {
        const learnersData = await learnersRes.json();
        console.log("[admin-beyond-care] Learners data:", learnersData);
        setLearners(learnersData.learners || []);
      } else {
        const errorData = await learnersRes.json();
        console.error("[admin-beyond-care] Error fetching learners:", errorData);
        toast.error("Erreur lors du chargement des collaborateurs");
      }
    } catch (error) {
      console.error("[admin-beyond-care] Error loading data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 rounded w-1/3" style={{ backgroundColor: lightBgColor }}></div>
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded" style={{ backgroundColor: lightBgColor }}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const dimensionRadarData =
    stats?.dimensionAverages?.map((dimension) => ({
      dimension: dimension.label,
      score: Math.round(dimension.average),
    })) ?? [];

  const alerts = stats?.alerts ?? [];

  return (
    <div className="space-y-6" style={{ backgroundColor: bgColor }}>
      {/* Header */}
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold" style={{ color: brandColor }}>
            <Heart className="h-8 w-8" style={{ color: brandColor }} />
            Beyond Care
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Suivi de la santé mentale de vos collaborateurs
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white border" style={{ borderColor: borderColor }}>
          <TabsTrigger 
            value="overview"
            className="data-[state=active]:bg-white data-[state=active]:text-black"
            style={{ 
              color: activeTab === "overview" ? brandColor : "inherit",
              borderBottom: activeTab === "overview" ? `2px solid ${brandColor}` : "none"
            }}
          >
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger 
            value="learners"
            className="data-[state=active]:bg-white data-[state=active]:text-black"
            style={{ 
              color: activeTab === "learners" ? brandColor : "inherit",
              borderBottom: activeTab === "learners" ? `2px solid ${brandColor}` : "none"
            }}
          >
            Collaborateurs
          </TabsTrigger>
          {selectedLearner && (
            <TabsTrigger 
              value="learner-detail"
              className="data-[state=active]:bg-white data-[state=active]:text-black"
              style={{ 
                color: activeTab === "learner-detail" ? brandColor : "inherit",
                borderBottom: activeTab === "learner-detail" ? `2px solid ${brandColor}` : "none"
              }}
            >
              Fiche de suivi
            </TabsTrigger>
          )}
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          {/* Statistiques générales */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border rounded-3xl shadow-[0_18px_36px_rgba(255,107,107,0.12)]" style={{ borderColor: borderColor, backgroundColor: bgColor }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium" style={{ color: brandColor }}>Total collaborateurs</CardTitle>
                <Users className="h-4 w-4" style={{ color: brandColor }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: brandColor }}>{stats?.totalLearners || 0}</div>
              </CardContent>
            </Card>

            <Card className="border rounded-3xl shadow-[0_18px_36px_rgba(255,107,107,0.12)]" style={{ borderColor: borderColor, backgroundColor: bgColor }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium" style={{ color: brandColor }}>À risque</CardTitle>
                <AlertCircle className="h-4 w-4" style={{ color: brandColor }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: brandColor }}>
                  {stats?.atRiskLearners || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="border rounded-3xl shadow-[0_18px_36px_rgba(255,107,107,0.12)]" style={{ borderColor: borderColor, backgroundColor: bgColor }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium" style={{ color: brandColor }}>Score moyen</CardTitle>
                <BarChart3 className="h-4 w-4" style={{ color: brandColor }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: brandColor }}>
                  {stats ? stats.averageScore.toFixed(1) : "N/A"}
                </div>
                {stats?.scoreTrend && (
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                    {stats.scoreTrend === "up" ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : stats.scoreTrend === "down" ? (
                      <TrendingDown className="h-3 w-3" style={{ color: brandColor }} />
                    ) : null}
                    <span>
                      {stats.scoreTrend === "up" ? "En hausse" : 
                       stats.scoreTrend === "down" ? "En baisse" : "Stable"}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border rounded-3xl shadow-[0_18px_36px_rgba(255,107,107,0.12)]" style={{ borderColor: borderColor, backgroundColor: bgColor }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium" style={{ color: brandColor }}>Questionnaires</CardTitle>
                <Calendar className="h-4 w-4" style={{ color: brandColor }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: brandColor }}>
                  {stats?.completedQuestionnaires || 0} / {((stats?.completedQuestionnaires || 0) + (stats?.pendingQuestionnaires || 0))}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {stats?.pendingQuestionnaires || 0} en attente
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Moyennes hebdomadaires des indicateurs clés */}
          {stats?.weeklyAverages && (
            <Card className="border rounded-3xl shadow-[0_18px_36px_rgba(255,107,107,0.12)] bg-gradient-to-br" style={{ borderColor: borderColor, background: `linear-gradient(to bottom right, ${lightBgColor}, ${bgColor})` }}>
              <CardHeader>
                <CardTitle style={{ color: brandColor }}>Moyennes hebdomadaires - État psychologique</CardTitle>
                <CardDescription className="text-slate-500">
                  Aperçu de l'état de santé mentale de vos collaborateurs cette semaine
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {/* Stress */}
                  <div className="rounded-2xl border p-6 shadow-sm" style={{ borderColor: borderColor, backgroundColor: bgColor }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold" style={{ color: brandColor }}>Stress</span>
                      {stats.weeklyAverages.trends.stress === "up" ? (
                        <TrendingUp className="h-4 w-4" style={{ color: brandColor }} />
                      ) : stats.weeklyAverages.trends.stress === "down" ? (
                        <TrendingDown className="h-4 w-4 text-green-500" />
                      ) : null}
                    </div>
                    <div className="text-3xl font-bold mb-1" style={{ color: brandColor }}>
                      {stats.weeklyAverages.current.stress > 0 
                        ? stats.weeklyAverages.current.stress.toFixed(1) 
                        : "N/A"}
                    </div>
                    {stats.weeklyAverages.current.stress > 0 && stats.weeklyAverages.last.stress > 0 && (
                      <div className="text-xs text-slate-500">
                        Semaine dernière: {stats.weeklyAverages.last.stress.toFixed(1)}
                      </div>
                    )}
                    <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ backgroundColor: lightBgColor }}>
                      <div
                        className="h-full transition-all rounded-full"
                        style={{ width: `${Math.min(100, stats.weeklyAverages.current.stress)}%`, backgroundColor: brandColor }}
                      />
                    </div>
                  </div>

                  {/* Bien-être */}
                  <div className="rounded-2xl border p-6 shadow-sm" style={{ borderColor: borderColor, backgroundColor: bgColor }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold" style={{ color: brandColor }}>Bien-être</span>
                      {stats.weeklyAverages.trends.wellbeing === "up" ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : stats.weeklyAverages.trends.wellbeing === "down" ? (
                        <TrendingDown className="h-4 w-4" style={{ color: brandColor }} />
                      ) : null}
                    </div>
                    <div className="text-3xl font-bold mb-1" style={{ color: brandColor }}>
                      {stats.weeklyAverages.current.wellbeing > 0 
                        ? stats.weeklyAverages.current.wellbeing.toFixed(1) 
                        : "N/A"}
                    </div>
                    {stats.weeklyAverages.current.wellbeing > 0 && stats.weeklyAverages.last.wellbeing > 0 && (
                      <div className="text-xs text-slate-500">
                        Semaine dernière: {stats.weeklyAverages.last.wellbeing.toFixed(1)}
                      </div>
                    )}
                    <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ backgroundColor: lightBgColor }}>
                      <div
                        className="h-full transition-all rounded-full"
                        style={{ width: `${Math.min(100, stats.weeklyAverages.current.wellbeing)}%`, backgroundColor: brandColor }}
                      />
                    </div>
                  </div>

                  {/* Motivation */}
                  <div className="rounded-2xl border p-6 shadow-sm" style={{ borderColor: borderColor, backgroundColor: bgColor }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold" style={{ color: brandColor }}>Motivation</span>
                      {stats.weeklyAverages.trends.motivation === "up" ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : stats.weeklyAverages.trends.motivation === "down" ? (
                        <TrendingDown className="h-4 w-4" style={{ color: brandColor }} />
                      ) : null}
                    </div>
                    <div className="text-3xl font-bold mb-1" style={{ color: brandColor }}>
                      {stats.weeklyAverages.current.motivation > 0 
                        ? stats.weeklyAverages.current.motivation.toFixed(1) 
                        : "N/A"}
                    </div>
                    {stats.weeklyAverages.current.motivation > 0 && stats.weeklyAverages.last.motivation > 0 && (
                      <div className="text-xs text-slate-500">
                        Semaine dernière: {stats.weeklyAverages.last.motivation.toFixed(1)}
                      </div>
                    )}
                    <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ backgroundColor: lightBgColor }}>
                      <div
                        className="h-full transition-all rounded-full"
                        style={{ width: `${Math.min(100, stats.weeklyAverages.current.motivation)}%`, backgroundColor: brandColor }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {dimensionRadarData.length > 0 && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border rounded-3xl shadow-[0_18px_36px_rgba(255,107,107,0.12)]" style={{ borderColor: borderColor, backgroundColor: bgColor }}>
                <CardHeader>
                  <CardTitle style={{ color: brandColor }}>Profil moyen des dimensions</CardTitle>
                  <CardDescription className="text-slate-500">
                    Radar agrégé calculé à partir du dernier questionnaire de chaque collaborateur.
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={dimensionRadarData} cx="50%" cy="50%" outerRadius="70%">
                      <PolarGrid stroke={borderColor} />
                      <PolarAngleAxis dataKey="dimension" tick={{ fill: brandColor, fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: brandColor, fontSize: 10 }} stroke={borderColor} />
                      <Radar dataKey="score" stroke={brandColor} fill={brandColor} fillOpacity={0.32} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border rounded-3xl shadow-[0_18px_36px_rgba(255,107,107,0.12)]" style={{ borderColor: borderColor, backgroundColor: bgColor }}>
                <CardHeader>
                  <CardTitle style={{ color: brandColor }}>Moyennes par dimension</CardTitle>
                  <CardDescription className="text-slate-500">
                    Permet d'identifier les zones les plus fragiles sur l'ensemble des collaborateurs.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stats?.dimensionAverages
                    ?.sort((a, b) => (b.average ?? 0) - (a.average ?? 0))
                    .map((dimension) => (
                      <div
                        key={dimension.key}
                        className="flex items-center justify-between rounded-2xl border px-4 py-3"
                        style={{ borderColor: borderColor, backgroundColor: lightBgColor }}
                      >
                        <div>
                          <p className="text-sm font-semibold" style={{ color: brandColor }}>{dimension.label}</p>
                          <p className="text-xs text-slate-500">
                            {dimension.average < 45
                              ? "Zone fragile"
                              : dimension.average < 60
                                ? "À surveiller"
                                : "Point d'équilibre"}
                          </p>
                        </div>
                        <span className="text-lg font-semibold" style={{ color: brandColor }}>
                          {dimension.average.toFixed(1)}
                        </span>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="border rounded-3xl shadow-[0_18px_36px_rgba(255,107,107,0.12)]" style={{ borderColor: borderColor, backgroundColor: bgColor }}>
            <CardHeader>
              <CardTitle style={{ color: brandColor }}>Alertes comportementales</CardTitle>
              <CardDescription className="text-slate-500">
                Détections automatiques des chutes de plus de 15 points entre deux questionnaires consécutifs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <p className="text-sm text-slate-500">Aucune alerte active pour le moment.</p>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div
                      key={alert.userId}
                      className="rounded-2xl border p-4 shadow-sm"
                      style={{ borderColor: brandColor, backgroundColor: lightBgColor }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold" style={{ color: brandColor }}>{alert.name}</p>
                          <p className="text-xs text-slate-600">{alert.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">
                            Dernier questionnaire : {new Date(alert.createdAt).toLocaleDateString("fr-FR")}
                          </p>
                          <p className="text-sm font-semibold" style={{ color: brandColor }}>
                            {alert.previousScore.toFixed(1)} ➝ {alert.latestScore.toFixed(1)} (Δ {alert.delta.toFixed(1)})
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Liste des collaborateurs */}
        <TabsContent value="learners" className="space-y-4">
          <Card className="border rounded-3xl shadow-[0_18px_36px_rgba(255,107,107,0.12)]" style={{ borderColor: borderColor, backgroundColor: bgColor }}>
            <CardHeader>
              <CardTitle style={{ color: brandColor }}>Liste des collaborateurs</CardTitle>
              <CardDescription className="text-slate-500">
                Cliquez sur un collaborateur pour voir sa fiche de suivi détaillée
              </CardDescription>
            </CardHeader>
            <CardContent>
              {learners.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  Aucun collaborateur trouvé
                </div>
              ) : (
                <div className="space-y-4">
                  {learners.map((learner) => (
                    <div
                      key={learner.id}
                      className="border rounded-2xl p-4 transition-all hover:shadow-md"
                      style={{ 
                        borderColor: borderColor, 
                        backgroundColor: bgColor,
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Informations du collaborateur */}
                        <div className="flex items-start gap-4 flex-1">
                          <div 
                            className="h-12 w-12 rounded-full flex items-center justify-center shrink-0"
                            style={{ backgroundColor: lightBgColor }}
                          >
                            <span className="font-semibold" style={{ color: brandColor }}>
                            {learner.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold mb-1" style={{ color: brandColor }}>{learner.name}</div>
                            <div className="text-sm text-slate-500 mb-2">{learner.email}</div>
                            
                            {/* Indicateurs de performance */}
                            <div className="grid grid-cols-3 gap-3 mt-3">
                              <div className="p-2 rounded-lg border" style={{ borderColor: borderColor, backgroundColor: lightBgColor }}>
                                <div className="text-xs text-slate-500 mb-1">Stress</div>
                                <div className="text-lg font-bold" style={{ color: brandColor }}>
                                  {learner.indicators.stress > 0 ? learner.indicators.stress.toFixed(0) : 'N/A'}
                                </div>
                                <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: borderColor }}>
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{ width: `${Math.min(100, learner.indicators.stress)}%`, backgroundColor: brandColor }}
                                  />
                                </div>
                              </div>
                              <div className="p-2 rounded-lg border" style={{ borderColor: borderColor, backgroundColor: lightBgColor }}>
                                <div className="text-xs text-slate-500 mb-1">Bien-être</div>
                                <div className="text-lg font-bold" style={{ color: brandColor }}>
                                  {learner.indicators.wellbeing > 0 ? learner.indicators.wellbeing.toFixed(0) : 'N/A'}
                                </div>
                                <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: borderColor }}>
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{ width: `${Math.min(100, learner.indicators.wellbeing)}%`, backgroundColor: brandColor }}
                                  />
                        </div>
                              </div>
                              <div className="p-2 rounded-lg border" style={{ borderColor: borderColor, backgroundColor: lightBgColor }}>
                                <div className="text-xs text-slate-500 mb-1">Motivation</div>
                                <div className="text-lg font-bold" style={{ color: brandColor }}>
                                  {learner.indicators.motivation > 0 ? learner.indicators.motivation.toFixed(0) : 'N/A'}
                                </div>
                                <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: borderColor }}>
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{ width: `${Math.min(100, learner.indicators.motivation)}%`, backgroundColor: brandColor }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 shrink-0">
                          <div className="flex gap-2">
                            {learner.phone && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border rounded-lg"
                                style={{ borderColor: brandColor, color: brandColor }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `tel:${learner.phone}`;
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = lightBgColor;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = bgColor;
                                }}
                              >
                                <Phone className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="border rounded-lg"
                              style={{ borderColor: brandColor, color: brandColor }}
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`https://meet.google.com/new`, '_blank');
                                toast.success(`Ouverture d'une visioconférence pour ${learner.name}`);
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = lightBgColor;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = bgColor;
                              }}
                            >
                              <Video className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border rounded-lg"
                              style={{ borderColor: brandColor, color: brandColor }}
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `/beyond-center/rendez-vous?email=${encodeURIComponent(learner.email)}&name=${encodeURIComponent(learner.name)}`;
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = lightBgColor;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = bgColor;
                              }}
                            >
                              <Clock className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border rounded-lg w-full"
                            style={{ borderColor: brandColor, color: brandColor }}
                      onClick={async (e) => {
                        e.stopPropagation();
                        setSelectedLearner(learner);
                        setActiveTab("learner-detail");
                        setLoadingDetail(true);
                        try {
                          const response = await fetch(`/api/beyond-care/admin/learners/${learner.id}`);
                          if (response.ok) {
                            const data = await response.json();
                            setLearnerDetail(data);
                          } else {
                            toast.error("Erreur lors du chargement des détails");
                          }
                        } catch (error) {
                          console.error("[admin-beyond-care] Error loading detail:", error);
                          toast.error("Erreur lors du chargement des détails");
                        } finally {
                          setLoadingDetail(false);
                        }
                      }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = lightBgColor;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = bgColor;
                            }}
                          >
                            Voir la fiche
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fiche de suivi d'un collaborateur */}
        {selectedLearner && (
          <TabsContent value="learner-detail" className="space-y-6">
            <Card className="border rounded-3xl shadow-[0_18px_36px_rgba(255,107,107,0.12)]" style={{ borderColor: borderColor, backgroundColor: bgColor }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle style={{ color: brandColor }}>{selectedLearner.name}</CardTitle>
                    <CardDescription className="text-slate-500">{selectedLearner.email}</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    className="border rounded-2xl"
                    style={{ borderColor: brandColor, color: brandColor }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = lightBgColor;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = bgColor;
                    }}
                    onClick={() => {
                      setSelectedLearner(null);
                      setActiveTab("learners");
                    }}
                  >
                    Retour à la liste
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {loadingDetail ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: brandColor }}></div>
                    <p className="mt-4 text-slate-500">Chargement des détails...</p>
                  </div>
                ) : learnerDetail ? (
                  <>
                    {/* Indicateurs clés actuels */}
                    <div>
                      <h3 className="font-semibold mb-4" style={{ color: brandColor }}>Indicateurs de performance actuels</h3>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="p-6 border rounded-2xl shadow-sm" style={{ borderColor: borderColor, backgroundColor: bgColor }}>
                          <div className="text-sm text-slate-500 mb-2">Stress</div>
                          <div className="text-3xl font-bold" style={{ color: brandColor }}>
                            {learnerDetail.indicators.current.stress.toFixed(0)}/100
                          </div>
                          <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ backgroundColor: lightBgColor }}>
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${learnerDetail.indicators.current.stress}%`, backgroundColor: brandColor }}
                            />
                          </div>
                        </div>
                        <div className="p-6 border rounded-2xl shadow-sm" style={{ borderColor: borderColor, backgroundColor: bgColor }}>
                          <div className="text-sm text-slate-500 mb-2">Bien-être</div>
                          <div className="text-3xl font-bold" style={{ color: brandColor }}>
                            {learnerDetail.indicators.current.wellbeing.toFixed(0)}/100
                          </div>
                          <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ backgroundColor: lightBgColor }}>
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${learnerDetail.indicators.current.wellbeing}%`, backgroundColor: brandColor }}
                            />
                          </div>
                        </div>
                        <div className="p-6 border rounded-2xl shadow-sm" style={{ borderColor: borderColor, backgroundColor: bgColor }}>
                          <div className="text-sm text-slate-500 mb-2">Motivation</div>
                          <div className="text-3xl font-bold" style={{ color: brandColor }}>
                            {learnerDetail.indicators.current.motivation.toFixed(0)}/100
                          </div>
                          <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ backgroundColor: lightBgColor }}>
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${learnerDetail.indicators.current.motivation}%`, backgroundColor: brandColor }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Évolution des indicateurs */}
                    {learnerDetail.indicators.evolution.stress.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-4" style={{ color: brandColor }}>Évolution des indicateurs de performance</h3>
                        <Card className="border rounded-2xl shadow-sm" style={{ borderColor: borderColor, backgroundColor: bgColor }}>
                          <CardContent className="pt-6">
                            <ResponsiveContainer width="100%" height={300}>
                              <LineChart data={learnerDetail.indicators.evolution.stress.map((item, index) => {
                                const wellbeing = learnerDetail.indicators.evolution.wellbeing[index];
                                const motivation = learnerDetail.indicators.evolution.motivation[index];
                                return {
                                  week: new Date(item.week).toLocaleDateString("fr-FR", { month: "short", day: "numeric" }),
                                  stress: item.value,
                                  wellbeing: wellbeing?.value || 0,
                                  motivation: motivation?.value || 0,
                                };
                              })}>
                                <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                                <XAxis dataKey="week" stroke={brandColor} />
                                <YAxis domain={[0, 100]} stroke={brandColor} />
                                <Tooltip 
                                  contentStyle={{ 
                                    backgroundColor: bgColor, 
                                    border: `1px solid ${borderColor}`,
                                    borderRadius: "8px"
                                  }}
                                />
                                <Legend />
                                <Line 
                                  type="monotone" 
                                  dataKey="stress" 
                                  stroke={brandColor} 
                                  strokeWidth={2}
                                  name="Stress"
                                  dot={{ fill: brandColor, r: 4 }}
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="wellbeing" 
                                  stroke="#10b981" 
                                  strokeWidth={2}
                                  name="Bien-être"
                                  dot={{ fill: "#10b981", r: 4 }}
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="motivation" 
                                  stroke="#3b82f6" 
                                  strokeWidth={2}
                                  name="Motivation"
                                  dot={{ fill: "#3b82f6", r: 4 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Résultats des tests soft skills */}
                    {learnerDetail.testResults.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-4" style={{ color: brandColor }}>Résultats des tests</h3>
                        <div className="space-y-4">
                          {learnerDetail.testResults.map((testResult) => (
                            <Card key={testResult.id} className="border rounded-2xl shadow-sm" style={{ borderColor: borderColor, backgroundColor: bgColor }}>
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <CardTitle className="text-lg" style={{ color: brandColor }}>{testResult.testTitle}</CardTitle>
                                    <CardDescription className="text-slate-500">
                                      Complété le {new Date(testResult.completedAt).toLocaleDateString("fr-FR", {
                                        weekday: "long",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                      })}
                                    </CardDescription>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-2xl font-bold" style={{ color: brandColor }}>
                                      {testResult.overallScore.toFixed(0)}/100
                                    </div>
                                    <div className="text-xs text-slate-500">Score global</div>
                                  </div>
                                </div>
                              </CardHeader>
                              {testResult.categoryResults.length > 0 && (
                                <CardContent>
                                  <div className="space-y-2">
                                    {testResult.categoryResults
                                      .sort((a, b) => b.percentage - a.percentage)
                                      .slice(0, 5)
                                      .map((category) => (
                                        <div key={category.category} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: lightBgColor }}>
                                          <div className="flex-1">
                                            <div className="text-sm font-medium" style={{ color: brandColor }}>
                                              {category.category.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                                            </div>
                                            <div className="mt-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: borderColor }}>
                                              <div
                                                className="h-full rounded-full transition-all"
                                                style={{ width: `${category.percentage}%`, backgroundColor: brandColor }}
                                              />
                                            </div>
                                          </div>
                                          <div className="ml-4 text-right">
                                            <div className="text-lg font-bold" style={{ color: brandColor }}>
                                              {category.percentage.toFixed(0)}%
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                </CardContent>
                              )}
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {learnerDetail.testResults.length === 0 && (
                      <div className="text-center py-8 text-slate-400">
                        Aucun test complété pour le moment
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    Aucune donnée disponible
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}


