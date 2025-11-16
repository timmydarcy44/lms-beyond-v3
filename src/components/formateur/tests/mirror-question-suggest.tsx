"use client";

import { useState, useEffect } from "react";
import { Sparkles, Check, X, Edit2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { generateMirrorQuestion } from "@/lib/ai/generate-mirror-question";
import { checkAIConfigClient } from "@/lib/utils/check-ai-config";
import type { TestBuilderQuestion } from "@/types/test-builder";
import { nanoid } from "nanoid";

type MirrorQuestionSuggestProps = {
  question: TestBuilderQuestion;
  onAccept: (mirrorQuestion: TestBuilderQuestion) => void;
  onReject: () => void;
  existingMirrorId?: string;
};

export function MirrorQuestionSuggest({
  question,
  onAccept,
  onReject,
  existingMirrorId,
}: MirrorQuestionSuggestProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestedMirror, setSuggestedMirror] = useState<{
    title: string;
    is_positive: boolean;
    options?: Array<{ value: string; points?: number }>;
    confidence: number;
    explanation?: string;
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [aiConfig, setAiConfig] = useState<{
    isConfigured: boolean;
    provider: "openai" | "anthropic" | "none";
  } | null>(null);

  useEffect(() => {
    checkAIConfigClient()
      .then(setAiConfig)
      .catch((error) => {
        console.error("[mirror-question-suggest] Error checking AI config:", error);
        setAiConfig({ isConfigured: false, provider: "none" });
      });
  }, []);

  // Vérifier si la question peut avoir un miroir
  const canHaveMirror =
    (question.type === "likert" || question.type === "single" || question.type === "multiple") &&
    !question.is_mirror_of && // Ne pas proposer de miroir si c'est déjà un miroir
    !existingMirrorId; // Ne pas proposer si un miroir existe déjà

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await generateMirrorQuestion({
        question: question.title,
        category: question.category,
        type: question.type,
        options: question.options?.map((opt) => ({
          value: opt.value,
          points: opt.points,
        })),
        context: question.context,
      });

      setSuggestedMirror(result);
      setEditedTitle(result.mirror_question);
      setIsEditing(false);
    } catch (error) {
      console.error("[mirror-question-suggest] Error generating:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAccept = () => {
    if (!suggestedMirror) return;

    const mirrorQuestion: TestBuilderQuestion = {
      id: nanoid(),
      title: editedTitle || suggestedMirror.title,
      type: question.type,
      context: question.context,
      category: question.category,
      score: question.score,
      weight: question.weight,
      is_mirror_of: question.id,
      is_positive: suggestedMirror.is_positive,
      bias_detection_enabled: true,
      status: "draft",
      // Copier les options si Likert (déjà inversées par l'IA)
      options:
        question.type === "likert" && suggestedMirror.options
          ? suggestedMirror.options.map((opt, index) => ({
              id: nanoid(),
              value: opt.value,
              correct: false, // Les questions miroirs n'ont pas de "bonne" réponse
              points: opt.points || 0,
            }))
          : question.options?.map((opt) => ({
              ...opt,
              id: nanoid(),
            })),
      likert: question.likert,
      scale: question.scale,
    };

    // Mettre à jour la question originale pour référencer le miroir
    onAccept(mirrorQuestion);
  };

  if (!canHaveMirror) {
    return null;
  }

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-sm font-medium text-blue-900">
              Question miroir pour détection de biais
            </CardTitle>
          </div>
          {suggestedMirror && (
            <Badge variant="outline" className="text-xs">
              Confiance: {Math.round(suggestedMirror.confidence * 100)}%
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!suggestedMirror ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Une question miroir permet de détecter les biais cognitifs (comme le biais de
              désirabilité sociale) en comparant les réponses à deux questions mesurant le même
              trait de manière inverse.
            </p>
            
            {aiConfig && !aiConfig.isConfigured && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-xs text-amber-800">
                  L'IA n'est pas configurée. La génération utilisera un fallback basique.
                  <br />
                  <a
                    href="/docs/IA_CONFIGURATION.md"
                    target="_blank"
                    className="underline font-medium"
                  >
                    Voir le guide de configuration
                  </a>
                </AlertDescription>
              </Alert>
            )}

            {aiConfig && aiConfig.isConfigured && (
              <div className="text-xs text-gray-500">
                IA configurée : {aiConfig.provider === "openai" ? "OpenAI (GPT-4o-mini)" : "Anthropic (Claude 3.5 Sonnet)"}
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full"
              variant="outline"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Générer une question miroir {aiConfig?.isConfigured ? "avec l'IA" : "(basique)"}
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertDescription className="text-xs text-gray-600">
                {suggestedMirror.explanation ||
                  "Cette question miroir mesure le même trait que la question originale mais de manière inverse."}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Question miroir proposée :
              </label>
              {isEditing ? (
                <Textarea
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="min-h-[80px]"
                  placeholder="Modifiez la question miroir..."
                />
              ) : (
                <div className="rounded-md border border-gray-200 bg-white p-3 text-sm">
                  {editedTitle || suggestedMirror.title}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant={suggestedMirror.is_positive ? "default" : "secondary"}
                className="text-xs"
              >
                {suggestedMirror.is_positive ? "Formulation positive" : "Formulation négative"}
              </Badge>
              {question.is_positive !== undefined && (
                <Badge variant="outline" className="text-xs">
                  Original: {question.is_positive ? "positive" : "négative"}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={handleAccept} size="sm" className="flex-1">
                <Check className="mr-2 h-4 w-4" />
                Accepter
              </Button>
              <Button
                onClick={() => setIsEditing(!isEditing)}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                <Edit2 className="mr-2 h-4 w-4" />
                {isEditing ? "Valider" : "Modifier"}
              </Button>
              <Button onClick={onReject} size="sm" variant="outline" className="flex-1">
                <X className="mr-2 h-4 w-4" />
                Refuser
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

