import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import {
  copyAmountCents,
  copyDurationHours,
  copySiret,
  displayAmountCents,
  displaySiret,
  maskIban,
} from "@/lib/ready/copy-format";
import { loadReadyFiche } from "@/lib/ready/fiche";
import { isReadyLinkAccessible, loadReadyLinkByToken } from "@/lib/ready/load-link";
import { readReadySessionFromRequest } from "@/lib/ready/session";
import { renderHtmlToPdf } from "@/lib/formation-documents/html-pdf";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function securityHeaders(res: NextResponse) {
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}

function esc(s: string) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const service = getServiceRoleClient();
  if (!service) {
    return securityHeaders(NextResponse.json({ error: "Indisponible" }, { status: 503 }));
  }

  const link = await loadReadyLinkByToken(service, token);
  if (!link) {
    return securityHeaders(NextResponse.json({ error: "Lien introuvable" }, { status: 404 }));
  }
  const access = isReadyLinkAccessible(link);
  if (!access.ok) {
    return securityHeaders(
      NextResponse.json({ error: "Ce lien a expiré.", code: access.reason }, { status: 410 }),
    );
  }

  const session = readReadySessionFromRequest(request);
  if (!session || session.linkId !== link.id || session.tokenHash !== link.token_hash) {
    return securityHeaders(
      NextResponse.json({ error: "Authentification requise", code: "auth_required" }, { status: 401 }),
    );
  }

  const fiche = await loadReadyFiche(service, link.id);
  if (!fiche) {
    return securityHeaders(NextResponse.json({ error: "Fiche introuvable" }, { status: 404 }));
  }

  const rows = [
    ["Raison sociale", fiche.of.legal_name],
    ["SIRET OF", displaySiret(fiche.of.siret)],
    ["NDA", fiche.of.nda],
    ["Qualiopi", fiche.of.qualiopi],
    ["Adresse OF", fiche.of.address],
    ["Contact OF", fiche.of.contact],
    fiche.of.iban ? ["IBAN (masqué)", maskIban(fiche.of.iban)] : null,
    ["Intitulé", fiche.course.title],
    ["Dates", fiche.course.dates_label],
    ["Durée (h)", copyDurationHours(fiche.course.duration_hours)],
    ["Modalité", fiche.course.modality],
    ["Formule", fiche.course.formula],
    ["Coût HT", displayAmountCents(fiche.amounts.ht_cents)],
    ["TVA", displayAmountCents(fiche.amounts.tva_cents)],
    ["TTC", displayAmountCents(fiche.amounts.ttc_cents)],
    ["Par stagiaire HT", displayAmountCents(fiche.amounts.per_learner_ht_cents)],
    ["SIRET entreprise", displaySiret(fiche.company.siret) || "—"],
    ["IDCC", fiche.company.idcc || "—"],
    ["Effectif", fiche.company.headcount || "—"],
    ["OPCO", fiche.company.opco_name || "—"],
    ["N° adhérent", fiche.company.member_number || "—"],
    ["Paiement", fiche.link.payment_mode || "—"],
  ].filter(Boolean) as Array<[string, string]>;

  const learnersHtml = fiche.learners
    .map(
      (l) =>
        `<tr>
          <td>${esc(l.last_name)}</td>
          <td>${esc(l.first_name)}</td>
          <td>${esc(l.fields.sex)}</td>
          <td>${esc(l.fields.date_of_birth)}</td>
          <td>${esc(l.fields.contract_type)}</td>
          <td>${esc(l.fields.csp)}</td>
          <td>${esc(l.fields.hours)}</td>
        </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Byound Ready — ${esc(fiche.course.title)}</title>
<style>
  body { font-family: Inter, Helvetica, Arial, sans-serif; color: #111; font-size: 11px; margin: 28px; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  h2 { font-size: 13px; margin: 18px 0 8px; }
  .muted { color: #666; }
  table { width: 100%; border-collapse: collapse; }
  td, th { border-bottom: 1px solid #ddd; padding: 5px 4px; text-align: left; vertical-align: top; }
  th { color: #666; font-weight: 600; }
  .k { width: 38%; color: #555; }
</style>
</head>
<body>
  <p class="muted">Byound Ready · Fiche OPCO (version figée)</p>
  <h1>${esc(fiche.course.title)}</h1>
  <p class="muted">${esc(fiche.course.dates_label)} · ${esc(String(fiche.course.duration_hours))} h · ${esc(fiche.course.formula)}</p>
  <p class="muted">Destinataire : ${esc(fiche.link.recipient_name || fiche.link.recipient_email)} · Expire le ${esc(new Date(fiche.link.expires_at).toLocaleDateString("fr-FR"))}</p>

  <h2>Champs préparés / saisis</h2>
  <table>
    ${rows.map(([k, v]) => `<tr><td class="k">${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")}
  </table>

  <h2>Stagiaires</h2>
  <table>
    <thead>
      <tr><th>Nom</th><th>Prénom</th><th>Sexe</th><th>Naissance</th><th>Contrat</th><th>CSP</th><th>Heures</th></tr>
    </thead>
    <tbody>${learnersHtml || `<tr><td colspan="7">Aucun stagiaire</td></tr>`}</tbody>
  </table>

  <p class="muted" style="margin-top:24px">Valeurs normalisées (ex.) — SIRET OF : ${esc(copySiret(fiche.of.siret))} · HT : ${esc(copyAmountCents(fiche.amounts.ht_cents))}</p>
</body>
</html>`;

  try {
    const buffer = await renderHtmlToPdf(html);
    if (!buffer?.length) {
      return securityHeaders(NextResponse.json({ error: "PDF impossible" }, { status: 500 }));
    }
    return securityHeaders(
      new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="byound-ready.pdf"`,
        },
      }),
    );
  } catch (e) {
    console.error("[ready-pdf]", e);
    return securityHeaders(
      NextResponse.json(
        { error: e instanceof Error ? e.message : "PDF impossible" },
        { status: 500 },
      ),
    );
  }
}
