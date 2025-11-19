"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

type Question = {
  id: string;
  question_text: string;
  question_type: "multiple_choice" | "single_choice" | "likert" | "text" | "number";
  is_required: boolean;
  conditional_logic?: {
    depends_on?: string;
    conditions?: Array<{
      value: string | number;
      show: boolean;
    }>;
  };
  options?: Array<{ id: string; label: string; value: string | number }>;
  likert_scale?: {
    min: number;
    max: number;
    labels: Record<string, string>;
  };
};

type Questionnaire = {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
};

type MentalHealthQuestionnaireProps = {
  questionnaire: Questionnaire;
  onSubmit: (responses: Record<string, any>) => Promise<void>;
};

export function MentalHealthQuestionnaire({
  questionnaire,
  onSubmit,
}: MentalHealthQuestionnaireProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [visibleQuestions, setVisibleQuestions] = useState<Question[]>([]);

  // Filtrer les questions visibles basées sur la logique conditionnelle
  useEffect(() => {
    const visible: Question[] = [];
    const processedQuestionIds = new Set<string>();
    
    const processQuestion = (question: Question, index: number) => {
      // Éviter les doublons
      if (processedQuestionIds.has(question.id)) {
        return;
      }

      // Première question toujours visible
      if (index === 0) {
        visible.push(question);
        processedQuestionIds.add(question.id);
        return;
      }

      // Vérifier la logique conditionnelle
      if (question.conditional_logic?.depends_on) {
        const dependsOnId = question.conditional_logic.depends_on;
        const previousResponse = responses[dependsOnId];
        
        if (previousResponse !== undefined) {
          const conditions = question.conditional_logic.conditions || [];
          const matchingCondition = conditions.find((condition) => {
            const responseValue = Array.isArray(previousResponse)
              ? previousResponse
              : typeof previousResponse === "object" && previousResponse !== null
              ? [previousResponse.value || previousResponse.selected || previousResponse]
              : [previousResponse];
            
            // Support pour comparaison par valeur ou par texte partiel
            return responseValue.some((val: any) => {
              const valStr = val?.toString().toLowerCase() || "";
              const conditionStr = condition.value?.toString().toLowerCase() || "";
              
              // Comparaison exacte
              if (valStr === conditionStr) return true;
              
              // Comparaison partielle (ex: "stress_match" contient "stress")
              if (valStr.includes(conditionStr) || conditionStr.includes(valStr)) return true;
              
              return false;
            }) && condition.show;
          });

          if (matchingCondition) {
            visible.push(question);
            processedQuestionIds.add(question.id);

            // Traiter les questions de suivi (follow-up) si présentes
            const followUpQuestions = (matchingCondition as any).follow_up_questions;
            if (followUpQuestions && followUpQuestions.length > 0) {
              followUpQuestions.forEach((followUp: any, followUpIndex: number) => {
                const followUpQuestion: Question = {
                  id: `${question.id}-followup-${followUpIndex}`,
                  question_text: followUp.question_text,
                  question_type: followUp.question_type || "single_choice",
                  is_required: followUp.is_required !== false,
                  options: followUp.options?.map((opt: any, optIndex: number) => ({
                    id: `opt-${question.id}-followup-${followUpIndex}-${optIndex}`,
                    label: opt.label || opt.text || opt,
                    value: opt.value || opt.label || opt.text || opt,
                  })),
                  likert_scale: followUp.likert_scale,
                };
                
                if (!processedQuestionIds.has(followUpQuestion.id)) {
                  visible.push(followUpQuestion);
                  processedQuestionIds.add(followUpQuestion.id);
                }
              });
            }
          }
        } else {
          // Si la réponse précédente n'existe pas encore, ne pas afficher
          return;
        }
      } else {
        // Pas de logique conditionnelle, toujours visible
        visible.push(question);
        processedQuestionIds.add(question.id);
      }
    };

    questionnaire.questions.forEach((question, index) => {
      processQuestion(question, index);
    });

    setVisibleQuestions(visible);
  }, [questionnaire.questions, responses]);

  const currentQuestion = visibleQuestions[currentQuestionIndex];
  const progress = visibleQuestions.length > 0 
    ? ((currentQuestionIndex + 1) / visibleQuestions.length) * 100 
    : 0;

  const handleAnswer = (questionId: string, value: any) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleNext = () => {
    if (!currentQuestion) return;

    // Vérifier si la question est obligatoire et a une réponse
    if (currentQuestion.is_required && !responses[currentQuestion.id]) {
      toast.error("Cette question est obligatoire");
      return;
    }

    if (currentQuestionIndex < visibleQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    // Vérifier que toutes les questions obligatoires ont une réponse
    const missingRequired = visibleQuestions.some(
      (q) => q.is_required && !responses[q.id]
    );

    if (missingRequired) {
      toast.error("Veuillez répondre à toutes les questions obligatoires");
      return;
    }

    try {
      await onSubmit(responses);
      toast.success("Questionnaire soumis avec succès !");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la soumission");
    }
  };

  if (!currentQuestion) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-600">Aucune question disponible</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{questionnaire.title}</CardTitle>
            {questionnaire.description && (
              <CardDescription className="mt-2">{questionnaire.description}</CardDescription>
            )}
          </div>
          <div className="text-sm text-gray-500">
            Question {currentQuestionIndex + 1} sur {visibleQuestions.length}
          </div>
        </div>
        <Progress value={progress} className="mt-4" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label className="text-base font-medium">
            {currentQuestion.question_text}
            {currentQuestion.is_required && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </Label>

          {/* Choix unique */}
          {currentQuestion.question_type === "single_choice" && currentQuestion.options && (
            <RadioGroup
              value={responses[currentQuestion.id]?.toString() || ""}
              onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
            >
              {currentQuestion.options.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value.toString()} id={option.id} />
                  <Label htmlFor={option.id} className="font-normal cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {/* Choix multiple */}
          {currentQuestion.question_type === "multiple_choice" && currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((option) => {
                const currentValue = responses[currentQuestion.id] || [];
                const isChecked = Array.isArray(currentValue) && currentValue.includes(option.value);
                
                return (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.id}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        const current = responses[currentQuestion.id] || [];
                        const newValue = Array.isArray(current) ? [...current] : [];
                        
                        if (checked) {
                          newValue.push(option.value);
                        } else {
                          const index = newValue.indexOf(option.value);
                          if (index > -1) {
                            newValue.splice(index, 1);
                          }
                        }
                        
                        handleAnswer(currentQuestion.id, newValue);
                      }}
                    />
                    <Label htmlFor={option.id} className="font-normal cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                );
              })}
            </div>
          )}

          {/* Échelle de Likert */}
          {currentQuestion.question_type === "likert" && currentQuestion.likert_scale && (
            <div className="space-y-4">
              <Slider
                value={[responses[currentQuestion.id] || currentQuestion.likert_scale.min]}
                onValueChange={([value]) => handleAnswer(currentQuestion.id, value)}
                min={currentQuestion.likert_scale.min}
                max={currentQuestion.likert_scale.max}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>{currentQuestion.likert_scale.labels[currentQuestion.likert_scale.min.toString()] || currentQuestion.likert_scale.min}</span>
                <span className="font-medium">
                  {responses[currentQuestion.id] || currentQuestion.likert_scale.min}
                </span>
                <span>{currentQuestion.likert_scale.labels[currentQuestion.likert_scale.max.toString()] || currentQuestion.likert_scale.max}</span>
              </div>
            </div>
          )}

          {/* Réponse libre */}
          {currentQuestion.question_type === "text" && (
            <Textarea
              value={responses[currentQuestion.id] || ""}
              onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
              placeholder="Votre réponse..."
              rows={4}
            />
          )}

          {/* Nombre */}
          {currentQuestion.question_type === "number" && (
            <Input
              type="number"
              value={responses[currentQuestion.id] || ""}
              onChange={(e) => handleAnswer(currentQuestion.id, parseFloat(e.target.value) || 0)}
              placeholder="Entrez un nombre"
            />
          )}
        </div>

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            Précédent
          </Button>
          <Button
            onClick={handleNext}
            disabled={currentQuestion.is_required && !responses[currentQuestion.id]}
          >
            {currentQuestionIndex < visibleQuestions.length - 1 ? "Suivant" : "Soumettre"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

