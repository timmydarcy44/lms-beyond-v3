"use client";

import { CheckCircle } from "lucide-react";

type TestResultScoreProps = {
  score: number;
  maxScore: number;
  percentage: number;
  colors: {
    primary: string;
    accent: string;
    text: string;
  };
};

export function TestResultScore({ score, maxScore, percentage, colors }: TestResultScoreProps) {
  // Calculer le pourcentage si manquant ou invalide
  const validPercentage = (percentage != null && !isNaN(percentage) && isFinite(percentage))
    ? percentage
    : (maxScore > 0 && score != null && !isNaN(score) ? (score / maxScore) * 100 : 0);
  
  const validScore = score != null && !isNaN(score) ? score : 0;
  const validMaxScore = maxScore != null && !isNaN(maxScore) && maxScore > 0 ? maxScore : 100;
  
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="mb-4">
          <CheckCircle className="h-16 w-16 mx-auto" style={{ color: colors.primary }} />
        </div>
        <div className="mb-2">
          <span 
            className="text-5xl font-bold"
            style={{ color: colors.primary }}
          >
            {validScore}
          </span>
          <span 
            className="text-2xl ml-2"
            style={{ color: colors.text }}
          >
            / {validMaxScore}
          </span>
        </div>
        <div 
          className="text-2xl font-semibold"
          style={{ color: colors.accent }}
        >
          {validPercentage.toFixed(1)}%
        </div>
        
        {/* Barre de progression */}
        <div 
          className="w-64 h-3 rounded-full mt-4 mx-auto"
          style={{ backgroundColor: `${colors.primary}20` }}
        >
          <div
            className="h-3 rounded-full transition-all"
            style={{
              width: `${Math.min(100, Math.max(0, validPercentage))}%`,
              backgroundColor: colors.primary,
            }}
          />
        </div>
      </div>
    </div>
  );
}









