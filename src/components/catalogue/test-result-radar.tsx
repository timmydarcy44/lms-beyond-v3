"use client";

import { BarChart3 } from "lucide-react";
import type { TestCategoryResult } from "@/types/test-result";

type TestResultRadarProps = {
  categoryResults: TestCategoryResult[];
  colors: {
    primary: string;
    accent: string;
    text: string;
  };
};

export function TestResultRadar({ categoryResults, colors }: TestResultRadarProps) {
  // Transformer les données pour le graphique radar
  const radarData = categoryResults.map((result) => ({
    category: result.category,
    score: result.percentage, // Utiliser le pourcentage pour le radar
    fullMark: 100, // Score maximum sur le radar
  }));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-5 w-5" style={{ color: colors.primary }} />
        <h4 className="text-sm font-semibold" style={{ color: colors.text }}>
          Profil de compétences (Radar)
        </h4>
      </div>
      
      {/* Graphique radar simplifié avec SVG */}
      <div className="w-full h-64 flex items-center justify-center">
        <svg 
          viewBox="0 0 400 400" 
          className="w-full h-full"
          style={{ maxWidth: '400px', maxHeight: '400px' }}
        >
          {/* Grille polaire */}
          {[1, 2, 3, 4, 5].map((ring) => (
            <circle
              key={ring}
              cx="200"
              cy="200"
              r={ring * 30}
              fill="none"
              stroke={colors.primary}
              strokeWidth="1"
              opacity="0.2"
            />
          ))}
          
          {/* Lignes radiales */}
          {radarData.map((_, index) => {
            const angle = (index * 360) / radarData.length - 90;
            const radian = (angle * Math.PI) / 180;
            const x = 200 + 150 * Math.cos(radian);
            const y = 200 + 150 * Math.sin(radian);
            return (
              <line
                key={index}
                x1="200"
                y1="200"
                x2={x}
                y2={y}
                stroke={colors.primary}
                strokeWidth="1"
                opacity="0.3"
              />
            );
          })}
          
          {/* Polygone radar */}
          <polygon
            points={radarData.map((item, index) => {
              const angle = (index * 360) / radarData.length - 90;
              const radian = (angle * Math.PI) / 180;
              const radius = (item.score / 100) * 150;
              const x = 200 + radius * Math.cos(radian);
              const y = 200 + radius * Math.sin(radian);
              return `${x},${y}`;
            }).join(' ')}
            fill={colors.primary}
            fillOpacity="0.3"
            stroke={colors.primary}
            strokeWidth="2"
          />
          
          {/* Labels des catégories */}
          {radarData.map((item, index) => {
            const angle = (index * 360) / radarData.length - 90;
            const radian = (angle * Math.PI) / 180;
            const labelRadius = 170;
            const x = 200 + labelRadius * Math.cos(radian);
            const y = 200 + labelRadius * Math.sin(radian);
            return (
              <text
                key={index}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="12"
                fill={colors.text}
                style={{ fontWeight: 500 }}
              >
                {item.category.length > 15 ? item.category.substring(0, 15) + '...' : item.category}
              </text>
            );
          })}
          
          {/* Points de score */}
          {radarData.map((item, index) => {
            const angle = (index * 360) / radarData.length - 90;
            const radian = (angle * Math.PI) / 180;
            const radius = (item.score / 100) * 150;
            const x = 200 + radius * Math.cos(radian);
            const y = 200 + radius * Math.sin(radian);
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill={colors.primary}
              />
            );
          })}
        </svg>
      </div>

      {/* Légende avec les scores détaillés */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        {categoryResults.map((result) => (
          <div
            key={result.category}
            className="p-2 rounded text-xs"
            style={{ backgroundColor: `${colors.primary}10` }}
          >
            <p className="font-semibold" style={{ color: colors.text }}>
              {result.category}
            </p>
            <p style={{ color: colors.text }}>
              {result.score}/{result.maxScore} ({result.percentage.toFixed(0)}%)
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

