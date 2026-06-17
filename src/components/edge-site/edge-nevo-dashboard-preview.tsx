"use client";

import {
  ApprenantAssessmentResults,
  type DiscScores,
} from "@/components/apprenant/apprenant-assessment-results";
import type { AxisKey } from "@/components/idmc/IdmcRadarChart";

const DEMO_DISC: DiscScores = { D: 8, I: 3, S: 4, C: 5 };

const DEMO_IDMC: Record<AxisKey, number> = {
  A1: 4.2,
  A2: 3.8,
  A3: 3.5,
  A4: 4.7,
  A5: 3.9,
  A6: 3.6,
  A7: 4.1,
  A8: 3.4,
};

const DEMO_SOFT_SKILLS = [
  { skill: "Leadership", score: 4.5 },
  { skill: "Créativité", score: 4.2 },
  { skill: "Esprit critique", score: 4.0 },
  { skill: "Sens de l'organisation", score: 3.8 },
  { skill: "Sens des responsabilités", score: 3.6 },
];

/** Aperçu marketing « Mes résultats » — interface nevo / Beyond dans le MacBook. */
export function EdgeNevoDashboardPreview() {
  return (
    <div className="pointer-events-none h-full select-none overflow-hidden bg-[#0b0e14] p-2 sm:p-3">
      <div className="origin-top scale-[0.92] sm:scale-100">
        <ApprenantAssessmentResults
          variant="compact"
          publicMode={false}
          firstName="Praticien"
          discScores={DEMO_DISC}
          idmcAxes={DEMO_IDMC}
          softSkillsRadar={DEMO_SOFT_SKILLS}
          idmcLevel="Praticien"
        />
      </div>
    </div>
  );
}
