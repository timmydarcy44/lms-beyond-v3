"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export type ImportedQuestionnaire = {
  title: string;
  description?: string;
  is_active?: boolean;
  frequency?: "weekly" | "biweekly" | "monthly";
  send_day?: number;
  send_time?: string;
  target_roles?: string[];
  metadata?: Record<string, any>;
  questions: Array<{
    id?: string;
    question_text: string;
    question_type: "multiple_choice" | "single_choice" | "likert" | "text" | "number";
    is_required?: boolean;
    options?: Array<{
      id?: string;
      label: string;
      value: string | number;
      points?: number; // Points pour le scoring
    }>;
    likert_scale?: {
      min: number;
      max: number;
      labels?: Record<string, string>;
    };
    conditional_logic?: {
      depends_on?: string; // ID ou texte de la question précédente
      conditions?: Array<{
        value: string | number;
        show: boolean;
        next_question_id?: string;
        follow_up_questions?: Array<{
          question_text: string;
          question_type: string;
          options?: Array<{ label: string; value: string | number }>;
        }>;
      }>;
    };
    scoring?: {
      enabled?: boolean;
      points?: Record<string, number>;
      weight?: number;
    };
  }>;
  scoring_config?: {
    enabled?: boolean;
    max_score?: number;
    categories?: Array<{
      name: string;
      questions: string[]; // IDs ou textes des questions
      weight: number;
    }>;
  };
};

type QuestionnaireJSONImporterProps = {
  onImport: (questionnaire: ImportedQuestionnaire) => void;
};

export function QuestionnaireJSONImporter({ onImport }: QuestionnaireJSONImporterProps) {
  const [jsonInput, setJsonInput] = useState("");
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [preview, setPreview] = useState<ImportedQuestionnaire | null>(null);

  const validateAndParse = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      
      // Validation basique
      if (!parsed.title || !parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error("Le JSON doit contenir 'title' et 'questions' (array)");
      }

      if (parsed.questions.length === 0) {
        throw new Error("Le questionnaire doit contenir au moins une question");
      }

      // Normaliser les questions
      const normalizedQuestions = parsed.questions.map((q: any, index: number) => {
        const questionId = q.id || `q-${index + 1}`;
        
        return {
          id: questionId,
          question_text: q.question_text || q.text || q.question,
          question_type: q.question_type || "single_choice",
          is_required: q.is_required !== false,
          order_index: index,
          options: q.options?.map((opt: any, optIndex: number) => ({
            id: opt.id || `opt-${index}-${optIndex}`,
            label: opt.label || opt.text || opt,
            value: opt.value || opt.label || opt.text || opt,
            points: opt.points,
          })),
          likert_scale: q.likert_scale,
          conditional_logic: q.conditional_logic ? {
            depends_on: q.conditional_logic.depends_on,
            conditions: q.conditional_logic.conditions?.map((cond: any) => ({
              value: cond.value,
              show: cond.show !== false,
              next_question_id: cond.next_question_id,
              follow_up_questions: cond.follow_up_questions,
            })),
          } : undefined,
          scoring: q.scoring || (q.points ? {
            enabled: true,
            points: typeof q.points === "object" ? q.points : undefined,
            weight: q.weight || 1,
          } : undefined),
        };
      });

      const normalized: ImportedQuestionnaire = {
        title: parsed.title,
        description: parsed.description,
        is_active: parsed.is_active,
        frequency: parsed.frequency,
        send_day: parsed.send_day,
        send_time: parsed.send_time,
        target_roles: parsed.target_roles,
        metadata: parsed.metadata,
        questions: normalizedQuestions,
        scoring_config: parsed.scoring_config,
      };

      setPreview(normalized);
      setIsValid(true);
      toast.success("JSON valide. Cliquez sur “Importer” pour l'enregistrer.");
      
      return normalized;
    } catch (error: any) {
      setIsValid(false);
      toast.error(`Erreur de validation : ${error.message}`);
      return null;
    }
  };

  const handleImport = () => {
    if (!preview) {
      const parsed = validateAndParse();
      if (parsed) {
        onImport(parsed);
      }
    } else {
      onImport(preview);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Importer un questionnaire (JSON)
        </CardTitle>
        <CardDescription>
          Collez ici le fichier JSON structuré du questionnaire. Le format attendu est décrit ci-dessous.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="json-input">Contenu JSON</Label>
          <Textarea
            id="json-input"
            value={jsonInput}
            onChange={(e) => {
              setJsonInput(e.target.value);
              setIsValid(null);
              setPreview(null);
            }}
            placeholder={`{
  "title": "Questionnaire de santé mentale",
  "description": "Évaluez votre bien-être",
  "frequency": "weekly",
  "send_day": 4,
  "send_time": "17:30",
  "target_roles": ["learner"],
  "questions": [
    {
      "question_text": "Comment vous sentez-vous aujourd'hui ?",
      "question_type": "single_choice",
      "options": [
        { "label": "Très bien", "value": "very_good", "points": 10 },
        { "label": "Bien", "value": "good", "points": 7 },
        { "label": "Moyen", "value": "average", "points": 4 },
        { "label": "Mal", "value": "bad", "points": 1 }
      ],
      "conditional_logic": {
        "depends_on": null,
        "conditions": []
      }
    }
  ],
  "scoring_config": {
    "enabled": true,
    "max_score": 100,
    "categories": [
      {
        "name": "Bien-être général",
        "questions": ["q-1"],
        "weight": 1
      }
    ]
  }
}`}
            rows={15}
            className="font-mono text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={validateAndParse} variant="outline">
            Valider le JSON
          </Button>
          {isValid === true && (
            <>
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm text-green-600">JSON valide</span>
            </>
          )}
          {isValid === false && (
            <>
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-sm text-red-600">JSON invalide</span>
            </>
          )}
        </div>

        {preview && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <h4 className="font-semibold text-green-900 mb-2">Aperçu :</h4>
            <p className="text-sm text-green-800">
              <strong>Titre :</strong> {preview.title}
            </p>
            <p className="text-sm text-green-800">
              <strong>Questions :</strong> {preview.questions.length}
            </p>
            {preview.scoring_config?.enabled && (
              <p className="text-sm text-green-800">
                <strong>Scoring :</strong> Activé (max: {preview.scoring_config.max_score || "N/A"})
              </p>
            )}
          </div>
        )}

        <Button
          onClick={handleImport}
          disabled={!isValid && !preview}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          Importer le questionnaire
        </Button>

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Format JSON attendu :</h4>
          <pre className="text-xs text-blue-800 overflow-x-auto">
{`{
  "title": "...",
  "description": "...",
  "is_active": true,
  "frequency": "weekly",
  "send_day": 4,
  "send_time": "...",
  "target_roles": ["..."],
  "metadata": { ... },
  "questions": [
    {
      "id": "q-1",
      "question_text": "...",
      "question_type": "single_choice" | "multiple_choice" | "likert" | "text" | "number",
      "is_required": true,
      "options": [
        {
          "label": "Option 1",
          "value": "opt1",
          "points": 10  // Points pour le scoring
        }
      ],
      "conditional_logic": {
        "depends_on": "q-1",  // ID de la question précédente
        "conditions": [
          {
            "value": "stress_match",
            "show": true,
            "follow_up_questions": [...]  // Questions de suivi
          }
        ]
      },
      "scoring": { "enabled": true, "points": { "option-id": 10 }, "weight": 1 }
    }
  ]
}`}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}


