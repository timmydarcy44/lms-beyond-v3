"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { TestAttempt, TestCategoryResult } from "@/types/test-result";

type TestResultAnalysisButtonProps = {
  testId: string;
  testTitle: string;
  categoryResults: TestCategoryResult[];
  userId: string;
  attemptId: string;
  colors: {
    primary: string;
    accent: string;
    text: string;
  };
  existingAnalysis?: string | null;
  onAnalysisComplete?: (analysis: string) => void;
};

export function TestResultAnalysisButton({
  testId,
  testTitle,
  categoryResults,
  userId,
  attemptId,
  colors,
  existingAnalysis,
  onAnalysisComplete,
}: TestResultAnalysisButtonProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(existingAnalysis || null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    
    try {
      const response = await fetch("/api/tests/analyze-results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testId,
          testTitle,
          categoryResults,
          userId,
          attemptId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de l'analyse");
      }

      const data = await response.json();
      setAnalysis(data.analysis);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(data.analysis);
      }

      toast.success("Analyse terminée", {
        description: "L'analyse de vos résultats a été générée avec succès.",
      });
    } catch (error) {
      console.error("[test-analysis] Erreur:", error);
      toast.error("Erreur lors de l'analyse", {
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de l'analyse des résultats.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (analysis) {
    return (
      <div className="mt-6 p-6 rounded-xl border-2" style={{ 
        backgroundColor: `${colors.primary}05`,
        borderColor: `${colors.primary}30`,
      }}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5" style={{ color: colors.primary }} />
          <h4 className="text-lg font-semibold" style={{ color: colors.text }}>
            Analyse de vos résultats
          </h4>
        </div>
        <div 
          className="prose prose-sm max-w-none"
          style={{ color: colors.text }}
          dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br />') }}
        />
      </div>
    );
  }

  return (
    <div className="mt-6">
      <Button
        onClick={handleAnalyze}
        disabled={isAnalyzing}
        className="w-full"
        style={{
          backgroundColor: colors.primary,
          color: '#FFFFFF',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.accent;
          e.currentTarget.style.opacity = '0.9';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = colors.primary;
          e.currentTarget.style.opacity = '1';
        }}
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Analyse en cours...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            Analyser le résultat
          </>
        )}
      </Button>
    </div>
  );
}
