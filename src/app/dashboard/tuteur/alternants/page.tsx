"use client";

import Link from "next/link";
import { TuteurShell } from "@/components/tuteur/tuteur-shell";
import { useTutorWorkspace } from "@/lib/tuteur/use-tutor-workspace";

export default function TutorAlternantsPage() {
  const { data, error, loading } = useTutorWorkspace();
  const tutorName = data?.tutorName ?? "Tuteur";
  const assignments = data?.assignments ?? [];

  if (error === "auth") {
    return (
      <TuteurShell tutorName={tutorName}>
        <div className="px-6 py-10 text-sm text-gray-500">Accès réservé aux tuteurs.</div>
      </TuteurShell>
    );
  }

  return (
    <TuteurShell tutorName={tutorName} navBadges={{ missions: data?.kpis.pendingMissionActions }}>
      <div className="bg-[#f5f5f7] min-h-screen px-6 py-10">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mes alternants</h1>
            <p className="text-sm text-gray-500">Suivez la progression de vos alternants</p>
          </div>

          {loading ? <p className="text-sm text-gray-500">Chargement…</p> : null}

          {!loading && assignments.length === 0 ? (
            <p className="text-sm text-gray-600">Aucun rattachement actif. Contactez votre organisme pour être assigné à des alternants.</p>
          ) : null}

          <div className="grid gap-6 md:grid-cols-2">
            {assignments.map((alternant) => {
              const progress = alternant.missionsTotal
                ? Math.round((alternant.missionsValidees / alternant.missionsTotal) * 100)
                : 0;
              return (
                <div
                  key={alternant.id}
                  className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-semibold">
                      {alternant.firstName.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{alternant.displayName}</p>
                      <p className="text-sm text-gray-500">
                        {(alternant.ecole ?? "Organisme") + (alternant.contratType ? ` • ${alternant.contratType}` : "")}
                      </p>
                      {alternant.rythmeAlternance ? (
                        <p className="text-sm text-gray-500">Rythme : {alternant.rythmeAlternance}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Progression missions</span>
                      <span>
                        {alternant.missionsValidees}/{alternant.missionsTotal}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-gray-100">
                      <div className="h-1.5 rounded-full bg-black" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href={`/dashboard/tuteur/missions/${alternant.id}`}
                      className="bg-black text-white rounded-full px-5 py-2 text-sm font-medium hover:bg-gray-800"
                    >
                      Voir les missions
                    </Link>
                    <Link
                      href={`/dashboard/tuteur/formulaires/${alternant.id}`}
                      className="bg-gray-100 text-gray-900 rounded-full px-5 py-2 text-sm font-medium hover:bg-gray-200"
                    >
                      Évaluations
                    </Link>
                    <Link
                      href="/dashboard/student/community"
                      className="bg-gray-100 text-gray-900 rounded-full px-5 py-2 text-sm font-medium hover:bg-gray-200"
                    >
                      Messagerie
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </TuteurShell>
  );
}
