"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

export type EmployeeMission = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  in_progress: "En cours",
  completed: "Terminée",
  cancelled: "Annulée",
};

const STATUS_CLASS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-50 text-blue-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-600",
};

type Props = {
  employeeId: string;
  missions: EmployeeMission[];
  onChange: (missions: EmployeeMission[]) => void;
};

export function EnterpriseEmployeeMissions({ employeeId, missions, onChange }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/dashboard/entreprise/employees/${encodeURIComponent(employeeId)}/missions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || null,
            due_date: dueDate || null,
          }),
        },
      );
      const payload = (await res.json().catch(() => ({}))) as {
        mission?: EmployeeMission;
        error?: string;
      };
      if (!res.ok || !payload.mission) {
        setError(payload.error ?? "Impossible d'ajouter la mission.");
        return;
      }
      onChange([payload.mission, ...missions]);
      setTitle("");
      setDescription("");
      setDueDate("");
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (missionId: string) => {
    try {
      const res = await fetch(
        `/api/dashboard/entreprise/employees/${encodeURIComponent(employeeId)}/missions?mission_id=${encodeURIComponent(missionId)}`,
        { method: "DELETE" },
      );
      if (!res.ok) return;
      onChange(missions.filter((m) => m.id !== missionId));
    } catch {
      // ignore
    }
  };

  return (
    <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
      <h2 className="text-xl font-black tracking-tight text-gray-950">Missions du collaborateur</h2>
      <p className="mt-2 text-sm text-gray-600">
        Assignez des missions visibles dans l&apos;onglet « Mes missions » du dashboard apprenant.
      </p>

      <div className="mt-6 grid gap-3 rounded-2xl border border-gray-200 bg-gray-50/60 p-4 md:grid-cols-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre de la mission *"
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optionnelle)"
          rows={2}
          className="md:col-span-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
        />
        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void handleAdd()}
            disabled={saving || !title.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {saving ? "Ajout…" : "Ajouter la mission"}
          </button>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {missions.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune mission assignée pour le moment.</p>
        ) : (
          missions.map((mission) => (
            <div
              key={mission.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-gray-200 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-gray-900">{mission.title}</p>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      STATUS_CLASS[mission.status] ?? STATUS_CLASS.pending,
                    )}
                  >
                    {STATUS_LABEL[mission.status] ?? mission.status}
                  </span>
                </div>
                {mission.description ? (
                  <p className="mt-1 text-sm text-gray-600">{mission.description}</p>
                ) : null}
                {mission.due_date ? (
                  <p className="mt-1 text-xs text-gray-500">
                    Échéance :{" "}
                    {new Date(mission.due_date).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => void handleDelete(mission.id)}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                aria-label="Supprimer la mission"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
