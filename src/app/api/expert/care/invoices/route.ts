import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/resend-client";
import { CARE_SQL_HINT, missingRelation, requireCareExpert } from "@/lib/expert/care-auth";
import { loadExpertSpace } from "@/lib/expert/space-server";
import { eurosToCents } from "@/lib/entreprise/offer-conditions";
import { readFile } from "fs/promises";
import path from "path";

async function loadTemplateBuffer(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
}

async function sampleInvoice() {
  const space = await loadExpertSpace();
  const fromDocs =
    space.documents.find((doc) => doc.folder === "modele") ??
    space.documents.find((doc) => doc.folder === "facture" || /facture|exemple/i.test(doc.name));
  if (fromDocs?.url) {
    const buffer = await loadTemplateBuffer(fromDocs.url);
    return { url: fromDocs.url, name: fromDocs.name, buffer };
  }
  try {
    const filePath = path.join(process.cwd(), "public", "documents", "facture-exemple.pdf");
    const buffer = await readFile(filePath);
    return { url: "/documents/facture-exemple.pdf", name: "facture-exemple.pdf", buffer };
  } catch {
    return null;
  }
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
  return NextResponse.json({ invoices: data ?? [] });
}

export async function POST(req: NextRequest) {
  const gate = await requireCareExpert();
  if (!gate.ok) return gate.response;
  const body = (await req.json().catch(() => null)) as {
    clientId?: string;
    amount?: string;
    designation?: string;
  } | null;
  const clientId = body?.clientId?.trim() ?? "";
  if (!clientId) return NextResponse.json({ error: "Membre CRM requis" }, { status: 400 });
  const { data: client, error: clientError } = await gate.db
    .from("expert_care_clients")
    .select("id,first_name,last_name,email")
    .eq("id", clientId)
    .eq("expert_id", gate.expertId)
    .maybeSingle();
  if (clientError) return NextResponse.json({ error: missingRelation(clientError) ? CARE_SQL_HINT : clientError.message }, { status: 500 });
  if (!client) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });

  const amountCents = eurosToCents(body?.amount ?? "") ?? 0;
  const designation = body?.designation?.trim() || "Prestation Byound Care";
  const sample = await sampleInvoice();
  const invoiceFile = `Facture ${[client.first_name, client.last_name].filter(Boolean).join(" ").trim() || "client"}.pdf`;
  const attachments = sample?.buffer
    ? [{ filename: invoiceFile, content: sample.buffer }]
    : undefined;

  const mailed = await sendEmail({
    to: client.email,
    subject: `Facture — ${designation}`,
    html: `<p>Bonjour ${client.first_name || ""},</p><p>Veuillez trouver votre facture nominative : <strong>${designation}</strong>${amountCents > 0 ? ` (${(amountCents / 100).toLocaleString("fr-FR")} €)` : ""}.</p>${sample?.url && !sample.buffer ? `<p><a href="${sample.url}">Télécharger la facture</a></p>` : "<p>Le document est joint à cet e-mail.</p>"}`,
    attachments,
  });

  const { data, error } = await gate.db
    .from("expert_care_invoices")
    .insert({
      expert_id: gate.expertId,
      client_id: client.id,
      amount_cents: amountCents,
      designation,
      document_url: sample?.url ?? null,
      document_name: sample?.name ?? null,
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
    sampleMissing: !sample,
  });
}
