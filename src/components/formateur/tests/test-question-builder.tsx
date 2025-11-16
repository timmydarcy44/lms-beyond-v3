'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Sparkles, Trash2 } from 'lucide-react';
import { nanoid } from 'nanoid';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { MirrorQuestionSuggest } from './mirror-question-suggest';

import type {
  TestBuilderQuestion,
  TestQuestionKeywordRule,
  TestQuestionOption,
  TestQuestionType,
} from '@/types/test-builder';

const QUESTION_TYPE_LABELS: Record<TestQuestionType, string> = {
  multiple: 'Choix multiple',
  single: 'Choix unique',
  open: 'Réponse libre',
  scale: 'Échelle',
  likert: 'Échelle de Likert',
};

const QUESTION_TYPE_ACCENTS: Record<TestQuestionType, string> = {
  multiple: 'from-[#00C6FF] to-[#0072FF]',
  single: 'from-[#8E2DE2] to-[#4A00E0]',
  open: 'from-[#FF512F] to-[#DD2476]',
  scale: 'from-[#22D3EE] to-[#2563EB]',
  likert: 'from-[#F59E0B] to-[#D97706]',
};

type TestQuestionBuilderProps = {
  questions: TestBuilderQuestion[];
  onChange: (nextQuestions: TestBuilderQuestion[]) => void;
  onAddQuestion?: () => void;
};

export function TestQuestionBuilder({ questions, onChange, onAddQuestion }: TestQuestionBuilderProps) {
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const editingQuestion = useMemo(
    () => questions.find((question) => question.id === editingQuestionId) ?? null,
    [questions, editingQuestionId],
  );

  if (!isMounted) {
    return (
      <Card className="border-dashed border-muted-foreground/20 bg-muted/5">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Chargement de l'éditeur de questions...
        </CardContent>
      </Card>
    );
  }

  const handleReorder = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const currentIndex = questions.findIndex((question) => question.id === active.id);
    const overIndex = questions.findIndex((question) => question.id === over.id);
    if (currentIndex === -1 || overIndex === -1) return;
    const next = [...questions];
    const [moved] = next.splice(currentIndex, 1);
    next.splice(overIndex, 0, moved);
    onChange(next);
  };

  const updateQuestion = (id: string, changes: Partial<TestBuilderQuestion>) => {
    const next = questions.map((question) => (question.id === id ? { ...question, ...changes } : question));
    onChange(next);
  };

  const updateOptions = (id: string, options: TestQuestionOption[]) => {
    const next = questions.map((question) => (question.id === id ? { ...question, options } : question));
    onChange(next);
  };

  const removeQuestion = (id: string) => {
    const next = questions.filter((question) => question.id !== id);
    onChange(next);
    if (editingQuestionId === id) {
      setEditingQuestionId(null);
    }
  };

  const addBlankOption = () => {
    if (!editingQuestion || (editingQuestion.type !== 'multiple' && editingQuestion.type !== 'single')) return;
    const options = editingQuestion.options ?? [];
    const isFirstOption = options.length === 0;
    updateOptions(editingQuestion.id, [
      ...options,
      {
        id: nanoid(),
        value: `Option ${options.length + 1}`,
        correct: isFirstOption,
        points: isFirstOption ? editingQuestion.score : 0, // Première option = score de la question, autres = 0
      },
    ]);
  };

  const reconcileScaleMap = (min: number, max: number, map?: Record<number, number>) => {
    const next: Record<number, number> = {};
    for (let value = min; value <= max; value += 1) {
      next[value] = map?.[value] ?? value;
    }
    return next;
  };

  const addKeywordRule = () => {
    if (!editingQuestion) return;
    const existing = editingQuestion.keywordRules ?? [];
    const nextRule: TestQuestionKeywordRule = {
      id: nanoid(),
      keywords: ['mot-clé'],
      score: 1,
    };
    updateQuestion(editingQuestion.id, { keywordRules: [...existing, nextRule] });
  };

  const updateKeywordRule = (ruleId: string, changes: Partial<TestQuestionKeywordRule>) => {
    if (!editingQuestion) return;
    const existing = editingQuestion.keywordRules ?? [];
    const next = existing.map((rule) => (rule.id === ruleId ? { ...rule, ...changes } : rule));
    updateQuestion(editingQuestion.id, { keywordRules: next });
  };

  const removeKeywordRule = (ruleId: string) => {
    if (!editingQuestion) return;
    const existing = editingQuestion.keywordRules ?? [];
    updateQuestion(editingQuestion.id, { keywordRules: existing.filter((rule) => rule.id !== ruleId) });
  };

  const toggleCorrect = (optionId: string) => {
    if (!editingQuestion || (editingQuestion.type !== 'multiple' && editingQuestion.type !== 'single')) return;
    const options = editingQuestion.options ?? [];
    const next = options.map((option) => {
      if (option.id !== optionId) {
        if (editingQuestion.type === 'single') {
          return { ...option, correct: false, points: option.points ?? 0 };
        }
        return option;
      }
      const isNowCorrect = !option.correct;
      // Si l'option devient correcte, lui attribuer le score de la question par défaut
      // Si elle devient incorrecte, mettre les points à 0
      return { 
        ...option, 
        correct: isNowCorrect,
        points: isNowCorrect ? (option.points ?? editingQuestion.score) : (option.points ?? 0)
      };
    });
    updateOptions(editingQuestion.id, next);
  };

  const removeOption = (optionId: string) => {
    if (!editingQuestion) return;
    const options = editingQuestion.options ?? [];
    updateOptions(
      editingQuestion.id,
      options.filter((option) => option.id !== optionId),
    );
  };

  const handleCloseDialog = (open: boolean) => {
    if (!open) {
      setEditingQuestionId(null);
    }
  };

  const handleAcceptMirror = (mirrorQuestion: TestBuilderQuestion) => {
    // Ajouter la question miroir à la liste
    const nextQuestions = [...questions, mirrorQuestion];
    
    // Mettre à jour la question originale pour référencer le miroir
    const updatedOriginal = {
      ...editingQuestion!,
      mirror_question_id: mirrorQuestion.id,
      is_positive: !mirrorQuestion.is_positive, // Inverser
    };
    
    const finalQuestions = nextQuestions.map((q) =>
      q.id === updatedOriginal.id ? updatedOriginal : q
    );
    
    onChange(finalQuestions);
  };

  const handleRejectMirror = () => {
    // Ne rien faire, juste fermer la suggestion
  };

  return (
    <>
      <Card className="border-white/10 bg-gradient-to-br from-[#1f1f1f]/95 via-[#161616]/95 to-[#090909]/95 text-white">
        <CardHeader className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <CardTitle className="text-lg font-semibold uppercase tracking-[0.3em]">Questions & Flow builder</CardTitle>
            <p className="text-sm text-white/60">
              Glissez-déposez vos questions, puis cliquez pour les éditer en détail dans le modal dédié.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={onAddQuestion}
              className="rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
            >
              <Plus className="mr-2 h-4 w-4" /> Ajouter une question vide
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleReorder}>
            <SortableContext items={questions.map((question) => question.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {questions.length ? (
                  questions.map((question) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      isActive={question.id === editingQuestionId}
                      onEdit={() => setEditingQuestionId(question.id)}
                      onRemove={() => removeQuestion(question.id)}
                    />
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-transparent px-6 py-10 text-center text-sm text-white/60">
                    Commencez par ajouter une question pour bâtir votre test.
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
          <div className="rounded-3xl border border-dashed border-white/15 bg-black/20 px-6 py-5 text-sm text-white/60">
            Cliquez sur une carte pour ouvrir le panneau d'édition détaillée.
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(editingQuestion)} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-5xl max-h-[95vh] border-white/10 bg-[#06070d]/95 text-white flex flex-col overflow-hidden">
          {editingQuestion ? (
            <>
              <DialogHeader className="flex-shrink-0 pb-4 border-b border-white/10">
                <DialogTitle className="text-left text-xl font-semibold">Configurer « {editingQuestion.title || 'Question'} »</DialogTitle>
              </DialogHeader>
              
              {/* Contenu scrollable */}
              <div 
                className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-6"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent',
                }}
              >
                <style dangerouslySetInnerHTML={{__html: `
                  .overflow-y-auto::-webkit-scrollbar {
                    width: 8px;
                  }
                  .overflow-y-auto::-webkit-scrollbar-track {
                    background: transparent;
                  }
                  .overflow-y-auto::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 4px;
                  }
                  .overflow-y-auto::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.3);
                  }
                `}} />

              {editingQuestion.aiGenerated ? (
                <Badge className="w-fit rounded-full bg-gradient-to-r from-[#FF512F]/40 via-[#DD2476]/40 to-[#8E2DE2]/40 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white">
                  Issue de l'IA
                </Badge>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-[0.3em] text-white/50">Titre</label>
                  <Input
                    value={editingQuestion.title}
                    onChange={(event) => updateQuestion(editingQuestion.id, { title: event.target.value })}
                    className="border-white/15 bg-black/40 text-sm text-white placeholder:text-white/40"
                    placeholder="Nom de la question"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-[0.3em] text-white/50">Type</label>
                  <Select
                    value={editingQuestion.type}
                    onValueChange={(value: TestQuestionType) => {
                      const base: Partial<TestBuilderQuestion> = { type: value, options: undefined, scale: undefined };
                      if (value === 'multiple' || value === 'single') {
                        const defaultScore = editingQuestion.score || 1;
                        base.options = editingQuestion.options?.length
                          ? editingQuestion.options.map(opt => ({
                              ...opt,
                              points: opt.points ?? (opt.correct ? defaultScore : 0)
                            }))
                          : [
                              { id: nanoid(), value: 'Option 1', correct: true, points: defaultScore },
                              { id: nanoid(), value: 'Option 2', correct: false, points: 0 },
                            ];
                        base.keywordRules = undefined;
                        base.scale = undefined;
                        base.scaleScoreMap = undefined;
                      }
                      if (value === 'scale') {
                        const min = editingQuestion.scale?.min ?? 1;
                        const max = editingQuestion.scale?.max ?? 5;
                        base.scale = { min, max };
                        base.scaleScoreMap = reconcileScaleMap(min, max, editingQuestion.scaleScoreMap);
                        base.options = undefined;
                        base.keywordRules = undefined;
                        base.likert = undefined;
                      }
                      if (value === 'likert') {
                        base.likert = editingQuestion.likert ?? { min: 1, max: 5, labels: [] };
                        base.scaleScoreMap = reconcileScaleMap(1, 5, editingQuestion.scaleScoreMap);
                        base.options = undefined;
                        base.keywordRules = undefined;
                        base.scale = undefined;
                      }
                      if (value === 'open') {
                        base.keywordRules = editingQuestion.keywordRules ?? [];
                        base.options = undefined;
                        base.scale = undefined;
                        base.likert = undefined;
                        base.scaleScoreMap = undefined;
                      }
                      updateQuestion(editingQuestion.id, base);
                    }}
                  >
                    <SelectTrigger className="border-white/15 bg-black/40 text-sm text-white">
                      <SelectValue placeholder="Type de question" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f172a] text-white">
                      {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.3em] text-white/50">Contexte</label>
                <Textarea
                  value={editingQuestion.context ?? ''}
                  onChange={(event) => updateQuestion(editingQuestion.id, { context: event.target.value })}
                  rows={4}
                  placeholder="Ajoutez un bref scénario ou un élément de storytelling."
                  className="border-white/15 bg-black/40 text-sm text-white placeholder:text-white/40"
                />
              </div>

              {(editingQuestion.type === 'multiple' || editingQuestion.type === 'single') && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">Réponses</p>
                    <Button
                      type="button"
                      variant="ghost"
                      className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/70 hover:bg-white/10"
                      onClick={addBlankOption}
                    >
                      Ajouter une option
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {(editingQuestion.options ?? []).map((option, index) => (
                      <div
                        key={option.id}
                        className="flex flex-col gap-3 rounded-2xl border border-white/15 bg-black/30 px-4 py-3 sm:flex-row sm:items-center"
                      >
                        <div className="flex items-center gap-3 sm:flex-1">
                          <Badge className="rounded-full bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white/60">
                            {index + 1}
                          </Badge>
                          <Input
                            value={option.value}
                            onChange={(event) => {
                              const next = (editingQuestion.options ?? []).map((opt) =>
                                opt.id === option.id ? { ...opt, value: event.target.value } : opt,
                              );
                              updateOptions(editingQuestion.id, next);
                            }}
                            className="border-white/15 bg-black/40 text-sm text-white placeholder:text-white/40"
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            className={cn(
                              'rounded-full border px-3 py-1 text-xs uppercase tracking-[0.3em] transition',
                              option.correct
                                ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-200'
                                : 'border-white/20 text-white/60 hover:bg-white/10',
                            )}
                            onClick={() => toggleCorrect(option.id)}
                          >
                            Bonne réponse
                          </Button>
                          {/* Champ de points pour chaque option */}
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-white/50 whitespace-nowrap">Points:</label>
                            <Input
                              type="number"
                              min="0"
                              step="0.5"
                              value={option.points ?? (option.correct ? editingQuestion.score : 0)}
                              onChange={(event) => {
                                const next = (editingQuestion.options ?? []).map((opt) =>
                                  opt.id === option.id 
                                    ? { ...opt, points: Number(event.target.value) || 0 }
                                    : opt,
                                );
                                updateOptions(editingQuestion.id, next);
                              }}
                              className="w-20 border-white/15 bg-black/40 text-sm text-white text-center"
                              placeholder="0"
                            />
                          </div>
                          {(editingQuestion.options ?? []).length > 2 ? (
                            <Button
                              type="button"
                              variant="ghost"
                              className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/60 hover:bg-white/10"
                              onClick={() => removeOption(option.id)}
                            >
                              Retirer
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {editingQuestion.type === 'scale' ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs uppercase tracking-[0.3em] text-white/50">Échelle min</label>
                      <Input
                        type="number"
                        value={editingQuestion.scale?.min ?? 1}
                        onChange={(event) => {
                          const nextMin = Number(event.target.value);
                          const currentMax = editingQuestion.scale?.max ?? nextMin + 1;
                          if (nextMin >= currentMax) return;
                          updateQuestion(editingQuestion.id, {
                            scale: { min: nextMin, max: currentMax },
                            scaleScoreMap: reconcileScaleMap(nextMin, currentMax, editingQuestion.scaleScoreMap),
                          });
                        }}
                        className="border-white/15 bg-black/40 text-sm text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs uppercase tracking-[0.3em] text-white/50">Échelle max</label>
                      <Input
                        type="number"
                        value={editingQuestion.scale?.max ?? 5}
                        onChange={(event) => {
                          const nextMax = Number(event.target.value);
                          const currentMin = editingQuestion.scale?.min ?? 1;
                          if (nextMax <= currentMin) return;
                          updateQuestion(editingQuestion.id, {
                            scale: { min: currentMin, max: nextMax },
                            scaleScoreMap: reconcileScaleMap(currentMin, nextMax, editingQuestion.scaleScoreMap),
                          });
                        }}
                        className="border-white/15 bg-black/40 text-sm text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">Barème associé</p>
                    <div className="grid gap-2 md:grid-cols-2">
                      {editingQuestion.scale &&
                        Array.from({ length: editingQuestion.scale.max - editingQuestion.scale.min + 1 }, (_, idx) => {
                          const value = (editingQuestion.scale?.min ?? 1) + idx;
                          const map = editingQuestion.scaleScoreMap ?? {};
                          return (
                            <div
                              key={`scale-score-${value}`}
                              className="flex items-center justify-between rounded-2xl border border-white/15 bg-black/30 px-4 py-3"
                            >
                              <span className="text-sm text-white/70">Valeur {value}</span>
                              <Input
                                type="number"
                                value={map[value] ?? value}
                                className="w-24 border-white/15 bg-black/40 text-sm text-white"
                                onChange={(event) => {
                                  const next = { ...map, [value]: Number(event.target.value) };
                                  updateQuestion(editingQuestion.id, { scaleScoreMap: next });
                                }}
                              />
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              ) : null}

              {editingQuestion.type === 'likert' ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs uppercase tracking-[0.3em] text-white/50">Échelle min (défaut: 1)</label>
                      <Input
                        type="number"
                        value={editingQuestion.likert?.min ?? 1}
                        onChange={(event) => {
                          const nextMin = Number(event.target.value);
                          const currentMax = editingQuestion.likert?.max ?? 5;
                          if (nextMin >= currentMax) return;
                          updateQuestion(editingQuestion.id, {
                            likert: { 
                              ...editingQuestion.likert ?? { min: 1, max: 5, labels: [] },
                              min: nextMin 
                            },
                            scaleScoreMap: reconcileScaleMap(nextMin, currentMax, editingQuestion.scaleScoreMap),
                          });
                        }}
                        className="border-white/15 bg-black/40 text-sm text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs uppercase tracking-[0.3em] text-white/50">Échelle max (5 ou 7)</label>
                      <Select
                        value={String(editingQuestion.likert?.max ?? 5)}
                        onValueChange={(value) => {
                          const nextMax = Number(value);
                          const currentMin = editingQuestion.likert?.min ?? 1;
                          const currentLabels = editingQuestion.likert?.labels ?? [];
                          // Générer des labels par défaut si nécessaire
                          const defaultLabels = nextMax === 5 
                            ? ["Pas du tout d'accord", "Plutôt pas d'accord", "Neutre", "Plutôt d'accord", "Tout à fait d'accord"]
                            : ["Fortement en désaccord", "En désaccord", "Plutôt en désaccord", "Neutre", "Plutôt d'accord", "D'accord", "Fortement d'accord"];
                          updateQuestion(editingQuestion.id, {
                            likert: { 
                              min: currentMin,
                              max: nextMax, 
                              labels: currentLabels.length === nextMax ? currentLabels : defaultLabels
                            },
                            scaleScoreMap: reconcileScaleMap(currentMin, nextMax, editingQuestion.scaleScoreMap),
                          });
                        }}
                      >
                        <SelectTrigger className="border-white/15 bg-black/40 text-sm text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0f172a] text-white">
                          <SelectItem value="5">5 points</SelectItem>
                          <SelectItem value="7">7 points</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Labels pour chaque point de l'échelle */}
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">Labels de l'échelle</p>
                    <div className="space-y-2">
                      {editingQuestion.likert &&
                        Array.from({ length: editingQuestion.likert.max - editingQuestion.likert.min + 1 }, (_, idx) => {
                          const value = (editingQuestion.likert?.min ?? 1) + idx;
                          const label = editingQuestion.likert?.labels?.[idx] ?? `Point ${value}`;
                          return (
                            <div
                              key={`likert-label-${value}`}
                              className="flex items-center gap-3 rounded-2xl border border-white/15 bg-black/30 px-4 py-3"
                            >
                              <span className="text-sm font-semibold text-white/70 w-8">{value}</span>
                              <Input
                                value={label}
                                onChange={(event) => {
                                  const currentLabels = editingQuestion.likert?.labels ?? [];
                                  const nextLabels = [...currentLabels];
                                  nextLabels[idx] = event.target.value;
                                  updateQuestion(editingQuestion.id, {
                                    likert: {
                                      ...editingQuestion.likert ?? { min: 1, max: 5, labels: [] },
                                      labels: nextLabels
                                    }
                                  });
                                }}
                                className="flex-1 border-white/15 bg-black/40 text-sm text-white"
                                placeholder={`Label pour ${value}`}
                              />
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Barème de scoring */}
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">Barème de scoring</p>
                    <div className="grid gap-2 md:grid-cols-2">
                      {editingQuestion.likert &&
                        Array.from({ length: editingQuestion.likert.max - editingQuestion.likert.min + 1 }, (_, idx) => {
                          const value = (editingQuestion.likert?.min ?? 1) + idx;
                          const map = editingQuestion.scaleScoreMap ?? {};
                          return (
                            <div
                              key={`likert-score-${value}`}
                              className="flex items-center justify-between rounded-2xl border border-white/15 bg-black/30 px-4 py-3"
                            >
                              <span className="text-sm text-white/70">Point {value}</span>
                              <Input
                                type="number"
                                value={map[value] ?? value}
                                className="w-24 border-white/15 bg-black/40 text-sm text-white"
                                onChange={(event) => {
                                  const next = { ...map, [value]: Number(event.target.value) };
                                  updateQuestion(editingQuestion.id, { scaleScoreMap: next });
                                }}
                              />
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Système de scoring et catégorie */}
              <div className="space-y-4 rounded-2xl border border-white/15 bg-black/30 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50 mb-3">Scoring et catégorisation</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-[0.3em] text-white/50">Catégorie</label>
                    <Input
                      value={editingQuestion.category ?? ''}
                      onChange={(event) => updateQuestion(editingQuestion.id, { category: event.target.value })}
                      className="border-white/15 bg-black/40 text-sm text-white placeholder:text-white/40"
                      placeholder="Ex: Intelligence émotionnelle, Adaptabilité..."
                    />
                    <p className="text-xs text-white/40">
                      Le score sera calculé par catégorie (ex: 15/20 pour cette catégorie)
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-[0.3em] text-white/50">Score par défaut</label>
                    <Input
                      type="number"
                      min="0"
                      value={editingQuestion.score}
                      onChange={(event) => updateQuestion(editingQuestion.id, { score: Number(event.target.value) || 1 })}
                      className="border-white/15 bg-black/40 text-sm text-white"
                      placeholder="1"
                    />
                    <p className="text-xs text-white/40">
                      Score de base utilisé pour les options "correctes" par défaut
                    </p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs uppercase tracking-[0.3em] text-white/50">Poids de la question</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={editingQuestion.weight ?? 1}
                      onChange={(event) => updateQuestion(editingQuestion.id, { weight: Number(event.target.value) })}
                      className="border-white/15 bg-black/40 text-sm text-white"
                      placeholder="1"
                    />
                    <p className="text-xs text-white/40">
                      Poids dans le calcul de la catégorie (défaut: 1). Ex: 1.5 = 50% plus important, 0.5 = 50% moins important
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.3em] text-white/50">Tag / Compétence</label>
                <Input
                  value={editingQuestion.tag ?? ''}
                  onChange={(event) => updateQuestion(editingQuestion.id, { tag: event.target.value })}
                  className="border-white/15 bg-black/40 text-sm text-white placeholder:text-white/40"
                  placeholder="Compétence associée (optionnel, différent de la catégorie)"
                />
                <p className="text-xs text-white/40">
                  Tag optionnel pour identifier la compétence mesurée (différent de la catégorie de scoring)
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.3em] text-white/50">Feedback</label>
                <Textarea
                  value={editingQuestion.feedback ?? ''}
                  onChange={(event) => updateQuestion(editingQuestion.id, { feedback: event.target.value })}
                  rows={4}
                  placeholder="Feedback personnalisé après la réponse."
                  className="border-white/15 bg-black/40 text-sm text-white placeholder:text-white/40"
                />
              </div>

              {editingQuestion.type === 'open' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">Règles conditionnelles</p>
                    <Button
                      type="button"
                      variant="ghost"
                      className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/70 hover:bg-white/10"
                      onClick={addKeywordRule}
                    >
                      Ajouter une règle
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {(editingQuestion.keywordRules ?? []).map((rule) => (
                      <div key={rule.id} className="space-y-3 rounded-2xl border border-white/15 bg-black/30 px-4 py-4">
                        <div className="space-y-1">
                          <label className="text-xs uppercase tracking-[0.3em] text-white/50">Mots clés requis</label>
                          <Input
                            value={rule.keywords.join(', ')}
                            onChange={(event) =>
                              updateKeywordRule(
                                rule.id,
                                {
                                  keywords: event.target.value
                                    .split(',')
                                    .map((word) => word.trim())
                                    .filter(Boolean),
                                },
                              )
                            }
                            className="border-white/15 bg-black/40 text-sm text-white placeholder:text-white/40"
                            placeholder="ex. immersion, neurosciences, émotion"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <label className="text-xs uppercase tracking-[0.3em] text-white/50">Score attribué</label>
                            <Input
                              type="number"
                              value={rule.score}
                              onChange={(event) => updateKeywordRule(rule.id, { score: Number(event.target.value) })}
                              className="w-24 border-white/15 bg-black/40 text-sm text-white"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/60 hover:bg-white/10"
                            onClick={() => removeKeywordRule(rule.id)}
                          >
                            Retirer
                          </Button>
                        </div>
                        <p className="text-xs text-white/50">
                          Les mots clés doivent être présents dans la réponse (sans tenir compte de la casse) pour attribuer le score.
                        </p>
                      </div>
                    ))}
                    {(editingQuestion.keywordRules ?? []).length === 0 ? (
                      <p className="rounded-2xl border border-dashed border-white/15 bg-transparent px-4 py-3 text-sm text-white/50">
                        Ajoutez des règles pour attribuer des points en fonction de mots clés obligatoires.
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {/* Suggestion de question miroir pour détection de biais */}
              <MirrorQuestionSuggest
                question={editingQuestion}
                onAccept={handleAcceptMirror}
                onReject={handleRejectMirror}
                existingMirrorId={editingQuestion.mirror_question_id}
              />

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-xs text-white/60">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#00C6FF]" /> Optimisez vos questions en cohérence avec vos parcours.
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/70 hover:bg-white/10"
                  onClick={() => {
                    const id = editingQuestion.id;
                    removeQuestion(id);
                    setEditingQuestionId(null);
                  }}
                >
                  Supprimer la question
                </Button>
              </div>

              </div>
              
              {/* Footer fixe avec boutons */}
              <div className="flex-shrink-0 flex justify-end gap-3 pt-4 border-t border-white/10">
                <DialogClose asChild>
                  <Button
                    type="button"
                    className="rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
                  >
                    Terminer
                  </Button>
                </DialogClose>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

type QuestionCardProps = {
  question: TestBuilderQuestion;
  isActive: boolean;
  onEdit: () => void;
  onRemove: () => void;
};

function QuestionCard({ question, isActive, onEdit, onRemove }: QuestionCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: question.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-start gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 transition hover:border-white/25',
        isActive && 'border-white/40 bg-gradient-to-r from-white/10 to-transparent',
      )}
    >
      <button
        type="button"
        {...listeners}
        {...attributes}
        className="rounded-full border border-white/20 bg-black/40 p-2 text-white/40 transition hover:text-white"
        aria-label="Réordonner la question"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onEdit}
        className="flex flex-1 flex-col gap-3 text-left"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">{question.title || 'Question sans titre'}</p>
            <p className="text-xs text-white/50">
              {QUESTION_TYPE_LABELS[question.type]}
            </p>
          </div>
          <Badge
            className={cn(
              'rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white',
              'bg-gradient-to-r',
              QUESTION_TYPE_ACCENTS[question.type],
            )}
          >
            {question.type}
          </Badge>
        </div>
        {/* Affichage de la catégorie */}
        {question.category ? (
          <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.3em] text-white/60 bg-white/10 px-2 py-1 rounded-full">
            📁 {question.category}
          </span>
        ) : null}
        {(question.type === 'scale' && question.scaleScoreMap) ? (
          <span className="text-[11px] uppercase tracking-[0.3em] text-white/40">
            Barème {Math.min(...Object.values(question.scaleScoreMap ?? {}))} → {Math.max(...Object.values(question.scaleScoreMap ?? {}))}
          </span>
        ) : null}
        {question.aiGenerated ? (
          <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-white/40">
            <Sparkles className="h-3 w-3 text-[#FF6FD8]" /> Générée via IA
          </span>
        ) : null}
      </button>
      <Button
        type="button"
        variant="ghost"
        onClick={onRemove}
        className="rounded-full border border-white/20 px-2 py-1 text-white/50 hover:bg-white/10"
        aria-label="Supprimer la question"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
