"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { nanoid } from "nanoid";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { QuestionnaireJSONImporter, type ImportedQuestionnaire } from "./questionnaire-json-importer";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, ArrowUp, ArrowDown, FileJson, Save, Sparkles } from "lucide-react";

import type {
  MentalQuestion,
  MentalQuestionOption,
  MentalQuestionnaireDraft,
  MentalQuestionType,
} from "@/types/mental-health-questionnaire";

const FREQUENCY_LABEL: Record<MentalQuestionnaireDraft["frequency"], string> = {
  weekly: "Hebdomadaire",
  biweekly: "Bi-hebdomadaire",
  monthly: "Mensuel",
};

const QUESTION_TYPE_LABEL: Record<MentalQuestionType, string> = {
  single_choice: "Choix unique",
  multiple_choice: "Choix multiple",
  likert: "Échelle de Likert",
  text: "Réponse libre",
  number: "Valeur numérique",
};

const TARGET_ROLES = [
  { id: "learner", label: "Apprenant" },
  { id: "instructor", label: "Formateur" },
  { id: "tutor", label: "Tuteur" },
  { id: "admin", label: "Admin" },
];

const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

const INITIAL_QUESTION = (): MentalQuestion => ({
  id: nanoid(),
  question_text: "Nouvelle question",
  question_type: "single_choice",
  is_required: true,
  order_index: 0,
  options: [
    { id: nanoid(), label: "Option A", value: "option_a", points: 10 },
    { id: nanoid(), label: "Option B", value: "option_b", points: 5 },
  ],
  scoring: {
    enabled: true,
    points: {
      option_a: 10,
      option_b: 5,
    },
    weight: 1,
  },
  metadata: { dimension: "" },
});

const buildInitialDraft = (): MentalQuestionnaireDraft => ({
  title: "",
  description: "",
  is_active: true,
  frequency: "monthly",
  send_day: 1,
  send_time: "07:30",
  target_roles: ["learner"],
  metadata: null,
  questions: [INITIAL_QUESTION()],
  scoring_config: {
    enabled: true,
    max_score: 100,
    categories: [],
  },
});

const DIMENSION_LABELS: Record<string, string> = {
  style_cognitif_organisationnel: "Style cognitif organisationnel",
  mode_emotionnel_naturel: "Mode émotionnel naturel",
  besoin_social_naturel: "Besoin social naturel",
  coping_naturel: "Coping naturel",
  energie_rythme_interne: "Énergie & rythme interne",
  gestion_emotions_stress: "Gestion des émotions & du stress",
  communication_influence: "Communication & influence",
  perseverance_action: "Persévérance & passage à l’action",
  organisation_priorites: "Organisation, temps & priorités",
  empathie_ecoute_active: "Empathie & écoute active",
  resolution_problemes: "Résolution de problèmes & pensée critique",
  collaboration_conflits: "Collaboration & gestion des conflits",
  creativite_adaptabilite: "Créativité & adaptabilité",
  leadership_vision: "Leadership & vision",
  confiance_decision: "Confiance en soi & prise de décision",
};

const PRESET_FUNCTIONNEMENT_NATUREL: Array<{ text: string; dimension: string }> = [
  { text: "Je perds facilement ma concentration lorsque plusieurs choses se passent en même temps.", dimension: "style_cognitif_organisationnel" },
  { text: "Je suis naturellement sensible à l’ambiance ou aux émotions des autres.", dimension: "mode_emotionnel_naturel" },
  { text: "J’ai rarement besoin de contacts sociaux pour me sentir bien.", dimension: "besoin_social_naturel" },
  { text: "Je demande rarement de l’aide, même quand j’en aurais besoin.", dimension: "coping_naturel" },
  { text: "J’ai besoin de plus de pauses que la moyenne pour rester bien.", dimension: "energie_rythme_interne" },
  { text: "J’ai naturellement besoin de temps seul·e pour me ressourcer.", dimension: "besoin_social_naturel" },
  { text: "Je suis naturellement calme et peu “survolté·e”.", dimension: "energie_rythme_interne" },
  { text: "Mes émotions changent facilement au cours d’une journée.", dimension: "mode_emotionnel_naturel" },
  { text: "J’aime anticiper et déteste les imprévus.", dimension: "style_cognitif_organisationnel" },
  { text: "Sous stress, j’ai tendance à me replier plutôt qu’à chercher du soutien.", dimension: "coping_naturel" },
  { text: "Je ressens mes émotions de manière intense, quelle qu’elles soient.", dimension: "mode_emotionnel_naturel" },
  { text: "Je préfère les petits cercles intimes plutôt que les grands groupes.", dimension: "besoin_social_naturel" },
  { text: "Quand une difficulté arrive, j’essaie d’abord de régler les choses seul·e.", dimension: "coping_naturel" },
  { text: "Mon niveau d’énergie naturel est plutôt bas et constant.", dimension: "energie_rythme_interne" },
  { text: "Je suis naturellement sensible à l’ambiance ou aux émotions des autres.", dimension: "mode_emotionnel_naturel" },
  { text: "J’ai du mal à fonctionner quand tout n’est pas planifié.", dimension: "style_cognitif_organisationnel" },
  { text: "Quand je suis sous pression, j’ai du mal à exprimer mes besoins.", dimension: "coping_naturel" },
  { text: "J’ai tendance à garder mes émotions pour moi.", dimension: "mode_emotionnel_naturel" },
  { text: "Les interactions sociales me fatiguent rapidement.", dimension: "besoin_social_naturel" },
  { text: "J’ai tendance à me fatiguer rapidement lors d’activités prolongées.", dimension: "energie_rythme_interne" },
];

type Props = {
  orgId: string;
};

export function MentalHealthQuestionnaireBuilder({ orgId }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"builder" | "import">("builder");
  const [draft, setDraft] = useState<MentalQuestionnaireDraft>(() => buildInitialDraft());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const orderedQuestions = useMemo(
    () => [...draft.questions].sort((a, b) => a.order_index - b.order_index),
    [draft.questions],
  );

  const updateQuestion = (questionId: string, updates: Partial<MentalQuestion>) => {
    setDraft((prev) => ({
      ...prev,
      questions: prev.questions.map((question) =>
        question.id === questionId ? { ...question, ...updates } : question,
      ),
    }));
  };

  const updateOption = (questionId: string, optionId: string, updates: Partial<MentalQuestionOption>) => {
    setDraft((prev) => ({
      ...prev,
      questions: prev.questions.map((question) => {
        if (question.id !== questionId || !question.options) return question;
        return {
          ...question,
          options: question.options.map((option) =>
            option.id === optionId ? { ...option, ...updates } : option,
          ),
        };
      }),
    }));
  };

  const addOption = (questionId: string) => {
    setDraft((prev) => ({
      ...prev,
      questions: prev.questions.map((question) => {
        if (question.id !== questionId) return question;
        const nextValue = `option_${nanoid(4)}`;
        const nextOption: MentalQuestionOption = {
          id: nanoid(),
          label: "Nouvelle option",
          value: nextValue,
          points: 5,
        };
        return {
          ...question,
          options: [...(question.options ?? []), nextOption],
        };
      }),
    }));
  };

  const removeOption = (questionId: string, optionId: string) => {
    setDraft((prev) => ({
      ...prev,
      questions: prev.questions.map((question) => {
        if (question.id !== questionId || !question.options) return question;
        const nextOptions = question.options.filter((option) => option.id !== optionId);
        return { ...question, options: nextOptions };
      }),
    }));
  };

  const addQuestion = () => {
    setDraft((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          ...INITIAL_QUESTION(),
          order_index: prev.questions.length,
        },
      ],
    }));
  };

  const removeQuestion = (questionId: string) => {
    setDraft((prev) => ({
      ...prev,
      questions: prev.questions
        .filter((question) => question.id !== questionId)
        .map((question, index) => ({ ...question, order_index: index })),
    }));
  };

  const moveQuestion = (questionId: string, direction: "up" | "down") => {
    setDraft((prev) => {
      const currentIndex = prev.questions.findIndex((q) => q.id === questionId);
      if (currentIndex === -1) return prev;
      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= prev.questions.length) return prev;

      const next = [...prev.questions];
      const [item] = next.splice(currentIndex, 1);
      next.splice(targetIndex, 0, item);

      return {
        ...prev,
        questions: next.map((q, index) => ({ ...q, order_index: index })),
      };
    });
  };

  const handleSave = async () => {
    if (!draft.title.trim()) {
      toast.error("Titre requis", {
        description: "Merci de donner un titre à votre questionnaire",
      });
      return;
    }

    if (!draft.questions.length) {
      toast.error("Aucune question", {
        description: "Ajoutez au moins une question avant de valider",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        org_id: orgId,
        title: draft.title.trim(),
        description: draft.description?.trim() || null,
        is_active: draft.is_active,
        frequency: draft.frequency,
        send_day: draft.send_day,
        send_time: normalizeTime(draft.send_time),
        target_roles: draft.target_roles.length ? draft.target_roles : ["learner"],
        metadata: draft.metadata,
        scoring_config: draft.scoring_config,
        questions: draft.questions.map((question, index) => ({
          ...question,
          order_index: index,
        })),
      };

      const response = await fetch("/api/mental-health/questionnaires", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMessage = "Impossible de sauvegarder le questionnaire";
        try {
          const parsed = JSON.parse(text);
          errorMessage = parsed.error || errorMessage;
        } catch {
          if (text) errorMessage = text;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setLastSaved(new Date().toLocaleString());
      toast.success("Questionnaire enregistré", {
        description: "Il est désormais disponible dans Beyond Care",
      });
      router.refresh();
    } catch (error) {
      console.error("[mental-health-builder]", error);
      toast.error("Erreur", {
        description: error instanceof Error ? error.message : "Sauvegarde impossible",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImport = async (imported: ImportedQuestionnaire) => {
    setDraft((prev) => ({
      ...prev,
      title: imported.title || prev.title,
      description: imported.description ?? prev.description,
      is_active: imported.is_active ?? prev.is_active,
      frequency: imported.frequency ?? prev.frequency,
      send_day: imported.send_day ?? prev.send_day,
      send_time: imported.send_time ?? prev.send_time,
      target_roles: imported.target_roles ?? prev.target_roles,
      metadata: imported.metadata ?? prev.metadata,
      scoring_config: imported.scoring_config ?? prev.scoring_config,
      questions: (imported.questions ?? prev.questions).map((question, index) => ({
        ...question,
        id: question.id || nanoid(),
        order_index: index,
      })),
    }));

    toast.success("Questionnaire importé", {
      description: "Vous pouvez encore le modifier avant de l'enregistrer",
    });
    setActiveTab("builder");
  };

  const handleLoadPreset = () => {
    const questions = PRESET_FUNCTIONNEMENT_NATUREL.map((item, index) => {
      const id = `q-${index + 1}`;
      const pointsMap: Record<string, number> = { "1": 1, "2": 2, "3": 3, "4": 4, "5": 5 };
      return {
        id,
        question_text: item.text,
        question_type: "likert" as MentalQuestionType,
        is_required: true,
        order_index: index,
        likert_scale: {
          min: 1,
          max: 5,
          labels: {
            "1": "Pas du tout",
            "2": "Peu",
            "3": "Moyennement",
            "4": "Beaucoup",
            "5": "Complètement",
          },
        },
        scoring: {
          enabled: true,
          points: pointsMap,
          weight: 1,
        },
        metadata: {
          dimension: item.dimension,
        },
      } satisfies MentalQuestion;
    });

    const grouped = questions.reduce<Record<string, string[]>>((acc, question) => {
      const dim = question.metadata?.dimension || "autres";
      if (!acc[dim]) acc[dim] = [];
      acc[dim].push(question.id);
      return acc;
    }, {});

    setDraft((prev) => ({
      ...prev,
      title: "Beyond Profile – Fonctionnement naturel",
      description:
        "Questionnaire basé sur une échelle de Likert pour explorer le fonctionnement naturel (organisation, émotions, besoins sociaux, coping, énergie).",
      questions,
      scoring_config: {
        enabled: true,
        max_score: 100,
        categories: Object.entries(grouped).map(([dimension, ids]) => ({
          name: DIMENSION_LABELS[dimension] ?? dimension,
          questions: ids,
          weight: 1,
        })),
      },
    }));

    toast.success("Questionnaire pré-rempli", {
      description: "Fonctionnement naturel chargé. Ajustez si besoin avant de sauvegarder.",
    });
    setActiveTab("builder");
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "builder" | "import")}
        className="space-y-6">
        <TabsList>
          <TabsTrigger value="builder">Construire manuellement</TabsTrigger>
          <TabsTrigger value="import">Importer depuis JSON</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6">
          <Card>
            <CardHeader className="space-y-2">
              <CardTitle>Métadonnées</CardTitle>
              <CardDescription>Définissez la fréquence d'envoi et les destinataires.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="mh-title">Titre</Label>
                  <Input
                    id="mh-title"
                    value={draft.title}
                    onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="Programme bien-être hebdomadaire"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mh-status">Statut</Label>
                  <div className="flex items-center gap-3 rounded-lg border border-input px-3 py-2">
                    <Switch
                      id="mh-status"
                      checked={draft.is_active}
                      onCheckedChange={(checked) => setDraft((prev) => ({ ...prev, is_active: checked }))}
                    />
                    <span className="text-sm text-muted-foreground">
                      {draft.is_active ? "Actif immédiatement" : "Inactif (brouillon)"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mh-description">Description</Label>
                <Textarea
                  id="mh-description"
                  rows={3}
                  value={draft.description ?? ""}
                  onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Expliquez l'objectif du questionnaire, le temps estimé, etc."
                />
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Fréquence</Label>
                  <Select
                    value={draft.frequency}
                    onValueChange={(value) =>
                      setDraft((prev) => ({ ...prev, frequency: value as MentalQuestionnaireDraft["frequency"] }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choisir" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(FREQUENCY_LABEL).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Jour d'envoi</Label>
                  <Select
                    value={draft.send_day.toString()}
                    onValueChange={(value) =>
                      setDraft((prev) => ({ ...prev, send_day: Number(value) }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Jour" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAY_LABELS.map((label, index) => (
                        <SelectItem key={label} value={index.toString()}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mh-time">Heure</Label>
                  <Input
                    id="mh-time"
                    type="time"
                    value={draft.send_time}
                    onChange={(event) => setDraft((prev) => ({ ...prev, send_time: event.target.value }))}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Rôles destinataires</Label>
                <div className="flex flex-wrap gap-2">
                  {TARGET_ROLES.map((role) => {
                    const isSelected = draft.target_roles.includes(role.id);
                    return (
                      <Badge
                        key={role.id}
                        variant={isSelected ? "default" : "outline"}
                        className={`cursor-pointer select-none ${
                          isSelected ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                        }`}
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            target_roles: isSelected
                              ? prev.target_roles.filter((item) => item !== role.id)
                              : [...prev.target_roles, role.id],
                          }))
                        }
                      >
                        {role.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-2">
              <CardTitle>Questions</CardTitle>
              <CardDescription>
                Construisez les questions posées aux apprenants. Vous pouvez ajouter des options de scoring pour prioriser certains choix.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-muted-foreground/20 bg-muted/5 p-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">Utiliser un modèle</h4>
                  <p className="text-xs text-muted-foreground">
                    Charge automatiquement le questionnaire « Fonctionnement naturel » (échelle de Likert).
                  </p>
                </div>
                <Button type="button" size="sm" onClick={handleLoadPreset} className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Charger le modèle
                </Button>
              </div>

              {orderedQuestions.map((question, index) => (
                <QuestionEditor
                  key={question.id}
                  question={question}
                  onChange={updateQuestion}
                  onAddOption={addOption}
                  onUpdateOption={updateOption}
                  onRemoveOption={removeOption}
                  onMove={moveQuestion}
                  onDelete={removeQuestion}
                  isFirst={index === 0}
                  isLast={index === orderedQuestions.length - 1}
                />
              ))}

              <Button type="button" variant="outline" onClick={addQuestion} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Ajouter une question
              </Button>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {lastSaved ? `Dernière sauvegarde : ${lastSaved}` : "Aucune sauvegarde pour le moment"}
            </div>
            <Button type="button" onClick={handleSave} disabled={isSubmitting} className="flex items-center gap-2">
              {isSubmitting ? <Save className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Sauvegarder le questionnaire
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileJson className="h-5 w-5" />
                Importer depuis JSON
              </CardTitle>
              <CardDescription>
                Collez le JSON structuré du questionnaire. Vous pourrez ensuite l'ajuster dans l'onglet "Construire" avant de sauvegarder.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuestionnaireJSONImporter onImport={handleImport} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function normalizeTime(time: string): string {
  if (!time) return "18:00:00";
  if (/^\d{2}:\d{2}$/.test(time)) {
    return `${time}:00`;
  }
  return time;
}

type QuestionEditorProps = {
  question: MentalQuestion;
  onChange: (questionId: string, updates: Partial<MentalQuestion>) => void;
  onAddOption: (questionId: string) => void;
  onUpdateOption: (questionId: string, optionId: string, updates: Partial<MentalQuestionOption>) => void;
  onRemoveOption: (questionId: string, optionId: string) => void;
  onMove: (questionId: string, direction: "up" | "down") => void;
  onDelete: (questionId: string) => void;
  isFirst: boolean;
  isLast: boolean;
};

function QuestionEditor({
  question,
  onChange,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
  onMove,
  onDelete,
  isFirst,
  isLast,
}: QuestionEditorProps) {
  const handleTypeChange = (value: MentalQuestionType) => {
    const base: Partial<MentalQuestion> = { question_type: value };

    if (value === "single_choice" || value === "multiple_choice") {
      base.options = question.options?.length
        ? question.options
        : [
            { id: nanoid(), label: "Option A", value: "option_a", points: 10 },
            { id: nanoid(), label: "Option B", value: "option_b", points: 5 },
          ];
      base.scoring = question.scoring ?? { enabled: true, points: {}, weight: 1 };
    } else {
      base.options = undefined;
    }

    if (value === "likert") {
      base.likert_scale = question.likert_scale ?? {
        min: 1,
        max: 5,
        labels: {
          "1": "Pas du tout",
          "5": "Tout à fait",
        },
      };
    } else {
      base.likert_scale = undefined;
    }

    onChange(question.id, base);
  };

  return (
    <Card className="border border-muted">
      <CardContent className="space-y-5 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <Label>Texte de la question</Label>
            <Textarea
              value={question.question_text}
              onChange={(event) => onChange(question.id, { question_text: event.target.value })}
              placeholder="Comment vous sentez-vous aujourd'hui ?"
              rows={3}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button type="button" variant="ghost" size="icon" disabled={isFirst} onClick={() => onMove(question.id, "up")}>
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" disabled={isLast} onClick={() => onMove(question.id, "down")}>
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={() => onDelete(question.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label>Type de question</Label>
            <Select value={question.question_type} onValueChange={(value) => handleTypeChange(value as MentalQuestionType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(QUESTION_TYPE_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Obligatoire</Label>
            <div className="flex items-center gap-3 rounded-lg border border-input px-3 py-2">
              <Switch
                checked={question.is_required}
                onCheckedChange={(checked) => onChange(question.id, { is_required: checked })}
              />
              <span className="text-sm text-muted-foreground">
                {question.is_required ? "Réponse requise" : "Question facultative"}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Poids (scoring)</Label>
            <Input
              type="number"
              min={0}
              step={0.1}
              value={question.scoring?.weight ?? 1}
              onChange={(event) =>
                onChange(question.id, {
                  scoring: {
                    ...(question.scoring ?? { enabled: true }),
                    weight: Number(event.target.value) || 1,
                  },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Dimension (tag)</Label>
            <Input
              value={question.metadata?.dimension ?? ""}
              onChange={(event) =>
                onChange(question.id, {
                  metadata: {
                    ...(question.metadata ?? {}),
                    dimension: event.target.value,
                  },
                })
              }
              placeholder="ex. style_cognitif_organisationnel"
            />
          </div>
        </div>

        {(question.question_type === "single_choice" || question.question_type === "multiple_choice") && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Options</Label>
              <Button variant="outline" size="sm" type="button" onClick={() => onAddOption(question.id)}>
                Ajouter une option
              </Button>
            </div>
            <div className="space-y-3">
              {(question.options ?? []).map((option) => (
                <div key={option.id} className="grid gap-3 rounded-lg border border-dashed border-muted-foreground/20 p-3 md:grid-cols-[minmax(0,1fr)_140px_110px_40px]">
                  <Input
                    value={option.label}
                    onChange={(event) =>
                      onUpdateOption(question.id, option.id, {
                        label: event.target.value,
                        value: slugify(event.target.value) || option.value,
                      })
                    }
                    placeholder="Intitulé de l'option"
                  />
                  <Input
                    value={option.value}
                    onChange={(event) => onUpdateOption(question.id, option.id, { value: event.target.value })}
                    placeholder="Valeur stockée"
                  />
                  <Input
                    type="number"
                    value={option.points ?? 0}
                    onChange={(event) => onUpdateOption(question.id, option.id, { points: Number(event.target.value) })}
                    placeholder="Points"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveOption(question.id, option.id)}
                    className="justify-center"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {question.question_type === "likert" && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Minimum</Label>
              <Input
                type="number"
                value={question.likert_scale?.min ?? 1}
                onChange={(event) =>
                  onChange(question.id, {
                    likert_scale: {
                      ...(question.likert_scale ?? { max: 5 }),
                      min: Number(event.target.value) || 1,
                    },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Maximum</Label>
              <Input
                type="number"
                value={question.likert_scale?.max ?? 5}
                onChange={(event) =>
                  onChange(question.id, {
                    likert_scale: {
                      ...(question.likert_scale ?? { min: 1 }),
                      max: Number(event.target.value) || 5,
                    },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Labels (JSON)</Label>
              <Textarea
                rows={3}
                value={JSON.stringify(question.likert_scale?.labels ?? {}, null, 2)}
                onChange={(event) => {
                  try {
                    const parsed = JSON.parse(event.target.value || "{}");
                    onChange(question.id, {
                      likert_scale: {
                        ...(question.likert_scale ?? { min: 1, max: 5 }),
                        labels: parsed,
                      },
                    });
                  } catch (error) {
                    // ignore invalid JSON while typing, preview only
                  }
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();
}

