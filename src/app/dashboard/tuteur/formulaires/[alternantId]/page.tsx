"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { TuteurShell } from "@/components/tuteur/tuteur-shell";
import { useTutorAssignmentDetail } from "@/lib/tuteur/use-tutor-assignment-detail";
import { useTutorWorkspace } from "@/lib/tuteur/use-tutor-workspace";

export default function TutorLearnerFormsPage() {
  const { alternantId } = useParams<{ alternantId: string }>();
  const ws = useTutorWorkspace();
  const { data, error, loading } = useTutorAssignmentDetail(alternantId);
  const tutorName = ws.data?.tutorName ?? "Tuteur";
  const learnerName = data?.learner.displayName ?? "l'alternant";

  const statusBadge = (status: string) => {
    if (status === "EN_RETARD") return "bg-red-50 text-red-600";
    if (status === "COMPLETE") return "bg-green-50 text-green-600";
    if (status === "VIDE") return "bg-gray-50 text-gray-500";
    return "bg-gray-100 text-gray-600";
  };

  const statusLabel = (status: string) => {
    if (status === "EN_RETARD") return "EN RETARD";
    if (status === "COMPLETE") return "COMPLÉTÉ";
    if (status === "VIDE") return "—";
    return "À REMPLIR";
  };

  return (
    <TuteurShell tutorName={tutorName} navBadges={{ missions: ws.data?.kpis.pendingMissionActions }}>
      <div className="bg-[#f5f5f7] min-h-screen px-6 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <Link href="/dashboard/tuteur" className="text-sm text-gray-500 hover:text-gray-700">
              ← Retour
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-4">Évaluation de {learnerName}</h1>
          </div>

          {error === "not_found" ? <p className="text-sm text-gray-600">Rattachement introuvable.</p> : null}
          {loading ? <p className="text-sm text-gray-500">Chargement…</p> : null}

          <div className="space-y-4">
            {(data?.evaluations ?? []).map((form) => (
              <div key={form.id} className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{form.title}</p>
                    <p className="text-sm text-gray-500 mt-1">Formulaire de suivi</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadge(form.status)}`}>
                    {statusLabel(form.status)}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    {form.dueDate ? `Date limite : ${form.dueDate}` : "Pas de date limite en base"}
                  </p>
                  <Link
                    href={`/dashboard/tuteur/formulaires/${alternantId}/${form.id}`}
                    className="bg-black text-white rounded-full px-5 py-2 text-sm font-medium hover:bg-gray-800"
                  >
                    {form.status === "COMPLETE" ? "Voir le résumé" : "Remplir"}
                  </Link>
                </div>
              </div>
            ))}
            {!loading && data && data.evaluations.length === 0 ? (
              <p className="text-sm text-gray-600">Aucun formulaire actif pour ce contexte.</p>
            ) : null}
          </div>
        </div>
      </div>
    </TuteurShell>
  );
}
