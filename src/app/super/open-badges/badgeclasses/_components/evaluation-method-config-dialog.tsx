"use client";

import { useEffect, useState } from "react";
import { Plus, Sparkles, Trash2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EvaluationQuestionType } from "@/lib/openbadges/badge-method-config";
import type { BadgeEvaluationMethodId } from "@/lib/openbadges/badge-evaluation";
import { PLAYGROUND_DEFAULT_MAX_ATTEMPTS } from "@/lib/openbadges/badge-evaluation";
import {
  createEmptyQcmQuestion,
  ensureUniqueQcmIds,
  defaultMethodConfig,
  methodConfigLabel,
  validateMethodConfig,
  type BadgeMethodConfig,
  type QcmGenerationMode,
  type QcmQuestion,
} from "@/lib/openbadges/badge-method-config";

const PROMPT_PLACEHOLDERS: Record<BadgeEvaluationMethodId, string> = {
  qcm:
    "Ex. : Questions d'évaluation — choix unique, choix multiples et réponses libres, niveau adapté au badge…",
  case_study:
    "Ex. : Analyser la structure argumentative, la pertinence des sources et la capacité à formuler des recommandations actionnables…",
  dictation:
    "Ex. : Évaluer la clarté des propos, la cohérence du raisonnement et l’absence de copier-coller externe…",
  video:
    "Ex. : Vérifier la démonstration des compétences visées, la qualité de l’explication orale et la durée minimale…",
  pdf_upload:
    "Ex. : Contrôler la complétude du document, la qualité rédactionnelle et l’alignement avec les critères du badge…",
  playground:
    "Ex. : Analyser la qualité des prompts produits (clarté, structure, objectif, contraintes). Décider si le badge prompting est mérité…",
};

type Props = {
  open: boolean;
  methodId: BadgeEvaluationMethodId | null;
  initial?: BadgeMethodConfig | null;
  badgeTitle?: string;
  badgeLevel?: number | null;
  onClose: () => void;
  onSave: (config: BadgeMethodConfig) => void;
};

export function EvaluationMethodConfigDialog({
  open,
  methodId,
  initial,
  badgeTitle = "",
  badgeLevel = null,
  onClose,
  onSave,
}: Props) {
  const [draft, setDraft] = useState<BadgeMethodConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!open || !methodId) return;
    if (initial?.methodId === methodId) {
      setDraft({
        ...initial,
        ...(methodId === "case_study"
          ? {
              caseStudy: {
                context: initial.caseStudy?.context ?? "",
                learnerPrompt: initial.caseStudy?.learnerPrompt ?? "",
              },
            }
          : {}),
        ...(methodId === "qcm"
          ? {
              quiz: {
                generationMode: initial.quiz?.generationMode ?? "ai",
                questionCount: initial.quiz?.questionCount ?? 5,
                passingScorePercent: initial.quiz?.passingScorePercent ?? 100,
                title: initial.quiz?.title ?? badgeTitle,
                level: initial.quiz?.level ?? badgeLevel ?? undefined,
                questions: ensureUniqueQcmIds(initial.quiz?.questions ?? []),
              },
            }
          : {}),
      });
      } else {
        const base = defaultMethodConfig(methodId);
        if (methodId === "case_study") {
          setDraft({
            ...base,
            caseStudy: {
              context: "",
              learnerPrompt: "",
            },
          });
        } else if (methodId === "qcm") {
        setDraft({
          ...base,
          quiz: {
            generationMode: "ai",
            questionCount: 5,
            passingScorePercent: 100,
            title: badgeTitle,
            level: badgeLevel ?? undefined,
            questions: [],
          },
        });
      } else {
        setDraft(base);
      }
    }
    setError(null);
    setGenerating(false);
  }, [open, methodId, initial, badgeTitle, badgeLevel]);

  if (!methodId || !draft) return null;

  const qcmMode: QcmGenerationMode = draft.quiz?.generationMode ?? "ai";
  const qcmQuestions = draft.quiz?.questions ?? [];
  const showQcmQuestionsEditor =
    qcmMode === "scratch" || qcmQuestions.length > 0;

  const generateQcmWithAi = async () => {
    if (!draft.evaluationPrompt.trim()) {
      setError("Rédigez d’abord la directive pour l’IA.");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/open-badges/generate-qcm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          evaluationPrompt: draft.evaluationPrompt,
          questionCount: draft.quiz?.questionCount ?? 5,
          badgeTitle,
          quizTitle: draft.quiz?.title,
          quizLevel: draft.quiz?.level ?? badgeLevel,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        questions?: QcmQuestion[];
        message?: string;
        error?: string;
      };
      if (!res.ok || !json.ok || !Array.isArray(json.questions)) {
        setError(json.message ?? json.error ?? "Échec de la génération.");
        return;
      }
      setDraft({
        ...draft,
        quiz: {
          ...draft.quiz!,
          generationMode: "ai",
          questions: ensureUniqueQcmIds(json.questions),
        },
      });
    } catch {
      setError("Impossible de contacter le service de génération.");
    } finally {
      setGenerating(false);
    }
  };

  const updateQuestion = (index: number, patch: Partial<QcmQuestion>) => {
    const questions = [...(draft.quiz?.questions ?? [])];
    questions[index] = { ...questions[index], ...patch };
    setDraft({ ...draft, quiz: { ...draft.quiz!, questions } });
  };

  const setQcmMode = (mode: QcmGenerationMode) => {
    setDraft({
      ...draft,
      quiz: {
        generationMode: mode,
        questionCount: draft.quiz?.questionCount ?? 5,
        passingScorePercent: draft.quiz?.passingScorePercent ?? 100,
        title: badgeTitle || draft.quiz?.title,
        level: badgeLevel ?? draft.quiz?.level,
        questions: mode === "scratch" && (draft.quiz?.questions?.length ?? 0) === 0
          ? [createEmptyQcmQuestion()]
          : draft.quiz?.questions ?? [],
      },
    });
  };

  const handleSave = () => {
    const toSave: BadgeMethodConfig =
      methodId === "qcm"
        ? {
            ...draft,
            quiz: {
              ...draft.quiz!,
              title: badgeTitle || draft.quiz?.title,
              level: badgeLevel ?? draft.quiz?.level,
            },
          }
        : draft;
    const err = validateMethodConfig(toSave);
    if (err) {
      setError(err);
      return;
    }
    onSave(toSave);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-slate-200 bg-white text-slate-900">
        <DialogHeader>
          <DialogTitle>Configuration — {methodConfigLabel(methodId)}</DialogTitle>
          <DialogDescription className="text-slate-600">
            {methodId === "qcm"
              ? "Paramétrez l’évaluation : types de questions, volume et mode de création (manuel ou IA)."
              : methodId === "case_study"
                ? "Contexte et consigne visibles par l’apprenant (interface Drive), plus le prompt d’évaluation IA confidentiel."
                : "Définissez la consigne d’évaluation pour cette méthode."}
          </DialogDescription>
        </DialogHeader>

        {methodId === "qcm" ? (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-900">Niveau de l&apos;évaluation</Label>
                <Input
                  readOnly
                  value={badgeLevel != null ? `Niveau ${badgeLevel}` : "— (définir le niveau du badge)"}
                  className="border-slate-200 bg-slate-50 text-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-900">Titre de l&apos;évaluation</Label>
                <Input
                  readOnly
                  value={badgeTitle || "— (nom du badge)"}
                  className="border-slate-200 bg-slate-50 text-slate-700"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-900">Nombre de questions à réaliser</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={draft.quiz?.questionCount ?? 5}
                  onChange={(e) => {
                    const n = Number.parseInt(e.target.value, 10);
                    setDraft({
                      ...draft,
                      quiz: {
                        ...draft.quiz!,
                        questionCount: Number.isFinite(n) ? Math.max(1, n) : 1,
                      },
                    });
                  }}
                  className="border-slate-300 bg-white max-w-[120px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-900">Seuil d&apos;acceptation</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={draft.quiz?.passingScorePercent ?? 100}
                    onChange={(e) => {
                      const n = Number.parseInt(e.target.value, 10);
                      setDraft({
                        ...draft,
                        quiz: {
                          ...draft.quiz!,
                          passingScorePercent: Number.isFinite(n)
                            ? Math.min(100, Math.max(1, n))
                            : 100,
                        },
                      });
                    }}
                    className="border-slate-300 bg-white max-w-[88px]"
                  />
                  <span className="text-sm text-slate-600">% de bonnes réponses</span>
                </div>
                <p className="text-xs text-slate-500">
                  Il faut obtenir au moins ce pourcentage pour valider le QCM (ex. 80 %).
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-900">Mode de création</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={qcmMode === "ai" ? "default" : "outline"}
                  size="sm"
                  className="gap-2"
                  onClick={() => setQcmMode("ai")}
                >
                  <Sparkles className="h-4 w-4" />
                  Généré par l’IA
                </Button>
                <Button
                  type="button"
                  variant={qcmMode === "scratch" ? "default" : "outline"}
                  size="sm"
                  className="gap-2"
                  onClick={() => setQcmMode("scratch")}
                >
                  <Wrench className="h-4 w-4" />
                  From scratch
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-900">
                {qcmMode === "ai"
                  ? "Directive pour la création des questions (IA)"
                  : "Consigne complémentaire (optionnel)"}
              </Label>
              <Textarea
                value={draft.evaluationPrompt}
                onChange={(e) => setDraft({ ...draft, evaluationPrompt: e.target.value })}
                placeholder={PROMPT_PLACEHOLDERS.qcm}
                rows={4}
                className="border-slate-300 bg-white"
              />
              {qcmMode === "ai" ? (
                <p className="text-xs text-slate-500">
                  Ce prompt guide la génération de {draft.quiz?.questionCount ?? 5} question
                  {(draft.quiz?.questionCount ?? 5) > 1 ? "s" : ""}. Relisez et corrigez chaque
                  énoncé et la bonne réponse avant d&apos;enregistrer.
                </p>
              ) : null}
            </div>

            {qcmMode === "ai" ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="gap-2"
                  disabled={generating || !draft.evaluationPrompt.trim()}
                  onClick={() => void generateQcmWithAi()}
                >
                  <Sparkles className="h-4 w-4" />
                  {generating
                    ? "Génération en cours…"
                    : qcmQuestions.length > 0
                      ? "Régénérer les questions"
                      : "Générer les questions avec l’IA"}
                </Button>
                {qcmQuestions.length > 0 ? (
                  <span className="text-xs text-slate-500">
                    {qcmQuestions.length} question{qcmQuestions.length > 1 ? "s" : ""} à valider
                  </span>
                ) : null}
              </div>
            ) : null}

            {showQcmQuestionsEditor ? (
              <div className="space-y-4 border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-900">
                    {qcmMode === "ai" ? "Questions générées — à valider" : "Questions manuelles"}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {qcmQuestions.length} question
                    {qcmQuestions.length > 1 ? "s" : ""}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">
                  Cochez la bonne réponse pour chaque question. Vous pouvez modifier les énoncés et
                  les propositions avant validation.
                </p>
                {qcmQuestions.map((question, qIndex) => (
                  <div
                    key={`qcm-q-${question.id}-${qIndex}`}
                    className="rounded-lg border border-slate-200 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Question {qIndex + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={(draft.quiz?.questions.length ?? 0) <= 1}
                        onClick={() => {
                          const questions = (draft.quiz?.questions ?? []).filter((_, i) => i !== qIndex);
                          setDraft({ ...draft, quiz: { ...draft.quiz!, questions } });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700">Type de question</Label>
                      <Select
                        value={question.questionType ?? "single"}
                        onValueChange={(value) =>
                          updateQuestion(qIndex, {
                            questionType: value as EvaluationQuestionType,
                            ...(value === "text" ? { choices: [] } : {}),
                          })
                        }
                      >
                        <SelectTrigger className="border-slate-300 bg-white max-w-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Choix unique</SelectItem>
                          <SelectItem value="multiple">Choix multiple</SelectItem>
                          <SelectItem value="text">Réponse libre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Textarea
                      value={question.prompt}
                      onChange={(e) => updateQuestion(qIndex, { prompt: e.target.value })}
                      placeholder="Énoncé de la question"
                      rows={2}
                      className="border-slate-300 bg-white"
                    />
                    {(question.questionType ?? "single") !== "text" ? (
                    <div className="space-y-2">
                      {question.choices.map((choice, cIndex) => (
                        <div
                          key={`qcm-c-${question.id}-${choice.id}-${cIndex}`}
                          className="flex items-center gap-2"
                        >
                          <Checkbox
                            checked={choice.isCorrect}
                            onCheckedChange={(checked) => {
                              const isMultiple = (question.questionType ?? "single") === "multiple";
                              const choices = question.choices.map((c, i) => {
                                if (isMultiple) {
                                  return i === cIndex ? { ...c, isCorrect: checked === true } : c;
                                }
                                return { ...c, isCorrect: i === cIndex ? checked === true : false };
                              });
                              updateQuestion(qIndex, { choices });
                            }}
                          />
                          <Input
                            value={choice.label}
                            onChange={(e) => {
                              const choices = [...question.choices];
                              choices[cIndex] = { ...choices[cIndex], label: e.target.value };
                              updateQuestion(qIndex, { choices });
                            }}
                            placeholder={`Proposition ${cIndex + 1}`}
                            className="border-slate-300 bg-white"
                          />
                        </div>
                      ))}
                    </div>
                    ) : (
                      <p className="text-xs text-slate-500">Réponse libre — pas de propositions.</p>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const questions = [...(draft.quiz?.questions ?? []), createEmptyQcmQuestion()];
                    setDraft({ ...draft, quiz: { ...draft.quiz!, questions } });
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter une question
                </Button>
              </div>
            ) : qcmMode === "ai" ? (
              <p className="text-sm text-slate-500 border-t border-slate-200 pt-4">
                Cliquez sur « Générer les questions avec l’IA » pour afficher le QCM et le valider
                avant enregistrement.
              </p>
            ) : null}
          </div>
        ) : methodId === "case_study" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-900">Contexte (optionnel)</Label>
              <Textarea
                value={draft.caseStudy?.context ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    caseStudy: {
                      context: e.target.value,
                      learnerPrompt: draft.caseStudy?.learnerPrompt ?? "",
                    },
                  })
                }
                rows={4}
                placeholder="Ex. : Vous êtes consultant pour une PME qui souhaite lancer un produit sur un marché saturé…"
                className="border-slate-300 bg-white"
              />
              <p className="text-xs text-slate-500">
                Mise en situation affichée à gauche dans l&apos;interface apprenant (type Drive).
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-900">Consigne affichée à l&apos;apprenant</Label>
              <Textarea
                value={draft.caseStudy?.learnerPrompt ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    caseStudy: {
                      context: draft.caseStudy?.context ?? "",
                      learnerPrompt: e.target.value,
                    },
                  })
                }
                rows={6}
                placeholder="Ex. : Rédigez une note de synthèse (800 mots max) avec diagnostic, options et recommandations actionnables…"
                className="border-slate-300 bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-900">Prompt d&apos;évaluation IA (confidentiel)</Label>
              <Textarea
                value={draft.evaluationPrompt}
                onChange={(e) => setDraft({ ...draft, evaluationPrompt: e.target.value })}
                placeholder={PROMPT_PLACEHOLDERS.case_study}
                rows={6}
                className="border-slate-300 bg-white"
              />
              <p className="text-xs text-slate-500">
                Grille d&apos;analyse utilisée par l&apos;IA — non visible par l&apos;apprenant.
              </p>
            </div>
          </div>
        ) : methodId === "playground" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-900">Consigne affichée à l&apos;apprenant (Playground EDGE)</Label>
              <Textarea
                value={draft.playground?.learnerPrompt ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    playground: {
                      learnerPrompt: e.target.value,
                      maxAttempts: draft.playground?.maxAttempts ?? PLAYGROUND_DEFAULT_MAX_ATTEMPTS,
                    },
                  })
                }
                rows={4}
                placeholder="Ex. : Rédigez un prompt efficace pour obtenir une analyse structurée d'un texte professionnel…"
                className="border-slate-300 bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-900">Nombre d&apos;essais autorisés</Label>
              <Input
                type="number"
                min={1}
                max={5}
                value={draft.playground?.maxAttempts ?? PLAYGROUND_DEFAULT_MAX_ATTEMPTS}
                onChange={(e) => {
                  const n = Number.parseInt(e.target.value, 10);
                  setDraft({
                    ...draft,
                    playground: {
                      learnerPrompt: draft.playground?.learnerPrompt ?? "",
                      maxAttempts: Number.isFinite(n) ? Math.min(5, Math.max(1, n)) : 2,
                    },
                  });
                }}
                className="max-w-[120px] border-slate-300 bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-900">Prompt d&apos;évaluation IA</Label>
              <Textarea
                value={draft.evaluationPrompt}
                onChange={(e) => setDraft({ ...draft, evaluationPrompt: e.target.value })}
                placeholder={PROMPT_PLACEHOLDERS.playground}
                rows={6}
                className="border-slate-300 bg-white"
              />
              <p className="text-xs text-slate-500">
                L&apos;IA analysera les réponses saisies dans l&apos;interface type chat (2 essais max par défaut).
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label className="text-slate-900">Prompt d’évaluation</Label>
            <Textarea
              value={draft.evaluationPrompt}
              onChange={(e) => setDraft({ ...draft, evaluationPrompt: e.target.value })}
              placeholder={PROMPT_PLACEHOLDERS[methodId]}
              rows={8}
              className="border-slate-300 bg-white"
            />
          </div>
        )}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="button" onClick={handleSave}>
            Enregistrer la configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
