"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Plus, X } from "lucide-react";

export function CourseObjectivesEditor({
  value,
  onChange,
  className,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  className?: string;
}) {
  const rows = value.length ? value : [""];

  return (
    <div className={cn("space-y-3", className)}>
      {rows.map((row, idx) => (
        <div key={`obj-${idx}`} className="flex items-center gap-2">
          <Input
            value={row}
            onChange={(e) => {
              const next = [...rows];
              next[idx] = e.target.value;
              onChange(next);
            }}
            placeholder={`Objectif ${idx + 1}`}
            className="rounded-2xl border border-slate-200 bg-white text-slate-950 placeholder:text-slate-400 shadow-sm"
          />
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              const next = rows.filter((_, i) => i !== idx);
              onChange(next.length ? next : [""]);
            }}
            className="h-10 w-10 rounded-full border border-slate-200 bg-white p-0 text-slate-700 hover:bg-slate-50"
            aria-label="Supprimer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        onClick={() => onChange([...rows, ""])}
        className="rounded-full bg-gradient-to-r from-[#003366] via-[#6633CC] to-[#FF00FF] px-5 py-2 text-sm font-semibold text-white hover:opacity-95"
      >
        <Plus className="mr-2 h-4 w-4" />
        Ajouter une ligne
      </Button>
    </div>
  );
}

