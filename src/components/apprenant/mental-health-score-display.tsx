"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, AlertTriangle, XCircle, Info } from "lucide-react";
import { interpretMentalHealthScore } from "@/lib/mental-health/scoring";

type MentalHealthScoreDisplayProps = {
  score: number;
  maxScore: number;
  percentage: number;
  categoryScores?: Record<string, { score: number; maxScore: number; percentage: number }>;
};

export function MentalHealthScoreDisplay({
  score,
  maxScore,
  percentage,
  categoryScores,
}: MentalHealthScoreDisplayProps) {
  const interpretation = interpretMentalHealthScore(percentage);

  const getIcon = () => {
    switch (interpretation.level) {
      case "excellent":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case "good":
        return <Info className="h-6 w-6 text-blue-500" />;
      case "moderate":
        return <AlertCircle className="h-6 w-6 text-yellow-500" />;
      case "poor":
        return <AlertTriangle className="h-6 w-6 text-orange-500" />;
      case "critical":
        return <XCircle className="h-6 w-6 text-red-500" />;
    }
  };

  const getColorClass = () => {
    switch (interpretation.color) {
      case "green":
        return "text-green-600";
      case "blue":
        return "text-blue-600";
      case "yellow":
        return "text-yellow-600";
      case "orange":
        return "text-orange-600";
      case "red":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getProgressColor = () => {
    switch (interpretation.color) {
      case "green":
        return "bg-green-500";
      case "blue":
        return "bg-blue-500";
      case "yellow":
        return "bg-yellow-500";
      case "orange":
        return "bg-orange-500";
      case "red":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getIcon()}
            Votre score de santé mentale
          </CardTitle>
          <CardDescription>
            Résultat de votre dernier questionnaire
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Score global</span>
              <span className={`text-2xl font-bold ${getColorClass()}`}>
                {percentage.toFixed(1)}%
              </span>
            </div>
            <Progress value={percentage} className="h-3" />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{score.toFixed(1)} / {maxScore}</span>
              <span className={`font-semibold ${getColorClass()}`}>
                {interpretation.label}
              </span>
            </div>
          </div>

          {interpretation.recommendations && interpretation.recommendations.length > 0 && (
            <Alert className={interpretation.level === "critical" ? "border-red-500 bg-red-50" : ""}>
              <AlertTitle className="flex items-center gap-2">
                {interpretation.level === "critical" ? (
                  <XCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <Info className="h-4 w-4" />
                )}
                Recommandations
              </AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  {interpretation.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm">{rec}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {categoryScores && Object.keys(categoryScores).length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-gray-700">Scores par catégorie</h4>
              <div className="space-y-3">
                {Object.entries(categoryScores).map(([categoryName, categoryScore]) => {
                  const categoryInterpretation = interpretMentalHealthScore(categoryScore.percentage);
                  return (
                    <div key={categoryName} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{categoryName}</span>
                        <span className="text-sm font-medium">
                          {categoryScore.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <Progress
                        value={categoryScore.percentage}
                        className="h-2"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}




