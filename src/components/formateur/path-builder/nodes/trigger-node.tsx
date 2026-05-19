"use client";

import { cn } from "@/lib/utils";
import { Link2, Trash2 } from "lucide-react";

export type TriggerCondition =
  | "previous_step_completed"
  | "formation_completed"
  | "quiz_score_gt_x"
  | "resource_link_clicked"
  | "resource_document_downloaded"
  | "evaluation_passed";

export function TriggerNode({
  condition,
  label,
  isIncomplete,
  isReadonly,
  onClick,
  onRemove,
}: {
  condition: TriggerCondition | null;
  label: string;
  isIncomplete?: boolean;
  isReadonly?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
}) {
  const clickable = Boolean(onClick) && !Boolean(isReadonly);
  return (
    <div className="relative flex justify-center">
      <div
        role={clickable ? "button" : undefined}
        tabIndex={clickable ? 0 : -1}
        onClick={clickable ? onClick : undefined}
        onKeyDown={
          clickable
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick?.();
                }
              }
            : undefined
        }
        aria-disabled={clickable ? undefined : true}
        className={cn(
          "relative rounded-full border border-indigo-200 bg-indigo-600 px-4 py-2 pr-12 text-left text-white shadow-sm transition",
          clickable ? "cursor-pointer hover:bg-indigo-700" : "cursor-default",
        )}
      >
        {onRemove && !isReadonly ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
            className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/70 shadow-sm transition hover:bg-white/15 hover:text-white"
            aria-label="Supprimer le trigger"
            title="Supprimer le trigger"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-full border border-indigo-200 bg-white/10 text-indigo-50",
            )}
          >
            <Link2 className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-white/50">
              Trigger
            </p>
            <div className="flex items-center gap-2">
              <p className="truncate text-xs font-semibold text-white">{label}</p>
              {isIncomplete ? (
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                  À compléter
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <p className="mt-1 text-[11px] text-white/55">
          {condition === "formation_completed"
            ? "Terminée"
            : condition === "quiz_score_gt_x"
              ? "Score Quiz > X%"
              : condition === "resource_link_clicked"
                ? "Lien cliqué"
                : condition === "resource_document_downloaded"
                  ? "Téléchargé"
                  : condition === "evaluation_passed"
                    ? "Réussite (V/F)"
                    : "—"}
        </p>
      </div>
    </div>
  );
}

