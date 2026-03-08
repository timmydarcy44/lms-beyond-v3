"use client";

import Link from "next/link";
import { TuteurShell } from "@/components/tuteur/tuteur-shell";
import { mockAlternants } from "@/lib/mocks/tuteur";

export default function TutorFormsPage() {
  const tutorName = "Paul Martin";

  return (
    <TuteurShell tutorName={tutorName}>
      <div className="bg-[#f5f5f7] min-h-screen px-6 py-10">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Évaluations</h1>
            <p className="text-sm text-gray-500">Choisissez un alternant pour voir ses formulaires.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {mockAlternants.map((alternant) => (
              <Link
                key={alternant.id}
                href={`/dashboard/tuteur/formulaires/${alternant.id}`}
                className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-semibold">
                    {alternant.first_name.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-gray-900">
                      {alternant.first_name} {alternant.last_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {alternant.ecole} • {alternant.contrat_type}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </TuteurShell>
  );
}
