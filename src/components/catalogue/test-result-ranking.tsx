"use client";

import { TrendingUp } from "lucide-react";
import type { TestCategoryResult } from "@/types/test-result";

type TestResultRankingProps = {
  categoryResults: TestCategoryResult[];
  colors: {
    primary: string;
    text: string;
    secondary: string;
  };
};

export function TestResultRanking({ categoryResults, colors }: TestResultRankingProps) {
  // Trier par score décroissant pour le classement
  const sortedResults = [...categoryResults]
    .sort((a, b) => b.score - a.score)
    .map((result, index) => ({
      ...result,
      rank: index + 1,
    }));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5" style={{ color: colors.primary }} />
        <h4 className="text-sm font-semibold" style={{ color: colors.text }}>
          Classement par catégorie
        </h4>
      </div>
      
      <div className="space-y-2">
        {sortedResults.map((result) => (
          <div
            key={result.category}
            className="flex items-center justify-between p-4 rounded-lg"
            style={{ 
              backgroundColor: `${colors.primary}10`,
              border: `1px solid ${colors.primary}20`,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm"
                style={{
                  backgroundColor: result.rank === 1 
                    ? colors.primary 
                    : `${colors.primary}30`,
                  color: result.rank === 1 ? '#FFFFFF' : colors.text,
                }}
              >
                {result.rank}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: colors.text }}>
                  {result.category}
                </p>
                <p className="text-xs" style={{ color: colors.secondary }}>
                  {result.score}/{result.maxScore} points
                </p>
              </div>
            </div>
            <div className="text-right">
              <p 
                className="text-lg font-bold"
                style={{ color: colors.primary }}
              >
                {result.percentage.toFixed(0)}%
              </p>
              {/* Barre de progression */}
              <div 
                className="w-24 h-2 rounded-full mt-1"
                style={{ backgroundColor: `${colors.primary}20` }}
              >
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${result.percentage}%`,
                    backgroundColor: colors.primary,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Note explicative pour l'analyse */}
      <p className="text-xs mt-4 text-center" style={{ color: colors.secondary, opacity: 0.7 }}>
        💡 Vous pouvez obtenir une analyse détaillée de vos résultats en cliquant sur "Analyser le résultat"
      </p>
    </div>
  );
}

