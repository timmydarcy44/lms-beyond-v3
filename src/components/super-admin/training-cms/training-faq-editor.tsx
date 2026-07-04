"use client";

import { Plus, Trash2 } from "lucide-react";
import type { TrainingCourseFaqItem } from "@/lib/training-courses/types";

type Props = {
  items: TrainingCourseFaqItem[];
  onChange: (items: TrainingCourseFaqItem[]) => void;
};

export function TrainingFaqEditor({ items, onChange }: Props) {
  const rows = items.length ? items : [{ q: "", a: "" }];

  const update = (index: number, patch: Partial<TrainingCourseFaqItem>) => {
    const next = rows.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange(next.filter((item) => item.q.trim() || item.a.trim()));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">FAQ</span>
        <button
          type="button"
          onClick={() => onChange([...rows, { q: "", a: "" }])}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#635BFF]"
        >
          <Plus className="h-3.5 w-3.5" />
          Question
        </button>
      </div>
      {rows.map((item, index) => (
        <div key={index} className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
              className="text-gray-400 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <input
            value={item.q}
            onChange={(e) => update(index, { q: e.target.value })}
            placeholder="Question"
            className="mb-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium outline-none focus:border-[#635BFF]/40"
          />
          <textarea
            value={item.a}
            onChange={(e) => update(index, { a: e.target.value })}
            placeholder="Réponse"
            className="min-h-[72px] w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#635BFF]/40"
          />
        </div>
      ))}
    </div>
  );
}
