"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type AdminStats = {
  totalLearners: number;
  respondedCount: number;
  averageScore: number;
  scoreDistribution: Array<{ level: string; count: number; percentage: number }>;
  categoryAverages: Record<string, number>;
  alerts: Array<{
    learner_id: string;
    learner_name: string;
    score: number;
    level: string;
    needsAttention: boolean;
  }>;
};

type MentalHealthAdminStatsProps = {
  orgId?: string;
};

const COLORS = {
  excellent: "#10b981",
  good: "#3b82f6",
  moderate: "#f59e0b",
  poor: "#f97316",
  critical: "#ef4444",
};

export function MentalHealthAdminStats({ orgId }: MentalHealthAdminStatsProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<string>("all");

  useEffect(() => {
    loadStats();
  }, [orgId, selectedQuestionnaire]);

  const loadStats = async () => {
    setLoading(true);
    try {
      let url = "/api/mental-health/admin-stats";
      const params = new URLSearchParams();
      
      if (orgId) {
        params.append("org_id", orgId);
      }
      
      if (selectedQuestionnaire !== "all") {
        params.append("questionnaire_id", selectedQuestionnaire);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("[mental-health-admin-stats] Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-600">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-600">Aucune donnée disponible</p>
        </CardContent>
      </Card>
    );
  }

  const responseRate = stats.totalLearners > 0
    ? (stats.respondedCount / stats.totalLearners) * 100
    : 0;

  const pieData = stats.scoreDistribution.map((dist) => ({
    name: dist.level,
    value: dist.count,
    percentage: dist.percentage,
  }));

  return (
    <div className="space-y-6">
      {/* Statistiques principales */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Apprenants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLearners}</div>
            <p className="text-xs text-muted-foreground">
              {stats.respondedCount} ont répondu ({responseRate.toFixed(1)}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score moyen</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageScore.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.averageScore >= 60 ? "Bien" : stats.averageScore >= 40 ? "Modéré" : "Préoccupant"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En bonne santé</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.scoreDistribution
                .filter((d) => d.level === "excellent" || d.level === "good")
                .reduce((sum, d) => sum + d.count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.scoreDistribution
                .filter((d) => d.level === "excellent" || d.level === "good")
                .reduce((sum, d) => sum + d.percentage, 0)
                .toFixed(1)}% de vos étudiants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attention requise</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.alerts.filter((a) => a.needsAttention).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Apprenants nécessitant un suivi
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribution des scores</CardTitle>
            <CardDescription>
              Répartition des apprenants par niveau de santé mentale
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => `${props.name}: ${(props.percentage as number).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[entry.name as keyof typeof COLORS] || "#8884d8"}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Moyennes par catégorie</CardTitle>
            <CardDescription>
              Scores moyens par domaine de santé mentale
            </CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(stats.categoryAverages).length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={Object.entries(stats.categoryAverages).map(([name, value]) => ({
                    name,
                    value: Math.round(value * 100) / 100,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-600 text-center py-8">
                Aucune catégorie disponible
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alertes */}
      {stats.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Apprenants nécessitant une attention
            </CardTitle>
            <CardDescription>
              Liste des apprenants avec des scores préoccupants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.alerts
                .filter((a) => a.needsAttention)
                .map((alert) => (
                  <div
                    key={alert.learner_id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-orange-50"
                  >
                    <div>
                      <p className="font-medium">{alert.learner_name}</p>
                      <p className="text-sm text-gray-600">
                        Score: {alert.score.toFixed(1)}% - {alert.level}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const response = await fetch("/api/mental-health/notify-coach", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              learner_id: alert.learner_id,
                              message: `L'apprenant ${alert.learner_name} a un score de ${alert.score.toFixed(1)}% (${alert.level}). Une attention est requise.`,
                              notification_type: "coach",
                            }),
                          });

                          if (response.ok) {
                            const data = await response.json();
                            const emailText = data.emails_sent > 0 
                              ? ` (${data.emails_sent} email${data.emails_sent > 1 ? 's' : ''} envoyé${data.emails_sent > 1 ? 's' : ''})`
                              : '';
                            toast.success(`Notification envoyée à ${data.notifications_sent} coach(s)${emailText}`);
                          } else {
                            const errorData = await response.json().catch(() => ({ error: "Erreur inconnue" }));
                            toast.error(errorData.error || "Erreur lors de l'envoi de la notification");
                          }
                        } catch (error) {
                          console.error("[mental-health-admin-stats] Error notifying coach:", error);
                          toast.error("Erreur lors de l'envoi de la notification");
                        }
                      }}
                    >
                      Notifier le coach
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

