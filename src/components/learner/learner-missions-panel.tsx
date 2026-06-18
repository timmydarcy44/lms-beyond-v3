"use client";

import { useCallback, useEffect, useState } from "react";
import {
  SALARIE_CARD,
  SALARIE_PAGE_KICKER,
  SALARIE_PAGE_LEAD,
  SALARIE_PAGE_SHELL,
  SALARIE_PAGE_TITLE,
} from "@/lib/salarie/connect-nav";
import { cn } from "@/lib/utils";

type Mission = {
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

const STATUS_PROGRESS: Record<string, number> = {
  pending: 0,
  in_progress: 55,
  completed: 100,
  cancelled: 0,
};

export function LearnerMissionsPanel({ kicker = "Organisation" }: { kicker?: string }) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/apprenant/missions");
      const payload = (await res.json().catch(() => ({}))) as {
        missions?: Mission[];
        error?: string;
      };
      if (!res.ok) {
        setError(payload.error ?? "Impossible de charger vos missions.");
        setMissions([]);
        return;
      }
      setMissions(payload.missions ?? []);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/dashboard/apprenant/missions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const payload = (await res.json().catch(() => ({}))) as { mission?: Mission };
      if (res.ok && payload.mission) {
        setMissions((prev) => prev.map((m) => (m.id === id ? payload.mission! : m)));
      }
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className={SALARIE_PAGE_SHELL}>
      <section className="space-y-2">
        <p className={SALARIE_PAGE_KICKER}>{kicker}</p>
        <h1 className={SALARIE_PAGE_TITLE}>Mes missions</h1>
        <p className={SALARIE_PAGE_LEAD}>
          Missions assignées par votre entreprise. Mettez à jour votre avancement et suivez vos
          échéances.
        </p>
      </section>

      {loading ? (
        <p className="text-sm text-white/50">Chargement…</p>
      ) : error ? (
        <div className={cn(SALARIE_CARD, "text-red-300")}>{error}</div>
      ) : missions.length === 0 ? (
        <div className={SALARIE_CARD}>
          <p className="text-sm text-white/60">Aucune mission pour le moment.</p>
          <p className="mt-2 text-xs text-white/40">
            Votre RH peut vous assigner des missions depuis l&apos;espace entreprise.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {missions.map((mission) => (
            <li key={mission.id} className={SALARIE_CARD}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white">{mission.title}</p>
                  {mission.description ? (
                    <p className="mt-1 text-sm text-white/55">{mission.description}</p>
                  ) : null}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] text-white/40">
                      <span>Avancement</span>
                      <span>{STATUS_PROGRESS[mission.status] ?? 0} %</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-violet-500 transition-all"
                        style={{ width: `${STATUS_PROGRESS[mission.status] ?? 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/40">
                    <span>{STATUS_LABEL[mission.status] ?? mission.status}</span>
                    {mission.due_date ? (
                      <span>
                        · Échéance{" "}
                        {new Date(mission.due_date).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    ) : null}
                    <span>
                      · Créée le{" "}
                      {new Date(mission.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                </div>
                {mission.status !== "completed" && mission.status !== "cancelled" ? (
                  <div className="flex flex-wrap gap-2">
                    {mission.status === "pending" ? (
                      <button
                        type="button"
                        disabled={updatingId === mission.id}
                        onClick={() => void updateStatus(mission.id, "in_progress")}
                        className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/5"
                      >
                        Démarrer
                      </button>
                    ) : null}
                    {mission.status === "in_progress" ? (
                      <button
                        type="button"
                        disabled={updatingId === mission.id}
                        onClick={() => void updateStatus(mission.id, "completed")}
                        className="rounded-full bg-[#2563EB] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1D4ED8]"
                      >
                        Marquer terminée
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
