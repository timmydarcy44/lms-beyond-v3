"use client";

import { useLearningSession } from "@/hooks/use-learning-session";
import { ReactNode } from "react";

type ContentType = "course" | "path" | "resource" | "test";

interface LearningSessionTrackerProps {
  contentType: ContentType;
  contentId: string;
  children: ReactNode;
  showIndicator?: boolean;
}

/**
 * Composant wrapper qui track automatiquement le temps de session
 * et le temps actif basé sur les mouvements de souris et l'activité utilisateur
 */
export function LearningSessionTracker({
  contentType,
  contentId,
  children,
  showIndicator = false,
}: LearningSessionTrackerProps) {
  const {
    totalDurationFormatted,
    activeDurationFormatted,
    isIdle,
  } = useLearningSession({
    contentType,
    contentId,
  });

  return (
    <>
      {children}
      {showIndicator && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Temps total:</span>
              <span className="font-medium">{totalDurationFormatted}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Temps actif:</span>
              <span className={`font-medium ${isIdle ? "text-gray-400" : "text-green-600"}`}>
                {activeDurationFormatted}
              </span>
              {isIdle && (
                <span className="text-xs text-gray-400">(inactif)</span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}





