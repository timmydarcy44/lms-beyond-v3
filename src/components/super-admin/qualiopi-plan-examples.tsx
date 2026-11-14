"use client";

import {
  getQualiopiIndicatorPlan,
  QUALIOPI_INDICATOR_PLANS,
  type QualiopiIndicatorPlan,
} from "@/lib/qualiopi/indicator-plans";

/** Fallback coffre (hors indicateur). */
export const QUALIOPI_EXAMPLE_PROCESS = {
  title: QUALIOPI_INDICATOR_PLANS[1].processTitle,
  steps: QUALIOPI_INDICATOR_PLANS[1].processSteps,
};

export const QUALIOPI_EXAMPLE_DOCUMENT = {
  title: QUALIOPI_INDICATOR_PLANS[1].documentTitle,
  body: QUALIOPI_INDICATOR_PLANS[1].documentBody,
};

type Props = {
  indicatorId?: number;
  plan?: QualiopiIndicatorPlan | null;
  /** Affichage compact sous un indicateur. */
  compact?: boolean;
  className?: string;
};

export function QualiopiPlanExamples({
  indicatorId,
  plan: planProp,
  compact = false,
  className,
}: Props) {
  const plan =
    planProp ??
    (indicatorId != null ? getQualiopiIndicatorPlan(indicatorId) : null) ??
    QUALIOPI_INDICATOR_PLANS[1];

  return (
    <section
      className={
        className ??
        (compact
          ? "mt-3 rounded-xl border border-[#1A2340] bg-[#0B1122] p-3"
          : "rounded-[24px] border border-[#26304F] bg-[#111831] p-4 sm:p-5")
      }
    >
      <p
        className={
          compact
            ? "text-[11px] font-extrabold text-[#F2F4FA]"
            : "text-[13.5px] font-extrabold text-[#F2F4FA]"
        }
      >
        Ce que l&apos;on va faire
        {indicatorId != null ? (
          <span className="ml-1.5 font-semibold text-[#6C7593]">· Ind. {indicatorId}</span>
        ) : null}
      </p>
      <p className={compact ? "mt-0.5 text-[11px] text-[#6C7593]" : "mt-0.5 text-[12px] text-[#9AA3BD]"}>
        Exemples — en attendant les vraies preuves
      </p>

      <div className={compact ? "mt-2.5 grid gap-2 sm:grid-cols-2" : "mt-4 grid gap-3 sm:grid-cols-2"}>
        <article
          className={
            compact
              ? "rounded-lg border border-[#1A2340] bg-[#0A0F1E] p-2.5"
              : "rounded-2xl border border-[#1A2340] bg-[#0B1122] p-3.5"
          }
        >
          <p className="text-[10px] font-semibold text-[#A99BFF]">Exemple de process</p>
          <h3
            className={
              compact
                ? "mt-0.5 text-[12px] font-extrabold leading-snug text-[#F2F4FA]"
                : "mt-1 text-[13px] font-extrabold leading-snug text-[#F2F4FA]"
            }
          >
            {plan.processTitle}
          </h3>
          <ol
            className={
              compact
                ? "mt-1.5 list-decimal space-y-1 pl-3.5 text-[11px] leading-snug text-[#9AA3BD]"
                : "mt-2 list-decimal space-y-1.5 pl-4 text-[12px] leading-relaxed text-[#9AA3BD]"
            }
          >
            {plan.processSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </article>

        <article
          className={
            compact
              ? "rounded-lg border border-[#1A2340] bg-[#0A0F1E] p-2.5"
              : "rounded-2xl border border-[#1A2340] bg-[#0B1122] p-3.5"
          }
        >
          <p className="text-[10px] font-semibold text-[#F2CF6B]">Exemple de document</p>
          <h3
            className={
              compact
                ? "mt-0.5 text-[12px] font-extrabold leading-snug text-[#F2F4FA]"
                : "mt-1 text-[13px] font-extrabold leading-snug text-[#F2F4FA]"
            }
          >
            {plan.documentTitle}
          </h3>
          <pre
            className={
              compact
                ? "mt-1.5 max-h-28 overflow-y-auto whitespace-pre-wrap font-mono text-[10px] leading-snug text-[#9AA3BD]"
                : "mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-xl bg-[#0A0F1E] p-2.5 font-mono text-[10.5px] leading-relaxed text-[#9AA3BD]"
            }
          >
            {plan.documentBody}
          </pre>
        </article>
      </div>
    </section>
  );
}
