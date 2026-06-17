"use client";

import type { ReactNode } from "react";
import { EDGE_GRADIENTS } from "@/lib/edge/edge-brand";
import { cn } from "@/lib/utils";

type EdgeAssessmentQuestionShellProps = {
  categoryTag: string;
  categoryMention?: string;
  questionText: string;
  questionIndex: number;
  totalQuestions: number;
  children: ReactNode;
  footer?: ReactNode;
  analyzing?: boolean;
  analyzingLabel?: string;
  animateKey?: string | number;
};

export function EdgeAssessmentQuestionShell({
  categoryTag,
  categoryMention,
  questionText,
  questionIndex,
  totalQuestions,
  children,
  footer,
  analyzing = false,
  analyzingLabel = "Analyse en cours…",
  animateKey,
}: EdgeAssessmentQuestionShellProps) {
  const progress = Math.round(((questionIndex + 1) / totalQuestions) * 100);

  return (
    <div className="min-h-screen bg-white text-[#0a0a0a]">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-5 py-10 sm:px-6 sm:py-12">
        <div className="mb-8">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, background: EDGE_GRADIENTS.progress }}
            />
          </div>
          <p className="mt-3 text-xs font-medium uppercase tracking-[0.14em] text-black/40">
            Question {questionIndex + 1} sur {totalQuestions}
          </p>
        </div>

        <div
          key={animateKey ?? questionIndex}
          className="relative overflow-hidden rounded-[24px] p-6 sm:p-8"
          style={{ background: EDGE_GRADIENTS.hero }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: EDGE_GRADIENTS.heroHalo }}
            aria-hidden
          />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full bg-white/[0.12] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                {categoryTag}
              </span>
              {categoryMention ? (
                <span className="text-[11px] font-medium text-white/45">({categoryMention})</span>
              ) : null}
            </div>
            <h1 className="mt-4 text-xl font-semibold leading-snug tracking-tight text-white sm:text-2xl">
              {questionText}
            </h1>
          </div>
        </div>

        <div className="mt-6">{children}</div>

        {footer ? <div className="mt-8">{footer}</div> : null}

        {analyzing ? (
          <div className="mt-8 flex items-center gap-2 text-sm text-black/50">
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-black/10 border-t-[#3D7BFF]"
              aria-hidden
            />
            {analyzingLabel}
          </div>
        ) : null}
      </div>
    </div>
  );
}

type EdgeAssessmentOptionProps = {
  children: ReactNode;
  selected?: boolean;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
};

export function EdgeAssessmentOption({
  children,
  selected = false,
  disabled = false,
  onClick,
  className,
}: EdgeAssessmentOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full rounded-xl border px-5 py-4 text-left text-sm font-medium transition duration-200",
        "hover:translate-x-[3px]",
        selected
          ? "border-[rgba(61,123,255,0.35)] bg-[rgba(61,123,255,0.08)] text-[#0a0a0a] shadow-[0_0_0_1px_rgba(61,123,255,0.12)]"
          : "border-black/10 bg-white text-[#0a0a0a] hover:border-[rgba(61,123,255,0.25)]",
        disabled && "pointer-events-none opacity-60",
        className,
      )}
    >
      {children}
    </button>
  );
}
