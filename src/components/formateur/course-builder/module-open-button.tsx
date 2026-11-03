"use client";

import { useState } from "react";
import { Settings } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCourseBuilder } from "@/hooks/use-course-builder";
import {
  moduleOpenChip,
  moduleOpenPreview,
  readModuleOpenRule,
  type ModuleOpenMode,
  type ModuleOpenRule,
} from "@/lib/lms/module-open";
import { cn } from "@/lib/utils";

const MODULE_OPEN_MODES: { id: ModuleOpenMode; label: string }[] = [
  { id: "immediate", label: "Ouvrir ce module immédiatement" },
  { id: "date", label: "À une date précise" },
  { id: "enrollment", label: "Basé sur l’inscription" },
  { id: "previous", label: "Basé sur la fin du module précédent" },
];

export function ModuleOpenButton({
  sectionId,
  isFirst,
  className,
}: {
  sectionId: string;
  isFirst: boolean;
  className?: string;
}) {
  const section = useCourseBuilder((state) => state.snapshot.sections.find((item) => item.id === sectionId));
  const updateSection = useCourseBuilder((state) => state.updateSection);
  const [open, setOpen] = useState(false);
  if (!section) return null;

  const rule = readModuleOpenRule(section.open_rule);
  const chip = moduleOpenChip(rule);
  const setRule = (next: ModuleOpenRule) => updateSection(section.id, { open_rule: next });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#E3E0D8] bg-white text-[#3A3D45] transition hover:bg-[#F7F6F2]",
            className,
          )}
          aria-label="Ouverture du module"
          title={chip || "Ouverture du module"}
        >
          <Settings className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[420px] max-w-[92vw] bg-white text-slate-950">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle className="text-lg font-extrabold tracking-tight text-slate-950">Ouverture du module</SheetTitle>
          <SheetDescription className="text-slate-600">{section.title?.trim() || "Ce module"}</SheetDescription>
        </SheetHeader>
        <div className="space-y-3 px-6 pb-8">
          {MODULE_OPEN_MODES.map((mode) => {
            const disabled = mode.id === "previous" && isFirst;
            const selected = rule.mode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                disabled={disabled}
                aria-pressed={selected}
                onClick={() => setRule({ ...rule, mode: mode.id })}
                className={cn(
                  "block w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition",
                  selected ? "border-[#6633CC] bg-[#6633CC]/10 text-slate-950" : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
                  disabled && "cursor-not-allowed opacity-40",
                )}
              >
                {mode.label}
              </button>
            );
          })}
          {rule.mode === "date" ? (
            <Input
              type="date"
              value={rule.date ?? ""}
              onChange={(event) => setRule({ ...rule, date: event.target.value || null })}
              className="rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-sm"
            />
          ) : null}
          {rule.mode === "enrollment" || rule.mode === "previous" ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={104}
                value={rule.amount}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setRule({
                    ...rule,
                    amount: Number.isFinite(next) ? Math.min(104, Math.max(0, Math.round(next))) : 0,
                  });
                }}
                className="w-24 rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-sm"
                aria-label="Délai"
              />
              <Select value={rule.unit} onValueChange={(unit) => setRule({ ...rule, unit: unit === "days" ? "days" : "weeks" })}>
                <SelectTrigger className="rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days">jours</SelectItem>
                  <SelectItem value="weeks">semaines</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <p className="text-sm text-slate-600">
            {isFirst && rule.mode === "previous"
              ? "Le premier module n’a pas de module précédent. Il s’ouvre immédiatement."
              : moduleOpenPreview(rule)}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
