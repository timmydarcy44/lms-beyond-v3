import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { renderHtmlToPdf } from "@/lib/formation-documents/html-pdf";
import { formatFrDateShort } from "@/lib/qualiopi/reclamation-format";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { data, error } = await supabase
    .from("crm_qualiopi_procedures")
    .select("id, title, current_version, validated_at, indicators, status, legal_obligation")
    .eq("status", "validated")
    .order("title");

  if (error) {
    if (/does not exist|schema cache/i.test(error.message)) {
      return NextResponse.json(
        { error: "Migration procédures v2 requise pour le dossier auditeur." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const rows = data ?? [];
  const list = rows
    .map((r, i) => {
      const inds =
        Array.isArray(r.indicators) && r.indicators.length
          ? r.indicators.map((n: number) => `Ind. ${n}`).join(", ")
          : r.legal_obligation
            ? "Obligation légale"
            : "—";
      return `<tr>
        <td>${i + 1}</td>
        <td>${escape(r.title)}</td>
        <td>v${escape(r.current_version)}</td>
        <td>${escape(formatFrDateShort(r.validated_at))}</td>
        <td>${escape(inds)}</td>
      </tr>`;
    })
    .join("");

  const htmlBody = `
  <div style="font-weight:800">Byound</div>
  <h1 style="font-size:22px;font-weight:800;margin:8px 0 6px">Dossier auditeur — procédures qualité</h1>
  <div style="color:#555;margin-bottom:18px">${rows.length} procédure(s) validée(s) · ${escape(
    formatFrDateShort(new Date().toISOString()),
  )}</div>
  <table style="width:100%;border-collapse:collapse;font-size:12px">
    <thead><tr>
      <th style="text-align:left;border-bottom:1px solid #ddd;padding:8px;color:#555">#</th>
      <th style="text-align:left;border-bottom:1px solid #ddd;padding:8px;color:#555">Titre</th>
      <th style="text-align:left;border-bottom:1px solid #ddd;padding:8px;color:#555">Version</th>
      <th style="text-align:left;border-bottom:1px solid #ddd;padding:8px;color:#555">Validation</th>
      <th style="text-align:left;border-bottom:1px solid #ddd;padding:8px;color:#555">Indicateurs</th>
    </tr></thead>
    <tbody>${list || `<tr><td colspan="5" style="padding:8px">Aucune procédure validée.</td></tr>`}</tbody>
  </table>
  <p style="margin-top:20px;color:#555;font-size:11px">SIRET 130 709 058 00015 — les PDF individuels sont disponibles depuis l’historique de chaque procédure.</p>`;

  const pdf = await renderHtmlToPdf(htmlBody, { font: "manrope" });
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="dossier-auditeur-procedures.pdf"`,
    },
  });
}

function escape(s: string | null | undefined): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
