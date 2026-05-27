"use client";

import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { BadgeMethodConfig, QcmQuestion } from "@/lib/openbadges/badge-method-config";

type AnswerValue = string | string[];

function questionType(q: QcmQuestion) {
  return q.questionType ?? "single";
}

function isAnswered(q: QcmQuestion, answers: Record<string, AnswerValue>): boolean {
  const value = answers[q.id];
  const type = questionType(q);
  if (type === "text") {
    return typeof value === "string" && value.trim().length > 0;
  }
  if (type === "multiple") {
    return Array.isArray(value) && value.length > 0;
  }
  return typeof value === "string" && value.length > 0;
}

export function BadgeEvaluationQuizFlow({
  method,
  loading,
  onStartWriting,
  onSubmit,
}: {
  method: BadgeMethodConfig;
  loading?: boolean;
  onStartWriting: () => void;
  onSubmit: (payload: {
    responseText: string;
    qcmAnswers: Record<string, string | string[]>;
  }) => void;
}) {
  const questions = method.quiz?.questions ?? [];
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});

  const current = questions[index];
  const progress = questions.length > 0 ? ((index + 1) / questions.length) * 100 : 0;
  const allAnswered = useMemo(
    () => questions.length > 0 && questions.every((q) => isAnswered(q, answers)),
    [questions, answers],
  );

  const goNext = () => {
    if (!current || !isAnswered(current, answers)) return;
    if (index < questions.length - 1) {
      setIndex((i) => i + 1);
    }
  };

  const finish = () => {
    if (!allAnswered) return;
    const flat: Record<string, string | string[]> = { ...answers };
    onSubmit({
      responseText: JSON.stringify({ evaluationAnswers: flat }),
      qcmAnswers: flat,
    });
  };

  if (questions.length === 0) {
    return (
      <p className="text-sm text-white/55">Aucune question configurée pour cette évaluation.</p>
    );
  }

  if (!current) return null;

  const type = questionType(current);

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center justify-between text-xs text-white/45">
          <span>
            Question {index + 1} sur {questions.length}
          </span>
          <span>{Math.round(progress)} %</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-[#FF3B30] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="min-h-[220px] rounded-2xl border border-white/10 bg-black/40 p-6 sm:p-8">
        <p className="text-lg font-medium leading-snug text-white sm:text-xl">{current.prompt}</p>

        <div className="mt-6 space-y-3">
          {type === "text" ? (
            <Textarea
              value={typeof answers[current.id] === "string" ? (answers[current.id] as string) : ""}
              onFocus={onStartWriting}
              onChange={(e) => {
                onStartWriting();
                setAnswers((prev) => ({ ...prev, [current.id]: e.target.value }));
              }}
              rows={5}
              className="border-white/15 bg-white/[0.04] text-white"
              placeholder="Votre réponse…"
            />
          ) : type === "multiple" ? (
            current.choices.map((choice) => {
              const selected = Array.isArray(answers[current.id])
                ? (answers[current.id] as string[]).includes(choice.id)
                : false;
              return (
                <label
                  key={choice.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                    selected
                      ? "border-[#FF3B30]/50 bg-[#FF3B30]/10 text-white"
                      : "border-white/10 text-white/80 hover:border-white/20"
                  }`}
                >
                  <Checkbox
                    checked={selected}
                    onCheckedChange={(checked) => {
                      onStartWriting();
                      setAnswers((prev) => {
                        const prevList = Array.isArray(prev[current.id])
                          ? [...(prev[current.id] as string[])]
                          : [];
                        const next = checked
                          ? [...new Set([...prevList, choice.id])]
                          : prevList.filter((id) => id !== choice.id);
                        return { ...prev, [current.id]: next };
                      });
                    }}
                  />
                  {choice.label}
                </label>
              );
            })
          ) : (
            current.choices.map((choice) => (
              <label
                key={choice.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                  answers[current.id] === choice.id
                    ? "border-[#FF3B30]/50 bg-[#FF3B30]/10 text-white"
                    : "border-white/10 text-white/80 hover:border-white/20"
                }`}
              >
                <input
                  type="radio"
                  name={`eval-${current.id}`}
                  className="h-4 w-4 accent-[#FF3B30]"
                  checked={answers[current.id] === choice.id}
                  onChange={() => {
                    onStartWriting();
                    setAnswers((prev) => ({ ...prev, [current.id]: choice.id }));
                  }}
                />
                {choice.label}
              </label>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {index < questions.length - 1 ? (
          <Button
            type="button"
            onClick={goNext}
            disabled={!isAnswered(current, answers)}
            className="gap-2 bg-[#FF3B30] hover:bg-[#e6352b]"
          >
            Continuer
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={finish}
            disabled={loading || !allAnswered}
            className="bg-[#FF3B30] hover:bg-[#e6352b]"
          >
            Terminer l&apos;évaluation
          </Button>
        )}
      </div>
    </div>
  );
}
