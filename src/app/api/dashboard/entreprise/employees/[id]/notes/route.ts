import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const HR_ADMIN_ROLES = new Set(["admin_hr", "rh", "admin", "entreprise", "super_admin"]);

const noteBodySchema = z.object({
  body: z.string().trim().min(1, "Note vide").max(4000, "Note trop longue"),
});

type Access = Awaited<ReturnType<typeof resolveEntrepriseOverviewAccess>>;

function isHrAdminRole(role: string, roleType: string) {
  if (role === "manager" || roleType === "manager") return false;
  return HR_ADMIN_ROLES.has(role) || HR_ADMIN_ROLES.has(roleType);
}

async function canManageNotes(
  access: Extract<Access, { ok: true }>,
  service: NonNullable<ReturnType<typeof getServiceRoleClient>>,
  companyId: string,
) {
  if ("organizationId" in access && access.organizationId && companyId && companyId !== access.organizationId) {
    return false;
  }
  if ("superAdminPreview" in access && access.superAdminPreview) return true;
  const { data } = await service.from("profiles").select("role, role_type").eq("id", access.userId).maybeSingle();
  const role = String(data?.role ?? "").toLowerCase();
  const roleType = String(data?.role_type ?? "").toLowerCase();
  return isHrAdminRole(role, roleType);
}

async function loadEmployee(service: NonNullable<ReturnType<typeof getServiceRoleClient>>, employeeId: string) {
  return service.from("employees").select("id, company_id").eq("id", employeeId).maybeSingle();
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: employeeId } = await context.params;
  if (!UUID_RE.test(employeeId)) {
    return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });
  }
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { data: employee, error: employeeError } = await loadEmployee(service, employeeId);
  if (employeeError || !employee) {
    return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });
  }
  const companyId = String((employee as { company_id?: string | null }).company_id ?? "");
  if ("organizationId" in access && access.organizationId && companyId && companyId !== access.organizationId) {
    return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });
  }
  if (!(await canManageNotes(access, service, companyId))) {
    return NextResponse.json({ notes: [], canManage: false });
  }

  const notesRes = await service
    .from("hr_notes")
    .select("id, body, author_id, created_at")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (notesRes.error) {
    if (/hr_notes|schema cache|relation|does not exist/i.test(notesRes.error.message)) {
      return NextResponse.json({ notes: [], canManage: true, unavailable: true });
    }
    return NextResponse.json({ error: notesRes.error.message }, { status: 400 });
  }

  const rows = notesRes.data ?? [];
  const authorIds = [...new Set(rows.map((row) => String(row.author_id ?? "")).filter(Boolean))];
  const names = new Map<string, string>();
  if (authorIds.length > 0) {
    const authors = await service.from("profiles").select("id, first_name, last_name, full_name").in("id", authorIds);
    for (const author of authors.data ?? []) {
      const full = String(author.full_name ?? "").trim();
      const built = [author.first_name, author.last_name].filter(Boolean).join(" ").trim();
      names.set(String(author.id), full || built || "Admin RH");
    }
  }

  return NextResponse.json({
    canManage: true,
    notes: rows.map((row) => ({
      id: String(row.id),
      body: String(row.body ?? ""),
      created_at: String(row.created_at ?? ""),
      author: names.get(String(row.author_id ?? "")) ?? "Admin RH",
    })),
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: employeeId } = await context.params;
  if (!UUID_RE.test(employeeId)) {
    return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });
  }
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const parsed = noteBodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Note invalide" }, { status: 400 });
  }

  const { data: employee, error: employeeError } = await loadEmployee(service, employeeId);
  if (employeeError || !employee) {
    return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });
  }
  const companyId = String((employee as { company_id?: string | null }).company_id ?? "");
  if ("organizationId" in access && access.organizationId && companyId && companyId !== access.organizationId) {
    return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 });
  }
  if (!(await canManageNotes(access, service, companyId))) {
    return NextResponse.json({ error: "Réservé aux admins RH" }, { status: 403 });
  }

  const { data, error } = await service
    .from("hr_notes")
    .insert({
      employee_id: employeeId,
      author_id: access.userId,
      body: parsed.data.body,
    })
    .select("id, body, author_id, created_at")
    .single();
  if (error) {
    if (/hr_notes|schema cache|relation|does not exist/i.test(error.message)) {
      return NextResponse.json(
        { error: "La table des notes RH n'existe pas encore. Collez le SQL hr_notes dans Supabase." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const author = await service.from("profiles").select("first_name, last_name, full_name").eq("id", access.userId).maybeSingle();
  const full = String(author.data?.full_name ?? "").trim();
  const built = [author.data?.first_name, author.data?.last_name].filter(Boolean).join(" ").trim();

  return NextResponse.json({
    note: {
      id: String(data.id),
      body: String(data.body ?? ""),
      created_at: String(data.created_at ?? ""),
      author: full || built || "Admin RH",
    },
  });
}
