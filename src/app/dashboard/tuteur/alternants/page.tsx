"use client";

import Link from "next/link";
import { TuteurShell } from "@/components/tuteur/tuteur-shell";
import { mockAlternants } from "@/lib/mocks/tuteur";

export default function TutorAlternantsPage() {
  const tutorName = "Paul Martin";

  return (
    <TuteurShell tutorName={tutorName}>
      <div className="bg-[#f5f5f7] min-h-screen px-6 py-10">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mes alternants</h1>
            <p className="text-sm text-gray-500">Suivez la progression de vos alternants</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {mockAlternants.map((alternant) => {
              const progress = alternant.missions_total
                ? Math.round((alternant.missions_validees / alternant.missions_total) * 100)
                : 0;
              return (
                <div
                  key={alternant.id}
                  className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-semibold">
                      {alternant.first_name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">
                        {alternant.first_name} {alternant.last_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {alternant.ecole} • {alternant.contrat_type}
                      </p>
                      <p className="text-sm text-gray-500">
                        Rythme : {alternant.rythme_alternance}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Progression missions</span>
                      <span>
                        {alternant.missions_validees}/{alternant.missions_total}
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
