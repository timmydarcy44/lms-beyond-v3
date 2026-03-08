"use client";

import Link from "next/link";
import { TuteurShell } from "@/components/tuteur/tuteur-shell";
import { mockAlternants, mockAlerts, mockPendingMissions, mockTodos } from "@/lib/mocks/tuteur";

export default function TutorDashboardPage() {
  const tutorName = "Paul Martin";

  const statusBadge = (statut: string) => {
    if (statut === "a_jour") return "bg-green-50 text-green-600";
    if (statut === "en_retard") return "bg-red-50 text-red-600";
    return "bg-blue-50 text-blue-600";
  };

  const statusLabel = (statut: string) => {
    if (statut === "a_jour") return "À jour";
    if (statut === "en_retard") return "En retard";
    return "En cours";
  };

  return (
    <TuteurShell tutorName={tutorName}>
      <div className="bg-[#f5f5f7] min-h-screen px-6 py-10">
        <div className="max-w-5xl mx-auto space-y-10">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bonjour {tutorName} 👋</h1>
            <p className="text-sm text-gray-500">Voici l'état de vos alternants aujourd'hui</p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: "Mes alternants", value: "3" },
              { label: "Missions en attente", value: "5" },
              { label: "Évaluations à remplir", value: "2" },
              { label: "Badges obtenus", value: "12" },
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="text-3xl font-bold text-gray-900">{item.value}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mt-2">
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          {mockAlerts.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-sm font-semibold text-amber-900 mb-2">Alertes</p>
              <ul className="list-disc pl-4 text-sm text-amber-900 space-y-1">
                {mockAlerts.map((alert) => (
                  <li key={alert}>{alert}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Mes alternants</h2>
              <Link href="/dashboard/tuteur/alternants" className="text-sm text-gray-500 hover:text-gray-900">
                Voir tous →
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {mockAlternants.map((alternant) => {
                const progress = alternant.missions_total
                  ? Math.round((alternant.missions_validees / alternant.missions_total) * 100)
                  : 0;
                return (
                  <Link
                    key={alternant.id}
                    href={`/dashboard/tuteur/alternant/${alternant.id}`}
                    className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {alternant.first_name} {alternant.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{alternant.ecole}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadge(alternant.statut)}`}>
                        {statusLabel(alternant.statut)}
                      </span>
                    </div>
                    <div className="mt-4">
                      <div className="h-1.5 rounded-full bg-gray-100">
                        <div className="h-1.5 rounded-full bg-black" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        {alternant.missions_validees}/{alternant.missions_total} missions validées
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">En attente de validation</h2>
                <Link href="/dashboard/tuteur/missions" className="text-sm text-gray-500 hover:text-gray-900">
                  Voir toutes →
                </Link>
              </div>
              <div className="space-y-4">
                {mockPendingMissions.map((mission) => (
                  <div key={mission.id} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {mission.learner} — {mission.title}
                      </p>
                      <p className="text-xs text-gray-500">Échéance : {mission.dueDate}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="bg-black text-white rounded-full px-4 py-2 text-sm hover:bg-gray-800">
                        Valider
                      </button>
                      <button className="bg-red-50 text-red-600 rounded-full px-4 py-2 text-sm hover:bg-red-100">
                        Invalider
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Mes tâches</h2>
                <Link href="/dashboard/tuteur/todo" className="text-sm text-gray-500 hover:text-gray-900">
                  Ajouter une tâche →
                </Link>
              </div>
              <ul className="space-y-3 text-sm text-gray-700">
                {mockTodos.map((task) => (
                  <li key={task.id} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-gray-300" />
                    {task.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </TuteurShell>
  );
}
