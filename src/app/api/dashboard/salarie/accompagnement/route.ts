import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { sendEmail } from "@/lib/email/resend-client";
import { buildEdgeEmailShell, escapeEdgeEmailHtml } from "@/lib/emails/edge-email-shell";
import { EDGEBS_ORG_ID } from "@/lib/entreprise/edgebs-demo-data";
import { appendMemoryMessage, type EntrepriseHrMessage } from "@/lib/entreprise/hr-messages";
import { createSupabaseServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MANAGER_ROLES = new Set(["entreprise", "admin_hr", "rh", "manager", "admin"]);

function missingTable(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const msg = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();
  return error.code === "42P01" || error.code === "PGRST205" || msg.includes("does not exist") || msg.includes("accompagnement_requests");
}

export async function POST(request: NextRequest) {
  const auth = await createSupabaseServerClient();
  if (!auth) return NextResponse.json({ error: "Configuration manquante" }, { status: 500 });
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const payer = body.payer === "employer" ? "employer" : body.payer === "employee" ? "employee" : null;
  const practitionerName = String(body.practitionerName ?? "").trim();
  const practitionerTitle = String(body.practitionerTitle ?? "").trim();
  if (!payer || !practitionerName) {
    return NextResponse.json({ error: "Praticien et mode de règlement requis." }, { status: 400 });
  }

  const db = getServiceRoleClient() ?? auth;
  const { data: profile } = await db
    .from("profiles")
    .select("first_name, last_name, email, company_id, poste_actuel")
    .eq("id", user.id)
    .maybeSingle();

  const email = user.email ?? profile?.email ?? null;
  const firstName = String(profile?.first_name ?? "").trim();
  const lastName = String(profile?.last_name ?? "").trim();
  const employeeName = [firstName, lastName].filter(Boolean).join(" ") || email || "Collaborateur";
  const jade = isJadeDemoEmail(email);
  const companyId = jade ? EDGEBS_ORG_ID : String(profile?.company_id ?? "").trim();

  if (payer === "employer" && !companyId) {
    return NextResponse.json(
      { error: "Aucune entreprise n'est rattachée à votre compte." },
      { status: 400 },
    );
  }

  const requestId = randomUUID();
  if (db && companyId) {
    const { error } = await db.from("accompagnement_requests").insert({
      id: requestId,
      organization_id: companyId,
      employee_user_id: user.id,
      employee_name: employeeName,
      practitioner_name: practitionerName,
      practitioner_title: practitionerTitle || null,
      payer,
      status: payer === "employer" ? "pending_employer" : "employee_pays",
    });
    if (error && !missingTable(error)) {
      console.warn("[accompagnement] insert", error.message);
    }
  }

  if (payer === "employee") {
    return NextResponse.json({
      ok: true,
      payer,
      message: "La séance est à votre charge. Le praticien vous confirme le règlement.",
    });
  }

  const content = `${employeeName} demande une prise en charge employeur pour un accompagnement individuel avec ${practitionerName}${practitionerTitle ? ` (${practitionerTitle})` : ""}.`;

  const hrMessage: EntrepriseHrMessage = {
    id: randomUUID(),
    org_id: companyId,
    employee_id: user.id,
    employee_name: employeeName,
    employee_job_title: String(profile?.poste_actuel ?? "Collaborateur"),
    sender_role: "employee",
    sender_user_id: user.id,
    content,
    created_at: new Date().toISOString(),
  };

  if (db) {
    const { error } = await db.from("entreprise_hr_messages").insert(hrMessage);
    if (error) appendMemoryMessage(hrMessage);
  } else {
    appendMemoryMessage(hrMessage);
  }

  const { data: managers } = companyId
    ? await db
        .from("profiles")
        .select("id, email, role, role_type")
        .eq("company_id", companyId)
        .limit(40)
    : { data: [] };

  const hrRows = (managers ?? []).filter((row) => {
    const role = String(row.role ?? "").toLowerCase();
    const roleType = String(row.role_type ?? "").toLowerCase();
    return MANAGER_ROLES.has(role) || MANAGER_ROLES.has(roleType);
  });

  const hrEmails = Array.from(
    new Set(
      hrRows
        .map((row) => String(row.email ?? "").trim().toLowerCase())
        .filter((value) => value.includes("@")),
    ),
  );
  const html = buildEdgeEmailShell({
    title: "Demande de prise en charge",
    preheader: `${employeeName} — ${practitionerName}`,
    bodyHtml: `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4A4A4A;">${escapeEdgeEmailHtml(content)}</p>
      <p style="margin:0;font-size:14px;color:#4A4A4A;">Retrouvez la demande dans Messages, sur le dashboard entreprise.</p>`,
    footerNote: "Demande envoyée depuis l'espace salarié.",
  });

  await sendEmail({
    to: hrEmails.length ? hrEmails : "contact@byound.fr",
    from: EDGE_COCKPIT_FROM,
    subject: `[Byound] Prise en charge — ${employeeName}`,
    html,
    tags: { type: "accompagnement-prise-en-charge" },
  });

  if (db && hrRows.length) {
    await db.from("notifications").insert(
      hrRows.map((row) => ({
        user_id: row.id,
        type: "info",
        title: "Prise en charge d'accompagnement",
        message: content,
        metadata: { request_id: requestId, practitioner: practitionerName },
        read: false,
      })),
    );
  }

  return NextResponse.json({
    ok: true,
    payer,
    message: "La demande est partie à votre entreprise. Le service RH la voit dans Messages.",
  });
}
