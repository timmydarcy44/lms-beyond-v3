import { renderHtmlToPdf } from "@/lib/formation-documents/html-pdf";
import {
  PROCEDURE_SECTION_KEYS,
  PROCEDURE_SECTION_LABELS,
  type ProcedureSectionKey,
} from "@/lib/qualiopi/procedure-sections";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function mdToSimpleHtml(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let inList = false;
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith("## ")) {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      out.push(`<h3>${escapeHtml(t.slice(3))}</h3>`);
      continue;
    }
    if (t.startsWith("- ") || t.startsWith("* ")) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${escapeHtml(t.slice(2))}</li>`);
      continue;
    }
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
    if (!t) {
      out.push("<br/>");
      continue;
    }
    out.push(`<p>${escapeHtml(t)}</p>`);
  }
  if (inList) out.push("</ul>");
  return out.join("\n");
}

export async function buildProcedurePdf(params: {
  title: string;
  version: string;
  effectiveDate: string | null;
  validatedByName: string | null;
  validatedAt: string | null;
  nextReviewAt: string | null;
  sections: Array<{ key: string; content: string; position: number }>;
}): Promise<Buffer> {
  const sectionsHtml = PROCEDURE_SECTION_KEYS.map((key, i) => {
    const sec = params.sections.find((s) => s.key === key);
    const body = sec?.content?.trim()
      ? mdToSimpleHtml(sec.content)
      : "<p><em>Section non renseignée.</em></p>";
    return `
      <section style="margin:0 0 18px;page-break-inside:avoid">
        <h2 style="font-size:14px;font-weight:800;margin:0 0 8px">${i + 1}. ${
          PROCEDURE_SECTION_LABELS[key as ProcedureSectionKey]
        }</h2>
        <div style="font-size:12.5px;line-height:1.55">${body}</div>
      </section>`;
  }).join("\n");

  const htmlBody = `
  <div style="border-bottom:2px solid #0A0F1E;padding-bottom:14px;margin-bottom:22px">
    <div style="font-size:13px;font-weight:800">Byound</div>
    <h1 style="font-size:20px;font-weight:800;margin:10px 0 6px">${escapeHtml(params.title)}</h1>
    <div style="color:#555;font-size:11.5px">Version ${escapeHtml(params.version)}${
      params.effectiveDate ? ` · applicable au ${escapeHtml(params.effectiveDate)}` : ""
    }</div>
  </div>
  ${sectionsHtml}
  <div style="margin-top:28px;padding-top:10px;border-top:1px solid #ddd;font-size:10.5px;color:#555">
    SIRET 130 709 058 00015<br/>
    Validée par ${escapeHtml(params.validatedByName || "—")}${
      params.validatedAt ? ` le ${escapeHtml(params.validatedAt)}` : ""
    }${
      params.nextReviewAt ? ` · prochaine revue le ${escapeHtml(params.nextReviewAt)}` : ""
    }
  </div>`;

  return renderHtmlToPdf(htmlBody, { font: "manrope" });
}
