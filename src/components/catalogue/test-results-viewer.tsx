"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { ClipboardCheck, TrendingUp, BarChart3 } from "lucide-react";
import { TestResultRanking } from "./test-result-ranking";
import { TestResultRadar } from "./test-result-radar";
import { TestResultScore } from "./test-result-score";
import { TestResultAnalysisButton } from "./test-result-analysis-button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import type { TestWithAttempt, TestResultDisplayFormat } from "@/types/test-result";

type TestResultsViewerProps = {
  userId: string;
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    text?: string;
    textSecondary?: string;
    surface?: string;
    background?: string;
  };
  showHeader?: boolean;
};

export function TestResultsViewer({ 
  userId, 
  colors = {},
  showHeader = true 
}: TestResultsViewerProps) {
  const [testResults, setTestResults] = useState<TestWithAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  // Couleurs par défaut (Apple-style)
  const primaryColor = colors.primary || '#8B6F47';
  const textColor = colors.text || '#5D4037';
  const textSecondaryColor = colors.textSecondary || '#8B6F47';
  const surfaceColor = colors.surface || '#F5F0E8';
  const accentColor = colors.accent || '#D4AF37';

  useEffect(() => {
    async function loadTestResults() {
      try {
        const supabase = createSupabaseBrowserClient();
        
        if (!supabase || !userId) {
          console.error("[test-results-viewer] Supabase client or userId not available");
          setTestResults([]);
          setLoading(false);
          return;
        }
        
        // Récupérer les tests passés par l'utilisateur avec les analyses existantes
        const { data: attempts, error } = await supabase
          .from("test_attempts")
          .select(`
            id,
            test_id,
            user_id,
            completed_at,
            total_score,
            max_score,
            percentage,
            category_results,
            answers,
            created_at,
            tests (
              id,
              title,
              description,
              display_format
            ),
            test_result_analyses (
              analysis
            )
          `)
          .eq("user_id", userId)
          .order("completed_at", { ascending: false });

        if (error) {
          console.error("[test-results-viewer] Error fetching test results:", error);
          setTestResults([]);
          return;
        }

        // Transformer les données
        const results: TestWithAttempt[] = (attempts || []).map((attempt: any) => ({
          id: attempt.tests?.id || attempt.test_id,
          title: attempt.tests?.title || "Test",
          description: attempt.tests?.description || null,
          display_format: (attempt.tests?.display_format || "score") as TestResultDisplayFormat,
          attempt: {
            id: attempt.id,
            test_id: attempt.test_id,
            user_id: attempt.user_id,
            completed_at: attempt.completed_at,
            total_score: attempt.total_score,
            max_score: attempt.max_score,
            percentage: attempt.percentage,
            category_results: attempt.category_results || [],
            answers: attempt.answers || {},
            created_at: attempt.created_at,
            existingAnalysis: attempt.test_result_analyses?.[0]?.analysis || null,
          },
        }));

        setTestResults(results);
      } catch (error) {
        console.error("[test-results-viewer] Error:", error);
        setTestResults([]);
      } finally {
        setLoading(false);
      }
    }

    loadTestResults();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-lg" style={{ color: textSecondaryColor }}>
          Chargement des résultats...
        </div>
      </div>
    );
  }

  if (testResults.length === 0) {
    return (
      <div className="mt-8">
        {showHeader && (
          <h2 
            className="text-2xl font-semibold mb-6"
            style={{ color: textColor }}
          >
            Résultats de tests
          </h2>
        )}
        <div 
          className="p-12 rounded-xl text-center"
          style={{ 
            backgroundColor: surfaceColor,
            border: `1px solid ${primaryColor}20`,
          }}
        >
          <ClipboardCheck 
            className="h-12 w-12 mx-auto mb-4"
            style={{ color: textSecondaryColor, opacity: 0.5 }}
          />
          <p 
            className="text-lg font-medium mb-2"
            style={{ color: textColor }}
          >
            Aucun test passé pour le moment
          </p>
          <p 
            className="text-sm"
            style={{ color: textSecondaryColor }}
          >
            Cet utilisateur n'a pas encore complété de tests
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      {showHeader && (
        <h2 
          className="text-2xl font-semibold mb-6"
          style={{ color: textColor }}
        >
          Résultats de tests ({testResults.length})
        </h2>
      )}

      <div className="space-y-6">
        {testResults.map((test) => (
          <div
            key={test.id}
            className="rounded-xl overflow-hidden"
            style={{ 
              backgroundColor: surfaceColor,
              border: `1px solid ${primaryColor}20`,
            }}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 
                    className="text-xl font-semibold mb-1"
                    style={{ color: textColor }}
                  >
                    {test.title}
                  </h3>
                  {test.description && (
                    <p 
                      className="text-sm"
                      style={{ color: textSecondaryColor }}
                    >
                      {test.description}
                    </p>
                  )}
                  <p 
                    className="text-xs mt-2"
                    style={{ color: textSecondaryColor }}
                  >
                    Passé {formatDistanceToNow(new Date(test.attempt?.completed_at || test.attempt?.created_at || Date.now()), { addSuffix: true, locale: fr })}
                  </p>
                </div>
                <div 
                  className="px-3 py-1 rounded-full text-sm font-semibold"
                  style={{ 
                    backgroundColor: `${primaryColor}15`,
                    color: primaryColor,
                  }}
                >
                  {test.attempt?.percentage?.toFixed(0)}%
                </div>
              </div>

              {/* Affichage selon le format */}
              {test.display_format === "ranking" && test.attempt?.category_results && (
                <>
                  <TestResultRanking 
                    categoryResults={test.attempt.category_results}
                    colors={{ primary: primaryColor, text: textColor, secondary: textSecondaryColor }}
                  />
                  {/* CTA Analyse du résultat pour les soft skills */}
                  <TestResultAnalysisButton
                    testId={test.id}
                    testTitle={test.title}
                    categoryResults={test.attempt.category_results}
                    userId={userId}
                    attemptId={test.attempt.id}
                    existingAnalysis={(test.attempt as any).existingAnalysis}
                    colors={{ primary: primaryColor, accent: accentColor, text: textColor }}
                  />
                </>
              )}
              
              {test.display_format === "radar" && test.attempt?.category_results && (
                <TestResultRadar 
                  categoryResults={test.attempt.category_results}
                  colors={{ primary: primaryColor, accent: accentColor, text: textColor }}
                />
              )}
              
              {test.display_format === "score" && test.attempt && (
                <TestResultScore 
                  score={test.attempt.total_score}
                  maxScore={test.attempt.max_score}
                  percentage={test.attempt.percentage}
                  colors={{ primary: primaryColor, accent: accentColor, text: textColor }}
                />
              )}
              
              {test.display_format === "detailed" && test.attempt && (
                <div className="space-y-4">
                  <TestResultScore 
                    score={test.attempt.total_score}
                    maxScore={test.attempt.max_score}
                    percentage={test.attempt.percentage}
                    colors={{ primary: primaryColor, accent: accentColor, text: textColor }}
                  />
                  {test.attempt.category_results && test.attempt.category_results.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold mb-3" style={{ color: textColor }}>
                        Détails par catégorie
                      </h4>
                      <div className="space-y-2">
                        {test.attempt.category_results.map((cat, idx) => (
                          <div 
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-lg"
                            style={{ backgroundColor: `${primaryColor}10` }}
                          >
                            <span className="text-sm" style={{ color: textColor }}>
                              {cat.category}
                            </span>
                            <span className="text-sm font-semibold" style={{ color: primaryColor }}>
                              {cat.score}/{cat.maxScore} ({cat.percentage.toFixed(0)}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

