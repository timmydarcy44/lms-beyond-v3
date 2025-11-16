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
            {score}
          </span>
          <span 
            className="text-2xl ml-2"
            style={{ color: colors.text }}
          >
            / {maxScore}
          </span>
        </div>
        <div 
          className="text-2xl font-semibold"
          style={{ color: colors.accent }}
        >
          {percentage.toFixed(1)}%
        </div>
        
        {/* Barre de progression */}
        <div 
          className="w-64 h-3 rounded-full mt-4 mx-auto"
          style={{ backgroundColor: `${colors.primary}20` }}
        >
          <div
            className="h-3 rounded-full transition-all"
            style={{
              width: `${percentage}%`,
              backgroundColor: colors.primary,
            }}
          />
        </div>
      </div>
    </div>
  );
}



