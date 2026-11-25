"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Bell, Download, ExternalLink, FileDown } from "lucide-react";
import type { SuiviLearnerDetail } from "@/lib/lms/learner-suivi-detail";
import { formatDurationCompact } from "@/lib/lms/lms-metrics";
import { toast } from "sonner";

const BG = "#0A0F1E";
const CARD = "#111831";
const BORDER = "#1A2340";
const TEXT = "#F2F4FA";
const MUTED = "#9AA3BD";
const TERT = "#6C7593";
const VIOLET = "#6E5BFF";
const VIOLET_SOFT = "#C9C2FF";
const BLUE = "#8DB8FF";
const GREEN = "#6BE39B";
const AMBER = "#F2CF6B";
const RED = "#FF8A9B";

type Props = { initial: SuiviLearnerDetail };

function fmtDate(iso: string | null, opts?: Intl.DateTimeFormatOptions) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    ...opts,
  }).format(new Date(iso));
}

function toneColor(tone: SuiviLearnerDetail["activityTone"]) {
  if (tone === "green") return GREEN;
  if (tone === "amber") return AMBER;
  if (tone === "red") return RED;
  return TERT;
}

function quizColor(score: number | null) {
  if (score == null) return TERT;
  if (score >= 80) return GREEN;
  if (score >= 50) return AMBER;
  return RED;
}

function kindLabel(kind: string) {
  if (kind === "email_auto") return "E-mail automatique";
  if (kind === "appel") return "Appel conseillé";
  return "E-mail manuel";
}

function statusLabel(status: string) {
  if (status === "ouvert") return "Ouvert";
  if (status === "a_venir") return "À venir";
  if (status === "fait") return "Fait";
  return "Envoyé";
}

export function LmsSuiviDetailV2({ initial }: Props) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [relanceOpen, setRelanceOpen] = useState(false);
  const [relanceBusy, setRelanceBusy] = useState(false);
  const [autoBusy, setAutoBusy] = useState(false);
  const [courseId, setCourseId] = useState(data.courseId ?? data.courses[0]?.id ?? "");

  const defaultSubject = useMemo(() => {
    const prenom = data.firstName || "toi";
    return `On reprend où tu t’étais arrêté${data.firstName ? "e" : ""} ?`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.firstName]);

  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(
    `Bonjour ${data.firstName || ""},\n\nTu as commencé « ${data.courseTitle || "ta formation"} ». Reprends ici : ${typeof window !== "undefined" ? window.location.origin : ""}/dashboard/apprenant/parcours\n\nÀ bientôt,\nL’équipe Byound`,
  );

  const visibleSessions = showAllSessions ? data.sessions : data.sessions.slice(0, 4);
  const hiddenCount = Math.max(0, data.sessions.length - 4);
  const maxWeek = Math.max(1, ...data.weekBars.map((b) => b.seconds));

  const selectedCourseTitle =
    data.courses.find((c) => c.id === courseId)?.title ?? data.courseTitle ?? "Formation";

  async function toggleAuto(next: boolean) {
    setAutoBusy(true);
    try {
      const res = await fetch(`/api/super/lms/suivi/${data.userId}/auto-relance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Impossible de modifier");
      setData((d) => ({ ...d, autoRelanceEnabled: next }));
      toast.success(next ? "Relance automatique activée" : "Relance automatique désactivée");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setAutoBusy(false);
    }
  }

  async function sendRelance() {
    setRelanceBusy(true);
    try {
      const res = await fetch("/api/super/lms/suivi/relance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          learnerId: data.userId,
          subject,
          body,
          courseId: courseId || null,
          leafTitle: selectedCourseTitle,
          sendEmail: true,
          testOnly: true,
          kind: "email_manuel",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Envoi impossible");
      toast.success(json.emailed ? "Relance envoyée" : "Relance journalisée");
      setRelanceOpen(false);
      // refresh list lightly
      setData((d) => ({
        ...d,
        relances: [
          {
            id: `tmp-${Date.now()}`,
            sentAt: new Date().toISOString(),
            scheduledFor: null,
            subject,
            kind: "email_manuel",
            status: "envoye",
            channel: "email",
          },
          ...d.relances,
        ],
      }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setRelanceBusy(false);
    }
  }

  function exportCsv() {
    window.open(`/api/super/lms/suivi/${data.userId}/export?format=csv`, "_blank");
  }
  function exportPdf() {
    window.open(`/api/super/lms/suivi/${data.userId}/export?format=pdf`, "_blank");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-16" style={{ color: TEXT, fontFamily: "Manrope, system-ui, sans-serif" }}>
      <Link href="/super/lms/suivi" className="inline-flex text-[13px] font-semibold text-[#A99BFF] hover:underline">
        ‹ Suivi des apprenants
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white"
            style={{ background: `linear-gradient(135deg, ${VIOLET}, #3A2C9A)` }}
          >
            {data.initials}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-[28px] font-extrabold tracking-tight sm:text-[32px]">
              {data.displayName}
            </h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <Pill>{data.originLabel}</Pill>
              {data.courses.length > 1 ? (
                <select
                  value={courseId}
                  onChange={(e) => {
                    const next = e.target.value;
                    setCourseId(next);
                    router.push(`/super/lms/suivi/${data.userId}?courseId=${encodeURIComponent(next)}`);
                  }}
                  className="rounded-full border px-3 py-1 text-[12px] font-semibold"
                  style={{ borderColor: BORDER, background: CARD, color: TEXT }}
                >
                  {data.courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              ) : (
                <Pill muted>{selectedCourseTitle}</Pill>
              )}
              <Pill color={toneColor(data.activityTone)}>{data.activityLabel}</Pill>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.clientHref ? (
            <Link
              href={data.clientHref}
              className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold"
              style={{ borderColor: BORDER, color: TEXT }}
            >
              Voir la fiche client <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          ) : null}
          <button
            type="button"
            onClick={exportPdf}
            className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold"
            style={{ borderColor: BORDER, color: TEXT }}
          >
            <Download className="h-3.5 w-3.5" /> Relevé PDF
          </button>
          <button
            type="button"
            onClick={() => setRelanceOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white"
            style={{ background: VIOLET }}
          >
            <Bell className="h-3.5 w-3.5" /> Relancer
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Kpi
          label="Progression"
          value={data.chaptersTotal || data.modulesTotal ? `${data.progressPct} %` : "—"}
          valueColor={GREEN}
          sub={
            data.modulesTotal
              ? `${data.modulesDone} module${data.modulesDone > 1 ? "s" : ""} terminé${data.modulesDone > 1 ? "s" : ""} sur ${data.modulesTotal}`
              : "Pas encore de module"
          }
        />
        <Kpi
          label="Chapitres"
          value={
            data.chaptersTotal
              ? `${data.chaptersDone}/${data.chaptersTotal}`
              : data.chaptersDone
                ? String(data.chaptersDone)
                : "—"
          }
          sub={
            data.chaptersTotal
              ? `${data.chaptersDone} effectué${data.chaptersDone > 1 ? "s" : ""}`
              : "Aucun chapitre détecté"
          }
        />
        <Kpi
          label="Sous-chapitres"
          value={
            data.subchaptersTotal
              ? `${data.subchaptersDone}/${data.subchaptersTotal}`
              : data.subchaptersDone
                ? String(data.subchaptersDone)
                : "—"
          }
          sub={
            data.subchaptersTotal
              ? `${data.subchaptersDone} effectué${data.subchaptersDone > 1 ? "s" : ""}`
              : "Aucun sous-chapitre détecté"
          }
        />
        <Kpi
          label="Temps contenu"
          value={
            data.contentSeconds > 0
              ? formatDurationCompact(data.contentSeconds)
              : data.sessionCount
                ? formatDurationCompact(data.activeSeconds)
                : "—"
          }
          sub={
            data.readingSeconds > 0
              ? `dont ${formatDurationCompact(data.readingSeconds)} de lecture`
              : data.sessionCount
                ? `${data.sessionCount} séance${data.sessionCount > 1 ? "s" : ""}`
                : "Pas encore de contenu"
          }
        />
        <Kpi
          label="Temps connecté"
          value={data.sessionCount ? formatDurationCompact(data.connectedSeconds) : "—"}
          sub={
            data.sessionCount
              ? `actif ${formatDurationCompact(data.activeSeconds)} · ${data.activeRatioPct} %`
              : "Pas encore de séance"
          }
        />
        <Kpi
          label="Dernière activité"
          value={
            data.lastActivityAt
              ? fmtDate(data.lastActivityAt, { day: "numeric", month: "short" })
              : "—"
          }
          valueColor={data.activityTone === "red" || (data.inactiveDays ?? 0) >= 14 ? RED : undefined}
          sub={
            data.inactiveDays != null
              ? `il y a ${data.inactiveDays} jour${data.inactiveDays > 1 ? "s" : ""}`
              : "Jamais connecté"
          }
        />
      </div>

      <PedagogyPanel data={data} />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <section className="rounded-[24px] border p-5" style={{ borderColor: BORDER, background: CARD }}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[15px] font-extrabold">Temps actif par semaine</h2>
              {data.weeklyGoalSeconds ? (
                <span
                  className="rounded-full px-3 py-1 text-[11px] font-bold"
                  style={{ background: "#1A2340", color: VIOLET_SOFT }}
                >
                  Objectif conseillé : {formatDurationCompact(data.weeklyGoalSeconds)} / semaine
                </span>
              ) : null}
            </div>
            <div className="mt-6 flex h-40 items-end gap-2 sm:gap-3">
              {data.weekBars.map((b) => {
                const h = b.seconds > 0 ? Math.max(8, Math.round((b.seconds / maxWeek) * 100)) : 4;
                return (
                  <div key={b.weekStartIso} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[11px] font-semibold" style={{ color: b.seconds ? TEXT : TERT }}>
                      {b.display}
                    </span>
                    <div
                      className="w-full max-w-[48px] rounded-t-md"
                      style={{
                        height: `${h}%`,
                        minHeight: b.seconds ? 8 : 4,
                        background: b.seconds ? VIOLET : "#1C2443",
                      }}
                    />
                    <span className="text-center text-[10px] font-medium" style={{ color: TERT }}>
                      {b.label.replace("sem. du ", "")}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[24px] border p-5" style={{ borderColor: BORDER, background: CARD }}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-[15px] font-extrabold">Séances</h2>
                <p className="mt-1 text-[12px]" style={{ color: MUTED }}>
                  {data.sessionCount} séance{data.sessionCount > 1 ? "s" : ""} · horodatées, servent de relevé de
                  connexion Qualiopi
                </p>
              </div>
              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] font-semibold"
                style={{ borderColor: BORDER, color: MUTED }}
              >
                <FileDown className="h-3.5 w-3.5" /> CSV
              </button>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[13px]">
                <thead>
                  <tr style={{ color: TERT }}>
                    <th className="pb-2 font-semibold">Date</th>
                    <th className="pb-2 font-semibold">Connecté</th>
                    <th className="pb-2 font-semibold">Actif</th>
                    <th className="pb-2 font-semibold">Ce qu’il/elle a fait</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleSessions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4" style={{ color: TERT }}>
                        Pas encore de séance
                      </td>
                    </tr>
                  ) : (
                    visibleSessions.map((s) => (
                      <tr key={s.startedAt} className="border-t" style={{ borderColor: BORDER }}>
                        <td className="py-3" style={{ color: MUTED }}>
                          {fmtDate(s.startedAt, { dateStyle: "medium", timeStyle: "short" })}
                          {s.endedAt
                            ? ` – ${fmtDate(s.endedAt, { timeStyle: "short" })}`
                            : ""}
                        </td>
                        <td className="py-3">{formatDurationCompact(s.connectedSeconds)}</td>
                        <td className="py-3 font-semibold" style={{ color: VIOLET_SOFT }}>
                          {formatDurationCompact(s.activeSeconds)}
                        </td>
                        <td className="py-3">
                          <span>{s.label}</span>
                          {s.badge === "onglet_ouvert" ? (
                            <span
                              className="ml-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold"
                              style={{ background: "rgba(242,207,107,0.15)", color: AMBER }}
                            >
                              Onglet ouvert, peu d’activité
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {hiddenCount > 0 && !showAllSessions ? (
              <button
                type="button"
                onClick={() => setShowAllSessions(true)}
                className="mt-3 text-[13px] font-semibold"
                style={{ color: VIOLET_SOFT }}
              >
                Voir les {hiddenCount} séance{hiddenCount > 1 ? "s" : ""} précédente{hiddenCount > 1 ? "s" : ""}
              </button>
            ) : null}
          </section>
        </div>

        <div className="space-y-4">
          {data.anomalies.length > 0 ? (
            <section
              className="rounded-[24px] border p-4"
              style={{ borderColor: "rgba(242,207,107,0.35)", background: "rgba(242,207,107,0.08)" }}
            >
              <p className="text-[14px] font-extrabold" style={{ color: AMBER }}>
                {data.anomalies.length} séance{data.anomalies.length > 1 ? "s" : ""} à vérifier
              </p>
              <p className="mt-2 text-[12px]" style={{ color: MUTED }}>
                Ex. {fmtDate(data.anomalies[0].startedAt, { day: "numeric", month: "short" })} : connecté{" "}
                {formatDurationCompact(data.anomalies[0].connectedSeconds)} mais actif seulement{" "}
                {formatDurationCompact(data.anomalies[0].activeSeconds)}. Le relevé Qualiopi ne retient que le
                temps actif.
              </p>
              <button
                type="button"
                onClick={() => setShowAllSessions(true)}
                className="mt-3 text-[12px] font-semibold"
                style={{ color: AMBER }}
              >
                Voir la séance
              </button>
            </section>
          ) : null}

          <section className="rounded-[24px] border p-5" style={{ borderColor: BORDER, background: CARD }}>
            <h2 className="text-[15px] font-extrabold">Progression par module</h2>
            <p className="mt-1 text-[11px]" style={{ color: TERT }}>
              Score quiz · temps estimé sur le module
            </p>
            <ul className="mt-4 space-y-3">
              {data.modules.length === 0 ? (
                <li className="text-[13px]" style={{ color: TERT }}>
                  Aucun module structuré
                </li>
              ) : (
                data.modules.map((m, i) => (
                  <li key={m.id} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-[13px]">
                      <span className="font-semibold">
                        {i + 1}. {m.title}
                      </span>
                      <span style={{ color: quizColor(m.quizScore) }}>
                        {m.quizScore != null ? `${Math.round(m.quizScore)} %` : "—"}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "#1C2443" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${m.progressPct}%`,
                          background:
                            m.status === "done" ? GREEN : m.status === "current" ? BLUE : TERT,
                        }}
                      />
                    </div>
                    <p className="text-[11px]" style={{ color: m.timeLabel !== "—" ? BLUE : TERT }}>
                      {m.timeLabel !== "—" ? `Temps ≈ ${m.timeLabel}` : "Temps non mesuré"}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="rounded-[24px] border p-5" style={{ borderColor: BORDER, background: CARD }}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[15px] font-extrabold">Relances</h2>
              <label className="flex items-center gap-2 text-[12px] font-semibold" style={{ color: MUTED }}>
                Relance automatique
                <button
                  type="button"
                  disabled={autoBusy}
                  role="switch"
                  aria-checked={data.autoRelanceEnabled}
                  onClick={() => void toggleAuto(!data.autoRelanceEnabled)}
                  className="relative h-6 w-11 rounded-full transition"
                  style={{ background: data.autoRelanceEnabled ? GREEN : "#1C2443" }}
                >
                  <span
                    className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition"
                    style={{ left: data.autoRelanceEnabled ? 22 : 2 }}
                  />
                </button>
              </label>
            </div>
            <ul className="mt-4 space-y-3">
              {data.relances.length === 0 ? (
                <li className="text-[13px]" style={{ color: TERT }}>
                  Aucune relance pour l’instant
                </li>
              ) : (
                data.relances.map((r) => (
                  <li key={r.id} className="flex items-start justify-between gap-2 border-t pt-3 first:border-0 first:pt-0" style={{ borderColor: BORDER }}>
                    <div>
                      <p className="text-[13px] font-semibold">{r.subject}</p>
                      <p className="text-[11px]" style={{ color: TERT }}>
                        {kindLabel(r.kind)} ·{" "}
                        {fmtDate(r.scheduledFor || r.sentAt, { dateStyle: "medium" })}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold" style={{ color: MUTED }}>
                      {statusLabel(r.status)}
                    </span>
                  </li>
                ))
              )}
            </ul>
            <button
              type="button"
              onClick={() => setRelanceOpen(true)}
              className="mt-4 w-full rounded-full border py-2 text-[13px] font-semibold"
              style={{ borderColor: BORDER, color: VIOLET_SOFT }}
            >
              + Relancer
            </button>
          </section>
        </div>
      </div>

      {relanceOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-[24px] border p-5 shadow-xl" style={{ borderColor: BORDER, background: BG }}>
            <h3 className="text-[18px] font-extrabold">Relancer {data.firstName || data.displayName}</h3>
            {!data.isTest ? (
              <p className="mt-2 text-[12px]" style={{ color: AMBER }}>
                Compte hors test : l’e-mail réel est bloqué tant que testOnly est actif. La relance peut être
                journalisée uniquement.
              </p>
            ) : null}
            <label className="mt-4 block text-[12px] font-semibold" style={{ color: MUTED }}>
              Objet
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                style={{ borderColor: BORDER, background: CARD, color: TEXT }}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </label>
            <label className="mt-3 block text-[12px] font-semibold" style={{ color: MUTED }}>
              Message
              <textarea
                rows={7}
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                style={{ borderColor: BORDER, background: CARD, color: TEXT }}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRelanceOpen(false)}
                className="rounded-full border px-4 py-2 text-sm font-semibold"
                style={{ borderColor: BORDER }}
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={relanceBusy}
                onClick={() => void sendRelance()}
                className="rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: VIOLET }}
              >
                {relanceBusy ? "Envoi…" : "Envoyer"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function interviewStyleLabel(style: SuiviLearnerDetail["interviews"][number]["style"]) {
  if (style === "coaching") return "Coaching";
  if (style === "mise_en_situation") return "Mise en situation";
  return "Entretien expérientiel";
}

function leafKindLabel(kind: SuiviLearnerDetail["leafTimes"][number]["kind"]) {
  if (kind === "quiz") return "Quiz";
  if (kind === "jeu") return "Jeu";
  if (kind === "entretien") return "Entretien";
  if (kind === "lecture") return "Lecture";
  return "Contenu";
}

function PedagogyPanel({ data }: { data: SuiviLearnerDetail }) {
  const quizzes = data.quizzes ?? [];
  const interviews = data.interviews ?? [];
  const flashcards = data.flashcards ?? [];
  const leafTimes = data.leafTimes ?? [];
  const readingLeaves = leafTimes.filter((l) => l.kind === "lecture" || l.kind === "autre");

  return (
    <div className="space-y-4">
      <section className="rounded-[24px] border p-5" style={{ borderColor: BORDER, background: CARD }}>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: VIOLET_SOFT }}>
              Lecture pédagogique
            </p>
            <h2 className="mt-1 text-[18px] font-extrabold">Ce que l’apprenant a vraiment produit</h2>
            <p className="mt-1 max-w-2xl text-[13px]" style={{ color: MUTED }}>
              Résultats de quiz, retours d’entretiens, annotations flashcards et temps estimé par
              sous-chapitre (delta entre complétions).
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border p-4" style={{ borderColor: BORDER, background: "#0F162C" }}>
            <h3 className="text-[14px] font-extrabold">Résultats des quiz</h3>
            {quizzes.length === 0 ? (
              <p className="mt-3 text-[13px]" style={{ color: TERT }}>
                Aucun quiz enregistré pour l’instant.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {quizzes.map((q) => (
                  <li key={q.id} className="rounded-xl border px-3 py-2.5" style={{ borderColor: BORDER }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold">{q.title}</p>
                        <p className="mt-0.5 text-[11px]" style={{ color: TERT }}>
                          {q.completedAt
                            ? fmtDate(q.completedAt, { dateStyle: "medium", timeStyle: "short" })
                            : "—"}
                          {q.durationSeconds != null
                            ? ` · ${formatDurationCompact(q.durationSeconds)}`
                            : ""}
                        </p>
                      </div>
                      <span
                        className="shrink-0 rounded-full px-2.5 py-1 text-[12px] font-bold"
                        style={{
                          background: q.percentage != null ? `${quizColor(q.percentage)}22` : "#1C2443",
                          color: quizColor(q.percentage),
                        }}
                      >
                        {q.percentage != null ? `${Math.round(q.percentage)} %` : "Score —"}
                      </span>
                    </div>
                    {q.correctHint ? (
                      <p className="mt-1.5 text-[11px]" style={{ color: MUTED }}>
                        {q.correctHint}
                      </p>
                    ) : null}
                    {q.durationSeconds != null ? (
                      <p className="mt-1 text-[11px]" style={{ color: BLUE }}>
                        Temps de réponse estimé : {formatDurationCompact(q.durationSeconds)}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="rounded-2xl border p-4" style={{ borderColor: BORDER, background: "#0F162C" }}>
            <h3 className="text-[14px] font-extrabold">Entretiens expérientiels</h3>
            {interviews.length === 0 ? (
              <p className="mt-3 text-[13px]" style={{ color: TERT }}>
                Aucun entretien complété.
              </p>
            ) : (
              <ul className="mt-3 space-y-4">
                {interviews.map((iv) => (
                  <li key={iv.id} className="rounded-xl border px-3 py-3" style={{ borderColor: BORDER }}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                        style={{ background: "#1A2340", color: VIOLET_SOFT }}
                      >
                        {interviewStyleLabel(iv.style)}
                      </span>
                      {iv.score != null ? (
                        <span className="text-[12px] font-bold" style={{ color: GREEN }}>
                          Score {iv.score}
                        </span>
                      ) : null}
                      <span className="text-[11px]" style={{ color: TERT }}>
                        {formatDurationCompact(iv.durationSeconds)} ·{" "}
                        {fmtDate(iv.completedAt, { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    </div>
                    <p className="mt-2 text-[13px] font-semibold">
                      {iv.chapterTitle || iv.courseTitle || "Entretien"}
                    </p>
                    {iv.summary ? (
                      <p className="mt-2 text-[12px] leading-relaxed" style={{ color: MUTED }}>
                        {iv.summary}
                      </p>
                    ) : null}
                    {iv.bienDit.length > 0 ? (
                      <div className="mt-3">
                        <p className="text-[11px] font-bold" style={{ color: GREEN }}>
                          Bien dit
                        </p>
                        <ul className="mt-1 space-y-1">
                          {iv.bienDit.map((line) => (
                            <li key={line} className="text-[12px]" style={{ color: MUTED }}>
                              · {line}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {iv.aRevoir.length > 0 || iv.pasCompris.length > 0 ? (
                      <div className="mt-3">
                        <p className="text-[11px] font-bold" style={{ color: AMBER }}>
                          À revoir
                        </p>
                        <ul className="mt-1 space-y-1">
                          {[...iv.aRevoir, ...iv.pasCompris].map((line) => (
                            <li key={line} className="text-[12px]" style={{ color: MUTED }}>
                              · {line}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {iv.axes.length > 0 ? (
                      <div className="mt-3">
                        <p className="text-[11px] font-bold" style={{ color: BLUE }}>
                          Axes d’amélioration
                        </p>
                        <ul className="mt-1 space-y-1">
                          {iv.axes.map((line) => (
                            <li key={line} className="text-[12px]" style={{ color: MUTED }}>
                              · {line}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {iv.compris.length > 0 ? (
                      <div className="mt-3">
                        <p className="text-[11px] font-bold" style={{ color: VIOLET_SOFT }}>
                          Compris
                        </p>
                        <ul className="mt-1 space-y-1">
                          {iv.compris.map((line) => (
                            <li key={line} className="text-[12px]" style={{ color: MUTED }}>
                              · {line}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border p-4" style={{ borderColor: BORDER, background: "#0F162C" }}>
            <h3 className="text-[14px] font-extrabold">Flashcards · annotations</h3>
            {flashcards.length === 0 ? (
              <p className="mt-3 text-[13px]" style={{ color: TERT }}>
                Aucune session flashcards.
              </p>
            ) : (
              <ul className="mt-3 space-y-4">
                {flashcards.map((fc) => (
                  <li key={fc.id} className="rounded-xl border px-3 py-3" style={{ borderColor: BORDER }}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-[13px] font-semibold">{fc.scopeLabel}</p>
                        <p className="text-[11px]" style={{ color: TERT }}>
                          {fc.courseTitle ? `${fc.courseTitle} · ` : ""}
                          {fmtDate(fc.completedAt, { dateStyle: "medium", timeStyle: "short" })} ·{" "}
                          {formatDurationCompact(fc.durationSeconds)}
                        </p>
                      </div>
                      <span
                        className="rounded-full px-2.5 py-1 text-[12px] font-bold"
                        style={{
                          background: `${quizColor(fc.knownPercent)}22`,
                          color: quizColor(fc.knownPercent),
                        }}
                      >
                        {fc.knownCount}/{fc.knownCount + fc.unknownCount} sues · {fc.knownPercent} %
                      </span>
                    </div>
                    {fc.cards.length > 0 ? (
                      <ul className="mt-3 space-y-1.5">
                        {fc.cards.map((card) => (
                          <li
                            key={`${fc.id}-${card.cardId}`}
                            className="flex items-start gap-2 text-[12px]"
                          >
                            <span
                              className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
                              style={{
                                background:
                                  card.result === "known"
                                    ? GREEN
                                    : card.result === "unknown"
                                      ? RED
                                      : TERT,
                              }}
                              title={card.result === "known" ? "Sue" : "À revoir"}
                            />
                            <span style={{ color: card.result === "unknown" ? AMBER : MUTED }}>
                              {card.front}
                              {card.result === "unknown" ? (
                                <span className="ml-1 font-semibold" style={{ color: RED }}>
                                  · à revoir
                                </span>
                              ) : null}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="rounded-2xl border p-4" style={{ borderColor: BORDER, background: "#0F162C" }}>
            <h3 className="text-[14px] font-extrabold">Temps par sous-chapitre</h3>
            <p className="mt-1 text-[11px]" style={{ color: TERT }}>
              Estimation via l’écart entre deux complétions (plafonné à 45 min).
            </p>
            {readingLeaves.length === 0 && leafTimes.length === 0 ? (
              <p className="mt-3 text-[13px]" style={{ color: TERT }}>
                Pas encore de sous-chapitres complétés.
              </p>
            ) : (
              <ul className="mt-3 max-h-[420px] space-y-2 overflow-y-auto pr-1">
                {leafTimes.map((leaf) => (
                  <li
                    key={`${leaf.leafId}-${leaf.completedAt}`}
                    className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2"
                    style={{ borderColor: BORDER }}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold">{leaf.title}</p>
                      <p className="text-[10px]" style={{ color: TERT }}>
                        {leafKindLabel(leaf.kind)} ·{" "}
                        {fmtDate(leaf.completedAt, { dateStyle: "short", timeStyle: "short" })}
                      </p>
                    </div>
                    <span
                      className="shrink-0 text-[12px] font-bold tabular-nums"
                      style={{ color: leaf.durationSeconds != null ? BLUE : TERT }}
                    >
                      {leaf.durationSeconds != null
                        ? formatDurationCompact(leaf.durationSeconds)
                        : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>
      </section>
    </div>
  );
}

function Pill({
  children,
  color,
  muted,
}: {
  children: React.ReactNode;
  color?: string;
  muted?: boolean;
}) {
  return (
    <span
      className="rounded-full px-3 py-1 text-[11px] font-bold"
      style={{
        background: muted ? "#151C33" : color ? `${color}22` : "#151C33",
        color: color || (muted ? MUTED : TEXT),
        border: `1px solid ${BORDER}`,
      }}
    >
      {children}
    </span>
  );
}

function Kpi({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string;
  value: string;
  sub: string;
  valueColor?: string;
}) {
  return (
    <div className="rounded-[20px] border px-4 py-3" style={{ borderColor: BORDER, background: CARD }}>
      <p className="text-[11px] font-semibold" style={{ color: TERT }}>
        {label}
      </p>
      <p className="mt-1 text-[22px] font-extrabold" style={{ color: valueColor || TEXT }}>
        {value}
      </p>
      <p className="mt-1 text-[11px]" style={{ color: MUTED }}>
        {sub}
      </p>
    </div>
  );
}
