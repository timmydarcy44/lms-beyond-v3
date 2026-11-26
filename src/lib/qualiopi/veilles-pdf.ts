import { jsPDF } from "jspdf";
import {
  VEILLE_AXES,
  VEILLE_THEME_LABELS,
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
        const summary = String(item.summary ?? "").slice(0, 180);
        const theme = item.theme ? String(item.theme) : "";
        line(
          `• ${title}${theme ? ` (${VEILLE_THEME_LABELS[theme as VeilleTheme] ?? theme})` : ""}`,
          { size: 8, bold: true },
        );
        if (summary) line(`  ${summary}`, { size: 7, color: 80 });
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
