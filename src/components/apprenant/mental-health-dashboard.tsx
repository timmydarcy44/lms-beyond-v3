"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, TrendingUp, TrendingDown, Minus, Calendar } from "lucide-react";
import { MentalHealthScoreDisplay } from "./mental-health-score-display";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type Indicator = {
  id: string;
  indicator_type: string;
  indicator_value: number;
  indicator_label: string;
  week_start_date: string;
  week_end_date: string;
  calculated_at: string;
};

export function MentalHealthDashboard() {
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [latestScore, setLatestScore] = useState<{
    score: number;
    maxScore: number;
    percentage: number;
    categoryScores?: Record<string, { score: number; maxScore: number; percentage: number }>;
  } | null>(null);

  useEffect(() => {
    const loadIndicators = async () => {
      try {
        const response = await fetch("/api/mental-health/indicators");
        if (response.ok) {
          const data = await response.json();
          setIndicators(data.indicators || []);
          
          // Récupérer le score le plus récent
          const overallIndicator = data.indicators
            ?.filter((ind: Indicator) => ind.indicator_type === "overall_wellbeing")
            .sort((a: Indicator, b: Indicator) => 
              new Date(b.calculated_at).getTime() - new Date(a.calculated_at).getTime()
            )[0];
          
          if (overallIndicator) {
            setLatestScore({
              score: overallIndicator.indicator_value,
              maxScore: 100,
              percentage: overallIndicator.indicator_value,
            });
          }
        }
      } catch (error) {
        console.error("[mental-health-dashboard] Error loading indicators:", error);
      } finally {
        setLoading(false);
      }
    };

    loadIndicators();
  }, []);

  // Grouper les indicateurs par type
  const indicatorsByType = indicators.reduce((acc, indicator) => {
    if (!acc[indicator.indicator_type]) {
      acc[indicator.indicator_type] = [];
    }
    acc[indicator.indicator_type].push(indicator);
    return acc;
  }, {} as Record<string, Indicator[]>);

  // Préparer les données pour le graphique
  const chartData = Object.entries(indicatorsByType).map(([type, values]) => {
    const sorted = values.sort(
      (a, b) => new Date(a.week_start_date).getTime() - new Date(b.week_start_date).getTime()
    );
    
    return {
      type,
      label: values[0]?.indicator_label || type,
      data: sorted.map((ind) => ({
        week: new Date(ind.week_start_date).toLocaleDateString("fr-FR", {
          month: "short",
          day: "numeric",
        }),
        value: ind.indicator_value,
      })),
      latest: sorted[sorted.length - 1]?.indicator_value || 0,
      previous: sorted.length > 1 ? sorted[sorted.length - 2]?.indicator_value || 0 : 0,
    };
  });

  const getTrend = (current: number, previous: number) => {
    if (current > previous) return { icon: TrendingUp, color: "text-green-500", label: "Amélioration" };
    if (current < previous) return { icon: TrendingDown, color: "text-red-500", label: "Dégradation" };
    return { icon: Minus, color: "text-gray-500", label: "Stable" };
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

  if (indicators.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Évolution de ma santé mentale</CardTitle>
          <CardDescription>
            Suivez votre évolution au fil du temps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-600 py-8">
            Aucune donnée disponible pour le moment. Répondez aux questionnaires pour voir votre évolution.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {latestScore && (
        <MentalHealthScoreDisplay
          score={latestScore.score}
          maxScore={latestScore.maxScore}
          percentage={latestScore.percentage}
          categoryScores={latestScore.categoryScores}
        />
      )}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Évolution de ma santé mentale
          </CardTitle>
          <CardDescription>
            Suivez votre évolution au fil du temps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={Object.keys(indicatorsByType)[0]} className="space-y-4">
            <TabsList>
              {Object.keys(indicatorsByType).map((type) => (
                <TabsTrigger key={type} value={type}>
                  {indicatorsByType[type][0]?.indicator_label || type}
                </TabsTrigger>
              ))}
            </TabsList>

            {chartData.map((chart) => {
              const trend = getTrend(chart.latest, chart.previous);
              const TrendIcon = trend.icon;

              return (
                <TabsContent key={chart.type} value={chart.type} className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Valeur actuelle</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{chart.latest.toFixed(1)}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Tendance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <TrendIcon className={`h-5 w-5 ${trend.color}`} />
                          <span className={trend.color}>{trend.label}</span>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Évolution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {chart.latest > chart.previous ? "+" : ""}
                          {(chart.latest - chart.previous).toFixed(1)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Évolution sur {chart.data.length} semaines</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chart.data}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="week" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            name={chart.label}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>

      {/* Historique des réponses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Historique
          </CardTitle>
          <CardDescription>
            Vos réponses aux questionnaires précédents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(indicatorsByType).map(([type, values]) => (
              <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{values[0]?.indicator_label || type}</p>
                  <p className="text-sm text-gray-600">
                    Dernière mise à jour: {new Date(values[values.length - 1]?.calculated_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{values[values.length - 1]?.indicator_value.toFixed(1)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

