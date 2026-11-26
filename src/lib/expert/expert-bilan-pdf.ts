import type { EmployeeTestResults } from "@/lib/entreprise/employee-profile-diagnostics";
import { hasAnyTestResults } from "@/lib/entreprise/employee-profile-diagnostics";
import {
  parseExpertRegistrationMeta,
  type AdminExpertRow,
} from "@/lib/expert/admin-expert-types";
import { computeExpertKpis, getExpertDomains } from "@/lib/expert/expert-crm-utils";
import { formatDiscProfileSentence, normalizeDiscScores } from "@/lib/disc/disc-profile-label";
import {
  AXES_LABELS,
  IDMC_AXIS_KEYS,
  resolveIdmcAxisMasteryLevel,
} from "@/lib/idmc/idmc-display";
import { softSkillMasteryPercent } from "@/lib/soft-skills/resolve-soft-skills-result";
import { expertReviewStatusLabel } from "@/lib/expert/expert-access";

const BG = "#070A12";
const CARD = "#0E1424";
const BORDER = "#1C2744";
const TEXT = "#F4F6FB";
const MUTED = "#9AA3BD";
const TERT = "#6C7593";
const ACCENT = "#6E5BFF";
const ACCENT_SOFT = "#C9C2FF";
const TEAL = "#5EDCC3";
const GOLD = "#F5C85C";
const GREEN = "#6BE39B";

const DISC_CRM_LABELS: Record<"D" | "I" | "S" | "C", string> = {
  D: "Décisionnel",
  I: "Relationnel",
  S: "Stable",
  C: "Structuré",
};

export type ExpertBilanPdfInput = {
  expert: AdminExpertRow;
  results: EmployeeTestResults;
  generatedAtIso: string;
};

function esc(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtDay(iso: string | null | undefined): string {
  if (!iso) return "—";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  }).format(new Date(t));
}

function fmtDateTime(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(new Date(t));
}

function displayName(expert: AdminExpertRow): string {
  const name = [expert.first_name, expert.last_name].filter(Boolean).join(" ").trim();
  return name || expert.email || "Expert";
}

function initials(expert: AdminExpertRow): string {
  const a = String(expert.first_name ?? "").trim()[0] ?? "";
  const b = String(expert.last_name ?? "").trim()[0] ?? "";
  const pair = `${a}${b}`.toUpperCase();
  if (pair) return pair;
  return displayName(expert).slice(0, 2).toUpperCase();
}

function bar(pct: number, color: string) {
  const width = Math.max(4, Math.min(100, Math.round(pct)));
  return `<div class="bar"><div class="bar-fill" style="width:${width}%;background:${color}"></div></div>`;
}

function kpi(label: string, value: string, sub?: string) {
  return `<div class="kpi">
    <div class="kpi-label">${esc(label)}</div>
    <div class="kpi-value">${esc(value)}</div>
    ${sub ? `<div class="kpi-sub">${esc(sub)}</div>` : ""}
  </div>`;
}

function section(title: string, body: string, subtitle?: string, accent = ACCENT) {
  return `<section class="card">
    <div class="card-head">
      <div class="card-accent" style="background:${accent}"></div>
      <div>
        <h2>${esc(title)}</h2>
        ${subtitle ? `<p class="card-sub">${esc(subtitle)}</p>` : ""}
      </div>
    </div>
    ${body}
  </section>`;
}

/**
 * Rapport bilans expert — HTML imprimable, design Revolut / Byound Control.
 * Inclut DISC (4), IDMC (8 axes), soft skills (toutes), KPIs fiche.
 */
export function buildExpertBilanHtml(input: ExpertBilanPdfInput): string {
  const { expert, results, generatedAtIso } = input;
  const meta = parseExpertRegistrationMeta(expert.references);
  const kpis = computeExpertKpis(expert, meta);
  const domains = getExpertDomains(meta, expert);
  const name = displayName(expert);
  const specialtyList = [
    ...(expert.specialties ?? []),
    ...domains,
  ].filter(Boolean);
  const uniqueSpecs = [...new Set(specialtyList.map(String))];

  const disc = results.disc;
  const discEntries = disc
    ? (["D", "I", "S", "C"] as const)
        .map((key) => ({ key, score: Number(disc[key] ?? 0), label: DISC_CRM_LABELS[key] }))
        .sort((a, b) => b.score - a.score)
    : [];
  const discSentence = disc
    ? formatDiscProfileSentence(normalizeDiscScores(disc))
    : null;

  const axes = IDMC_AXIS_KEYS.map((key) => {
    const score = Math.round(Number(results.idmc_axes?.[key] ?? 0));
    return {
      key,
      label: AXES_LABELS[key],
      score,
      mastery: resolveIdmcAxisMasteryLevel(score),
    };
  }).sort((a, b) => b.score - a.score);

  const soft = [...results.soft_skills].sort((a, b) => b.score - a.score);
  const softAvg =
    soft.length > 0
      ? Math.round(
          soft.reduce((s, item) => s + softSkillMasteryPercent(item.score), 0) / soft.length,
        )
      : null;

  const testsDone =
    (disc ? 1 : 0) +
    (results.idmc_score != null || axes.some((a) => a.score > 0) ? 1 : 0) +
    (soft.length > 0 ? 1 : 0);

  const statusLabel = expertReviewStatusLabel(expert.review_status);
  const hasTests = hasAnyTestResults(results);

  const discBody = !disc
    ? `<p class="empty">DISC non passé</p>`
    : `<p class="lead">${esc(discSentence ?? "")}</p>
      <div class="metric-list">
        ${discEntries
          .map(
            (item) => `<div class="metric-row">
              <div class="metric-top">
                <span class="metric-title">${esc(item.key)} · ${esc(item.label)}</span>
                <span class="metric-score" style="color:${ACCENT_SOFT}">${esc(Math.round(item.score))}</span>
              </div>
              ${bar(item.score, ACCENT)}
            </div>`,
          )
          .join("")}
      </div>
      <p class="note">Passé le ${esc(fmtDay(results.disc_at))}</p>`;

  const idmcBody =
    !results.idmc_axes || axes.every((a) => a.score <= 0)
      ? `<p class="empty">IDMC non passé</p>`
      : `<div class="metric-list">
        ${axes
          .map(
            (axis) => `<div class="metric-row">
              <div class="metric-top">
                <span class="metric-title">${esc(axis.key)} · ${esc(axis.label)}</span>
                <span class="metric-score" style="color:${TEAL}">${esc(axis.score)} · ${esc(axis.mastery.replace(/^Maîtrise\s+/i, ""))}</span>
              </div>
              ${bar(axis.score, TEAL)}
            </div>`,
          )
          .join("")}
      </div>
      <p class="note">Score global ${esc(results.idmc_score != null ? String(Math.round(results.idmc_score)) : "—")} · Passé le ${esc(fmtDay(results.idmc_at))}</p>`;

  const softBody =
    soft.length === 0
      ? `<p class="empty">Soft skills non passés</p>`
      : `<div class="metric-list">
        ${soft
          .map((item) => {
            const pct = softSkillMasteryPercent(item.score);
            return `<div class="metric-row">
              <div class="metric-top">
                <span class="metric-title">${esc(item.skill)}</span>
                <span class="metric-score" style="color:${GOLD}">${esc(Math.round(item.score))}/15 · ${esc(pct)} %</span>
              </div>
              ${bar(pct, GOLD)}
            </div>`;
          })
          .join("")}
      </div>
      <p class="note">${esc(String(soft.length))} compétence${soft.length > 1 ? "s" : ""} · moyenne ${esc(softAvg != null ? `${softAvg} %` : "—")} · Passé le ${esc(fmtDay(results.soft_skills_at))}</p>`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Bilans expert — ${esc(name)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet"/>
  <style>
    :root { color-scheme: dark; }
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
    .sheet { max-width: 920px; margin: 0 auto; }
    .print-bar {
      position: sticky; top: 0; z-index: 20;
      display: flex; justify-content: flex-end; gap: 8px;
      margin: -8px 0 16px; padding: 8px 0;
      background: linear-gradient(${BG}, rgba(7,10,18,.92));
    }
    .btn {
      appearance: none; border: 1px solid ${BORDER}; background: ${CARD};
      color: ${TEXT}; border-radius: 999px; padding: 10px 16px;
      font: inherit; font-size: 13px; font-weight: 750; cursor: pointer;
    }
    .btn-primary { background: ${ACCENT}; border-color: ${ACCENT}; color: #fff; }
    .hero {
      position: relative; overflow: hidden; border-radius: 28px;
      padding: 28px; margin-bottom: 14px;
      border: 1px solid ${BORDER};
      background:
        radial-gradient(120% 80% at 0% 0%, rgba(110,91,255,.38), transparent 55%),
        radial-gradient(90% 70% at 100% 0%, rgba(94,220,195,.16), transparent 50%),
        linear-gradient(160deg, #121933 0%, ${BG} 72%);
    }
    .brand {
      display: flex; justify-content: space-between; gap: 12px; margin-bottom: 20px;
    }
    .brand-mark {
      font-size: 13px; font-weight: 800; letter-spacing: .14em;
      text-transform: uppercase; color: ${ACCENT_SOFT};
    }
    .brand-meta { font-size: 11px; font-weight: 600; color: ${MUTED}; text-align: right; }
    .hero-grid { display: grid; grid-template-columns: auto 1fr; gap: 16px; align-items: start; }
    .avatar {
      width: 58px; height: 58px; border-radius: 999px; display: grid; place-items: center;
      font-weight: 800; font-size: 16px; color: #fff;
      background: linear-gradient(135deg, ${ACCENT}, #3A2C9A);
    }
    h1 { margin: 0; font-size: 30px; line-height: 1.1; font-weight: 800; letter-spacing: -0.03em; }
    .headline { margin-top: 8px; font-size: 14px; font-weight: 650; color: ${MUTED}; }
    .pills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
    .pill {
      display: inline-flex; align-items: center; border-radius: 999px;
      padding: 5px 11px; font-size: 11px; font-weight: 700;
      border: 1px solid ${BORDER}; background: rgba(255,255,255,.04); color: ${TEXT};
    }
    .pill-soft { color: ${MUTED}; }
    .pill-ok { color: ${GREEN}; border-color: rgba(107,227,155,.3); background: rgba(107,227,155,.08); }
    .hero-stats {
      display: grid; grid-template-columns: repeat(3, minmax(0,1fr));
      gap: 10px; margin-top: 22px;
    }
    .hero-stat {
      border-radius: 18px; padding: 14px;
      background: rgba(7,10,18,.45); border: 1px solid rgba(255,255,255,.06);
    }
    .hero-stat .l { font-size: 11px; font-weight: 700; color: ${MUTED}; text-transform: uppercase; letter-spacing: .06em; }
    .hero-stat .v { margin-top: 6px; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
    .hero-stat .s { margin-top: 4px; font-size: 12px; color: ${TERT}; font-weight: 600; }
    .kpis {
      display: grid; grid-template-columns: repeat(4, minmax(0,1fr));
      gap: 10px; margin-bottom: 12px;
    }
    .kpi {
      border-radius: 20px; padding: 14px; min-height: 92px;
      background: ${CARD}; border: 1px solid ${BORDER};
    }
    .kpi-label { font-size: 11px; font-weight: 700; color: ${MUTED}; text-transform: uppercase; letter-spacing: .05em; }
    .kpi-value { margin-top: 8px; font-size: 22px; font-weight: 800; letter-spacing: -0.03em; }
    .kpi-sub { margin-top: 4px; font-size: 12px; color: ${TERT}; font-weight: 600; }
    .grid-3 {
      display: grid; grid-template-columns: repeat(3, minmax(0,1fr));
      gap: 12px; margin-bottom: 12px;
    }
    .card {
      border-radius: 24px; padding: 18px; margin-bottom: 12px;
      background: ${CARD}; border: 1px solid ${BORDER}; break-inside: avoid;
    }
    .card-head { display: flex; gap: 12px; align-items: flex-start; }
    .card-accent { width: 4px; min-height: 28px; border-radius: 999px; margin-top: 2px; }
    .card-head h2 { margin: 0; font-size: 15px; font-weight: 800; letter-spacing: -0.01em; }
    .card-sub { margin: 4px 0 0; font-size: 12px; color: ${MUTED}; font-weight: 600; }
    .lead { margin: 14px 0 0; font-size: 13px; line-height: 1.5; font-weight: 650; color: ${ACCENT_SOFT}; }
    .metric-list { margin-top: 14px; display: grid; gap: 12px; }
    .metric-top { display: flex; justify-content: space-between; gap: 10px; font-size: 12px; font-weight: 700; }
    .metric-title { min-width: 0; }
    .metric-score { white-space: nowrap; font-variant-numeric: tabular-nums; }
    .bar { margin-top: 6px; height: 7px; border-radius: 999px; background: #121A2E; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 999px; }
    .empty { margin: 14px 0 0; color: ${TERT}; font-size: 13px; font-weight: 600; }
    .note { margin: 12px 0 0; font-size: 11px; color: ${MUTED}; font-weight: 600; }
    .specs { margin: 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 8px; }
    .specs li {
      border-radius: 999px; padding: 6px 12px; font-size: 12px; font-weight: 700;
      border: 1px solid ${BORDER}; background: rgba(255,255,255,.03);
    }
    .foot {
      margin-top: 16px; padding: 16px 18px; border-radius: 20px;
      border: 1px dashed ${BORDER}; color: ${MUTED}; font-size: 11px; font-weight: 600; line-height: 1.5;
    }
    @media print {
      body { padding: 0; }
      .print-bar { display: none !important; }
      .sheet { max-width: none; }
      .card, .hero, .kpi { break-inside: avoid; }
    }
    @media (max-width: 860px) {
      .kpis, .hero-stats, .grid-3 { grid-template-columns: 1fr 1fr; }
      .hero-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 560px) {
      .kpis, .hero-stats, .grid-3 { grid-template-columns: 1fr; }
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
          Rapport bilans expert<br/>
          Généré le ${esc(fmtDateTime(generatedAtIso))}
        </div>
      </div>
      <div class="hero-grid">
        <div class="avatar">${esc(initials(expert))}</div>
        <div>
          <h1>${esc(name)}</h1>
          ${expert.headline ? `<p class="headline">${esc(expert.headline)}</p>` : ""}
          <div class="pills">
            <span class="pill">${esc(statusLabel)}</span>
            ${expert.is_certified_beyond ? `<span class="pill pill-ok">Certifié Byound</span>` : ""}
            ${expert.is_care_expert ? `<span class="pill">Care</span>` : ""}
            ${expert.email ? `<span class="pill pill-soft">${esc(expert.email)}</span>` : ""}
          </div>
        </div>
      </div>
      <div class="hero-stats">
        <div class="hero-stat">
          <div class="l">Bilans passés</div>
          <div class="v">${esc(String(testsDone))}/3</div>
          <div class="s">${hasTests ? "DISC · IDMC · Soft skills" : "Aucun test pour l’instant"}</div>
        </div>
        <div class="hero-stat">
          <div class="l">Profil fiche</div>
          <div class="v">${esc(`${kpis.profileProgress} %`)}</div>
          <div class="s">${esc(String(kpis.documentsCount))} document${kpis.documentsCount > 1 ? "s" : ""}</div>
        </div>
        <div class="hero-stat">
          <div class="l">Expérience</div>
          <div class="v">${esc(kpis.yearsExperience || "—")}</div>
          <div class="s">${kpis.missionsCount != null ? `${kpis.missionsCount} mission${kpis.missionsCount > 1 ? "s" : ""}` : "Missions non renseignées"}</div>
        </div>
      </div>
    </header>

    <div class="kpis">
      ${kpi("DISC", disc ? String(Math.round(discEntries[0]?.score ?? 0)) : "—", disc ? `${discEntries[0]?.key} dominant · ${fmtDay(results.disc_at)}` : "Non passé")}
      ${kpi("IDMC", results.idmc_score != null ? String(Math.round(results.idmc_score)) : "—", results.idmc_at ? fmtDay(results.idmc_at) : "Non passé")}
      ${kpi("Soft skills", softAvg != null ? `${softAvg} %` : "—", soft.length ? `${soft.length} compétences` : "Non passé")}
      ${kpi("Note", kpis.rating != null ? String(kpis.rating) : "—", kpis.lastActivityLabel ? `Activité ${kpis.lastActivityLabel}` : "Sans note")}
    </div>

    ${
      uniqueSpecs.length
        ? section(
            "Domaines & spécialités",
            `<ul class="specs">${uniqueSpecs.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>`,
            expert.formats_supported?.length
              ? `Formats : ${expert.formats_supported.join(" · ")}`
              : undefined,
          )
        : ""
    }

    ${section("DISC — profil comportemental", discBody, disc ? "4 dimensions · phrase de profil" : "En attente", ACCENT)}
    ${section("IDMC — 8 axes", idmcBody, "Motivations et maîtrise", TEAL)}
    ${section(
      "Soft skills — compétences transverses",
      softBody,
      soft.length ? `Classement complet · ${soft.length} compétences` : "En attente",
      GOLD,
    )}

    <footer class="foot">
      Expert ${esc(name)}${expert.email ? ` · ${esc(expert.email)}` : ""} · Statut ${esc(statusLabel)}.<br/>
      Rapport généré le ${esc(fmtDateTime(generatedAtIso))} — Byound Control.
      Les scores DISC / IDMC / soft skills sont ceux enregistrés dans Mes bilans.
      Imprimer → Enregistrer en PDF.
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
