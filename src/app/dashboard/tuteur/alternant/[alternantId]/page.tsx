"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { TuteurShell } from "@/components/tuteur/tuteur-shell";
import {
  mockAlternants,
  mockEvaluations,
  mockMissions,
  mockTimeline,
} from "@/lib/mocks/tuteur";

type TabKey = "missions" | "evaluations" | "profil" | "historique";

const badgeClass = (status: string) => {
  switch (status) {
    case "VALIDEE":
      return "bg-green-50 text-green-600";
    case "EN_COURS":
      return "bg-blue-50 text-blue-600";
    case "INVALIDEE":
      return "bg-red-50 text-red-600";
    case "EN_ATTENTE":
      return "bg-gray-100 text-gray-600";
    case "A_FAIRE":
      return "bg-gray-100 text-gray-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

export default function TutorAlternantPage() {
  const { alternantId } = useParams<{ alternantId: string }>();
  const alternant = useMemo(
    () => mockAlternants.find((item) => item.id === alternantId),
    [alternantId]
  );
  const [activeTab, setActiveTab] = useState<TabKey>("missions");
  const [invalidMissionId, setInvalidMissionId] = useState<string | null>(null);
  const [motif, setMotif] = useState("");

  if (!alternant) {
    return (
      <TuteurShell tutorName="Paul Martin">
        <div className="bg-[#f5f5f7] min-h-screen px-6 py-10">
          <div className="max-w-5xl mx-auto text-gray-500">Alternant introuvable.</div>
        </div>
      </TuteurShell>
    );
  }

  const fullName = `${alternant.first_name} ${alternant.last_name}`;

  return (
    <TuteurShell tutorName="Paul Martin">
      <div className="bg-[#f5f5f7] min-h-screen px-6 py-10">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Link href="/dashboard/tuteur" className="text-sm text-gray-500 hover:text-gray-700">
                ← Retour
              </Link>
              <div className="mt-4 flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-semibold">
                  {alternant.first_name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{fullName}</p>
                  <p className="text-sm text-gray-500">
                    {alternant.ecole} • {alternant.contrat_type}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={alternant.phone ? `tel:${alternant.phone}` : undefined}
                className="bg-black text-white rounded-full px-4 py-2 text-sm hover:bg-gray-800"
              >
                📞 Appeler
              </a>
              <Link
                href="/dashboard/student/community"
                className="bg-gray-100 text-gray-900 rounded-full px-4 py-2 text-sm hover:bg-gray-200"
              >
                ✉️ Message
              </Link>
              <button
                type="button"
                className="bg-gray-100 text-gray-400 rounded-full px-4 py-2 text-sm cursor-not-allowed"
                disabled
              >
                📄 Référentiel
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { key: "missions", label: "Missions" },
              { key: "evaluations", label: "Évaluations" },
              { key: "profil", label: "Profil" },
              { key: "historique", label: "Historique" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabKey)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab.key
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "missions" && (
            <div className="space-y-4">
              {mockMissions.map((mission) => (
                <div key={mission.id} className="bg-white rounded-2xl shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base font-semibold text-gray-900">{mission.title}</p>
                      <p className="text-sm text-gray-500 mt-2">{mission.description}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${badgeClass(mission.status)}`}>
                      {mission.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button className="bg-black text-white rounded-full px-4 py-2 text-sm hover:bg-gray-800">
                      Valider ✓
                    </button>
                    <button
                      className="bg-red-50 text-red-600 rounded-full px-4 py-2 text-sm hover:bg-red-100"
                      onClick={() => setInvalidMissionId(mission.id)}
                    >
                      Invalider ✗
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "evaluations" && (
            <div className="space-y-4">
            {mockEvaluations.map((evaluation) => (
                <div key={evaluation.id} className="bg-white rounded-2xl shadow-sm p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{evaluation.title}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {evaluation.status === "EN_RETARD" ? "EN RETARD" : "À REMPLIR"} - avant le {evaluation.dueDate}
                      </p>
                    </div>
                    <Link
                    href={`/dashboard/tuteur/formulaires/${alternant.id}/${evaluation.id}`}
                      className="bg-black text-white rounded-full px-4 py-2 text-sm hover:bg-gray-800"
                    >
                      Remplir
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "profil" && (
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-3 text-sm text-gray-700">
              <div>Email : {alternant.email}</div>
              <div>Téléphone : {alternant.phone}</div>
              <div>École : {alternant.ecole}</div>
              <div>Rythme : {alternant.rythme_alternance}</div>
              <div>Contrat : {alternant.contrat_type}</div>
              <div>Début : {alternant.date_debut}</div>
              <div>Fin : {alternant.date_fin}</div>
              <div>Compétences : Collaboration, Communication, Autonomie</div>
            </div>
          )}

          {activeTab === "historique" && (
            <div className="space-y-3">
              {mockTimeline.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl shadow-sm p-4">
                  <p className="text-sm text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.dateLabel}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {invalidMissionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900">Motif d'invalidation</h3>
            <p className="text-sm text-gray-500 mt-2">
              Pourquoi cette mission ne peut pas être réalisée ?
            </p>
            <textarea
              className="mt-4 w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-700"
              rows={4}
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Motif obligatoire"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                className="bg-gray-100 text-gray-900 rounded-full px-5 py-2 text-sm font-medium hover:bg-gray-200"
                onClick={() => {
                  setInvalidMissionId(null);
                  setMotif("");
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                className="bg-red-600 text-white rounded-full px-5 py-2 text-sm font-medium hover:bg-red-700"
                disabled={!motif.trim()}
                onClick={() => {
                  setInvalidMissionId(null);
                  setMotif("");
                }}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </TuteurShell>
  );
}
