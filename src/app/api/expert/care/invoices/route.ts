import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/resend-client";
import { getSession } from "@/lib/auth/session";
import { CARE_SQL_HINT, missingRelation, requireCareExpert } from "@/lib/expert/care-auth";
import { CARE_INVOICE_EXTRAS, type CarePrestation } from "@/lib/expert/care-prestations";
import { buildCareEmail } from "@/lib/expert/care-email";
import { careInvoicePdfBuffer, fetchCareLogoPng, type CareInvoiceLine } from "@/lib/expert/care-invoice-pdf";
import { mergeRegistrationMeta, parseRegistrationMeta } from "@/lib/expert/expert-registration-meta";
import { loadExpertSpace } from "@/lib/expert/space-server";
import { eurosToCents } from "@/lib/entreprise/offer-conditions";
import { followUpLabel } from "@/lib/expert/care-client-fields";

function columnMissing(error: { message?: string } | null) {
  return /address_line|postal_code|city|follow_up|child_one|child_two|schema cache|column/i.test(error?.message ?? "");
}

export async function GET() {
  const gate = await requireCareExpert();
  if (!gate.ok) return gate.response;
  const { data, error } = await gate.db
    .from("expert_care_invoices")
    .select("id,client_id,amount_cents,designation,document_url,document_name,status,sent_at,created_at")
    .eq("expert_id", gate.expertId)
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: missingRelation(error) ? CARE_SQL_HINT : error.message, invoices: [] }, { status: missingRelation(error) ? 200 : 500 });
  }
  const services = await gate.db
    .from("care_services")
    .select("id, name, price_cents, active")
    .eq("expert_id", gate.expertId)
    .eq("active", true)
    .order("position");
  const prestations: CarePrestation[] = (services.data ?? []).map((row) => ({
    id: String(row.id),
    label: String(row.name ?? "Prestation"),
    cents: Number(row.price_cents) > 0 ? Number(row.price_cents) : null,
    builtin: false,
  }));
  const sessionPriceCents = prestations.find((item) => item.cents != null)?.cents ?? null;
  return NextResponse.json({
    invoices: data ?? [],
    sessionPriceCents,
    extras: CARE_INVOICE_EXTRAS,
    prestations,
  });
}

export async function POST(req: NextRequest) {
  const gate = await requireCareExpert();
  if (!gate.ok) return gate.response;
  const body = (await req.json().catch(() => null)) as {
    clientId?: string;
    amount?: string;
    sessionPrice?: string;
    extras?: string[];
    lines?: Array<{ id?: string; label?: string; amount?: string; cents?: number }>;
    designation?: string;
    address_line?: string;
    postal_code?: string;
    city?: string;
  } | null;
  const clientId = body?.clientId?.trim() ?? "";
  if (!clientId) return NextResponse.json({ error: "Membre CRM requis" }, { status: 400 });

  let clientQuery = await gate.db
    .from("expert_care_clients")
    .select("id,first_name,last_name,email,phone,address_line,postal_code,city,follow_up,child_one_first_name,child_one_last_name,child_two_first_name,child_two_last_name")
    .eq("id", clientId)
    .eq("expert_id", gate.expertId)
    .maybeSingle();
  if (clientQuery.error && columnMissing(clientQuery.error)) {
    clientQuery = await gate.db
      .from("expert_care_clients")
      .select("id,first_name,last_name,email,phone")
      .eq("id", clientId)
      .eq("expert_id", gate.expertId)
      .maybeSingle();
  }
  if (clientQuery.error) {
    return NextResponse.json({ error: missingRelation(clientQuery.error) ? CARE_SQL_HINT : clientQuery.error.message }, { status: 500 });
  }
  const client = clientQuery.data as {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string | null;
    address_line?: string | null;
    postal_code?: string | null;
    city?: string | null;
    follow_up?: string | null;
    child_one_first_name?: string | null;
    child_one_last_name?: string | null;
    child_two_first_name?: string | null;
    child_two_last_name?: string | null;
  } | null;
  if (!client) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });

  const addressLine = body?.address_line?.trim() || client.address_line?.trim() || "";
  const postalCode = body?.postal_code?.trim() || client.postal_code?.trim() || "";
  const city = body?.city?.trim() || client.city?.trim() || "";
  if (!addressLine || !postalCode || !city) {
    return NextResponse.json({ error: "Adresse postale du client requise (rue, code postal, ville)." }, { status: 400 });
  }

  const addressPatch = { address_line: addressLine, postal_code: postalCode, city };
  const patched = await gate.db.from("expert_care_clients").update(addressPatch).eq("id", client.id).eq("expert_id", gate.expertId);
  if (patched.error && !columnMissing(patched.error) && !missingRelation(patched.error)) {
    return NextResponse.json({ error: patched.error.message }, { status: 500 });
  }

  const expertRow = await gate.db.from("experts").select("references").eq("id", gate.expertId).maybeSingle();
  const meta = parseRegistrationMeta(expertRow.data?.references);
  const services = await gate.db
    .from("care_services")
    .select("id, name, price_cents, active")
    .eq("expert_id", gate.expertId)
    .eq("active", true);
  const catalog: CarePrestation[] = (services.data ?? []).map((row) => ({
    id: String(row.id),
    label: String(row.name ?? "Prestation"),
    cents: Number(row.price_cents) > 0 ? Number(row.price_cents) : null,
    builtin: false,
  }));
  const incomingLines = Array.isArray(body?.lines) ? body.lines : [];
  let lines: CareInvoiceLine[] = incomingLines
    .map((row) => {
      const fromCatalog = row.id ? catalog.find((item) => item.id === row.id) : null;
      const label = row.label?.trim() || fromCatalog?.label || "Prestation";
      const cents =
        typeof row.cents === "number" && Number.isFinite(row.cents)
          ? Math.max(0, Math.round(row.cents))
          : eurosToCents(String(row.amount ?? "")) ?? 0;
      return { label, cents };
    })
    .filter((line) => line.cents > 0);
  if (!lines.length) {
    const savedSession = catalog.find((item) => item.cents != null)?.cents ?? meta?.care_session_price_cents ?? 0;
    const incomingSession = eurosToCents(body?.sessionPrice ?? body?.amount ?? "");
    const sessionPriceCents = incomingSession ?? savedSession;
    if (incomingSession != null) {
      const references = mergeRegistrationMeta(expertRow.data?.references, { care_session_price_cents: incomingSession });
      await gate.db.from("experts").update({ references }).eq("id", gate.expertId);
    }
    const extraSlugs = Array.isArray(body?.extras) ? body.extras : [];
    const extras = CARE_INVOICE_EXTRAS.filter((item) => extraSlugs.includes(item.slug));
    lines = [
      { label: "Séance d'accompagnement", cents: sessionPriceCents },
      ...extras.map((item) => ({ label: item.label, cents: item.cents })),
    ].filter((line) => line.cents > 0);
  }
  if (!lines.length) {
    return NextResponse.json({ error: "Indiquez le prix de la séance ou un supplément." }, { status: 400 });
  }
  const amountCents = lines.reduce((sum, line) => sum + line.cents, 0);
  const designation = body?.designation?.trim() || lines.map((line) => line.label).join(" + ");
  const issuedAt = new Date();
  const invoiceNumber = `BYC-${issuedAt.toISOString().slice(0, 10).replaceAll("-", "")}-${client.id.slice(0, 6).toUpperCase()}`;
  const space = await loadExpertSpace();
  const session = await getSession();
  const billing = parseRegistrationMeta(expertRow.data?.references);
  const pdf = careInvoicePdfBuffer({
    invoiceNumber,
    issuedAt,
    expertName: space.profile.name,
    expertHeadline: space.profile.headline,
    expertEmail: session?.email ?? null,
    legalName: billing?.legal_name ?? null,
    siret: billing?.siret ?? null,
    vatLiable: billing?.vat_liable ?? false,
    clientFirstName: client.first_name,
    clientLastName: client.last_name,
    clientEmail: client.email,
    clientAddressLine: addressLine,
    clientPostalCode: postalCode,
    clientCity: city,
    followUpLabel: followUpLabel(client),
    lines,
    logoPng: await fetchCareLogoPng(),
  });
  const fullName = [client.first_name, client.last_name].filter(Boolean).join(" ").trim() || "client";
  const invoiceFile = `Facture ${fullName}.pdf`;
  const totalLabel = `${(amountCents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  const linesHtml = lines
    .map(
      (line) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #F0EEEC;">${line.label}</td><td style="padding:8px 0;border-bottom:1px solid #F0EEEC;text-align:right;font-weight:700;">${(line.cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</td></tr>`,
    )
    .join("");
  const first = String(client.first_name ?? "").trim();
  const mailed = await sendEmail({
    to: client.email,
    subject: `Votre facture Byound Care — ${designation}`,
    html: buildCareEmail({
      greeting: first ? `Bonjour ${first},` : "Bonjour,",
      title: "Votre facture est prête",
      bodyHtml: `<p style="margin:0 0 12px;">Votre expert Byound Care vous adresse la facture <strong>${invoiceNumber}</strong>.</p>
<p style="margin:0 0 12px;">${fullName}<br/>${addressLine}<br/>${postalCode} ${city}</p>
<table style="width:100%;border-collapse:collapse;font-size:15px;">${linesHtml}<tr><td style="padding-top:12px;font-weight:800;">Total</td><td style="padding-top:12px;text-align:right;font-weight:800;">${totalLabel}</td></tr></table>
<p style="margin:16px 0 0;">Le PDF est joint à ce message.</p>`,
    }),
    attachments: [{ filename: invoiceFile, content: pdf }],
  });

  const { data, error } = await gate.db
    .from("expert_care_invoices")
    .insert({
      expert_id: gate.expertId,
      client_id: client.id,
      amount_cents: amountCents,
      designation,
      document_name: invoiceFile,
      status: mailed.success ? "sent" : "draft",
      sent_at: mailed.success ? new Date().toISOString() : null,
    })
    .select("id")
    .single();
  if (error) {
    return NextResponse.json({ error: missingRelation(error) ? CARE_SQL_HINT : error.message, emailed: mailed.success }, { status: 500 });
  }
  return NextResponse.json({
    ok: true,
    id: data.id,
    emailed: mailed.success,
    emailError: mailed.success ? null : mailed.error,
  });
}
