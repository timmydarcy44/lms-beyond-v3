"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Bolt, FileText, GraduationCap, HelpCircle, Trash2 } from "lucide-react";

type ActionKind = "course" | "test" | "resource";

export function ActionNode({
  index,
  kind,
  contentId,
  contentTitle,
  thumbnailUrl,
  options,
  onChangeKind,
  onChangeContentId,
  onRemove,
  disabledTestKind,
  isReadonly,
}: {
  index: number;
  kind: ActionKind;
  contentId: string | null;
  contentTitle: string;
  thumbnailUrl?: string | null;
  options: Array<{ id: string; label: string }>;
  onChangeKind: (next: ActionKind) => void;
  onChangeContentId: (next: string | null) => void;
  onRemove: () => void;
  disabledTestKind?: boolean;
  isReadonly?: boolean;
}) {
  const Icon =
    kind === "course" ? GraduationCap : kind === "resource" ? FileText : kind === "test" ? HelpCircle : Bolt;
  const iconTone =
    kind === "course"
      ? "text-blue-600 bg-blue-50 border-blue-100"
      : kind === "resource"
        ? "text-emerald-600 bg-emerald-50 border-emerald-100"
        : "text-orange-600 bg-orange-50 border-orange-100";

  return (
    <div className="group relative rounded-xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className={cn("flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border", iconTone)}>
            <Icon className="h-5 w-5" />
          </div>

          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-600">
                Action
              </span>
              <span className="truncate text-sm font-semibold text-slate-900">
                {contentTitle || `Action #${index + 1}`}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={kind} onValueChange={(v) => onChangeKind(v as ActionKind)}>
                <SelectTrigger
                  className={cn(
                    "h-9 w-[160px] rounded-full border border-slate-200 bg-white text-xs text-slate-900",
                  )}
                  disabled={Boolean(isReadonly)}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border border-slate-200 bg-white text-slate-900">
                  <SelectItem value="course">Formation</SelectItem>
                  <SelectItem value="resource">Ressource</SelectItem>
                  <SelectItem value="test" disabled={Boolean(disabledTestKind)}>
                    Test
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={contentId ? String(contentId) : "none"} onValueChange={(v) => onChangeContentId(v === "none" ? null : v)}>
                <SelectTrigger className="h-9 min-w-[260px] flex-1 rounded-full border border-slate-200 bg-white text-xs text-slate-900" disabled={Boolean(isReadonly)}>
                  <SelectValue placeholder="Choisir un contenu" />
                </SelectTrigger>
                <SelectContent className="border border-slate-200 bg-white text-slate-900">
                  <SelectItem value="none">—</SelectItem>
                  {options.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={onRemove}
          disabled={Boolean(isReadonly)}
          className="h-9 w-9 rounded-full border border-slate-200 bg-white p-0 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          aria-label="Supprimer"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnailUrl || "/fallback.svg"}
          alt=""
          className="h-24 w-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/fallback.svg";
          }}
        />
      </div>
    </div>
  );
}

