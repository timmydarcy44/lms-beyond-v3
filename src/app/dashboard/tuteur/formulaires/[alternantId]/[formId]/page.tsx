"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { TuteurShell } from "@/components/tuteur/tuteur-shell";

export default function TutorLearnerFormDetailPage() {
  const { alternantId, formId } = useParams<{ alternantId: string; formId: string }>();

  return (
    <TuteurShell tutorName="Paul Martin">
      <div className="bg-[#f5f5f7] min-h-screen px-6 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <Link
              href={`/dashboard/tuteur/formulaires/${alternantId}`}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Retour
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-4">Formulaire {formId}</h1>
            <p className="text-sm text-gray-500 mt-2">
              Cette page affichera le formulaire et le résumé des réponses.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 text-gray-500">
            Contenu du formulaire à intégrer.
          </div>
        </div>
      </div>
    </TuteurShell>
  );
}
