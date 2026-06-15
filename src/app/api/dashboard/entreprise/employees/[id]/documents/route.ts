import { NextRequest, NextResponse } from "next/server";
import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const VALID_TYPES = new Set(["entretien_individuel", "bilan_annuel", "autre"]);

async function assertEmployeeAccess(employeeId: string) {
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) {
    return { error: NextResponse.json({ error: access.error }, { status: access.status }) };
  }
  if ("superAdminPreview" in access || "configurationRequired" in access) {
    return { error: NextResponse.json({ error: "Action non autorisée" }, { status: 400 }) };
  }
  const service = getServiceRoleClient();
  if (!service) {
    return { error: NextResponse.json({ error: "Service indisponible" }, { status: 503 }) };
  }
  const { data: employee } = await service
    .from("employees")
    .select("id")
    .eq("id", employeeId)
    .eq("company_id", access.organizationId)
    .maybeSingle();
  if (!employee) {
    return { error: NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 }) };
  }
  return { access, service, orgId: access.organizationId };
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: employeeId } = await context.params;
  const ctx = await assertEmployeeAccess(employeeId);
  if ("error" in ctx && ctx.error) return ctx.error;
  const { service, orgId } = ctx as { service: NonNullable<ReturnType<typeof getServiceRoleClient>>; orgId: string };

  const form = await request.formData();
  const document_type = String(form.get("document_type") ?? "").trim();
  const title = String(form.get("title") ?? "").trim();
  const document_date = String(form.get("document_date") ?? "").trim() || null;
  const notes = String(form.get("notes") ?? "").trim() || null;
  const file = form.get("file");

  if (!VALID_TYPES.has(document_type) || !title) {
    return NextResponse.json({ error: "Type et titre requis" }, { status: 400 });
  }

  let file_url: string | null = null;
  let file_name: string | null = null;

  if (file instanceof File && file.size > 0) {
    const ext = file.name.split(".").pop() ?? "bin";
    const path = `enterprise-hr/${orgId}/${employeeId}/${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadErr } = await service.storage.from("public").upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });
    if (uploadErr) {
      return NextResponse.json({ error: uploadErr.message }, { status: 400 });
    }
    const { data: pub } = service.storage.from("public").getPublicUrl(path);
    file_url = pub.publicUrl;
    file_name = file.name;
  }

  const { data, error } = await service
    .from("employee_hr_documents")
    .insert({
      employee_id: employeeId,
      organization_id: orgId,
      document_type,
      title,
      document_date,
      notes,
      file_url,
      file_name,
    })
    .select("id, document_type, title, document_date, notes, file_url, file_name, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ document: data });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: employeeId } = await context.params;
  const docId = request.nextUrl.searchParams.get("docId")?.trim();
  if (!docId) return NextResponse.json({ error: "docId requis" }, { status: 400 });

  const ctx = await assertEmployeeAccess(employeeId);
  if ("error" in ctx && ctx.error) return ctx.error;
  const { service, orgId } = ctx as { service: NonNullable<ReturnType<typeof getServiceRoleClient>>; orgId: string };

  const { error } = await service
    .from("employee_hr_documents")
    .delete()
    .eq("id", docId)
    .eq("employee_id", employeeId)
    .eq("organization_id", orgId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
