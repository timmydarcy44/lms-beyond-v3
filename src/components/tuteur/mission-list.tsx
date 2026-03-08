"use client";

import { useState } from "react";
import { toast } from "sonner";

type MissionItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
};

type Props = {
  missions: MissionItem[];
};

const statusLabels: Record<string, string> = {
  todo: "En attente",
  in_progress: "En cours",
  done: "Validée",
  invalid: "Non réalisable",
};

const statusClasses: Record<string, string> = {
  todo: "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-50 text-blue-600",
  done: "bg-green-50 text-green-600",
  invalid: "bg-red-50 text-red-600",
};

export function MissionList({ missions }: Props) {
  const [items, setItems] = useState<MissionItem[]>(missions);
  const [invalidMissionId, setInvalidMissionId] = useState<string | null>(null);
  const [motif, setMotif] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const applyStatus = async (missionId: string, statut: string, reason?: string) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/tuteur/missions/${missionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut, motif: reason }),
      });
      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour");
      }
      setItems((prev) =>
        prev.map((item) =>
          item.id === missionId
            ? { ...item, status: statut === "INVALIDEE" ? "invalid" : statut === "VALIDEE" ? "done" : statut === "EN_COURS" ? "in_progress" : "todo" }
            : item
        )
      );
      toast.success("Mission mise à jour");
    } catch (error) {
      console.error("Error updating mission:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsSaving(false);
      setInvalidMissionId(null);
      setMotif("");
    }
  };

  return (
    <div className="space-y-4">
      {items.map((mission) => {
        const label = statusLabels[mission.status] ?? "En attente";
        const tone = statusClasses[mission.status] ?? statusClasses.todo;
        return (
          <div key={mission.id} className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-gray-900">{mission.title}</p>
                {mission.description && <p className="text-sm text-gray-500 mt-2">{mission.description}</p>}
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${tone}`}>{label}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                className="bg-black text-white rounded-full px-5 py-2 text-sm font-medium hover:bg-gray-800"
                disabled={isSaving}
                onClick={() => applyStatus(mission.id, "VALIDEE")}
              >
                Valider
              </button>
              <button
                type="button"
                className="bg-gray-100 text-gray-900 rounded-full px-5 py-2 text-sm font-medium hover:bg-gray-200"
                disabled={isSaving}
                onClick={() => applyStatus(mission.id, "EN_COURS")}
              >
                En cours
              </button>
              <button
                type="button"
                className="bg-red-50 text-red-600 rounded-full px-5 py-2 text-sm font-medium hover:bg-red-100"
                onClick={() => setInvalidMissionId(mission.id)}
              >
                Invalider
              </button>
            </div>
          </div>
        );
      })}

      {invalidMissionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900">Motif d'invalidation</h3>
            <p className="text-sm text-gray-500 mt-2">
              Pourquoi cette mission ne peut pas être réalisée ?
            </p>
            <textarea
              className="mt-4 w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-700"
              rows={4}
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Motif obligatoire"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                className="bg-gray-100 text-gray-900 rounded-full px-5 py-2 text-sm font-medium hover:bg-gray-200"
                onClick={() => {
                  setInvalidMissionId(null);
                  setMotif("");
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                className="bg-red-600 text-white rounded-full px-5 py-2 text-sm font-medium hover:bg-red-700"
                disabled={!motif.trim() || isSaving}
                onClick={() => applyStatus(invalidMissionId, "INVALIDEE", motif)}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
