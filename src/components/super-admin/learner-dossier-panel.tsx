"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Clock,
  TrendingUp,
  TrendingDown,
  BookOpen,
  ClipboardCheck,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Timer,
  Activity,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  formatLearnerDuration,
  type LearnerDossier,
} from "@/lib/queries/learner-dossier-types";

type LearnerDossierPanelProps = {
  dossier: LearnerDossier;
  variant?: "default" | "jessica";
};

const COACHING_TYPE_LABELS: Record<string, string> = {
  accompagnement_reservation: "Réservation coaching",
  programme_request: "Programme accompagnement",
  personalized_path: "Parcours personnalisé",
  edge_mission: "Mission EDGE",
  path_trigger: "Entretien parcours",
  ai_lesson: "Coaching IA (leçon)",
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  try {
    return format(new Date(value), "dd MMM yyyy · HH:mm", { locale: fr });
  } catch {
    return "—";
  }
}

export function LearnerDossierPanel({ dossier, variant = "default" }: LearnerDossierPanelProps) {
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);
  const [showAllTests, setShowAllTests] = useState(false);

  const isJessica = variant === "jessica";
  const primary = isJessica ? "#C6A664" : "#059669";
  const border = isJessica ? "#E6D9C6" : "#e5e7eb";
  const text = isJessica ? "#2F2A25" : "#111827";
  const muted = isJessica ? "opacity-70" : "text-gray-500";
  const surface = isJessica ? "#F8F5F0" : "#f9fafb";

  const visibleTests = showAllTests ? dossier.catalogTests : dossier.catalogTests.slice(0, 8);

  return (
    <div className="space-y-6">
      {/* KPIs engagement */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            label: "Temps total connecté",
            value: formatLearnerDuration(dossier.totalTimeSeconds),
            sub: `Actif : ${formatLearnerDuration(dossier.totalActiveTimeSeconds)}`,
            icon: Timer,
          },
          {
            label: "Tests catalogue",
            value: String(dossier.totalTestAttempts),
            sub: `${dossier.catalogTests.filter((t) => t.totalAttemptsForTest > 1).length} test(s) refait(s)`,
            icon: ClipboardCheck,
          },
          {
            label: "Quiz formations",
            value: String(dossier.totalQuizAttempts),
            sub: `${dossier.quizSummaries.length} quiz distinct(s)`,
            icon: BookOpen,
          },
          {
            label: "Sessions flashcards",
            value: String(dossier.flashcardSessions.length),
            sub: dossier.flashcardSessions.length
              ? `Dernière : ${formatDateTime(dossier.flashcardSessions[0]?.completedAt ?? null)}`
              : "Aucune session enregistrée",
            icon: Layers,
          },
          {
            label: "Coaching / accompagnement",
            value: String(dossier.coachingActivities.length),
            sub: `${dossier.interviewSessions.filter((s) => s.interviewStyle === "coaching").length} session(s) « Se faire coacher »`,
            icon: MessageSquare,
          },
        ].map(({ label, value, sub, icon: Icon }) => (
          <Card
            key={label}
            className="rounded-2xl border-2"
            style={{ borderColor: border, backgroundColor: isJessica ? "#FFFFFF" : undefined }}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div
                  className="p-2 rounded-full shrink-0"
                  style={{ backgroundColor: `${primary}20` }}
                >
                  <Icon className="h-5 w-5" style={{ color: primary }} />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: text, opacity: 0.65 }}>
                    {label}
                  </p>
                  <p className="text-2xl font-bold mt-0.5" style={{ color: text }}>
                    {value}
                  </p>
                  <p className="text-xs mt-1" style={{ color: text, opacity: 0.55 }}>
                    {sub}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Synthèse forces / difficultés */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-2xl border-2" style={{ borderColor: border }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2" style={{ color: text }}>
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Forces identifiées
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dossier.strengths.length === 0 && !dossier.profileAnalysis?.strengths.length ? (
              <p className={`text-sm ${muted}`}>Pas encore assez de données de quiz.</p>
            ) : (
              <ul className="space-y-2">
                {dossier.strengths.map((s) => (
                  <li
                    key={s.category}
                    className="flex items-center justify-between text-sm rounded-lg px-3 py-2"
                    style={{ backgroundColor: surface }}
                  >
                    <span style={{ color: text }}>{s.category}</span>
                    <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50">
                      {s.averagePercent} %
                    </Badge>
                  </li>
                ))}
                {(dossier.profileAnalysis?.strengths ?? []).map((s, i) => (
                  <li key={`pa-s-${i}`} className="text-sm pl-3 border-l-2 border-emerald-400" style={{ color: text }}>
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-2" style={{ borderColor: border }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2" style={{ color: text }}>
              <TrendingDown className="h-5 w-5 text-amber-600" />
              Axes de progression
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dossier.weaknesses.length === 0 && !dossier.profileAnalysis?.improvements.length ? (
              <p className={`text-sm ${muted}`}>Pas encore assez de données de quiz.</p>
            ) : (
              <ul className="space-y-2">
                {dossier.weaknesses.map((s) => (
                  <li
                    key={s.category}
                    className="flex items-center justify-between text-sm rounded-lg px-3 py-2"
                    style={{ backgroundColor: surface }}
                  >
                    <span style={{ color: text }}>{s.category}</span>
                    <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50">
                      {s.averagePercent} %
                    </Badge>
                  </li>
                ))}
                {(dossier.profileAnalysis?.improvements ?? []).map((s, i) => (
                  <li key={`pa-w-${i}`} className="text-sm pl-3 border-l-2 border-amber-400" style={{ color: text }}>
                    {s}
                  </li>
                ))}
              </ul>
            )}
            {dossier.profileAnalysis?.summary ? (
              <p className="text-sm mt-4 pt-4 border-t" style={{ color: text, opacity: 0.8 }}>
                {dossier.profileAnalysis.summary}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Temps par formation */}
      <Card className="rounded-2xl border-2" style={{ borderColor: border }}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2" style={{ color: text }}>
            <Activity className="h-5 w-5" style={{ color: primary }} />
            Temps de connexion par formation
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dossier.courses.length === 0 ? (
            <p className={`text-sm ${muted}`}>Aucune formation assignée ou aucune session enregistrée.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left" style={{ borderColor: border }}>
                    <th className="pb-2 font-medium" style={{ color: text }}>Formation</th>
                    <th className="pb-2 font-medium" style={{ color: text }}>Progression</th>
                    <th className="pb-2 font-medium" style={{ color: text }}>Temps total</th>
                    <th className="pb-2 font-medium" style={{ color: text }}>Temps actif</th>
                    <th className="pb-2 font-medium" style={{ color: text }}>Sessions</th>
                    <th className="pb-2 font-medium" style={{ color: text }}>Dernière activité</th>
                  </tr>
                </thead>
                <tbody>
                  {dossier.courses.map((c) => (
                    <tr key={c.courseId} className="border-b last:border-0" style={{ borderColor: border }}>
                      <td className="py-3 pr-4 font-medium" style={{ color: text }}>
                        {c.courseTitle ?? "Formation"}
                      </td>
                      <td className="py-3 pr-4 tabular-nums">
                        {c.progressPercent != null ? `${Math.round(c.progressPercent)} %` : "—"}
                      </td>
                      <td className="py-3 pr-4 tabular-nums">{formatLearnerDuration(c.totalTimeSeconds)}</td>
                      <td className="py-3 pr-4 tabular-nums">{formatLearnerDuration(c.activeTimeSeconds)}</td>
                      <td className="py-3 pr-4 tabular-nums">{c.sessionCount}</td>
                      <td className="py-3 text-xs whitespace-nowrap" style={{ color: text, opacity: 0.65 }}>
                        {formatDateTime(c.lastSessionAt ?? c.lastAccessedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-xs mt-3" style={{ color: text, opacity: 0.5 }}>
            Le temps actif correspond au temps avec interaction (souris, clavier). Horodatage basé sur les sessions
            enregistrées lors de la navigation sur les formations.
          </p>
        </CardContent>
      </Card>

      {/* Historique tests catalogue */}
      <Card className="rounded-2xl border-2" style={{ borderColor: border }}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2" style={{ color: text }}>
            <ClipboardCheck className="h-5 w-5" style={{ color: primary }} />
            Historique des tests ({dossier.catalogTests.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {visibleTests.length === 0 ? (
            <p className={`text-sm ${muted}`}>Aucun test catalogue complété.</p>
          ) : (
            visibleTests.map((t) => {
              const isOpen = expandedTestId === t.id;
              return (
                <div
                  key={t.id}
                  className="rounded-xl border-2 overflow-hidden"
                  style={{ borderColor: border, backgroundColor: surface }}
                >
                  <button
                    type="button"
                    className="w-full flex items-center justify-between gap-4 p-4 text-left hover:opacity-90"
                    onClick={() => setExpandedTestId(isOpen ? null : t.id)}
                  >
                    <div>
                      <p className="font-medium" style={{ color: text }}>
                        {t.testTitle}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: text, opacity: 0.6 }}>
                        {formatDateTime(t.completedAt)} · Tentative {t.attemptIndex}/{t.totalAttemptsForTest}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {t.percentage != null ? (
                        <span className="text-lg font-bold tabular-nums" style={{ color: primary }}>
                          {t.percentage} %
                        </span>
                      ) : null}
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 opacity-50" />
                      ) : (
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      )}
                    </div>
                  </button>
                  {isOpen ? (
                    <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: border }}>
                      {t.categoryResults.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3">
                          {t.categoryResults.map((cat) => (
                            <div
                              key={cat.category}
                              className="rounded-lg px-3 py-2 text-xs"
                              style={{ backgroundColor: isJessica ? "#FFFFFF" : "#fff" }}
                            >
                              <p className="font-medium truncate" style={{ color: text }}>
                                {cat.category}
                              </p>
                              <p className="tabular-nums mt-0.5" style={{ color: primary }}>
                                {Math.round(cat.percentage)} %
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {t.analysis ? (
                        <div
                          className="text-sm prose prose-sm max-w-none rounded-lg p-3"
                          style={{ backgroundColor: isJessica ? "#FFFFFF" : "#fff" }}
                          dangerouslySetInnerHTML={{ __html: t.analysis }}
                        />
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
          {dossier.catalogTests.length > 8 ? (
            <button
              type="button"
              className="text-sm font-medium mt-2"
              style={{ color: primary }}
              onClick={() => setShowAllTests((v) => !v)}
            >
              {showAllTests ? "Voir moins" : `Voir les ${dossier.catalogTests.length} tentatives`}
            </button>
          ) : null}
        </CardContent>
      </Card>

      {/* Quiz LMS */}
      {dossier.quizSummaries.length > 0 ? (
        <Card className="rounded-2xl border-2" style={{ borderColor: border }}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2" style={{ color: text }}>
              <BookOpen className="h-5 w-5" style={{ color: primary }} />
              Quiz intégrés aux formations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left" style={{ borderColor: border }}>
                    <th className="pb-2 font-medium">Quiz</th>
                    <th className="pb-2 font-medium">Passages</th>
                    <th className="pb-2 font-medium">Meilleur score</th>
                    <th className="pb-2 font-medium">Dernier score</th>
                    <th className="pb-2 font-medium">Dernière tentative</th>
                  </tr>
                </thead>
                <tbody>
                  {dossier.quizSummaries.map((q) => (
                    <tr key={q.testId} className="border-b last:border-0" style={{ borderColor: border }}>
                      <td className="py-2.5 pr-4">{q.testTitle ?? "Quiz"}</td>
                      <td className="py-2.5 pr-4 tabular-nums">{q.attemptCount}</td>
                      <td className="py-2.5 pr-4 tabular-nums">{q.bestScore}</td>
                      <td className="py-2.5 pr-4 tabular-nums">{q.lastScore}</td>
                      <td className="py-2.5 text-xs whitespace-nowrap opacity-70">
                        {formatDateTime(q.lastAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Flashcards */}
      <Card className="rounded-2xl border-2" style={{ borderColor: border }}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2" style={{ color: text }}>
            <Layers className="h-5 w-5" style={{ color: primary }} />
            Flashcards ({dossier.flashcardSessions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dossier.flashcardSessions.length === 0 ? (
            <p className={`text-sm ${muted}`}>Aucune session flashcards enregistrée.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left" style={{ borderColor: border }}>
                    <th className="pb-2 font-medium">Formation</th>
                    <th className="pb-2 font-medium">Cartes</th>
                    <th className="pb-2 font-medium">Su / Pas su</th>
                    <th className="pb-2 font-medium">Taux réussite</th>
                    <th className="pb-2 font-medium">Durée</th>
                    <th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {dossier.flashcardSessions.map((fc) => (
                    <tr key={fc.id} className="border-b last:border-0" style={{ borderColor: border }}>
                      <td className="py-2.5 pr-4">{fc.courseTitle ?? "Formation"}</td>
                      <td className="py-2.5 pr-4 tabular-nums">{fc.totalCards}</td>
                      <td className="py-2.5 pr-4 tabular-nums">
                        {fc.knownCount} / {fc.unknownCount}
                      </td>
                      <td className="py-2.5 pr-4 tabular-nums">{fc.knownPercent} %</td>
                      <td className="py-2.5 pr-4 tabular-nums">
                        {formatLearnerDuration(fc.durationSeconds)}
                      </td>
                      <td className="py-2.5 text-xs whitespace-nowrap opacity-70">
                        {formatDateTime(fc.completedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coaching & accompagnement */}
      <Card className="rounded-2xl border-2" style={{ borderColor: border }}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2" style={{ color: text }}>
            <MessageSquare className="h-5 w-5" style={{ color: primary }} />
            Coaching & « Se faire coacher »
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dossier.coachingActivities.length === 0 ? (
            <p className={`text-sm ${muted}`}>
              Aucune demande de coaching ou session enregistrée pour le moment.
            </p>
          ) : (
            <ul className="space-y-3">
              {dossier.coachingActivities.map((a) => (
                <li
                  key={a.id}
                  className="rounded-xl border-2 p-4"
                  style={{ borderColor: border, backgroundColor: surface }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <Badge variant="outline" className="text-xs mb-1.5">
                        {COACHING_TYPE_LABELS[a.type] ?? a.type}
                      </Badge>
                      <p className="font-medium" style={{ color: text }}>
                        {a.title}
                      </p>
                      {a.detail ? (
                        <p className="text-sm mt-1" style={{ color: text, opacity: 0.7 }}>
                          {a.detail}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs flex items-center gap-1 justify-end" style={{ color: text, opacity: 0.6 }}>
                        <Clock className="h-3 w-3" />
                        {formatDateTime(a.occurredAt)}
                      </p>
                      {a.status ? (
                        <Badge variant="secondary" className="mt-1 text-xs capitalize">
                          {a.status}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  {a.strengths && a.strengths.length > 0 ? (
                    <p className="text-xs mt-2 text-emerald-700">
                      Forces : {a.strengths.join(", ")}
                    </p>
                  ) : null}
                  {a.improvements && a.improvements.length > 0 ? (
                    <p className="text-xs mt-1 text-amber-700">
                      Axes : {a.improvements.join(", ")}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {dossier.aiTransformations.length > 0 ? (
            <div className="mt-4 pt-4 border-t" style={{ borderColor: border }}>
              <p className="text-xs font-medium mb-2" style={{ color: text, opacity: 0.7 }}>
                Outils IA utilisés dans les leçons
              </p>
              <div className="flex flex-wrap gap-2">
                {dossier.aiTransformations.slice(0, 8).map((t) => (
                  <Badge key={t.action} variant="outline" className="text-xs">
                    {t.action} ×{t.count}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
