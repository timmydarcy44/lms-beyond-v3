"use client";

import { Plus, Trash2 } from "lucide-react";

type Props = {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
};

export function TrainingLinesEditor({ label, items, onChange, placeholder }: Props) {
  const rows = items.length ? items : [""];

  const update = (index: number, value: string) => {
    const next = [...rows];
    next[index] = value;
    onChange(next.filter((line, i) => line.trim() || i < next.length - 1));
  };

  const add = () => onChange([...rows.filter(Boolean), ""]);
  const remove = (index: number) => onChange(rows.filter((_, i) => i !== index));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#635BFF] hover:underline"
        >
          <Plus className="h-3.5 w-3.5" />
          Ajouter
        </button>
      </div>
      <div className="space-y-2">
        {rows.map((line, index) => (
          <div key={index} className="flex gap-2">
            <input
              className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#635BFF]/40"
              value={line}
              placeholder={placeholder}
              onChange={(e) => update(index, e.target.value)}
            />
            <button
              type="button"
              onClick={() => remove(index)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-600"
              aria-label="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
