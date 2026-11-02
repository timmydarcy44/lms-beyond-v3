import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { buildActivityRow } from "@/lib/control/policy";
import { buildEmployeeInsertRow } from "@/lib/entreprise/employees-insert";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Row = { firstName?: string; lastName?: string; email?: string; jobTitle?: string; department?: string };

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user || !(await isSuperAdmin())) {
    return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const body = (await request.json().catch(() => ({}))) as { rows?: Row[] };
  const rows = (body.rows ?? []).slice(0, 200);
  const errors: Array<{ line: number; message: string }> = [];
  let created = 0;
  for (const [index, row] of rows.entries()) {
    const email = String(row.email ?? "").trim().toLowerCase();
    const firstName = String(row.firstName ?? "").trim();
    const lastName = String(row.lastName ?? "").trim();
    if (!email.includes("@") || !firstName || !lastName) {
      errors.push({ line: index + 1, message: "Prénom, nom et e-mail requis" });
      continue;
    }
    const inserted = await service.from("employees").insert(buildEmployeeInsertRow({
      company_id: id,
      first_name: firstName,
      last_name: lastName,
      email,
      job_title: row.jobTitle ?? null,
      department: row.department ?? null,
    })).select("id").single();
    if (inserted.error) errors.push({ line: index + 1, message: inserted.error.message });
    else created += 1;
  }
  await service.from("org_activity").insert(buildActivityRow({
    orgId: id,
    actorUserId: data.user.id,
    actorType: "byound_on_behalf",
    action: "import_collaborators",
    payload: { created, errors: errors.length },
  }));
  return NextResponse.json({ created, errors });
}
