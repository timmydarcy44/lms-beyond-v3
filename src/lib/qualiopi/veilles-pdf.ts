import { jsPDF } from "jspdf";
import { renderHtmlToPdf } from "@/lib/formation-documents/html-pdf";
import {
  Q_PDF,
  escPdf,
  fmtPdfDateTime,
  fmtPdfDay,
  qualiopiPdfShell,
} from "@/lib/qualiopi/pdf-theme";
import {
  VEILLE_AXES,
  VEILLE_THEME_LABELS,
  splitVeilleHighlightNote,
  type VeilleDigest,
  type VeilleHighlight,
  type VeilleTheme,
} from "@/lib/qualiopi/veille-shared";

function fmtDay(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
  return d.toLocaleDateString("fr-FR");
}

function asItems(raw: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x) => x && typeof x === "object") as Array<Record<string, unknown>>;
}

/**
 * Registre PDF des veilles Qualiopi (ind. 23 / 24 / 25).
 * jsPDF (sans Chromium) — fiable sur Vercel serverless.
 */
export async function buildVeillesRegistrePdf(input: {
  digests: VeilleDigest[];
  highlights: VeilleHighlight[];
  generatedAtIso?: string;
}): Promise<Buffer> {
  const generatedAtIso = input.generatedAtIso ?? new Date().toISOString();
  const digests = input.digests ?? [];
  const highlights = input.highlights ?? [];

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 14;
  const pageW = doc.internal.pageSize.getWidth();
  const maxW = pageW - margin * 2;
  let y = 16;

  const ensure = (need: number) => {
    if (y + need > 285) {
      doc.addPage();
      y = 16;
    }
  };

  const line = (text: string, opts?: { bold?: boolean; size?: number; color?: number }) => {
    const size = opts?.size ?? 10;
    doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(opts?.color ?? 20);
    const wrapped = doc.splitTextToSize(text, maxW);
    ensure(wrapped.length * (size * 0.4) + 2);
    doc.text(wrapped, margin, y);
    y += wrapped.length * (size * 0.4) + 2;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(80);
  doc.text("Byound Control · Qualiopi", margin, y);
  y += 7;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(10);
  doc.text("Registre des veilles", margin, y);
  y += 7;

  line(`Indicateurs 23 · 24 · 25 · Export du ${fmtDay(generatedAtIso)}`, {
    size: 9,
    color: 90,
  });
  line("Preuves — légale & réglementaire, compétences & métiers, innovations pédagogiques", {
    size: 9,
    color: 90,
  });
  y += 2;

  for (const axis of VEILLE_AXES) {
    const done = highlights.filter(
      (h) => (h.theme || "reglementaire") === axis.theme && h.status === "done",
    ).length;
    const total = highlights.filter((h) => (h.theme || "reglementaire") === axis.theme).length;
    line(`Ind. ${axis.indicatorId} — ${axis.shortTitle} : ${done} traité(s) / ${total} suivi(s)`, {
      bold: true,
      size: 10,
    });
  }
  line(`Synthèses exportées : ${digests.length}`, { size: 10, bold: true });
  y += 3;

  line("Surlignages traités / suivis", { bold: true, size: 13 });
  y += 1;
  if (highlights.length === 0) {
    line("Aucun surlignage enregistré.", { size: 9, color: 110 });
  } else {
    for (const h of highlights.slice(0, 80)) {
      const theme = (h.theme || "reglementaire") as VeilleTheme;
      const axis = VEILLE_AXES.find((a) => a.theme === theme);
      ensure(22);
      line(
        `Ind. ${axis?.indicatorId ?? "—"} · ${VEILLE_THEME_LABELS[theme] ?? theme} · ${h.status} · ${fmtDay(h.updated_at || h.created_at)}`,
        { size: 8, color: 100 },
      );
      line(String(h.title || "Sans titre"), { bold: true, size: 10 });
      if (h.excerpt) line(String(h.excerpt).slice(0, 280), { size: 8, color: 70 });
      if (h.note) line(`Note : ${String(h.note).slice(0, 160)}`, { size: 8, color: 70 });
      if (h.url) line(String(h.url).slice(0, 120), { size: 7, color: 120 });
      y += 2;
    }
  }

  y += 2;
  line("Synthèses de veille", { bold: true, size: 13 });
  y += 1;
  if (digests.length === 0) {
    line("Aucune synthèse de veille.", { size: 9, color: 110 });
  } else {
    for (const d of digests.slice(0, 12)) {
      ensure(28);
      line(String(d.title || "Synthèse veille"), { bold: true, size: 11 });
      line(`Semaine du ${fmtDay(d.week_start)} · ${d.kind}`, { size: 8, color: 100 });
      if (d.summary) line(String(d.summary).slice(0, 400), { size: 9, color: 50 });
      const items = asItems(d.items).slice(0, 12);
      for (const item of items) {
        const title = String(item.title ?? "Sans titre");
        const summary = String(item.summary ?? "").slice(0, 220);
        const action = String(item.recommendedAction ?? "").slice(0, 180);
        const theme = item.theme ? String(item.theme) : "";
        line(
          `• ${title}${theme ? ` (${VEILLE_THEME_LABELS[theme as VeilleTheme] ?? theme})` : ""}`,
          { size: 8, bold: true },
        );
        if (summary) line(`  Synthèse : ${summary}`, { size: 7, color: 80 });
        if (action) line(`  Proposition : ${action}`, { size: 7, color: 50 });
      }
      y += 3;
    }
  }

  ensure(12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(
    "Document généré pour l’audit Qualiopi (ind. 23, 24, 25) — Byound Control.",
    margin,
    y,
  );

  return Buffer.from(doc.output("arraybuffer"));
}

/**
 * Document de synthèse exhaustif — design Revolut / Byound Control (HTML → PDF).
 */
export async function buildVeilleSyntheseExhaustivePdf(input: {
  digests: VeilleDigest[];
  highlights: VeilleHighlight[];
  generatedAtIso?: string;
}): Promise<Buffer> {
  const generatedAtIso = input.generatedAtIso ?? new Date().toISOString();
  const digests = input.digests ?? [];
  const highlights = input.highlights ?? [];
  const doneCount = highlights.filter((h) => h.status === "done").length;

  const axisKpis = VEILLE_AXES.map((axis) => {
    const total = highlights.filter((h) => (h.theme || "reglementaire") === axis.theme).length;
    const done = highlights.filter(
      (h) => (h.theme || "reglementaire") === axis.theme && h.status === "done",
    ).length;
    return `<div class="kpi">
      <div class="l">Ind. ${axis.indicatorId}</div>
      <div class="v">${escPdf(done)}<span style="font-size:12px;color:${Q_PDF.muted}">/${escPdf(total)}</span></div>
      <div class="s">${escPdf(axis.shortTitle)}</div>
    </div>`;
  }).join("");

  const digestCards =
    digests.length === 0
      ? `<div class="card"><p class="muted">Aucune synthèse de veille enregistrée.</p></div>`
      : digests
          .map((d) => {
            const items = asItems(d.items)
              .map((item) => {
                const theme = item.theme ? String(item.theme) : "";
                const themeLabel = theme
                  ? VEILLE_THEME_LABELS[theme as VeilleTheme] ?? theme
                  : "";
                return `<div style="margin-top:10px;padding-top:10px;border-top:1px solid ${Q_PDF.border}">
                  <div style="font-weight:800">${escPdf(String(item.title ?? "Sans titre"))}${
                    themeLabel ? ` <span class="pill">${escPdf(themeLabel)}</span>` : ""
                  }</div>
                  ${
                    item.summary
                      ? `<div class="muted" style="margin-top:4px;font-size:11px"><strong style="color:${Q_PDF.accentSoft}">Synthèse</strong> — ${escPdf(String(item.summary))}</div>`
                      : ""
                  }
                  ${
                    item.recommendedAction
                      ? `<div class="muted" style="margin-top:4px;font-size:11px"><strong style="color:${Q_PDF.accentSoft}">Proposition</strong> — ${escPdf(String(item.recommendedAction))}</div>`
                      : ""
                  }
                </div>`;
              })
              .join("");
            return `<div class="card">
              <h2>${escPdf(String(d.title || "Synthèse veille"))}</h2>
              <div class="muted" style="font-size:11px;margin-bottom:8px">Semaine du ${escPdf(fmtPdfDay(d.week_start))}</div>
              ${d.summary ? `<p style="margin:0 0 8px;font-weight:600">${escPdf(String(d.summary))}</p>` : ""}
              ${items || `<p class="muted">Aucun article dans cette synthèse.</p>`}
            </div>`;
          })
          .join("");

  const highlightCards =
    highlights.length === 0
      ? `<div class="card"><p class="muted">Aucun surlignage enregistré.</p></div>`
      : highlights
          .map((h) => {
            const theme = (h.theme || "reglementaire") as VeilleTheme;
            const axis = VEILLE_AXES.find((a) => a.theme === theme);
            const { preface, planDraft, actionPlan } = splitVeilleHighlightNote(h.note);
            const planItems = planDraft?.items?.length
              ? `<ul style="margin:6px 0 0;padding-left:16px">${planDraft.items
                  .map(
                    (item) =>
                      `<li style="margin:4px 0">${escPdf(item.title)}${
                        item.owner_name ? ` · ${escPdf(item.owner_name)}` : ""
                      }${item.due_at ? ` · ${escPdf(fmtPdfDay(item.due_at))}` : ""}</li>`,
                  )
                  .join("")}</ul>`
              : actionPlan
                ? `<pre style="white-space:pre-wrap;font-size:10px;color:${Q_PDF.muted};margin:6px 0 0">${escPdf(actionPlan)}</pre>`
                : "";
            return `<div class="card">
              <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">
                <span class="pill">Ind. ${escPdf(axis?.indicatorId ?? "—")}</span>
                <span class="pill">${escPdf(VEILLE_THEME_LABELS[theme] ?? theme)}</span>
                <span class="pill">${escPdf(h.status)}</span>
                <span class="pill">${escPdf(fmtPdfDay(h.updated_at || h.created_at))}</span>
              </div>
              <h2>${escPdf(String(h.title || "Sans titre"))}</h2>
              ${
                h.excerpt
                  ? `<div class="muted" style="margin-top:6px;font-size:11px"><strong style="color:${Q_PDF.accentSoft}">Synthèse</strong> — ${escPdf(String(h.excerpt))}</div>`
                  : ""
              }
              ${
                preface
                  ? `<div class="muted" style="margin-top:6px;font-size:11px"><strong style="color:${Q_PDF.accentSoft}">Note de retravail</strong> — ${escPdf(preface)}</div>`
                  : ""
              }
              ${
                planItems
                  ? `<div style="margin-top:8px"><strong style="color:${Q_PDF.accentSoft};font-size:11px">Proposition générée — à valider</strong>${planItems}</div>`
                  : ""
              }
            </div>`;
          })
          .join("");

  const inner = `
    <header class="hero">
      <div class="brand">
        <div class="brand-mark">Byound Control</div>
        <div class="brand-meta">Indicateurs 23 · 24 · 25<br/>${escPdf(fmtPdfDateTime(generatedAtIso))}</div>
      </div>
      <h1>Document de synthèse — veille</h1>
      <p class="sub">Pilotage OF B2B · preuves Qualiopi · formation continue</p>
      <div class="kpis">
        <div class="kpi"><div class="l">Synthèses</div><div class="v">${escPdf(digests.length)}</div><div class="s">Semaines lues</div></div>
        <div class="kpi"><div class="l">Surlignages</div><div class="v">${escPdf(highlights.length)}</div><div class="s">Informations suivies</div></div>
        <div class="kpi"><div class="l">Traités</div><div class="v" style="color:${Q_PDF.green}">${escPdf(doneCount)}</div><div class="s">Décisions prises</div></div>
        <div class="kpi"><div class="l">Périmètre</div><div class="v" style="font-size:14px">OF B2B</div><div class="s">Formation continue</div></div>
      </div>
      <div class="kpis" style="margin-top:8px">${axisKpis}</div>
    </header>
    <div class="card"><h2>1. Actualités lues — synthèses détaillées</h2></div>
    ${digestCards}
    <div class="card"><h2>2. Surlignages & plans d’action</h2></div>
    ${highlightCards}
    <footer class="foot">
      Document de pilotage Qualiopi (ind. 23, 24, 25) — Byound Control. Usage interne / audit.
    </footer>`;

  return renderHtmlToPdf(qualiopiPdfShell(inner), { font: "manrope", fullBleed: true });
}
