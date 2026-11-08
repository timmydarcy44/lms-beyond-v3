import { jsPDF } from "jspdf";
import type { DossierDocContext } from "@/lib/formation-documents/context";
import { formatFrDate } from "@/lib/formation-documents/context";

export type AnnexData = {
  courseTitle: string;
  presentation: string;
  duration: string;
  format: string;
  level: string;
  evaluation: string;
  certification: string;
  objectiveGeneral: string;
  audience: string;
  prerequisites: string;
  objectives: string[];
  sections: Array<{
    title: string;
    description?: string;
    scheduleLabel?: string;
    chapters: Array<{
      title: string;
      subchapters: string[];
    }>;
  }>;
  skills: string[];
  conventionRef: string;
};

function esc(text: string): string {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function modalityLabel(ctx: DossierDocContext): string {
  const m = (ctx.dossier.modality_presence || "").toLowerCase();
  if (m.includes("distan")) return "Distanciel";
  if (m.includes("mixte") || m.includes("hybride")) return "Mixte";
  return "Présentiel";
}

function hoursLine(ctx: DossierDocContext): string {
  const withHours = ctx.slots.filter((s) => s.starts_at && s.ends_at);
  if (!withHours.length) return "";
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Paris",
    });
  const morning = withHours.find((s) => s.day_part === "matin");
  const afternoon = withHours.find(
    (s) => s.day_part === "apres_midi" || s.day_part === "après-midi",
  );
  if (morning?.starts_at && morning.ends_at && afternoon?.starts_at && afternoon.ends_at) {
    return `${fmt(morning.starts_at)}-${fmt(morning.ends_at)} / ${fmt(afternoon.starts_at)}-${fmt(afternoon.ends_at)}`;
  }
  return `${fmt(withHours[0].starts_at!)}-${fmt(withHours[withHours.length - 1].ends_at!)}`;
}

export function buildAnnexData(ctx: DossierDocContext, conventionRef: string): AnnexData {
  const title =
    ctx.course?.title || ctx.dossier.course_title || ctx.session?.title || "Formation professionnelle";
  const dayLabels = [...new Set(ctx.slots.map((s) => formatFrDate(s.slot_date)))];
  const hours = hoursLine(ctx);
  const sectionsRaw = ctx.course?.program_structure ?? [];

  const sections = sectionsRaw.map((section, idx) => {
    const dayIdx =
      dayLabels.length <= 1
        ? 0
        : Math.min(
            Math.floor((idx * dayLabels.length) / Math.max(sectionsRaw.length, 1)),
            dayLabels.length - 1,
          );
    const day = dayLabels[dayIdx];
    const scheduleLabel = day
      ? `Jour ${dayIdx + 1} · ${day}${hours ? ` · ${hours}` : ""}`
      : undefined;
    return {
      title: section.title,
      description: section.description,
      scheduleLabel,
      chapters: (section.chapters ?? []).map((ch) => ({
        title: ch.title,
        subchapters: (ch.subchapters ?? []).map((s) => s.title).filter(Boolean),
      })),
    };
  });

  return {
    courseTitle: title,
    presentation: ctx.course?.short_description || ctx.course?.objectives?.[0] || "",
    duration: ctx.course?.duration || `${Math.max(1, Math.ceil(ctx.slots.length / 2))} jour(s)`,
    format: modalityLabel(ctx),
    level: ctx.course?.level || "Intermédiaire",
    evaluation: "Cas pratiques et restitution",
    certification: "Attestation + Open Badge",
    objectiveGeneral:
      ctx.course?.objectives?.[0] ||
      ctx.course?.short_description ||
      "Développer les compétences visées par le programme.",
    audience: (ctx.course?.audience ?? []).join(", ") || "Salariés de l'entreprise bénéficiaire",
    prerequisites: ctx.course?.prerequisites || "Aucun prérequis spécifique",
    objectives: ctx.course?.objectives ?? [],
    sections,
    skills: ctx.course?.skills ?? [],
    conventionRef,
  };
}

/** HTML/CSS annexe — même langage visuel que la convention Byound (reflow dynamique). */
export function buildAnnexHtml(data: AnnexData): string {
  const meta = [
    ["Durée", data.duration],
    ["Format", data.format],
    ["Niveau", data.level],
    ["Évaluation", data.evaluation],
    ["Certification", data.certification],
  ];

  const objectives = data.objectives
    .map(
      (o, i) =>
        `<li><span class="obj-num">${String(i + 1).padStart(2, "0")}</span><span>${esc(o)}</span></li>`,
    )
    .join("");

  const sections = data.sections
    .map((section, si) => {
      const chapters = section.chapters
        .map((ch, ci) => {
          const subs = ch.subchapters
            .map((sub) => `<li>${esc(sub)}</li>`)
            .join("");
          return `<article class="chapter">
            <header>
              <span class="chapter-code">Chapitre ${si + 1}.${ci + 1}</span>
              <h4>${esc(ch.title)}</h4>
            </header>
            ${subs ? `<ul class="subs">${subs}</ul>` : ""}
          </article>`;
        })
        .join("");
      return `<section class="section">
        <header class="section-head">
          <div>
            <p class="section-kicker">Section ${si + 1}</p>
            <h3>${esc(section.title)}</h3>
          </div>
          ${section.scheduleLabel ? `<p class="schedule">${esc(section.scheduleLabel)}</p>` : ""}
        </header>
        ${section.description ? `<p class="section-desc">${esc(section.description)}</p>` : ""}
        <div class="chapters">${chapters}</div>
      </section>`;
    })
    .join("");

  const skills = data.skills.length
    ? `<section class="skills">
        <h3>Compétences évaluées</h3>
        <table>
          <thead><tr><th>Compétence</th><th>Modalité d'évaluation</th></tr></thead>
          <tbody>
            ${data.skills
              .slice(0, 10)
              .map(
                (s) =>
                  `<tr><td>${esc(s)}</td><td>Cas pratique / restitution</td></tr>`,
              )
              .join("")}
          </tbody>
        </table>
      </section>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<style>
  @page { size: A4; margin: 18mm 16mm 20mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: Inter, "Helvetica Neue", Helvetica, Arial, sans-serif;
    color: #14151F;
    font-size: 10.5pt;
    line-height: 1.45;
    background: #fff;
  }
  .kicker {
    font-size: 9pt;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #635BFF;
    font-weight: 700;
    margin: 0 0 8px;
  }
  h1 {
    font-size: 20pt;
    line-height: 1.2;
    margin: 0 0 8px;
    font-weight: 700;
  }
  .lead {
    color: #4A5168;
    margin: 0 0 18px;
    max-width: 92%;
  }
  .meta {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
    margin: 0 0 22px;
  }
  .meta div {
    border: 1px solid #E6E8F0;
    border-radius: 10px;
    padding: 10px 11px;
    background: #F8F8FC;
  }
  .meta span {
    display: block;
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #7A8299;
    margin-bottom: 4px;
  }
  .meta strong { font-size: 9.5pt; font-weight: 650; }
  .block { margin: 0 0 18px; }
  .block h2 {
    font-size: 11pt;
    margin: 0 0 8px;
    color: #14151F;
  }
  .block p { margin: 0; color: #30364A; }
  .objectives { list-style: none; padding: 0; margin: 0; }
  .objectives li {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 7px 0;
    border-bottom: 1px solid #EEF0F6;
  }
  .obj-num {
    flex: 0 0 28px;
    font-weight: 700;
    color: #635BFF;
    font-variant-numeric: tabular-nums;
  }
  .section {
    break-inside: avoid;
    margin: 0 0 18px;
    border: 1px solid #E6E8F0;
    border-radius: 14px;
    overflow: hidden;
  }
  .section-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
    padding: 14px 16px;
    background: linear-gradient(180deg, #F4F3FF 0%, #FBFBFE 100%);
    border-bottom: 1px solid #E6E8F0;
  }
  .section-kicker {
    margin: 0 0 4px;
    font-size: 8pt;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #635BFF;
    font-weight: 700;
  }
  .section-head h3 { margin: 0; font-size: 12pt; }
  .schedule {
    margin: 0;
    font-size: 8.5pt;
    color: #5B647C;
    white-space: nowrap;
  }
  .section-desc {
    margin: 0;
    padding: 10px 16px 0;
    color: #4A5168;
    font-size: 9.5pt;
  }
  .chapters { padding: 10px 12px 12px; display: grid; gap: 8px; }
  .chapter {
    border: 1px solid #ECEEF5;
    border-radius: 10px;
    padding: 10px 12px;
    background: #fff;
  }
  .chapter-code {
    font-size: 7.5pt;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #635BFF;
    font-weight: 700;
  }
  .chapter h4 { margin: 3px 0 6px; font-size: 10.5pt; }
  .subs {
    margin: 0;
    padding-left: 16px;
    color: #30364A;
  }
  .subs li { margin: 2px 0; }
  .skills { margin-top: 22px; break-inside: avoid; }
  .skills h3 { margin: 0 0 10px; font-size: 12pt; }
  table { width: 100%; border-collapse: collapse; }
  th, td {
    text-align: left;
    padding: 8px 10px;
    border-bottom: 1px solid #E6E8F0;
    font-size: 9.5pt;
  }
  th {
    background: #F8F8FC;
    color: #5B647C;
    font-size: 8pt;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .foot-note {
    margin-top: 18px;
    font-size: 8pt;
    color: #8A91A5;
  }
</style>
</head>
<body>
  <p class="kicker">Annexe · Programme de formation</p>
  <h1>${esc(data.courseTitle)}</h1>
  ${data.presentation ? `<p class="lead">${esc(data.presentation)}</p>` : ""}

  <div class="meta">
    ${meta.map(([k, v]) => `<div><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join("")}
  </div>

  <div class="block">
    <h2>Objectif général</h2>
    <p>${esc(data.objectiveGeneral)}</p>
  </div>
  <div class="block">
    <h2>Public visé</h2>
    <p>${esc(data.audience)}</p>
  </div>
  <div class="block">
    <h2>Prérequis</h2>
    <p>${esc(data.prerequisites)}</p>
  </div>
  ${
    objectives
      ? `<div class="block"><h2>Objectifs pédagogiques</h2><ul class="objectives">${objectives}</ul></div>`
      : ""
  }

  <h2 style="margin: 8px 0 12px; font-size: 12pt;">Programme détaillé</h2>
  ${sections || `<p>Programme à préciser.</p>`}
  ${skills}
  <p class="foot-note">Réf. ${esc(data.conventionRef)} · Structure catalogue Byound : Section → Chapitre → Sous-chapitre</p>
</body>
</html>`;
}

async function launchBrowser() {
  const puppeteer = await import("puppeteer");
  return puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });
}

/** Fallback serverless / sans Chrome : reflow jsPDF (même structure Section→Chapitre→Sous-chapitre). */
export function renderAnnexPdfFallback(data: AnnexData): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 16;
  const pageW = doc.internal.pageSize.getWidth();
  const maxW = pageW - margin * 2;
  let y = 18;

  const ensure = (need: number) => {
    if (y + need > doc.internal.pageSize.getHeight() - 18) {
      doc.addPage();
      y = 18;
    }
  };

  doc.setTextColor(99, 91, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("ANNEXE · PROGRAMME DE FORMATION", margin, y);
  y += 8;

  doc.setTextColor(20, 21, 31);
  doc.setFontSize(16);
  const titleLines = doc.splitTextToSize(data.courseTitle, maxW);
  ensure(titleLines.length * 7 + 4);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 7 + 2;

  if (data.presentation) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(74, 81, 104);
    const lead = doc.splitTextToSize(data.presentation, maxW);
    ensure(lead.length * 5 + 4);
    doc.text(lead, margin, y);
    y += lead.length * 5 + 6;
  }

  const meta = [
    `Durée : ${data.duration}`,
    `Format : ${data.format}`,
    `Niveau : ${data.level}`,
    `Évaluation : ${data.evaluation}`,
    `Certification : ${data.certification}`,
  ];
  doc.setFontSize(9);
  doc.setTextColor(48, 54, 74);
  for (const line of meta) {
    ensure(5);
    doc.text(line, margin, y);
    y += 5;
  }
  y += 4;

  const block = (label: string, body: string) => {
    ensure(14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(20, 21, 31);
    doc.text(label, margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(48, 54, 74);
    const lines = doc.splitTextToSize(body, maxW);
    ensure(lines.length * 5 + 4);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 5;
  };

  block("Objectif général", data.objectiveGeneral);
  block("Public visé", data.audience);
  block("Prérequis", data.prerequisites);

  if (data.objectives.length) {
    ensure(10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(20, 21, 31);
    doc.text("Objectifs pédagogiques", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(48, 54, 74);
    data.objectives.forEach((o, i) => {
      const lines = doc.splitTextToSize(`${String(i + 1).padStart(2, "0")}  ${o}`, maxW);
      ensure(lines.length * 5 + 2);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 2;
    });
    y += 3;
  }

  ensure(10);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(20, 21, 31);
  doc.text("Programme détaillé", margin, y);
  y += 7;

  data.sections.forEach((section, si) => {
    ensure(16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(99, 91, 255);
    doc.text(`Section ${si + 1}`, margin, y);
    y += 5;
    doc.setTextColor(20, 21, 31);
    doc.setFontSize(12);
    const sTitle = doc.splitTextToSize(section.title, maxW);
    ensure(sTitle.length * 5.5 + 4);
    doc.text(sTitle, margin, y);
    y += sTitle.length * 5.5;
    if (section.scheduleLabel) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(91, 100, 124);
      ensure(5);
      doc.text(section.scheduleLabel, margin, y);
      y += 5;
    }
    if (section.description) {
      doc.setFontSize(9.5);
      doc.setTextColor(74, 81, 104);
      const d = doc.splitTextToSize(section.description, maxW);
      ensure(d.length * 4.5 + 3);
      doc.text(d, margin, y);
      y += d.length * 4.5 + 3;
    }
    y += 2;

    section.chapters.forEach((ch, ci) => {
      ensure(12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(99, 91, 255);
      doc.text(`Chapitre ${si + 1}.${ci + 1}`, margin, y);
      y += 4.5;
      doc.setTextColor(20, 21, 31);
      const cTitle = doc.splitTextToSize(ch.title, maxW - 4);
      ensure(cTitle.length * 5 + 2);
      doc.text(cTitle, margin, y);
      y += cTitle.length * 5 + 1;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(48, 54, 74);
      ch.subchapters.forEach((sub) => {
        const lines = doc.splitTextToSize(`•  ${sub}`, maxW - 4);
        ensure(lines.length * 4.5 + 1);
        doc.text(lines, margin + 2, y);
        y += lines.length * 4.5 + 1;
      });
      y += 3;
    });
    y += 4;
  });

  if (data.skills.length) {
    ensure(16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(20, 21, 31);
    doc.text("Compétences évaluées", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    data.skills.slice(0, 10).forEach((s) => {
      const lines = doc.splitTextToSize(`•  ${s} — cas pratique / restitution`, maxW);
      ensure(lines.length * 4.5 + 1);
      doc.text(lines, margin, y);
      y += lines.length * 4.5 + 1;
    });
  }

  return Buffer.from(doc.output("arraybuffer"));
}

/** HTML → PDF A4 via Puppeteer ; fallback jsPDF si Chrome indisponible (ex. Vercel). */
export async function renderAnnexPdf(data: AnnexData): Promise<Buffer> {
  try {
    const html = buildAnnexHtml(data);
    const browser = await launchBrowser();
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "14mm", right: "12mm", bottom: "16mm", left: "12mm" },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  } catch (err) {
    console.warn("[convention-annex] Puppeteer unavailable, jsPDF fallback", err);
    return renderAnnexPdfFallback(data);
  }
}
