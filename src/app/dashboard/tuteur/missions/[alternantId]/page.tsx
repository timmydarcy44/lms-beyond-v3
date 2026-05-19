"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { MissionList } from "@/components/tuteur/mission-list";
import { TuteurShell } from "@/components/tuteur/tuteur-shell";
import { useTutorAssignmentDetail } from "@/lib/tuteur/use-tutor-assignment-detail";
import { useTutorWorkspace } from "@/lib/tuteur/use-tutor-workspace";

export default function TutorLearnerMissionsPage() {
  const { alternantId } = useParams<{ alternantId: string }>();
  const { data, error, loading, reload } = useTutorAssignmentDetail(alternantId);
  const ws = useTutorWorkspace();
  const tutorName = ws.data?.tutorName ?? "Tuteur";

  const learnerName = data?.learner.displayName ?? "Alternant";

  return (
    <TuteurShell tutorName={tutorName} navBadges={{ missions: ws.data?.kpis.pendingMissionActions }}>
      <div className="bg-[#f5f5f7] min-h-screen px-6 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <Link href="/dashboard/tuteur" className="text-sm text-gray-500 hover:text-gray-700">
              ← Retour
            </Link>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{learnerName}</h1>
                <p className="text-sm text-gray-500">{data?.learner.ecole ?? "École non renseignée"}</p>
              </div>
              <button
                type="button"
                className="bg-gray-100 text-gray-400 rounded-full px-5 py-2 text-sm font-medium cursor-not-allowed"
                title="Aucun référentiel attaché"
                disabled
              >
                Télécharger le référentiel PDF
              </button>
            </div>
          </div>

          {error === "auth" ? <p className="text-sm text-red-600">Accès refusé.</p> : null}
          {error === "not_found" ? <p className="text-sm text-gray-600">Rattachement introuvable.</p> : null}
          {loading ? <p className="text-sm text-gray-500">Chargement…</p> : null}

          {!loading && data ? (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Référentiel de missions</h2>
              <p className="text-sm text-gray-500 mb-6">Suivez l&apos;avancement des missions de l&apos;alternant.</p>
              <MissionList
                missions={data.missions.map((mission) => ({
                  id: mission.id,
                  title: mission.title,
                  description: mission.description,
                  status: mission.status,
                }))}
                onAfterChange={reload}
              />
            </div>
          ) : null}
        </div>
      </div>
    </TuteurShell>
  );
}
