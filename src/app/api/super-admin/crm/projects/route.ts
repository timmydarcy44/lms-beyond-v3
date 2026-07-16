import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { CRM_PROJECT_STAGES } from "@/lib/crm/projects-shared";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { data, error } = await supabase
    .from("crm_projects")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message, projects: [], stages: CRM_PROJECT_STAGES }, { status: 400 });
  }

  return NextResponse.json({ projects: data ?? [], stages: CRM_PROJECT_STAGES });
}

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const title = String(body?.title ?? "").trim();
  const stage_slug = String(body?.stage_slug ?? "projet_a_definir").trim();
  const topic_slug = String(body?.topic_slug ?? "commercial").trim();
  const description = body?.description ? String(body.description).trim() : null;
  const owner_email = body?.owner_email ? String(body.owner_email).trim() : null;

  if (!title) {
    return NextResponse.json({ error: "Titre requis" }, { status: 400 });
  }

  const { data: maxOrder } = await supabase
    .from("crm_projects")
    .select("sort_order")
    .eq("stage_slug", stage_slug)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("crm_projects")
    .insert({
      title,
      description,
      stage_slug,
      topic_slug,
      owner_email,
      sort_order: (maxOrder?.sort_order ?? -1) + 1,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ project: data });
}
