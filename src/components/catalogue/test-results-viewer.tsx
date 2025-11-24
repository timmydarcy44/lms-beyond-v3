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
    let isMounted = true;
    
    async function loadTestResults() {
      try {
        const supabase = createSupabaseBrowserClient();
        
        if (!supabase || !userId) {
          console.error("[test-results-viewer] Supabase client or userId not available");
          if (isMounted) {
            setTestResults([]);
            setLoading(false);
          }
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
          .not("completed_at", "is", null)
          .order("completed_at", { ascending: false })
          .limit(20);

        // Récupérer aussi les résultats des tests soft skills (mental_health_assessments)
        const { data: mentalHealthAssessments, error: mentalHealthError } = await supabase
          .from("mental_health_assessments")
          .select(`
            id,
            questionnaire_id,
            overall_score,
            dimension_scores,
            analysis_summary,
            analysis_details,
            metadata,
            created_at,
            mental_health_questionnaires (
              id,
              title,
              description
            )
          `)
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20);

        if (!isMounted) return;

        if (error) {
          // Logger l'erreur complète pour le débogage
          console.error("[test-results-viewer] Error fetching test results:", error);
          console.error("[test-results-viewer] Error details:", {
            message: error?.message,
            code: error?.code,
            details: error?.details,
            hint: error?.hint,
            errorString: String(error),
            errorJSON: JSON.stringify(error, null, 2),
          });
          // Ne pas bloquer si c'est juste une erreur de permissions ou de table inexistante
          if (error?.code !== '42P01' && error?.code !== '42501') {
            if (isMounted) {
              setTestResults([]);
              setLoading(false);
            }
            return;
          }
        }

        if (mentalHealthError) {
          // Logger l'erreur complète pour le débogage
          console.error("[test-results-viewer] Error fetching mental health assessments:", mentalHealthError);
          console.error("[test-results-viewer] Mental health error details:", {
            message: mentalHealthError?.message,
            code: mentalHealthError?.code,
            details: mentalHealthError?.details,
            hint: mentalHealthError?.hint,
            errorString: String(mentalHealthError),
            errorJSON: JSON.stringify(mentalHealthError, null, 2),
          });
          // Ne pas bloquer si c'est juste une erreur de permissions ou de table inexistante
          // On continue avec les résultats de test_attempts seulement
        }

        if (!isMounted) return;

        // Transformer les données des test_attempts
        const testResults: TestWithAttempt[] = (attempts || []).map((attempt: any) => {
          // S'assurer que percentage est calculé si manquant
          let percentage = attempt.percentage;
          if (percentage == null || isNaN(percentage)) {
            if (attempt.max_score && attempt.total_score != null) {
              percentage = (attempt.total_score / attempt.max_score) * 100;
            } else {
              percentage = 0;
            }
          }
          
          // S'assurer que category_results ont bien percentage et maxScore
          const categoryResults = (attempt.category_results || []).map((cat: any) => {
            const maxScore = cat.maxScore || 100;
            const score = cat.score || 0;
            const catPercentage = cat.percentage != null && !isNaN(cat.percentage) 
              ? cat.percentage 
              : (maxScore > 0 ? (score / maxScore) * 100 : 0);
            
            return {
              category: cat.category || '',
              score: score,
              maxScore: maxScore,
              percentage: catPercentage,
            };
          });
          
          return {
            id: attempt.tests?.id || attempt.test_id,
            title: attempt.tests?.title || "Test",
            description: attempt.tests?.description || null,
            display_format: (attempt.tests?.display_format || "score") as TestResultDisplayFormat,
            attempt: {
              id: attempt.id,
              test_id: attempt.test_id,
              user_id: attempt.user_id,
              completed_at: attempt.completed_at,
              total_score: attempt.total_score || 0,
              max_score: attempt.max_score || 100,
              percentage: percentage,
              category_results: categoryResults,
              answers: attempt.answers || {},
              created_at: attempt.created_at,
              existingAnalysis: attempt.test_result_analyses?.[0]?.analysis || null,
            },
          };
        });

        // Transformer les données des mental_health_assessments en format compatible
        const softSkillsResults: TestWithAttempt[] = (mentalHealthAssessments || []).map((assessment: any) => {
          // Convertir dimension_scores en category_results
          // Pour les soft skills, les scores sont déjà sur 100, donc maxScore = 100
          const categoryResults = Object.entries(assessment.dimension_scores || {}).map(([dimension, score]) => {
            const numericScore = typeof score === 'number' ? score : 0;
            const maxScore = 100; // Les scores soft skills sont sur 100
            const percentage = maxScore > 0 ? (numericScore / maxScore) * 100 : 0;
            
            return {
              category: dimension,
              score: numericScore,
              maxScore: maxScore,
              percentage: percentage,
            };
          });

          return {
            id: assessment.mental_health_questionnaires?.id || assessment.questionnaire_id,
            title: assessment.mental_health_questionnaires?.title || "Soft Skills – Profil 360",
            description: assessment.mental_health_questionnaires?.description || null,
            display_format: "ranking" as TestResultDisplayFormat,
            attempt: {
              id: assessment.id,
              test_id: assessment.questionnaire_id,
              user_id: userId,
              completed_at: assessment.created_at,
              total_score: assessment.overall_score || 0,
              max_score: 100,
              percentage: assessment.overall_score || 0,
              category_results: categoryResults,
              answers: {},
              created_at: assessment.created_at,
              existingAnalysis: assessment.analysis_summary || assessment.analysis_details || null,
            },
          };
        });

        // Combiner les résultats
        const allResults = [...testResults, ...softSkillsResults].sort((a, b) => {
          const dateA = new Date(a.attempt?.completed_at || a.attempt?.created_at || 0).getTime();
          const dateB = new Date(b.attempt?.completed_at || b.attempt?.created_at || 0).getTime();
          return dateB - dateA;
        });

        if (isMounted) {
          setTestResults(allResults);
          setLoading(false);
        }
      } catch (error) {
        console.error("[test-results-viewer] Error:", error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : error);
        if (isMounted) {
          setTestResults([]);
          setLoading(false);
        }
      }
    }

    loadTestResults();
    
    return () => {
      isMounted = false;
    };
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
                  {test.attempt?.percentage != null && !isNaN(test.attempt.percentage) 
                    ? test.attempt.percentage.toFixed(0) 
                    : (test.attempt?.max_score && test.attempt?.total_score != null
                      ? ((test.attempt.total_score / test.attempt.max_score) * 100).toFixed(0)
                      : '0')}%
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
                  score={test.attempt.total_score ?? 0}
                  maxScore={test.attempt.max_score ?? 100}
                  percentage={test.attempt.percentage ?? (test.attempt.max_score && test.attempt.total_score != null ? (test.attempt.total_score / test.attempt.max_score) * 100 : 0)}
                  colors={{ primary: primaryColor, accent: accentColor, text: textColor }}
                />
              )}
              
              {test.display_format === "detailed" && test.attempt && (
                <div className="space-y-4">
                  <TestResultScore 
                    score={test.attempt.total_score ?? 0}
                    maxScore={test.attempt.max_score ?? 100}
                    percentage={test.attempt.percentage ?? (test.attempt.max_score && test.attempt.total_score != null ? (test.attempt.total_score / test.attempt.max_score) * 100 : 0)}
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
                              {cat.score}/{cat.maxScore} ({typeof cat.percentage === 'number' && !isNaN(cat.percentage) 
                                ? cat.percentage.toFixed(0) 
                                : (cat.maxScore > 0 ? ((cat.score / cat.maxScore) * 100).toFixed(0) : '0')}%)
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

