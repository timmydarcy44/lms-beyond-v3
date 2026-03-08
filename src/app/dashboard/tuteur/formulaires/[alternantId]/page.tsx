"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { TuteurShell } from "@/components/tuteur/tuteur-shell";
import { mockAlternants, mockEvaluations } from "@/lib/mocks/tuteur";

export default function TutorLearnerFormsPage() {
  const { alternantId } = useParams<{ alternantId: string }>();
  const learner = mockAlternants.find((item) => item.id === alternantId);
  const learnerName = `${learner?.first_name ?? ""} ${learner?.last_name ?? ""}`.trim();

  const statusBadge = (status: string) => {
    if (status === "EN_RETARD") return "bg-red-50 text-red-600";
    if (status === "COMPLETÉ") return "bg-green-50 text-green-600";
    return "bg-gray-100 text-gray-600";
  };

  return (
    <TuteurShell tutorName="Paul Martin">
      <div className="bg-[#f5f5f7] min-h-screen px-6 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <Link href="/dashboard/tuteur" className="text-sm text-gray-500 hover:text-gray-700">
              ← Retour
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-4">
              Évaluation de {learnerName || "l'alternant"}
            </h1>
          </div>

          <div className="space-y-4">
            {mockEvaluations.map((form) => {
              const statusLabel =
                form.status === "EN_RETARD"
                  ? "EN RETARD"
                  : form.status === "COMPLETÉ"
                    ? "COMPLÉTÉ"
                    : "À REMPLIR";
              return (
                <div key={form.id} className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{form.title}</p>
                      <p className="text-sm text-gray-500 mt-1">Formulaire de suivi</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadge(form.status)}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs text-gray-400">Date limite : {form.dueDate}</p>
                    <Link
                      href={`/dashboard/tuteur/formulaires/${alternantId}/${form.id}`}
                      className="bg-black text-white rounded-full px-5 py-2 text-sm font-medium hover:bg-gray-800"
                    >
                      {statusLabel === "COMPLÉTÉ" ? "Voir le résumé" : "Remplir"}
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
