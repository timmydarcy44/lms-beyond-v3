"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Phone, MessageSquare, BookOpen, ChevronRight } from "lucide-react";

import { MissionList } from "@/components/tuteur/mission-list";
import { TuteurShell } from "@/components/tuteur/tuteur-shell";
import { useTutorAssignmentDetail } from "@/lib/tuteur/use-tutor-assignment-detail";
import { useTutorWorkspace } from "@/lib/tuteur/use-tutor-workspace";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TabKey = "missions" | "evaluations" | "profil" | "historique";

const evalBadge = (status: string) => {
  if (status === "COMPLETE") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  if (status === "EN_RETARD") return "border-rose-500/30 bg-rose-500/10 text-rose-200";
  if (status === "VIDE") return "border-zinc-600/40 bg-zinc-800/80 text-zinc-400";
  return "border-zinc-600/40 bg-zinc-800/80 text-zinc-300";
};

const evalLabel = (status: string) => {
  if (status === "COMPLETE") return "Complété";
  if (status === "EN_RETARD") return "En retard";
  if (status === "VIDE") return "Non configuré";
  return "À remplir";
};

export default function TutorAlternantPage() {
  const { alternantId } = useParams<{ alternantId: string }>();
  const ws = useTutorWorkspace();
  const { data, error, loading, reload } = useTutorAssignmentDetail(alternantId);
  const [activeTab, setActiveTab] = useState<TabKey>("missions");

  const tutorName = ws.data?.tutorName ?? "Tuteur";
  const alternant = data?.learner;

  if (error === "auth") {
    return (
      <TuteurShell tutorName={tutorName}>
        <div className="relative z-10 px-6 py-10 text-zinc-500">Accès réservé aux tuteurs.</div>
      </TuteurShell>
    );
  }

  if (!loading && error === "not_found") {
    return (
      <TuteurShell tutorName={tutorName}>
        <div className="relative z-10 px-6 py-10 text-zinc-500">Alternant introuvable.</div>
      </TuteurShell>
    );
  }

  const fullName = alternant?.displayName ?? "…";
  const statutSynth =
    data?.missions?.length && data.missions.every((m) => m.status === "VALIDEE")
      ? "a_jour"
      : data?.missions?.some((m) => m.status === "INVALIDEE")
        ? "en_retard"
        : "en_cours";
  const statutLabel =
    statutSynth === "a_jour" ? "À jour" : statutSynth === "en_retard" ? "À surveiller" : "En cours";
  const statutPill =
    statutSynth === "a_jour"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      : statutSynth === "en_retard"
        ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
        : "border-sky-500/30 bg-sky-500/10 text-sky-100";

  return (
    <TuteurShell tutorName={tutorName} navBadges={{ missions: ws.data?.kpis.pendingMissionActions }}>
      <div className="relative z-10 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {loading ? (
          <p className="text-sm text-zinc-500">Chargement…</p>
        ) : (
          <>
            <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <Link href="/dashboard/tuteur" className="text-xs font-medium text-violet-300 hover:text-violet-200">
                  ← Tableau de bord
                </Link>
                <div className="mt-4 flex flex-wrap items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-700 to-zinc-900 text-lg font-semibold text-white">
                    {(alternant?.firstName ?? "?").slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{fullName}</h1>
                    <p className="mt-1 text-sm text-zinc-400">{alternant?.ecole ?? "Organisme non renseigné"}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className={cn("rounded-full border px-3 py-0.5 text-xs font-semibold", statutPill)}>
                        Synthèse : {statutLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {alternant?.phone ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 rounded-xl border-white/10 bg-white/[0.04] text-zinc-100 hover:bg-white/[0.08]"
                    asChild
                  >
                    <a href={`tel:${alternant.phone}`}>
                      <Phone className="mr-2 h-4 w-4" />
                      Appeler
                    </a>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="h-10 rounded-xl opacity-40" disabled>
                    <Phone className="mr-2 h-4 w-4" />
                    Appeler
                  </Button>
                )}
                <Button
                  size="sm"
                  className="h-10 rounded-xl border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]"
                  asChild
                >
                  <Link href="/dashboard/student/community">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Message
                  </Link>
                </Button>
                <Button
                  size="sm"
                  className="h-10 rounded-xl border border-violet-500/35 bg-gradient-to-r from-violet-600/80 to-indigo-600/80 text-white hover:from-violet-500 hover:to-indigo-500"
                  disabled
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Référentiel
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-b border-white/[0.06] pb-4">
              {(
                [
                  { key: "missions" as const, label: "Missions" },
                  { key: "evaluations" as const, label: "Évaluations" },
                  { key: "profil" as const, label: "Profil" },
                  { key: "historique" as const, label: "Historique" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition duration-200",
                    activeTab === tab.key
                      ? "bg-gradient-to-r from-violet-600/90 to-indigo-600/80 text-white shadow-lg shadow-violet-900/25"
                      : "border border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/15 hover:text-zinc-100",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-4">
              {activeTab === "missions" && data ? (
                <MissionList
                  missions={data.missions.map((m) => ({
                    id: m.id,
                    title: m.title,
                    description: m.description,
                    status: m.status,
                  }))}
                  onAfterChange={reload}
                />
              ) : null}

              {activeTab === "evaluations" && data ? (
                <div className="space-y-3">
                  {data.evaluations.length === 0 ? (
                    <p className="text-sm text-zinc-500">Aucun formulaire de suivi pour ce rattachement.</p>
                  ) : null}
                  {data.evaluations.map((evaluation) => (
                    <div
                      key={evaluation.id}
                      className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 transition hover:border-white/10"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-white">{evaluation.title}</p>
                          <p className="mt-1 text-sm text-zinc-500">
                            {evalLabel(evaluation.status)}
                            {evaluation.dueDate ? ` — avant le ${evaluation.dueDate}` : ""}
                          </p>
                        </div>
                        <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", evalBadge(evaluation.status))}>
                          {evalLabel(evaluation.status)}
                        </span>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button
                          size="sm"
                          className="rounded-full border border-violet-500/35 bg-gradient-to-r from-violet-600/80 to-indigo-600/80 text-white"
                          asChild
                        >
                          <Link href={`/dashboard/tuteur/formulaires/${alternantId}/${evaluation.id}`}>
                            {evaluation.status === "COMPLETE" ? "Voir / modifier" : "Remplir"}
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {activeTab === "profil" && alternant ? (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 text-sm text-zinc-300 space-y-3">
                  <div>
                    <span className="text-zinc-500">Email</span> — {alternant.email ?? "—"}
                  </div>
                  <div>
                    <span className="text-zinc-500">Téléphone</span> — {alternant.phone ?? "—"}
                  </div>
                  <div>
                    <span className="text-zinc-500">Organisme</span> — {alternant.ecole ?? "—"}
                  </div>
                  <div>
                    <span className="text-zinc-500">Rythme</span> — {alternant.rythmeAlternance ?? "—"}
                  </div>
                  <div>
                    <span className="text-zinc-500">Contrat</span> — {alternant.contratType ?? "—"}
                  </div>
                  <div>
                    <span className="text-zinc-500">Période</span> — {(alternant.dateDebut ?? "—") + " → " + (alternant.dateFin ?? "—")}
                  </div>
                </div>
              ) : null}

              {activeTab === "historique" && data ? (
                <div className="space-y-2">
                  {data.timeline.length === 0 ? (
                    <p className="text-sm text-zinc-500">Aucun événement enregistré pour le moment.</p>
                  ) : null}
                  {data.timeline.map((item) => (
                    <div key={item.id} className="rounded-xl border border-white/[0.06] bg-black/30 px-4 py-3">
                      <p className="text-sm text-zinc-200">{item.label}</p>
                      <p className="mt-1 text-xs text-zinc-500">{item.dateLabel}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </TuteurShell>
  );
}
