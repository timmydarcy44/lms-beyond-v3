'use client';

import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { nanoid } from 'nanoid';
import {
  AlignLeft,
  BarChart3,
  CheckCircle2,
  CircleCheckBig,
  ListChecks,
  Quote,
  Sparkles,
  Type as TypeIcon,
} from 'lucide-react';

import type {
  TestBuilderQuestion,
  TestQuestionOption,
  TestQuestionType,
  TestQuestionKeywordRule,
} from '@/types/test-builder';

export type QuestionFlowBuilderProps = {
  onCreate?: (question: TestBuilderQuestion) => void;
};

type Option = {
  id: string;
  value: string;
  correct: boolean;
};

const QUESTION_TYPES: Array<{
  id: TestQuestionType;
  label: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  accent: string;
}> = [
  {
    id: 'multiple',
    label: 'Choix multiple',
    description: 'Plusieurs bonnes réponses possibles, idéal pour tester la précision.',
    icon: ListChecks,
    accent: 'from-[#00C6FF] to-[#0072FF]',
  },
  {
    id: 'single',
    label: 'Choix unique',
    description: 'Une seule bonne réponse, parfait pour valider un concept-clé.',
    icon: CircleCheckBig,
    accent: 'from-[#8E2DE2] to-[#4A00E0]',
  },
  {
    id: 'open',
    label: 'Réponse libre',
    description: 'Laissez le formateur développer sa pensée avec une réponse ouverte.',
    icon: TypeIcon,
    accent: 'from-[#FF512F] to-[#DD2476]',
  },
  {
    id: 'scale',
    label: 'Échelle / Likert',
    description: 'Mesurez une perception ou un niveau d’accord sur une échelle.',
    icon: BarChart3,
    accent: 'from-[#22D3EE] to-[#2563EB]',
  },
];

const FLOW_STEPS = [
  'Type de question',
  'Énoncé & contexte',
  'Réponses & logique',
  'Notation & feedback',
];

export function QuestionFlowBuilder({ onCreate }: QuestionFlowBuilderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [questionType, setQuestionType] = useState<TestQuestionType | null>(null);
  const [questionTitle, setQuestionTitle] = useState('');
  const [questionContext, setQuestionContext] = useState('');
  const [options, setOptions] = useState<Option[]>([
    { id: nanoid(), value: 'Option 1', correct: true },
    { id: nanoid(), value: 'Option 2', correct: false },
  ]);
  const [scaleMin, setScaleMin] = useState(1);
  const [scaleMax, setScaleMax] = useState(5);
  const [scoreValue, setScoreValue] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [saved, setSaved] = useState(false);

  const canContinue = useMemo(() => {
    switch (currentStep) {
      case 0:
        return questionType !== null;
      case 1:
        return questionTitle.trim().length > 6;
      case 2:
        if (!questionType) return false;
        if (questionType === 'open') {
          return true;
        }
        if (questionType === 'scale') {
          return scaleMax > scaleMin;
        }
        return options.some((opt) => opt.value.trim() !== '') && options.some((opt) => opt.correct);
      case 3:
        return scoreValue >= 0;
      default:
        return false;
    }
  }, [currentStep, questionType, questionTitle, options, scaleMin, scaleMax, scoreValue]);

  const handleSelectType = (type: TestQuestionType) => {
    setQuestionType(type);
    setCurrentStep(1);
    setSaved(false);
  };

  const addOption = () => {
    setOptions((prev) => [...prev, { id: nanoid(), value: `Option ${prev.length + 1}`, correct: false }]);
  };

  const updateOption = (id: string, value: string) => {
    setOptions((prev) => prev.map((opt) => (opt.id === id ? { ...opt, value } : opt)));
  };

  const toggleCorrectOption = (id: string) => {
    setOptions((prev) =>
      prev.map((opt) => {
        if (opt.id !== id) {
          return questionType === 'single' ? { ...opt, correct: false } : opt;
        }
        return { ...opt, correct: !opt.correct };
      }),
    );
  };

  const removeOption = (id: string) => {
    setOptions((prev) => prev.filter((opt) => opt.id !== id));
  };

  const resetFlow = () => {
    setCurrentStep(0);
    setQuestionType(null);
    setQuestionTitle('');
    setQuestionContext('');
    setOptions([
      { id: nanoid(), value: 'Option 1', correct: true },
      { id: nanoid(), value: 'Option 2', correct: false },
    ]);
    setScaleMin(1);
    setScaleMax(5);
    setScoreValue(5);
    setFeedback('');
    setSaved(false);
  };

  const handleNext = () => {
    if (currentStep < FLOW_STEPS.length - 1) {
      setCurrentStep((step) => step + 1);
      return;
    }

    if (!questionType) return;

    const payload: TestBuilderQuestion = {
      id: nanoid(),
      type: questionType,
      title: questionTitle.trim(),
      context: questionContext.trim() || undefined,
      score: scoreValue,
      feedback: feedback.trim() || undefined,
      status: 'draft',
      aiGenerated: true,
    };

    if (questionType === 'scale') {
      payload.scale = { min: scaleMin, max: scaleMax };
      const map: Record<number, number> = {};
      for (let value = scaleMin; value <= scaleMax; value += 1) {
        map[value] = value;
      }
      payload.scaleScoreMap = map;
    }

    if (questionType === 'multiple' || questionType === 'single') {
      const sanitized = options
        .filter((opt) => opt.value.trim() !== '')
        .map<TestQuestionOption>((opt) => ({ id: opt.id, value: opt.value.trim(), correct: opt.correct }));
      payload.options = sanitized;
    }

    if (questionType === 'open') {
      payload.keywordRules = [];
    }

    onCreate?.(payload);
    setSaved(true);
  };

  const handlePrev = () => {
    if (currentStep === 0) return;
    setCurrentStep((step) => step - 1);
  };

  return (
    <div className="space-y-6 rounded-3xl border border-white/10 bg-black/30 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold uppercase tracking-[0.3em] text-white">Créer une question</h3>
          <p className="text-sm text-white/60">
            Avancez étape par étape : type, énoncé, réponses et logique de score.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {FLOW_STEPS.map((label, index) => {
            const isActive = index === currentStep;
            const isDone = index < currentStep || (saved && index === currentStep);
            return (
              <span
                key={label}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold transition',
                  isDone
                    ? 'bg-gradient-to-r from-[#00C6FF] to-[#0072FF] text-white shadow-lg shadow-[#0072FF]/40'
                    : isActive
                    ? 'border border-white/30 bg-white/10 text-white'
                    : 'border border-white/10 text-white/40',
                )}
              >
                {index + 1}
              </span>
            );
          })}
        </div>
      </div>

      {saved ? (
        <div className="space-y-4 rounded-3xl border border-white/10 bg-black/40 p-6 text-sm text-white/75">
          <div className="flex items-center gap-3 text-white">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            <span className="text-base font-semibold uppercase tracking-[0.25em]">Question enregistrée</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Type choisi</p>
              <p className="text-white/80">{QUESTION_TYPES.find((type) => type.id === questionType)?.label ?? '—'}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Score attribué</p>
              <p className="text-white/80">{scoreValue} points</p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Énoncé</p>
              <p className="text-white/80">{questionTitle}</p>
              {questionContext ? <p className="text-white/60">{questionContext}</p> : null}
            </div>
            {questionType && questionType !== 'open' ? (
              <div className="space-y-2 md:col-span-2">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Réponses</p>
                <ul className="grid gap-2">
                  {questionType === 'scale' ? (
                    <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white/75">
                      Échelle de {scaleMin} à {scaleMax}
                    </li>
                  ) : (
                    options.map((opt) => (
                      <li
                        key={opt.id}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white/75"
                      >
                        <span>{opt.value}</span>
                        {opt.correct ? (
                          <Badge className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.3em] text-emerald-200">
                            Correct
                          </Badge>
                        ) : null}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="ghost"
              className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70 hover:bg-white/10"
              onClick={resetFlow}
            >
              Créer une nouvelle question
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 rounded-3xl border border-white/10 bg-black/40 p-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Étape {currentStep + 1}</p>
            <h4 className="text-lg font-semibold text-white">{FLOW_STEPS[currentStep]}</h4>
          </div>

          {currentStep === 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {QUESTION_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = questionType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleSelectType(type.id)}
                    className={cn(
                      'group flex h-full flex-col gap-3 rounded-2xl border border-white/15 bg-black/30 p-5 text-left transition hover:-translate-y-1 hover:border-white/30 hover:bg-black/40',
                      isSelected && 'border-transparent bg-gradient-to-br from-black/50 via-black/30 to-black/60 shadow-lg shadow-black/40',
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white transition group-hover:scale-105',
                        `bg-gradient-to-r ${type.accent}`,
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </span>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-white">{type.label}</p>
                      <p className="text-xs text-white/60">{type.description}</p>
                    </div>
                    {isSelected ? (
                      <Badge className="w-fit rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-emerald-200">
                        Sélectionné
                      </Badge>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}

          {currentStep === 1 ? (
            <div className="space-y-4">
              <Input
                value={questionTitle}
                onChange={(event) => setQuestionTitle(event.target.value)}
                placeholder="Ex. Quels leviers activer pour lancer une session immersive ?"
                className="border-white/15 bg-black/40 text-sm text-white placeholder:text-white/40"
              />
              <Textarea
                value={questionContext}
                onChange={(event) => setQuestionContext(event.target.value)}
                rows={4}
                placeholder="Ajoutez du contexte ou un scénario (optionnel) pour renforcer l'engagement."
                className="border-white/15 bg-black/40 text-sm text-white placeholder:text-white/40"
              />
              <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-sm text-white/60">
                <div className="flex items-center gap-3 text-white/70">
                  <Sparkles className="h-4 w-4 text-[#FF512F]" />
                  <span>Conseil :</span>
                </div>
                <p className="mt-2 text-sm">
                  Gardez un seul sujet par question, utilisez des verbes d'action et faites transparaître votre identité de marque.
                </p>
              </div>
            </div>
          ) : null}

          {currentStep === 2 && questionType ? (
            <div className="space-y-4">
              {questionType === 'open' ? (
                <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-sm text-white/65">
                  <Quote className="mb-2 h-5 w-5 text-white/40" />
                  Laissez l'apprenant formuler librement sa réponse. Vous pourrez analyser la qualité via l'IA ou une relecture.
                </div>
              ) : null}

              {questionType === 'scale' ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-[0.3em] text-white/50">Valeur minimale</label>
                    <Input
                      type="number"
                      value={scaleMin}
                      min={0}
                      onChange={(event) => setScaleMin(Number(event.target.value))}
                      className="border-white/15 bg-black/40 text-sm text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-[0.3em] text-white/50">Valeur maximale</label>
                    <Input
                      type="number"
                      value={scaleMax}
                      min={scaleMin + 1}
                      onChange={(event) => setScaleMax(Number(event.target.value))}
                      className="border-white/15 bg-black/40 text-sm text-white"
                    />
                  </div>
                </div>
              ) : null}

              {questionType === 'multiple' || questionType === 'single' ? (
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">Réponses possibles</p>
                  <div className="space-y-3">
                    {options.map((option, index) => (
                      <div
                        key={option.id}
                        className="flex flex-col gap-3 rounded-2xl border border-white/15 bg-black/30 px-4 py-4 sm:flex-row sm:items-center"
                      >
                        <div className="flex flex-1 items-center gap-3">
                          <Badge className="rounded-full bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white/60">
                            {index + 1}
                          </Badge>
                          <Input
                            value={option.value}
                            onChange={(event) => updateOption(option.id, event.target.value)}
                            className="border-white/15 bg-black/40 text-sm text-white placeholder:text-white/40"
                            placeholder="Texte de réponse"
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <Button
                            type="button"
                            variant="ghost"
                            className={cn(
                              'rounded-full border px-3 py-1 text-xs uppercase tracking-[0.3em] transition',
                              option.correct
                                ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-200'
                                : 'border-white/20 text-white/60 hover:bg-white/10',
                            )}
                            onClick={() => toggleCorrectOption(option.id)}
                          >
                            {questionType === 'single' ? 'Bonne réponse' : 'Marquer correct' }
                          </Button>
                          {options.length > 2 ? (
                            <Button
                              type="button"
                              variant="ghost"
                              className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/60 hover:bg-white/10"
                              onClick={() => removeOption(option.id)}
                            >
                              Supprimer
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 hover:bg-white/10"
                    onClick={addOption}
                  >
                    Ajouter une option
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          {currentStep === 3 ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-[0.3em] text-white/50">Score attribué</label>
                  <Input
                    type="number"
                    min={0}
                    value={scoreValue}
                    onChange={(event) => setScoreValue(Number(event.target.value))}
                    className="border-white/15 bg-black/40 text-sm text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-[0.3em] text-white/50">Tag pédagogique</label>
                  <Input
                    placeholder="Ex. Neurosciences, onboarding, live"
                    className="border-white/15 bg-black/40 text-sm text-white placeholder:text-white/40"
                  />
                </div>
              </div>
              <Textarea
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                rows={4}
                placeholder="Feedback à afficher après la réponse."
                className="border-white/15 bg-black/40 text-sm text-white placeholder:text-white/40"
              />
              <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-sm text-white/60">
                <div className="flex items-center gap-3 text-white/70">
                  <AlignLeft className="h-4 w-4 text-[#00C6FF]" />
                  <span>Expérience Typeform :</span>
                </div>
                <p className="mt-2 text-sm">
                  Personnalisez le message final selon la performance. Vous pouvez rediriger vers un module, afficher une ressource ou déclencher un badge.
                </p>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/50">
              Étape {currentStep + 1}
              <span className="h-1 w-1 rounded-full bg-white/40" />
              {FLOW_STEPS[currentStep]}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="ghost"
                className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70 hover:bg-white/10"
                disabled={currentStep === 0}
                onClick={handlePrev}
              >
                Retour
              </Button>
              <Button
                type="button"
                className="rounded-full bg-gradient-to-r from-[#FF512F] to-[#DD2476] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
                disabled={!canContinue}
                onClick={handleNext}
              >
                {currentStep === FLOW_STEPS.length - 1 ? 'Enregistrer la question' : 'Continuer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
