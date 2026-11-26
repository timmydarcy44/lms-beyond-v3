import type { SuiviLearnerDetail } from "@/lib/lms/learner-suivi-detail";
import { formatDurationCompact } from "@/lib/lms/lms-metrics";

const BG = "#070A12";
const CARD = "#0E1424";
const CARD_2 = "#121A2E";
const BORDER = "#1C2744";
const TEXT = "#F4F6FB";
const MUTED = "#9AA3BD";
const TERT = "#6C7593";
const ACCENT = "#6E5BFF";
const ACCENT_SOFT = "#C9C2FF";
const BLUE = "#8DB8FF";
const GREEN = "#6BE39B";
const AMBER = "#F2CF6B";
const RED = "#FF8A9B";

function esc(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtDate(iso: string | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!iso) return "—";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    ...opts,
  }).format(new Date(t));
}

function fmtDateTime(iso: string | null | undefined): string {
  return fmtDate(iso, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toneColor(tone: SuiviLearnerDetail["activityTone"]): string {
  if (tone === "green") return GREEN;
  if (tone === "amber") return AMBER;
  if (tone === "red") return RED;
  return TERT;
}

function quizColor(score: number | null): string {
  if (score == null) return TERT;
  if (score >= 80) return GREEN;
  if (score >= 50) return AMBER;
  return RED;
}

function kpi(label: string, value: string, sub?: string) {
  return `<div class="kpi">
    <div class="kpi-label">${esc(label)}</div>
    <div class="kpi-value">${esc(value)}</div>
    ${sub ? `<div class="kpi-sub">${esc(sub)}</div>` : ""}
  </div>`;
}

function section(title: string, body: string, subtitle?: string) {
  return `<section class="card">
    <div class="card-head">
      <h2>${esc(title)}</h2>
      ${subtitle ? `<p class="card-sub">${esc(subtitle)}</p>` : ""}
    </div>
    ${body}
  </section>`;
}

function emptyRow(label: string) {
  return `<p class="empty">${esc(label)}</p>`;
}

/**
 * Relevé de suivi LMS — HTML imprimable, design type Revolut / Byound Control.
 * Ouvre via window.print() ; contient l’ensemble des indicateurs de la fiche.
 */
export function buildSuiviReleveHtml(detail: SuiviLearnerDetail, generatedAtIso: string): string {
  const periodLabel = detail.firstSessionAt
    ? `${fmtDate(detail.firstSessionAt, { day: "numeric", month: "short", year: "numeric" })} → ${fmtDate(generatedAtIso, { day: "numeric", month: "short", year: "numeric" })}`
    : "Aucune séance";

  const maxWeek = Math.max(1, ...detail.weekBars.map((b) => b.seconds));
  const weekBars = detail.weekBars
    .map((b) => {
      const h = b.seconds > 0 ? Math.max(8, Math.round((b.seconds / maxWeek) * 88)) : 4;
      return `<div class="bar-col">
        <div class="bar-val">${esc(b.display)}</div>
        <div class="bar" style="height:${h}px;background:${b.seconds ? ACCENT : BORDER}"></div>
        <div class="bar-label">${esc(b.label.replace("sem. du ", ""))}</div>
      </div>`;
    })
    .join("");

  const sessionsRows =
    detail.sessions.length === 0
      ? `<tr><td colspan="5" class="empty-cell">Aucune séance enregistrée</td></tr>`
      : detail.sessions
          .map((s) => {
            const badge =
              s.badge === "onglet_ouvert"
                ? `<span class="pill pill-amber">Onglet ouvert</span>`
                : "";
            return `<tr>
              <td>${esc(fmtDateTime(s.startedAt))}</td>
              <td class="num">${esc(formatDurationCompact(s.connectedSeconds))}</td>
              <td class="num">${esc(formatDurationCompact(s.activeSeconds))}</td>
              <td>${esc(s.label)} ${badge}</td>
              <td class="muted">${esc(s.endedAt ? fmtDateTime(s.endedAt) : "—")}</td>
            </tr>`;
          })
          .join("");

  const modulesBody =
    detail.modules.length === 0
      ? emptyRow("Aucun module structuré")
      : `<div class="mod-list">${detail.modules
          .map((m, i) => {
            const statusColor =
              m.status === "done" ? GREEN : m.status === "current" ? BLUE : TERT;
            const statusLabel =
              m.status === "done" ? "Terminé" : m.status === "current" ? "En cours" : "À faire";
            return `<div class="mod-row">
              <div class="mod-top">
                <span class="mod-title">${i + 1}. ${esc(m.title)}</span>
                <span style="color:${quizColor(m.quizScore)}">${m.quizScore != null ? `${Math.round(m.quizScore)} %` : "—"}</span>
              </div>
              <div class="progress"><div class="progress-fill" style="width:${Math.min(100, m.progressPct)}%;background:${statusColor}"></div></div>
              <div class="mod-meta">
                <span style="color:${statusColor}">${esc(statusLabel)}</span>
                <span>${m.timeLabel !== "—" ? `Temps ≈ ${esc(m.timeLabel)}` : "Temps non mesuré"}</span>
              </div>
            </div>`;
          })
          .join("")}</div>`;

  const quizzesBody =
    detail.quizzes.length === 0
      ? emptyRow("Aucun quiz")
      : `<table class="data"><thead><tr><th>Date</th><th>Quiz</th><th>Score</th><th>Durée</th></tr></thead><tbody>${detail.quizzes
          .slice(0, 40)
          .map((q) => {
            const score =
              q.percentage != null
                ? `${Math.round(q.percentage)} %`
                : q.score != null
                  ? q.maxScore != null
                    ? `${q.score}/${q.maxScore}`
                    : String(q.score)
                  : "—";
            return `<tr>
              <td>${esc(fmtDateTime(q.completedAt))}</td>
              <td>${esc(q.title)}</td>
              <td class="num" style="color:${quizColor(q.percentage ?? q.score)}">${esc(score)}</td>
              <td class="num">${q.durationSeconds != null ? esc(formatDurationCompact(q.durationSeconds)) : "—"}</td>
            </tr>`;
          })
          .join("")}</tbody></table>`;

  const interviewsBody =
    detail.interviews.length === 0
      ? emptyRow("Aucun entretien")
      : `<table class="data"><thead><tr><th>Date</th><th>Chapitre</th><th>Style</th><th>Score</th><th>Durée</th></tr></thead><tbody>${detail.interviews
          .slice(0, 30)
          .map((row) => {
            const pass =
              row.passed === true ? "Réussi" : row.passed === false ? "À revoir" : "—";
            return `<tr>
              <td>${esc(fmtDateTime(row.completedAt))}</td>
              <td>${esc(row.chapterTitle || row.courseTitle || "Entretien")}</td>
              <td>${esc(row.style)}</td>
              <td class="num">${row.score != null ? esc(`${Math.round(row.score)} % · ${pass}`) : esc(pass)}</td>
              <td class="num">${esc(formatDurationCompact(row.durationSeconds))}</td>
            </tr>`;
          })
          .join("")}</tbody></table>`;

  const gamesBody =
    detail.games.length === 0
      ? emptyRow("Aucun jeu")
      : `<table class="data"><thead><tr><th>Date</th><th>Jeu</th><th>Résultat</th><th>Durée</th></tr></thead><tbody>${detail.games
          .slice(0, 30)
          .map((g) => {
            const result =
              g.score != null
                ? `${Math.round(g.score)}${g.passed == null ? "" : g.passed ? " · réussi" : " · échoué"}`
                : g.passed == null
                  ? "—"
                  : g.passed
                    ? "Réussi"
                    : "Échoué";
            return `<tr>
              <td>${esc(fmtDateTime(g.completedAt))}</td>
              <td>${esc(g.title)}</td>
              <td class="num">${esc(result)}</td>
              <td class="num">${g.durationSeconds != null ? esc(formatDurationCompact(g.durationSeconds)) : "—"}</td>
            </tr>`;
          })
          .join("")}</tbody></table>`;

  const flashBody =
    detail.flashcards.length === 0
      ? emptyRow("Aucune session flashcards")
      : `<table class="data"><thead><tr><th>Date</th><th>Scope</th><th>Maîtrisées</th><th>Durée</th></tr></thead><tbody>${detail.flashcards
          .slice(0, 30)
          .map(
            (f) => `<tr>
              <td>${esc(fmtDateTime(f.completedAt))}</td>
              <td>${esc(f.scopeLabel)}${f.courseTitle ? ` · ${esc(f.courseTitle)}` : ""}</td>
              <td class="num">${esc(`${f.knownCount}/${f.totalCards} (${f.knownPercent} %)`)}</td>
              <td class="num">${esc(formatDurationCompact(f.durationSeconds))}</td>
            </tr>`,
          )
          .join("")}</tbody></table>`;

  const leavesBody =
    detail.leafTimes.length === 0
      ? emptyRow("Aucune feuille validée")
      : `<table class="data"><thead><tr><th>Date</th><th>Contenu</th><th>Type</th><th>Temps estimé</th></tr></thead><tbody>${detail.leafTimes
          .slice(0, 50)
          .map(
            (l) => `<tr>
              <td>${esc(fmtDateTime(l.completedAt))}</td>
              <td>${esc(l.title)}</td>
              <td>${esc(l.kind)}</td>
              <td class="num">${l.durationSeconds != null ? esc(formatDurationCompact(l.durationSeconds)) : "—"}</td>
            </tr>`,
          )
          .join("")}</tbody></table>`;

  const relancesBody =
    detail.relances.length === 0
      ? emptyRow("Aucune relance")
      : `<table class="data"><thead><tr><th>Date</th><th>Sujet</th><th>Type</th><th>Statut</th></tr></thead><tbody>${detail.relances
          .slice(0, 30)
          .map((r) => {
            const when = r.sentAt || r.scheduledFor;
            return `<tr>
              <td>${esc(fmtDateTime(when))}</td>
              <td>${esc(r.subject)}</td>
              <td>${esc(r.kind)}${r.channel ? ` · ${esc(r.channel)}` : ""}</td>
              <td>${esc(r.status)}</td>
            </tr>`;
          })
          .join("")}</tbody></table>`;

  const anomaliesBody =
    detail.anomalies.length === 0
      ? ""
      : section(
          "Anomalies",
          `<p class="note">Séances signalées (onglet ouvert / faible activité). Le relevé Qualiopi retient le temps actif.</p>
          <table class="data"><thead><tr><th>Date</th><th>Connecté</th><th>Actif</th><th>Signal</th></tr></thead><tbody>${detail.anomalies
            .map(
              (s) => `<tr>
                <td>${esc(fmtDateTime(s.startedAt))}</td>
                <td class="num">${esc(formatDurationCompact(s.connectedSeconds))}</td>
                <td class="num">${esc(formatDurationCompact(s.activeSeconds))}</td>
                <td><span class="pill pill-amber">${esc(s.badge === "onglet_ouvert" ? "Onglet ouvert" : "Anomalie")}</span></td>
              </tr>`,
            )
            .join("")}</tbody></table>`,
        );

  const contentValue =
    detail.contentSeconds > 0
      ? formatDurationCompact(detail.contentSeconds)
      : detail.sessionCount
        ? formatDurationCompact(detail.activeSeconds)
        : "—";
  const contentSub =
    detail.readingSeconds > 0
      ? `dont ${formatDurationCompact(detail.readingSeconds)} de lecture`
      : detail.sessionCount
        ? `${detail.sessionCount} séance${detail.sessionCount > 1 ? "s" : ""}`
        : "Pas encore de contenu";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Relevé LMS — ${esc(detail.displayName)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet"/>
  <style>
    :root {
      color-scheme: dark;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 28px 24px 48px;
      background: ${BG};
      color: ${TEXT};
      font-family: Manrope, ui-sans-serif, system-ui, -apple-system, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet {
      max-width: 920px;
      margin: 0 auto;
    }
    .hero {
      position: relative;
      overflow: hidden;
      border-radius: 28px;
      padding: 28px 28px 24px;
      background:
        radial-gradient(120% 80% at 0% 0%, rgba(110,91,255,.35), transparent 55%),
        radial-gradient(90% 70% at 100% 0%, rgba(141,184,255,.18), transparent 50%),
        linear-gradient(160deg, #121933 0%, ${BG} 70%);
      border: 1px solid ${BORDER};
      margin-bottom: 18px;
    }
    .brand {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 22px;
    }
    .brand-mark {
      font-size: 13px;
      font-weight: 800;
      letter-spacing: .14em;
      text-transform: uppercase;
      color: ${ACCENT_SOFT};
    }
    .brand-meta {
      font-size: 11px;
      font-weight: 600;
      color: ${MUTED};
      text-align: right;
    }
    .hero-grid {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 16px;
      align-items: start;
    }
    .avatar {
      width: 56px;
      height: 56px;
      border-radius: 999px;
      display: grid;
      place-items: center;
      font-weight: 800;
      font-size: 16px;
      color: white;
      background: linear-gradient(135deg, ${ACCENT}, #3A2C9A);
    }
    h1 {
      margin: 0;
      font-size: 30px;
      line-height: 1.1;
      font-weight: 800;
      letter-spacing: -0.03em;
    }
    .pills {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 5px 11px;
      font-size: 11px;
      font-weight: 700;
      border: 1px solid ${BORDER};
      background: rgba(255,255,255,.04);
      color: ${TEXT};
    }
    .pill-amber { color: ${AMBER}; border-color: rgba(242,207,107,.35); background: rgba(242,207,107,.08); }
    .pill-soft { color: ${MUTED}; }
    .hero-stats {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      margin-top: 22px;
    }
    .hero-stat {
      border-radius: 18px;
      padding: 14px 14px 12px;
      background: rgba(7,10,18,.45);
      border: 1px solid rgba(255,255,255,.06);
    }
    .hero-stat .l { font-size: 11px; font-weight: 700; color: ${MUTED}; text-transform: uppercase; letter-spacing: .06em; }
    .hero-stat .v { margin-top: 6px; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
    .hero-stat .s { margin-top: 4px; font-size: 12px; color: ${TERT}; font-weight: 600; }
    .kpis {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
      margin-bottom: 14px;
    }
    .kpi {
      border-radius: 20px;
      padding: 14px;
      background: ${CARD};
      border: 1px solid ${BORDER};
      min-height: 92px;
    }
    .kpi-label {
      font-size: 11px;
      font-weight: 700;
      color: ${MUTED};
      text-transform: uppercase;
      letter-spacing: .05em;
    }
    .kpi-value {
      margin-top: 8px;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.03em;
    }
    .kpi-sub {
      margin-top: 4px;
      font-size: 12px;
      color: ${TERT};
      font-weight: 600;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1.35fr .9fr;
      gap: 12px;
      margin-bottom: 12px;
    }
    .card {
      border-radius: 24px;
      padding: 18px 18px 16px;
      background: ${CARD};
      border: 1px solid ${BORDER};
      margin-bottom: 12px;
      break-inside: avoid;
    }
    .card-head h2 {
      margin: 0;
      font-size: 15px;
      font-weight: 800;
      letter-spacing: -0.01em;
    }
    .card-sub {
      margin: 4px 0 0;
      font-size: 12px;
      color: ${MUTED};
      font-weight: 600;
    }
    .bars {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      height: 120px;
      margin-top: 18px;
      padding-top: 8px;
    }
    .bar-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      min-width: 0;
    }
    .bar {
      width: 100%;
      max-width: 36px;
      border-radius: 8px 8px 4px 4px;
    }
    .bar-val {
      font-size: 10px;
      font-weight: 700;
      color: ${TEXT};
    }
    .bar-label {
      font-size: 9px;
      font-weight: 600;
      color: ${TERT};
      text-align: center;
      line-height: 1.2;
    }
    table.data {
      width: 100%;
      border-collapse: collapse;
      margin-top: 14px;
      font-size: 12px;
    }
    table.data th {
      text-align: left;
      color: ${MUTED};
      font-weight: 700;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: .05em;
      padding: 0 8px 10px 0;
      border-bottom: 1px solid ${BORDER};
    }
    table.data td {
      padding: 10px 8px 10px 0;
      border-bottom: 1px solid rgba(28,39,68,.85);
      vertical-align: top;
      font-weight: 600;
    }
    table.data tr:last-child td { border-bottom: none; }
    td.num { font-variant-numeric: tabular-nums; white-space: nowrap; }
    td.muted, .muted { color: ${MUTED}; }
    .empty, .empty-cell {
      margin: 14px 0 0;
      color: ${TERT};
      font-size: 13px;
      font-weight: 600;
    }
    .mod-list { margin-top: 14px; display: grid; gap: 12px; }
    .mod-top { display: flex; justify-content: space-between; gap: 8px; font-size: 13px; font-weight: 700; }
    .mod-title { min-width: 0; }
    .progress {
      margin-top: 6px;
      height: 6px;
      border-radius: 999px;
      background: ${CARD_2};
      overflow: hidden;
    }
    .progress-fill { height: 100%; border-radius: 999px; }
    .mod-meta {
      margin-top: 6px;
      display: flex;
      justify-content: space-between;
      gap: 8px;
      font-size: 11px;
      font-weight: 650;
      color: ${TERT};
    }
    .note {
      margin: 12px 0 0;
      font-size: 12px;
      color: ${MUTED};
      font-weight: 600;
      line-height: 1.45;
    }
    .foot {
      margin-top: 18px;
      padding: 16px 18px;
      border-radius: 20px;
      border: 1px dashed ${BORDER};
      color: ${MUTED};
      font-size: 11px;
      font-weight: 600;
      line-height: 1.5;
    }
    .print-bar {
      position: sticky;
      top: 0;
      z-index: 20;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin: -8px 0 16px;
      padding: 8px 0;
      background: linear-gradient(${BG}, rgba(7,10,18,.92));
    }
    .btn {
      appearance: none;
      border: 1px solid ${BORDER};
      background: ${CARD};
      color: ${TEXT};
      border-radius: 999px;
      padding: 10px 16px;
      font: inherit;
      font-size: 13px;
      font-weight: 750;
      cursor: pointer;
    }
    .btn-primary {
      background: ${ACCENT};
      border-color: ${ACCENT};
      color: white;
    }
    @media print {
      body { padding: 0; background: ${BG}; }
      .print-bar { display: none !important; }
      .sheet { max-width: none; }
      .card, .hero, .kpi { break-inside: avoid; }
      a { color: inherit; text-decoration: none; }
    }
    @media (max-width: 820px) {
      .kpis, .hero-stats, .grid-2 { grid-template-columns: 1fr 1fr; }
      .hero-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 560px) {
      .kpis, .hero-stats, .grid-2 { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="print-bar">
      <button type="button" class="btn" onclick="window.close()">Fermer</button>
      <button type="button" class="btn btn-primary" onclick="window.print()">Imprimer / PDF</button>
    </div>

    <header class="hero">
      <div class="brand">
        <div class="brand-mark">Byound Control</div>
        <div class="brand-meta">
          Relevé LMS · Qualiopi<br/>
          Généré le ${esc(fmtDateTime(generatedAtIso))}
        </div>
      </div>
      <div class="hero-grid">
        <div class="avatar">${esc(detail.initials)}</div>
        <div>
          <h1>${esc(detail.displayName)}</h1>
          <div class="pills">
            <span class="pill">${esc(detail.originLabel)}</span>
            <span class="pill pill-soft">${esc(detail.courseTitle || "Sans formation")}</span>
            <span class="pill" style="color:${toneColor(detail.activityTone)}">${esc(detail.activityLabel)}</span>
            ${detail.isTest ? `<span class="pill pill-amber">Compte test</span>` : ""}
          </div>
        </div>
      </div>
      <div class="hero-stats">
        <div class="hero-stat">
          <div class="l">Temps actif</div>
          <div class="v">${esc(detail.sessionCount ? formatDurationCompact(detail.activeSeconds) : "—")}</div>
          <div class="s">${esc(detail.activeRatioPct)} % du connecté · retenu Qualiopi</div>
        </div>
        <div class="hero-stat">
          <div class="l">Temps connecté</div>
          <div class="v">${esc(detail.sessionCount ? formatDurationCompact(detail.connectedSeconds) : "—")}</div>
          <div class="s">${esc(String(detail.sessionCount))} séance${detail.sessionCount > 1 ? "s" : ""} · moy. ${esc(formatDurationCompact(detail.avgConnectedPerSession))}</div>
        </div>
        <div class="hero-stat">
          <div class="l">Progression</div>
          <div class="v">${esc(`${detail.progressPct} %`)}</div>
          <div class="s">${esc(String(detail.chaptersDone))}/${esc(String(detail.chaptersTotal))} chapitres · période ${esc(periodLabel)}</div>
        </div>
      </div>
    </header>

    <div class="kpis">
      ${kpi("Modules", detail.modulesTotal ? `${detail.modulesDone}/${detail.modulesTotal}` : String(detail.modulesDone), detail.modulesDone ? `${detail.modulesDone} terminé${detail.modulesDone > 1 ? "s" : ""}` : "Aucun module terminé")}
      ${kpi("Chapitres", detail.chaptersTotal ? `${detail.chaptersDone}/${detail.chaptersTotal}` : detail.chaptersDone ? String(detail.chaptersDone) : "—", detail.chaptersTotal ? `${detail.chaptersDone} effectué${detail.chaptersDone > 1 ? "s" : ""}` : undefined)}
      ${kpi("Sous-chapitres", detail.subchaptersTotal ? `${detail.subchaptersDone}/${detail.subchaptersTotal}` : detail.subchaptersDone ? String(detail.subchaptersDone) : "—", detail.subchaptersTotal ? `${detail.subchaptersDone} effectué${detail.subchaptersDone > 1 ? "s" : ""}` : undefined)}
      ${kpi("Temps contenu", contentValue, contentSub)}
      ${kpi("Dernière activité", fmtDate(detail.lastActivityAt, { day: "numeric", month: "short" }), detail.inactiveDays != null ? `il y a ${detail.inactiveDays} jour${detail.inactiveDays > 1 ? "s" : ""}` : "Jamais connecté")}
      ${kpi("E-mail", detail.email || "—", detail.originKind)}
      ${kpi("Objectif / sem.", detail.weeklyGoalSeconds ? formatDurationCompact(detail.weeklyGoalSeconds) : "—", detail.accessWeeks ? `${detail.accessWeeks} sem. d’accès` : "Non défini")}
      ${kpi("Planifié total", detail.plannedTotalSeconds ? formatDurationCompact(detail.plannedTotalSeconds) : "—", "Durée estimée formation")}
    </div>

    <div class="grid-2">
      ${section(
        "Temps actif par semaine",
        `<div class="bars">${weekBars}</div>`,
        detail.weeklyGoalSeconds
          ? `Objectif conseillé : ${formatDurationCompact(detail.weeklyGoalSeconds)} / semaine`
          : "8 dernières semaines",
      )}
      ${section("Progression par module", modulesBody, "Score quiz · temps estimé")}
    </div>

    ${section(
      "Séances",
      `<table class="data">
        <thead><tr><th>Début</th><th>Connecté</th><th>Actif</th><th>Activité</th><th>Fin</th></tr></thead>
        <tbody>${sessionsRows}</tbody>
      </table>`,
      `${detail.sessionCount} séance${detail.sessionCount > 1 ? "s" : ""} · relevé de connexion Qualiopi (temps actif)`,
    )}

    ${anomaliesBody}

    ${section("Feuilles validées", leavesBody, "Temps estimé plafonné au temps actif mesuré")}
    ${section("Quiz", quizzesBody)}
    ${section("Entretiens / mises en situation", interviewsBody)}
    ${section("Jeux", gamesBody)}
    ${section("Flashcards", flashBody)}
    ${section(
      "Relances",
      relancesBody,
      detail.autoRelanceEnabled ? "Relance automatique activée" : "Relance automatique désactivée",
    )}

    <footer class="foot">
      Organisme Byound · Apprenant ${esc(detail.displayName)} (${esc(detail.email)}) · Formation ${esc(detail.courseTitle || "—")}.<br/>
      Temps retenu pour le suivi distanciel Qualiopi : <strong style="color:${TEXT}">${esc(formatDurationCompact(detail.activeSeconds))}</strong> actifs
      sur ${esc(formatDurationCompact(detail.connectedSeconds))} connectés
      (${esc(String(detail.activeRatioPct))} %).<br/>
      Document généré le ${esc(fmtDateTime(generatedAtIso))} — signature système Byound Control. Imprimer → Enregistrer en PDF.
    </footer>
  </div>
  <script>
    window.addEventListener("load", () => {
      const auto = new URLSearchParams(location.search).get("autoprint");
      if (auto === "1") setTimeout(() => window.print(), 350);
    });
  </script>
</body>
</html>`;
}
