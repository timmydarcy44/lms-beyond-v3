"use client";

import { Plus, Trash2 } from "lucide-react";
import type { TrainingSessionRow } from "@/lib/training-courses/cms-types";
import { createId } from "@/lib/training-courses/cms-types";

type Props = {
  sessions: TrainingSessionRow[];
  onChange: (sessions: TrainingSessionRow[]) => void;
};

export function TrainingSessionsEditor({ sessions, onChange }: Props) {
  const add = () =>
    onChange([
      ...sessions,
      {
        id: createId(),
        date: "",
        city: "",
        seats: "",
        price: "",
        format: "",
      },
    ]);

  const update = (id: string, patch: Partial<TrainingSessionRow>) => {
    onChange(sessions.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const remove = (id: string) => onChange(sessions.filter((s) => s.id !== id));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Sessions</span>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#635BFF]"
        >
          <Plus className="h-3.5 w-3.5" />
          Session
        </button>
      </div>
      {sessions.length === 0 ? (
        <p className="text-sm text-gray-400">Aucune session. Les tarifs par défaut s&apos;afficheront si vide.</p>
      ) : (
        sessions.map((session) => (
          <div key={session.id} className="grid gap-2 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-2">
            <input
              value={session.date}
              onChange={(e) => update(session.id, { date: e.target.value })}
              placeholder="Date / libellé"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#635BFF]/40"
            />
            <input
              value={session.city}
              onChange={(e) => update(session.id, { city: e.target.value })}
              placeholder="Lieu"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#635BFF]/40"
            />
            <input
              value={session.seats}
              onChange={(e) => update(session.id, { seats: e.target.value })}
              placeholder="Places"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#635BFF]/40"
            />
            <input
              value={session.price}
              onChange={(e) => update(session.id, { price: e.target.value })}
              placeholder="Prix affiché"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#635BFF]/40"
            />
            <input
              value={session.format ?? ""}
              onChange={(e) => update(session.id, { format: e.target.value })}
              placeholder="Format (Inter / Intra)"
              className="sm:col-span-2 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#635BFF]/40"
            />
            <div className="sm:col-span-2 flex justify-end">
              <button type="button" onClick={() => remove(session.id)} className="text-xs text-red-600 hover:underline">
                Supprimer
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
