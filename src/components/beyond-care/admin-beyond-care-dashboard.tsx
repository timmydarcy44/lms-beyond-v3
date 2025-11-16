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
  BarChart3
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

type LearnerStats = {
  id: string;
  name: string;
  email: string;
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
};

export function AdminBeyondCareDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [learners, setLearners] = useState<LearnerStats[]>([]);
  const [selectedLearner, setSelectedLearner] = useState<LearnerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

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
        setLearners(learnersData.learners || []);
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
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Heart className="h-8 w-8 text-orange-500" />
            Beyond Care
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Suivi de la santé mentale de vos apprenants
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="learners">Apprenants</TabsTrigger>
          {selectedLearner && <TabsTrigger value="learner-detail">Fiche de suivi</TabsTrigger>}
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          {/* Statistiques générales */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total apprenants</CardTitle>
                <Users className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalLearners || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">À risque</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">
                  {stats?.atRiskLearners || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Score moyen</CardTitle>
                <BarChart3 className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats ? stats.averageScore.toFixed(1) : "N/A"}
                </div>
                {stats?.scoreTrend && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    {stats.scoreTrend === "up" ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : stats.scoreTrend === "down" ? (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    ) : null}
                    <span>
                      {stats.scoreTrend === "up" ? "En hausse" : 
                       stats.scoreTrend === "down" ? "En baisse" : "Stable"}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Questionnaires</CardTitle>
                <Calendar className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.completedQuestionnaires || 0} / {((stats?.completedQuestionnaires || 0) + (stats?.pendingQuestionnaires || 0))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats?.pendingQuestionnaires || 0} en attente
                </p>
              </CardContent>
            </Card>
          </div>

          {dimensionRadarData.length > 0 && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border border-[#f6cada] bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-[#c91459]">Profil moyen des dimensions</CardTitle>
                  <CardDescription className="text-[#7b2a49]">
                    Radar agrégé calculé à partir du dernier questionnaire de chaque apprenant.
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={dimensionRadarData} cx="50%" cy="50%" outerRadius="70%">
                      <PolarGrid stroke="#f6cada" />
                      <PolarAngleAxis dataKey="dimension" tick={{ fill: "#5a1d35", fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#a84a70", fontSize: 10 }} stroke="#f6cada" />
                      <Radar dataKey="score" stroke="#c91459" fill="#c91459" fillOpacity={0.32} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border border-[#f6cada] bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-[#c91459]">Moyennes par dimension</CardTitle>
                  <CardDescription className="text-[#7b2a49]">
                    Permet d’identifier les zones les plus fragiles sur l’ensemble des apprenants.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stats?.dimensionAverages
                    ?.sort((a, b) => (b.average ?? 0) - (a.average ?? 0))
                    .map((dimension) => (
                      <div
                        key={dimension.key}
                        className="flex items-center justify-between rounded-lg border border-[#f6cada] bg-[#fef5f9] px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-[#c91459]">{dimension.label}</p>
                          <p className="text-xs text-[#7b2a49]/70">
                            {dimension.average < 45
                              ? "Zone fragile"
                              : dimension.average < 60
                                ? "À surveiller"
                                : "Point d'équilibre"}
                          </p>
                        </div>
                        <span className="text-lg font-semibold text-[#5a1d35]">
                          {dimension.average.toFixed(1)}
                        </span>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="border border-[#f6cada] bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#c91459]">Alertes comportementales</CardTitle>
              <CardDescription className="text-[#7b2a49]">
                Détections automatiques des chutes de plus de 15 points entre deux questionnaires consécutifs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <p className="text-sm text-[#7b2a49]">Aucune alerte active pour le moment.</p>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div
                      key={alert.userId}
                      className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-rose-700">{alert.name}</p>
                          <p className="text-xs text-rose-600">{alert.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-rose-500">
                            Dernier questionnaire : {new Date(alert.createdAt).toLocaleDateString("fr-FR")}
                          </p>
                          <p className="text-sm font-semibold text-rose-700">
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

        {/* Liste des apprenants */}
        <TabsContent value="learners" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Liste des apprenants</CardTitle>
              <CardDescription>
                Cliquez sur un apprenant pour voir sa fiche de suivi détaillée
              </CardDescription>
            </CardHeader>
            <CardContent>
              {learners.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  Aucun apprenant trouvé
                </div>
              ) : (
                <div className="space-y-2">
                  {learners.map((learner) => (
                    <div
                      key={learner.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition"
                      onClick={() => {
                        setSelectedLearner(learner);
                        setActiveTab("learner-detail");
                      }}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <span className="text-orange-600 font-semibold">
                            {learner.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{learner.name}</div>
                          <div className="text-sm text-gray-500">{learner.email}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          {learner.lastScore !== null ? (
                            <div className="text-right">
                              <div className="font-semibold text-gray-900">
                                {learner.lastScore.toFixed(1)}/100
                              </div>
                              <div className="text-xs text-gray-500">
                                {learner.trend === "up" ? "↑" : learner.trend === "down" ? "↓" : "→"}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400">Aucun score</div>
                          )}
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              learner.riskLevel === "high"
                                ? "bg-red-100 text-red-700"
                                : learner.riskLevel === "medium"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {learner.riskLevel === "high"
                              ? "Risque élevé"
                              : learner.riskLevel === "medium"
                              ? "Risque modéré"
                              : "Faible risque"}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400 ml-4" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fiche de suivi d'un apprenant */}
        {selectedLearner && (
          <TabsContent value="learner-detail" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedLearner.name}</CardTitle>
                    <CardDescription>{selectedLearner.email}</CardDescription>
                  </div>
                  <Button
                    variant="outline"
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
                {/* Indicateurs clés */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-gray-500 mb-2">Stress</div>
                    <div className="text-2xl font-bold text-orange-500">
                      {selectedLearner.indicators.stress}/100
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-gray-500 mb-2">Bien-être</div>
                    <div className="text-2xl font-bold text-green-500">
                      {selectedLearner.indicators.wellbeing}/100
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-gray-500 mb-2">Motivation</div>
                    <div className="text-2xl font-bold text-blue-500">
                      {selectedLearner.indicators.motivation}/100
                    </div>
                  </div>
                </div>

                {/* Historique */}
                <div>
                  <h3 className="font-semibold mb-4">Historique des questionnaires</h3>
                  <div className="space-y-2">
                    {selectedLearner.lastQuestionnaireDate ? (
                      <div className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Dernier questionnaire</div>
                            <div className="text-sm text-gray-500">
                              {new Date(selectedLearner.lastQuestionnaireDate).toLocaleDateString("fr-FR")}
                            </div>
                          </div>
                          {selectedLearner.lastScore !== null && (
                            <div className="text-lg font-bold text-orange-500">
                              {selectedLearner.lastScore.toFixed(1)}/100
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        Aucun questionnaire complété
                      </div>
                    )}
                  </div>
                </div>

                {/* Prochain questionnaire */}
                {selectedLearner.nextQuestionnaireDate && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-5 w-5 text-orange-500" />
                      <span className="font-semibold text-orange-900">Prochain questionnaire</span>
                    </div>
                    <div className="text-orange-700">
                      {new Date(selectedLearner.nextQuestionnaireDate).toLocaleDateString("fr-FR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
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


