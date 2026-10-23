import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/resend-client";
import { getCollaboratorSignatureEmail } from "@/lib/emails/templates/collaborator-mail";
import { isEdgebsDemoEmployeeId } from "@/lib/entreprise/edgebs-demo-enrich";
import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";
import { publicAppUrl } from "@/lib/env";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: employeeId } = await context.params;
  if (isEdgebsDemoEmployeeId(employeeId) || !UUID_RE.test(employeeId)) {
    return NextResponse.json({ error: "Action non disponible sur un profil démo" }, { status: 400 });
  }

  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  if ("superAdminPreview" in access || "configurationRequired" in access) {
    return NextResponse.json({ error: "Action non autorisée" }, { status: 400 });
  }

  let body: { docId?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }
  const docId = String(body.docId ?? "");
  if (!UUID_RE.test(docId)) return NextResponse.json({ error: "Document requis" }, { status: 400 });

  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { data: employee } = await service
    .from("employees")
    .select("id, email, first_name")
    .eq("id", employeeId)
    .eq("company_id", access.organizationId)
    .maybeSingle();
  if (!employee) return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });
  const email = String(employee.email ?? "").trim();
  if (!email.includes("@")) {
    return NextResponse.json({ error: "Ce collaborateur n'a pas d'email" }, { status: 400 });
  }

  const { data: doc } = await service
    .from("employee_hr_documents")
    .select("id, title, notes")
    .eq("id", docId)
    .eq("employee_id", employeeId)
    .eq("organization_id", access.organizationId)
    .maybeSingle();
  if (!doc) return NextResponse.json({ error: "Entretien introuvable" }, { status: 404 });

  let details: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(String(doc.notes ?? ""));
    if (parsed && typeof parsed === "object") details = parsed as Record<string, unknown>;
  } catch {
    details = { extra_notes: String(doc.notes ?? "") };
  }
  const token = String(details.signature_token ?? "").trim() || crypto.randomUUID();
  details.signature_token = token;
  details.signature_requested_at = new Date().toISOString();

  const { error } = await service
    .from("employee_hr_documents")
    .update({ notes: JSON.stringify(details) })
    .eq("id", docId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data: org } = await service
    .from("organizations")
    .select("name")
    .eq("id", access.organizationId)
    .maybeSingle();

  const mail = getCollaboratorSignatureEmail({
    firstName: String(employee.first_name ?? ""),
    title: String(doc.title ?? "Entretien"),
    companyName: String(org?.name ?? "votre entreprise"),
    signLink: `${publicAppUrl()}/bilan/signer/${token}`,
  });
  const sent = await sendEmail({ to: email, subject: mail.subject, html: mail.html });
  if (!sent.success) {
    return NextResponse.json({ error: sent.error ?? "Envoi impossible" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
