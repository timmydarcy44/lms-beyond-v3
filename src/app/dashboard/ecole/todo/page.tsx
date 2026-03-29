"use client";
import { useEffect, useMemo, useState } from "react";

export const dynamic = "force-dynamic";

type ApiTodoTask = {
  id: string;
  title: string;
  description?: string | null;
  status?: "todo" | "in_progress" | "done" | "archived" | string;
  priority?: "low" | "normal" | "high" | "urgent" | string;
};

type Task = {
  id: string;
  title: string;
  description: string;
  progress: number;
};

const COLUMN_IDS = ["À FAIRE", "EN COURS", "EN ATTENTE", "RÉALISÉ"] as const;

const mockTasks: Record<string, Task[]> = {
  "À FAIRE": [
    { id: "t1", title: "Relancer entreprise X", description: "Relance mail + call.", progress: 20 },
    { id: "t2", title: "Mettre à jour dossier OPCO", description: "Vérifier justificatifs.", progress: 10 },
    { id: "t3", title: "Préparer audit Qualiopi", description: "Checklist & preuves.", progress: 55 },
  ],
  "EN COURS": [
    { id: "t4", title: "Finaliser convention", description: "Échanges juridiques.", progress: 70 },
    { id: "t5", title: "Suivi apprenant NDRC", description: "Plan d’action tuteur.", progress: 45 },
  ],
  "EN ATTENTE": [
    { id: "t6", title: "Retour entreprise Y", description: "Attente décision.", progress: 40 },
  ],
  "RÉALISÉ": [
    { id: "t7", title: "Signature CERFA", description: "Archivage OK.", progress: 100 },
    { id: "t8", title: "Onboarding tuteur", description: "Process validé.", progress: 100 },
    { id: "t9", title: "Brief entreprise Z", description: "Mission clarifiée.", progress: 100 },
    { id: "t10", title: "Convention stage", description: "Dossier complet.", progress: 100 },
  ],
};

const statusToColumn: Record<string, (typeof COLUMN_IDS)[number]> = {
  todo: "À FAIRE",
  in_progress: "EN COURS",
  done: "RÉALISÉ",
  archived: "EN ATTENTE",
};

const statusToProgress: Record<string, number> = {
  todo: 20,
  in_progress: 60,
  done: 100,
  archived: 40,
};

export default function SchoolTodoPage() {
  const [tasksByColumn, setTasksByColumn] = useState<Record<string, Task[]>>(mockTasks);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const res = await fetch("/api/todo-tasks?role_filter=admin");
        if (!res.ok) return;
        const data = (await res.json()) as ApiTodoTask[];
        if (!Array.isArray(data) || data.length === 0) return;

        const mapped: Record<string, Task[]> = {
          "À FAIRE": [],
          "EN COURS": [],
          "EN ATTENTE": [],
          "RÉALISÉ": [],
        };

        data.forEach((task) => {
          const status = task.status || "todo";
          const column = statusToColumn[status] || "À FAIRE";
          mapped[column].push({
            id: task.id,
            title: task.title,
            description: task.description || "Action prioritaire en cours.",
            progress: statusToProgress[status] ?? 30,
          });
        });

        setTasksByColumn(mapped);
      } catch {
        // Fallback sur mock si erreur
      }
    };

    loadTasks();
  }, []);

  const columnCounts = useMemo(
    () =>
      COLUMN_IDS.reduce<Record<string, number>>((acc, id) => {
        acc[id] = tasksByColumn[id]?.length || 0;
        return acc;
      }, {}),
    [tasksByColumn]
  );

  return (
    <div className="relative z-10 p-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header>
          <h1
            className="text-6xl font-black italic uppercase tracking-tight"
            style={{
              fontFamily: "Inter, Impact, 'Arial Black', sans-serif",
              backgroundImage: "linear-gradient(90deg, #FF9500, #FF3B30)",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            TODO
          </h1>
          <p className="mt-2 text-sm text-white/60">Suivi des actions prioritaires.</p>
        </header>

        <section className="grid gap-6 md:grid-cols-4">
          {COLUMN_IDS.map((columnId) => (
            <div
              key={columnId}
              className="flex h-full flex-col rounded-3xl border border-orange-500/10 bg-transparent p-4"
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
                  {columnId}
                </p>
                <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[10px] font-semibold text-orange-200">
                  {columnCounts[columnId]}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {(tasksByColumn[columnId] || []).map((task) => (
                  <div
                    key={task.id}
                    className="rounded-2xl border border-orange-500/10 bg-[#1A1A1A] p-3 transition hover:border-orange-500/50"
                  >
                    <p className="text-sm font-semibold text-white">{task.title}</p>
                    <p className="mt-1 text-xs text-white/50">{task.description}</p>
                    <div className="mt-3 h-1.5 w-full rounded-full bg-black/50">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-orange-400 to-orange-700"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
                {(tasksByColumn[columnId] || []).length === 0 ? (
                  <p className="text-xs text-white/40">Aucune tâche.</p>
                ) : null}
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

