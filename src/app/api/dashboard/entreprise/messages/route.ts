import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  EDGEBS_ORG_ID,
  isEdgebsDemoViewer,
} from "@/lib/entreprise/edgebs-demo-data";
import { listEdgebsDemoEmployees } from "@/lib/entreprise/edgebs-demo-enrich";
import {
  appendMemoryMessage,
  buildThreadsFromMessages,
  ensureMemorySeed,
  getEdgebsDemoSeedMessages,
  listMemoryMessages,
  type EntrepriseHrMessage,
  type HrMessageSenderRole,
} from "@/lib/entreprise/hr-messages";
import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type EmployeeLite = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  job_title?: string | null;
};

type OrgAccess = {
  userId: string;
  organizationId: string;
  viewer: { email: string | null; prenom: string | null; nom: string | null };
};

function isMissingTableError(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  const msg = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();
  return msg.includes("entreprise_hr_messages") || msg.includes("does not exist") || error.code === "42P01";
}

async function requireOrgAccess(): Promise<
  { ok: true; access: OrgAccess } | { ok: false; response: NextResponse }
> {
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) {
    return { ok: false, response: NextResponse.json({ error: access.error }, { status: access.status }) };
  }
  if ("superAdminPreview" in access && access.superAdminPreview) {
    return { ok: false, response: NextResponse.json({ error: "Organisation requise" }, { status: 400 }) };
  }
  if ("configurationRequired" in access && access.configurationRequired) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Organisation non configurée" }, { status: 400 }),
    };
  }
  return {
    ok: true,
    access: {
      userId: access.userId,
      organizationId: access.organizationId,
      viewer: access.viewer,
    },
  };
}

async function loadEmployees(orgId: string, viewerEmail: string | null): Promise<EmployeeLite[]> {
  const edgebsDemo = orgId === EDGEBS_ORG_ID && isEdgebsDemoViewer(viewerEmail);
  const service = getServiceRoleClient();

  let base: EmployeeLite[] = [];
  if (service) {
    const { data } = await service
      .from("employees")
      .select("id, first_name, last_name, job_title")
      .eq("company_id", orgId)
      .order("last_name", { ascending: true });
    base = (data ?? []) as EmployeeLite[];
  }

  if (edgebsDemo) {
    return listEdgebsDemoEmployees(base as Array<Record<string, unknown>>).map((e) => ({
      id: String(e.id),
      first_name: (e.first_name as string | null) ?? null,
      last_name: (e.last_name as string | null) ?? null,
      job_title: (e.job_title as string | null) ?? null,
    }));
  }

  return base;
}

async function loadMessages(
  orgId: string,
  viewerEmail: string | null,
): Promise<{ messages: EntrepriseHrMessage[]; source: "db" | "memory" }> {
  const edgebsDemo = orgId === EDGEBS_ORG_ID && isEdgebsDemoViewer(viewerEmail);
  const service = getServiceRoleClient();

  if (service) {
    const { data, error } = await service
      .from("entreprise_hr_messages")
      .select(
        "id, org_id, employee_id, employee_name, employee_job_title, sender_role, sender_user_id, content, created_at",
      )
      .eq("org_id", orgId)
      .order("created_at", { ascending: true });

    if (!error) {
      const rows = (data ?? []) as EntrepriseHrMessage[];
      if (rows.length === 0 && edgebsDemo) {
        const seed = getEdgebsDemoSeedMessages(orgId);
        const { error: seedError } = await service.from("entreprise_hr_messages").insert(seed);
        if (!seedError) return { messages: seed, source: "db" };
        // FK org may fail in demo — fall through to memory
      } else {
        return { messages: rows, source: "db" };
      }
    } else if (!isMissingTableError(error)) {
      console.error("[entreprise/messages] load", error);
    }
  }

  if (edgebsDemo) {
    ensureMemorySeed(orgId, getEdgebsDemoSeedMessages(orgId));
  }
  return { messages: listMemoryMessages(orgId), source: "memory" };
}

export async function GET(request: NextRequest) {
  const resolved = await requireOrgAccess();
  if (!resolved.ok) return resolved.response;
  const { access } = resolved;

  const employeeId = request.nextUrl.searchParams.get("employee_id")?.trim() || null;
  const employees = await loadEmployees(access.organizationId, access.viewer.email);
  const { messages, source } = await loadMessages(access.organizationId, access.viewer.email);

  if (employeeId) {
    return NextResponse.json({
      source,
      employee_id: employeeId,
      messages: messages.filter((m) => m.employee_id === employeeId),
    });
  }

  return NextResponse.json({
    source,
    threads: buildThreadsFromMessages(messages, employees),
    employees,
  });
}

export async function POST(request: NextRequest) {
  const resolved = await requireOrgAccess();
  if (!resolved.ok) return resolved.response;
  const { access } = resolved;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const employeeId = String(body.employee_id ?? "").trim();
  const content = String(body.content ?? "").trim();
  const senderRole = (String(body.sender_role ?? "rh").trim() || "rh") as HrMessageSenderRole;
  const employeeName = String(body.employee_name ?? "").trim() || null;
  const employeeJobTitle = String(body.employee_job_title ?? "").trim() || null;

  if (!employeeId || !content) {
    return NextResponse.json({ error: "Destinataire et message requis." }, { status: 400 });
  }
  if (senderRole !== "rh" && senderRole !== "employee") {
    return NextResponse.json({ error: "Rôle expéditeur invalide." }, { status: 400 });
  }

  const message: EntrepriseHrMessage = {
    id: randomUUID(),
    org_id: access.organizationId,
    employee_id: employeeId,
    employee_name: employeeName,
    employee_job_title: employeeJobTitle,
    sender_role: senderRole,
    sender_user_id: access.userId,
    content,
    created_at: new Date().toISOString(),
  };

  const service = getServiceRoleClient();
  if (service) {
    const { data, error } = await service
      .from("entreprise_hr_messages")
      .insert({
        id: message.id,
        org_id: message.org_id,
        employee_id: message.employee_id,
        employee_name: message.employee_name,
        employee_job_title: message.employee_job_title,
        sender_role: message.sender_role,
        sender_user_id: message.sender_user_id,
        content: message.content,
        created_at: message.created_at,
      })
      .select(
        "id, org_id, employee_id, employee_name, employee_job_title, sender_role, sender_user_id, content, created_at",
      )
      .single();

    if (!error && data) {
      return NextResponse.json({ message: data as EntrepriseHrMessage, source: "db" });
    }

    if (error && !isMissingTableError(error)) {
      // org FK / other — try memory for demo
      console.warn("[entreprise/messages] insert fallback:", error.message);
    }
  }

  const edgebsDemo =
    access.organizationId === EDGEBS_ORG_ID && isEdgebsDemoViewer(access.viewer.email);
  if (edgebsDemo) {
    ensureMemorySeed(access.organizationId, getEdgebsDemoSeedMessages(access.organizationId));
  }
  appendMemoryMessage(message);
  return NextResponse.json({ message, source: "memory" });
}
